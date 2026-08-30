import db, { files, folders } from "@/infrastructure/db";
import { and, eq, inArray, isNull } from "drizzle-orm";

export type StorageItemReference = {
  kind: "file" | "folder";
  id: string;
};

export type MoveItemsConflict = StorageItemReference & {
  name: string;
};

export type MoveItemsResult =
  | {
      success: true;
      data: {
        moved: StorageItemReference[];
        destinationFolderId: string;
      };
    }
  | {
      success: false;
      code:
        | "DESTINATION_NOT_FOUND"
        | "ITEM_NOT_FOUND"
        | "INVALID_DESTINATION"
        | "NAME_CONFLICT"
        | "DATABASE_ERROR";
      conflicts?: MoveItemsConflict[];
    };

export function moveItems(
  items: StorageItemReference[],
  destinationFolderId: string | null,
): MoveItemsResult {
  try {
    return db.transaction((tx) => {
      const allFolders = tx
        .select({
          id: folders.id,
          name: folders.name,
          parentFolderId: folders.parentFolderId,
          deletedAt: folders.deletedAt,
        })
        .from(folders)
        .all();
      const folderById = new Map(
        allFolders.map((folder) => [folder.id, folder]),
      );

      const isActiveFolder = (folderId: string | null) => {
        const visited = new Set<string>();
        let currentFolderId = folderId;

        while (currentFolderId !== null) {
          if (visited.has(currentFolderId)) return false;
          visited.add(currentFolderId);

          const folder = folderById.get(currentFolderId);
          if (!folder || folder.deletedAt !== null) return false;
          currentFolderId = folder.parentFolderId;
        }

        return true;
      };

      if (
        destinationFolderId !== null &&
        !isActiveFolder(destinationFolderId)
      ) {
        return { success: false, code: "DESTINATION_NOT_FOUND" };
      }

      const requestedFolderIds = items
        .filter((item) => item.kind === "folder")
        .map((item) => item.id);
      const requestedFileIds = items
        .filter((item) => item.kind === "file")
        .map((item) => item.id);
      const requestedFolderIdSet = new Set(requestedFolderIds);

      const selectedFolders = requestedFolderIds.map((id) =>
        folderById.get(id),
      );
      if (
        selectedFolders.some((folder) => !folder || !isActiveFolder(folder.id))
      ) {
        return { success: false, code: "ITEM_NOT_FOUND" };
      }

      const selectedFiles =
        requestedFileIds.length === 0
          ? []
          : tx
              .select({
                id: files.id,
                name: files.originalName,
                folderId: files.folderId,
                deletedAt: files.deletedAt,
              })
              .from(files)
              .where(inArray(files.id, requestedFileIds))
              .all();
      const selectedFileById = new Map(
        selectedFiles.map((file) => [file.id, file]),
      );

      if (
        requestedFileIds.some((id) => {
          const file = selectedFileById.get(id);
          return (
            !file || file.deletedAt !== null || !isActiveFolder(file.folderId)
          );
        })
      ) {
        return { success: false, code: "ITEM_NOT_FOUND" };
      }

      const hasSelectedAncestor = (parentFolderId: string | null) => {
        const visited = new Set<string>();
        let currentFolderId = parentFolderId;

        while (currentFolderId !== null) {
          if (requestedFolderIdSet.has(currentFolderId)) return true;
          if (visited.has(currentFolderId)) return false;
          visited.add(currentFolderId);
          currentFolderId =
            folderById.get(currentFolderId)?.parentFolderId ?? null;
        }

        return false;
      };

      // A selected child travels with its selected ancestor. Updating it as a
      // separate root would unexpectedly flatten the hierarchy.
      const rootFolders = selectedFolders.filter(
        (folder): folder is NonNullable<typeof folder> =>
          folder !== undefined && !hasSelectedAncestor(folder.parentFolderId),
      );
      const rootFiles = selectedFiles.filter(
        (file) => !hasSelectedAncestor(file.folderId),
      );

      const destinationAncestors = new Set<string>();
      let ancestorId = destinationFolderId;
      while (ancestorId !== null) {
        destinationAncestors.add(ancestorId);
        ancestorId = folderById.get(ancestorId)?.parentFolderId ?? null;
      }

      if (rootFolders.some((folder) => destinationAncestors.has(folder.id))) {
        return { success: false, code: "INVALID_DESTINATION" };
      }

      const foldersToMove = rootFolders.filter(
        (folder) => folder.parentFolderId !== destinationFolderId,
      );
      const filesToMove = rootFiles.filter(
        (file) => file.folderId !== destinationFolderId,
      );

      const destinationFolders = allFolders.filter(
        (folder) =>
          folder.parentFolderId === destinationFolderId &&
          folder.deletedAt === null,
      );
      const destinationFiles = tx
        .select({
          id: files.id,
          name: files.originalName,
          folderId: files.folderId,
          deletedAt: files.deletedAt,
        })
        .from(files)
        .where(
          and(
            destinationFolderId === null
              ? isNull(files.folderId)
              : eq(files.folderId, destinationFolderId),
            isNull(files.deletedAt),
          ),
        )
        .all();

      const conflicts: MoveItemsConflict[] = [];
      collectConflicts(
        foldersToMove.map((folder) => ({
          kind: "folder" as const,
          id: folder.id,
          name: folder.name,
        })),
        destinationFolders.map((folder) => folder.name),
        conflicts,
      );
      collectConflicts(
        filesToMove.map((file) => ({
          kind: "file" as const,
          id: file.id,
          name: file.name,
        })),
        destinationFiles.map((file) => file.name),
        conflicts,
      );

      if (conflicts.length > 0) {
        return { success: false, code: "NAME_CONFLICT", conflicts };
      }

      if (foldersToMove.length > 0) {
        tx.update(folders)
          .set({ parentFolderId: destinationFolderId })
          .where(
            inArray(
              folders.id,
              foldersToMove.map((folder) => folder.id),
            ),
          )
          .run();
      }
      if (filesToMove.length > 0) {
        tx.update(files)
          .set({ folderId: destinationFolderId })
          .where(
            inArray(
              files.id,
              filesToMove.map((file) => file.id),
            ),
          )
          .run();
      }

      return {
        success: true,
        data: {
          moved: [
            ...foldersToMove.map((folder) => ({
              kind: "folder" as const,
              id: folder.id,
            })),
            ...filesToMove.map((file) => ({
              kind: "file" as const,
              id: file.id,
            })),
          ],
          destinationFolderId: destinationFolderId ?? "root",
        },
      };
    });
  } catch (error) {
    console.error("Error moving storage items:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

function collectConflicts(
  movingItems: MoveItemsConflict[],
  existingNames: string[],
  conflicts: MoveItemsConflict[],
) {
  const nameCounts = new Map<string, number>();
  for (const item of movingItems) {
    nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1);
  }
  const existingNameSet = new Set(existingNames);

  for (const item of movingItems) {
    if (
      existingNameSet.has(item.name) ||
      (nameCounts.get(item.name) ?? 0) > 1
    ) {
      conflicts.push(item);
    }
  }
}
