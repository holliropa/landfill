import { HttpError, useFile, useFolder } from "@/lib/client";
import {
  createFileDetailsModel,
  createFolderDetailsModel,
  createSelectionDetailsModel,
  type StorageDetailsModel,
} from "./storageDetailsModel";
import type { StorageDetailsTarget } from "./storageDetailsTarget";

export function useStorageDetails(
  target: StorageDetailsTarget,
): StorageDetailsModel {
  const fileId = target.type === "file" ? target.id : "";
  const folderId = target.type === "folder" ? target.id : "";
  const fileQuery = useFile(fileId, { enabled: target.type === "file" });
  const folderQuery = useFolder(folderId, {
    enabled: target.type === "folder",
  });

  if (target.type === "none") {
    return { status: "empty" };
  }

  if (target.type === "selection") {
    return createSelectionDetailsModel(target.items);
  }

  const fallbackTitle = target.snapshot?.name ?? `Loading ${target.type}…`;

  if (target.type === "file") {
    if (fileQuery.data) {
      return createFileDetailsModel(fileQuery.data);
    }

    if (fileQuery.isError) {
      return {
        status: "error",
        kind: "file",
        title: target.snapshot.name,
        message: getDetailsErrorMessage("file", fileQuery.error),
        retry: () => {
          void fileQuery.refetch();
        },
      };
    }

    return {
      status: "loading",
      kind: "file",
      title: fallbackTitle,
    };
  }

  if (folderQuery.data) {
    return createFolderDetailsModel(folderQuery.data);
  }

  if (folderQuery.isError) {
    return {
      status: "error",
      kind: "folder",
      title: target.snapshot?.name ?? "Folder unavailable",
      message: getDetailsErrorMessage("folder", folderQuery.error),
      retry: () => {
        void folderQuery.refetch();
      },
    };
  }

  return {
    status: "loading",
    kind: "folder",
    title: fallbackTitle,
  };
}

function getDetailsErrorMessage(kind: "file" | "folder", error: Error): string {
  if (error instanceof HttpError && error.status === 404) {
    return `This ${kind} no longer exists or is not available.`;
  }

  return `The ${kind} details could not be loaded. Check your connection and try again.`;
}
