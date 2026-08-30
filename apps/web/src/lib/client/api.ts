import type { FileItem, FolderItem } from "@/types";
import type { StorageItem, TrashItem } from "./types";
import config from "@/config";
import {
  normalizeApiDate,
  normalizeFileItem,
  normalizeFolderItem,
  normalizeStorageItem,
  normalizeTrashItem,
  type FileItemPayload,
  type FolderItemPayload,
  type SerializedDate,
  type StorageItemPayload,
  type TrashItemPayload,
} from "./normalizers";

export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const AUTHENTICATION_REQUIRED_EVENT = "landfill:authentication-required";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTHENTICATION_REQUIRED_EVENT));
  }

  return response;
}

export async function createFolder(
  name: string,
  parentFolderId: string,
): Promise<FolderItem> {
  const response = await apiFetch(`${config.api.url}/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, parentFolder: parentFolderId }),
  });

  if (!response.ok) {
    throw new Error("Failed to create folder");
  }

  const data = (await response.json()) as FolderItemPayload;
  return normalizeFolderItem(data);
}

export type FolderContentResponse = {
  folders: FolderItem[];
  files: FileItem[];
};

export async function getFolderContent(
  folderId: string,
): Promise<FolderContentResponse> {
  const response = await apiFetch(
    `${config.api.url}/folders/${folderId}/content`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch folder children");
  }

  const data = (await response.json()) as {
    folders: FolderItemPayload[];
    files: FileItemPayload[];
  };

  return {
    folders: data.folders.map(normalizeFolderItem),
    files: data.files.map(normalizeFileItem),
  };
}

export async function uploadFiles(
  files: File[],
  folderId: string,
): Promise<FileItem[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("folder", folderId);

  const response = await apiFetch(`${config.api.url}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload files");
  }

  const data = (await response.json()) as FileItemPayload[];
  return data.map(normalizeFileItem);
}

export function getFileDownloadUrl(fileId: string) {
  return `${config.api.url}/files/${fileId}/download`;
}

export function getArchiveDownloadUrl(jobId: string) {
  return `${config.api.url}/downloads/${jobId}/file`;
}

export type FolderPathResponse = {
  path: {
    id: string;
    name: string;
  }[];
};

export async function getFolderPath(
  folderId: string,
): Promise<FolderPathResponse> {
  const response = await apiFetch(`${config.api.url}/folders/${folderId}/path`);

  if (!response.ok) {
    throw new Error("Failed to fetch folder path");
  }

  return response.json();
}

export type DownloadItem = {
  kind: "file" | "folder";
  id: string;
};

export type CreateDownloadResponse = {
  type: string;
  jobId: string;
  status: string;
};

export async function createDownload(
  items: DownloadItem[],
): Promise<CreateDownloadResponse> {
  const response = await apiFetch(`${config.api.url}/downloads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error("Failed to create download");
  }

  return response.json();
}

export type DownloadJobResponse = {
  id: string;
  status: "pending" | "processing" | "ready" | "failed" | "expired";
  progress: number;
  errorMessage: string | null;
  expiresAt: string | null;
};

export async function getDownloadJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<DownloadJobResponse> {
  const response = await apiFetch(`${config.api.url}/downloads/${jobId}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch download job");
  }

  return response.json();
}

