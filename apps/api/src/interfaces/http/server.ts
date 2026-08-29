import { startAuthMaintenance } from "@/application/auth/auth-maintenance";
import { initializeAuthentication } from "@/application/auth/auth-service";
import { resumeInterruptedArchiveJobs } from "@/application/downloads/archive-job-runner";
import { startDownloadMaintenance } from "@/application/downloads/download-maintenance";
import config from "@/config";
import "@/infrastructure/db";
import { createApp } from "@/interfaces/http/app";
import { pathToFileURL } from "node:url";

export async function startServer() {
  const app = createApp();
  const { host, port } = config.server;

  await initializeAuthentication();
  await resumeInterruptedArchiveJobs();
  const stopAuthMaintenance = startAuthMaintenance();
  const stopDownloadMaintenance = startDownloadMaintenance();

  const server = app.listen(port, host, () => {
    console.log(`Landfill API listening on http://${host}:${port}`);
  });

  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[Server] Received ${signal}; shutting down...`);
    stopAuthMaintenance();
    stopDownloadMaintenance();

    server.close((error) => {
      if (error) {
        console.error("[Server] Shutdown failed:", error);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  return server;
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  void startServer().catch((error) => {
    console.error("[Server] Startup failed:", error);
    process.exitCode = 1;
  });
}
