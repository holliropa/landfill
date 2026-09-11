import {
  importFileTree,
  type ManagedTreeFile,
} from "@/application/storage/import-file-tree";
import {
  allocateManagedContentTarget,
  discardManagedContent,
} from "@/application/storage/managed-content";
import {
  ArchiveReadError,
  visitZipArchiveEntries,
  type ZipArchiveEntry,
} from "@/domain/archive-lab/zip-archive";
import { lookup as lookupMimeType } from "mime-types";
import * as fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { getArchiveSource } from "./get-archive-source";

type StagedArchiveFile = ManagedTreeFile;

export type ExtractArchiveResult =
  | {
      success: true;
      data: {
        folderId: string;
        folderName: string;
        fileCount: number;
        directoryCount: number;
        totalSize: number;
      };
    }
  | {
      success: false;
      code:
        | "FILE_NOT_FOUND"
        | "DESTINATION_NOT_FOUND"
        | "UNSUPPORTED_ARCHIVE"
        | "INVALID_ARCHIVE"
        | "INVALID_SELECTION"
        | "UNSUPPORTED_ENTRY"
        | "EXTRACTION_FAILED"
        | "DATABASE_ERROR";
      message?: string;
    };

export async function extractArchive(params: {
  sourceFileId: string;
  destinationFolderId: string;
  entryIndexes?: number[];
}): Promise<ExtractArchiveResult> {
  const sourceResult = await getArchiveSource(params.sourceFileId);
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

  const selection = resolveSelection(
    sourceResult.source.entries,
    params.entryIndexes,
  );
  if (!selection.success) return selection;

  const unsupportedEntry = selection.entries.find((entry) => !entry.supported);
  if (unsupportedEntry) {
    return {
      success: false,
      code: "UNSUPPORTED_ENTRY",
      message: unsupportedEntry.encrypted
        ? `Encrypted entry cannot be extracted: ${unsupportedEntry.path}`
        : `Unsupported entry cannot be extracted: ${unsupportedEntry.path}`,
    };
  }

  const selectedIndexes = new Set(
    selection.entries.map((entry) => entry.index),
  );
  const stagedFiles: StagedArchiveFile[] = [];
  const stagedDiskNames: string[] = [];
  let registered = false;

  try {
    await visitZipArchiveEntries(
      sourceResult.sourcePath,
      selectedIndexes,
      async (entry, stream) => {
        if (entry.kind !== "file" || !stream) return;

        const { diskName, targetPath } = allocateManagedContentTarget();
        stagedDiskNames.push(diskName);
        await pipeline(
          stream,
          fs.createWriteStream(targetPath, { flags: "wx" }),
        );
        const stat = await fs.promises.stat(targetPath);
        stagedFiles.push({
          relativePath: entry.path,
          diskName,
          size: stat.size,
          mimeType: lookupMimeType(entry.name) || "application/octet-stream",
        });
      },
    );

    const importResult = await importFileTree({
      suggestedRootName: getExtractionFolderName(sourceResult.source.name),
      destinationFolderId: params.destinationFolderId,
      directoryPaths: collectDirectoryPaths(selection.entries),
      files: stagedFiles,
    });
    if (!importResult.success) return importResult;

    registered = true;
    return importResult;
  } catch (error) {
    if (error instanceof ArchiveReadError) {
      return {
        success: false,
        code:
          error.code === "UNSUPPORTED_ENTRY"
            ? "UNSUPPORTED_ENTRY"
            : "INVALID_ARCHIVE",
        message: error.message,
      };
    }

    console.error(
      `Could not extract ZIP archive ${params.sourceFileId}:`,
      error,
    );
    return { success: false, code: "EXTRACTION_FAILED" };
  } finally {
    if (!registered) discardManagedContent(stagedDiskNames);
  }
}

function resolveSelection(
  entries: ZipArchiveEntry[],
  requestedIndexes: number[] | undefined,
):
  | { success: true; entries: ZipArchiveEntry[] }
  | { success: false; code: "INVALID_SELECTION" } {
  if (requestedIndexes === undefined) return { success: true, entries };
  if (requestedIndexes.length === 0) {
    return { success: false, code: "INVALID_SELECTION" };
  }

  const requested = new Set(requestedIndexes);
  const explicitlySelected = entries.filter((entry) =>
    requested.has(entry.index),
  );
  if (explicitlySelected.length !== requested.size) {
    return { success: false, code: "INVALID_SELECTION" };
  }

  const selectedDirectories = explicitlySelected
    .filter((entry) => entry.kind === "directory")
    .map((entry) => `${entry.path}/`);
  return {
    success: true,
    entries: entries.filter(
      (entry) =>
        requested.has(entry.index) ||
        selectedDirectories.some((prefix) => entry.path.startsWith(prefix)),
    ),
  };
}

function collectDirectoryPaths(entries: ZipArchiveEntry[]) {
  const paths = new Set<string>();
  for (const entry of entries) {
    let currentPath =
      entry.kind === "directory" ? entry.path : getParentPath(entry.path);
    while (currentPath) {
      paths.add(currentPath);
      currentPath = getParentPath(currentPath);
    }
  }

  return [...paths].sort((left, right) => {
    const depthDifference = left.split("/").length - right.split("/").length;
    return depthDifference || left.localeCompare(right);
  });
}

function getExtractionFolderName(archiveName: string) {
  const withoutExtension = archiveName.replace(/\.zip$/i, "").trim();
  const sanitized = withoutExtension
    .replaceAll(/[\\/]/g, "-")
    .replaceAll(/[\u0000-\u001f]/g, "")
    .trim();
  return sanitized || "Extracted archive";
}

function getParentPath(archivePath: string) {
  const separatorIndex = archivePath.lastIndexOf("/");
  return separatorIndex < 0 ? "" : archivePath.slice(0, separatorIndex);
}
