import { authenticateSession } from "@/application/auth/auth-service";
import type { RequestHandler } from "express";
import { clearSessionCookie, readSessionCookie } from "./auth-cookies";

export const requireAuthentication: RequestHandler = (req, res, next) => {
  const token = readSessionCookie(req);
  if (authenticateSession(token)) {
    next();
    return;
  }

  if (token) clearSessionCookie(req, res);
  res.setHeader("Cache-Control", "no-store");
  res.status(401).json({ error: "Authentication required" });
};

export const requireSameOrigin: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  if (!origin) {
    next();
    return;
  }

  const host = req.get("host");
  if (!host) {
    res.status(403).json({ error: "Request origin could not be verified" });
    return;
  }

  const expectedOrigin = new URL(`${req.protocol}://${host}`).origin;
  if (origin !== expectedOrigin) {
    res.status(403).json({ error: "Cross-origin request rejected" });
    return;
  }

  next();
};
