import {
  AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,

} from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

export const folders = sqliteTable(
  "folders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    name: text("name").notNull(),

    parentFolderId: text("parent_folder_id").references(
      (): AnySQLiteColumn => folders.id,
      {
        onDelete: "cascade",
      },
    ),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("folders_parent_folder_id_idx").on(table.parentFolderId)],
);

export const files = sqliteTable(
  "files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    originalName: text("original_name").notNull(),
    diskName: text("disk_name").notNull(),
    size: integer("size").notNull(),
    mimeType: text("mime_type").notNull(),

    folderId: text("folder_id").references((): AnySQLiteColumn => folders.id, {
      onDelete: "cascade",
    }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("files_folder_id_idx").on(table.folderId),
  ],
);
