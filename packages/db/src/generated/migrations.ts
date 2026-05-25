// AUTO-GENERATED FILE - DO NOT EDIT
import type { Migration } from "../run-migrations.js";

export const migrations: Migration[] = [
  {
    tag: "20260525163630_silent_demogoblin",
    sql: "CREATE TABLE `files` (\n\t`id` text PRIMARY KEY,\n\t`original_name` text NOT NULL,\n\t`disk_name` text NOT NULL,\n\t`size` integer NOT NULL,\n\t`mime_type` text NOT NULL,\n\t`folder_id` text,\n\t`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,\n\tCONSTRAINT `fk_files_folder_id_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE\n);\n--> statement-breakpoint\nCREATE TABLE `folders` (\n\t`id` text PRIMARY KEY,\n\t`name` text NOT NULL,\n\t`parent_folder_id` text,\n\t`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,\n\tCONSTRAINT `fk_folders_parent_folder_id_folders_id_fk` FOREIGN KEY (`parent_folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE\n);\n--> statement-breakpoint\nCREATE INDEX `files_folder_id_idx` ON `files` (`folder_id`);--> statement-breakpoint\nCREATE INDEX `folders_parent_folder_id_idx` ON `folders` (`parent_folder_id`);"
  },
  {
    tag: "20260525194424_luxuriant_pestilence",
    sql: "CREATE TABLE `download_job_item` (\n\t`id` text PRIMARY KEY,\n\t`item_kind` text NOT NULL,\n\t`item_id` text NOT NULL,\n\t`job_id` text NOT NULL,\n\tCONSTRAINT `fk_download_job_item_job_id_download_jobs_id_fk` FOREIGN KEY (`job_id`) REFERENCES `download_jobs`(`id`) ON DELETE CASCADE\n);\n--> statement-breakpoint\nCREATE TABLE `download_jobs` (\n\t`id` text PRIMARY KEY,\n\t`status` text NOT NULL,\n\t`file_name` text,\n\t`progress` integer DEFAULT 0 NOT NULL,\n\t`error_message` text,\n\t`expires_at` integer,\n\t`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL\n);\n--> statement-breakpoint\nCREATE INDEX `download_job_item_job_id_idx` ON `download_job_item` (`job_id`);"
  },
];