export async function renameFile(
  fileId: string,
  newName: string,
): Promise<FileItem> {
  const response = await apiFetch(`${config.api.url}/files/${fileId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename file");
  }

  const data = (await response.json()) as FileItemPayload;
  return normalizeFileItem(data);
}

export async function renameFolder(
  folderId: string,
  newName: string,
): Promise<FolderItem> {
  const response = await apiFetch(`${config.api.url}/folders/${folderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename folder");
  }

  const data = (await response.json()) as FolderItemPayload;
  return normalizeFolderItem(data);
}

export async function deleteFile(fileId: string): Promise<void> {
  const response = await apiFetch(`${config.api.url}/files/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const response = await apiFetch(`${config.api.url}/folders/${folderId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete folder");
  }
}

export type SearchResult = {
  items: StorageItem[];
};

export async function searchItems(query: string): Promise<SearchResult> {
  const response = await apiFetch(
    `${config.api.url}/storage/search?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to search items");
  }

  const data = (await response.json()) as { items: StorageItemPayload[] };
  return { items: data.items.map(normalizeStorageItem) };
}

export type MoveStorageItem = {
  kind: "file" | "folder";
  id: string;
};

export type MoveStorageItemsResponse = {
  moved: MoveStorageItem[];
  destinationFolderId: string;
};

export async function moveStorageItems(
  items: MoveStorageItem[],
  destinationFolderId: string,
): Promise<MoveStorageItemsResponse> {
  const response = await apiFetch(`${config.api.url}/storage/move`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items, destinationFolderId }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
      conflicts?: { name: string }[];
    } | null;
    const conflictNames = Array.from(
      new Set(data?.conflicts?.map((conflict) => conflict.name) ?? []),
    );
    const conflictDetails = conflictNames.length
      ? `: ${conflictNames.map((name) => `"${name}"`).join(", ")}`
      : "";
    throw new HttpError(
      `${data?.error ?? "Failed to move items"}${conflictDetails}`,
      response.status,
    );
  }

  return response.json();
}

export type FolderResponse = {
  id: string;
  name: string;
  parentFolder: {
    id: string;
    name: string;
  };
  createdAt: Date;
};

export async function getFolder(
  folderId: string,
  signal?: AbortSignal,
): Promise<FolderResponse> {
  const response = await apiFetch(`${config.api.url}/folders/${folderId}`, {
    signal,
  });

  if (!response.ok) {
    throw new HttpError("Failed to fetch folder", response.status);
  }

  const data = (await response.json()) as Omit<FolderResponse, "createdAt"> & {
    createdAt: SerializedDate;
  };

  return { ...data, createdAt: normalizeApiDate(data.createdAt) };
}

export type FileResponse = {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  folder: {
    id: string;
    name: string;
  };
  createdAt: Date;
};

export async function getFileById(
  fileId: string,
  signal?: AbortSignal,
): Promise<FileResponse> {
  const response = await apiFetch(`${config.api.url}/files/${fileId}`, {
    signal,
  });

  if (!response.ok) {
    throw new HttpError("Failed to fetch file", response.status);
  }

  const data = (await response.json()) as Omit<FileResponse, "createdAt"> & {
    createdAt: SerializedDate;
  };

  return { ...data, createdAt: normalizeApiDate(data.createdAt) };
}

export function getFileRawUrl(fileId: string) {
  return `${config.api.url}/files/${fileId}/raw`;
}

export function getFileThumbnailUrl(fileId: string) {
  return `${config.api.url}/files/${fileId}/thumbnail`;
}

export type TrashContentResponse = {
  items: TrashItem[];
};

export async function getTrashContent(): Promise<TrashContentResponse> {
  const response = await apiFetch(`${config.api.url}/trash`);

  if (!response.ok) {
    throw new Error("Failed to fetch trash");
  }

  const data = (await response.json()) as { items: TrashItemPayload[] };
  return { items: data.items.map(normalizeTrashItem) };
}

export async function restoreTrashItem(
  kind: "file" | "folder",
  id: string,
): Promise<void> {
  const resource = kind === "file" ? "files" : "folders";
  const response = await apiFetch(
    `${config.api.url}/trash/${resource}/${id}/restore`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to restore item");
  }
}

export async function permanentlyDeleteTrashItem(
  kind: "file" | "folder",
  id: string,
): Promise<void> {
  const resource = kind === "file" ? "files" : "folders";
  const response = await apiFetch(`${config.api.url}/trash/${resource}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to permanently delete item");
  }
}

export async function emptyTrash(): Promise<void> {
  const response = await apiFetch(`${config.api.url}/trash`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to empty trash");
  }
}
