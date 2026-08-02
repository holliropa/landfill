import type { FileItem, FolderItem } from "@/types";
import type { CreateConversion, StorageItem, TrashItem } from "./types";
import config from "@/config";

export async function createFolder(
  name: string,
  parentFolderId: string,
): Promise<FolderItem> {
  const response = await fetch(`${config.api.url}/folders`, {
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
  const response = await fetch(`${config.api.url}/folders/${folderId}/content`);

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

  const response = await fetch(`${config.api.url}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload files");
  }

  return response.json();
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
  const response = await fetch(`${config.api.url}/folders/${folderId}/path`);

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
  const response = await fetch(`${config.api.url}/downloads`, {
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
  const response = await fetch(`${config.api.url}/downloads/${jobId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch download job");
  }

  return response.json();
}

export async function renameFile(
  fileId: string,
  newName: string,
): Promise<FileItem> {
  const response = await fetch(`${config.api.url}/files/${fileId}`, {
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
  const response = await fetch(`${config.api.url}/folders/${folderId}`, {
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
  const response = await fetch(`${config.api.url}/files/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const response = await fetch(`${config.api.url}/folders/${folderId}`, {
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
  const response = await fetch(
    `${config.api.url}/storage/search?query=${query}`,
  );

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
  const response = await fetch(`${config.api.url}/folders/${folderId}`);

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
  const response = await fetch(`${config.api.url}/files/${fileId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch file");
  }

  return response.json();
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
  const response = await fetch(`${config.api.url}/trash`);

  if (!response.ok) {
    throw new Error("Failed to fetch trash");
  }

  return response.json();
}

export async function restoreTrashItem(
  kind: "file" | "folder",
  id: string,
): Promise<void> {
  const resource = kind === "file" ? "files" : "folders";
  const response = await fetch(
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
  const response = await fetch(`${config.api.url}/trash/${resource}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to permanently delete item");
  }
}

export async function emptyTrash(): Promise<void> {
  const response = await fetch(`${config.api.url}/trash`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to empty trash");
  }
}

export type ConversionTarget = {
  format: "jpeg" | "png" | "webp";
  extension: string;
  mimeType: string;
  label: string;
};

export type ConversionTargetResponse = {
  targets: ConversionTarget[];
};

export async function getConversionTargets(
  fileId: string,
): Promise<ConversionTargetResponse> {
  const response = await fetch(
    `${config.api.url}/converters/targets?fileId=${encodeURIComponent(fileId)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch conversion targets");
  }

  return response.json();
}

export type ConversionJobResponse = {
  id: string;
  status: string;
  progress: number;
  result: { fileId: string; name: string } | null;
  failedReason: string | null;
};

export async function getConversionJob(
  id: string,
): Promise<ConversionJobResponse> {
  const response = await fetch(`${config.api.url}/conversions/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch conversion job");
  }

  return response.json();
}

export type CreateConversionJobResponse = {
  id: string;
  status: string;
};

export async function createConversionJob(
  input: CreateConversion,
): Promise<CreateConversionJobResponse> {
  const response = await fetch(`${config.api.url}/conversions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create conversion job");
  }

  return response.json();
}
