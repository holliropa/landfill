import db, { files, folders } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export type PermanentlyDeleteFolderResult =
  | { success: true; data: { affectedFiles: { id: string; diskName: string }[] } }
  | {
      success: false;
      code: "FOLDER_NOT_FOUND" | "FOLDER_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function permanentlyDeleteFolder(
  id: string,
): Promise<PermanentlyDeleteFolderResult> {
  try {
    const folder = await db.query.folders.findFirst({
      where: { id },
      columns: {
        id: true,
        deletedAt: true,
      },
    });

    if (!folder) {
      return { success: false, code: "FOLDER_NOT_FOUND" };
    }

    if (folder.deletedAt === null) {
      return { success: false, code: "FOLDER_NOT_IN_TRASH" };
    }

    const subtreeIds = await collectSubtreeIds(id);
    const affectedFiles = await db
      .select({
        id: files.id,
        diskName: files.diskName,
      })
      .from(files)
      .where(inArray(files.folderId, subtreeIds));

    db.transaction((tx) => {
      tx.delete(files).where(inArray(files.folderId, subtreeIds)).run();
      tx.delete(folders).where(inArray(folders.id, subtreeIds)).run();
    });

    return { success: true, data: { affectedFiles } };
  } catch (error) {
    console.error("Error permanently deleting folder:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

async function collectSubtreeIds(folderId: string) {
  const result: string[] = [];
  const queue: string[] = [folderId];

  while (queue.length > 0) {
    const currentFolderId = queue.shift();
    if (!currentFolderId) continue;

    result.push(currentFolderId);

    const children = await db
      .select({ id: folders.id })
      .from(folders)
      .where(eq(folders.parentFolderId, currentFolderId));

    children.forEach((child) => queue.push(child.id));
  }

  return result;
}
