# Prove you can recover — configuration checklist

Secure By Design · Edition 1.2 · 8 October 2026

The model's final chapter: a network that cannot come back was never really built. This course backs up what matters — directory, certificate authority, policy, boundary, and the log record — proves one real restore in isolation, and files the tested-recovery evidence the authorization path expects.

## Before you start

- [ ] Complete courses 1.1–1.11: the full network, its records, and the protected log archive all exist.
- [ ] Provision a protected backup volume on each server, written only by its backup job, an offline backup cabinet with removable media and a custody register, and an isolated recovery network segment (or host) for the restore rehearsal.
- [ ] Have the custody records handy: the Directory Services Restore Mode (DSRM) passwords from course 1.1 and the CA key protection decisions from course 1.4 — recovery is where those promises come due.

## Decide what recovery must prove

- [ ] Write the recovery set in dependency order — the same order the path built it: the directory first (everything trusts it), then the CA's database and keys, Group Policy, the router configuration, the log archive, and the living records themselves (register, inventory, exception record).
- [ ] Set the two numbers per item: how much history may be lost (recovery point) and how long restoration may take (recovery time) — lab-honest values you will actually measure against in lesson 5, not aspirations.
- [ ] Decide backup placement: each server's protected backup volume is written only by the backup process and readable by the recovery role, and a custodian carries copies to the offline backup cabinet on media — the air-gapped network's version of an off-site copy. There is no network path to the cabinet.
- [ ] Confirm the standing custody items: the DSRM passwords are sealed and findable, and the root CA's protected backup from the course 1.4 ceremony is accounted for — recovery depends on secrets that must exist before the bad day.

**Commands:**

```
# Capture the current protection state before this course changes it.
wbadmin get versions
Get-ChildItem E:\Backups -ErrorAction SilentlyContinue | Measure-Object   # this server's protected backup volume
```

**Verify:** The recovery set is ordered by dependency with point and time objectives per item, the backup placement and access rules are written, and the DSRM and root-key custody records check out.

**Evidence:** Keep the recovery requirements sheet, the objectives table, the placement and access decisions, and the custody verification notes.

Notes / result / date: __________________________

## Back up the directory, on schedule

