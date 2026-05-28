import express from "express";
import cors from "cors";
import fileRoutes from "@/routes/file.routes";
import folderRoutes from "@/routes/folder.routes";
import downloadRoutes from "@/routes/download.routes";
import storageRoutes from "@/routes/storage.routes";
import config from "@/config";
import "@/lib/db";
import { cleanupExpiredJobs } from "@/services";

const app = express();
const host = config.server.host;
const port = config.server.port;

app.use(cors());
app.use(express.json());

app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/storage", storageRoutes);

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
