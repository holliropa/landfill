import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";

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

export async function searchItems(req: Request, res: Response) {
  const { query } = req.query as { query?: string };

  if (!query) return res.status(200).json([]);

  try {
    const matchedFiles = await prisma.file.findMany({
      where: {
        originalName: { contains: query ?? "" },
      },
      select: {
        id: true,
        originalName: true,
        createdAt: true,
        size: true,
        mimeType: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const matchedFolders = await prisma.folder.findMany({
      where: {
        name: { contains: query ?? "" },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        parentFolder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

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
