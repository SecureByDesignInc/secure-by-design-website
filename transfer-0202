CREATE TABLE `resource_signup_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resource_subscribers` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`consent_at` text NOT NULL,
	`consent_text` text NOT NULL,
	`confirmation_hash` text,
	`confirmation_expires_at` text,
	`confirmed_at` text,
	`unsubscribe_token` text NOT NULL,
	`unsubscribed_at` text,
	`last_requested_at` text NOT NULL,
	`send_window_start` text NOT NULL,
	`send_count` integer DEFAULT 0 NOT NULL,
	`email_state` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_resource_subscribers_status_created` ON `resource_subscribers` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_resource_subscribers_confirmation` ON `resource_subscribers` (`confirmation_hash`);--> statement-breakpoint
CREATE INDEX `idx_resource_subscribers_unsubscribe` ON `resource_subscribers` (`unsubscribe_token`);