import { Router } from "express";
import {
  createDownloadJobHandler,
  downloadArchiveFileHandler,
  getDownloadJobHandler,
} from "@/controllers/download.controller";

const router = Router();

router.post("/", createDownloadJobHandler);
router.get("/:id", getDownloadJobHandler);
router.get("/:id/file", downloadArchiveFileHandler);

export default router;
