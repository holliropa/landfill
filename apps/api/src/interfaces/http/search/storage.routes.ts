import { Router } from "express";
import { moveItemsHandler, searchItemsHandler } from "./storage.controller";

const router = Router();

router.get("/search", searchItemsHandler);
router.post("/move", moveItemsHandler);

export default router;
