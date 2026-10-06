CREATE TABLE `community_contribution_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`request_hash` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`kind` text NOT NULL,
	`resource_url` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	`consent_text` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_community_contributions_created` ON `community_contributions` (`created_at`);--> statement-breakpoint
CREATE TABLE `community_notifications` (
	`record_id` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`first_attempt_at` text,
	`last_attempt_at` text,
	`provider_id` text,
	`error` text,
	FOREIGN KEY (`record_id`) REFERENCES `community_contributions`(`id`) ON UPDATE no action ON DELETE no action
);
