import "dotenv/config";
import { mkdirSync } from "fs";
import path from "path";

const { DATA_DIR, HOST, PORT } = process.env;

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
