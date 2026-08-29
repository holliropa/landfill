import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const ownerCredentials = sqliteTable("owner_credentials", {
  id: integer("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    absoluteExpiresAt: integer("absolute_expires_at", {
      mode: "timestamp_ms",
    }).notNull(),
  },
  (table) => [
    index("auth_sessions_expires_at_idx").on(table.expiresAt),
    index("auth_sessions_absolute_expires_at_idx").on(table.absoluteExpiresAt),
  ],
);
