import path from "path";
import * as fs from "fs";
import { prisma } from "@/lib/prisma";
import archiver from "archiver";
import { FileService } from "@/services/file.service";

const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");

function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}

export type DownloadItem = {
  kind: "file" | "folder";
  id: string;
};

type ArchiveEntry = {
  filePath: string;
  archivePath: string;
};

export const DownloadService = {
  async createDownloadJob(items: DownloadItem[]) {
    return prisma.downloadJob.create({
      data: {
        status: "pending",
        items: {
          create: items.map((item) => ({
            itemKind: item.kind,
            itemId: item.id,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  },

  getArchivePath(filePath: string) {
    return path.join(DOWNLOAD_DIR, filePath);
  },

  async processArchiveJob(jobId: string) {
    ensureDownloadDir();

    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        progress: 5,
        errorMessage: null,
        fileName: `download-${jobId}.zip`,
      },
    });

    const job = await prisma.downloadJob.findUnique({
      where: { id: jobId },
      include: { items: true },
    });

    if (!job) throw new Error("Job not found");

    const entries = await this.collectEntries(
      job.items.map((item) => ({
        kind: item.itemKind,
        id: item.itemId,
      })),
    );

    if (entries.length === 0) {
      throw new Error("No files to download");
    }

    const diskName = `${jobId}.zip`;

    const archivePath = path.join(DOWNLOAD_DIR, diskName);

    await this.writeZip(entries, archivePath, async (progress) => {
      await prisma.downloadJob.update({
        where: { id: jobId },
        data: { progress },
      });
    });

    await prisma.downloadJob.update({
      where: { id: jobId },
      data: {
        status: "ready",
        progress: 100,
        filePath: diskName,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  },

  async collectEntries(items: DownloadItem[]) {
    const archiveEntries: ArchiveEntry[] = [];

    for (const item of items) {
      if (item.kind === "file") {
        const file = await prisma.file.findUnique({
          where: { id: item.id },
          select: {
            originalName: true,
            diskName: true,
          },
        });

        if (!file) continue;

        archiveEntries.push({
          filePath: FileService.getFilePath(file.diskName),
          archivePath: file.originalName,
        });
      } else {
        const folderEntries = await this.collectFolderEntries(item.id);
        archiveEntries.push(...folderEntries);
      }
    }

    return archiveEntries;
  },

  async collectFolderEntries(
    folderId: string,
    basePath = "",
  ): Promise<ArchiveEntry[]> {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, name: true },
    });

    if (!folder) return [];

    const folderPath = basePath ? `${basePath}/${folder.name}` : folder.name;

    const files = await prisma.file.findMany({
      where: { folderId: folder.id },
      select: {
        originalName: true,
        diskName: true,
      },
    });

    const childFolders = await prisma.folder.findMany({
      where: { parentFolderId: folder.id },
      select: { id: true, name: true },
    });

    const archiveEntries: ArchiveEntry[] = [];

    if (files.length === 0 && childFolders.length === 0) {
      archiveEntries.push({
        filePath: "",
        archivePath: `${folderPath}/`,
      });
    }

    for (const file of files) {
      archiveEntries.push({
        filePath: FileService.getFilePath(file.diskName),
        archivePath: `${folderPath}/${file.originalName}`,
      });
    }

    for (const childFolder of childFolders) {
      const nested = await this.collectFolderEntries(
        childFolder.id,
        folderPath,
      );
      archiveEntries.push(...nested);
    }

    return archiveEntries;
  },

  async writeZip(
    entries: ArchiveEntry[],
    archivePath: string,
    onProgress?: (progress: number) => Promise<void>,
  ) {
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(archivePath);
      const archive = archiver("zip", { zlib: { level: 0 } });

      output.on("close", () => resolve());
      archive.on("error", reject);
      archive.pipe(output);

      const total = entries.length;
      let processed = 0;

      for (const entry of entries) {
        if (entry.archivePath.endsWith("/")) {
          archive.append("", { name: entry.archivePath });
        } else if (fs.existsSync(entry.filePath)) {
          archive.file(entry.filePath, { name: entry.archivePath });
        }

        processed += 1;

        if (onProgress) {
          const progress = Math.min(
            95,
            20 + Math.round((processed / total) * 75),
          );
          void onProgress(progress);
        }
      }

      void archive.finalize();
    });
  },

  async cleanupExpiredJobs() {
    const now = new Date();

    const expiredJobs = await prisma.downloadJob.findMany({
      where: {
        status: "ready",
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        filePath: true,
      },
    });

    for (const job of expiredJobs) {
      try {
        if (job.filePath && fs.existsSync(this.getArchivePath(job.filePath))) {
          fs.unlinkSync(this.getArchivePath(job.filePath));
        }

        await prisma.downloadJob.update({
          where: { id: job.id },
          data: {
            status: "expired",
            filePath: null,
          },
        });
      } catch (error) {
        console.error(`Failed to cleanup expired job ${job.id}: ${error}`);
      }
    }
  },
};
