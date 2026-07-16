import { createQueueRedisConnection } from "@/infrastructure/redis";
import { Queue } from "bullmq";
import {
  conversionJobName,
  ConversionJobName,
  conversionQueueName,
  ConvertImageJobData,
  ConvertImageJobResult,
} from "./types";

export const conversionQueue = new Queue<
  ConvertImageJobData,
  ConvertImageJobResult,
  ConversionJobName
>(conversionQueueName, {
  connection: createQueueRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 60 * 60, count: 100 },
    removeOnFail: { age: 24 * 60 * 60, count: 100 },
  },
});

export function addImageConversionJob(data: ConvertImageJobData) {
  return conversionQueue.add(conversionJobName.convertImage, data);
}
