# Keep the living inventory on SBD-MGMT01 — configuration checklist

Secure By Design · Edition 1.0 · 14 October 2026

Course 1.13 handed over a snapshot of the fleet; this course makes the whole network's component inventory a living record on SBD-MGMT01 — NIST SP 800-53 CM-8 in practice. The server keeps the record and reaches into nothing: the directory, the DHCP leases, the WSUS computer list, SBD-REPO01's records and the baseline sessions it is checked against arrive through the administrators' existing sessions. Column names and the monthly cadence are sample values; the system owner decides.

## Before you start

- [ ] Complete courses 1.1–1.14: every system those courses built is running, course 1.13's fleet inventory is filed, and SBD-WSUS01 serves all four update rings.
- [ ] Provision SBD-MGMT01 (10.0.70.10, VLAN 70) as a Windows Server virtual machine with a separate data volume (D: in this sample) for the record.
- [ ] Keep the records earlier courses produced within reach: the service-path register, course 1.14's ring table and WSUS computer list, course 1.9's snapshot catalog, each course's baseline sessions, and the exception record.

## Design the inventory and its keeper

- [ ] Draw the boundary as CM-8 asks: every component of this network, each counted once, and nothing from outside it. That is every server and controller (SBD-ROOTCA01 included, offline in the vault), the three administration seats, each of the 50 PCs, the core and the VLAN 80 access switch, and the seven hypervisor hosts (SBD-HV01–SBD-HV07) on which Inside the Network places the virtual machines. The connected-side systems that fill the media stay out; the crossing records name them.
- [ ] Choose the columns, one per attribute: name, type, role, operating system and version, domain membership, address and VLAN, OU, tier, location (host and rack), update source (a WSUS ring, an SBD-REPO01 snapshot, or by hand at a ceremony), latest baseline, the course that built it, an accountable owner by role (CM-8(4)), and status — planned, active or retired. Record the systems the design names but no course has built yet, SBD-EPO01, SBD-NESSUS01 and the four VLAN 40 servers, as planned, so a reconciliation never mistakes them for missing.
- [ ] Name the records that can contradict it and what each one proves: the directory shows what joined the domain, the DHCP leases what is on VLAN 80 now, WSUS's computer list what reports for updates and in which ring, SBD-REPO01's catalog and access log which Linux servers take packages, and the baseline sessions which hosts have a measured state. Any disagreement is a finding, and lesson 5 makes the comparison a monthly check.
- [ ] Place the keeper as Inside the Network does: SBD-MGMT01, Windows Server at 10.0.70.10 on VLAN 70 beside SBD-REPO01, a Tier 1 member server administered only from SBD-ADMIN-SRV01 (rule A02). The model leaves its listeners to define: define them as management only, and give it no collection path of its own — source data arrives through the administrators' existing sessions, so the server that holds the record can't reach, or be used to reach, anything else. Its domain rows (F01–F03, F06 in Ring 3, F09, F17 and F18) already list it.

**Commands:**

```
# On SBD-ADMIN-SRV01: start the course record with the inventory's columns
New-Item -ItemType Directory -Force C:\Evidence\management-server | Out-Null
'Name,Type,Role,OS,Domain,Address,VLAN,OU,Tier,Location,UpdateSource,Baseline,BuiltIn,Owner,Status' | Set-Content C:\Evidence\management-server\inventory-columns.csv
# SBD-MGMT01 isn't registered yet; its neighbour on VLAN 70 is
Resolve-DnsName SBD-MGMT01.sbd.test -ErrorAction SilentlyContinue   # expected: no answer
Resolve-DnsName SBD-REPO01.sbd.test | Select-Object Name, IPAddress   # 10.0.70.20
```

**Verify:** The boundary lists every component once, with the planned systems marked; the columns cover identity, place, tier, update source, baseline and an accountable owner; each discovery source is named with what it proves; and SBD-MGMT01's placement, administration and lack of any collection path are written down.

**Evidence:** Keep the boundary list, the column definitions, the source table with what each source proves, and SBD-MGMT01's placement and administration decision.

Notes / result / date: __________________________

## Build and harden SBD-MGMT01

