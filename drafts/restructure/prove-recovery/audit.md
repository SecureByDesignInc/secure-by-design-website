# Audit: 1.19 prove-recovery

Lesson ids, lesson count and minutes (150) are unchanged. `node validate-draft.mjs prove-recovery` passes.

## Fixed

1. catalog.json: `number` 1.10 → 1.19, `categoryOrder` 10 → 19, `networkLabel` → "THE WHOLE NETWORK / RECOVERY". `systems` now lists the servers the course backs up (adds SBD-DHCP01, SBD-REPO01, SBD-SPLUNK01, SBD-MGMT01). Description, outcome 1 and stages re-derived from the lessons.
2. prerequisites: "courses 1.1–1.9" → 1.1–1.18 (1.16/1.17 coming soon, not needed). "CA key protection decisions from course 1.4" → the course 1.6 ceremony record. The DSRM passwords are "set in course 1.1, sealed". Protected volumes are scoped to the DCs and SBD-SUBCA01, with the rule that the target is never a volume being backed up. Member servers keep the sets their own courses made.
3. labNote: the recovery set now matches what the path builds.
4. Sources: replaced the release-numbered previous-versions URLs (`nonauth`, cc794755 for 2008 R2; `dsrm`, cc816897) with the current forest-recovery "Perform a nonauthoritative restore" page, and dropped `dsrm`. Added `wbadmin-enable`, `virtual-dc` (restore a virtual DC), `recycle-bin` (Enable-ADOptionalFeature), `backup-gpo`, `dhcp-backup`, `dns-credential` and `w32tm`. All are on learn.microsoft.com; the new ones were checked through Microsoft Learn, and the rest are already used by courses 1.3, 1.5 and 1.7.
5. requirements.steps[0]: the recovery set now matches courses 1.1–1.18. It adds the SBD-DHCP01 set (1.7), SBD-REPO01's catalog and snapshots (1.9), SBD-SPLUNK01's configuration (1.12, the single-instance mitigation in AGENTS.md), the log archive with its catalog (1.11), the inventory on SBD-MGMT01 (1.15) and the exception record.
6. requirements.steps[1] and command: added the tombstone-lifetime limit (180 days by default) on a directory backup's usefulness, with a command that reads it. Replaced the `E:\Backups` folder count with a volume check.
7. requirements.steps[2]: "no backup server and no network path" (AGENTS.md) and "custodians of the matching tier".
8. requirements.steps[3], trust-state steps/quiz explanation, guide `root` node and `trust-state.control.body`: course 1.4 (ceremony, custody) → course 1.6.
9. directory.steps[0] and command: the schedule was never shown. It is now `wbadmin enable backup -addtarget:E: -schedule:21:00 -systemState -allCritical -quiet`, run from AdminJumpBox01. `-systemState` is explicit because Microsoft says a full-server backup without system state can't be used for a nonauthoritative restore.
10. directory.steps[2] and command: added `Enable-ADOptionalFeature` against the domain naming master. Added that objects deleted before the Recycle Bin was enabled come back only from backup.
11. directory: the catalog location is C:\Evidence\recovery on AdminJumpBox01 (since course 1.8, evidence lives on the tier seats).
12. trust-state: title "Back up the CA, policy, boundary, and records" → "Back up the CA, services, policy, and records". The summary, objectives and recap were updated, and the catalog stage and guide follow. The lesson now has 6 steps:
    - The CA backup adds `reg export` of the CertSvc configuration (a database restore needs it). Path `E:\Backups\CA`.
    - The GPO refresh follows the course 1.5 method (Backup-GPO -All plus links for the domain root and every OU, covering 1.6's autoenrollment and 1.8's tier GPOs). It writes to C:\Evidence\recovery\gpo-backup, because writing into the sealed course 1.5 folder would break `hardened-manifest.csv`.
    - The DHCP set (1.7) carries its restore note: `Set-DhcpServerDnsCredential` after `Restore-DhcpServer`.
    - The REPO01, Splunk and inventory sets are hashed from SBD-ADMIN-SRV01. The Splunk configuration holds keys, so it stays off evidence.
    - The audit archive and catalog paths now match 1.11 (`D:\LogArchive`, `D:\LogArchive\Catalog\catalog.csv`).
    - "Refresh … the router configuration export" claimed an export no course made. It is now a read-only export taken with the router's own function from AdminJumpBox01, and the course changes nothing on the router (decisions rule 3).
