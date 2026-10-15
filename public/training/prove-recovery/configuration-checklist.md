# Prove you can recover — configuration checklist

Secure By Design · Edition 1.4 · 14 October 2026

The model's final chapter: a network that cannot come back was never really built. This course is the one place every backup in the network is defined and scheduled — the directory, both CAs, Group Policy, DHCP, the repository and analysis configuration, the VLAN 40 business services with their permissions, logins and certificates, the log record, and the living records — then proves one real restore in isolation and files the tested-recovery evidence the authorization path expects.

## Before you start

- [ ] Complete courses 1.1–1.18 (courses 1.16 and 1.17 are coming soon and aren't needed): the full network, the VLAN 40 business services, their records, the protected log archive, and the living inventory all exist.
- [ ] Provision the backup storage this course schedules into: a protected backup volume (E: in this sample) on every Windows server in the recovery set — both domain controllers, SBD-SUBCA01, SBD-DHCP01, SBD-MGMT01, SBD-FS01, SBD-SQL01 and SBD-APPS01 — never one of the volumes being backed up and written only by the backup jobs, and a separate volume mounted at /srv/backup, readable by root alone, on SBD-REPO01, SBD-SPLUNK01 and SBD-WEB01. Earlier courses set up no backup jobs; this course defines and schedules every one. Also provide an offline backup cabinet with removable media and a custody register, and an isolated recovery network segment (or host) for the restore rehearsal.
- [ ] Have the custody records handy: the sealed Directory Services Restore Mode (DSRM) passwords set in course 1.1 and the course 1.6 ceremony record for SBD-ROOTCA01's protected backup — recovery is where those promises come due.

## Decide what recovery must prove

- [ ] Write the recovery set in dependency order — the order the path built it: the directory on both controllers first, because everything trusts it; then the certificate authorities (SBD-SUBCA01's database and key, and SBD-ROOTCA01's course 1.6 ceremony backup); Group Policy; SBD-DHCP01 (course 1.7); the boundary's records (the service-path register and the core router's configuration); SBD-REPO01's snapshot catalog and snapshots (course 1.9); SBD-SPLUNK01's configuration (course 1.12); the log archive and its catalog on SBD-AUDIT01 (course 1.11); the inventory on SBD-MGMT01 (course 1.15); the VLAN 40 business services (course 1.18) — SBD-FS01's share data with its NTFS permissions, SBD-SQL01's databases and the logins they depend on, SBD-APPS01's and SBD-WEB01's configuration and certificates; and the exception record.
- [ ] Set the two numbers per item: how much history may be lost (recovery point) and how long restoration may take (recovery time) — lab-honest values you will actually measure against in lesson 5, not aspirations. A directory backup older than the forest's tombstone lifetime (180 days by default) can't be restored at all, so the directory's recovery point stays well inside it.
- [ ] Write the backup schedule, the one place every backup in this network is defined: for each item, what is captured, the tool, when it runs, where it lands, and who restores it. No earlier course scheduled a backup; the one build-time copy is SBD-ROOTCA01's, taken inside the course 1.6 ceremony, and the schedule accounts for it rather than repeating it. Lessons 2 and 3 put each row into effect.
- [ ] Decide backup placement: each protected backup volume is written only by its backup jobs and readable by the recovery role, and custodians of the matching tier carry copies to the offline backup cabinet on media — the air-gapped network's version of an off-site copy. There is no backup server and no network path to the cabinet.
- [ ] Confirm the standing custody items: the DSRM passwords set in course 1.1 are sealed and findable, and SBD-ROOTCA01's protected backup from the course 1.6 ceremony is accounted for — recovery depends on secrets that must exist before the bad day.

**Commands:**

```
# On each Windows server in the recovery set: capture the current protection state before this course changes it.
wbadmin get versions
Get-Volume -DriveLetter E | Select-Object DriveLetter, FileSystemLabel, SizeRemaining   # the protected backup volume
# The tombstone lifetime bounds the directory's recovery point (empty means the 180-day default).
(Get-ADObject "CN=Directory Service,CN=Windows NT,CN=Services,$((Get-ADRootDSE).configurationNamingContext)" -Properties tombstoneLifetime).tombstoneLifetime
```

**Verify:** The recovery set is ordered by dependency with point and time objectives per item, the backup schedule defines every backup in one place, the placement and access rules are written, and the DSRM and root-key custody records check out.

**Evidence:** Keep the recovery requirements sheet, the objectives table, the backup schedule, the placement and access decisions, and the custody verification notes.

Notes / result / date: __________________________

## Back up Tier 0: directory, CA, and policy

