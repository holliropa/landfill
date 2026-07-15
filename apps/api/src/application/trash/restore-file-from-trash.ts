import db, { files, folders } from "@/infrastructure/db";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import {
  getAvailableFileName,
  normalizeFileNameKey,
} from "@/domain/storage/available-name";

export type RestoreFileFromTrashResult =
  | { success: true; data: { id: string; folderId: string | null } }
  | {
      success: false;
      code: "FILE_NOT_FOUND" | "FILE_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function restoreFileFromTrash(
  id: string,
): Promise<RestoreFileFromTrashResult> {
  try {
    return db.transaction((tx) => {
      const [file] = tx
        .select({
          id: files.id,
          originalName: files.originalName,
          folderId: files.folderId,
          deletedAt: files.deletedAt,
        })
        .from(files)
        .where(eq(files.id, id))
        .limit(1)
        .all();

      if (!file) {
        return { success: false, code: "FILE_NOT_FOUND" };
      }

      if (file.deletedAt === null) {
        return { success: false, code: "FILE_NOT_IN_TRASH" };
      }

      let targetFolderId = file.folderId;
      let currentFolderId = targetFolderId;

      while (currentFolderId !== null) {
        const [folder] = tx
          .select({
            id: folders.id,
            parentFolderId: folders.parentFolderId,
            deletedAt: folders.deletedAt,
          })
          .from(folders)
          .where(eq(folders.id, currentFolderId))
          .limit(1)
          .all();

        if (!folder || folder.deletedAt !== null) {
          targetFolderId = null;
          break;
        }

        currentFolderId = folder.parentFolderId;
      }

      const activeSiblingFiles = tx
        .select({ originalName: files.originalName })
        .from(files)
        .where(
          and(
            targetFolderId === null
              ? isNull(files.folderId)
              : eq(files.folderId, targetFolderId),
            isNull(files.deletedAt),
          ),
        )
        .all();

      const usedNames = new Set(
        activeSiblingFiles.map((sibling) =>
          normalizeFileNameKey(sibling.originalName),
        ),
      );
      const restoredName = getAvailableFileName(file.originalName, usedNames);

      const [restoredFile] = tx
        .update(files)
        .set({
          originalName: restoredName,
          folderId: targetFolderId,
          deletedAt: null,
        })
        .where(and(eq(files.id, id), isNotNull(files.deletedAt)))
        .returning({
          id: files.id,
          folderId: files.folderId,
        })
        .all();

      if (!restoredFile) {
        return { success: false, code: "DATABASE_ERROR" };
      }

      return { success: true, data: restoredFile };
    });
  } catch (error) {
    console.error("Error restoring file from trash:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
