import { Router } from "express";
import {
  browseArchiveHandler,
  downloadArchiveEntryHandler,
  extractArchiveHandler,
  getArchiveSourceHandler,
} from "./archive-lab.controller";

const router = Router();

router.get("/sources/:id", getArchiveSourceHandler);
router.get("/sources/:id/children", browseArchiveHandler);
router.get("/sources/:id/entries/:entry/content", downloadArchiveEntryHandler);
router.get("/sources/:id/entries/download", downloadArchiveEntryHandler);
router.post("/extracts", extractArchiveHandler);

export default router;
