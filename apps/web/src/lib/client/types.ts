export type StorageItem = {
  id: string;
  kind: "file" | "folder";
  name: string;
  createdAt: Date;
  size: number | null;
  mimeType: string | null;
  location: {
    id: string;
    name: string;
  };
};
