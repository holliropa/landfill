import express from "express";
import "dotenv/config";
import cors from "cors";
import fileRoutes from "@/routes/file.routes";
import folderRoutes from "@/routes/folder.routes";
import downloadRoutes from "@/routes/download.routes";
import { DownloadService } from "@/services/download.service";
import storageRoutes from "@/routes/storage.routes";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

app.use(cors());
app.use(express.json());

app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/storage", storageRoutes);

void DownloadService.cleanupExpiredJobs();
setInterval(
  () => {
    void DownloadService.cleanupExpiredJobs();
  },
  1000 * 60 * 10,
);

app.listen(port, host, () => {
  console.log(`API listening on http://${host}:${port}`);
});
