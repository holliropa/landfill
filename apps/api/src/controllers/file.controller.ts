import { Request, Response } from "express";
import * as fs from "fs";
import sharp from "sharp";
import {
  cleanupFiles,
  createFiles,
  deleteFile,
  deleteFromDisk,
  getFile,
  getFilePath,
  isImage,
  renameFile,
} from "@/services";

export async function uploadFilesHandler(req: Request, res: Response) {
  const uploadedFiles = req.files as Express.Multer.File[];
  const { folder: folderId } = req.body as { folder: string };

  if (!folderId) {
    return res.status(400).json({ error: "Folder ID is required" });
  }

  console.log(`Uploading to ${folderId}`);

  const result = await createFiles(
    uploadedFiles.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    })),
    folderId,
  );

  if (!result.success) {
    const fileNames = uploadedFiles.map((f) => f.filename);
    cleanupFiles(fileNames);

    switch (result.code) {
      case "FOLDER_NOT_FOUND":
        return res.status(404).json({ error: "Folder not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(201).json(result.data);
}

export async function deleteFileHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  const result = await deleteFile(id);

  if (!result.success) {
    switch (result.code) {
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Internal server error" });
    }
  }

  deleteFromDisk(result.data.diskName);

  return res.status(204).end();
}

export async function downloadFileHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  const result = await getFile(id);

  if (!result.success) {
    switch (result.code) {
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Internal server error" });
    }
  }

  const fileData = result.data;

  return res.download(
    getFilePath(fileData.diskName),
    fileData.originalName,
  );
}

export async function getFileThumbnailHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  const result = await getFile(id);

  if (!result.success) {
    switch (result.code) {
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Internal server error" });
    }
  }

  const fileData = result.data;

  const filePath = getFilePath(fileData.diskName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Physical file missing" });
  }

  if (isImage(fileData.mimeType)) {
    const friendlyName = `thumb-${fileData.originalName}`;
    res.setHeader("Content-Disposition", `inline; filename="${friendlyName}"`);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=604800");

    return sharp(filePath)
      .resize({ width: 300, withoutEnlargement: true })
      .toFormat("jpeg")
      .jpeg({ quality: 40, progressive: true })
      .pipe(res);
  }

  res.status(415).json({ error: "No thumbnail available" });
}

export async function getFileByIdHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  const result = await getFile(id);

  if (!result.success) {
    switch (result.code) {
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Internal server error" });
    }
  }

  const fileData = result.data;

  return res.status(200).json({
    id: fileData.id,
    name: fileData.originalName,
    sizeBytes: fileData.size,
    mimeType: fileData.mimeType,
    folder: fileData.folder
      ? fileData.folder
      : {
          id: "root",
          name: "root",
        },
    createdAt: fileData.createdAt,
  });
}

export async function renameFileHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { name } = req.body as { name: string };

  if (!id || !name) {
    return res.status(400).json({ error: "File ID and name are required" });
  }

  const result = await renameFile(id, name);

  if (!result.success) {
    switch (result.code) {
      case "INVALID_NAME":
        return res.status(400).json({ error: "Invalid file name" });
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "DUPLICATE_NAME":
        return res
          .status(409)
          .json({ error: "A file with this name already exists" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to rename file" });
    }
  }

  return res.status(200).json(result.data);
}

export async function streamRawFileHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) return res.status(400).json({ error: "File ID is required" });

  const result = await getFile(id);

  if (!result.success) {
    switch (result.code) {
      case "FILE_NOT_FOUND":
        return res.status(404).json({ error: "File not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Internal server error" });
    }
  }

  const fileData = result.data;
  const filePath = getFilePath(fileData.diskName);

  try {
    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(filePath);
    } catch {
      return res.status(404).json({ error: "Physical file missing" });
    }

    res.setHeader("Content-Type", fileData.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileData.originalName}"`,
    );
    res.setHeader("Accept-Ranges", "bytes");

    const range = req.headers.range;

    if (!range) {
      res.setHeader("Content-Length", stat.size);
      return fs.createReadStream(filePath).pipe(res);
    }

    const match = range.match(/^bytes=(\d*)-(\d*)$/);

    if (!match || (!match[1] && !match[2])) {
      res.setHeader("Content-Range", `bytes */${stat.size}`);
      return res.status(416).end();
    }

    let start: number;
    let end: number;

    if (!match[1]) {
      // bytes=-500 means last 500 bytes
      const suffixLength = Number(match[2]);
      start = Math.max(stat.size - suffixLength, 0);
      end = stat.size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : stat.size - 1;
    }

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start > end ||
      start >= stat.size
    ) {
      res.setHeader("Content-Range", `bytes */${stat.size}`);
      return res.status(416).end();
    }

    const safeEnd = Math.min(end, stat.size - 1);
    const chunkSize = safeEnd - start + 1;

    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${safeEnd}/${stat.size}`);
    res.setHeader("Content-Length", chunkSize);

    return fs.createReadStream(filePath, { start, end: safeEnd }).pipe(res);
  } catch (error) {
    console.error("Error fetching file: ", error);
    return res.status(500).json({ error: "Failed to fetch file" });
  }
}
