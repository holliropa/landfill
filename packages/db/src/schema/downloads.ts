import {
  AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const downloadJobs = sqliteTable("download_jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  status: text("status", {
    enum: ["pending", "processing", "ready", "failed", "expired"],
  }).notNull(),

  fileName: text("file_name"),
  progress: integer("progress").notNull().default(0),
  errorMessage: text("error_message"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const downloadJobItems = sqliteTable(
  "download_job_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    itemKind: text("item_kind", { enum: ["file", "folder"] }).notNull(),
    itemId: text("item_id").notNull(),

    jobId: text("job_id")
      .notNull()
      .references((): AnySQLiteColumn => downloadJobs.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [index("download_job_item_job_id_idx").on(table.jobId)],
);
