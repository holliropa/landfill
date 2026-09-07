import { Router } from "express";
import {
  listImagesHandler,
  moveItemsHandler,
  searchItemsHandler,
} from "./storage.controller";

const router = Router();

router.get("/search", searchItemsHandler);
router.get("/images", listImagesHandler);
router.get("/media", listImagesHandler);
router.post("/move", moveItemsHandler);

export default router;
