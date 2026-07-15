import db, { files } from "@/infrastructure/db";
import { eq } from "drizzle-orm";

export type PermanentlyDeleteFileResult =
  | { success: true; data: { id: string; diskName: string } }
  | {
      success: false;
      code: "FILE_NOT_FOUND" | "FILE_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function permanentlyDeleteFile(
  id: string,
): Promise<PermanentlyDeleteFileResult> {
  try {
    const file = await db.query.files.findFirst({
      where: { id },
      columns: {
        id: true,
        diskName: true,
        deletedAt: true,
      },
    });

    if (!file) {
      return { success: false, code: "FILE_NOT_FOUND" };
    }

    if (file.deletedAt === null) {
      return { success: false, code: "FILE_NOT_IN_TRASH" };
    }

    const [deletedFile] = await db
      .delete(files)
      .where(eq(files.id, id))
      .returning({
        id: files.id,
        diskName: files.diskName,
      });

    if (!deletedFile) {
      return { success: false, code: "DATABASE_ERROR" };
    }

    return { success: true, data: deletedFile };
  } catch (error) {
    console.error("Error permanently deleting file:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
