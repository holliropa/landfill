ALTER TABLE `files` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `folders` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `files_folder_id_deleted_at_idx` ON `files` (`folder_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `folders_parent_folder_id_deleted_at_idx` ON `folders` (`parent_folder_id`,`deleted_at`);
