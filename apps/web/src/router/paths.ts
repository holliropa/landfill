import { isRootFolder } from "@/utils";

export const paths = {
  folderPath: (folderId?: string) =>
    isRootFolder(folderId) ? "/folder" : `/folder/${folderId}`,
};
