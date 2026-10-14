# Deliver Windows updates from SBD-WSUS01 — configuration checklist

Secure By Design · Edition 2.0 · 14 October 2026

This course gives every Windows system one road for updates. SBD-WSUS01 never touches the internet: each month a WSUS server on the connected side synchronizes the same scope, and its metadata and update files cross on hashed media to be imported inside. Microsoft deprecated WSUS in September 2024 — it gets no new features — but it still ships in Windows Server and is supported for production use, with security and quality updates under the product lifecycle. Ring timings and dates are sample values for your patch owner to set. Linux packages already have their road, SBD-REPO01 (course 1.9); endpoint protection and credentialed scanning are coming soon, as courses 1.16 and 1.17, and nothing here depends on them.

## Before you start

- [ ] Complete courses 1.1–1.13: the domain with its DNS and time design, the STIG baselines and hardening policies, the PKI, DHCP, the tiered administration seats, SBD-REPO01, the logging pipeline, and the fleet of SBD-PC01–SBD-PC50 with its three pilot machines.
- [ ] Provision SBD-WSUS01 (10.0.20.30, VLAN 20) as a Windows Server virtual machine with a separate data volume (D: in this sample) sized for the update files.
- [ ] Outside the boundary, have an approved connected system that can run a second WSUS server with access to Microsoft Update, and the course 1.4 removable-media procedure for carrying its output across.

## Design the rings and the Windows update rule

- [ ] Write the Windows update rule — the network's one-source-per-type rule, applied to Windows: every Windows system takes updates only from SBD-WSUS01, and anything else is a documented exception. SBD-ROOTCA01 is the standing one: it has no network, so any update it takes is carried by hand at its next ceremony and recorded. Linux packages already have their one source, SBD-REPO01 (course 1.9); protection and scanner content are outside this course.
- [ ] Place every Windows system in one of four rings, in the order rule F06 names. Ring 1, the pilot: the three course 1.13 pilot PCs (SBD-PC01–SBD-PC03) and SBD-WSUS01 itself, the first server to take each server update and one whose loss stops only patching. Ring 2: the other 47 workstations. Ring 3: the member servers and the Tier 1 and Tier 2 seats — SBD-ADMIN-SRV01 and its SBD-ADMIN-PC01 virtual machine — so the seats that would fix a broken workstation update still run the proven one.
- [ ] Ring 4 holds the domain controllers and the rest of Tier 0: SBD-SUBCA01, SBD-PKI-MGMT01 and AdminJumpBox01. It goes last and is Tier 0 work, approved and installed from AdminJumpBox01 with Tier 0 accounts, one system at a time.
- [ ] Write the timing as sample values your patch owner approves: a ring advances only after its machines have installed and reported cleanly for a set soak time — three days after Ring 1 and five after Rings 2 and 3 in this sample. A failed or harmful update stops promotion until it is understood, and nothing skips a ring.
- [ ] Set the crossing cadence: one crossing a month, after Microsoft's monthly security release on the second Tuesday, through the course 1.4 media procedure and on the same run as SBD-REPO01's monthly snapshot (course 1.9) — one custody record, one approval. An urgent out-of-band fix gets an expedited crossing on the same procedure, with shorter soak times the owner approves in writing.
- [ ] Confirm the register: F06 already lets every Windows system reach SBD-WSUS01 — metadata over HTTPS 8531, signed content over HTTP 8530 — with the patch owner as its owner, and A01 and A02 carry the two consoles. Nothing leads out of the network and no row is added for one: the content arrives on media.

**Commands:**

```
# On SBD-ADMIN-SRV01: every Windows computer object and its OU, the input for the ring table
New-Item -ItemType Directory -Force C:\Evidence\patch-protect | Out-Null
([adsisearcher]'(&(objectCategory=computer)(operatingSystem=Windows*))').FindAll() | ForEach-Object { $_.Properties.distinguishedname[0] } | Sort-Object | Set-Content C:\Evidence\patch-protect\windows-computers.txt
(Get-Content C:\Evidence\patch-protect\windows-computers.txt).Count
# On any member: no update policy yet, so no WSUS server is named (expected: no output)
Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate' -ErrorAction SilentlyContinue
```

