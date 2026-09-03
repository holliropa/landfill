CREATE TABLE `storage_blobs` (
	`id` text PRIMARY KEY,
	`disk_name` text NOT NULL,
	`size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `storage_entries` (
	`id` text PRIMARY KEY,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`blob_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_storage_entries_parent_id_storage_entries_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `storage_entries`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_storage_entries_blob_id_storage_blobs_id_fk` FOREIGN KEY (`blob_id`) REFERENCES `storage_blobs`(`id`),
	CONSTRAINT "storage_entries_kind_blob_check" CHECK((`kind` = 'folder' AND `blob_id` IS NULL) OR (`kind` = 'file' AND `blob_id` IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `storage_blobs` (`id`, `disk_name`, `size`, `mime_type`, `created_at`)
SELECT `id`, `disk_name`, `size`, `mime_type`, `created_at`
FROM `files`;
--> statement-breakpoint
INSERT INTO `storage_entries` (`id`, `kind`, `name`, `parent_id`, `blob_id`, `created_at`, `deleted_at`)
SELECT `id`, 'folder', `name`, NULL, NULL, `created_at`, `deleted_at`
FROM `folders`;
--> statement-breakpoint
UPDATE `storage_entries`
SET `parent_id` = (
	SELECT `parent_folder_id`
	FROM `folders`
	WHERE `folders`.`id` = `storage_entries`.`id`
)
WHERE `kind` = 'folder';
--> statement-breakpoint
INSERT INTO `storage_entries` (`id`, `kind`, `name`, `parent_id`, `blob_id`, `created_at`, `deleted_at`)
SELECT `id`, 'file', `original_name`, `folder_id`, `id`, `created_at`, `deleted_at`
FROM `files`;
--> statement-breakpoint
CREATE TABLE `__new_download_job_item` (
	`id` text PRIMARY KEY,
	`entry_id` text NOT NULL,
	`job_id` text NOT NULL,
	CONSTRAINT `fk_download_job_item_entry_id_storage_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `storage_entries`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_download_job_item_job_id_download_jobs_id_fk` FOREIGN KEY (`job_id`) REFERENCES `download_jobs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_download_job_item` (`id`, `entry_id`, `job_id`)
SELECT `id`, `item_id`, `job_id`
FROM `download_job_item`
WHERE (`item_kind` = 'file' AND EXISTS (
	SELECT 1 FROM `files` WHERE `files`.`id` = `download_job_item`.`item_id`
)) OR (`item_kind` = 'folder' AND EXISTS (
	SELECT 1 FROM `folders` WHERE `folders`.`id` = `download_job_item`.`item_id`
));
--> statement-breakpoint
DROP TABLE `download_job_item`;
--> statement-breakpoint
ALTER TABLE `__new_download_job_item` RENAME TO `download_job_item`;
--> statement-breakpoint
CREATE INDEX `download_job_item_job_id_idx` ON `download_job_item` (`job_id`);
--> statement-breakpoint
CREATE INDEX `download_job_item_entry_id_idx` ON `download_job_item` (`entry_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `storage_blobs_disk_name_idx` ON `storage_blobs` (`disk_name`);
--> statement-breakpoint
CREATE INDEX `storage_entries_parent_id_idx` ON `storage_entries` (`parent_id`);
--> statement-breakpoint
CREATE INDEX `storage_entries_parent_id_deleted_at_idx` ON `storage_entries` (`parent_id`, `deleted_at`);
--> statement-breakpoint
CREATE INDEX `storage_entries_blob_id_idx` ON `storage_entries` (`blob_id`);
--> statement-breakpoint
DROP TABLE `files`;
--> statement-breakpoint
DROP TABLE `folders`;
