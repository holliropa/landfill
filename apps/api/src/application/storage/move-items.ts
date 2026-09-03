import db, { storageEntries } from "@/infrastructure/db";
import { inArray } from "drizzle-orm";

export type StorageItemReference = {
  kind: "file" | "folder";
  id: string;
};

export type MoveItemsConflict = StorageItemReference & { name: string };

export type MoveItemsResult =
  | {
      success: true;
      data: { moved: StorageItemReference[]; destinationFolderId: string };
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
      const allEntries = tx
        .select({
          id: storageEntries.id,
          kind: storageEntries.kind,
          name: storageEntries.name,
          parentId: storageEntries.parentId,
          deletedAt: storageEntries.deletedAt,
        })
        .from(storageEntries)
        .all();
      const entryById = new Map(allEntries.map((entry) => [entry.id, entry]));

      const isActiveTree = (entryId: string | null) => {
        const visited = new Set<string>();
        let currentId = entryId;

        while (currentId !== null) {
          if (visited.has(currentId)) return false;
          visited.add(currentId);

          const entry = entryById.get(currentId);
          if (!entry || entry.kind !== "folder" || entry.deletedAt !== null) {
            return false;
          }
          currentId = entry.parentId;
        }

        return true;
      };

      if (destinationFolderId !== null && !isActiveTree(destinationFolderId)) {
        return { success: false, code: "DESTINATION_NOT_FOUND" };
      }

      const selectedEntries = items.map((item) => entryById.get(item.id));
      if (
        selectedEntries.some((entry, index) => {
          const expected = items[index];
          return (
            !entry ||
            entry.kind !== expected.kind ||
            entry.deletedAt !== null ||
            !isActiveTree(entry.parentId)
          );
        })
      ) {
        return { success: false, code: "ITEM_NOT_FOUND" };
      }

      const selectedFolderIds = new Set(
        items.filter((item) => item.kind === "folder").map((item) => item.id),
      );
      const hasSelectedAncestor = (parentId: string | null) => {
        const visited = new Set<string>();
        let currentId = parentId;

        while (currentId !== null) {
          if (selectedFolderIds.has(currentId)) return true;
          if (visited.has(currentId)) return false;
          visited.add(currentId);
          currentId = entryById.get(currentId)?.parentId ?? null;
        }
        return false;
      };

      // Descendants travel with a selected folder; only selected roots move.
      const rootEntries = selectedEntries.filter(
        (entry): entry is NonNullable<typeof entry> =>
          entry !== undefined && !hasSelectedAncestor(entry.parentId),
      );

      const destinationAncestors = new Set<string>();
      let ancestorId = destinationFolderId;
      while (ancestorId !== null) {
        destinationAncestors.add(ancestorId);
        ancestorId = entryById.get(ancestorId)?.parentId ?? null;
      }

      if (
        rootEntries.some(
          (entry) =>
            entry.kind === "folder" && destinationAncestors.has(entry.id),
        )
      ) {
        return { success: false, code: "INVALID_DESTINATION" };
      }

      const entriesToMove = rootEntries.filter(
        (entry) => entry.parentId !== destinationFolderId,
      );
      const destinationEntries = allEntries.filter(
        (entry) =>
          entry.parentId === destinationFolderId && entry.deletedAt === null,
      );

      const conflicts = collectConflicts(entriesToMove, destinationEntries);
      if (conflicts.length > 0) {
        return { success: false, code: "NAME_CONFLICT", conflicts };
      }

      if (entriesToMove.length > 0) {
        tx.update(storageEntries)
          .set({ parentId: destinationFolderId })
          .where(
            inArray(
              storageEntries.id,
              entriesToMove.map((entry) => entry.id),
            ),
          )
          .run();
      }

      return {
        success: true,
        data: {
          moved: entriesToMove.map(({ id, kind }) => ({ id, kind })),
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
  movingEntries: Array<{ id: string; kind: "file" | "folder"; name: string }>,
  destinationEntries: Array<{ kind: "file" | "folder"; name: string }>,
) {
  const movingCounts = new Map<string, number>();
  const destinationKeys = new Set(
    destinationEntries.map((entry) => `${entry.kind}:${entry.name}`),
  );

  for (const entry of movingEntries) {
    const key = `${entry.kind}:${entry.name}`;
    movingCounts.set(key, (movingCounts.get(key) ?? 0) + 1);
  }

  return movingEntries.flatMap((entry) => {
    const key = `${entry.kind}:${entry.name}`;
    return destinationKeys.has(key) || (movingCounts.get(key) ?? 0) > 1
      ? [{ id: entry.id, kind: entry.kind, name: entry.name }]
      : [];
  });
}
