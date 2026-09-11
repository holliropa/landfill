import yauzl, { type Entry, type ZipFile } from "yauzl";
import type { Readable } from "node:stream";

const maxArchiveEntries = 50_000;
const maxArchivePathLength = 4_096;
const maxArchiveEntrySize = 16 * 1024 * 1024 * 1024;
const maxArchiveExpandedSize = 64 * 1024 * 1024 * 1024;
const maxCompressionRatio = 10_000;

export type ArchiveEntryKind = "file" | "directory";

export type ZipArchiveEntry = {
  index: number;
  path: string;
  name: string;
  kind: ArchiveEntryKind;
  compressedSize: number;
  size: number;
  modifiedAt: Date | null;
  encrypted: boolean;
  supported: boolean;
};

export type ArchiveReadErrorCode =
  | "INVALID_ARCHIVE"
  | "TOO_MANY_ENTRIES"
  | "ARCHIVE_TOO_LARGE"
  | "UNSAFE_ENTRY"
  | "ENTRY_NOT_FOUND"
  | "UNSUPPORTED_ENTRY";

export class ArchiveReadError extends Error {
  constructor(
    readonly code: ArchiveReadErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ArchiveReadError";
  }
}

export async function readZipArchiveEntries(filePath: string) {
  const zipFile = await openZip(filePath);
  const entries: ZipArchiveEntry[] = [];
  let expandedSize = 0;

  try {
    for await (const entry of zipFile.eachEntry()) {
      if (entries.length >= maxArchiveEntries) {
        throw new ArchiveReadError(
          "TOO_MANY_ENTRIES",
          `ZIP archives may contain at most ${maxArchiveEntries} entries`,
        );
      }

      const describedEntry = describeEntry(entry, entries.length);
      assertReasonableEntrySize(describedEntry);
      expandedSize += describedEntry.size;
      if (expandedSize > maxArchiveExpandedSize) {
        throw new ArchiveReadError(
          "ARCHIVE_TOO_LARGE",
          "The ZIP expands beyond the supported archive size limit",
        );
      }
      entries.push(describedEntry);
    }

    return entries;
  } catch (error) {
    throw normalizeArchiveError(error);
  } finally {
    closeZip(zipFile);
  }
}

export async function visitZipArchiveEntries(
  filePath: string,
  selectedIndexes: ReadonlySet<number>,
  visitor: (entry: ZipArchiveEntry, stream: Readable | null) => Promise<void>,
) {
  const zipFile = await openZip(filePath);
  let index = 0;

  try {
    for await (const rawEntry of zipFile.eachEntry()) {
      const entry = describeEntry(rawEntry, index);
      index += 1;
      if (!selectedIndexes.has(entry.index)) continue;

      assertEntrySupported(entry);
      const stream =
        entry.kind === "file"
          ? await zipFile.openReadStreamPromise(rawEntry)
          : null;
      await visitor(entry, stream);
    }
  } catch (error) {
    throw normalizeArchiveError(error);
  } finally {
    closeZip(zipFile);
  }
}

export async function openZipArchiveEntryStream(
  filePath: string,
  requestedIndex: number,
) {
  const zipFile = await openZip(filePath);
  let index = 0;

  try {
    for await (const rawEntry of zipFile.eachEntry()) {
      const entry = describeEntry(rawEntry, index);
      index += 1;
      if (entry.index !== requestedIndex) continue;

      assertEntrySupported(entry);
      if (entry.kind !== "file") {
        throw new ArchiveReadError(
          "UNSUPPORTED_ENTRY",
          "Directories cannot be downloaded as individual files",
        );
      }

      const stream = await zipFile.openReadStreamPromise(rawEntry);
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        closeZip(zipFile);
      };
      stream.once("end", close);
      stream.once("error", close);
      stream.once("close", close);

      return { entry, stream, close };
    }

    throw new ArchiveReadError(
      "ENTRY_NOT_FOUND",
      "The requested ZIP entry does not exist",
    );
  } catch (error) {
    closeZip(zipFile);
    throw normalizeArchiveError(error);
  }
}

