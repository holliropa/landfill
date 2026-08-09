import type { FileResponse, FolderResponse } from "@/lib/client";
import type { StorageSelectionItem } from "./storageDetailsTarget";

export type StorageDetailsLocation = {
  id: string;
  name: string;
};

type StorageDetailsEmptyModel = {
  status: "empty";
};

type StorageDetailsLoadingModel = {
  status: "loading";
  kind: "file" | "folder";
  title: string;
};

type StorageDetailsErrorModel = {
  status: "error";
  kind: "file" | "folder";
  title: string;
  message: string;
  retry: () => void;
};

export type StorageFileDetailsModel = {
  status: "ready";
  kind: "file";
  id: string;
  title: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  location: StorageDetailsLocation;
};

export type StorageFolderDetailsModel = {
  status: "ready";
  kind: "folder";
  id: string;
  title: string;
  createdAt: Date;
  location: StorageDetailsLocation;
};

export type StorageSelectionDetailsModel = {
  status: "ready";
  kind: "selection";
  title: string;
  itemCount: number;
  fileCount: number;
  folderCount: number;
  knownFileSizeCount: number;
  knownFileSizeBytes: number;
  unknownFileSizeCount: number;
};

export type StorageDetailsModel =
  | StorageDetailsEmptyModel
  | StorageDetailsLoadingModel
  | StorageDetailsErrorModel
  | StorageFileDetailsModel
  | StorageFolderDetailsModel
  | StorageSelectionDetailsModel;

export function createFileDetailsModel(
  file: FileResponse,
): StorageFileDetailsModel {
  return {
    status: "ready",
    kind: "file",
    id: file.id,
    title: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    createdAt: file.createdAt,
    location: file.folder,
  };
}

export function createFolderDetailsModel(
  folder: FolderResponse,
): StorageFolderDetailsModel {
  return {
    status: "ready",
    kind: "folder",
    id: folder.id,
    title: folder.name,
    createdAt: folder.createdAt,
    location: folder.parentFolder,
  };
}

export function createSelectionDetailsModel(
  items: StorageSelectionItem[],
): StorageSelectionDetailsModel {
  let fileCount = 0;
  let folderCount = 0;
  let knownFileSizeCount = 0;
  let knownFileSizeBytes = 0;
  let unknownFileSizeCount = 0;

  for (const item of items) {
    if (item.kind === "folder") {
      folderCount += 1;
      continue;
    }

    fileCount += 1;

    if (item.size === null) {
      unknownFileSizeCount += 1;
    } else {
      knownFileSizeCount += 1;
      knownFileSizeBytes += item.size;
    }
  }

  return {
    status: "ready",
    kind: "selection",
    title: `${items.length} selected`,
    itemCount: items.length,
    fileCount,
    folderCount,
    knownFileSizeCount,
    knownFileSizeBytes,
    unknownFileSizeCount,
  };
}
