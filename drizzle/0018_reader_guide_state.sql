-- Interactive guide state in the learner's account (18 October 2026, owner request): the notes, checks,
-- knowledge-check answers and completed lessons from each course guide, so they follow a signed-in learner to any
-- browser and replace the old export/import record. One row per learner and guide; `state` is the guide's JSON.
CREATE TABLE IF NOT EXISTS `reader_guide_state` (
	`user_id` text NOT NULL,
	`guide_id` text NOT NULL,
	`state` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `guide_id`)
);
