import { Router } from "express";
import {
  createDownloadJobHandler,
  downloadArchiveFileHandler,
  getDownloadJobHandler,
  saveArchiveFileHandler,
} from "./download.controller";

const router = Router();

router.post("/", createDownloadJobHandler);
router.get("/:id", getDownloadJobHandler);
router.get("/:id/file", downloadArchiveFileHandler);
router.post("/:id/save", saveArchiveFileHandler);

export default router;
