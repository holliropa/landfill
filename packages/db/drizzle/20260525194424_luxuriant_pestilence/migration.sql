CREATE TABLE `download_job_item` (
	`id` text PRIMARY KEY,
	`item_kind` text NOT NULL,
	`item_id` text NOT NULL,
	`job_id` text NOT NULL,
	CONSTRAINT `fk_download_job_item_job_id_download_jobs_id_fk` FOREIGN KEY (`job_id`) REFERENCES `download_jobs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `download_jobs` (
	`id` text PRIMARY KEY,
	`status` text NOT NULL,
	`file_name` text,
	`progress` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `download_job_item_job_id_idx` ON `download_job_item` (`job_id`);