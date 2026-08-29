import config from "@/config";
import downloadRoutes from "@/interfaces/http/downloads/download.routes";
import fileRoutes from "@/interfaces/http/files/file.routes";
import folderRoutes from "@/interfaces/http/folders/folder.routes";
import storageRoutes from "@/interfaces/http/search/storage.routes";
import trashRoutes from "@/interfaces/http/trash/trash.routes";
import authRoutes from "@/interfaces/http/auth/auth.routes";
import {
  requireAuthentication,
  requireSameOrigin,
} from "@/interfaces/http/auth/auth.middleware";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (config.server.trustProxy !== false) {
    app.set("trust proxy", config.server.trustProxy);
  }
  app.use(express.json({ limit: "1mb" }));
  app.use(requireSameOrigin);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use(requireAuthentication);

  app.use("/api/files", fileRoutes);
  app.use("/api/folders", folderRoutes);
  app.use("/api/downloads", downloadRoutes);
  app.use("/api/storage", storageRoutes);
  app.use("/api/trash", trashRoutes);

  const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({ error: "Route not found" });
  };

  const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    console.error("[HTTP] Unhandled request error:", error);

    if (res.headersSent) {
      next(error);
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  };

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