**Verify:** The rule names its one source and its exceptions, the ring table places every Windows computer object in exactly one ring with the reason for its place, the timing and crossing calendar are written with an approver, and F06, A01 and A02 are confirmed with owners.

**Evidence:** Keep the Windows update rule, the computer list and the ring table built from it, the timing and crossing calendar, and the confirmed register rows.

Notes / result / date: __________________________

## Build SBD-WSUS01 as a disconnected server

- [ ] Build SBD-WSUS01 as a Windows Server virtual machine at 10.0.20.30 on VLAN 20, with a separate data volume for the update files (D: in this sample), both domain controllers for DNS, and the hypervisor's time synchronization turned off, so it takes time from the domain hierarchy (course 1.3). Join it straight into the Servers OU, so course 1.5's member-server STIG policies, course 1.8's tier logon policies and course 1.10's enrolling GPO, linked to the Servers OU when course 1.10 enrolled SBD-DHCP01, apply from its first boot; confirm with w32tm /query /source that it takes time from a domain controller.
- [ ] Install the role with its default database, the Windows Internal Database (WID), and run the post-installation step with the content folder on D:. Microsoft announced in September 2024 that WSUS is deprecated: it gets no new features, but it still ships in Windows Server and is supported for production use, with security and quality updates under the product lifecycle. WID is deprecated too — Microsoft suggests SQL Server for the roles that use it — so record the database choice as a decision to revisit before either is removed.
- [ ] Configure it as a disconnected server: cancel the configuration wizard, which needs Microsoft Update to list products, then in Options store update files locally, enable only the languages your systems use, leave express installation files off (the default), and keep synchronization manual — and never run it. SBD-WSUS01 has no route out; its updates arrive only by import (lesson 3).
- [ ] Decide the scope and record it: the Windows Server and Windows client products the network runs, security and critical updates and — if Microsoft Defender Antivirus protects the endpoints — its definition updates; no upgrades and no drivers, which are planned changes of their own. The connected-side server in lesson 3 synchronizes exactly this scope, because whatever it holds is what crosses.
- [ ] Protect the metadata: add SBD-WSUS01 to the SBD TLS Servers group, then request an SBD Server Authentication certificate (course 1.6) for SBD-WSUS01.sbd.test, bind it to the WSUS Administration site's HTTPS port 8531, require TLS on the five web services Microsoft lists (APIRemoting30, ClientWebService, DSSAuthWebService, ServerSyncWebService and SimpleAuthWebService), and run wsusutil configuressl. Update files stay on HTTP 8530, as F06 says: each one is signed, and its hash reaches the client inside the TLS-protected metadata, so a changed file is refused.
- [ ] Hold the administration to the tier model: scope the 8530 and 8531 inbound rules to the VLANs that hold F06's Windows systems, install the WSUS console on SBD-ADMIN-SRV01 and AdminJumpBox01, and keep WSUS Administrators to the named patch operators and the Tier 0 task accounts that run Ring 4. From AdminJumpBox01, add SBD-WSUS01 to SBD Tier 0 Console Hosts (course 1.8's recorded network-logon exception for this console) and to SBD Event Sources (course 1.10), and restart it once the collector's WinRM scope includes 10.0.20.30 (F17). WSUS can't limit an administrator to some computer groups, so Ring 4's Tier 0 rule — like the audit custodian's separation for SBD-AUDIT01 — is a written procedure, not a technical boundary: record that residual risk in the exception record.

**Commands:**

