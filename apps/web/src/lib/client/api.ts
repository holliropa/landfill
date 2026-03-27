import type { FileItem, FolderItem } from "@/types";

const API_URL = "http://localhost:3000/api";

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
