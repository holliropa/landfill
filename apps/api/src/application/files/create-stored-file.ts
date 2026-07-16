import {
  getAvailableFileName,
  normalizeFileNameKey,
} from "@/domain/storage/available-name";
import db, { files } from "@/infrastructure/db";
import { and, eq, isNull } from "drizzle-orm";

export type CreateStoredFilePayload = {
  originalName: string;
  diskName: string;
  size: number;
  mimeType: string;
  folderId: string | null;
};

export async function createStoredFile(payload: CreateStoredFilePayload) {
  const existingFiles = await db
    .select({ originalName: files.originalName })
    .from(files)
    .where(
      and(
        payload.folderId === null
          ? isNull(files.folderId)
          : eq(files.folderId, payload.folderId),
        isNull(files.deletedAt),
      ),
    );

  const usedNames = new Set(
    existingFiles.map((file) => normalizeFileNameKey(file.originalName)),
  );

  const [createdFile] = await db
    .insert(files)
    .values({
      originalName: getAvailableFileName(payload.originalName, usedNames),
      diskName: payload.diskName,
      size: payload.size,
      mimeType: payload.mimeType,
      folderId: payload.folderId,
    })
    .returning({
      id: files.id,
      name: files.originalName,
      size: files.size,
      mimeType: files.mimeType,
      folderId: files.folderId,
      createdAt: files.createdAt,
    });

  return createdFile;
}