```
w32tm /query /source   # a domain controller, never the hypervisor's time provider
Install-WindowsFeature -Name UpdateServices -IncludeManagementTools
& "$env:ProgramFiles\Update Services\Tools\wsusutil.exe" postinstall CONTENT_DIR=D:\WSUS
$wsus = Get-WsusServer
$wsus.GetConfiguration() | Select-Object HostBinariesOnMicrosoftUpdate, DownloadExpressPackages, AllUpdateLanguagesEnabled   # expected after Options: False, False, False
$wsus.GetSubscription() | Select-Object SynchronizeAutomatically   # expected: False
# TLS for metadata: the certificate, the 8531 binding, the five services, then wsusutil
$cert = (Get-Certificate -Template SBDServerAuthentication -SubjectName 'CN=SBD-WSUS01.sbd.test' -DnsName SBD-WSUS01.sbd.test -CertStoreLocation Cert:\LocalMachine\My).Certificate
(Get-WebBinding -Name 'WSUS Administration' -Protocol https).AddSslCertificate($cert.Thumbprint, 'My')
'APIRemoting30', 'ClientWebService', 'DSSAuthWebService', 'ServerSyncWebService', 'SimpleAuthWebService' | ForEach-Object { Set-WebConfigurationProperty -PSPath 'IIS:\' -Location "WSUS Administration/$_" -Filter system.webServer/security/access -Name sslFlags -Value Ssl }
& "$env:ProgramFiles\Update Services\Tools\wsusutil.exe" configuressl SBD-WSUS01.sbd.test
Get-WebBinding -Name 'WSUS Administration' | Select-Object protocol, bindingInformation   # http *:8530, https *:8531
Get-LocalGroupMember 'WSUS Administrators'
```

**Verify:** SBD-WSUS01 sits in the Servers OU, takes time from a domain controller, and runs WSUS on WID, stores files locally, never synchronizes, and answers metadata over TLS on 8531 with a certificate that chains to the SBD root; WSUS Administrators holds only the named operators and Tier 0 task accounts; the server is in SBD Tier 0 Console Hosts and forwards its events; and the scope, the database decision and the residual risk are recorded.

**Evidence:** Keep the installation and configuration output, the scope and database decisions, the certificate and binding details, the WSUS Administrators list, the group memberships, and the exception-record entry for the residual risk.

Notes / result / date: __________________________

## Carry updates across the air gap

- [ ] On the approved connected system, run the export server: WSUS on the same Windows Server release as SBD-WSUS01, synchronizing from Microsoft Update with exactly the products, classifications and languages lesson 2 recorded, and storing files locally. It sits outside the boundary and never connects to the lab; its only output is media.
- [ ] After each month's synchronization, approve the updates you need on the export server so it downloads their files, and wait until nothing is still downloading — those approvals only switch the downloads on, and they stay outside. Then, as a local administrator on the export server, run wsusutil export for the metadata package and copy the WsusContent folder: the package carries the update metadata, and the files travel beside it (after the first crossing, only those added since the last one).
- [ ] Hash the package and every file into connected-side-hashes.csv, which travels with the media, and carry the set under the course 1.4 media procedure with its custody record, on the run that also carries SBD-REPO01's snapshot. Declining an update doesn't stop it from being exported, so the export server's scope is the real limit on what crosses.
- [ ] On SBD-WSUS01, hash the media's contents into lab-side-hashes.csv and compare the two lists before opening anything: one mismatch stops the import and becomes a finding. Copy the files into D:\WSUS\WsusContent first, then run wsusutil import locally as a local administrator — Microsoft warns never to import an export from a source you don't trust, and the custody record and matching hashes are how this network earns that trust. A large import can run for hours.
- [ ] Check the import log, confirm the month's updates now appear in the console, and file the crossing in C:\Evidence\patch-protect\transfer: dates, carrier, file count, the package hash, both hash lists and the import log. If WSUS later shows an approved update as still waiting for its files, wsusutil reset makes it re-check its content folder against the database.

**Commands:**

