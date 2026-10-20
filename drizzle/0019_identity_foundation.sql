-- Courses 1.1–1.8 became course 1.1, "Build and harden the identity foundation" (owner direction, 20 October 2026).
-- Each old lesson keeps its place under a new id (training:identity-foundation:<part prefix>-<lesson>, or the old id
-- when it already starts with the prefix). Carry saved progress and learning activity there, a completed record
-- winning, and merge each learner's guide state (notes, checks, answers, completed lessons) from the eight old guides
-- into the one new guide, renaming each key the same way. content/progress-moves.json lists the same moves.
INSERT INTO reader_progress (user_id,item_id,status,updated_at)
SELECT user_id,
  CASE item_id
    WHEN 'training:dns-configuration:time' THEN 'training:identity-foundation:time'
    WHEN 'training:harden-baseline:staging' THEN 'training:identity-foundation:stig-staging'
    WHEN 'training:harden-baseline:baseline' THEN 'training:identity-foundation:stig-baseline'
    WHEN 'training:tiered-admin:dhcp' THEN 'training:identity-foundation:dhcp'
    WHEN 'training:dc01-dc02:prepare' THEN 'training:identity-foundation:dc-prepare'
    WHEN 'training:dc01-dc02:dc01' THEN 'training:identity-foundation:dc-dc01'
    WHEN 'training:dc01-dc02:dc02' THEN 'training:identity-foundation:dc-dc02'
    WHEN 'training:dc01-dc02:verify' THEN 'training:identity-foundation:dc-verify'
    WHEN 'training:dc01-dc02:evidence' THEN 'training:identity-foundation:dc-evidence'
    WHEN 'training:dns-configuration:plan' THEN 'training:identity-foundation:dns-plan'
    WHEN 'training:dns-configuration:zones' THEN 'training:identity-foundation:dns-zones'
    WHEN 'training:dns-configuration:records' THEN 'training:identity-foundation:dns-records'
    WHEN 'training:dns-configuration:verify' THEN 'training:identity-foundation:dns-verify'
    WHEN 'training:dns-configuration:troubleshoot' THEN 'training:identity-foundation:dns-troubleshoot'
    WHEN 'training:domain-time:time-plan' THEN 'training:identity-foundation:time-plan'
    WHEN 'training:domain-time:time' THEN 'training:identity-foundation:time'
    WHEN 'training:domain-time:time-members' THEN 'training:identity-foundation:time-members'
    WHEN 'training:domain-time:time-verify' THEN 'training:identity-foundation:time-verify'
    WHEN 'training:domain-time:time-troubleshoot' THEN 'training:identity-foundation:time-troubleshoot'
    WHEN 'training:stig-scap:stig-basics' THEN 'training:identity-foundation:stig-basics'
    WHEN 'training:stig-scap:staging' THEN 'training:identity-foundation:stig-staging'
    WHEN 'training:stig-scap:baseline' THEN 'training:identity-foundation:stig-baseline'
    WHEN 'training:stig-scap:checklists' THEN 'training:identity-foundation:stig-checklists'
    WHEN 'training:stig-scap:findings' THEN 'training:identity-foundation:stig-findings'
    WHEN 'training:harden-baseline:ou-design' THEN 'training:identity-foundation:gpo-ou-design'
    WHEN 'training:harden-baseline:gpo-basics' THEN 'training:identity-foundation:gpo-basics'
    WHEN 'training:harden-baseline:apply' THEN 'training:identity-foundation:gpo-apply'
    WHEN 'training:harden-baseline:rescan' THEN 'training:identity-foundation:gpo-rescan'
    WHEN 'training:harden-baseline:maintain' THEN 'training:identity-foundation:gpo-maintain'
    WHEN 'training:two-tier-pki:design' THEN 'training:identity-foundation:pki-design'
    WHEN 'training:two-tier-pki:root' THEN 'training:identity-foundation:pki-root'
    WHEN 'training:two-tier-pki:request' THEN 'training:identity-foundation:pki-request'
    WHEN 'training:two-tier-pki:sign' THEN 'training:identity-foundation:pki-sign'
    WHEN 'training:two-tier-pki:publish' THEN 'training:identity-foundation:pki-publish'
    WHEN 'training:two-tier-pki:publication' THEN 'training:identity-foundation:pki-publication'
    WHEN 'training:two-tier-pki:publish-trust' THEN 'training:identity-foundation:pki-publish-trust'
    WHEN 'training:two-tier-pki:template-admin' THEN 'training:identity-foundation:pki-template-admin'
    WHEN 'training:two-tier-pki:first-templates' THEN 'training:identity-foundation:pki-first-templates'
    WHEN 'training:two-tier-pki:validate' THEN 'training:identity-foundation:pki-validate'
    WHEN 'training:dhcp:dhcp-design' THEN 'training:identity-foundation:dhcp-design'
    WHEN 'training:dhcp:dhcp' THEN 'training:identity-foundation:dhcp'
    WHEN 'training:dhcp:dhcp-dns' THEN 'training:identity-foundation:dhcp-dns'
    WHEN 'training:dhcp:dhcp-audit' THEN 'training:identity-foundation:dhcp-audit'
    WHEN 'training:dhcp:dhcp-prove' THEN 'training:identity-foundation:dhcp-prove'
    WHEN 'training:tiered-admin:design' THEN 'training:identity-foundation:tier-design'
    WHEN 'training:tiered-admin:admin-hosts' THEN 'training:identity-foundation:tier-admin-hosts'
    WHEN 'training:tiered-admin:logon-restrictions' THEN 'training:identity-foundation:tier-logon-restrictions'
    WHEN 'training:tiered-admin:prove' THEN 'training:identity-foundation:tier-prove'
    WHEN 'training:tiered-admin:scan' THEN 'training:identity-foundation:tier-scan'
  END,
  status,updated_at
