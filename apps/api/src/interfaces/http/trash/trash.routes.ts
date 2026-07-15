import { Router } from "express";
import {
  emptyTrashHandler,
  getTrashContentHandler,
  permanentlyDeleteFileHandler,
  permanentlyDeleteFolderHandler,
  restoreFileFromTrashHandler,
  restoreFolderFromTrashHandler,
} from "./trash.controller";

const router = Router();

router.get("/", getTrashContentHandler);
router.delete("/", emptyTrashHandler);
router.post("/files/:id/restore", restoreFileFromTrashHandler);
router.delete("/files/:id", permanentlyDeleteFileHandler);
router.post("/folders/:id/restore", restoreFolderFromTrashHandler);
router.delete("/folders/:id", permanentlyDeleteFolderHandler);

export default router;