```
# Connected side, on the export server, once every needed file has downloaded
& "$env:ProgramFiles\Update Services\Tools\wsusutil.exe" export E:\2026-10\wsus-export.xml.gz E:\2026-10\export.log
robocopy D:\WSUS\WsusContent E:\2026-10\WsusContent /E   # the first crossing carries the whole folder
Get-ChildItem E:\2026-10 -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv E:\connected-side-hashes.csv -NoTypeInformation
# Inside, on SBD-WSUS01, with the media as E: (no output from Compare-Object means every hash matches)
$t = 'C:\Evidence\patch-protect\transfer\2026-10'; New-Item -ItemType Directory -Force $t | Out-Null
Get-ChildItem E:\2026-10 -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv "$t\lab-side-hashes.csv" -NoTypeInformation
Compare-Object (Import-Csv E:\connected-side-hashes.csv).Hash (Import-Csv "$t\lab-side-hashes.csv").Hash
robocopy E:\2026-10\WsusContent D:\WSUS\WsusContent /E
& "$env:ProgramFiles\Update Services\Tools\wsusutil.exe" import E:\2026-10\wsus-export.xml.gz "$t\import.log"
Copy-Item E:\connected-side-hashes.csv, E:\2026-10\export.log -Destination $t
```

**Verify:** The export server's scope matches lesson 2's record, every hash matches on both sides, the import log reports success, the month's updates appear on SBD-WSUS01, and the crossing record is complete.

**Evidence:** Keep the export server's scope settings, both hash lists and their comparison, the custody record, the export and import logs, and the crossing record with the package hash and file count.

Notes / result / date: __________________________

## Target the rings with computer groups and Group Policy

- [ ] On SBD-WSUS01, create the four computer groups — Ring 1 - Pilot, Ring 2 - Workstations, Ring 3 - Member servers and Ring 4 - Tier 0 — and set the Computers option to Use Group Policy or registry settings on computers. The groups must exist first: a computer whose policy names a group WSUS doesn't have waits in Unassigned Computers until the group is created.
- [ ] From AdminJumpBox01, create one GPO per ring around the same core: Specify intranet Microsoft update service location, with https://SBD-WSUS01.sbd.test:8531 for both detection and statistics; Enable client-side targeting, with the ring's group name; and Do not connect to any Windows Update Internet locations, so no system keeps trying the public service. Leave Allow signed updates from an intranet Microsoft update service location disabled, so only Microsoft-signed updates install.
- [ ] Set each ring's install behaviour in Configure Automatic Updates: option 4, download and schedule the install, at a time that suits the ring's work for Rings 1 to 3, and option 7 — download, then notify to install and to restart, a Windows Server option — for Ring 4, so a domain controller installs only when a Tier 0 operator starts it. Deadlines go on the approvals (two days for Ring 1 and five for Rings 2 and 3 in this sample): at a deadline the update installs whatever the client's own schedule says. Ring 4's approvals carry none.
- [ ] Link the GPOs where the rings live: Ring 2 at the Workstations OU; Ring 3 at the Servers, Audit Servers and Admin Workstations OUs and at Admin Servers, filtered to SBD-ADMIN-SRV01; Ring 4 at the Domain Controllers and Tier 0 Servers OUs and at Admin Servers, filtered to AdminJumpBox01. Link Ring 1 above the ring GPO on the Workstations and Servers OUs (link order 1), security-filtered to a new SBD WSUS Pilot group holding SBD-PC01–SBD-PC03 and SBD-WSUS01, and restart those four so the membership reaches their Kerberos tickets.
- [ ] Prove the targeting on one member of each ring: run gpupdate, read the policy values, and start a detection with the Windows Update Agent's DetectNow call; then confirm on SBD-WSUS01 that each computer sits in its ring's group and that Unassigned Computers is empty. Check Ring 4 from AdminJumpBox01, and record every ring's member list against lesson 1's table.

**Commands:**

