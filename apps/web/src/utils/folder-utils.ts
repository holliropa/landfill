export const ROOT_FOLDER_ID = "root";

export function isRootFolder(folderId?: string | null): boolean {
  return !folderId || folderId === ROOT_FOLDER_ID;
}
