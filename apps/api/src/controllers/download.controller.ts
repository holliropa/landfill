import { Request, Response } from "express";
import { DownloadItem, DownloadService } from "@/services/download.service";
import { prisma } from "@/lib/prisma";

export async function createDownloadJob(req: Request, res: Response) {
  const { items } = req.body as { items?: DownloadItem[] };

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items provided" });
  }

  try {
    const job = await DownloadService.createDownloadJob(items);

    void DownloadService.processArchiveJob(job.id).catch(async (error) => {
      console.error("Error processing download job:", error);

      await prisma.downloadJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    });

    return res.status(202).json({
      type: "archive",
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error("Error creating download job:", error);
    return res.status(500).json({ message: "Failed to create download" });
  }
}

export async function getDownloadJob(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  try {
    const job = await prisma.downloadJob.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        progress: true,
        errorMessage: true,
        expiresAt: true,
      },
    });

    if (!job) {
      return res.status(404).json({ message: "Download job not found" });
    }

    return res.json(job);
  } catch (error) {
    console.error("Error fetching download job:", error);
    return res.status(500).json({ message: "Failed to fetch download job" });
  }
}

export async function downloadArchiveFile(req: Request, res: Response) {
  const { id } = req.params as { id: string };

  try {
    const job = await prisma.downloadJob.findUnique({
      where: { id },
      select: {
        status: true,
        expiresAt: true,
        filePath: true,
        fileName: true,
      },
    });

    if (!job) {
      return res.status(404).json({ message: "Download job not found" });
    }

    if (job.status !== "ready") {
      return res.status(400).json({ message: "Download job is not ready" });
    }

    if (!job.filePath || !job.fileName) {
      return res.status(400).json({ message: "Archive file not found" });
    }

    if (job.expiresAt && job.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Download expired" });
    }

    return res.download(
      DownloadService.getArchivePath(job.filePath),
      job.fileName,
    );
  } catch (error) {
    console.error("Error downloading archive file:", error);
    return res.status(500).json({ message: "Failed to download archive file" });
  }
}
