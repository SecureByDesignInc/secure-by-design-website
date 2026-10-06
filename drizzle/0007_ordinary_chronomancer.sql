CREATE TABLE `reader_bookmarks` (
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`saved` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `item_id`)
);
