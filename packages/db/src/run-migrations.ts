import Database from "better-sqlite3";
import { migrations } from "./generated/migrations.js";

const migrationsTableName = "__drizzle_migrations";

export interface Migration {
  tag: string;
  sql: string;
}

interface MigrationRow {
  count: number;
}

export function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ${migrationsTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  const checkStmt = sqlite.prepare(
    `SELECT count(*) as count FROM ${migrationsTableName} WHERE tag = ?`,
  );
  const insertStmt = sqlite.prepare(
    `INSERT INTO ${migrationsTableName} (tag) VALUES (?)`,
  );

  for (const migration of migrations) {
    const row = checkStmt.get(migration.tag) as MigrationRow | undefined;
    const isApplied = (row?.count ?? 0) > 0;

    if (!isApplied) {
      console.log(`[Database] Applying migration: ${migration.tag}...`);

      const runTransaction = sqlite.transaction(() => {
        sqlite.exec(migration.sql);
        insertStmt.run(migration.tag);
      });

      runTransaction();
    }
  }
}

export function getAppliedMigrationCount(sqlite: Database.Database) {
  const row = sqlite
    .prepare(`SELECT count(*) as count FROM ${migrationsTableName}`)
    .get() as MigrationRow | undefined;

  return row?.count ?? 0;
}
