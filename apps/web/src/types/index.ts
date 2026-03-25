export interface StoredFile {
  id: string;
  originalName: string;
  diskName: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export type FileItem = {
  kind: "file";

  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  folderId: string | null;
};

export type FolderItem = {
  kind: "folder";

  id: string;
  name: string;
  parentFolderId: string | null;
  createdAt: Date;
};