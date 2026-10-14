-- Training library restructure, 14 October 2026: DNS and time, STIG measurement and Group Policy hardening,
-- DHCP and tiered administration, the logging pipeline (collector, archive, analysis), the Linux repository,
-- Windows updates and the inventory became separate courses. Lessons that moved keep their lesson id; carry
-- saved progress and learning activity to their new course. A completed record always wins.
-- content/progress-moves.json lists the same moves (the server also translates them from older app builds).
INSERT INTO reader_progress (user_id,item_id,status,updated_at)
SELECT user_id,
  CASE item_id
    WHEN 'training:dns-configuration:time' THEN 'training:domain-time:time'
    WHEN 'training:harden-baseline:staging' THEN 'training:stig-scap:staging'
    WHEN 'training:harden-baseline:baseline' THEN 'training:stig-scap:baseline'
    WHEN 'training:tiered-admin:dhcp' THEN 'training:dhcp:dhcp'
    WHEN 'training:patch-protect:repo' THEN 'training:linux-repository:repo'
    WHEN 'training:patch-protect:mgmt' THEN 'training:management-server:mgmt'
    WHEN 'training:logging-pipeline:protect' THEN 'training:audit-repository:protect'
    WHEN 'training:logging-pipeline:analyze' THEN 'training:splunk-analysis:analyze'
    WHEN 'training:logging-pipeline:prove' THEN 'training:splunk-analysis:prove'
  END,
  status,updated_at
FROM reader_progress
WHERE item_id IN ('training:dns-configuration:time','training:harden-baseline:staging','training:harden-baseline:baseline','training:tiered-admin:dhcp','training:patch-protect:repo','training:patch-protect:mgmt','training:logging-pipeline:protect','training:logging-pipeline:analyze','training:logging-pipeline:prove')
ON CONFLICT(user_id,item_id) DO UPDATE SET
  status=CASE WHEN reader_progress.status='completed' OR excluded.status='completed' THEN 'completed' ELSE excluded.status END,
  updated_at=MAX(reader_progress.updated_at,excluded.updated_at);
--> statement-breakpoint
DELETE FROM reader_progress WHERE item_id IN ('training:dns-configuration:time','training:harden-baseline:staging','training:harden-baseline:baseline','training:tiered-admin:dhcp','training:patch-protect:repo','training:patch-protect:mgmt','training:logging-pipeline:protect','training:logging-pipeline:analyze','training:logging-pipeline:prove');
--> statement-breakpoint
UPDATE reader_learning_activity SET lesson_id=CASE lesson_id
    WHEN 'training:dns-configuration:time' THEN 'training:domain-time:time'
    WHEN 'training:harden-baseline:staging' THEN 'training:stig-scap:staging'
    WHEN 'training:harden-baseline:baseline' THEN 'training:stig-scap:baseline'
    WHEN 'training:tiered-admin:dhcp' THEN 'training:dhcp:dhcp'
    WHEN 'training:patch-protect:repo' THEN 'training:linux-repository:repo'
    WHEN 'training:patch-protect:mgmt' THEN 'training:management-server:mgmt'
    WHEN 'training:logging-pipeline:protect' THEN 'training:audit-repository:protect'
    WHEN 'training:logging-pipeline:analyze' THEN 'training:splunk-analysis:analyze'
    WHEN 'training:logging-pipeline:prove' THEN 'training:splunk-analysis:prove'
  END
WHERE lesson_id IN ('training:dns-configuration:time','training:harden-baseline:staging','training:harden-baseline:baseline','training:tiered-admin:dhcp','training:patch-protect:repo','training:patch-protect:mgmt','training:logging-pipeline:protect','training:logging-pipeline:analyze','training:logging-pipeline:prove');