FROM reader_progress
WHERE item_id IN ('training:dns-configuration:time','training:harden-baseline:staging','training:harden-baseline:baseline','training:tiered-admin:dhcp','training:dc01-dc02:prepare','training:dc01-dc02:dc01','training:dc01-dc02:dc02','training:dc01-dc02:verify','training:dc01-dc02:evidence','training:dns-configuration:plan','training:dns-configuration:zones','training:dns-configuration:records','training:dns-configuration:verify','training:dns-configuration:troubleshoot','training:domain-time:time-plan','training:domain-time:time','training:domain-time:time-members','training:domain-time:time-verify','training:domain-time:time-troubleshoot','training:stig-scap:stig-basics','training:stig-scap:staging','training:stig-scap:baseline','training:stig-scap:checklists','training:stig-scap:findings','training:harden-baseline:ou-design','training:harden-baseline:gpo-basics','training:harden-baseline:apply','training:harden-baseline:rescan','training:harden-baseline:maintain','training:two-tier-pki:design','training:two-tier-pki:root','training:two-tier-pki:request','training:two-tier-pki:sign','training:two-tier-pki:publish','training:two-tier-pki:publication','training:two-tier-pki:publish-trust','training:two-tier-pki:template-admin','training:two-tier-pki:first-templates','training:two-tier-pki:validate','training:dhcp:dhcp-design','training:dhcp:dhcp','training:dhcp:dhcp-dns','training:dhcp:dhcp-audit','training:dhcp:dhcp-prove','training:tiered-admin:design','training:tiered-admin:admin-hosts','training:tiered-admin:logon-restrictions','training:tiered-admin:prove','training:tiered-admin:scan')
ON CONFLICT(user_id,item_id) DO UPDATE SET
  status=CASE WHEN reader_progress.status='completed' OR excluded.status='completed' THEN 'completed' ELSE excluded.status END,
  updated_at=MAX(reader_progress.updated_at,excluded.updated_at);
