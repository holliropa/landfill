import { Router } from "express";
import {
  createDownloadJob,
  downloadArchiveFile,
  getDownloadJob,
} from "@/controllers/download.controller";

const router = Router();

router.post("/", createDownloadJob);
router.get("/:id", getDownloadJob);
router.get("/:id/file", downloadArchiveFile);

export default router;
