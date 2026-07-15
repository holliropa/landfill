import { Request, Response } from "express";
import { deleteFromDisk } from "@/infrastructure/filesystem/delete-from-disk";
import { emptyTrash } from "@/application/trash/empty-trash";
import { getTrashContent } from "@/application/trash/get-trash-content";
import { permanentlyDeleteFile } from "@/application/trash/permanently-delete-file";
import { permanentlyDeleteFolder } from "@/application/trash/permanently-delete-folder";
import { restoreFileFromTrash } from "@/application/trash/restore-file-from-trash";
import { restoreFolderFromTrash } from "@/application/trash/restore-folder-from-trash";

export async function getTrashContentHandler(req: Request, res: Response) {
  const result = await getTrashContent();

  if (!result.success) {
    return res.status(500).json({ error: "Failed to fetch trash" });
  }

  return res.status(200).json(result.data);
}

export async function restoreFileFromTrashHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) return res.status(400).json({ error: "File ID is required" });

  const result = await restoreFileFromTrash(id);

  if (!result.success) {
    switch (result.code) {
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "FILE_NOT_IN_TRASH":
        return res.status(409).json({ error: "File is not in trash" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to restore file" });
    }
  }

  return res.status(200).json(result.data);
}

export async function restoreFolderFromTrashHandler(
  req: Request,
  res: Response,
) {
  const { id } = req.params as { id: string };

  if (!id) return res.status(400).json({ error: "Folder ID is required" });

  const result = await restoreFolderFromTrash(id);

  if (!result.success) {
    switch (result.code) {
      case "FOLDER_NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "FOLDER_NOT_IN_TRASH":
        return res.status(409).json({ error: "Folder is not in trash" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to restore folder" });
    }
  }

  return res.status(200).json(result.data);
}

export async function permanentlyDeleteFileHandler(
  req: Request,
  res: Response,
) {
  const { id } = req.params as { id: string };

  if (!id) return res.status(400).json({ error: "File ID is required" });

  const result = await permanentlyDeleteFile(id);

  if (!result.success) {
    switch (result.code) {
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "FILE_NOT_IN_TRASH":
        return res.status(409).json({ error: "File is not in trash" });
      case "DATABASE_ERROR":
      default:
        return res
          .status(500)
          .json({ error: "Failed to permanently delete file" });
    }
  }

  deleteFromDisk(result.data.diskName);

  return res.status(204).end();
}

export async function permanentlyDeleteFolderHandler(
  req: Request,
  res: Response,
) {
  const { id } = req.params as { id: string };

  if (!id) return res.status(400).json({ error: "Folder ID is required" });

  const result = await permanentlyDeleteFolder(id);

  if (!result.success) {
    switch (result.code) {
      case "FOLDER_NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "FOLDER_NOT_IN_TRASH":
        return res.status(409).json({ error: "Folder is not in trash" });
      case "DATABASE_ERROR":
      default:
        return res
          .status(500)
          .json({ error: "Failed to permanently delete folder" });
    }
  }

  result.data.affectedFiles.forEach((file) => deleteFromDisk(file.diskName));

  return res.status(204).end();
}

export async function emptyTrashHandler(req: Request, res: Response) {
  const result = await emptyTrash();

  if (!result.success) {
    return res.status(500).json({ error: "Failed to empty trash" });
  }

  result.data.affectedFiles.forEach((file) => deleteFromDisk(file.diskName));

  return res.status(204).end();
}
