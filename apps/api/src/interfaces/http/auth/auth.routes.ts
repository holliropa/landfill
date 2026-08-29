import { Router } from "express";
import {
  getAuthStatusHandler,
  loginOwnerHandler,
  logoutOwnerHandler,
  setupOwnerHandler,
} from "./auth.controller";

const router = Router();

router.get("/status", getAuthStatusHandler);
router.post("/setup", setupOwnerHandler);
router.post("/login", loginOwnerHandler);
router.post("/logout", logoutOwnerHandler);

export default router;
