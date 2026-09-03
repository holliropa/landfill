import db, { storageEntries } from "@/infrastructure/db";
import { and, eq, isNull } from "drizzle-orm";
import { isFolderInActiveTree } from "@/application/storage/trash-visibility";

export type Folder = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

export type CreateFolderResult =
  | { success: true; data: Folder }
  | {
      success: false;
      code:
        | "INVALID_NAME"
        | "PARENT_NOT_FOUND"
        | "DUPLICATE_NAME"
        | "DATABASE_ERROR";
    };

export async function createFolder(
  name: string,
  parentFolderId: string | null,
): Promise<CreateFolderResult> {
  if (!name.trim()) {
    return { success: false, code: "INVALID_NAME" };
  }

  try {
    if (
      parentFolderId !== null &&
      !(await isFolderInActiveTree(parentFolderId))
    ) {
      return { success: false, code: "PARENT_NOT_FOUND" };
    }

    const countDuplicates = await db.$count(
      storageEntries,
      and(
        eq(storageEntries.kind, "folder"),
        eq(storageEntries.name, name),
        parentFolderId === null
          ? isNull(storageEntries.parentId)
          : eq(storageEntries.parentId, parentFolderId),
        isNull(storageEntries.deletedAt),
      ),
    );

    if (countDuplicates > 0) {
      return { success: false, code: "DUPLICATE_NAME" };
    }

    const [newFolder] = await db
      .insert(storageEntries)
      .values({ kind: "folder", name, parentId: parentFolderId })
      .returning({
        id: storageEntries.id,
        name: storageEntries.name,
        parentFolderId: storageEntries.parentId,
      });

    return { success: true, data: newFolder };
  } catch (error) {
    console.error("Database error creating folder:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
