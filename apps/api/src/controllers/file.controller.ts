import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { FileService } from "@/services/file.service";
import * as fs from "fs";
import sharp from "sharp";

export async function uploadFiles(req: Request, res: Response) {
  const uploadedFiles = req.files as Express.Multer.File[];
  const { folder: folderId } = req.body as { folder: string };

  if (!folderId) {
    return res.status(400).json({ error: "Folder ID is required" });
  }

  try {
    const normalizedFolderId = folderId === "root" ? null : folderId;

    if (normalizedFolderId) {
      const exists = await prisma.folder.findUnique({
        where: { id: normalizedFolderId },
        select: { id: true },
      });

      if (!exists) {
        return res.status(404).json({ error: "Folder not found" });
      }
    }

    const createPromises = uploadedFiles.map((file) =>
      prisma.file.create({
        data: {
          originalName: file.originalname,
          diskName: file.filename,
          size: file.size,
          mimeType: file.mimetype,
          folderId: normalizedFolderId,
        },
      }),
    );

    const results = await Promise.all(createPromises);
    res.status(201).json(
      results.map(({ originalName, diskName, ...file }) => ({
        ...file,
        name: originalName,
      })),
    );
  } catch (error) {
    const fileNames = uploadedFiles.map((f) => f.filename);
    FileService.cleanupFiles(fileNames);

    res.status(500).json({ error: "Upload failed" });
  }
}

export async function deleteFile(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    FileService.deleteFromDisk(file.diskName);

    await prisma.file.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting file: ", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
}

export async function downloadFile(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  try {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(FileService.getFilePath(file.diskName), file.originalName);
  } catch (error) {
    console.error("Error downloading file: ", error);
    res.status(500).json({ error: "Failed to download file" });
  }
}

export async function getFileThumbnail(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  try {
    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = FileService.getFilePath(file.diskName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Physical file missing" });
    }

    if (FileService.isImage(file.mimeType)) {
      const friendlyName = `thumb-${file.originalName}`;
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${friendlyName}"`,
      );
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=604800");

      console.log("Generating thumbnail for: ", filePath);

      return sharp(filePath)
        .resize({ width: 300, withoutEnlargement: true })
        .toFormat("jpeg")
        .jpeg({ quality: 40, progressive: true })
        .pipe(res);
    }

    res.status(415).json({ error: "No thumbnail available" });
  } catch (error) {
    console.error("Error generating thumbnail: ", error);
    res.status(500).json({ error: "Failed to generate thumbnail" });
  }
}
