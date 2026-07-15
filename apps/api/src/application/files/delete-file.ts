import db, { files } from "@/infrastructure/db";
import { and, eq, isNull } from "drizzle-orm";

export type DeleteFileResult =
  | { success: true; data: { id: string; diskName: string } }
  | {
      success: false;
      code: "FILE_NOT_FOUND" | "DATABASE_ERROR" | "FILE_IN_TRASH";
    };

export async function deleteFile(id: string): Promise<DeleteFileResult> {
  const file = await db.query.files.findFirst({
    where: { id },
    columns: {
      id: true,
      deletedAt: true,
    },
  });

  if (!file) {
    return { success: false, code: "FILE_NOT_FOUND" };
  }

  if (file.deletedAt !== null) {
    return { success: false, code: "FILE_IN_TRASH" };
  }

  const [deletedFile] = await db
    .update(files)
    .set({ deletedAt: new Date() })
    .where(and(eq(files.id, id), isNull(files.deletedAt)))
    .returning({
      id: files.id,
      diskName: files.diskName,
    });

  if (!deletedFile) {
    return { success: false, code: "DATABASE_ERROR" };
  }

  return { success: true, data: deletedFile };
}
