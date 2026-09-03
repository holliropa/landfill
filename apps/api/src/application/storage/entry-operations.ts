import db, { storageEntries } from "@/infrastructure/db";
import { and, eq, isNull, ne } from "drizzle-orm";
import { hasTrashedAncestor } from "@/application/storage/trash-visibility";

export type StorageEntryKind = "file" | "folder";

type EntryOperationError =
  | "INVALID_NAME"
  | "NOT_FOUND"
  | "ALREADY_IN_TRASH"
  | "DUPLICATE_NAME"
  | "DATABASE_ERROR";

type StorageEntry = typeof storageEntries.$inferSelect;
type RenameEntryResult =
  | { success: true; data: StorageEntry }
  | { success: false; code: EntryOperationError };
type MoveEntryToTrashResult =
  | { success: true; data: { id: string; name: string } }
  | { success: false; code: EntryOperationError };

export async function renameEntry(
  id: string,
  kind: StorageEntryKind,
  newName: string,
): Promise<RenameEntryResult> {
  const normalizedName = newName.trim();

  if (!normalizedName) {
    return { success: false, code: "INVALID_NAME" as EntryOperationError };
  }

  try {
    const [entry] = await db
      .select({
        id: storageEntries.id,
        parentId: storageEntries.parentId,
      })
      .from(storageEntries)
      .where(
        and(
          eq(storageEntries.id, id),
          eq(storageEntries.kind, kind),
          isNull(storageEntries.deletedAt),
        ),
      )
      .limit(1);

    if (!entry || (await hasTrashedAncestor(entry.parentId))) {
      return { success: false, code: "NOT_FOUND" as EntryOperationError };
    }

    const duplicateCount = await db.$count(
      storageEntries,
      and(
        eq(storageEntries.kind, kind),
        eq(storageEntries.name, normalizedName),
        ne(storageEntries.id, id),
        entry.parentId === null
          ? isNull(storageEntries.parentId)
          : eq(storageEntries.parentId, entry.parentId),
        isNull(storageEntries.deletedAt),
      ),
    );

    if (duplicateCount > 0) {
      return { success: false, code: "DUPLICATE_NAME" as EntryOperationError };
    }

    const [updatedEntry] = await db
      .update(storageEntries)
      .set({ name: normalizedName })
      .where(
        and(
          eq(storageEntries.id, id),
          eq(storageEntries.kind, kind),
          isNull(storageEntries.deletedAt),
        ),
      )
      .returning();

    if (!updatedEntry) {
      return { success: false, code: "NOT_FOUND" as EntryOperationError };
    }

    return { success: true, data: updatedEntry } as const;
  } catch (error) {
    console.error(`Error renaming ${kind}:`, error);
    return { success: false, code: "DATABASE_ERROR" as EntryOperationError };
  }
}

export async function moveEntryToTrash(
  id: string,
  kind: StorageEntryKind,
): Promise<MoveEntryToTrashResult> {
  try {
    const [entry] = await db
      .select({
        id: storageEntries.id,
        name: storageEntries.name,
        deletedAt: storageEntries.deletedAt,
      })
      .from(storageEntries)
      .where(and(eq(storageEntries.id, id), eq(storageEntries.kind, kind)))
      .limit(1);

    if (!entry) {
      return { success: false, code: "NOT_FOUND" as EntryOperationError };
    }

    if (entry.deletedAt !== null) {
      return {
        success: false,
        code: "ALREADY_IN_TRASH" as EntryOperationError,
      };
    }

    const [trashedEntry] = await db
      .update(storageEntries)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(storageEntries.id, id),
          eq(storageEntries.kind, kind),
          isNull(storageEntries.deletedAt),
        ),
      )
      .returning({ id: storageEntries.id, name: storageEntries.name });

    if (!trashedEntry) {
      return { success: false, code: "DATABASE_ERROR" as EntryOperationError };
    }

    return { success: true, data: trashedEntry } as const;
  } catch (error) {
    console.error(`Error moving ${kind} to trash:`, error);
    return { success: false, code: "DATABASE_ERROR" as EntryOperationError };
  }
}
