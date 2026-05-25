import { Router } from "express";
import {
  createFolderHandler,
  deleteFolderHandler,
  getFolderHandler,
  getFolderContentHandler,
  getFolderPathHandler,
  renameFolderHandler,
} from "@/controllers/folder.controller";

const router = Router();

router.post("/", createFolderHandler);
router.get("/:id/content", getFolderContentHandler);
router.get("/:id", getFolderHandler);
router.patch("/:id", renameFolderHandler);
router.delete("/:id", deleteFolderHandler);
router.get("/:id/path", getFolderPathHandler);

export default router;
