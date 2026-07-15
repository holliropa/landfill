import express from "express";
import cors from "cors";
import fileRoutes from "@/interfaces/http/files/file.routes";
import folderRoutes from "@/interfaces/http/folders/folder.routes";
import downloadRoutes from "@/interfaces/http/downloads/download.routes";
import storageRoutes from "@/interfaces/http/search/storage.routes";
import trashRoutes from "@/interfaces/http/trash/trash.routes";
import config from "@/config";
import "@/infrastructure/db";
import { cleanupExpiredJobs } from "@/application/downloads/cleanup-expired-jobs";

const app = express();
const host = config.server.host;
const port = config.server.port;

app.use(cors());
app.use(express.json());

app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/trash", trashRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

void cleanupExpiredJobs();
setInterval(
  () => {
    void cleanupExpiredJobs();
  },
  1000 * 60 * 10,
);

app.listen(port, host, () => {
  console.log(`API listening on http://${host}:${port}`);
});
