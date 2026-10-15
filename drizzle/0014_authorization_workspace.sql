-- Authorization Workspace, 15 October 2026: each learner's practice systems, modeled on how eMASS and
-- Xacta 360 manage an authorization. A system record (profile and categorization as JSON), the selected
-- controls with implementation and assessment results, the Body of Evidence, the POA&M, authorization
-- packages with their review and decision, and an audit trail. Account deletion removes all of it
-- (server/account-deletion.js); the foreign keys cascade as a second line of defense.
CREATE TABLE `auth_systems` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL REFERENCES `reader_accounts`(`id`) ON DELETE CASCADE,
	`profile` text NOT NULL,
	`current_decision` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_systems_account` ON `auth_systems` (`account_id`);
--> statement-breakpoint
CREATE TABLE `auth_controls` (
	`system_id` text NOT NULL REFERENCES `auth_systems`(`id`) ON DELETE CASCADE,
	`control_id` text NOT NULL,
	`implementation_status` text DEFAULT 'planned' NOT NULL,
	`provider` text,
	`narrative` text DEFAULT '' NOT NULL,
	`responsible` text DEFAULT '' NOT NULL,
	`frequency` text DEFAULT 'annual' NOT NULL,
	`step` text DEFAULT 'draft' NOT NULL,
	`results` text DEFAULT '{}' NOT NULL,
	`assessor_notes` text DEFAULT '' NOT NULL,
	`return_comment` text,
	`reassess_reason` text,
	`last_assessed_at` text,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`system_id`, `control_id`)
);
--> statement-breakpoint
CREATE TABLE `auth_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL REFERENCES `auth_systems`(`id`) ON DELETE CASCADE,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`package_role` text DEFAULT 'none' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`version` text DEFAULT '1.0' NOT NULL,
	`artifact_date` text,
	`controls` text DEFAULT '[]' NOT NULL,
	`review_state` text DEFAULT 'draft' NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_artifacts_system` ON `auth_artifacts` (`system_id`);
--> statement-breakpoint
CREATE TABLE `auth_poam` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL REFERENCES `auth_systems`(`id`) ON DELETE CASCADE,
	`number` integer NOT NULL,
	`control_id` text,
	`weakness` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'assessment' NOT NULL,
	`severity` text DEFAULT 'CAT II' NOT NULL,
	`residual_risk` text DEFAULT 'moderate' NOT NULL,
	`mitigations` text DEFAULT '' NOT NULL,
	`resources` text DEFAULT '' NOT NULL,
	`poc` text DEFAULT '' NOT NULL,
	`scheduled_completion` text,
	`milestones` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'ongoing' NOT NULL,
	`comments` text DEFAULT '' NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_poam_number` ON `auth_poam` (`system_id`,`number`);
--> statement-breakpoint
CREATE TABLE `auth_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL REFERENCES `auth_systems`(`id`) ON DELETE CASCADE,
	`type` text NOT NULL,
	`stage` text DEFAULT 'draft' NOT NULL,
	`executive_summary` text DEFAULT '' NOT NULL,
	`assessor_summary` text DEFAULT '' NOT NULL,
	`review` text,
	`decision` text,
	`snapshot` text,
	`submitted_at` text,
	`decided_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_packages_system` ON `auth_packages` (`system_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `auth_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`system_id` text NOT NULL REFERENCES `auth_systems`(`id`) ON DELETE CASCADE,
	`at` text NOT NULL,
	`role` text NOT NULL,
	`action` text NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`detail` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_history_system` ON `auth_history` (`system_id`,`id`);
