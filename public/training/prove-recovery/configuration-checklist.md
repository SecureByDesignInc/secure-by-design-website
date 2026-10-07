# Prove you can recover — configuration checklist

Secure By Design · Edition 1.0 · 7 October 2026

The model's final chapter: a network that cannot come back was never really built. This course backs up what matters — directory, certificate authority, policy, boundary, and the log record — proves one real restore in isolation, and files the tested-recovery evidence the authorization path expects.

## Before you start

- [ ] Complete courses 1.1–1.11: the full network, its records, and the protected log archive all exist.
- [ ] Provision protected backup storage reachable only by the backup process, plus an isolated recovery network segment (or host) for the restore rehearsal.
- [ ] Have the custody records handy: the DSRM passwords from course 1.1 and the CA key protection decisions from course 1.4 — recovery is where those promises come due.

## Decide what recovery must prove

- [ ] Write the recovery set in dependency order — the same order the path built it: the directory first (everything trusts it), then the CA's database and keys, Group Policy, the router configuration, the log archive, and the living records themselves (register, inventory, exception record).
- [ ] Set the two numbers per item: how much history may be lost (recovery point) and how long restoration may take (recovery time) — lab-honest values you will actually measure against in lesson 4, not aspirations.
- [ ] Decide backup placement: a protected location written only by the backup process, readable by the recovery role, with one copy's custody offline on media — the air-gapped network's version of an off-site copy.
- [ ] Confirm the standing custody items: the DSRM passwords are sealed and findable, and the root CA's protected backup from the course 1.4 ceremony is accounted for — recovery depends on secrets that must exist before the bad day.

**Verify:** The recovery set is ordered by dependency with point and time objectives per item, the backup placement and access rules are written, and the DSRM and root-key custody records check out.

**Evidence:** Keep the recovery requirements sheet, the objectives table, the placement and access decisions, and the custody verification notes.

Notes / result / date: __________________________

## Back up the directory, on schedule

- [ ] Schedule Windows Server Backup system state jobs on SBD-DC01 and SBD-DC02 to the protected target — two controllers, two independent backups, because replication is availability and was never recovery (course 1.1's point, now kept).
- [ ] After the first run, verify each backup's completion, record its version identifier, and hash the catalog entry into the evidence set — an unverified backup is a hope with a timestamp.
- [ ] Enable the Active Directory Recycle Bin (a one-way, forest-level action from the Tier 0 seat, recorded as the change it is) so a deleted user or OU comes back intact without touching system state at all.
- [ ] Write the restore decision tree: deleted object → Recycle Bin; corrupted or lost DC → system state restore (lesson 4's rehearsal); whole-forest loss → the Microsoft forest recovery guide, referenced and staged with the evidence rather than improvised on the day.

**Verify:** Both DCs show scheduled, completed system state versions on the protected target, the Recycle Bin reports an enabled scope, and the decision tree names the tool for each failure class.

**Evidence:** Keep the backup schedules and version listings, the hashed catalog, the Recycle Bin enablement record, and the restore decision tree.

Notes / result / date: __________________________

## Back up the CA, policy, boundary, and records

- [ ] Back up the issuing CA — database and private key — with certutil, protect the key material to the same standard as the course 1.4 ceremony artifacts, and record custody; the root's protected backup already exists from that ceremony and is verified, not duplicated, here.
- [ ] Refresh the Group Policy backup (the course 1.3 Backup-GPO set, now the whole policy estate) and the router configuration export into the protected target, each hashed into the catalog.
- [ ] Confirm the log archive's protection already satisfies this course — SBD-AUDIT01's hashed archives are themselves the record — and add the archive catalog to the recovery set so the evidence survives the systems it describes.
- [ ] Export the living records — register, inventory, exception record, and this course's own sheets — into the set: a recovered network without its records would pass no assessment and teach the wrong lesson.

**Verify:** The CA backup exists with key custody recorded, the policy and router exports are current and hashed, and the catalog covers logs and living records alongside the systems.

**Evidence:** Keep the CA backup and custody record, the refreshed policy and router exports with hashes, and the complete recovery catalog.

Notes / result / date: __________________________

## Rehearse a real restore, in isolation

- [ ] Stage the rehearsal: the isolated recovery segment has no path to the production VLANs — a restored controller believing it is authoritative must never meet the live directory; that isolation rule is written before the restore starts.
- [ ] Restore SBD-DC02's system state from the protected backup onto the recovery segment, timing the work from decision to directory-services-running against the lesson-1 objective.
- [ ] Verify the restored directory the course 1.1 way — services, shares, a directory query — then record what the rehearsal taught: steps that surprised you, the measured time, and the decision-tree updates; then tear the rehearsal down completely.
- [ ] Back in production, run the everyday restore: delete a disposable test object, bring it back from the Recycle Bin with attributes intact, and file both rehearsals — the big one and the small one — as the tested-recovery evidence.

**Verify:** The isolated restore reached a healthy directory within (or honestly against) the time objective, the teardown is confirmed, and the production object restore returned the test object intact.

**Evidence:** Keep the timed rehearsal log with its verification output, the lessons-learned and decision-tree updates, the teardown confirmation, and the object-restore record.

Notes / result / date: __________________________

## File the recovery record and close the path

- [ ] Assemble the recovery record: the requirements and objectives, the backup catalog, both rehearsal results with the measured times, the decision tree, and a named owner with a scheduled next rehearsal — recovery is a practice with a calendar, not a binder.
- [ ] Run the closing snapshot: the standing credentialed scan across every VLAN plus current SCAP results per the cadence, triaged as always — the dated 'as-authorized' picture path 2 will reference.
- [ ] Reconcile the three living records one final time — inventory against directory and leases, register against behavior, exception record against open findings — so the authorization path inherits agreement, not archaeology.
- [ ] Write the Build path's closing note: what exists, where every record lives, and what is intentionally open — then start course 2.1, where this network stops being a project and becomes a system seeking authorization.

**Verify:** The recovery record is complete with an owner and next-rehearsal date, the closing snapshot is filed with triage, and all three living records reconcile cleanly into the handoff note.

**Evidence:** Finish the checklist: the recovery record, the closing scan snapshot, the three reconciliations, and the Build path's closing note.

Notes / result / date: __________________________
