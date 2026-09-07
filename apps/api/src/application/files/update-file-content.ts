import db, { storageBlobs, storageEntries } from "@/infrastructure/db";
import { and, eq, isNull } from "drizzle-orm";
import { isFileInActiveTree } from "@/application/storage/trash-visibility";
import { cleanupFiles } from "@/infrastructure/filesystem/cleanup-files";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";

export type UpdateFileContentResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        mimeType: string;
        size: number;
        folderId: string | null;
        createdAt: Date;
      };
    }
  | { success: false; code: "FILE_NOT_FOUND" | "DATABASE_ERROR" };

export async function updateFileContent(params: {
  fileId: string;
  content: string | Buffer;
  mimeType?: string;
}): Promise<UpdateFileContentResult> {
  try {
    const [existing] = await db
      .select({
        id: storageEntries.id,
        name: storageEntries.name,
        parentId: storageEntries.parentId,
        blobId: storageEntries.blobId,
        deletedAt: storageEntries.deletedAt,
        createdAt: storageEntries.createdAt,
        oldDiskName: storageBlobs.diskName,
        oldMimeType: storageBlobs.mimeType,
      })
      .from(storageEntries)
      .innerJoin(storageBlobs, eq(storageEntries.blobId, storageBlobs.id))
      .where(
        and(
          eq(storageEntries.id, params.fileId),
          eq(storageEntries.kind, "file"),
          isNull(storageEntries.deletedAt),
        ),
      );

    if (!existing || !existing.blobId) {
      return { success: false, code: "FILE_NOT_FOUND" };
    }

    const isVisible = await isFileInActiveTree({
      deletedAt: existing.deletedAt,
      folderId: existing.parentId,
    });
    if (!isVisible) {
      return { success: false, code: "FILE_NOT_FOUND" };
    }

    const newBlobId = randomUUID();
    const diskName = randomUUID();
    const filePath = getFilePath(diskName);

    const buffer = Buffer.isBuffer(params.content)
      ? params.content
      : Buffer.from(params.content, "utf-8");

    fs.writeFileSync(filePath, buffer);
    const size = buffer.length;
    const mimeType = params.mimeType || existing.oldMimeType || "text/plain";

    return db.transaction((tx) => {
      tx.insert(storageBlobs)
        .values({
          id: newBlobId,
          diskName,
          size,
          mimeType,
        })
        .run();

      tx.update(storageEntries)
        .set({
          blobId: newBlobId,
        })
        .where(eq(storageEntries.id, params.fileId))
        .run();

      // Clean up old blob if no other entries use it
      const [otherEntry] = tx
        .select({ id: storageEntries.id })
        .from(storageEntries)
        .where(eq(storageEntries.blobId, existing.blobId!))
        .limit(1)
        .all();

      if (!otherEntry) {
        tx.delete(storageBlobs)
          .where(eq(storageBlobs.id, existing.blobId!))
          .run();
        cleanupFiles([existing.oldDiskName]);
      }

      return {
        success: true,
        data: {
          id: existing.id,
          name: existing.name,
          mimeType,
          size,
          folderId: existing.parentId,
          createdAt: existing.createdAt,
        },
      } as const;
    });
  } catch (error) {
    console.error("Error updating file content:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
