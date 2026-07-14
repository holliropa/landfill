import { createWorkerRedisConnection } from "@/lib/redis";
import { processArchiveJob } from "@/services";
import { Worker } from "bullmq";
import {
  ArchiveJobName,
  archiveQueueName,
  CreateArchiveJobData,
} from "./types";

export function createArchiveWorker() {
  const worker = new Worker<CreateArchiveJobData, void, ArchiveJobName>(
    archiveQueueName,
    async (job) => {
      await processArchiveJob(job.data.downloadJobId);
    },
    { connection: createWorkerRedisConnection(), concurrency: 1 },
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Completed archive job ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[Worker] Failed archive job ${job?.id}: ${error}`);
  });

  worker.on("error", (error) => {
    console.error(`[Worker] Archive worker error: ${error}`);
  });

  return worker;
}
