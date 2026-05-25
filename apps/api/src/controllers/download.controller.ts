import { Request, Response } from "express";
import { stat } from "fs/promises";
import {
  createDownloadJob,
  DownloadJobItem,
  getDownloadJob,
  getJobFilePath,
  startArchiveJob,
} from "@/services";

export async function createDownloadJobHandler(req: Request, res: Response) {
  const { items } = req.body as { items?: DownloadJobItem[] };

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items provided" });
  }

  const createJobResult = await createDownloadJob(items);

  if (!createJobResult.success) {
    switch (createJobResult.code) {
      case "NO_ITEMS_PROVIDED":
        return res.status(400).json({ message: "No items provided" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ message: "Unknown error" });
    }
  }

  void startArchiveJob(createJobResult.data.id);

  return res.status(202).json({
    type: "archive",
    jobId: createJobResult.data.id,
    status: createJobResult.data.status,
  });
}

export async function getDownloadJobHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  const downloadJobResult = await getDownloadJob(id);

  if (!downloadJobResult.success) {
    switch (downloadJobResult.code) {
      case "NOT_FOUND":
        return res.status(404).json({ message: "Download job not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ message: "Unknown error" });
    }
  }

  return res.status(200).json(downloadJobResult.data);
}

export async function downloadArchiveFileHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  const downloadJobResult = await getDownloadJob(id);

  if (!downloadJobResult.success) {
    switch (downloadJobResult.code) {
      case "NOT_FOUND":
        return res.status(404).json({ message: "Download job not found" });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ message: "Unknown error" });
    }
  }

  const job = downloadJobResult.data;

  if (job.status !== "ready") {
    return res.status(400).json({ message: "Download job is not ready" });
  }

  if (!job.fileName) {
    return res.status(400).json({ message: "Archive file not found" });
  }

  if (job.expiresAt && job.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "Download expired" });
  }

  const archivePath = getJobFilePath(job.fileName);

  try {
    const archiveStat = await stat(archivePath);

    if (!archiveStat.isFile()) {
      return res.status(404).json({ message: "Archive file not found" });
    }
  } catch (error) {
    console.error(`Archive file missing for job ${job.id}:`, error);
    return res.status(404).json({ message: "Archive file not found" });
  }

  console.log(
    `Starting file download for job ${job.id} with file: ${job.fileName} and path: ${archivePath}`,
  );

  return res.download(
    archivePath,
    job.fileName,
    { dotfiles: "allow" },
    (err) => {
      if (err) {
        console.error("Error during file download:", err);
        if (!res.headersSent) {
          return res.status(500).json({ message: "Error downloading file" });
        }
      }
    },
  );
}
