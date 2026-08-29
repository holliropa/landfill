CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`absolute_expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `owner_credentials` (
	`id` integer PRIMARY KEY,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_sessions_expires_at_idx` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `auth_sessions_absolute_expires_at_idx` ON `auth_sessions` (`absolute_expires_at`);