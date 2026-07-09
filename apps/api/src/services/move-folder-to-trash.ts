import db, { folders } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";

export type MoveToTrashResult =
  | { success: true; data: { id: string; name: string } }
  | {
      success: false;
      code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" | "FOLDER_IN_TRASH";
    };

export async function moveFolderToTrash(
  id: string,
): Promise<MoveToTrashResult> {
  try {
    const [folder] = await db
      .select({
        id: folders.id,
        name: folders.name,
        deletedAt: folders.deletedAt,
      })
      .from(folders)
      .where(eq(folders.id, id))
      .limit(1);

    if (!folder) return { success: false, code: "FOLDER_NOT_FOUND" };

    if (folder.deletedAt !== null) {
      return { success: false, code: "FOLDER_IN_TRASH" };
    }

    const [deletedFolder] = await db
      .update(folders)
      .set({ deletedAt: new Date() })
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)))
      .returning({
        id: folders.id,
        name: folders.name,
      });

    if (!deletedFolder) {
      return { success: false, code: "DATABASE_ERROR" };
    }

    return { success: true, data: deletedFolder };
  } catch (error) {
    console.error("Error moving folder to trash:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
