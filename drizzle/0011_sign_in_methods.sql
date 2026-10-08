-- 0010 (founding waitlist) was applied to production outside this repository; numbering continues at 0011.
CREATE TABLE `reader_identities` (
	`provider` text NOT NULL,
	`subject` text NOT NULL,
	`account_id` text NOT NULL,
	`email` text,
	`created_at` text NOT NULL,
	`last_used_at` text,
	PRIMARY KEY(`provider`, `subject`),
	FOREIGN KEY (`account_id`) REFERENCES `reader_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reader_identities_account` ON `reader_identities` (`account_id`);--> statement-breakpoint
CREATE TABLE `reader_passkeys` (
	`credential_id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`public_key` text NOT NULL,
	`algorithm` integer NOT NULL,
	`sign_count` integer DEFAULT 0 NOT NULL,
	`transports` text,
	`label` text,
	`created_at` text NOT NULL,
	`last_used_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `reader_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reader_passkeys_account` ON `reader_passkeys` (`account_id`);--> statement-breakpoint
CREATE TABLE `reader_auth_flows` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`expires_at` text NOT NULL
);
