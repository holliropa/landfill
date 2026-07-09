import db, { files, folders } from "@/lib/db";
import { inArray, isNotNull, or } from "drizzle-orm";

export type EmptyTrashResult =
  | {
      success: true;
      data: { affectedFiles: { id: string; diskName: string }[] };
    }
  | { success: false; code: "DATABASE_ERROR" };

export async function emptyTrash(): Promise<EmptyTrashResult> {
  try {
    const allFolders = await db.query.folders.findMany({
      columns: {
        id: true,
        parentFolderId: true,
        deletedAt: true,
      },
    });

    const deletedFolderIds = collectDeletedSubtreeIds(allFolders);
    const allFiles = await db.query.files.findMany({
      columns: {
        id: true,
        diskName: true,
        folderId: true,
        deletedAt: true,
      },
    });

    const affectedFiles = allFiles
      .filter(
        (file) =>
          file.deletedAt !== null ||
          (file.folderId !== null && deletedFolderIds.includes(file.folderId)),
      )
      .map(({ id, diskName }) => ({ id, diskName }));

    db.transaction((tx) => {
      if (deletedFolderIds.length > 0) {
        tx.delete(files)
          .where(
            or(
              isNotNull(files.deletedAt),
              inArray(files.folderId, deletedFolderIds),
            ),
          )
          .run();
      } else {
        tx.delete(files).where(isNotNull(files.deletedAt)).run();
      }

      tx.delete(folders).where(isNotNull(folders.deletedAt)).run();
    });

    return { success: true, data: { affectedFiles } };
  } catch (error) {
    console.error("Error emptying trash:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

type FolderRow = {
  id: string;
  parentFolderId: string | null;
  deletedAt: Date | null;
};

function collectDeletedSubtreeIds(foldersList: FolderRow[]) {
  const childIdsByParentId = new Map<string, string[]>();

  for (const folder of foldersList) {
    if (folder.parentFolderId === null) continue;

    const childIds = childIdsByParentId.get(folder.parentFolderId) ?? [];
    childIds.push(folder.id);
    childIdsByParentId.set(folder.parentFolderId, childIds);
  }

  const result = new Set<string>();
  const queue = foldersList
    .filter((folder) => folder.deletedAt !== null)
    .map((folder) => folder.id);

  while (queue.length > 0) {
    const folderId = queue.shift();
    if (!folderId || result.has(folderId)) continue;

    result.add(folderId);
    queue.push(...(childIdsByParentId.get(folderId) ?? []));
  }

  return Array.from(result);
}
