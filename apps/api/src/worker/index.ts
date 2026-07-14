import "dotenv/config";
import config from "@/config";
import { createArchiveWorker } from "@/jobs/archive/processor";

const workers = [createArchiveWorker()];

console.log(`[Worker] Started with Redis ${config.redis.url}`);

async function shutdown() {
  console.log("[Worker] Shutting down...");
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
