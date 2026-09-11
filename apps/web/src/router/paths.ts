import { isRootFolder } from "@/utils";

export const paths = {
  folderPath: (folderId?: string) =>
    isRootFolder(folderId) ? "/folder" : `/folder/${folderId}`,
  archivePath: (fileId: string, path = "") => {
    const encodedPath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    return `/archive/${encodeURIComponent(fileId)}${encodedPath ? `/${encodedPath}` : ""}`;
  },
  labPath: (capabilityId: string, fileId: string) =>
    `/labs/${encodeURIComponent(capabilityId)}/${encodeURIComponent(fileId)}`,
  trashPath: () => "/trash",
  galleryPath: () => "/gallery",
};
