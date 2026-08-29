import {
  authenticateSession,
  deleteSession,
  isSetupRequired,
  loginOwner,
  setupOwner,
} from "@/application/auth/auth-service";
import { getPasswordValidationError } from "@/domain/auth/password";
import type { Request, Response } from "express";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "./auth-cookies";
import {
  clearAuthFailures,
  getRateLimitRetryAfterSeconds,
  recordAuthFailure,
} from "./auth-rate-limit";

export function getAuthStatusHandler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  res.vary("Cookie");

  const setupRequired = isSetupRequired();
  const token = readSessionCookie(req);
  const authenticated = !setupRequired && authenticateSession(token);
  if (token && !authenticated) clearSessionCookie(req, res);

  res.status(200).json({ setupRequired, authenticated });
}

export async function setupOwnerHandler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  const rateLimitKey = getRateLimitKey("setup", req);
  if (sendRateLimitResponse(rateLimitKey, res)) return;

  const setupCode = req.body?.setupCode;
  const password = req.body?.password;
  if (typeof setupCode !== "string") {
    res.status(400).json({ error: "Setup code is required" });
    return;
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError, code: "INVALID_PASSWORD" });
    return;
  }

  const result = await setupOwner(setupCode, password);
  if (!result.success) {
    if (result.code === "ALREADY_SETUP") {
      res.status(409).json({ error: "Owner setup is already complete" });
      return;
    }

    recordAuthFailure(rateLimitKey);
    res.status(401).json({ error: "Invalid setup code" });
    return;
  }

  clearAuthFailures(rateLimitKey);
  setSessionCookie(req, res, result.session);
  res.status(201).json({ setupRequired: false, authenticated: true });
}

export async function loginOwnerHandler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  const rateLimitKey = getRateLimitKey("login", req);
  if (sendRateLimitResponse(rateLimitKey, res)) return;

  const password = req.body?.password;
  if (typeof password !== "string" || password.length > 128) {
    recordAuthFailure(rateLimitKey);
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const result = await loginOwner(password);
  if (!result.success) {
    if (result.code === "SETUP_REQUIRED") {
      res.status(409).json({ error: "Owner setup is required" });
      return;
    }

    recordAuthFailure(rateLimitKey);
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  clearAuthFailures(rateLimitKey);
  setSessionCookie(req, res, result.session);
  res.status(200).json({ setupRequired: false, authenticated: true });
}

export function logoutOwnerHandler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  deleteSession(readSessionCookie(req));
  clearSessionCookie(req, res);
  res.status(204).end();
}

function getRateLimitKey(action: string, req: Request) {
  return `${action}:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

function sendRateLimitResponse(key: string, res: Response) {
  const retryAfter = getRateLimitRetryAfterSeconds(key);
  if (retryAfter === 0) return false;

  res.setHeader("Retry-After", retryAfter.toString());
  res.status(429).json({ error: "Too many attempts. Try again later." });
  return true;
}
