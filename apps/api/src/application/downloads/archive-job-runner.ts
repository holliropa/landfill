import {
  markArchiveJobFailed,
  processArchiveJob,
} from "@/application/downloads/process-archive-job";
import db, { downloadJobs } from "@/infrastructure/db";
import { eq, or } from "drizzle-orm";

const scheduledJobIds = new Set<string>();
let queueTail = Promise.resolve();

/**
 * Runs archive jobs one at a time in the API process. Download jobs and their
 * inputs remain in SQLite, so interrupted work can be resumed on startup.
 */
export function enqueueArchiveJob(downloadJobId: string) {
  if (scheduledJobIds.has(downloadJobId)) return;

  scheduledJobIds.add(downloadJobId);
  queueTail = queueTail.then(
    () => runArchiveJob(downloadJobId),
    () => runArchiveJob(downloadJobId),
  );
}

export async function resumeInterruptedArchiveJobs() {
  const interruptedJobs = await db
    .select({ id: downloadJobs.id })
    .from(downloadJobs)
    .where(
      or(
        eq(downloadJobs.status, "pending"),
        eq(downloadJobs.status, "processing"),
      ),
    );

  for (const job of interruptedJobs) {
    enqueueArchiveJob(job.id);
  }
}

export function waitForArchiveJobs() {
  return queueTail;
}

async function runArchiveJob(downloadJobId: string) {
  try {
    await processArchiveJob(downloadJobId);
    console.log(`[Downloads] Prepared archive job ${downloadJobId}`);
  } catch (error) {
    console.error(`[Downloads] Archive job ${downloadJobId} failed:`, error);

    try {
      await markArchiveJobFailed(downloadJobId, error);
    } catch (statusError) {
      console.error(
        `[Downloads] Could not mark archive job ${downloadJobId} as failed:`,
        statusError,
      );
    }
  } finally {
    scheduledJobIds.delete(downloadJobId);
  }
}
