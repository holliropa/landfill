import { getActiveFileContentSource } from "@/application/storage/get-active-file-content-source";
import {
  ArchiveReadError,
  type ZipArchiveEntry,
} from "@/domain/archive-lab/zip-archive";
import { getArchiveIndex } from "./archive-index";

export type ArchiveSource = {
  id: string;
  contentRevisionId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  folderId: string | null;
  entryCount: number;
  fileCount: number;
  directoryCount: number;
  unsupportedEntryCount: number;
  totalUncompressedSize: number;
  entries: ZipArchiveEntry[];
};

export type ArchiveSourceErrorCode =
  | "FILE_NOT_FOUND"
  | "UNSUPPORTED_ARCHIVE"
  | "INVALID_ARCHIVE"
  | "TOO_MANY_ENTRIES"
  | "ARCHIVE_TOO_LARGE"
  | "UNSAFE_ENTRY"
  | "DATABASE_ERROR";

export type GetArchiveSourceResult =
  | { success: true; source: ArchiveSource; sourcePath: string }
  | { success: false; code: ArchiveSourceErrorCode; message?: string };

export async function getArchiveSource(
  fileId: string,
): Promise<GetArchiveSourceResult> {
  const contentResult = await getActiveFileContentSource(fileId);
  if (!contentResult.success) return contentResult;

  const file = contentResult.source;
  if (!isZipFile(file.name, file.mimeType)) {
    return { success: false, code: "UNSUPPORTED_ARCHIVE" };
  }

  try {
    const entries = await getArchiveIndex(
      file.contentRevisionId,
      file.sourcePath,
    );
    const files = entries.filter((entry) => entry.kind === "file");

    return {
      success: true,
      sourcePath: file.sourcePath,
      source: {
        id: file.id,
        contentRevisionId: file.contentRevisionId,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
        folderId: file.folderId,
        entryCount: entries.length,
        fileCount: files.length,
        directoryCount: entries.length - files.length,
        unsupportedEntryCount: entries.filter((entry) => !entry.supported)
          .length,
        totalUncompressedSize: files.reduce(
          (total, entry) => total + entry.size,
          0,
        ),
        entries,
      },
    };
  } catch (error) {
    if (error instanceof ArchiveReadError) {
      return {
        success: false,
        code:
          error.code === "TOO_MANY_ENTRIES" ||
          error.code === "ARCHIVE_TOO_LARGE" ||
          error.code === "UNSAFE_ENTRY"
            ? error.code
            : "INVALID_ARCHIVE",
        message: error.message,
      };
    }

    console.error(`Could not inspect ZIP archive ${fileId}:`, error);
    return { success: false, code: "INVALID_ARCHIVE" };
  }
}

function isZipFile(name: string, mimeType: string) {
  return (
    name.toLowerCase().endsWith(".zip") ||
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed"
  );
}
