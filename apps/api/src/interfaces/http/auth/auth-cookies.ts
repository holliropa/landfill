import config from "@/config";
import type { CreatedSession } from "@/application/auth/auth-service";
import type { CookieOptions, Request, Response } from "express";

export const SESSION_COOKIE_NAME = "landfill_session";

export function readSessionCookie(req: Request) {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 0) continue;

    const name = part.slice(0, separatorIndex).trim();
    if (name !== SESSION_COOKIE_NAME) continue;

    try {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function setSessionCookie(
  req: Request,
  res: Response,
  session: CreatedSession,
) {
  res.cookie(SESSION_COOKIE_NAME, session.token, {
    ...getCookieOptions(req),
    expires: session.absoluteExpiresAt,
  });
}

export function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, getCookieOptions(req));
}

function getCookieOptions(req: Request): CookieOptions {
  const secure =
    config.auth.cookieSecure === "auto" ? req.secure : config.auth.cookieSecure;

  return {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
  };
}
