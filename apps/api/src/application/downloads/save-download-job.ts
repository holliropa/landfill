import { createFiles } from "@/application/files/create-files";
import { cleanupFiles } from "@/infrastructure/filesystem/cleanup-files";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import { getDownloadJob } from "./get-download-job";
import { getJobFilePath } from "./get-job-file-path";

export type SaveDownloadJobResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        mimeType: string;
        size: number;
        folderId: string | null;
        createdAt: Date;
      };
    }
  | {
      success: false;
      code:
        | "JOB_NOT_FOUND"
        | "JOB_NOT_READY"
        | "ARCHIVE_MISSING"
        | "INVALID_NAME"
        | "FOLDER_NOT_FOUND"
        | "DATABASE_ERROR";
    };

export async function saveDownloadJob(params: {
  jobId: string;
  name: string;
  folderId: string;
}): Promise<SaveDownloadJobResult> {
  const name = normalizeZipName(params.name);
  if (!name) return { success: false, code: "INVALID_NAME" };

  const jobResult = await getDownloadJob(params.jobId);
  if (!jobResult.success) return { success: false, code: "JOB_NOT_FOUND" };

  const job = jobResult.data;
  if (job.status !== "ready" || !job.fileName) {
    return { success: false, code: "JOB_NOT_READY" };
  }
  if (job.expiresAt && job.expiresAt.getTime() <= Date.now()) {
    return { success: false, code: "ARCHIVE_MISSING" };
  }

  const sourcePath = getJobFilePath(job.fileName);
  const diskName = randomUUID();
  let registered = false;

  try {
    const sourceStat = await fs.promises.stat(sourcePath);
    if (!sourceStat.isFile()) {
      return { success: false, code: "ARCHIVE_MISSING" };
    }

    await fs.promises.copyFile(
      sourcePath,
      getFilePath(diskName),
      fs.constants.COPYFILE_EXCL,
    );
    const createResult = await createFiles(
      [
        {
          originalName: name,
          filename: diskName,
          size: sourceStat.size,
          mimeType: "application/zip",
        },
      ],
      params.folderId,
    );
    if (!createResult.success) return createResult;

    registered = true;
    return { success: true, data: createResult.data[0] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { success: false, code: "ARCHIVE_MISSING" };
    }

    console.error(`Could not save archive job ${params.jobId}:`, error);
    return { success: false, code: "DATABASE_ERROR" };
  } finally {
    if (!registered) cleanupFiles([diskName]);
  }
}

function normalizeZipName(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /[\\/\u0000-\u001f]/.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.toLowerCase().endsWith(".zip")
    ? trimmed
    : `${trimmed}.zip`;
  return normalized.length <= 255 ? normalized : null;
}
