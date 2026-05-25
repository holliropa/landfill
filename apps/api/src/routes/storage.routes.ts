import { Router } from "express";
import { searchItemsHandler } from "@/controllers/storage.controller";

const router = Router();

router.get("/search", searchItemsHandler);

export default router;