--> statement-breakpoint
DELETE FROM reader_progress WHERE item_id IN ('training:dns-configuration:time','training:harden-baseline:staging','training:harden-baseline:baseline','training:tiered-admin:dhcp','training:dc01-dc02:prepare','training:dc01-dc02:dc01','training:dc01-dc02:dc02','training:dc01-dc02:verify','training:dc01-dc02:evidence','training:dns-configuration:plan','training:dns-configuration:zones','training:dns-configuration:records','training:dns-configuration:verify','training:dns-configuration:troubleshoot','training:domain-time:time-plan','training:domain-time:time','training:domain-time:time-members','training:domain-time:time-verify','training:domain-time:time-troubleshoot','training:stig-scap:stig-basics','training:stig-scap:staging','training:stig-scap:baseline','training:stig-scap:checklists','training:stig-scap:findings','training:harden-baseline:ou-design','training:harden-baseline:gpo-basics','training:harden-baseline:apply','training:harden-baseline:rescan','training:harden-baseline:maintain','training:two-tier-pki:design','training:two-tier-pki:root','training:two-tier-pki:request','training:two-tier-pki:sign','training:two-tier-pki:publish','training:two-tier-pki:publication','training:two-tier-pki:publish-trust','training:two-tier-pki:template-admin','training:two-tier-pki:first-templates','training:two-tier-pki:validate','training:dhcp:dhcp-design','training:dhcp:dhcp','training:dhcp:dhcp-dns','training:dhcp:dhcp-audit','training:dhcp:dhcp-prove','training:tiered-admin:design','training:tiered-admin:admin-hosts','training:tiered-admin:logon-restrictions','training:tiered-admin:prove','training:tiered-admin:scan');
--> statement-breakpoint
UPDATE reader_learning_activity SET lesson_id=CASE lesson_id
    WHEN 'training:dns-configuration:time' THEN 'training:identity-foundation:time'
    WHEN 'training:harden-baseline:staging' THEN 'training:identity-foundation:stig-staging'
    WHEN 'training:harden-baseline:baseline' THEN 'training:identity-foundation:stig-baseline'
    WHEN 'training:tiered-admin:dhcp' THEN 'training:identity-foundation:dhcp'
    WHEN 'training:dc01-dc02:prepare' THEN 'training:identity-foundation:dc-prepare'
    WHEN 'training:dc01-dc02:dc01' THEN 'training:identity-foundation:dc-dc01'
    WHEN 'training:dc01-dc02:dc02' THEN 'training:identity-foundation:dc-dc02'
    WHEN 'training:dc01-dc02:verify' THEN 'training:identity-foundation:dc-verify'
    WHEN 'training:dc01-dc02:evidence' THEN 'training:identity-foundation:dc-evidence'
    WHEN 'training:dns-configuration:plan' THEN 'training:identity-foundation:dns-plan'
    WHEN 'training:dns-configuration:zones' THEN 'training:identity-foundation:dns-zones'
    WHEN 'training:dns-configuration:records' THEN 'training:identity-foundation:dns-records'
    WHEN 'training:dns-configuration:verify' THEN 'training:identity-foundation:dns-verify'
    WHEN 'training:dns-configuration:troubleshoot' THEN 'training:identity-foundation:dns-troubleshoot'
    WHEN 'training:domain-time:time-plan' THEN 'training:identity-foundation:time-plan'
    WHEN 'training:domain-time:time' THEN 'training:identity-foundation:time'
    WHEN 'training:domain-time:time-members' THEN 'training:identity-foundation:time-members'
    WHEN 'training:domain-time:time-verify' THEN 'training:identity-foundation:time-verify'
    WHEN 'training:domain-time:time-troubleshoot' THEN 'training:identity-foundation:time-troubleshoot'
    WHEN 'training:stig-scap:stig-basics' THEN 'training:identity-foundation:stig-basics'
    WHEN 'training:stig-scap:staging' THEN 'training:identity-foundation:stig-staging'
    WHEN 'training:stig-scap:baseline' THEN 'training:identity-foundation:stig-baseline'
    WHEN 'training:stig-scap:checklists' THEN 'training:identity-foundation:stig-checklists'
    WHEN 'training:stig-scap:findings' THEN 'training:identity-foundation:stig-findings'
    WHEN 'training:harden-baseline:ou-design' THEN 'training:identity-foundation:gpo-ou-design'
    WHEN 'training:harden-baseline:gpo-basics' THEN 'training:identity-foundation:gpo-basics'
    WHEN 'training:harden-baseline:apply' THEN 'training:identity-foundation:gpo-apply'
    WHEN 'training:harden-baseline:rescan' THEN 'training:identity-foundation:gpo-rescan'
    WHEN 'training:harden-baseline:maintain' THEN 'training:identity-foundation:gpo-maintain'
    WHEN 'training:two-tier-pki:design' THEN 'training:identity-foundation:pki-design'
    WHEN 'training:two-tier-pki:root' THEN 'training:identity-foundation:pki-root'
    WHEN 'training:two-tier-pki:request' THEN 'training:identity-foundation:pki-request'
    WHEN 'training:two-tier-pki:sign' THEN 'training:identity-foundation:pki-sign'
    WHEN 'training:two-tier-pki:publish' THEN 'training:identity-foundation:pki-publish'
    WHEN 'training:two-tier-pki:publication' THEN 'training:identity-foundation:pki-publication'
    WHEN 'training:two-tier-pki:publish-trust' THEN 'training:identity-foundation:pki-publish-trust'
    WHEN 'training:two-tier-pki:template-admin' THEN 'training:identity-foundation:pki-template-admin'
    WHEN 'training:two-tier-pki:first-templates' THEN 'training:identity-foundation:pki-first-templates'
    WHEN 'training:two-tier-pki:validate' THEN 'training:identity-foundation:pki-validate'
    WHEN 'training:dhcp:dhcp-design' THEN 'training:identity-foundation:dhcp-design'
    WHEN 'training:dhcp:dhcp' THEN 'training:identity-foundation:dhcp'
    WHEN 'training:dhcp:dhcp-dns' THEN 'training:identity-foundation:dhcp-dns'
    WHEN 'training:dhcp:dhcp-audit' THEN 'training:identity-foundation:dhcp-audit'
    WHEN 'training:dhcp:dhcp-prove' THEN 'training:identity-foundation:dhcp-prove'
    WHEN 'training:tiered-admin:design' THEN 'training:identity-foundation:tier-design'
    WHEN 'training:tiered-admin:admin-hosts' THEN 'training:identity-foundation:tier-admin-hosts'
    WHEN 'training:tiered-admin:logon-restrictions' THEN 'training:identity-foundation:tier-logon-restrictions'
    WHEN 'training:tiered-admin:prove' THEN 'training:identity-foundation:tier-prove'
    WHEN 'training:tiered-admin:scan' THEN 'training:identity-foundation:tier-scan'
  END
