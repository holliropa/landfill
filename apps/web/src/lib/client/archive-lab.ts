import { useMutation, useQuery } from "@tanstack/react-query";
import config from "@/config";
import { apiFetch, HttpError } from "./api";
import { normalizeApiDate, type SerializedDate } from "./normalizers";
import { useInvalidateStorageQueries } from "./invalidation";

export type ArchiveLabEntry = {
  index: number;
  path: string;
  name: string;
  kind: "file" | "directory";
  compressedSize: number;
  size: number;
  modifiedAt: Date | null;
  encrypted: boolean;
  supported: boolean;
};

export type ArchiveLabSource = {
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
  entries: ArchiveLabEntry[];
};

export type ArchiveLabExtraction = {
  folderId: string;
  folderName: string;
  fileCount: number;
  directoryCount: number;
  totalSize: number;
};

export type ArchiveBrowserItem = {
  id: string;
  path: string;
  name: string;
  kind: "file" | "folder";
  entryIndex: number | null;
  size: number | null;
  mimeType: string | null;
  modifiedAt: Date | null;
  supported: boolean;
};

export type ArchiveDirectory = {
  archive: Omit<ArchiveLabSource, "entries">;
  path: string;
  breadcrumbs: { name: string; path: string }[];
  items: ArchiveBrowserItem[];
};

export type ExtractArchiveLabInput = {
  sourceFileId: string;
  destinationFolderId: string;
  entryIndexes?: number[];
};

export async function getArchiveLabSource(
  fileId: string,
  signal?: AbortSignal,
): Promise<ArchiveLabSource> {
  const response = await apiFetch(
    `${config.api.url}/archive-lab/sources/${fileId}`,
    { signal },
  );
  if (!response.ok) {
    throw await archiveLabHttpError(response, "Could not open ZIP archive");
  }

  const data = (await response.json()) as Omit<
    ArchiveLabSource,
    "createdAt" | "entries"
  > & {
    createdAt: SerializedDate;
    entries: Array<
      Omit<ArchiveLabEntry, "modifiedAt"> & {
        modifiedAt: SerializedDate | null;
      }
    >;
  };
  return {
    ...data,
    createdAt: normalizeApiDate(data.createdAt),
    entries: data.entries.map((entry) => ({
      ...entry,
      modifiedAt:
        entry.modifiedAt === null ? null : normalizeApiDate(entry.modifiedAt),
    })),
  };
}

export function getArchiveEntryDownloadUrl(
  fileId: string,
  entryIndex: number,
  contentRevisionId?: string,
) {
  const revision = contentRevisionId
    ? `&revision=${encodeURIComponent(contentRevisionId)}`
    : "";
  return `${config.api.url}/archive-lab/sources/${fileId}/entries/download?entry=${entryIndex}${revision}`;
}

export function getArchiveEntryContentUrl(
  fileId: string,
  entryIndex: number,
  contentRevisionId: string,
) {
  return `${config.api.url}/archive-lab/sources/${fileId}/entries/${entryIndex}/content?revision=${encodeURIComponent(contentRevisionId)}`;
}

export async function getArchiveDirectory(
  fileId: string,
  path: string,
  signal?: AbortSignal,
): Promise<ArchiveDirectory> {
  const response = await apiFetch(
    `${config.api.url}/archive-lab/sources/${fileId}/children?path=${encodeURIComponent(path)}`,
    { signal },
  );
  if (!response.ok) {
    throw await archiveLabHttpError(response, "Could not browse ZIP archive");
  }

  const data = (await response.json()) as Omit<
    ArchiveDirectory,
    "archive" | "items"
  > & {
    archive: Omit<ArchiveDirectory["archive"], "createdAt"> & {
      createdAt: SerializedDate;
    };
    items: Array<
      Omit<ArchiveBrowserItem, "modifiedAt"> & {
        modifiedAt: SerializedDate | null;
      }
    >;
  };
  return {
    ...data,
    archive: {
      ...data.archive,
      createdAt: normalizeApiDate(data.archive.createdAt),
    },
    items: data.items.map((item) => ({
      ...item,
      modifiedAt:
        item.modifiedAt === null ? null : normalizeApiDate(item.modifiedAt),
    })),
  };
}

export async function extractArchiveLab(
  input: ExtractArchiveLabInput,
): Promise<ArchiveLabExtraction> {
  const response = await apiFetch(`${config.api.url}/archive-lab/extracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw await archiveLabHttpError(response, "Could not extract ZIP archive");
  }

  return response.json();
}

export function useArchiveLabSource(fileId: string) {
  return useQuery({
    queryKey: ["archive-lab", "source", fileId],
    queryFn: ({ signal }) => getArchiveLabSource(fileId, signal),
    retry: false,
  });
}

export function useArchiveDirectory(fileId: string, path: string) {
  return useQuery({
    queryKey: ["archive-lab", "directory", fileId, path],
    queryFn: ({ signal }) => getArchiveDirectory(fileId, path, signal),
    enabled: fileId.length > 0,
    retry: false,
  });
}

export function useExtractArchiveLab() {
  const invalidateStorageQueries = useInvalidateStorageQueries();

  return useMutation({
    mutationFn: extractArchiveLab,
    onSuccess: async () => {
      await invalidateStorageQueries();
    },
  });
}

async function archiveLabHttpError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return new HttpError(data?.error ?? fallback, response.status);
}