```
# On SBD-WSUS01: the four ring groups and client-side targeting
$wsus = Get-WsusServer
'Ring 1 - Pilot', 'Ring 2 - Workstations', 'Ring 3 - Member servers', 'Ring 4 - Tier 0' | ForEach-Object { [void]$wsus.CreateComputerTargetGroup($_) }
$config = $wsus.GetConfiguration(); $config.TargetingMode = 'Client'; $config.Save()
# On AdminJumpBox01 (Tier 0): the links in order, and the pilot GPO's security filter
(Get-GPInheritance -Target 'OU=Workstations,OU=SBD,DC=sbd,DC=test').GpoLinks | Select-Object Order, DisplayName
Get-GPPermission -Name 'SBD WSUS Ring 1 - Pilot' -All | Select-Object @{ n = 'Trustee'; e = { $_.Trustee.Name } }, Permission
# On one member of each ring, after gpupdate /force: its server, its ring, and a detection now
Get-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate | Select-Object WUServer, TargetGroup, DoNotConnectToWindowsUpdateInternetLocations
(New-Object -ComObject Microsoft.Update.AutoUpdate).DetectNow()
# Back on SBD-WSUS01: each ring's members, and nobody unassigned
Get-WsusComputer -ComputerTargetGroups 'Ring 1 - Pilot' | Select-Object FullDomainName, LastSyncTime
Get-WsusComputer -ComputerTargetGroups 'Unassigned Computers'   # expected: no computers
```

**Verify:** Four ring groups exist and WSUS uses client-side targeting; each ring's GPO is linked where its computers live, with the pilot filter and link order in place; one member of each ring shows SBD-WSUS01 and its ring in its policy values; every Windows computer sits in its ring's group; and Unassigned Computers is empty.

**Evidence:** Keep the GPO reports with their links and security filtering, the pilot group's members, each ring's member list from SBD-WSUS01, the policy values from one member per ring, and the install-time and deadline table.

Notes / result / date: __________________________

## Run the first cycle and prove it

- [ ] Approve the month's updates for Ring 1 only, with its deadline, and watch the pilots install and report. Before anything moves, check that the pilot PCs still sign in and apply policy and that SBD-WSUS01 still serves its clients; then approve Ring 2 and Ring 3 on the written soak times, recording for each promotion the numbers that justified it.
- [ ] If an update fails or does harm, stop: leave it unapproved for the later rings and, where the update supports removal, approve it for removal in the rings that installed it. Windows client quality updates delivered through the Unified Update Platform can't be removed through WSUS, so the pilot is where they have to prove themselves.
- [ ] Ring 4 is Tier 0 work from AdminJumpBox01. First read the approval history and confirm that every Ring 4 approval was made by a Tier 0 account — WSUS records who approved what, for which group. Then install on SBD-DC02, restart it, and check it with dcdiag and repadmin /replsummary before touching SBD-DC01; the two Tier 0 servers follow, and AdminJumpBox01 goes last.
- [ ] Report compliance per ring with the UpdateServices cmdlets (the console's built-in reports need Microsoft's Report Viewer runtime, one more package to carry across): computers that still need or failed an approved update, and computers silent for a week. Spot-check one system per ring on the machine itself against WSUS's view of it. WSUS reports what clients tell it, so the spot checks are the independent view.
- [ ] Close the cycle once every ring has installed: Invoke-WsusServerCleanup declines superseded updates that nothing still needs and expired ones, and removes unneeded files and computers silent for 30 days. Then take SBD-WSUS01's first SCAP baseline with course 1.4's SCC and benchmark versions, run locally in a Tier 1 session from SBD-ADMIN-SRV01, answer the IIS server and site STIG items for the WSUS web site in a STIG Viewer checklist (staged across the air gap as in course 1.4), and classify every open item as course 1.4 taught — update files on HTTP 8530 are a deviation candidate, justified by signed files whose hashes travel in TLS-protected metadata.
- [ ] Hand off to course 1.15: the ring table, WSUS's computer list and this cycle's compliance report become inventory sources, the crossing calendar sets when its reconciliation runs, and SBD-MGMT01 joins Ring 3 simply by landing in the Servers OU. Collect the course's records into C:\Evidence\patch-protect on SBD-ADMIN-SRV01 and hash them into a manifest.

**Commands:**

