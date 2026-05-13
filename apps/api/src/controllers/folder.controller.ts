import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { FolderService } from "@/services/folder.service";
import { FileService } from "@/services/file.service";

export async function getFolder(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id || id === "root") {
    return res.json({
      id: "root",
      name: "root",
      parentFolderId: null,
      createdAt: null,
    });
  }

  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        parentFolder: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    return res.json({
      ...folder,
      parentFolder: folder.parentFolder
        ? folder.parentFolder
        : {
            id: "root",
            name: "root",
          },
    });
  } catch (error) {
    console.log("Error fetching folder: ", error);
    res.status(500).json({ error: "Failed to fetch folder" });
  }
}

export async function createFolder(req: Request, res: Response) {
  const { name, parentFolder } = req.body as {
    name: string;
    parentFolder: string;
  };

  if (!name.trim())
    return res.status(400).json({ error: "Folder name is required" });

  try {
    const normalizedParentFolderId =
      parentFolder === "root" ? null : parentFolder;

    if (normalizedParentFolderId) {
      const parentFolderExists = await prisma.folder.findUnique({
        where: { id: normalizedParentFolderId },
        select: { id: true },
      });

      if (!parentFolderExists) {
        return res.status(404).json({ error: "Parent folder not found" });
      }
    }

    const sameNameExists = await prisma.folder.findFirst({
      where: {
        name,
        parentFolderId: normalizedParentFolderId,
      },
      select: { id: true },
    });

    if (sameNameExists) {
      return res
        .status(400)
        .json({ error: "Folder with the same name already exists" });
    }

    const newFolder = await prisma.folder.create({
      data: {
        name,
        parentFolderId: normalizedParentFolderId,
      },
    });

    if (!newFolder) {
      return res.status(400).json({ error: "Failed to create folder" });
    }

    res.status(201).json(newFolder);
  } catch (error) {
    console.log("Error creating folder: ", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
}

export async function getFolderContent(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  try {
    const folderId = id === "root" ? null : id;

    const folders = await prisma.folder.findMany({
      where: { parentFolderId: folderId },
      select: {
        id: true,
        name: true,
        parentFolderId: true,
        createdAt: true,
      },
    });
    const files = await prisma.file.findMany({
      where: { folderId },
      select: {
        id: true,
        originalName: true,
        size: true,
        mimeType: true,
        createdAt: true,
      },
    });

    return res.json({
      folders,
      files: files.map(({ originalName, ...file }) => ({
        ...file,
        name: originalName,
      })),
    });
  } catch (error) {
    console.log("Error fetching folder children: ", error);
    res.status(500).json({ error: "Failed to fetch folder children" });
  }
}

export async function getFolderPath(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) return res.status(400).json({ error: "Folder ID is required" });

  if (id === "root") return res.json({ path: [{ id: "root", name: "root" }] });

  try {
    const path: Array<{ id: string; name: string }> = [];

    let current = await prisma.folder.findUnique({
      where: { id },
      select: { id: true, name: true, parentFolderId: true },
    });

    if (!current) {
      return res.status(404).json({ error: "Folder not found" });
    }

    while (current) {
      path.push({ id: current.id, name: current.name });

      if (!current.parentFolderId) break;

      current = await prisma.folder.findUnique({
        where: { id: current.parentFolderId },
        select: { id: true, name: true, parentFolderId: true },
      });
    }

    path.reverse();

    return res.json({ path: [{ id: "root", name: "root" }, ...path] });
  } catch (error) {
    console.log("Error fetching folder path: ", error);
    res.status(500).json({ error: "Failed to fetch folder path" });
  }
}

export async function renameFolder(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { name } = req.body as { name: string };

  if (!id || !name)
    return res.status(400).json({ error: "Folder ID and name are required" });

  try {
    const folder = await prisma.folder.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, parentFolderId: true, createdAt: true },
    });

    return res.status(200).json(folder);
  } catch (error) {
    console.log("Error renaming folder: ", error);
    res.status(500).json({ error: "Failed to rename folder" });
  }
}

export async function deleteFolder(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "Folder ID is required" });
  }

  if (id === FolderService.rootFolderId) {
    return res.status(400).json({ error: "Cannot delete root folder" });
  }

  try {
    const folderIds = await FolderService.collectSubtreeIds(id);

    const filesToDelete = await prisma.file.findMany({
      where: { folderId: { in: folderIds } },
      select: { diskName: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.file.deleteMany({
        where: { folderId: { in: folderIds } },
      });

      await tx.folder.delete({
        where: { id },
      });
    });

    filesToDelete.forEach(({ diskName }) =>
      FileService.deleteFromDisk(diskName),
    );

    return res.status(204).end();
  } catch (error) {
    console.log("Error deleting folder: ", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
}
