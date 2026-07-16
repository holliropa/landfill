import { createStoredFile } from "@/application/files/create-stored-file";
import { getFile } from "@/application/files/get-file";
import { findConverterForTarget } from "@/domain/conversions/converter-registry";
import { runSharpImageConversion } from "@/domain/conversions/converters/shard-image.converter";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { createWorkerRedisConnection } from "@/infrastructure/redis";
import {
  ConversionJobName,
  conversionQueueName,
  ConvertImageJobData,
  ConvertImageJobResult,
} from "@/jobs/conversion/types";
import { Worker } from "bullmq";
import fs from "fs/promises";
import path from "path";

export function createConversionWorker() {
  const worker = new Worker<
    ConvertImageJobData,
    ConvertImageJobResult,
    ConversionJobName
  >(
    conversionQueueName,
    async (job) => {
      await job.updateProgress(5);

      const fileResult = await getFile(job.data.sourceFileId);

      if (!fileResult.success) {
        throw new Error("Source file not found");
      }

      const sourceFile = fileResult.data;
      const match = findConverterForTarget({
        fileName: sourceFile.originalName,
        mimeType: sourceFile.mimeType,
        targetFormat: job.data.targetFormat,
      });

      if (!match) {
        throw new Error("Unsupported conversion target");
      }

      const sourcePath = getFilePath(sourceFile.diskName);
      const outputDiskName = `${Date.now()}-${crypto.randomUUID()}.${match.target.extension}`;
      const outputPath = getFilePath(outputDiskName);

      await job.updateProgress(10);

      const conversionResult = await runSharpImageConversion({
        sourcePath,
        targetPath: outputPath,
        targetFormat: job.data.targetFormat,
        quality: job.data.quality,
      });

      await job.updateProgress(75);

      const outputStat = await fs.stat(outputPath);
      const outputOriginalName = replaceExtension(
        sourceFile.originalName,
        match.target.extension,
      );

      const createdFile = await createStoredFile({
        originalName: outputOriginalName,
        diskName: outputDiskName,
        size: outputStat.size,
        mimeType: conversionResult.mimeType,
        folderId: sourceFile.folderId,
      });

      await job.updateProgress(100);

      return {
        fileId: createdFile.id,
        name: createdFile.name,
      };
    },
    { connection: createWorkerRedisConnection(), concurrency: 1 },
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Completed conversion job ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[Worker] Failed conversion job ${job?.id}: ${error}`);
  });

  return worker;
}

function replaceExtension(fileName: string, extension: string) {
  const parsed = path.parse(fileName);
  return `${parsed.name}.${extension}`;
}
