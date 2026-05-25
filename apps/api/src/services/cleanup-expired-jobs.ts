import db, { downloadJobs } from "@/lib/db";
import { getJobFilePath } from "./get-job-file-path";
import fs from "fs";
import { eq } from "drizzle-orm";

export async function cleanupExpiredJobs() {
  const now = new Date();

  const expiredJobs = await db.query.downloadJobs.findMany({
    where: {
      status: "ready",
      expiresAt: { lte: now },
    },
    columns: {
      id: true,
      fileName: true,
    },
  });

  for (const job of expiredJobs) {
    try {
      if (job.fileName) {
        const jobFilePath = getJobFilePath(job.fileName);

        if (fs.existsSync(jobFilePath)) {
          fs.unlinkSync(jobFilePath);
        }
      }

      await db
        .update(downloadJobs)
        .set({
          status: "expired",
          fileName: null,
        })
        .where(eq(downloadJobs.id, job.id));
    } catch (error) {
      console.error(`Failed to cleanup expired job ${job.id}: ${error}`);
    }
  }
}
