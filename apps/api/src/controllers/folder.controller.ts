import { Request, Response } from "express";
import {
  createFolder,
  deleteFolder,
  deleteFromDisk,
  getFolder,
  getFolderContent,
  getFolderPath,
  renameFolder,
} from "@/services";

export async function getFolderHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  const result = await getFolder(id);

  if (!result.success) {
    switch (result.code) {
      case "NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to fetch folder" });
    }
  }

  return res.status(200).json(result.data);
}

export async function createFolderHandler(req: Request, res: Response) {
  const { name, parentFolder } = req.body as {
    name: string;
    parentFolder: string;
  };

  const normalizedParentFolderId =
    parentFolder === "root" ? null : parentFolder;

  const result = await createFolder(name, normalizedParentFolderId);

  if (!result.success) {
    switch (result.code) {
      case "INVALID_NAME":
        return res.status(400).json({ error: "Invalid folder name" });
      case "PARENT_NOT_FOUND":
        return res.status(404).json({ error: "Parent folder not found" });
      case "DUPLICATE_NAME":
        return res
          .status(409)
          .json({ error: "Folder with the same name already exists" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Unknown error creating folder" });
    }
  }

  return res.status(201).json(result.data);
}

export async function getFolderContentHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  const folderId = id === "root" ? null : id;

  const result = await getFolderContent(folderId);

  if (!result.success) {
    switch (result.code) {
      case "FOLDER_NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.json(result.data);
}

export async function getFolderPathHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) return res.status(400).json({ error: "Folder ID is required" });

  const folderId = id === "root" ? null : id;

  const result = await getFolderPath(folderId);

  if (!result.success) {
    switch (result.code) {
      case "FOLDER_NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to fetch folder path" });
    }
  }

  return res.json({ path: result.path });
}

export async function renameFolderHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { name } = req.body as { name: string };

  if (!id || !name)
    return res.status(400).json({ error: "Folder ID and name are required" });

  const result = await renameFolder(id, name);

  if (!result.success) {
    switch (result.code) {
      case "INVALID_NAME":
        return res.status(400).json({ error: "Invalid folder name" });
      case "NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "DUPLICATE_NAME":
        return res
          .status(409)
          .json({ error: "A folder with this name already exists" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to rename folder" });
    }
  }

  return res.status(200).json(result.data);
}

export async function deleteFolderHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "Folder ID is required" });
  }

  if (id === "root") {
    return res.status(400).json({ error: "Cannot delete root folder" });
  }

  const result = await deleteFolder(id);

  if (!result.success) {
    switch (result.code) {
      case "FOLDER_NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to delete folder" });
    }
  }

  result.data.affectedFiles.forEach(({ diskName }) => deleteFromDisk(diskName));

  return res.status(204).end();
}
