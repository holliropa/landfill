import { Router } from "express";
import {
  createFolder,
  deleteFolder,
  getFolderContent,
  getFolderPath,
  renameFolder,
} from "@/controllers/folder.controller";

const router = Router();

router.post("/", createFolder);
router.get("/:id/content", getFolderContent);
router.patch("/:id", renameFolder);
router.delete("/:id", deleteFolder);
router.get("/:id/path", getFolderPath);

export default router;
