import db, { storageEntries } from "@/infrastructure/db";
import { and, eq } from "drizzle-orm";

export async function hasTrashedAncestor(parentId: string | null) {
  let currentId = parentId;

  while (currentId !== null) {
    const [parent] = await db
      .select({
        kind: storageEntries.kind,
        parentId: storageEntries.parentId,
        deletedAt: storageEntries.deletedAt,
      })
      .from(storageEntries)
      .where(eq(storageEntries.id, currentId))
      .limit(1);

    if (!parent || parent.kind !== "folder" || parent.deletedAt !== null) {
      return true;
    }

    currentId = parent.parentId;
  }

  return false;
}

export async function isEntryInActiveTree(entry: {
  deletedAt: Date | null;
  parentId: string | null;
}) {
  if (entry.deletedAt !== null) return false;
  return !(await hasTrashedAncestor(entry.parentId));
}

export async function isFileInActiveTree(file: {
  deletedAt: Date | null;
  folderId: string | null;
}) {
  return isEntryInActiveTree({
    deletedAt: file.deletedAt,
    parentId: file.folderId,
  });
}

export async function isFolderInActiveTree(id: string) {
  const [folder] = await db
    .select({
      parentId: storageEntries.parentId,
      deletedAt: storageEntries.deletedAt,
    })
    .from(storageEntries)
    .where(and(eq(storageEntries.id, id), eq(storageEntries.kind, "folder")))
    .limit(1);

  if (!folder) return false;

  return isEntryInActiveTree(folder);
}
