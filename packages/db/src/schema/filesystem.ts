import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  AnySQLiteColumn,
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const storageBlobs = sqliteTable(
  "storage_blobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    diskName: text("disk_name").notNull(),
    size: integer("size").notNull(),
    mimeType: text("mime_type").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [uniqueIndex("storage_blobs_disk_name_idx").on(table.diskName)],
);

export const storageEntries = sqliteTable(
  "storage_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    kind: text("kind", { enum: ["file", "folder"] }).notNull(),
    name: text("name").notNull(),

    parentId: text("parent_id").references(
      (): AnySQLiteColumn => storageEntries.id,
      { onDelete: "cascade" },
    ),

    blobId: text("blob_id").references((): AnySQLiteColumn => storageBlobs.id),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),

    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("storage_entries_parent_id_idx").on(table.parentId),
    index("storage_entries_parent_id_deleted_at_idx").on(
      table.parentId,
      table.deletedAt,
    ),
    index("storage_entries_blob_id_idx").on(table.blobId),
    check(
      "storage_entries_kind_blob_check",
      sql`(${table.kind} = 'folder' AND ${table.blobId} IS NULL) OR (${table.kind} = 'file' AND ${table.blobId} IS NOT NULL)`,
    ),
  ],
);