- [ ] Build SBD-MGMT01 as a Windows Server virtual machine — on SBD-HV07 beside SBD-REPO01, where Inside the Network places it — with the hypervisor's time synchronization turned off, so the domain is its only clock, a separate data volume for the record (D: in this sample), the static address 10.0.70.10/24 with the core's VLAN 70 interface as gateway (10.0.70.1 in this sample), and both domain controllers for DNS. Join it straight into the Servers OU, so course 1.5's STIG policies, course 1.8's tier logon policies, course 1.10's event-forwarding GPO (linked to the Servers OU in course 1.10) and course 1.14's Ring 3 update policy apply from its first boot.
- [ ] Check that it took its place: time from a domain controller within course 1.3's threshold, and an update policy that names SBD-WSUS01 and Ring 3, with SBD-WSUS01 listing it there. Add it to SBD Event Sources from AdminJumpBox01, widen the collector's WinRM scope to 10.0.70.10 (F17) from SBD-ADMIN-SRV01, and restart it so its security events reach SBD-SYSLOG01.
- [ ] Close it to everything but its administration: Windows Defender Firewall on in every profile, and the existing Remote Desktop and Windows Remote Management rules scoped to SBD-ADMIN-SRV01 (10.0.60.20), because allow rules add up and a new, narrower rule would not restrict the broad ones. Install no other role and no agent; course 1.8's Servers OU policy already denies Tier 0 accounts here.
- [ ] Prepare the record on D:: an Inventory folder with inheritance removed and full control for SYSTEM and Administrators only — the volume's inherited defaults let ordinary users read and create files — holding current, history, sources and findings folders. Every published version is copied into history with its SHA-256 in a hash list, and every change gets a line in a change log: who, what, why, and the change record it answers.
- [ ] Prove the closure: a remote session from SBD-ADMIN-SRV01 opens, the same attempt from SBD-ADMIN-PC01 fails at the core because rule A02 names only the Tier 1 seat, and the firewall's remote-address lists show only 10.0.60.20 for management.

**Commands:**

```
# In a session on SBD-MGMT01 from SBD-ADMIN-SRV01
([adsisearcher]"(&(objectCategory=computer)(name=$env:COMPUTERNAME))").FindOne().Path   # ...OU=Servers,OU=SBD,DC=sbd,DC=test
w32tm /query /source   # a domain controller, never the local clock
Get-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate | Select-Object WUServer, TargetGroup   # Ring 3 - Member servers
Get-NetFirewallRule -DisplayGroup 'Remote Desktop', 'Windows Remote Management' -Enabled True | Get-NetFirewallAddressFilter | Select-Object InstanceID, RemoteAddress   # 10.0.60.20 only
New-Item -ItemType Directory -Force D:\Inventory | Out-Null
icacls D:\Inventory /inheritance:r /grant:r 'SYSTEM:(OI)(CI)F' 'Administrators:(OI)(CI)F'
'current', 'history', 'sources', 'findings' | ForEach-Object { New-Item -ItemType Directory -Force "D:\Inventory\$_" | Out-Null }
icacls D:\Inventory
# From SBD-ADMIN-PC01: the same management path must fail
Test-NetConnection SBD-MGMT01.sbd.test -Port 5985   # expected: TcpTestSucceeded False
```

**Verify:** SBD-MGMT01 sits in the Servers OU with the hypervisor's time synchronization off and time from a domain controller, reports to Ring 3 on SBD-WSUS01, forwards its security events, accepts management only from 10.0.60.20 and refuses SBD-ADMIN-PC01, runs no extra role or agent, and holds an Inventory folder that only SYSTEM and Administrators can open.

**Evidence:** Keep the OU placement, the time source, the update policy values and WSUS listing, the firewall scope, the refused connection from SBD-ADMIN-PC01, and the Inventory folder's permissions.

Notes / result / date: __________________________

## Build the living inventory

- [ ] Start from the records the path already keeps rather than from memory: course 1.13's fleet inventory for the 50 PCs (names, image ancestry, certificate thumbprints, sample status), the service-path register and Inside the Network for names, addresses and locations, course 1.14's ring table for the update rings, course 1.9's snapshot catalog for SBD-REPO01, and each course's baseline set for the latest baseline date.
- [ ] Load the inventory with every component the boundary lists — the fleet, the servers (SBD-REPO01 included, with its current snapshot as its update source), the admin plane, the core, the access switch and the hypervisor hosts — each with every column filled: the CM-8 component inventory, in one place. Add the planned systems as planned.
- [ ] Define currency: every build, move and retirement updates the inventory as part of its own procedure (CM-8(1)), so each later course's build lesson adds its rows, and a monthly reconciliation compares the inventory against the directory, the DHCP leases and the WSUS computer list — drift between them is a finding.
- [ ] Name the owner — a role, with a named deputy — who approves each change, and publish the first version: copy it into history with its hash and log the change. Course 2.2 shows how a record like this one joins the Body of Evidence for the configuration-management controls.

**Commands:**

```
# In a session on SBD-MGMT01 from SBD-ADMIN-SRV01, once the record is filled in
$inv = Import-Csv D:\Inventory\current\inventory.csv
$inv | Group-Object Status | Select-Object Name, Count
$inv | Group-Object Name | Where-Object Count -gt 1 | Select-Object Name   # expected: nothing counted twice
$inv | Where-Object { $_.Status -eq 'active' -and (-not $_.Owner -or -not $_.UpdateSource -or -not $_.Location) } | Select-Object Name   # expected: nothing
$stamp = Get-Date -Format yyyy-MM-dd
Copy-Item D:\Inventory\current\inventory.csv "D:\Inventory\history\inventory-$stamp.csv"
Get-FileHash -Algorithm SHA256 "D:\Inventory\history\inventory-$stamp.csv" | Export-Csv D:\Inventory\history\hashes.csv -Append -NoTypeInformation
```

