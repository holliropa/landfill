import db, { files, folders } from "@/infrastructure/db";
import { and, eq, isNull } from "drizzle-orm";
import { isFolderInActiveTree } from "@/application/storage/trash-visibility";
import {
  getAvailableFileName,
  normalizeFileNameKey,
} from "@/domain/storage/available-name";

export type UploadedFileData = {
  id: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  createdAt: Date;
  name: string;
};

export type UploadFilesResult =
  | { success: true; data: UploadedFileData[] }
  | { success: false; code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" };

export type FileEntry = {
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
};

export async function createFiles(
  payloads: FileEntry[],
  folderId: string,
): Promise<UploadFilesResult> {
  try {
    const normalizedFolderId = folderId == "root" ? null : folderId;

    if (
      normalizedFolderId !== null &&
      !(await isFolderInActiveTree(normalizedFolderId))
    ) {
      return { success: false, code: "FOLDER_NOT_FOUND" };
    }

    return db.transaction((tx) => {
      if (normalizedFolderId !== null) {
        const [folderExists] = tx
          .select({ id: folders.id })
          .from(folders)
          .where(
            and(eq(folders.id, normalizedFolderId), isNull(folders.deletedAt)),
          )
          .limit(1)
          .all();

        if (!folderExists) {
          return { success: false, code: "FOLDER_NOT_FOUND" };
        }
      }

      const existingFiles = tx
        .select({ originalName: files.originalName })
        .from(files)
        .where(
          and(
            normalizedFolderId === null
              ? isNull(files.folderId)
              : eq(files.folderId, normalizedFolderId),
            isNull(files.deletedAt),
          ),
        )
        .all();

      const usedNames = new Set(
        existingFiles.map((file) => normalizeFileNameKey(file.originalName)),
      );

      const valuesToInsert = payloads.map((file) => ({
        originalName: getAvailableFileName(file.originalName, usedNames),
        diskName: file.filename,
        size: file.size,
        mimeType: file.mimeType,
        folderId: normalizedFolderId,
      }));

      const insertedRows = tx
        .insert(files)
        .values(valuesToInsert)
        .returning()
        .all();

      const formattedFiles = insertedRows.map(
        ({ originalName, diskName, ...file }) => ({
          ...file,
          name: originalName,
        }),
      );

      return { success: true, data: formattedFiles };
    });
  } catch (error) {
    console.error("Error creating files:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
