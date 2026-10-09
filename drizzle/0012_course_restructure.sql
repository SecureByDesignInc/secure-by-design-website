-- Training library restructure (October 2026): course 1.5 "Connect and segment the network" was removed
-- and its time lesson moved into course 1.2; course 1.6 "Finish the PKI services" merged into course 1.4.
-- Carry saved progress and learning activity to the lessons' new identifiers. A completed record always wins.
INSERT INTO reader_progress (user_id,item_id,status,updated_at)
SELECT user_id,
  CASE item_id
    WHEN 'training:connect-segment:time' THEN 'training:dns-configuration:time'
    WHEN 'training:pki-services:publication' THEN 'training:two-tier-pki:publication'
    WHEN 'training:pki-services:publish-trust' THEN 'training:two-tier-pki:publish-trust'
    WHEN 'training:pki-services:template-admin' THEN 'training:two-tier-pki:template-admin'
    WHEN 'training:pki-services:first-templates' THEN 'training:two-tier-pki:first-templates'
    WHEN 'training:pki-services:validate' THEN 'training:two-tier-pki:validate'
  END,
  status,updated_at
FROM reader_progress
WHERE item_id IN ('training:connect-segment:time','training:pki-services:publication','training:pki-services:publish-trust','training:pki-services:template-admin','training:pki-services:first-templates','training:pki-services:validate')
ON CONFLICT(user_id,item_id) DO UPDATE SET
  status=CASE WHEN reader_progress.status='completed' OR excluded.status='completed' THEN 'completed' ELSE excluded.status END,
  updated_at=MAX(reader_progress.updated_at,excluded.updated_at);
--> statement-breakpoint
DELETE FROM reader_progress WHERE item_id LIKE 'training:connect-segment:%' OR item_id LIKE 'training:pki-services:%';
--> statement-breakpoint
UPDATE reader_learning_activity SET lesson_id=CASE lesson_id
    WHEN 'training:connect-segment:time' THEN 'training:dns-configuration:time'
    WHEN 'training:pki-services:publication' THEN 'training:two-tier-pki:publication'
    WHEN 'training:pki-services:publish-trust' THEN 'training:two-tier-pki:publish-trust'
    WHEN 'training:pki-services:template-admin' THEN 'training:two-tier-pki:template-admin'
    WHEN 'training:pki-services:first-templates' THEN 'training:two-tier-pki:first-templates'
    WHEN 'training:pki-services:validate' THEN 'training:two-tier-pki:validate'
  END
WHERE lesson_id IN ('training:connect-segment:time','training:pki-services:publication','training:pki-services:publish-trust','training:pki-services:template-admin','training:pki-services:first-templates','training:pki-services:validate');
