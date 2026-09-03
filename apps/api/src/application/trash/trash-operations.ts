import db, { storageBlobs, storageEntries } from "@/infrastructure/db";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import {
  getAvailableFileName,
  getAvailableFolderName,
  normalizeFileNameKey,
} from "@/domain/storage/available-name";
import type { StorageEntryKind } from "@/application/storage/entry-operations";

type TrashOperationError = "NOT_FOUND" | "NOT_IN_TRASH" | "DATABASE_ERROR";
type RestoreEntryResult =
  | { success: true; data: { id: string; parentId: string | null } }
  | { success: false; code: TrashOperationError };
type PermanentDeleteEntryResult =
  | {
      success: true;
      data: { affectedFiles: { id: string; diskName: string }[] };
    }
  | { success: false; code: TrashOperationError };
type EmptyTrashResult =
  | {
      success: true;
      data: { affectedFiles: { id: string; diskName: string }[] };
    }
  | { success: false; code: "DATABASE_ERROR" };

export async function restoreEntryFromTrash(
  id: string,
  kind: StorageEntryKind,
): Promise<RestoreEntryResult> {
  try {
    return db.transaction((tx) => {
      const [entry] = tx
        .select({
          id: storageEntries.id,
          name: storageEntries.name,
          parentId: storageEntries.parentId,
          deletedAt: storageEntries.deletedAt,
        })
        .from(storageEntries)
        .where(and(eq(storageEntries.id, id), eq(storageEntries.kind, kind)))
        .limit(1)
        .all();

      if (!entry) {
        return { success: false, code: "NOT_FOUND" as TrashOperationError };
      }
      if (entry.deletedAt === null) {
        return {
          success: false,
          code: "NOT_IN_TRASH" as TrashOperationError,
        };
      }

      let targetParentId = entry.parentId;
      let currentId = targetParentId;
      const visited = new Set<string>();
      while (currentId !== null) {
        if (visited.has(currentId)) {
          targetParentId = null;
          break;
        }
        visited.add(currentId);

        const [parent] = tx
          .select({
            kind: storageEntries.kind,
            parentId: storageEntries.parentId,
            deletedAt: storageEntries.deletedAt,
          })
          .from(storageEntries)
          .where(eq(storageEntries.id, currentId))
          .limit(1)
          .all();

        if (!parent || parent.kind !== "folder" || parent.deletedAt !== null) {
          targetParentId = null;
          break;
        }
        currentId = parent.parentId;
      }

      const siblings = tx
        .select({ name: storageEntries.name })
        .from(storageEntries)
        .where(
          and(
            eq(storageEntries.kind, kind),
            targetParentId === null
              ? isNull(storageEntries.parentId)
              : eq(storageEntries.parentId, targetParentId),
            isNull(storageEntries.deletedAt),
          ),
        )
        .all();
      const restoredName =
        kind === "file"
          ? getAvailableFileName(
              entry.name,
              new Set(
                siblings.map((sibling) => normalizeFileNameKey(sibling.name)),
              ),
            )
          : getAvailableFolderName(
              entry.name,
              new Set(siblings.map((sibling) => sibling.name)),
            );

      const [restoredEntry] = tx
        .update(storageEntries)
        .set({ name: restoredName, parentId: targetParentId, deletedAt: null })
        .where(
          and(
            eq(storageEntries.id, id),
            eq(storageEntries.kind, kind),
            isNotNull(storageEntries.deletedAt),
          ),
        )
        .returning({
          id: storageEntries.id,
          parentId: storageEntries.parentId,
        })
        .all();

      if (!restoredEntry) {
        return {
          success: false,
          code: "DATABASE_ERROR" as TrashOperationError,
        };
      }
      return { success: true, data: restoredEntry } as const;
    });
  } catch (error) {
    console.error(`Error restoring ${kind} from trash:`, error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

export async function permanentlyDeleteEntry(
  id: string,
  kind: StorageEntryKind,
): Promise<PermanentDeleteEntryResult> {
  try {
    const entry = await db.query.storageEntries.findFirst({
      where: { id, kind },
      columns: { id: true, deletedAt: true },
    });
    if (!entry) {
      return { success: false, code: "NOT_FOUND" as TrashOperationError };
    }
    if (entry.deletedAt === null) {
      return {
        success: false,
        code: "NOT_IN_TRASH" as TrashOperationError,
      };
    }

    const entries = await db.query.storageEntries.findMany({
      columns: { id: true, parentId: true, kind: true, blobId: true },
      with: { blob: { columns: { diskName: true } } },
    });
    const affectedIds =
      kind === "folder" ? collectSubtreeIds(entries, id) : new Set([id]);
    const affectedFiles = entries.flatMap((candidate) =>
      affectedIds.has(candidate.id) &&
      candidate.kind === "file" &&
      candidate.blob
        ? [
            {
              id: candidate.id,
              blobId: candidate.blobId!,
              diskName: candidate.blob.diskName,
            },
          ]
        : [],
    );

    db.transaction((tx) => {
      tx.delete(storageEntries).where(eq(storageEntries.id, id)).run();
      if (affectedFiles.length > 0) {
        tx.delete(storageBlobs)
          .where(
            inArray(
              storageBlobs.id,
              affectedFiles.map((file) => file.blobId),
            ),
          )
          .run();
      }
    });

    return {
      success: true,
      data: {
        affectedFiles: affectedFiles.map(({ id: fileId, diskName }) => ({
          id: fileId,
          diskName,
        })),
      },
    } as const;
  } catch (error) {
    console.error(`Error permanently deleting ${kind}:`, error);
    return { success: false, code: "DATABASE_ERROR" as TrashOperationError };
  }
}

export async function permanentlyDeleteAllTrashedEntries(): Promise<EmptyTrashResult> {
  try {
    const entries = await db.query.storageEntries.findMany({
      columns: {
        id: true,
        parentId: true,
        kind: true,
        blobId: true,
        deletedAt: true,
      },
      with: { blob: { columns: { diskName: true } } },
    });
    const entryById = new Map(entries.map((entry) => [entry.id, entry]));
    const isInTrash = (entry: (typeof entries)[number]) => {
      const visited = new Set<string>();
      let current: typeof entry | undefined = entry;
      while (current) {
        if (current.deletedAt !== null) return true;
        if (current.parentId === null || visited.has(current.parentId)) {
          return false;
        }
        visited.add(current.parentId);
        current = entryById.get(current.parentId);
      }
      return false;
    };

    const affectedFiles = entries.flatMap((entry) =>
      entry.kind === "file" && entry.blob && isInTrash(entry)
        ? [
            {
              id: entry.id,
              blobId: entry.blobId!,
              diskName: entry.blob.diskName,
            },
          ]
        : [],
    );

    db.transaction((tx) => {
      tx.delete(storageEntries)
        .where(isNotNull(storageEntries.deletedAt))
        .run();
      if (affectedFiles.length > 0) {
        tx.delete(storageBlobs)
          .where(
            inArray(
              storageBlobs.id,
              affectedFiles.map((file) => file.blobId),
            ),
          )
          .run();
      }
    });

    return {
      success: true,
      data: {
        affectedFiles: affectedFiles.map(({ id: fileId, diskName }) => ({
          id: fileId,
          diskName,
        })),
      },
    } as const;
  } catch (error) {
    console.error("Error emptying trash:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

function collectSubtreeIds(
  entries: Array<{ id: string; parentId: string | null }>,
  rootId: string,
) {
  const childIdsByParentId = new Map<string, string[]>();
  for (const entry of entries) {
    if (entry.parentId === null) continue;
    const childIds = childIdsByParentId.get(entry.parentId) ?? [];
    childIds.push(entry.id);
    childIdsByParentId.set(entry.parentId, childIds);
  }

  const result = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || result.has(currentId)) continue;
    result.add(currentId);
    queue.push(...(childIdsByParentId.get(currentId) ?? []));
  }
  return result;
}
