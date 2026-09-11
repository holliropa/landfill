import { getArchiveSource } from "./get-archive-source";
import {
  ArchiveReadError,
  openZipArchiveEntryStream,
} from "@/domain/archive-lab/zip-archive";

export type OpenArchiveEntryResult =
  | {
      success: true;
      data: Awaited<ReturnType<typeof openZipArchiveEntryStream>>;
    }
  | {
      success: false;
      code:
        | "FILE_NOT_FOUND"
        | "UNSUPPORTED_ARCHIVE"
        | "INVALID_ARCHIVE"
        | "ENTRY_NOT_FOUND"
        | "UNSUPPORTED_ENTRY"
        | "CONTENT_CHANGED";
      message?: string;
    };

export async function openArchiveEntry(
  fileId: string,
  entryIndex: number,
  expectedContentRevisionId?: string,
): Promise<OpenArchiveEntryResult> {
  const sourceResult = await getArchiveSource(fileId);
  if (!sourceResult.success) {
    return {
      success: false,
      code:
        sourceResult.code === "FILE_NOT_FOUND" ||
        sourceResult.code === "UNSUPPORTED_ARCHIVE"
          ? sourceResult.code
          : "INVALID_ARCHIVE",
      message: sourceResult.message,
    };
  }

  if (
    expectedContentRevisionId &&
    sourceResult.source.contentRevisionId !== expectedContentRevisionId
  ) {
    return {
      success: false,
      code: "CONTENT_CHANGED",
      message: "The archive changed while it was open",
    };
  }

  try {
    return {
      success: true,
      data: await openZipArchiveEntryStream(
        sourceResult.sourcePath,
        entryIndex,
      ),
    };
  } catch (error) {
    if (error instanceof ArchiveReadError) {
      return {
        success: false,
        code:
          error.code === "ENTRY_NOT_FOUND" || error.code === "UNSUPPORTED_ENTRY"
            ? error.code
            : "INVALID_ARCHIVE",
        message: error.message,
      };
    }

    console.error(
      `Could not open ZIP entry ${entryIndex} from ${fileId}:`,
      error,
    );
    return { success: false, code: "INVALID_ARCHIVE" };
  }
}
