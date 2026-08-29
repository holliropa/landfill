import "dotenv/config";
import { mkdirSync } from "fs";
import path from "path";

const { COOKIE_SECURE, DATA_DIR, HOST, PORT, TRUST_PROXY } = process.env;

function parseTrustProxy(value: string | undefined) {
  if (value === undefined || value === "" || value === "0") return false;

  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 1) {
    throw new Error("TRUST_PROXY must be a positive integer or 0.");
  }

  return hops;
}

function parseCookieSecure(value: string | undefined) {
  const normalized = value?.toLowerCase() ?? "auto";
  if (normalized === "auto") return "auto" as const;
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  throw new Error('COOKIE_SECURE must be "auto", "true", or "false".');
}

const dataDir = DATA_DIR ? path.resolve(DATA_DIR) : process.cwd();
const databaseDir = path.resolve(dataDir, "database");
const databasePath = path.join(databaseDir, "main.db");

const storageDir = path.resolve(dataDir, "storage");
const uploadsDir = path.resolve(storageDir, "uploads");
const downloadsDir = path.resolve(storageDir, "downloads");

for (const dir of [
  dataDir,
  databaseDir,
  storageDir,
  uploadsDir,
  downloadsDir,
]) {
  mkdirSync(dir, { recursive: true });
}

export default {
  server: {
    host: HOST ?? "127.0.0.1",
    port: Number(PORT ?? 3000),
    trustProxy: parseTrustProxy(TRUST_PROXY),
  },

  auth: {
    cookieSecure: parseCookieSecure(COOKIE_SECURE),
    sessionIdleTimeMs: 7 * 24 * 60 * 60 * 1000,
    sessionAbsoluteTimeMs: 30 * 24 * 60 * 60 * 1000,
    sessionRefreshIntervalMs: 60 * 60 * 1000,
  },

  storage: {
    downloadExpireTimeMs: 60 * 60 * 1000,
    dataDir,
    storageDir,
    uploadsDir,
    downloadsDir,
  },

  database: {
    path: databasePath,
    url: `file:${databasePath}`,
  },
} as const;
