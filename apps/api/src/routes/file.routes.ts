import { Router } from "express";
import multer from "multer";
import {
  deleteFile,
  downloadFile,
  getFileThumbnail,
  uploadFiles,
} from "@/controllers/file.controller";
import { FileService, UPLOAD_DIR } from "@/services/file.service";

const router = Router();

FileService.ensureUploadDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

router.post("/", upload.array("files"), uploadFiles);
router.delete("/:id", deleteFile);
router.get("/:id/download", downloadFile);
router.get("/:id/thumbnail", getFileThumbnail);

export default router;