**Verify:** The inventory lists every component in the boundary exactly once with every column filled, planned systems are marked planned, the update-on-change rule and the monthly reconciliation are written with an owner and deputy, and the first version is in history with its hash.

**Evidence:** Keep the populated inventory export, the status counts and completeness checks, the currency rule with its owner and cadence, and the first version's hash.

Notes / result / date: __________________________

## Feed it from what the network already knows

- [ ] Read the directory over LDAP from SBD-ADMIN-SRV01: every computer object's name, operating system, distinguished name (which gives its OU) and lastLogonTimestamp. Use an LDAP search rather than the Active Directory module, whose Web Services port the controllers open only to AdminJumpBox01, and read lastLogonTimestamp as a sign of staleness, not of last use: it is updated only when the stored value is 9 to 14 days old.
- [ ] Export the leases on SBD-DHCP01 in a session from SBD-ADMIN-SRV01: every lease in the VLAN 80 scope with its address, client ID (the MAC address), host name, state and expiry. A lease shows what is plugged in now, joined or not; course 1.7's DHCP audit log shows what came and went between exports.
- [ ] Export SBD-WSUS01's computer list the same way: each computer's name, address, last contact, last status report and requested ring. WSUS's cleanup removes computers silent for 30 days (course 1.14), so a machine missing there has been quiet for a month or more.
- [ ] Copy SBD-REPO01's records over SSH as course 1.9 does, and count its web server's access log by client address to see which Linux servers actually take packages. List the baseline sessions in the evidence folders you hold, by host and date; Tier 0 reports its hosts' dates through the change record, because its evidence stays on AdminJumpBox01.
- [ ] File the set: hash every export into a dated list, copy both into D:\Inventory\sources on SBD-MGMT01 through a remoting session, and reduce every name to one key — the short host name, so a lease's SBD-PC07.sbd.test and the directory's SBD-PC07 meet. Take all the sources on the same day; sources taken weeks apart disagree about machines that simply moved.

**Commands:**

```
# On SBD-ADMIN-SRV01 (Tier 1): one dated folder for this month's sources
$d = "C:\Evidence\management-server\sources\$(Get-Date -Format yyyy-MM-dd)"; New-Item -ItemType Directory -Force "$d\repo01" | Out-Null
$s = [adsisearcher]'(objectCategory=computer)'; $s.PageSize = 500
$s.FindAll() | ForEach-Object { $p = $_.Properties; [pscustomobject]@{ Name = "$($p.name)"; OS = "$($p.operatingsystem)"; DN = "$($p.distinguishedname)"; LastLogon = if ("$($p.lastlogontimestamp)") { [datetime]::FromFileTime([long]"$($p.lastlogontimestamp)") } } } | Export-Csv "$d\directory.csv" -NoTypeInformation
Invoke-Command SBD-DHCP01 { Get-DhcpServerv4Lease -ScopeId 10.0.80.0 -AllLeases | Select-Object IPAddress, ClientId, HostName, AddressState, LeaseExpiryTime } | Export-Csv "$d\dhcp-leases.csv" -NoTypeInformation
Invoke-Command SBD-WSUS01 { Get-WsusComputer -All | Select-Object FullDomainName, IPAddress, LastSyncTime, LastReportedStatusTime, RequestedTargetGroupName } | Export-Csv "$d\wsus-computers.csv" -NoTypeInformation
scp -r <your-account>@SBD-REPO01.sbd.test:/srv/repo-records/* "$d\repo01\"
# On SBD-REPO01: who fetched packages (RHEL family; /var/log/apache2/access.log on Ubuntu)
sudo awk '{print $1}' /var/log/httpd/access_log | sort | uniq -c
# Back on SBD-ADMIN-SRV01: hash the set and file it on SBD-MGMT01
Get-ChildItem $d -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv "$d-hashes.csv" -NoTypeInformation
$m = New-PSSession SBD-MGMT01; Copy-Item $d, "$d-hashes.csv" -Destination D:\Inventory\sources\ -ToSession $m -Recurse
```

**Verify:** Each source export exists for the same date with the columns lesson 5 needs, the hash list matches the files copied to SBD-MGMT01, every name reduces to one key, and a note says what each source can and can't prove.

**Evidence:** Keep the dated source exports, their hash list, the REPO01 access-log summary, the baseline-session list, and the note on what each source proves.

Notes / result / date: __________________________

## Reconcile the inventory and prove it

