import { getFile } from "@/application/files/get-file";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { isFileInActiveTree } from "./trash-visibility";
import * as fs from "node:fs";

export type ActiveFileContentSource = {
  id: string;
  contentRevisionId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  folderId: string | null;
  sourcePath: string;
};

export type GetActiveFileContentSourceResult =
  | { success: true; source: ActiveFileContentSource }
  | { success: false; code: "FILE_NOT_FOUND" | "DATABASE_ERROR" };

/**
 * Public Drive-core read boundary for format-specific capabilities.
 * Capability modules receive an immutable content revision and a readable
 * local source without knowing how the namespace or blob store is modeled.
 */
export async function getActiveFileContentSource(
  fileId: string,
): Promise<GetActiveFileContentSourceResult> {
  const result = await getFile(fileId);
  if (!result.success) return result;

  const file = result.data;
  if (!(await isFileInActiveTree(file))) {
    return { success: false, code: "FILE_NOT_FOUND" };
  }

  const sourcePath = getFilePath(file.diskName);
  try {
    const stat = await fs.promises.stat(sourcePath);
    if (!stat.isFile()) return { success: false, code: "FILE_NOT_FOUND" };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`Could not resolve file content ${fileId}:`, error);
    }
    return { success: false, code: "FILE_NOT_FOUND" };
  }

  return {
    success: true,
    source: {
      id: file.id,
      contentRevisionId: file.blobId,
      name: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
      folderId: file.folderId,
      sourcePath,
    },
  };
}
