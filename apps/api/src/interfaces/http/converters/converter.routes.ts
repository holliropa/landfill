import {
  getConversionTargetsHandler,
  listConvertersHandler,
} from "./converter.controller";
import { Router } from "express";

const router = Router();

router.get("/", listConvertersHandler);
router.get("/targets", getConversionTargetsHandler);

export default router;
