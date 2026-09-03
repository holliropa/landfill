import db from "@/infrastructure/db";
import { renameEntry } from "@/application/storage/entry-operations";

export type RenameFileResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        diskName: string;
        size: number;
        mimeType: string;
        createdAt: Date;
        folderId: string | null;
      };
    }
  | {
      success: false;
      code:
        "INVALID_NAME" | "FILE_NOT_FOUND" | "DUPLICATE_NAME" | "DATABASE_ERROR";
    };

export async function renameFile(
  fileId: string,
  newName: string,
): Promise<RenameFileResult> {
  const result = await renameEntry(fileId, "file", newName);

  if (!result.success) {
    return {
      success: false,
      code: result.code === "NOT_FOUND" ? "FILE_NOT_FOUND" : result.code,
    } as RenameFileResult;
  }

  const blob = result.data.blobId
    ? await db.query.storageBlobs.findFirst({
        where: { id: result.data.blobId },
      })
    : null;

  if (!blob) return { success: false, code: "DATABASE_ERROR" };

  return {
    success: true,
    data: {
      id: result.data.id,
      name: result.data.name,
      diskName: blob.diskName,
      size: blob.size,
      mimeType: blob.mimeType,
      createdAt: result.data.createdAt,
      folderId: result.data.parentId,
    },
  };
}
