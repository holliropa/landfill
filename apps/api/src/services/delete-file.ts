import db, { files } from "@/lib/db";
import { eq } from "drizzle-orm";

export type DeleteFileResult =
  | { success: true; data: { id: string; diskName: string } }
  | {
      success: false;
      code: "FILE_NOT_FOUND" | "DATABASE_ERROR";
    };

export async function deleteFile(id: string): Promise<DeleteFileResult> {
  const file = await db.query.files.findFirst({
    where: { id },
    columns: {
      id: true,
      diskName: true,
    },
  });

  if (!file) {
    return { success: false, code: "FILE_NOT_FOUND" };
  }

  const result = await db.delete(files).where(eq(files.id, id));

  if (result.changes === 0) {
    return { success: false, code: "DATABASE_ERROR" };
  }

  return { success: true, data: file };
}
