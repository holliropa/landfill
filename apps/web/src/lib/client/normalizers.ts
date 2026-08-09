import type { FileItem, FolderItem } from "@/types";
import type { StorageItem, TrashItem } from "./types";

export type SerializedDate = string | number | Date;

export type FileItemPayload = Omit<FileItem, "createdAt"> & {
  createdAt: SerializedDate;
};

export type FolderItemPayload = Omit<FolderItem, "createdAt"> & {
  createdAt: SerializedDate;
};

export type StorageItemPayload = Omit<StorageItem, "createdAt"> & {
  createdAt: SerializedDate;
};

export type TrashItemPayload = Omit<TrashItem, "createdAt" | "deletedAt"> & {
  createdAt: SerializedDate;
  deletedAt: SerializedDate;
};

export function normalizeFileItem(item: FileItemPayload): FileItem {
  return { ...item, createdAt: normalizeApiDate(item.createdAt) };
}

export function normalizeFolderItem(item: FolderItemPayload): FolderItem {
  return { ...item, createdAt: normalizeApiDate(item.createdAt) };
}

export function normalizeStorageItem(item: StorageItemPayload): StorageItem {
  return { ...item, createdAt: normalizeApiDate(item.createdAt) };
}

export function normalizeTrashItem(item: TrashItemPayload): TrashItem {
  return {
    ...item,
    createdAt: normalizeApiDate(item.createdAt),
    deletedAt: normalizeApiDate(item.deletedAt),
  };
}

export function normalizeApiDate(value: SerializedDate): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("The API returned an invalid date.");
  }

  return date;
}
