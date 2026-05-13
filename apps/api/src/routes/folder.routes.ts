import { Router } from "express";
import {
  createFolder,
  deleteFolder,
  getFolder,
  getFolderContent,
  getFolderPath,
  renameFolder,
} from "@/controllers/folder.controller";

const router = Router();

router.post("/", createFolder);
router.get("/:id/content", getFolderContent);
router.get("/:id", getFolder);
router.patch("/:id", renameFolder);
router.delete("/:id", deleteFolder);
router.get("/:id/path", getFolderPath);

export default router;