- [ ] In a Tier 0 session from AdminJumpBox01, schedule Windows Server Backup on SBD-DC01 and SBD-DC02, each to its own protected backup volume, with the system state and all critical volumes (wbadmin's -systemState and -allCritical): the system state is what a directory restore in DSRM needs, and the critical volumes let the same backup rebuild a controller whose hardware is gone. Two controllers, two independent backups — replication is availability and was never recovery, as course 1.1 put it.
- [ ] After the first run, verify each backup's completion, record its version identifier in the backup catalog (C:\Evidence\recovery on AdminJumpBox01), and hash the catalog — an unverified backup is a hope with a timestamp.
- [ ] Back up the issuing CA. Schedule SBD-SUBCA01's own system state and critical-volume backup to its protected volume, so the server can be rebuilt; then take the CA's own backup — database and private key — with certutil to E:\Backups\CA, with its registry configuration exported beside it, on the cadence the schedule sets and after every CA key renewal. It prompts for the password that protects the key, so it is a Tier 0 task, never an unattended one. Never write it to C:\Evidence: the private key is a secret, and secrets never go into evidence. Record custody and put only the hashes in evidence; SBD-ROOTCA01's ceremony backup is verified against its record, never duplicated or brought onto the network.
- [ ] Schedule the Group Policy backup: a daily task on SBD-DC01, running as SYSTEM from a script folder only Tier 0 administrators can write, that runs Backup-GPO -All into a dated folder on E:\Backups\GPO and exports every link beside it — a restored GPO brings back its settings and permissions, not its links. That covers the whole estate, course 1.6's SBD Certificate Autoenrollment and course 1.8's tier logon GPOs included; the GPO reports and link exports courses 1.5 and 1.6 filed stay as their change records.
- [ ] Enable the Active Directory Recycle Bin from the Tier 0 seat — a one-way, forest-level change run against the domain naming master (SBD-DC01) and recorded as the change it is — so a deleted user or OU comes back intact without touching system state. Objects deleted before it was enabled can come back only from a backup.
- [ ] Write the restore decision tree: deleted object → Recycle Bin; corrupted DC on its own hardware → system state restore in DSRM (lesson 5's rehearsal); DC whose hardware is gone → full server (bare-metal) recovery from the critical-volumes backup; a damaged GPO → Restore-GPO from the dated set, then its links from the export; whole-forest loss → the Microsoft forest recovery guide, referenced and staged with the evidence rather than improvised on the day.

**Commands:**

```
# Tier 0 session from AdminJumpBox01: daily schedules on each controller and the issuing CA (E: is never a volume being backed up)
Invoke-Command SBD-DC01.sbd.test, SBD-DC02.sbd.test, SBD-SUBCA01.sbd.test { wbadmin enable backup -addtarget:E: -schedule:21:00 -systemState -allCritical -quiet }
Invoke-Command SBD-DC01.sbd.test, SBD-DC02.sbd.test { wbadmin get versions }   # after the first run
# On SBD-SUBCA01 (Tier 0 session): the CA's own backup, to its protected volume, never to the evidence folder
certutil -backup E:\Backups\CA   # prompts for the password that protects the exported key
reg export HKLM\SYSTEM\CurrentControlSet\Services\CertSvc\Configuration E:\Backups\CA\certsvc-config.reg
Get-ChildItem E:\Backups\CA -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv E:\Backups\ca-backup-hashes.csv -NoTypeInformation   # only this list goes to C:\Evidence\recovery
# On SBD-DC01: C:\Scripts\Backup-SbdGpo.ps1 (writable by Tier 0 administrators only) runs these lines, then the task runs it daily
#   $d = 'E:\Backups\GPO\{0:yyyy-MM-dd}' -f (Get-Date); New-Item -ItemType Directory $d -Force | Out-Null; Backup-GPO -All -Path $d
#   @('DC=sbd,DC=test') + (Get-ADOrganizationalUnit -Filter *).DistinguishedName | ForEach-Object { (Get-GPInheritance -Target $_).GpoLinks } | Select-Object Target, Order, DisplayName, Enabled, Enforced | Export-Csv "$d\gpo-links.csv" -NoTypeInformation
Register-ScheduledTask 'SBD GPO backup' -Action (New-ScheduledTaskAction -Execute powershell.exe -Argument '-NoProfile -File C:\Scripts\Backup-SbdGpo.ps1') -Trigger (New-ScheduledTaskTrigger -Daily -At 22:00) -User 'NT AUTHORITY\SYSTEM' -RunLevel Highest
# Back on AdminJumpBox01: the Recycle Bin, then the catalog
Enable-ADOptionalFeature 'Recycle Bin Feature' -Scope ForestOrConfigurationSet -Target sbd.test -Server SBD-DC01.sbd.test
Get-ADOptionalFeature -Filter {Name -like 'Recycle Bin*'} | Select-Object Name, EnabledScopes
Get-FileHash -Algorithm SHA256 C:\Evidence\recovery\backup-catalog.txt
```

**Verify:** Both DCs and SBD-SUBCA01 show scheduled, completed system state and critical-volume versions on their protected volumes; the CA backup and its configuration sit on SBD-SUBCA01's protected volume with key custody recorded and only hashes in evidence; the GPO task has written a dated set with its link export; the Recycle Bin reports an enabled scope; and the decision tree names the tool for each failure class.

**Evidence:** Keep the backup schedules and version listings, the CA backup's hash list and custody record (never the backup itself), the GPO task definition and its first set's hashes, the hashed catalog, the Recycle Bin enablement record, and the restore decision tree.

Notes / result / date: __________________________

## Back up the member servers and records

- [ ] In Tier 1 sessions from SBD-ADMIN-SRV01, schedule SBD-DHCP01: a daily task, running as SYSTEM from a script folder only SBD Tier 1 Admins can write, takes Backup-DhcpServer into the default backup folder, copies it to a dated folder on E:\Backups\DHCP with an Export-DhcpServer of the configuration and leases, and hashes both. File course 1.7's restore note with it: after Restore-DhcpServer, set the DNS update credential again with Set-DhcpServerDnsCredential from the sealed record, because the backup doesn't carry it. On SBD-MGMT01, schedule Windows Server Backup of D:\Inventory (course 1.15) to its E:.
- [ ] Schedule SBD-FS01: Windows Server Backup of D:\Shares to its E: every night. It keeps each file's NTFS permissions, and a file recovery restores them by default — never run it with -notRestoreAcl. Beside it, after every access change, save the readable record: icacls /save of the share tree's ACLs and an export of the share definitions (the LanmanServer Shares registry key, which also holds the share permissions), so permissions can be checked or reapplied without restoring data.
- [ ] Schedule SBD-SQL01 inside the engine: a nightly SQL Server Agent job backs up each application database and the master, model and msdb system databases WITH CHECKSUM to E:\Backups\SQL, then checks each file with RESTORE VERIFYONLY. The engine writes the files as its gMSA, so grant SBD\SBD-SQL$ modify on that folder alone. master is where the logins live, msdb holds the Agent jobs, and the application databases' users map to the SBD\SBD-Apps$ login by its directory SID — so record the logins and each database's user mappings, and write the restore order: the instance and master (or the logins, recreated from the record) before the application databases. Use the simple recovery model unless your lesson 1 recovery point needs log backups, and a rebuilt SBD-SQL01 requests a new certificate through the course 1.6 process.
- [ ] Schedule SBD-APPS01's Windows Server Backup with system state and critical volumes to its E:, so its services' configuration and its certificate, private key included, come back with the server — which is why the course 1.6 template never needs exportable keys. On SBD-WEB01, a root cron job in /etc/cron.d writes a dated tar archive of /etc/httpd, /etc/pki/tls (the certificate and its root-only key) and /etc/sssd, with SELinux contexts and ACLs, to /srv/backup with its SHA-256; SBD-REPO01 does the same for /srv/repo-records and the current snapshot each time it changes, so the previous one is already on media (course 1.9), and SBD-SPLUNK01 for /opt/splunk/etc (course 1.12 — the indexes are a working copy, and the record itself lives on SBD-AUDIT01). The WEB01 and Splunk archives hold keys, so they stay on protected media.
- [ ] Account for the log archive: SBD-AUDIT01's hashed archives in D:\LogArchive and their catalog (D:\LogArchive\Catalog\catalog.csv) are themselves the record, so their backup is the audit custodian's offline copy on the schedule's cadence (lesson 4), and no job runs on that server.
- [ ] Export the boundary and living records into the set: the service-path register, the exception record (C:\Evidence\exception-record.csv), this course's own sheets, and a read-only export of the core router's configuration taken with the router's own export function from AdminJumpBox01 — this course reads the router's configuration and changes nothing on it. Record every first run's hashes in C:\Evidence\recovery on SBD-ADMIN-SRV01. A recovered network without its records would pass no assessment.

**Commands:**

```
# Tier 1 sessions from SBD-ADMIN-SRV01. On SBD-DHCP01, the task script (C:\Scripts, writable by SBD Tier 1 Admins only):
$b = 'E:\Backups\DHCP\{0:yyyy-MM-dd}' -f (Get-Date); New-Item -ItemType Directory $b -Force | Out-Null; $dir = Join-Path $env:windir 'System32\dhcp\backup'
Backup-DhcpServer -Path $dir; Copy-Item $dir (Join-Path $b 'database') -Recurse; Export-DhcpServer -File (Join-Path $b 'SBD-DHCP01.xml') -Leases
# On SBD-MGMT01, SBD-FS01 and SBD-APPS01: one daily schedule each, to the local E:
wbadmin enable backup -addtarget:E: -include:D:\Inventory -schedule:22:00 -quiet   # SBD-MGMT01
wbadmin enable backup -addtarget:E: -include:D:\Shares -schedule:22:00 -quiet   # SBD-FS01; then, after each access change:
icacls D:\Shares\* /save E:\Backups\FS01\shares-acl.txt /t /c; reg export HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Shares E:\Backups\FS01\shares.reg /y
wbadmin enable backup -addtarget:E: -schedule:22:30 -systemState -allCritical -quiet   # SBD-APPS01
# On SBD-SQL01: the engine's identity may write the backup folder; the Agent job's step runs this T-SQL for each database
icacls E:\Backups\SQL /grant 'SBD\SBD-SQL$:(OI)(CI)M'
#   BACKUP DATABASE [master] TO DISK = N'E:\Backups\SQL\master.bak' WITH CHECKSUM, INIT;   -- then model, msdb, each application database
#   RESTORE VERIFYONLY FROM DISK = N'E:\Backups\SQL\master.bak' WITH CHECKSUM;
sqlcmd -S SBD-SQL01.sbd.test -E -Q "SELECT name, type_desc, sid FROM sys.server_principals WHERE type IN ('U','G','S')"   # the login record
# On SBD-WEB01 (and the same pattern on SBD-REPO01 and SBD-SPLUNK01): the cron job's work, run once by hand
sudo tar --selinux --acls --xattrs -czf /srv/backup/web01-$(date +%F).tar.gz /etc/httpd /etc/pki/tls /etc/sssd
sudo sha256sum /srv/backup/web01-*.tar.gz
```

**Verify:** Every member-server row in the schedule has run once and verified: SBD-DHCP01's set with its restore note, D:\Inventory, SBD-FS01's shares with the ACL record and share definitions, SBD-SQL01's application and system databases verified with RESTORE VERIFYONLY and the login record filed, SBD-APPS01's full-server backup, and the dated archives on SBD-WEB01, SBD-REPO01 and SBD-SPLUNK01 — and the catalog covers them with the log archive, router export, and living records.

**Evidence:** Keep the task, job and cron definitions, each first run's hashes, the DHCP and SQL restore notes, the ACL record and share export hashes, the login record, and the complete recovery catalog — never the WEB01 or Splunk archives themselves, which hold keys.

Notes / result / date: __________________________

## Carry the copies to the offline cabinet

- [ ] Assign custodians by tier: a Tier 0 custodian handles the controllers' system state, the issuing CA's database and key backup, the Group Policy set, and the router configuration export; the audit custodian (SBD Audit Custodians, course 1.8) handles the log archive and its catalog from SBD-AUDIT01; a Tier 1 server custodian handles the member-server sets — SBD-DHCP01, SBD-REPO01, SBD-SPLUNK01, SBD-MGMT01, and the VLAN 40 servers SBD-FS01, SBD-SQL01, SBD-APPS01 and SBD-WEB01. No one carries a tier they do not hold.
- [ ] On the cadence the backup schedule sets, for each copy, write the media ID, hash the backup on its protected volume, copy it to encrypted removable media, and verify the hash on the media before it leaves the room. Keep Windows Server Backup's WindowsImageBackup folder layout on the media so wbadmin can read it there.
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

- [ ] Assemble the recovery record: the requirements and objectives, the backup schedule and catalog, both rehearsal results with the measured times, the decision tree, the DHCP and SQL restore notes, and a named owner with a scheduled next rehearsal that rotates through the set — an SBD-FS01 folder restored with its permissions, an SBD-SQL01 database with its logins, SBD-DHCP01 with its credential step — recovery is a practice with a calendar, not a binder. Keep its Tier 0 half in C:\Evidence\recovery on AdminJumpBox01 and its Tier 1 half on SBD-ADMIN-SRV01, each sealed with a manifest.
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
- [Microsoft · Register-ScheduledTask](https://learn.microsoft.com/en-us/powershell/module/scheduledtasks/register-scheduledtask)
- [Microsoft · wbadmin start recovery](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wbadmin-start-recovery)
- [Microsoft · icacls](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls)
- [Microsoft · BACKUP (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/backup-transact-sql)
- [Microsoft · Back up and restore: system databases (SQL Server)](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/back-up-and-restore-of-system-databases-sql-server)
- [NIST · SP 800-53 Rev. 5 security controls (CP family)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
