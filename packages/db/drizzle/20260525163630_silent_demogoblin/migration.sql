CREATE TABLE `files` (
	`id` text PRIMARY KEY,
	`original_name` text NOT NULL,
	`disk_name` text NOT NULL,
	`size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`folder_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_files_folder_id_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`parent_folder_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_folders_parent_folder_id_folders_id_fk` FOREIGN KEY (`parent_folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `files_folder_id_idx` ON `files` (`folder_id`);--> statement-breakpoint
CREATE INDEX `folders_parent_folder_id_idx` ON `folders` (`parent_folder_id`);