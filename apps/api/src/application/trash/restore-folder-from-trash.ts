import db, { folders } from "@/infrastructure/db";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { getAvailableFolderName } from "@/domain/storage/available-name";

export type RestoreFolderFromTrashResult =
  | { success: true; data: { id: string; parentFolderId: string | null } }
  | {
      success: false;
      code: "FOLDER_NOT_FOUND" | "FOLDER_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function restoreFolderFromTrash(
  id: string,
): Promise<RestoreFolderFromTrashResult> {
  try {
    return db.transaction((tx) => {
      const [folder] = tx
        .select({
          id: folders.id,
          name: folders.name,
          parentFolderId: folders.parentFolderId,
          deletedAt: folders.deletedAt,
        })
        .from(folders)
        .where(eq(folders.id, id))
        .limit(1)
        .all();

      if (!folder) {
        return { success: false, code: "FOLDER_NOT_FOUND" };
      }

      if (folder.deletedAt === null) {
        return { success: false, code: "FOLDER_NOT_IN_TRASH" };
      }

      let targetParentFolderId = folder.parentFolderId;
      let currentFolderId = targetParentFolderId;

      while (currentFolderId !== null) {
        const [parentFolder] = tx
          .select({
            id: folders.id,
            parentFolderId: folders.parentFolderId,
            deletedAt: folders.deletedAt,
          })
          .from(folders)
          .where(eq(folders.id, currentFolderId))
          .limit(1)
          .all();

        if (!parentFolder || parentFolder.deletedAt !== null) {
          targetParentFolderId = null;
          break;
        }

        currentFolderId = parentFolder.parentFolderId;
      }

      const activeSiblingFolders = tx
        .select({ name: folders.name })
        .from(folders)
        .where(
          and(
            targetParentFolderId === null
              ? isNull(folders.parentFolderId)
              : eq(folders.parentFolderId, targetParentFolderId),
            isNull(folders.deletedAt),
          ),
        )
        .all();

      const usedNames = new Set(
        activeSiblingFolders.map((sibling) => sibling.name),
      );
      const restoredName = getAvailableFolderName(folder.name, usedNames);

      const [restoredFolder] = tx
        .update(folders)
        .set({
          name: restoredName,
          parentFolderId: targetParentFolderId,
          deletedAt: null,
        })
        .where(and(eq(folders.id, id), isNotNull(folders.deletedAt)))
        .returning({
          id: folders.id,
          parentFolderId: folders.parentFolderId,
        })
        .all();

      if (!restoredFolder) {
        return { success: false, code: "DATABASE_ERROR" };
      }

      return { success: true, data: restoredFolder };
    });
  } catch (error) {
    console.error("Error restoring folder from trash:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
