CREATE TABLE `app_email_enrollments` (
	`account_id` text NOT NULL,
	`sequence` text NOT NULL,
	`consent_at` text NOT NULL,
	`consent_version` text NOT NULL,
	`consent_text` text NOT NULL,
	`state` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`account_id`, `sequence`),
	FOREIGN KEY (`account_id`) REFERENCES `reader_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `reader_sessions` ADD `client_kind` text DEFAULT 'browser' NOT NULL;