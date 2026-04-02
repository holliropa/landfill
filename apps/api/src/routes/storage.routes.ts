import { Router } from "express";
import { searchItems } from "@/controllers/storage.controller";

const router = Router();

router.get("/search", searchItems);

export default router;
