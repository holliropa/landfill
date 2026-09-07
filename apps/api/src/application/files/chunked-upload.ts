import config from "@/config";
import {
  createFiles,
  type UploadFilesResult,
} from "@/application/files/create-files";
import { isFolderInActiveTree } from "@/application/storage/trash-visibility";
import { cleanupFiles } from "@/infrastructure/filesystem/cleanup-files";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";

export interface ChunkedUploadMetadata {
  uploadId: string;
  filename: string;
  totalSize: number;
  mimeType: string;
  folderId: string;
  chunkSize: number;
  totalChunks: number;
  createdAt: number;
  uploadedChunks: number[];
}

function getUploadSessionDir(uploadId: string): string {
  // sanitize uploadId to prevent directory traversal
  const safeUploadId = path.basename(uploadId);
  return path.join(config.storage.tempUploadsDir, safeUploadId);
}

function getMetadataPath(uploadId: string): string {
  return path.join(getUploadSessionDir(uploadId), "metadata.json");
}

function readMetadata(uploadId: string): ChunkedUploadMetadata | null {
  try {
    const metaPath = getMetadataPath(uploadId);
    if (!fs.existsSync(metaPath)) return null;
    const data = fs.readFileSync(metaPath, "utf-8");
    return JSON.parse(data) as ChunkedUploadMetadata;
  } catch {
    return null;
  }
}

function writeMetadata(
  uploadId: string,
  metadata: ChunkedUploadMetadata,
): void {
  const metaPath = getMetadataPath(uploadId);
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
}

export async function initChunkedUpload(params: {
  filename: string;
  totalSize: number;
  mimeType?: string;
  folderId: string;
  chunkSize: number;
  totalChunks: number;
  uploadId?: string;
}) {
  const normalizedFolderId =
    params.folderId === "root" ? null : params.folderId;
  if (
    normalizedFolderId !== null &&
    !(await isFolderInActiveTree(normalizedFolderId))
  ) {
    return { success: false, code: "FOLDER_NOT_FOUND" as const };
  }

  const uploadId = params.uploadId || randomUUID();
  const sessionDir = getUploadSessionDir(uploadId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const existingMeta = readMetadata(uploadId);
  if (existingMeta) {
    return {
      success: true,
      data: {
        uploadId: existingMeta.uploadId,
        filename: existingMeta.filename,
        totalSize: existingMeta.totalSize,
        totalChunks: existingMeta.totalChunks,
        chunkSize: existingMeta.chunkSize,
        uploadedChunks: existingMeta.uploadedChunks,
      },
    } as const;
  }

  const metadata: ChunkedUploadMetadata = {
    uploadId,
    filename: params.filename,
    totalSize: params.totalSize,
    mimeType: params.mimeType || "application/octet-stream",
    folderId: params.folderId,
    chunkSize: params.chunkSize,
    totalChunks: params.totalChunks,
    createdAt: Date.now(),
    uploadedChunks: [],
  };

  writeMetadata(uploadId, metadata);

  return {
    success: true,
    data: {
      uploadId,
      filename: metadata.filename,
      totalSize: metadata.totalSize,
      totalChunks: metadata.totalChunks,
      chunkSize: metadata.chunkSize,
      uploadedChunks: [],
    },
  } as const;
}

export async function saveUploadChunk(params: {
  uploadId: string;
  chunkIndex: number;
  tempFilePath: string;
}) {
  const metadata = readMetadata(params.uploadId);
  if (!metadata) {
    return { success: false, code: "UPLOAD_SESSION_NOT_FOUND" as const };
  }

  if (params.chunkIndex < 0 || params.chunkIndex >= metadata.totalChunks) {
    return { success: false, code: "INVALID_CHUNK_INDEX" as const };
  }

  const sessionDir = getUploadSessionDir(params.uploadId);
  const chunkDestination = path.join(sessionDir, `chunk_${params.chunkIndex}`);

  // Move or copy chunk to session directory
  try {
    fs.renameSync(params.tempFilePath, chunkDestination);
  } catch {
    fs.copyFileSync(params.tempFilePath, chunkDestination);
    fs.unlinkSync(params.tempFilePath);
  }

  if (!metadata.uploadedChunks.includes(params.chunkIndex)) {
    metadata.uploadedChunks.push(params.chunkIndex);
    metadata.uploadedChunks.sort((a, b) => a - b);
    writeMetadata(params.uploadId, metadata);
  }

  return {
    success: true,
    data: {
      uploadId: params.uploadId,
      chunkIndex: params.chunkIndex,
      uploadedChunks: metadata.uploadedChunks,
    },
  } as const;
}

export function getChunkedUploadStatus(uploadId: string) {
  const metadata = readMetadata(uploadId);
  if (!metadata) {
    return { success: false, code: "UPLOAD_SESSION_NOT_FOUND" as const };
  }

  return {
    success: true,
    data: {
      uploadId: metadata.uploadId,
      filename: metadata.filename,
      totalSize: metadata.totalSize,
      totalChunks: metadata.totalChunks,
      chunkSize: metadata.chunkSize,
      uploadedChunks: metadata.uploadedChunks,
    },
  } as const;
}

export async function completeChunkedUpload(uploadId: string) {
  const metadata = readMetadata(uploadId);
  if (!metadata) {
    return { success: false, code: "UPLOAD_SESSION_NOT_FOUND" as const };
  }

  const sessionDir = getUploadSessionDir(uploadId);

  // Verify all chunks exist
  for (let i = 0; i < metadata.totalChunks; i++) {
    const chunkPath = path.join(sessionDir, `chunk_${i}`);
    if (!fs.existsSync(chunkPath)) {
      return {
        success: false,
        code: "MISSING_CHUNKS" as const,
        missingChunkIndex: i,
      };
    }
  }

  const diskName = randomUUID();
  const finalFilePath = getFilePath(diskName);
  const writeStream = fs.createWriteStream(finalFilePath);

  try {
    for (let i = 0; i < metadata.totalChunks; i++) {
      const chunkPath = path.join(sessionDir, `chunk_${i}`);
      const readStream = fs.createReadStream(chunkPath);
      await pipeline(readStream, writeStream, {
        end: i === metadata.totalChunks - 1,
      });
    }

    const stat = fs.statSync(finalFilePath);

    const createResult: UploadFilesResult = await createFiles(
      [
        {
          originalName: metadata.filename,
          filename: diskName,
          size: stat.size,
          mimeType: metadata.mimeType,
        },
      ],
      metadata.folderId,
    );

    if (!createResult.success) {
      cleanupFiles([diskName]);
      return createResult;
    }

    // Cleanup session files
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {
      // ignore temp cleanup error
    }

    return {
      success: true,
      data: createResult.data[0],
    } as const;
  } catch (error) {
    console.error("Error assembling chunked upload:", error);
    cleanupFiles([diskName]);
    return { success: false, code: "ASSEMBLY_FAILED" as const };
  }
}

export function cancelChunkedUpload(uploadId: string) {
  const sessionDir = getUploadSessionDir(uploadId);
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  return { success: true } as const;
}
