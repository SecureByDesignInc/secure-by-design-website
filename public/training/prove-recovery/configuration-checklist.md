# Prove you can recover — configuration checklist

Secure By Design · Edition 1.4 · 14 October 2026

The model's final chapter: a network that cannot come back was never really built. This course backs up what matters — the directory, the issuing CA, Group Policy, DHCP, the repository and analysis configuration, the log record, and the living records — proves one real restore in isolation, and files the tested-recovery evidence the authorization path expects.

## Before you start

- [ ] Complete courses 1.1–1.18 (courses 1.16 and 1.17 are coming soon and aren't needed): the full network, its records, the protected log archive, and the living inventory all exist.
- [ ] Provision a protected backup volume (E: in this sample) on both domain controllers and SBD-SUBCA01, written only by the backup job and never one of the volumes being backed up; the member servers keep the backup sets their own courses made, such as SBD-DHCP01's D:\Backups\DHCP. Also provide an offline backup cabinet with removable media and a custody register, and an isolated recovery network segment (or host) for the restore rehearsal.
- [ ] Have the custody records handy: the sealed Directory Services Restore Mode (DSRM) passwords set in course 1.1 and the course 1.6 ceremony record for SBD-ROOTCA01's protected backup — recovery is where those promises come due.

## Decide what recovery must prove

- [ ] Write the recovery set in dependency order — the order the path built it: the directory on both controllers first, because everything trusts it; then the certificate authorities (SBD-SUBCA01's database and key, and SBD-ROOTCA01's course 1.6 ceremony backup); Group Policy; SBD-DHCP01's backup set from course 1.7; the boundary's records (the service-path register and the core router's configuration); SBD-REPO01's snapshot catalog and snapshots (course 1.9); SBD-SPLUNK01's configuration (course 1.12); the log archive and its catalog on SBD-AUDIT01 (course 1.11); and the living records — the inventory on SBD-MGMT01 (course 1.15) and the exception record.
- [ ] Set the two numbers per item: how much history may be lost (recovery point) and how long restoration may take (recovery time) — lab-honest values you will actually measure against in lesson 5, not aspirations. A directory backup older than the forest's tombstone lifetime (180 days by default) can't be restored at all, so the directory's recovery point stays well inside it.
- [ ] Decide backup placement: each protected backup volume is written only by its backup process and readable by the recovery role, and custodians of the matching tier carry copies to the offline backup cabinet on media — the air-gapped network's version of an off-site copy. There is no backup server and no network path to the cabinet.
- [ ] Confirm the standing custody items: the DSRM passwords set in course 1.1 are sealed and findable, and SBD-ROOTCA01's protected backup from the course 1.6 ceremony is accounted for — recovery depends on secrets that must exist before the bad day.

**Commands:**

```
# On each controller and SBD-SUBCA01: capture the current protection state before this course changes it.
wbadmin get versions
Get-Volume -DriveLetter E | Select-Object DriveLetter, FileSystemLabel, SizeRemaining   # the protected backup volume
# The tombstone lifetime bounds the directory's recovery point (empty means the 180-day default).
(Get-ADObject "CN=Directory Service,CN=Windows NT,CN=Services,$((Get-ADRootDSE).configurationNamingContext)" -Properties tombstoneLifetime).tombstoneLifetime
```

**Verify:** The recovery set is ordered by dependency with point and time objectives per item, the backup placement and access rules are written, and the DSRM and root-key custody records check out.

**Evidence:** Keep the recovery requirements sheet, the objectives table, the placement and access decisions, and the custody verification notes.

Notes / result / date: __________________________

## Back up the directory, on schedule

- [ ] In a Tier 0 session from AdminJumpBox01, schedule Windows Server Backup on SBD-DC01 and SBD-DC02, each to its own protected backup volume, with the system state and all critical volumes (wbadmin's -systemState and -allCritical): the system state is what a directory restore in DSRM needs, and the critical volumes let the same backup rebuild a controller whose hardware is gone. Two controllers, two independent backups — replication is availability and was never recovery, as course 1.1 put it.
- [ ] After the first run, verify each backup's completion, record its version identifier in the backup catalog (C:\Evidence\recovery on AdminJumpBox01), and hash the catalog — an unverified backup is a hope with a timestamp.
- [ ] Enable the Active Directory Recycle Bin from the Tier 0 seat — a one-way, forest-level change run against the domain naming master (SBD-DC01) and recorded as the change it is — so a deleted user or OU comes back intact without touching system state. Objects deleted before it was enabled can come back only from a backup.
- [ ] Write the restore decision tree: deleted object → Recycle Bin; corrupted DC on its own hardware → system state restore in DSRM (lesson 5's rehearsal); DC whose hardware is gone → full server (bare-metal) recovery from the critical-volumes backup; whole-forest loss → the Microsoft forest recovery guide, referenced and staged with the evidence rather than improvised on the day.

**Commands:**

```
# Tier 0 session from AdminJumpBox01: a daily schedule on each controller (E: is never a volume being backed up)
Invoke-Command SBD-DC01.sbd.test, SBD-DC02.sbd.test { wbadmin enable backup -addtarget:E: -schedule:21:00 -systemState -allCritical -quiet }
Invoke-Command SBD-DC01.sbd.test, SBD-DC02.sbd.test { wbadmin get versions }   # after the first run
Enable-ADOptionalFeature 'Recycle Bin Feature' -Scope ForestOrConfigurationSet -Target sbd.test -Server SBD-DC01.sbd.test
Get-ADOptionalFeature -Filter {Name -like 'Recycle Bin*'} | Select-Object Name, EnabledScopes
Get-FileHash -Algorithm SHA256 C:\Evidence\recovery\backup-catalog.txt
```

**Verify:** Both DCs show scheduled, completed system state and critical-volume versions on their protected volumes, the Recycle Bin reports an enabled scope, and the decision tree names the tool for each failure class.

**Evidence:** Keep the backup schedules and version listings, the hashed catalog, the Recycle Bin enablement record, and the restore decision tree.

Notes / result / date: __________________________

## Back up the CA, services, policy, and records

- [ ] Back up the issuing CA — database and private key — with certutil to SBD-SUBCA01's protected backup volume (E:\Backups\CA in this sample), and export its registry configuration beside it, because a restored database needs the CA's settings too. Never write it to C:\Evidence: the private key is a secret, and secrets never go into evidence. Protect it to the standard of the course 1.6 ceremony, record custody, and put only the hashes and the custody record in evidence; SBD-ROOTCA01's ceremony backup is verified against its record, never duplicated or brought onto the network.
- [ ] Refresh the Group Policy backup the way course 1.5 made it: Backup-GPO -All, now the whole policy estate (course 1.6's SBD Certificate Autoenrollment and course 1.8's tier logon GPOs included), into C:\Evidence\recovery\gpo-backup on AdminJumpBox01, with every link exported beside it — a restored GPO brings back its settings and permissions, not its links. The sealed course 1.5 set stays as it is.
- [ ] Take a fresh SBD-DHCP01 set the course 1.7 way — Backup-DhcpServer for the database and Export-DhcpServer for the configuration and leases, in D:\Backups\DHCP with their hashes — and write its restore note: after Restore-DhcpServer, set the DNS update credential again with Set-DhcpServerDnsCredential from the sealed record, because the backup doesn't carry it.
- [ ] Add the Tier 1 sets that can't be re-derived: SBD-REPO01's snapshot catalog in /srv/repo-records with the current and previous snapshots and their manifests (course 1.9), SBD-SPLUNK01's configuration in /opt/splunk/etc (course 1.12 — it holds keys, so it stays on protected media; the indexes are a working copy, and the record itself lives on SBD-AUDIT01), and D:\Inventory on SBD-MGMT01 (course 1.15). Record their hashes in C:\Evidence\recovery on SBD-ADMIN-SRV01.
- [ ] Confirm the log archive's protection already satisfies this course — SBD-AUDIT01's hashed archives in D:\LogArchive and their catalog (D:\LogArchive\Catalog\catalog.csv) are themselves the record — and add both to the recovery set, so the evidence survives the systems it describes.
- [ ] Export the boundary and living records into the set: the service-path register, the exception record (C:\Evidence\exception-record.csv), this course's own sheets, and a read-only export of the core router's configuration taken with the router's own export function from AdminJumpBox01 — this course reads the router's configuration and changes nothing on it. A recovered network without its records would pass no assessment.

**Commands:**

```
# On SBD-SUBCA01 (Tier 0 session): the CA to its protected volume, never to the evidence folder
certutil -backup E:\Backups\CA   # prompts for the password that protects the exported key
reg export HKLM\SYSTEM\CurrentControlSet\Services\CertSvc\Configuration E:\Backups\CA\certsvc-config.reg
Get-ChildItem E:\Backups\CA -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv E:\Backups\ca-backup-hashes.csv -NoTypeInformation   # only this list goes to C:\Evidence\recovery
# On AdminJumpBox01: the whole policy estate and every link
New-Item -ItemType Directory C:\Evidence\recovery\gpo-backup -Force | Out-Null
Backup-GPO -All -Path C:\Evidence\recovery\gpo-backup -Comment 'Course 1.19'
@('DC=sbd,DC=test') + (Get-ADOrganizationalUnit -Filter *).DistinguishedName | ForEach-Object { (Get-GPInheritance -Target $_).GpoLinks } | Select-Object Target, Order, DisplayName, Enabled, Enforced | Export-Csv C:\Evidence\recovery\gpo-links.csv -NoTypeInformation
# On SBD-DHCP01 (Tier 1 session): a fresh set; the restore note adds Set-DhcpServerDnsCredential
Backup-DhcpServer -Path D:\Backups\DHCP\course-1.19\database
Export-DhcpServer -File D:\Backups\DHCP\course-1.19\SBD-DHCP01.xml -Leases
# On SBD-REPO01 and SBD-SPLUNK01 (Tier 1 SSH sessions): hash what the recovery set carries
sha256sum /srv/repo-records/* > /srv/repo-records-hashes.txt
sudo tar -czf /root/splunk-etc-$(date +%F).tar.gz -C /opt/splunk etc && sudo sha256sum /root/splunk-etc-*.tar.gz
```

**Verify:** The CA backup and its configuration sit on SBD-SUBCA01's protected backup volume with key custody recorded and only hashes in evidence, the policy and DHCP sets are current with their restore notes, and the catalog covers the repository, analysis configuration, log archive, inventory, router export, and living records.

**Evidence:** Keep the CA backup's hash list and custody record (never the backup itself), the policy backup with its link export, the DHCP set's hashes and restore note, the Tier 1 hash lists, and the complete recovery catalog.

Notes / result / date: __________________________

## Carry the copies to the offline cabinet

- [ ] Assign custodians by tier: a Tier 0 custodian handles the controllers' system state, the issuing CA's database and key backup, the Group Policy set, and the router configuration export; the audit custodian (SBD Audit Custodians, course 1.8) handles the log archive and its catalog from SBD-AUDIT01; a Tier 1 server custodian handles the member-server sets — SBD-DHCP01, SBD-REPO01, SBD-SPLUNK01, and SBD-MGMT01. No one carries a tier they do not hold.
- [ ] For each copy, write the media ID, hash the backup on its protected volume, copy it to encrypted removable media, and verify the hash on the media before it leaves the room. Keep Windows Server Backup's WindowsImageBackup folder layout on the media so wbadmin can read it there.
- [ ] Carry the media to the offline backup cabinet and record the handoff in the custody register: who, what, when, the hashes, and the storage slot. This is the course 1.4 media procedure used for backups.
- [ ] Pull one copy back as a test: find it from the register, verify its hash, and confirm it is readable. Lesson 5's rehearsal restores from a copy that has made this round trip.

**Commands:**

```
# On SBD-DC02 (Tier 0), with encrypted media MEDIA-0012 attached as F:: hash on the volume, copy, hash on the media
Get-ChildItem E:\WindowsImageBackup\SBD-DC02 -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv F:\MEDIA-0012-volume.csv -NoTypeInformation
Copy-Item E:\WindowsImageBackup -Destination F:\ -Recurse
Get-ChildItem F:\WindowsImageBackup\SBD-DC02 -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv F:\MEDIA-0012-media.csv -NoTypeInformation
Compare-Object (Import-Csv F:\MEDIA-0012-volume.csv).Hash (Import-Csv F:\MEDIA-0012-media.csv).Hash   # no output means the copy matches
wbadmin get versions -backupTarget:F: -machine:SBD-DC02   # the media is readable as a backup
```

**Verify:** Every item in the recovery set has an offline copy with matching hashes on the volume and the media, a custody entry with a named custodian of the right tier, and one copy has been retrieved and verified.

**Evidence:** Keep the custodian assignments, the hash pairs (copied into C:\Evidence\recovery on the tier's seat), the custody register entries, and the retrieval test record.

Notes / result / date: __________________________

## Rehearse a real restore, in isolation

- [ ] Stage the rehearsal: the isolated recovery segment has no path to the production VLANs — a restored controller believing it is authoritative must never meet the live directory; that isolation rule is written before the restore starts. Turn the hypervisor's time synchronization off on the rehearsal copy, as for every virtual machine in the path.
- [ ] Restore SBD-DC02 from the offline copy retrieved in lesson 4, timing the work from decision to directory services running against the lesson 1 objective. A system state restore needs the same server instance, so use a copy of SBD-DC02's virtual machine attached only to the isolated segment, start it in DSRM (bcdedit /set safeboot dsrepair, restart, sign in with the DSRM password), and run wbadmin start systemstaterecovery with -authsysvol: the copy is the only controller in its isolated world, so its SYSVOL must be authoritative or SYSVOL and NETLOGON never come up. Restoring to different hardware needs a full server (bare-metal) recovery from the critical-volumes backup instead.
- [ ] Remove the DSRM boot setting (bcdedit /deletevalue safeboot), restart normally, and verify the restored directory the course 1.1 way — services, the SYSVOL and NETLOGON shares, a directory query. Then check the clock: the copy comes back with the time it was saved with, and with no SBD-DC01 to follow nothing corrects it, so compare it with the reference and record the offset; a restored SBD-DC01 in production is checked against the reference before any member follows it (course 1.3). Record what the rehearsal taught — surprises, the measured time, decision-tree updates — then tear the rehearsal down completely.
- [ ] Back in production, from AdminJumpBox01, run the everyday restore: delete a disposable test object, bring it back from the Recycle Bin with attributes intact, and file both rehearsals — the big one and the small one — as the tested-recovery evidence.

**Commands:**

```
# On the isolated copy of SBD-DC02: start in DSRM, then sign in with the DSRM password.
bcdedit /set safeboot dsrepair
shutdown /r /t 0
wbadmin get versions -backupTarget:F: -machine:SBD-DC02   # F: = the retrieved media
wbadmin start systemstaterecovery -version:<version-id> -backupTarget:F: -machine:SBD-DC02 -authsysvol
bcdedit /deletevalue safeboot   # then restart normally
# After the restart, on the restored copy
Get-Service NTDS, DNS, Netlogon, DFSR | Select-Object Name, Status
Get-SmbShare -Name SYSVOL, NETLOGON
Get-ADDomain -Server localhost | Select-Object DNSRoot, PDCEmulator
w32tm /query /status   # then compare Get-Date with the reference clock and record the offset
# Back in production, from AdminJumpBox01: the Recycle Bin rehearsal
Get-ADObject -Filter "Name -eq '<test object name>'" -IncludeDeletedObjects | Restore-ADObject
```

**Verify:** The isolated restore ran in DSRM and reached a healthy directory within (or honestly against) the time objective, its clock offset is recorded, the DSRM boot setting is removed, the teardown is confirmed, and the production object restore returned the test object intact.

**Evidence:** Keep the timed rehearsal log with its verification output and clock reading, the lessons-learned and decision-tree updates, the teardown confirmation, and the object-restore record.

Notes / result / date: __________________________

## File the recovery record and close the path

- [ ] Assemble the recovery record: the requirements and objectives, the backup catalog, both rehearsal results with the measured times, the decision tree, the DHCP restore note, and a named owner with a scheduled next rehearsal — recovery is a practice with a calendar, not a binder. Keep its Tier 0 half in C:\Evidence\recovery on AdminJumpBox01 and its Tier 1 half on SBD-ADMIN-SRV01, each sealed with a manifest.
- [ ] Take the closing snapshot: current Security Content Automation Protocol (SCAP) results for every system on the course 1.5 cadence, each tier from its own seat — Tier 0 from AdminJumpBox01, the Windows and Linux member servers from SBD-ADMIN-SRV01, the fleet from SBD-ADMIN-PC01 — with the recorded benchmark versions, triaged as always: the dated 'as-authorized' picture path 2 will reference. Credentialed vulnerability scanning joins it when course 1.17 (coming soon) arrives.
- [ ] Reconcile the three living records one final time — the inventory on SBD-MGMT01 against the directory, DHCP leases, and WSUS rings (the course 1.15 method), the register against observed behavior, and the exception record against open findings — so the authorization path inherits agreement, not archaeology.
- [ ] Write the Build path's closing note: what exists, where every record lives, and what is intentionally open — then start course 2.1, where this network stops being a project and becomes a system seeking authorization.

**Commands:**

```
# On AdminJumpBox01 (Tier 0), then the same on SBD-ADMIN-SRV01 (Tier 1): seal each half of the recovery record
Get-ChildItem C:\Evidence -Directory | Select-Object Name
Get-ChildItem C:\Evidence\recovery -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\recovery-manifest.csv -NoTypeInformation
Get-FileHash -Algorithm SHA256 C:\Evidence\recovery-manifest.csv
```

**Verify:** The recovery record is complete with an owner and next-rehearsal date and sealed on both seats, the closing SCAP snapshot is filed with triage, and all three living records reconcile cleanly into the handoff note.

**Evidence:** Finish the checklist: the recovery record and its two manifests, the closing SCAP snapshot, the three reconciliations, and the Build path's closing note.

Notes / result / date: __________________________

## Sources

- [Microsoft · Active Directory forest recovery guide](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-guide)
- [Microsoft · Wbadmin (Windows Server Backup)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wbadmin)
- [Microsoft · wbadmin enable backup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wbadmin-enable-backup)
- [Microsoft · wbadmin start systemstaterecovery](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wbadmin-start-systemstaterecovery)
- [Microsoft · AD forest recovery: perform a nonauthoritative restore](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-perform-nonauthoritative-restore)
- [Microsoft · Restore a virtual domain controller](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/virtual-dc/restore-virtualized-domain-controller)
- [Microsoft · AD forest recovery: perform a full server recovery](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-perform-full-server-recovery)
- [Microsoft · Enable-ADOptionalFeature (Active Directory Recycle Bin)](https://learn.microsoft.com/en-us/powershell/module/activedirectory/enable-adoptionalfeature)
- [Microsoft · Certutil reference (CA backup and restore)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil)
- [Microsoft · Backup-GPO](https://learn.microsoft.com/en-us/powershell/module/grouppolicy/backup-gpo)
- [Microsoft · Backup-DhcpServer](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/backup-dhcpserver)
- [Microsoft · Set-DhcpServerDnsCredential](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/set-dhcpserverdnscredential)
- [Microsoft · Windows Time service tools and settings](https://learn.microsoft.com/en-us/windows-server/networking/windows-time-service/windows-time-service-tools-and-settings)
- [NIST · SP 800-53 Rev. 5 security controls (CP family)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
