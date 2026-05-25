import { Request, Response } from "express";
import { findFilesByName, findFoldersByName } from "@/services";

type StorageItem = {
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

export async function searchItemsHandler(req: Request, res: Response) {
  const { query } = req.query as { query?: string };

  if (!query) return res.status(200).json([]);

  try {
    const filesResult = await findFilesByName(query);
    const matchedFiles = filesResult.success ? filesResult.data : [];

    const foldersResult = await findFoldersByName(query);
    const matchedFolders = foldersResult.success ? foldersResult.data : [];

    const items: StorageItem[] = [
      ...matchedFolders.map((folder) => ({
        id: folder.id,
        kind: "folder" as const,
        name: folder.name,
        createdAt: folder.createdAt,
        size: null,
        mimeType: null,
        location: {
          id: folder.parentFolder ? folder.parentFolder.id : "root",
          name: folder.parentFolder ? folder.parentFolder.name : "root",
        },
      })),
      ...matchedFiles.map((file) => ({
        id: file.id,
        kind: "file" as const,
        name: file.originalName,
        createdAt: file.createdAt,
        size: file.size,
        mimeType: file.mimeType,
        location: {
          id: file.folder ? file.folder.id : "root",
          name: file.folder ? file.folder.name : "root",
        },
      })),
    ];

    res.status(200).json({
      items,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to search items" });
  }
}
