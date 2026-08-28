import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import {
  deleteFileHandler,
  downloadFileHandler,
  getFileByIdHandler,
  getFileThumbnailHandler,
  renameFileHandler,
  streamRawFileHandler,
  uploadFilesHandler,
} from "./file.controller";
import config from "@/config";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storage.uploadsDir),
  filename: (_req, _file, cb) => cb(null, randomUUID()),
});

const upload = multer({ storage });

router.post("/", upload.array("files"), uploadFilesHandler);
router.get("/:id", getFileByIdHandler);
router.delete("/:id", deleteFileHandler);
router.patch("/:id", renameFileHandler);
router.get("/:id/raw", streamRawFileHandler);
router.get("/:id/download", downloadFileHandler);
router.get("/:id/thumbnail", getFileThumbnailHandler);

export default router;
