CREATE TABLE `career_records` (
	`id` text PRIMARY KEY NOT NULL,
	`request_hash` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`answers` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`next_check_in` text,
	`owner_notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_career_records_created_at` ON `career_records` (`created_at`);--> statement-breakpoint
CREATE TABLE `career_submission_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `career_notifications` (
	`record_id` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`first_attempt_at` text,
	`last_attempt_at` text,
	`provider_id` text,
	`error` text,
	FOREIGN KEY (`record_id`) REFERENCES `career_records`(`id`) ON UPDATE no action ON DELETE no action
);
