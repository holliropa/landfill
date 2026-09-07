import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import {
  cancelChunkedUploadHandler,
  completeChunkedUploadHandler,
  deleteFileHandler,
  downloadFileHandler,
  getChunkedUploadStatusHandler,
  getFileByIdHandler,
  getFileThumbnailHandler,
  initChunkedUploadHandler,
  renameFileHandler,
  streamRawFileHandler,
  updateFileContentHandler,
  uploadChunkHandler,
  uploadFilesHandler,
} from "./file.controller";
import config from "@/config";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storage.uploadsDir),
  filename: (_req, _file, cb) => cb(null, randomUUID()),
});

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storage.tempUploadsDir),
  filename: (_req, _file, cb) => cb(null, randomUUID()),
});

const upload = multer({ storage });
const chunkUpload = multer({ storage: tempStorage });

router.post("/", upload.array("files"), uploadFilesHandler);
router.post("/upload/chunk-init", initChunkedUploadHandler);
router.post("/upload/chunk", chunkUpload.single("chunk"), uploadChunkHandler);
router.get("/upload/status/:uploadId", getChunkedUploadStatusHandler);
router.post("/upload/chunk-complete", completeChunkedUploadHandler);
router.delete("/upload/:uploadId", cancelChunkedUploadHandler);

router.get("/:id", getFileByIdHandler);
router.delete("/:id", deleteFileHandler);
router.patch("/:id", renameFileHandler);
router.put("/:id/content", updateFileContentHandler);
router.get("/:id/raw", streamRawFileHandler);
router.get("/:id/download", downloadFileHandler);
router.get("/:id/thumbnail", getFileThumbnailHandler);

export default router;
