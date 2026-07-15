import { Router } from "express";
import { searchItemsHandler } from "./storage.controller";

const router = Router();

router.get("/search", searchItemsHandler);

export default router;
