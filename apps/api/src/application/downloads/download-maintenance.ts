import { cleanupExpiredJobs } from "@/application/downloads/cleanup-expired-jobs";

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

export function startDownloadMaintenance() {
  const runCleanup = () => {
    void cleanupExpiredJobs().catch((error) => {
      console.error("[Downloads] Expired archive cleanup failed:", error);
    });
  };

  runCleanup();

  const timer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  timer.unref();

  return () => clearInterval(timer);
}
