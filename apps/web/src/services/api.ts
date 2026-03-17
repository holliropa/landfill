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
