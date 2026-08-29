import config from "@/config";
import { hashPassword, verifyPassword } from "@/domain/auth/password";
import db, { authSessions, ownerCredentials } from "@/infrastructure/db";
import { eq, lte, or } from "drizzle-orm";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const OWNER_ID = 1;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

let activeSetupCode: string | undefined;
let activeSetupCodeHash: Buffer | undefined;

export type CreatedSession = {
  token: string;
  absoluteExpiresAt: Date;
};

export async function initializeAuthentication({
  logSetupCode = true,
}: { logSetupCode?: boolean } = {}) {
  if (!isSetupRequired()) {
    clearSetupCode();
    return { setupCode: null };
  }

  if (!activeSetupCode) {
    activeSetupCode = createSetupCode();
    activeSetupCodeHash = hashSetupCode(activeSetupCode);
  }

  if (logSetupCode) {
    console.log("[Auth] Owner setup is required.");
    console.log(`[Auth] One-time setup code: ${activeSetupCode}`);
  }

  return { setupCode: activeSetupCode };
}

export function isSetupRequired() {
  const [owner] = db
    .select({ id: ownerCredentials.id })
    .from(ownerCredentials)
    .where(eq(ownerCredentials.id, OWNER_ID))
    .limit(1)
    .all();

  return !owner;
}

export async function setupOwner(setupCode: string, password: string) {
  if (!isSetupRequired()) {
    return { success: false as const, code: "ALREADY_SETUP" as const };
  }

  if (!verifySetupCode(setupCode)) {
    return { success: false as const, code: "INVALID_SETUP_CODE" as const };
  }

  const passwordHash = await hashPassword(password);
  const created = db.transaction((tx) => {
    const [existingOwner] = tx
      .select({ id: ownerCredentials.id })
      .from(ownerCredentials)
      .where(eq(ownerCredentials.id, OWNER_ID))
      .limit(1)
      .all();

    if (existingOwner) return false;

    tx.delete(authSessions).run();
    tx.insert(ownerCredentials).values({ id: OWNER_ID, passwordHash }).run();
    return true;
  });

  if (!created) {
    return { success: false as const, code: "ALREADY_SETUP" as const };
  }

  clearSetupCode();
  return { success: true as const, session: createSession() };
}

export async function loginOwner(password: string) {
  const [owner] = db
    .select({ passwordHash: ownerCredentials.passwordHash })
    .from(ownerCredentials)
    .where(eq(ownerCredentials.id, OWNER_ID))
    .limit(1)
    .all();

  if (!owner) {
    return { success: false as const, code: "SETUP_REQUIRED" as const };
  }

  if (!(await verifyPassword(password, owner.passwordHash))) {
    return { success: false as const, code: "INVALID_CREDENTIALS" as const };
  }

  return { success: true as const, session: createSession() };
}

export function authenticateSession(
  token: string | undefined,
  now = new Date(),
) {
  if (!token || !SESSION_TOKEN_PATTERN.test(token)) return false;

  const tokenHash = hashSessionToken(token);
  const [session] = db
    .select()
    .from(authSessions)
    .where(eq(authSessions.tokenHash, tokenHash))
    .limit(1)
    .all();

  if (!session) return false;

  if (session.expiresAt <= now || session.absoluteExpiresAt <= now) {
    db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash)).run();
    return false;
  }

  if (
    now.getTime() - session.lastSeenAt.getTime() >=
    config.auth.sessionRefreshIntervalMs
  ) {
    const refreshedIdleExpiry = new Date(
      Math.min(
        now.getTime() + config.auth.sessionIdleTimeMs,
        session.absoluteExpiresAt.getTime(),
      ),
    );

    db.update(authSessions)
      .set({ lastSeenAt: now, expiresAt: refreshedIdleExpiry })
      .where(eq(authSessions.tokenHash, tokenHash))
      .run();
  }

  return true;
}

export function deleteSession(token: string | undefined) {
  if (!token || !SESSION_TOKEN_PATTERN.test(token)) return;

  db.delete(authSessions)
    .where(eq(authSessions.tokenHash, hashSessionToken(token)))
    .run();
}

export function cleanupExpiredAuthSessions(now = new Date()) {
  db.delete(authSessions)
    .where(
      or(
        lte(authSessions.expiresAt, now),
        lte(authSessions.absoluteExpiresAt, now),
      ),
    )
    .run();
}

export function resetAuthentication() {
  db.transaction((tx) => {
    tx.delete(authSessions).run();
    tx.delete(ownerCredentials).where(eq(ownerCredentials.id, OWNER_ID)).run();
  });
  clearSetupCode();
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function createSession(): CreatedSession {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const absoluteExpiresAt = new Date(
    now.getTime() + config.auth.sessionAbsoluteTimeMs,
  );
  const expiresAt = new Date(
    Math.min(
      now.getTime() + config.auth.sessionIdleTimeMs,
      absoluteExpiresAt.getTime(),
    ),
  );

  db.insert(authSessions)
    .values({
      tokenHash: hashSessionToken(token),
      lastSeenAt: now,
      expiresAt,
      absoluteExpiresAt,
    })
    .run();

  return { token, absoluteExpiresAt };
}

function createSetupCode() {
  const encoded = randomBytes(18).toString("hex").toUpperCase();
  return encoded.match(/.{1,6}/g)?.join("-") ?? encoded;
}

function verifySetupCode(candidate: string) {
  if (!activeSetupCodeHash) return false;

  const candidateHash = hashSetupCode(candidate.trim().toUpperCase());
  return timingSafeEqual(candidateHash, activeSetupCodeHash);
}

function hashSetupCode(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function clearSetupCode() {
  activeSetupCode = undefined;
  activeSetupCodeHash = undefined;
}
