import { Router } from "express";
import {
  createConversionJobHandler,
  getConversionJobHandler,
} from "./conversion.controller";

const router = Router();

router.post("/", createConversionJobHandler);
router.get("/:id", getConversionJobHandler);

export default router;
