import { Router } from "express";
import {
  createFolder,
  getFolderContent,
  getFolderPath,
} from "@/controllers/folder.controller";

const router = Router();

router.post("/", createFolder);
router.get("/:id/content", getFolderContent);
router.get("/:id/path", getFolderPath);

export default router;
