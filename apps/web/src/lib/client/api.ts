import type { FileItem, FolderItem } from "@/types";
import type { StorageItem } from "./types";

const DEFAULT_API_ORIGIN = `${window.location.protocol}//${window.location.hostname}:3000`;

export const API_URL = `${import.meta.env.VITE_API_URL ?? DEFAULT_API_ORIGIN}/api`;

export async function createFolder(
  name: string,
  parentFolderId: string,
): Promise<FolderItem> {
  const response = await fetch(`${API_URL}/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, parentFolder: parentFolderId }),
  });

  if (!response.ok) {
    throw new Error("Failed to create folder");
  }

  return response.json();
}

export type FolderContentResponse = {
  folders: FolderItem[];
  files: FileItem[];
};

export async function getFolderContent(
  folderId: string,
): Promise<FolderContentResponse> {
  const response = await fetch(`${API_URL}/folders/${folderId}/content`);

  if (!response.ok) {
    throw new Error("Failed to fetch folder children");
  }

  return response.json();
}

export async function uploadFiles(
  files: File[],
  folderId: string,
): Promise<FileItem[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("folder", folderId);

  const response = await fetch(`${API_URL}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload files");
  }

  return response.json();
}

export function getFileDownloadUrl(fileId: string) {
  return `${API_URL}/files/${fileId}/download`;
}

export function getArchiveDownloadUrl(jobId: string) {
  return `${API_URL}/downloads/${jobId}/file`;
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
  const response = await fetch(`${API_URL}/folders/${folderId}/path`);

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
  const response = await fetch(`${API_URL}/downloads`, {
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
): Promise<DownloadJobResponse> {
  const response = await fetch(`${API_URL}/downloads/${jobId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch download job");
  }

  return response.json();
}

export async function renameFile(
  fileId: string,
  newName: string,
): Promise<FileItem> {
  const response = await fetch(`${API_URL}/files/${fileId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename file");
  }

  return response.json();
}

export async function renameFolder(
  folderId: string,
  newName: string,
): Promise<FolderItem> {
  const response = await fetch(`${API_URL}/folders/${folderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename folder");
  }

  return response.json();
}

export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`${API_URL}/files/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const response = await fetch(`${API_URL}/folders/${folderId}`, {
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
  const response = await fetch(`${API_URL}/storage/search?query=${query}`);

  if (!response.ok) {
    throw new Error("Failed to search items");
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

export async function getFolder(folderId: string): Promise<FolderResponse> {
  const response = await fetch(`${API_URL}/folders/${folderId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch folder");
  }

  return response.json();
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

export async function getFileById(fileId: string): Promise<FileResponse> {
  const response = await fetch(`${API_URL}/files/${fileId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch file");
  }

  return response.json();
}

export function getFileRawUrl(fileId: string) {
  return `${API_URL}/files/${fileId}/raw`;
}

export function getFileThumbnailUrl(fileId: string) {
  return `${API_URL}/files/${fileId}/thumbnail`;
}
