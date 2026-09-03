import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { migrations } from "./generated/migrations.js";
import { runMigrations } from "./run-migrations.js";

test("the storage-entry migration preserves existing trees and jobs", () => {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  for (const migration of migrations.slice(0, -1)) {
    sqlite.exec(migration.sql);
    sqlite
      .prepare("INSERT INTO __drizzle_migrations (tag) VALUES (?)")
      .run(migration.tag);
  }

  sqlite.exec(`
    INSERT INTO folders (id, name, parent_folder_id, created_at, deleted_at)
    VALUES
      ('parent', 'Parent', NULL, 1000, NULL),
      ('child', 'Child', 'parent', 2000, NULL);

    INSERT INTO files (
      id, original_name, disk_name, size, mime_type, folder_id, created_at, deleted_at
    ) VALUES (
      'file', 'notes.txt', 'stored-notes.txt', 42, 'text/plain', 'child', 3000, 4000
    );

    INSERT INTO download_jobs (id, status, progress, created_at)
    VALUES ('job', 'pending', 0, 5000);

    INSERT INTO download_job_item (id, item_kind, item_id, job_id)
    VALUES
      ('job-item', 'file', 'file', 'job'),
      ('stale-job-item', 'file', 'missing-file', 'job');
  `);

  runMigrations(sqlite);

  assert.deepEqual(
    sqlite
      .prepare(
        "SELECT id, kind, name, parent_id, blob_id, created_at, deleted_at FROM storage_entries ORDER BY created_at",
      )
      .all(),
    [
      {
        id: "parent",
        kind: "folder",
        name: "Parent",
        parent_id: null,
        blob_id: null,
        created_at: 1000,
        deleted_at: null,
      },
      {
        id: "child",
        kind: "folder",
        name: "Child",
        parent_id: "parent",
        blob_id: null,
        created_at: 2000,
        deleted_at: null,
      },
      {
        id: "file",
        kind: "file",
        name: "notes.txt",
        parent_id: "child",
        blob_id: "file",
        created_at: 3000,
        deleted_at: 4000,
      },
    ],
  );
  assert.deepEqual(
    sqlite
      .prepare(
        "SELECT id, disk_name, size, mime_type, created_at FROM storage_blobs",
      )
      .get(),
    {
      id: "file",
      disk_name: "stored-notes.txt",
      size: 42,
      mime_type: "text/plain",
      created_at: 3000,
    },
  );
  assert.deepEqual(
    sqlite.prepare("SELECT id, entry_id, job_id FROM download_job_item").get(),
    { id: "job-item", entry_id: "file", job_id: "job" },
  );
  assert.deepEqual(sqlite.pragma("foreign_key_check"), []);

  const tableNames = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => (row as { name: string }).name);
  assert.equal(tableNames.includes("files"), false);
  assert.equal(tableNames.includes("folders"), false);

  sqlite.close();
});
