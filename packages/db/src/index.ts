import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "./run-migrations.js";
import * as schemas from "./schema/index.js";

export { getAppliedMigrationCount, runMigrations } from "./run-migrations.js";

/**
 * Initializes the local database file and automatically runs all migrations.
 *
 * @param absoluteDbPath The physical path where the .db file should be stored.
 */
export function initDb(absoluteDbPath: string) {
  const sqlite = new Database(absoluteDbPath);

  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");

  runMigrations(sqlite);

  const { relations, ...schema } = schemas;

  return drizzle({
    client: sqlite,
    schema,
    relations,
  });
}

export type DbInstance = ReturnType<typeof initDb>;