function describeEntry(entry: Entry, index: number): ZipArchiveEntry {
  const normalizedPath = normalizeEntryPath(entry.fileName);
  const kind = isDirectoryEntry(entry) ? "directory" : "file";
  const encrypted = entry.isEncrypted();
  const supported =
    !encrypted && !isSymbolicLink(entry) && entry.canDecodeFileData();
  const modifiedAt = entry.getLastModDate({ timezone: "UTC" });

  return {
    index,
    path: normalizedPath,
    name: normalizedPath.split("/").at(-1) ?? normalizedPath,
    kind,
    compressedSize: entry.compressedSize,
    size: entry.uncompressedSize,
    modifiedAt: Number.isNaN(modifiedAt.getTime()) ? null : modifiedAt,
    encrypted,
    supported,
  };
}

function normalizeEntryPath(fileName: string) {
  if (
    !fileName ||
    fileName.length > maxArchivePathLength ||
    /[\u0000-\u001f]/.test(fileName) ||
    fileName.startsWith("/") ||
    fileName.startsWith("\\") ||
    /^[a-z]:[/\\]/i.test(fileName)
  ) {
    throw new ArchiveReadError(
      "UNSAFE_ENTRY",
      "The ZIP contains an unsafe entry path",
    );
  }

  const segments = fileName.replaceAll("\\", "/").split("/");
  const normalizedSegments: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      throw new ArchiveReadError(
        "UNSAFE_ENTRY",
        "The ZIP contains a path outside its extraction root",
      );
    }
    normalizedSegments.push(segment);
  }

  if (normalizedSegments.length === 0) {
    throw new ArchiveReadError(
      "UNSAFE_ENTRY",
      "The ZIP contains an empty entry path",
    );
  }

  return normalizedSegments.join("/");
}

function isDirectoryEntry(entry: Entry) {
  return (
    entry.fileName.endsWith("/") || (entry.externalFileAttributes & 0x10) !== 0
  );
}

function isSymbolicLink(entry: Entry) {
  const unixMode = entry.externalFileAttributes >>> 16;
  return (unixMode & 0o170000) === 0o120000;
}

function assertEntrySupported(entry: ZipArchiveEntry) {
  if (entry.supported) return;

  throw new ArchiveReadError(
    "UNSUPPORTED_ENTRY",
    entry.encrypted
      ? `Encrypted ZIP entry cannot be read: ${entry.path}`
      : `Unsupported ZIP entry cannot be read: ${entry.path}`,
  );
}

function assertReasonableEntrySize(entry: ZipArchiveEntry) {
  if (entry.kind !== "file") return;
  const compressionRatio =
    entry.compressedSize > 0 ? entry.size / entry.compressedSize : entry.size;
  if (
    entry.size > maxArchiveEntrySize ||
    compressionRatio > maxCompressionRatio
  ) {
    throw new ArchiveReadError(
      "ARCHIVE_TOO_LARGE",
      `ZIP entry exceeds the supported expansion limits: ${entry.path}`,
    );
  }
}

async function openZip(filePath: string) {
  try {
    return await yauzl.openPromise(filePath, {
      autoClose: false,
      lazyEntries: true,
      decodeStrings: true,
      strictFileNames: true,
      validateEntrySizes: true,
    });
  } catch (error) {
    throw normalizeArchiveError(error);
  }
}

function closeZip(zipFile: ZipFile) {
  if (zipFile.isOpen) zipFile.close();
}

function normalizeArchiveError(error: unknown) {
  if (error instanceof ArchiveReadError) return error;

  return new ArchiveReadError(
    "INVALID_ARCHIVE",
    error instanceof Error ? error.message : "Could not read the ZIP archive",
  );
}
