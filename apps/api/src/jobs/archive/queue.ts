import { createQueueRedisConnection } from "@/infrastructure/redis";
import {
  archiveJobName,
  ArchiveJobName,
  archiveQueueName,
  CreateArchiveJobData,
} from "./types";
import { Queue } from "bullmq";

export const archiveQueue = new Queue<
  CreateArchiveJobData,
  void,
  ArchiveJobName
>(archiveQueueName, {
  connection: createQueueRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 60 * 60,
      count: 100,
    },
    removeOnFail: {
      age: 24 * 60 * 60,
      count: 100,
    },
  },
});

export function addCreateArchiveJob(downloadJobId: string) {
  return archiveQueue.add(
    archiveJobName.createArchive,
    { downloadJobId },
    {
      jobId: downloadJobId,
    },
  );
}