- [ ] On SBD-MGMT01, compare the inventory's active rows with each source by the name key: the domain-joined rows against the directory, the VLAN 80 rows against the leases, and the Windows rows against WSUS's computer list and its rings. In a source but not the record is an unrecorded component; recorded but absent where it should appear is a gap; present in both with a different value — a ring, an OU, an address — is drift.
- [ ] Prove the comparison works before trusting a clean result: run it against a test copy of the inventory with one PC's row removed — the PC must appear as found in the directory but not in the record — and against another copy with one ring changed, which the ring comparison must report. Test copies are never published.
- [ ] Classify every real difference and close it: correct the record through the change log, bring the component under management or remove it, or record the explanation — a PC switched off for a week has no lease and isn't missing. An unrecorded device is reported to the system owner the day it is found (CM-8(3)), and drift that keeps coming from one procedure is fixed in that procedure.
- [ ] Take SBD-MGMT01's first SCAP baseline with course 1.4's SCC and benchmark versions, run locally in a Tier 1 session from SBD-ADMIN-SRV01, classify its open items as course 1.4 taught, and enter the date in its own inventory row.
- [ ] Hand off: publish the reconciled version with its hash, set the monthly reconciliation in the week after course 1.14's cycle closes so the WSUS list is fresh, and note what later courses add — course 1.18 turns the VLAN 40 servers' planned rows active as it builds them, and course 1.19 carries D:\Inventory into the recovery set.

**Commands:**

```
# On SBD-MGMT01 (session from SBD-ADMIN-SRV01): the newest sources against the active record
$src = (Get-ChildItem D:\Inventory\sources -Directory | Sort-Object Name | Select-Object -Last 1).FullName
$short = { $args[0] -replace '\..*$' }
$active = Import-Csv D:\Inventory\current\inventory.csv | Where-Object Status -eq 'active'
$directory = (Import-Csv "$src\directory.csv").Name
$leases = Import-Csv "$src\dhcp-leases.csv" | Where-Object HostName | ForEach-Object { & $short $_.HostName }
$rings = Import-Csv "$src\wsus-computers.csv" | ForEach-Object { '{0}|{1}' -f (& $short $_.FullDomainName), $_.RequestedTargetGroupName }
Compare-Object ($active | Where-Object Domain -eq 'sbd.test').Name $directory   # <= recorded only, => directory only
Compare-Object ($active | Where-Object VLAN -eq '80').Name $leases
Compare-Object ($active | Where-Object UpdateSource -like 'Ring*' | ForEach-Object { '{0}|{1}' -f $_.Name, $_.UpdateSource }) $rings
# Prove it: with SBD-PC07's row left out of a test copy, SBD-PC07 must show as directory only
Compare-Object ($active | Where-Object { $_.Domain -eq 'sbd.test' -and $_.Name -ne 'SBD-PC07' }).Name $directory
```

**Verify:** Every difference between the record and the sources is listed and classified, the deliberate tests were caught, unrecorded components were reported to the system owner, SBD-MGMT01 has its first baseline, and the reconciled version is published with its hash and the next reconciliation date.

**Evidence:** Keep the comparison output, the classified findings with their resolutions, the tests that proved detection, the SCC results with classified findings, the reconciled version's hash, and the handoff note.

Notes / result / date: __________________________

## Sources

- [NIST · SP 800-53 Rev. 5 security controls (CM-8 System Component Inventory)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [Microsoft · DirectorySearcher class (LDAP searches of Active Directory)](https://learn.microsoft.com/dotnet/api/system.directoryservices.directorysearcher)
- [Microsoft · Last-Logon-Timestamp attribute](https://learn.microsoft.com/windows/win32/adschema/a-lastlogontimestamp)
- [Microsoft · The lastLogonTimestamp attribute may not be accurate](https://learn.microsoft.com/troubleshoot/mem/configmgr/discovery/lastlogontimestamp-not-accurate)
- [Microsoft · Get-DhcpServerv4Lease](https://learn.microsoft.com/powershell/module/dhcpserver/get-dhcpserverv4lease)
- [Microsoft · Get-WsusComputer](https://learn.microsoft.com/en-us/powershell/module/updateservices/get-wsuscomputer)
- [Microsoft · The WSUS Server Cleanup Wizard](https://learn.microsoft.com/windows-server/administration/windows-server-update-services/manage/the-server-cleanup-wizard)
- [Microsoft · Copy-Item (copying to and from a remote session)](https://learn.microsoft.com/powershell/module/microsoft.powershell.management/copy-item)
- [Microsoft · Configure Windows Firewall rules with Group Policy](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/configure)
- [Microsoft · Icacls](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls)
- [Microsoft · Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash)
- [DISA · SCAP content and the SCAP Compliance Checker (SCC)](https://www.cyber.mil/stigs/SCAP/)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)

© 2026 Secure By Design Team LLC
