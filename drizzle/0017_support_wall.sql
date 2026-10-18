-- Pay-what-you-can support on the homepage community panel (17 October 2026, owner request).
-- support_wall holds only the display names supporters chose to list, after Stripe confirms payment.
-- To take a name off the wall: UPDATE support_wall SET hidden=1 WHERE display_name='…';
CREATE TABLE IF NOT EXISTS `support_wall` (
	`session_id` text PRIMARY KEY NOT NULL,
	`subscription_id` text,
	`display_name` text NOT NULL,
	`monthly` integer DEFAULT 0 NOT NULL,
	`hidden` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `support_wall_created_idx` ON `support_wall` (`created_at`);
CREATE INDEX IF NOT EXISTS `support_wall_subscription_idx` ON `support_wall` (`subscription_id`);
CREATE TABLE IF NOT EXISTS `support_checkout_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` text NOT NULL
);
