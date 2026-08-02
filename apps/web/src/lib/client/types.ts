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

export type TrashItem = StorageItem & {
  deletedAt: Date;
};

type ConversionFormat = "jpeg" | "png" | "webp";

export type CreateConversion = {
  source: { kind: "file"; id: string };
  target: { format: ConversionFormat };
  options?: { quality?: number };
};
