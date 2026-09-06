import { Router } from "express";
import {
  createImagePreviewHandler,
  exportImageHandler,
  getImageSourceHandler,
} from "./image-lab.controller";

const router = Router();

router.get("/sources/:id", getImageSourceHandler);
router.post("/preview", createImagePreviewHandler);
router.post("/exports", exportImageHandler);

export default router;
