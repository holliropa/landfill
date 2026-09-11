import db, { storageBlobs, storageEntries } from "@/infrastructure/db";
import {
  getAvailableFileName,
  getAvailableFolderName,
  normalizeFileNameKey,
} from "@/domain/storage/available-name";
import { isFolderInActiveTree } from "./trash-visibility";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export type ManagedTreeFile = {
  relativePath: string;
  diskName: string;
  size: number;
  mimeType: string;
};

export type ImportFileTreeResult =
  | {
      success: true;
      data: {
        folderId: string;
        folderName: string;
        fileCount: number;
        directoryCount: number;
        totalSize: number;
      };
    }
  | {
      success: false;
      code: "DESTINATION_NOT_FOUND" | "DATABASE_ERROR";
    };

/**
 * Public Drive-core write boundary used by importers such as Archive Lab.
 * Every supplied disk file must already live in managed upload storage. The
 * caller retains cleanup ownership unless this operation succeeds.
 */
export async function importFileTree(params: {
  suggestedRootName: string;
  destinationFolderId: string;
  directoryPaths: string[];
  files: ManagedTreeFile[];
}): Promise<ImportFileTreeResult> {
  const destinationFolderId =
    params.destinationFolderId === "root" ? null : params.destinationFolderId;

  if (
    destinationFolderId !== null &&
    !(await isFolderInActiveTree(destinationFolderId))
  ) {
    return { success: false, code: "DESTINATION_NOT_FOUND" };
  }

  try {
    return db.transaction((tx) => {
      if (destinationFolderId !== null) {
        const [destination] = tx
          .select({ id: storageEntries.id })
          .from(storageEntries)
          .where(
            and(
              eq(storageEntries.id, destinationFolderId),
              eq(storageEntries.kind, "folder"),
              isNull(storageEntries.deletedAt),
            ),
          )
          .limit(1)
          .all();
        if (!destination) {
          return { success: false, code: "DESTINATION_NOT_FOUND" } as const;
        }
      }

      const siblingFolders = tx
        .select({ name: storageEntries.name })
        .from(storageEntries)
        .where(
          and(
            eq(storageEntries.kind, "folder"),
            destinationFolderId === null
              ? isNull(storageEntries.parentId)
              : eq(storageEntries.parentId, destinationFolderId),
            isNull(storageEntries.deletedAt),
          ),
        )
        .all();
      const folderName = getAvailableFolderName(
        params.suggestedRootName,
        new Set(siblingFolders.map((folder) => folder.name)),
      );
      const rootFolderId = randomUUID();
      tx.insert(storageEntries)
        .values({
          id: rootFolderId,
          kind: "folder",
          name: folderName,
          parentId: destinationFolderId,
        })
        .run();

      const directoryPaths = normalizeDirectoryPaths(params.directoryPaths);
      const folderIdByPath = new Map<string, string>();
      for (const directoryPath of directoryPaths) {
        const id = randomUUID();
        const parentPath = getParentPath(directoryPath);
        tx.insert(storageEntries)
          .values({
            id,
            kind: "folder",
            name: getPathName(directoryPath),
            parentId: parentPath
              ? folderIdByPath.get(parentPath)!
              : rootFolderId,
          })
          .run();
        folderIdByPath.set(directoryPath, id);
      }

      const usedNamesByFolder = new Map<string, Set<string>>();
      for (const file of params.files) {
        const parentPath = getParentPath(file.relativePath);
        const parentId = parentPath
          ? folderIdByPath.get(parentPath)!
          : rootFolderId;
        const usedNames = usedNamesByFolder.get(parentId) ?? new Set<string>();
        usedNamesByFolder.set(parentId, usedNames);
        const name = getAvailableFileName(
          getPathName(file.relativePath),
          usedNames,
        );
        const blobId = randomUUID();

        tx.insert(storageBlobs)
          .values({
            id: blobId,
            diskName: file.diskName,
            size: file.size,
            mimeType: file.mimeType,
          })
          .run();
        tx.insert(storageEntries)
          .values({
            kind: "file",
            name,
            parentId,
            blobId,
          })
          .run();
        usedNames.add(normalizeFileNameKey(name));
      }

      return {
        success: true,
        data: {
          folderId: rootFolderId,
          folderName,
          fileCount: params.files.length,
          directoryCount: directoryPaths.length,
          totalSize: params.files.reduce((total, file) => total + file.size, 0),
        },
      } as const;
    });
  } catch (error) {
    console.error("Could not import file tree:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

function normalizeDirectoryPaths(paths: string[]) {
  const expanded = new Set<string>();
  for (const path of paths) {
    let current = path;
    while (current) {
      expanded.add(current);
      current = getParentPath(current);
    }
  }

  return [...expanded].sort((left, right) => {
    const depthDifference = left.split("/").length - right.split("/").length;
    return depthDifference || left.localeCompare(right);
  });
}

function getParentPath(path: string) {
  const separatorIndex = path.lastIndexOf("/");
  return separatorIndex < 0 ? "" : path.slice(0, separatorIndex);
}

function getPathName(path: string) {
  return path.slice(path.lastIndexOf("/") + 1);
}