13. trust-state quiz 4 explanation: dropped "the DNS course's rule" (the rule isn't owned there).
14. offline-copies.steps[0]: custodians now match the real systems. Tier 0 carries the DCs, the CA, the GPOs and the router export. The audit custodian (SBD Audit Custodians, 1.8) carries the archive and catalog. A Tier 1 custodian carries DHCP01, REPO01, SPLUNK01 and MGMT01.
15. offline-copies.steps[2]: "course 1.3 media procedure" → course 1.4.
16. offline-copies.steps[1] and command: `E:\Backups\SBD-DC02\*.vhdx` was not where Windows Server Backup writes; it writes `<volume>\WindowsImageBackup\<computer>`. The command now hashes, copies the WindowsImageBackup layout, compares, and proves the media readable with `wbadmin get versions -backupTarget:F:`.
17. rehearse.steps[1] and command: added `-authsysvol`. Without it, a lone nonauthoritative restore on an isolated segment never brings up SYSVOL/NETLOGON, so the verification step could not pass. Verification now checks DFSR, the SYSVOL/NETLOGON shares and a directory query.
18. rehearse.steps[0] and [2]: hypervisor time sync off on the rehearsal copy. Added the clock check on the restored controller (decisions.md "Settled" 1.19 item, 1.3 `time-troubleshoot` step 4): record the offset; a restored SBD-DC01 is checked against the reference before members follow it.
19. rehearse command: replaced `Restore-ADObject -Identity <guid>` with `Get-ADObject … -IncludeDeletedObjects | Restore-ADObject`, run from AdminJumpBox01. `-machine`/`-backupTarget` now point at the retrieved media F:.
20. record.steps[1], check, evidence, objective, quiz 2: removed the "standing credentialed scan across every VLAN" (SBD-NESSUS01 is coming soon, rule 1). The closing snapshot is now SCAP results from each tier's seat on the course 1.5 cadence, with one "course 1.17 (coming soon)" mention.
21. record.steps[0] and command: the recovery record is sealed in two halves with manifests (AdminJumpBox01 for Tier 0, SBD-ADMIN-SRV01 for Tier 1), replacing the `recovery-record.pdf` guess. Added the DHCP restore note to the record.
22. record.steps[2]: the inventory reconciliation names SBD-MGMT01 and the course 1.15 method (directory, leases, WSUS rings).
23. record quiz 3: "from ten build courses" → "from the Build path".
24. Guide: removed the SBD-NESSUS01 node and its four "credentialed scan" flows. Added SBD-ADMIN-SRV01 (Tier 1 seat), so there are 7 nodes. Flows are now the Tier 0 sessions and the custodian/Tier 1 session to SBD-AUDIT01.
25. Guide: the sample table drops the "E:\Backups on each server" row (now "E: on both controllers and SBD-SUBCA01") and adds SBD-DHCP01 and SBD-AUDIT01 paths. trust-state has 6 stepTitles. The record and rehearse step titles, network captions, checklists and the AdminJumpBox01 description were updated to match.

## Judgment calls for the owner

1. **Business data (SBD-FS01 shares, SBD-SQL01 databases, SBD-APPS01, SBD-WEB01).** No course defines their backups, and the recovery set doesn't include them.
   - Options: (a) leave them out; (b) add a member-server Windows Server Backup schedule (and SQL native backups) in this course; (c) have course 1.18 make the sets and 1.19 carry them.
   - Recommendation: (c), because the course that builds a server should define what of it is backed up.
2. **Router configuration export.** Kept in the recovery set as read-only, using "the router's own export function" (vendor-agnostic, no command).
   - Options: keep it as written, or treat the router's configuration as the existing network's own record and back up only the service-path register.
   - Recommendation: keep it. A rebuilt boundary needs it, and reading it doesn't configure the router.
3. **Splunk scope.** Only `/opt/splunk/etc` is backed up; the indexes are treated as a rebuildable working copy, since the record is on SBD-AUDIT01.
   - Options: keep it that way, or also back up the indexes if analysts' saved work must survive.
   - Recommendation: configuration only.
4. **Recovery-segment platform.** The rehearsal assumes the lab can run a copy of SBD-DC02's VM on an isolated virtual switch. The hypervisor stays unnamed (vendor-neutral). No change needed unless the owner wants a named procedure.

## For other courses

- **business-services (1.18) `prove-scan`**: "course 1.10 proves the network can come back from the dead" → "course 1.19 proves…". The `next` "That completes course 1.9. Course 1.10 closes the Build path…" → "That completes course 1.18. Course 1.19 closes the Build path by proving recovery — directory, CA, policy, services, and logs — before authorization begins."
- **business-services (1.18)**: if judgment call 1 goes to (c), add its backup sets (for example to a D:\Backups volume per server) with hashes, and say "course 1.19 carries them to the offline cabinet".
- **audit-repository (1.11)**: its notes already match (custodians read-only on D:\LogArchive; the catalog travels with the archives). No change.
- **Repository content/course-guides/prove-recovery.json and content/configuration-courses.json**: replace them with these drafts when merging. The live course is still numbered 1.10 and still uses SBD-NESSUS01.
