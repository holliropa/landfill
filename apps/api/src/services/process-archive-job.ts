import db, { downloadJobs } from "@/lib/db";
import path from "path";
import config from "@/config";
import fs from "fs";
import archiver from "archiver";
import { eq } from "drizzle-orm";
import { getFilePath } from "./get-file-path";
import { getFile } from "./get-file";
import { getFolder } from "./get-folder";

type DownloadItem = {
  kind: "file" | "folder";
  id: string;
};

type ArchiveEntry = {
  filePath: string;
  archivePath: string;
};

export function startArchiveJob(jobId: string) {
  void processArchiveJob(jobId).catch(async (error) => {
    console.error("Error processing download job:", error);

    await db
      .update(downloadJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(downloadJobs.id, jobId));
  });
}

export async function processArchiveJob(jobId: string) {
  await db
    .update(downloadJobs)
    .set({
      status: "processing",
      progress: 5,
      errorMessage: null,
      fileName: `download-${jobId}.zip`,
    })
    .where(eq(downloadJobs.id, jobId));

  const job = await db.query.downloadJobs.findFirst({
    where: { id: jobId },
    columns: {
      fileName: true,
    },
    with: {
      items: {
        columns: {
          itemId: true,
          itemKind: true,
        },
      },
    },
  });

  if (!job || !job.fileName) {
    throw new Error(`Job with ID ${jobId} not found`);
  }

  const entries = await collectEntries(
    job.items.map((item) => ({
      kind: item.itemKind,
      id: item.itemId,
    })),
  );

  if (entries.length === 0) {
    throw new Error("No files to download");
  }

  const archivePath = path.join(config.storage.downloadsDir, job.fileName);

  await writeZip(entries, archivePath, async (progress) => {
    await db
      .update(downloadJobs)
      .set({
        progress: progress,
      })
      .where(eq(downloadJobs.id, jobId));
  });

  await db
    .update(downloadJobs)
    .set({
      status: "ready",
      progress: 100,
      expiresAt: new Date(Date.now() + config.storage.downloadExpireTimeMs),
    })
    .where(eq(downloadJobs.id, jobId));
}

async function collectEntries(items: DownloadItem[]) {
  const archiveEntries: ArchiveEntry[] = [];

  for (const item of items) {
    if (item.kind === "file") {
      const fileResult = await getFile(item.id);

      if (!fileResult.success) continue;

      archiveEntries.push({
        filePath: getFilePath(fileResult.data.diskName),
        archivePath: fileResult.data.originalName,
      });
    } else {
      const folderEntries = await collectFolderEntries(item.id);
      archiveEntries.push(...folderEntries);
    }
  }

  return archiveEntries;
}

async function collectFolderEntries(
  folderId: string,
  basePath = "",
): Promise<ArchiveEntry[]> {
  const folderResult = await getFolder(folderId);

  if (!folderResult.success) return [];

  const folderPath = basePath
    ? `${basePath}/${folderResult.data.name}`
    : folderResult.data.name;

  const files = await db.query.files.findMany({
    where: { folderId: folderResult.data.id },
    columns: {
      originalName: true,
      diskName: true,
    },
  });

  const childFolders = await db.query.folders.findMany({
    where: { parentFolderId: folderResult.data.id },
    columns: {
      id: true,
      name: true,
    },
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
      filePath: getFilePath(file.diskName),
      archivePath: `${folderPath}/${file.originalName}`,
    });
  }

  for (const childFolder of childFolders) {
    const nested = await collectFolderEntries(childFolder.id, folderPath);
    archiveEntries.push(...nested);
  }

  return archiveEntries;
}

async function writeZip(
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
}
