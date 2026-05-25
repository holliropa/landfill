import db, { files, folders } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export type DeleteFolderResult =
  | {
      success: true;
      data: { affectedFiles: { id: string; diskName: string }[] };
    }
  | { success: false; code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" };

export async function deleteFolder(id: string): Promise<DeleteFolderResult> {
  const collectSubtreeIds = async (folderId: string) => {
    const result: string[] = [];
    const queue: string[] = [folderId];

    while (queue.length > 0) {
      const currentFolderId = queue.shift();
      if (!currentFolderId) continue;

      result.push(currentFolderId);

      const children = await db
        .select({
          id: folders.id,
        })
        .from(folders)
        .where(eq(folders.parentFolderId, currentFolderId));

      children.forEach((child) => queue.push(child.id));
    }

    return result;
  };

  try {
    const folder = await db.query.folders.findFirst({
      where: { id },
      columns: {
        id: true,
        name: true,
      },
    });

    if (!folder) {
      return { success: false, code: "FOLDER_NOT_FOUND" };
    }

    const subtreeIds = await collectSubtreeIds(id);

    const filesToDelete = await db
      .select({
        id: files.id,
        diskName: files.diskName,
      })
      .from(files)
      .where(inArray(files.folderId, subtreeIds));

    db.transaction((tx) => {
      tx.delete(folders).where(inArray(folders.id, subtreeIds)).run();

      tx.delete(files).where(inArray(files.folderId, subtreeIds)).run();
    });

    return { success: true, data: { affectedFiles: filesToDelete } };
  } catch (error) {
    console.error("Error deleting folder and files:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
