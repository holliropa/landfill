import { Router } from "express";
import multer from "multer";
import {
  deleteFileHandler,
  downloadFileHandler,
  getFileByIdHandler,
  getFileThumbnailHandler,
  renameFileHandler,
  streamRawFileHandler,
  uploadFilesHandler,
} from "@/controllers/file.controller";
import config from "@/config";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storage.uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
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
