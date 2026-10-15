-- Authorization Workspace, 15 October 2026 (owner report): a learner could register the Secure By Design
-- enclave again by clicking it after the first registration, and ended up with duplicate systems.
-- Each account now keeps one enclave. `registration_key` holds 'sbd-enclave' for that system (NULL for
-- blank systems), and a unique index on (account_id, registration_key) stops a second one even when two
-- requests arrive together. SQLite allows any number of NULLs, so blank systems are unaffected.
ALTER TABLE `auth_systems` ADD `registration_key` text;
--> statement-breakpoint
-- Existing duplicates. An enclave is "untouched" when nothing was ever saved after registration: the
-- system and every control still carry the registration time, and it has no evidence, POA&M items or
-- packages. Untouched duplicates are removed; anything a learner worked on is kept for them to review.
CREATE TABLE `_auth_enclaves` AS
SELECT s.id, s.account_id, s.created_at,
 CASE WHEN s.updated_at = s.created_at
  AND NOT EXISTS (SELECT 1 FROM auth_controls c WHERE c.system_id = s.id AND c.updated_at <> s.created_at)
  AND NOT EXISTS (SELECT 1 FROM auth_artifacts a WHERE a.system_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM auth_poam p WHERE p.system_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM auth_packages k WHERE k.system_id = s.id)
 THEN 1 ELSE 0 END AS untouched
FROM auth_systems s WHERE json_extract(s.profile, '$.template') = 'sbd-enclave';
--> statement-breakpoint
-- Remove an untouched enclave when the same account keeps another enclave that was worked on, or an
-- earlier one. If every copy is untouched, the earliest stays.
CREATE TABLE `_auth_enclave_duplicates` AS
SELECT d.id FROM _auth_enclaves d WHERE d.untouched = 1 AND EXISTS (
 SELECT 1 FROM _auth_enclaves k WHERE k.account_id = d.account_id AND k.id <> d.id
  AND (k.untouched = 0 OR k.created_at < d.created_at OR (k.created_at = d.created_at AND k.id < d.id)));
--> statement-breakpoint
DELETE FROM auth_history WHERE system_id IN (SELECT id FROM _auth_enclave_duplicates);
--> statement-breakpoint
DELETE FROM auth_controls WHERE system_id IN (SELECT id FROM _auth_enclave_duplicates);
--> statement-breakpoint
DELETE FROM auth_systems WHERE id IN (SELECT id FROM _auth_enclave_duplicates);
--> statement-breakpoint
-- The earliest remaining enclave of each account takes the key. Any other enclave a learner worked on
-- stays as a regular system without the key, so nothing they saved is lost.
UPDATE auth_systems SET registration_key = 'sbd-enclave'
WHERE json_extract(profile, '$.template') = 'sbd-enclave' AND NOT EXISTS (
 SELECT 1 FROM auth_systems e WHERE e.account_id = auth_systems.account_id AND e.id <> auth_systems.id
  AND json_extract(e.profile, '$.template') = 'sbd-enclave'
  AND (e.created_at < auth_systems.created_at OR (e.created_at = auth_systems.created_at AND e.id < auth_systems.id)));
--> statement-breakpoint
DROP TABLE `_auth_enclave_duplicates`;
--> statement-breakpoint
DROP TABLE `_auth_enclaves`;
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_auth_systems_registration` ON `auth_systems` (`account_id`, `registration_key`);