WHERE lesson_id IN ('training:dns-configuration:time','training:harden-baseline:staging','training:harden-baseline:baseline','training:tiered-admin:dhcp','training:dc01-dc02:prepare','training:dc01-dc02:dc01','training:dc01-dc02:dc02','training:dc01-dc02:verify','training:dc01-dc02:evidence','training:dns-configuration:plan','training:dns-configuration:zones','training:dns-configuration:records','training:dns-configuration:verify','training:dns-configuration:troubleshoot','training:domain-time:time-plan','training:domain-time:time','training:domain-time:time-members','training:domain-time:time-verify','training:domain-time:time-troubleshoot','training:stig-scap:stig-basics','training:stig-scap:staging','training:stig-scap:baseline','training:stig-scap:checklists','training:stig-scap:findings','training:harden-baseline:ou-design','training:harden-baseline:gpo-basics','training:harden-baseline:apply','training:harden-baseline:rescan','training:harden-baseline:maintain','training:two-tier-pki:design','training:two-tier-pki:root','training:two-tier-pki:request','training:two-tier-pki:sign','training:two-tier-pki:publish','training:two-tier-pki:publication','training:two-tier-pki:publish-trust','training:two-tier-pki:template-admin','training:two-tier-pki:first-templates','training:two-tier-pki:validate','training:dhcp:dhcp-design','training:dhcp:dhcp','training:dhcp:dhcp-dns','training:dhcp:dhcp-audit','training:dhcp:dhcp-prove','training:tiered-admin:design','training:tiered-admin:admin-hosts','training:tiered-admin:logon-restrictions','training:tiered-admin:prove','training:tiered-admin:scan');
--> statement-breakpoint
INSERT INTO reader_guide_state (user_id,guide_id,state,updated_at)
WITH old AS (
  SELECT user_id,state,updated_at,CASE guide_id
    WHEN 'sbd-dc01-dc02' THEN 'dc'
    WHEN 'sbd-dns-configuration' THEN 'dns'
    WHEN 'sbd-domain-time' THEN 'time'
    WHEN 'sbd-stig-scap' THEN 'stig'
    WHEN 'sbd-harden-baseline' THEN 'gpo'
    WHEN 'sbd-two-tier-pki' THEN 'pki'
    WHEN 'sbd-dhcp' THEN 'dhcp'
    WHEN 'sbd-tiered-admin' THEN 'tier'
  END AS pre
  FROM reader_guide_state WHERE guide_id IN ('sbd-dc01-dc02','sbd-dns-configuration','sbd-domain-time','sbd-stig-scap','sbd-harden-baseline','sbd-two-tier-pki','sbd-dhcp','sbd-tiered-admin')
)
SELECT u.user_id,'sbd-identity-foundation',json_object(
  'chapter',0,
  'notes',json(COALESCE((SELECT json_group_object(CASE WHEN j.key = o.pre OR j.key LIKE o.pre || '-%' THEN j.key ELSE o.pre || '-' || j.key END,j.value) FROM old o, json_each(o.state,'$.notes') j WHERE o.user_id=u.user_id),'{}')),
  'checks',json(COALESCE((SELECT json_group_object(CASE WHEN j.key = o.pre OR j.key LIKE o.pre || '-%' THEN j.key ELSE o.pre || '-' || j.key END,json(CASE j.type WHEN 'true' THEN 'true' ELSE 'false' END)) FROM old o, json_each(o.state,'$.checks') j WHERE o.user_id=u.user_id),'{}')),
  'answers',json(COALESCE((SELECT json_group_object(CASE WHEN j.key = o.pre OR j.key LIKE o.pre || '-%' THEN j.key ELSE o.pre || '-' || j.key END,j.value) FROM old o, json_each(o.state,'$.answers') j WHERE o.user_id=u.user_id),'{}')),
  'completed',json(COALESCE((SELECT json_group_array(CASE WHEN j.value = o.pre OR j.value LIKE o.pre || '-%' THEN j.value ELSE o.pre || '-' || j.value END) FROM old o, json_each(o.state,'$.completed') j WHERE o.user_id=u.user_id),'[]'))
),MAX(u.updated_at)
FROM old u GROUP BY u.user_id
ON CONFLICT(user_id,guide_id) DO NOTHING;
--> statement-breakpoint
DELETE FROM reader_guide_state WHERE guide_id IN ('sbd-dc01-dc02','sbd-dns-configuration','sbd-domain-time','sbd-stig-scap','sbd-harden-baseline','sbd-two-tier-pki','sbd-dhcp','sbd-tiered-admin');