```
# On SBD-WSUS01 (Tier 1): approve for the pilot; deadlines are set in the console's Approve Updates dialog
Get-WsusUpdate -Classification All -Approval Unapproved -Status FailedOrNeeded | Approve-WsusUpdate -Action Install -TargetGroupName 'Ring 1 - Pilot'
Get-WsusComputer -ComputerTargetGroups 'Ring 1 - Pilot' -ComputerUpdateStatus FailedOrNeeded   # expected: none once the ring is clean
Get-WsusComputer -ToLastReportedStatusTime (Get-Date).AddDays(-7)   # computers silent for a week
# On AdminJumpBox01 (Tier 0): who approved each Ring 4 update, then each controller in turn
$wsus = Get-WsusServer -Name SBD-WSUS01.sbd.test -PortNumber 8531 -UseSsl
$wsus.GetUpdateApprovals((New-Object Microsoft.UpdateServices.Administration.UpdateScope)) | Where-Object { $_.GetComputerTargetGroup().Name -eq 'Ring 4 - Tier 0' } | Select-Object CreationDate, AdministratorName, Action
dcdiag /s:SBD-DC02 /q; repadmin /replsummary   # after SBD-DC02 restarts, before SBD-DC01
# Spot check from SBD-ADMIN-SRV01: what a system itself says it installed
Invoke-Command SBD-DHCP01 { Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3 HotFixID, InstalledOn }
# Back on SBD-WSUS01, once every ring has installed
Invoke-WsusServerCleanup -DeclineSupersededUpdates -DeclineExpiredUpdates -CleanupObsoleteUpdates -CleanupUnneededContentFiles -CleanupObsoleteComputers
```

**Verify:** Each ring installed the month's updates in the written order with its promotion recorded, every Ring 4 approval names a Tier 0 account, both controllers were healthy between installs, no computer is failing or silent without an explanation, the spot checks agree with WSUS, SBD-WSUS01 has its first baseline with every open item classified, and the course's records are hashed.

**Evidence:** Keep the per-ring approval and install timeline, the Ring 4 approval history and install record, the compliance and silent-computer reports, the spot checks, the cleanup output, the SCC results and STIG Viewer checklist with classified findings, the manifest, and the handoff note to course 1.15.

Notes / result / date: __________________________

## Sources

- [Microsoft · Windows Server Update Services (WSUS) overview](https://learn.microsoft.com/en-us/windows-server/administration/windows-server-update-services/get-started/windows-server-update-services-wsus)
- [Microsoft · Features removed or no longer developed in Windows Server](https://learn.microsoft.com/en-us/windows-server/get-started/removed-deprecated-features-windows-server)
- [Microsoft · Plan your WSUS deployment](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/plan/plan-your-wsus-deployment)
- [Microsoft · Step 1: Install the WSUS server role](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/deploy/1-install-the-wsus-server-role)
- [Microsoft · Step 2: Configure WSUS (TLS, computer groups, air-gapped networks)](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/deploy/2-configure-wsus)
- [Microsoft · Step 4: Configure Group Policy settings for automatic updates](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/deploy/4-configure-group-policy-settings-for-automatic-updates)
- [Microsoft · Synchronize software updates from a disconnected software update point (WSUSUtil export and import)](https://learn.microsoft.com/intune/configmgr/sum/get-started/synchronize-software-updates-disconnected)
- [Microsoft · Managing WSUS client computers and WSUS computer groups](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/manage/managing-wsus-client-computers-and-wsus-computer-groups)
- [Microsoft · Deploy Windows client updates using WSUS (rings and client-side targeting)](https://learn.microsoft.com/windows/deployment/update/waas-manage-updates-wsus)
- [Microsoft · WSUS updates operations (approvals, deadlines, removal)](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/manage/updates-operations)
- [Microsoft · The WSUS Server Cleanup Wizard](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/manage/the-server-cleanup-wizard)
- [Microsoft · Get-WsusComputer](https://learn.microsoft.com/en-us/powershell/module/updateservices/get-wsuscomputer)
- [Microsoft · Group Policy scope](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-scope)
- [Microsoft · Dcdiag](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/dcdiag)
- [Microsoft · Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash)
- [DISA · SCAP content and the SCAP Compliance Checker (SCC)](https://www.cyber.mil/stigs/SCAP/)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
