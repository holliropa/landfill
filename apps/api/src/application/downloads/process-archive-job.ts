import db, { downloadJobs } from "@/infrastructure/db";
import path from "path";
import config from "@/config";
import fs from "fs";
import { ZipArchive } from "archiver";
import { eq } from "drizzle-orm";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { isFileInActiveTree } from "@/application/storage/trash-visibility";
import { getFile } from "@/application/files/get-file";
import { getFolder } from "@/application/folders/get-folder";

type DownloadItem = { kind: "file" | "folder"; id: string };
type ArchiveEntry = { filePath: string; archivePath: string };

export async function markArchiveJobFailed(jobId: string, error: unknown) {
  await db
    .update(downloadJobs)
    .set({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    })
    .where(eq(downloadJobs.id, jobId));
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
    columns: { fileName: true },
    with: {
      items: {
        columns: {},
        with: { entry: { columns: { id: true, kind: true } } },
      },
    },
  });

  if (!job || !job.fileName) {
    throw new Error(`Job with ID ${jobId} not found`);
  }

  const entries = await collectEntries(
    job.items.flatMap((item) =>
      item.entry ? [{ kind: item.entry.kind, id: item.entry.id }] : [],
    ),
  );

  if (entries.length === 0) {
    throw new Error("No files to download");
  }

  const archivePath = path.join(config.storage.downloadsDir, job.fileName);
  await writeZip(entries, archivePath, async (progress) => {
    await db
      .update(downloadJobs)
      .set({ progress })
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
      if (!(await isFileInActiveTree(fileResult.data))) continue;

      archiveEntries.push({
        filePath: getFilePath(fileResult.data.diskName),
        archivePath: fileResult.data.originalName,
      });
    } else {
      archiveEntries.push(...(await collectFolderEntries(item.id)));
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
  const children = await db.query.storageEntries.findMany({
    where: {
      parentId: folderResult.data.id,
      deletedAt: { isNull: true },
    },
    with: { blob: { columns: { diskName: true } } },
  });
  const archiveEntries: ArchiveEntry[] = [];

  if (children.length === 0) {
    archiveEntries.push({ filePath: "", archivePath: `${folderPath}/` });
  }

  for (const child of children) {
    if (child.kind === "file" && child.blob) {
      archiveEntries.push({
        filePath: getFilePath(child.blob.diskName),
        archivePath: `${folderPath}/${child.name}`,
      });
    } else if (child.kind === "folder") {
      archiveEntries.push(
        ...(await collectFolderEntries(child.id, folderPath)),
      );
    }
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
    const archive = new ZipArchive({ zlib: { level: 0 } });
    const progressUpdates: Promise<void>[] = [];

    output.on("close", async () => {
      try {
        await Promise.all(progressUpdates);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
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
        progressUpdates.push(onProgress(progress));
      }
    }

    void archive.finalize();
  });
}
