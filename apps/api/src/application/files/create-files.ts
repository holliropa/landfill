import { randomUUID } from "crypto";
import db, { storageBlobs, storageEntries } from "@/infrastructure/db";
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
    const normalizedFolderId = folderId === "root" ? null : folderId;

    if (
      normalizedFolderId !== null &&
      !(await isFolderInActiveTree(normalizedFolderId))
    ) {
      return { success: false, code: "FOLDER_NOT_FOUND" };
    }

    return db.transaction((tx) => {
      if (normalizedFolderId !== null) {
        const [folder] = tx
          .select({ id: storageEntries.id })
          .from(storageEntries)
          .where(
            and(
              eq(storageEntries.id, normalizedFolderId),
              eq(storageEntries.kind, "folder"),
              isNull(storageEntries.deletedAt),
            ),
          )
          .limit(1)
          .all();

        if (!folder) {
          return { success: false, code: "FOLDER_NOT_FOUND" } as const;
        }
      }

      const siblingFiles = tx
        .select({ name: storageEntries.name })
        .from(storageEntries)
        .where(
          and(
            eq(storageEntries.kind, "file"),
            normalizedFolderId === null
              ? isNull(storageEntries.parentId)
              : eq(storageEntries.parentId, normalizedFolderId),
            isNull(storageEntries.deletedAt),
          ),
        )
        .all();

      const usedNames = new Set(
        siblingFiles.map((file) => normalizeFileNameKey(file.name)),
      );

      const records = payloads.map((file) => ({
        entryId: randomUUID(),
        blobId: randomUUID(),
        name: getAvailableFileName(file.originalName, usedNames),
        diskName: file.filename,
        size: file.size,
        mimeType: file.mimeType,
      }));

      tx.insert(storageBlobs)
        .values(
          records.map((record) => ({
            id: record.blobId,
            diskName: record.diskName,
            size: record.size,
            mimeType: record.mimeType,
          })),
        )
        .run();

      const insertedEntries = tx
        .insert(storageEntries)
        .values(
          records.map((record) => ({
            id: record.entryId,
            kind: "file" as const,
            name: record.name,
            parentId: normalizedFolderId,
            blobId: record.blobId,
          })),
        )
        .returning({
          id: storageEntries.id,
          createdAt: storageEntries.createdAt,
        })
        .all();

      const createdAtById = new Map(
        insertedEntries.map((entry) => [entry.id, entry.createdAt]),
      );

      return {
        success: true,
        data: records.map((record) => ({
          id: record.entryId,
          name: record.name,
          mimeType: record.mimeType,
          size: record.size,
          folderId: normalizedFolderId,
          createdAt: createdAtById.get(record.entryId)!,
        })),
      } as const;
    });
  } catch (error) {
    console.error("Error creating files:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
