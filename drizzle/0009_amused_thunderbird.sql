CREATE TABLE `community_memberships` (
	`email` text PRIMARY KEY NOT NULL,
	`joined_at` text NOT NULL,
	`source` text NOT NULL,
	`account_id` text,
	`verified_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `reader_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_memberships_account_id_unique` ON `community_memberships` (`account_id`);