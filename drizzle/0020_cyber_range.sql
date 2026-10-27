-- Cyber Range stack duels (owner direction, 26 October 2026). Everything here is Range state only: points, tiers,
-- badges, stacks and deck schedules. Nothing reads or writes course progress, and the operator's callsign stands in
-- for the learner's name everywhere in the Range. Visitors without an account play with state kept in the browser
-- for the visit; these tables hold only signed-in learners' records. Account deletion removes them (server/account-deletion.js).
CREATE TABLE range_operators (
 account_id TEXT PRIMARY KEY REFERENCES reader_accounts(id),
 callsign TEXT NOT NULL COLLATE NOCASE,
 base TEXT NOT NULL,
 glow TEXT NOT NULL,
 mark TEXT NOT NULL,
 stack TEXT NOT NULL DEFAULT '[]',
 lifetime_points INTEGER NOT NULL DEFAULT 0,
 callsign_changed_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX range_operators_callsign ON range_operators(callsign);
--> statement-breakpoint
CREATE TABLE range_system_progress (
 account_id TEXT NOT NULL REFERENCES reader_accounts(id),
 system TEXT NOT NULL,
 cards_reviewed INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY (account_id, system)
);
--> statement-breakpoint
CREATE TABLE range_badges (
 account_id TEXT NOT NULL REFERENCES reader_accounts(id),
 resident TEXT NOT NULL,
 earned_at TEXT NOT NULL,
 wins INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY (account_id, resident)
);
--> statement-breakpoint
CREATE TABLE range_points (
 account_id TEXT NOT NULL REFERENCES reader_accounts(id),
 week TEXT NOT NULL,
 points INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY (account_id, week)
);
--> statement-breakpoint
CREATE INDEX range_points_week ON range_points(week, points);
--> statement-breakpoint
CREATE TABLE range_results (
 id TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES reader_accounts(id),
 mode TEXT NOT NULL,
 outcome TEXT NOT NULL,
 points INTEGER NOT NULL,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX range_results_account ON range_results(account_id, created_at);
--> statement-breakpoint
CREATE TABLE range_cards (
 account_id TEXT NOT NULL REFERENCES reader_accounts(id),
 question_id TEXT NOT NULL,
 system TEXT NOT NULL,
 interval_days INTEGER NOT NULL DEFAULT 0,
 due_at TEXT NOT NULL,
 reviews INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL,
 PRIMARY KEY (account_id, question_id)
);
--> statement-breakpoint
CREATE TABLE range_daily (
 account_id TEXT NOT NULL REFERENCES reader_accounts(id),
 day TEXT NOT NULL,
 correct INTEGER NOT NULL,
 PRIMARY KEY (account_id, day)
);