- [ ] Schedule Windows Server Backup jobs on SBD-DC01 and SBD-DC02 to each server's protected backup volume, including the system state and all critical volumes (wbadmin's -allCritical) so the same backup also supports a full server (bare-metal) recovery to different hardware — two controllers, two independent backups, because replication is availability and was never recovery (course 1.1's point, now kept).
- [ ] After the first run, verify each backup's completion, record its version identifier, and hash the catalog entry into the evidence set — an unverified backup is a hope with a timestamp.
- [ ] Enable the Active Directory Recycle Bin (a one-way, forest-level action from the Tier 0 seat, recorded as the change it is) so a deleted user or OU comes back intact without touching system state at all.
- [ ] Write the restore decision tree: deleted object → Recycle Bin; corrupted DC on its own hardware → system state restore in DSRM (lesson 5's rehearsal); DC whose hardware is gone → full server (bare-metal) recovery from the critical-volumes backup; whole-forest loss → the Microsoft forest recovery guide, referenced and staged with the evidence rather than improvised on the day.

**Commands:**

```
wbadmin get versions
Get-ADOptionalFeature -Filter {Name -like 'Recycle Bin*'} | Select-Object Name, EnabledScopes
Get-FileHash -Algorithm SHA256 C:\Evidence\recovery\backup-catalog.txt
```

**Verify:** Both DCs show scheduled, completed system state versions on the protected target, the Recycle Bin reports an enabled scope, and the decision tree names the tool for each failure class.

**Evidence:** Keep the backup schedules and version listings, the hashed catalog, the Recycle Bin enablement record, and the restore decision tree.

Notes / result / date: __________________________

## Back up the CA, policy, boundary, and records

- [ ] Back up the issuing CA — database and private key — with certutil to SBD-SUBCA01's protected backup volume (E:\Backups in this sample), never to C:\Evidence: the private key is a secret, and secrets never go into evidence. Protect the key material to the same standard as the course 1.4 ceremony artifacts and record custody; only the backup's hashes and the custody record go into the evidence folder. The root's protected backup already exists from that ceremony and is verified, not duplicated, here.
- [ ] Refresh the Group Policy backup (the course 1.3 Backup-GPO set, now the whole policy estate) and the router configuration export into the protected target, each hashed into the catalog.
- [ ] Confirm the log archive's protection already satisfies this course — SBD-AUDIT01's hashed archives are themselves the record — and add the archive catalog to the recovery set so the evidence survives the systems it describes.
- [ ] Export the living records — register, inventory, exception record, and this course's own sheets — into the set: a recovered network without its records would pass no assessment and teach the wrong lesson.

**Commands:**

```
# On SBD-SUBCA01: back up to the protected backup volume, never to the evidence folder.
certutil -backup E:\Backups\SBD-SUBCA01\ca-backup   # prompts for the password that protects the exported key
# Only the hashes and the custody record go into evidence.
Get-ChildItem E:\Backups\SBD-SUBCA01\ca-backup -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\recovery\ca-backup-hashes.csv -NoTypeInformation
Get-FileHash -Algorithm SHA256 C:\Evidence\recovery\gpo-backup\* | Select-Object -First 6
```

**Verify:** The CA backup sits on SBD-SUBCA01's protected backup volume with key custody recorded and only its hashes in evidence, the policy and router exports are current and hashed, and the catalog covers logs and living records alongside the systems.

**Evidence:** Keep the CA backup's hash list and custody record (never the backup itself), the refreshed policy and router exports with hashes, and the complete recovery catalog.

Notes / result / date: __________________________

## Carry the copies to the offline cabinet

- [ ] Assign custodians by tier: a Tier 0 custodian handles DC system state and the issuing CA's database and key backup; the audit custodian handles the log archive from SBD-AUDIT01; a server custodian handles member-server backups. No one carries a tier they do not hold.
- [ ] For each copy, write the media ID, hash the backup on its protected volume, copy it to encrypted removable media, and verify the hash on the media before it leaves the room.
- [ ] Carry the media to the offline backup cabinet and record the handoff in the custody register: who, what, when, the hashes, and the storage slot. This is the course 1.3 media procedure used for backups.
- [ ] Pull one copy back as a test: find it from the register, verify its hash, and confirm it is readable. Lesson 5's rehearsal restores from a copy that has made this round trip.

**Commands:**

```
# Hash on the protected volume, then on the media.
Get-FileHash -Algorithm SHA256 E:\Backups\SBD-DC02\*.vhdx
Get-FileHash -Algorithm SHA256 F:\Media-0012\SBD-DC02\*.vhdx
```

**Verify:** Every item in the recovery set has an offline copy with matching hashes on the volume and the media, a custody entry with a named custodian of the right tier, and one copy has been retrieved and verified.

**Evidence:** Keep the custodian assignments, the hash pairs, the custody register entries, and the retrieval test record.

Notes / result / date: __________________________

## Rehearse a real restore, in isolation

- [ ] Stage the rehearsal: the isolated recovery segment has no path to the production VLANs — a restored controller believing it is authoritative must never meet the live directory; that isolation rule is written before the restore starts.
- [ ] Restore SBD-DC02 from the offline copy retrieved in lesson 4, timing the work from decision to directory-services-running against the lesson-1 objective. A system state restore needs the same server instance — use a copy of SBD-DC02's virtual machine attached only to the isolated segment — started in DSRM: bcdedit /set safeboot dsrepair, restart, and sign in with the DSRM password. Restoring to different hardware needs a full server (bare-metal) recovery from the critical-volumes backup instead.
- [ ] Remove the DSRM boot setting (bcdedit /deletevalue safeboot) and restart normally, then verify the restored directory the course 1.1 way — services, shares, a directory query. Record what the rehearsal taught: steps that surprised you, the measured time, and the decision-tree updates; then tear the rehearsal down completely.
- [ ] Back in production, run the everyday restore: delete a disposable test object, bring it back from the Recycle Bin with attributes intact, and file both rehearsals — the big one and the small one — as the tested-recovery evidence.

**Commands:**

```
# On the isolated copy of SBD-DC02: start in DSRM, then sign in with the DSRM password.
bcdedit /set safeboot dsrepair
shutdown -t 0 -r
wbadmin get versions -backupTarget:<media-volume> -machine:SBD-DC02
wbadmin start systemstaterecovery -version:<version-id> -backupTarget:<media-volume> -machine:SBD-DC02
bcdedit /deletevalue safeboot   # then restart normally
Get-Service NTDS,DNS,Netlogon   # after restart, on the restored controller
Restore-ADObject -Identity <deleted-object-guid>   # production Recycle Bin rehearsal
```

**Verify:** The isolated restore ran in DSRM and reached a healthy directory within (or honestly against) the time objective, the DSRM boot setting is removed, the teardown is confirmed, and the production object restore returned the test object intact.

**Evidence:** Keep the timed rehearsal log with its verification output, the lessons-learned and decision-tree updates, the teardown confirmation, and the object-restore record.

Notes / result / date: __________________________

## File the recovery record and close the path

- [ ] Assemble the recovery record: the requirements and objectives, the backup catalog, both rehearsal results with the measured times, the decision tree, and a named owner with a scheduled next rehearsal — recovery is a practice with a calendar, not a binder.
- [ ] Run the closing snapshot: the standing credentialed scan across every VLAN plus current Security Content Automation Protocol (SCAP) results per the cadence, triaged as always — the dated 'as-authorized' picture path 2 will reference.
- [ ] Reconcile the three living records one final time — inventory against directory and leases, register against behavior, exception record against open findings — so the authorization path inherits agreement, not archaeology.
- [ ] Write the Build path's closing note: what exists, where every record lives, and what is intentionally open — then start course 2.1, where this network stops being a project and becomes a system seeking authorization.

**Commands:**

```
Get-ChildItem C:\Evidence -Directory | Select-Object Name
Get-ChildItem C:\Evidence\recovery -Recurse | Measure-Object
Get-FileHash -Algorithm SHA256 C:\Evidence\recovery\recovery-record.pdf -ErrorAction SilentlyContinue
```

**Verify:** The recovery record is complete with an owner and next-rehearsal date, the closing snapshot is filed with triage, and all three living records reconcile cleanly into the handoff note.

**Evidence:** Finish the checklist: the recovery record, the closing scan snapshot, the three reconciliations, and the Build path's closing note.

Notes / result / date: __________________________

## Sources

- [Microsoft · Active Directory forest recovery guide](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-guide)
- [Microsoft · Wbadmin (Windows Server Backup)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wbadmin)
- [Microsoft · wbadmin start systemstaterecovery](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wbadmin-start-systemstaterecovery)
- [Microsoft · Restore AD DS from backup (nonauthoritative restore)](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-r2-and-2008/cc794755(v=ws.10))
- [Microsoft · Restart the domain controller in Directory Services Restore Mode locally](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-r2-and-2008/cc816897(v=ws.10))
- [Microsoft · AD forest recovery: perform a full server recovery](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-perform-full-server-recovery)
- [Microsoft · Certutil reference (CA backup and restore)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil)
- [NIST · SP 800-53 Rev. 5 security controls (CP family)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
