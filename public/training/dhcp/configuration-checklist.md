# Run DHCP on SBD-DHCP01 — configuration checklist

Secure By Design · Edition 1.0 · 14 October 2026

SBD-DHCP01 hands the workstation VLAN its addresses, and with them the gateway, the DNS servers, and the domain name every client will trust. This course designs that service, builds it on a member server, registers client names under one dedicated low-privilege account, keeps its lease trail, writes the restore note that course 1.19's backup of the server relies on, and proves it with a test client. It runs before the tiered administration plane exists: Tier 0 steps happen at SBD-DC01's console, and SBD-DHCP01 is run at its own console by a server-administration group that course 1.8 adopts as Tier 1. The core's DHCP relay is part of the network's build, so this course verifies it and never changes the router. Evidence goes in C:\Evidence\dhcp — on SBD-DHCP01 for the server's own records, and on SBD-DC01 for the Tier 0 steps — and course 1.8 carries each to its tier's seat. Scope values are sample values from the System Hub.

## Before you start

- [ ] Complete courses 1.1–1.6: both domain controllers with DNS (course 1.2) and the domain time hierarchy (course 1.3), course 1.4's DISA media set and baseline method, course 1.5's OU structure with the member-server STIG policies on the Servers OU, and course 1.6's PKI. The network's routing, default-deny segmentation and service-path register are already in place, including the core's DHCP relay for VLAN 80.
- [ ] Provision a Windows Server virtual machine for SBD-DHCP01 (10.0.20.10, VLAN 20) with a second volume for its audit-log copies (D: in this sample), and a disposable Windows client virtual machine on VLAN 80 for testing, named SBD-TEST80 in this sample, with sbd.test as its primary DNS suffix and left out of the domain. Turn off the hypervisor's time synchronization on both, as course 1.3 requires of every virtual machine.
- [ ] Until course 1.8 builds the administration seats, Tier 0 steps (the directory, DNS, and authorizing the server, which takes an Enterprise Admins member) happen at SBD-DC01's console, and SBD-DHCP01 is built and run at its own console with the server-administration accounts lesson 2 creates.

## Design the addressing service

- [ ] Decide where DHCP runs and for whom. Only VLAN 80 gets leases — the 50 PCs, and in this course a temporary test client; every server, every admin seat, and the core keep static addresses, because the register names them by address. SBD-DHCP01 is a member server at 10.0.20.10 on VLAN 20, never a domain controller: a DHCP server on a controller inherits the controller's right to change any record in a secure DNS zone.
- [ ] Design the scope the way Microsoft recommends: the whole subnet, 10.0.80.1–254 with mask 255.255.255.0, then exclusion ranges for what must never be leased — 10.0.80.1–99, which holds the core's gateway at .1, and 10.0.80.200–254 — leaving the pool at 10.0.80.100–199, as the System Hub records it. One hundred addresses cover the fifty PCs, test clients, and replacement machines whose old leases haven't expired. Plan no reservations: a reservation is keyed to a MAC address that any device can claim, so it is an addressing convenience, never an identity check; if a device ever needs one, record it with an owner and a reason.
- [ ] Set the lease length as the outage budget: with one DHCP server, a lease is how long clients keep working while SBD-DHCP01 is down. Keep the Windows default of 8 days as the sample value — clients try to renew halfway through (day 4) and rebind at seven-eighths (day 7) — and record your own value with that reason. Then choose the options, because every option is something every client trusts: router (option 3) 10.0.80.1, DNS servers (option 6) 10.0.10.10 and 10.0.10.11, both domain controllers and never an outside resolver, and DNS domain name (option 15) sbd.test. Add nothing else: no WINS, no boot server, no proxy auto-discovery.
- [ ] Assign three identities. Authorizing a DHCP server writes to the forest's configuration partition, so an Enterprise Admins member does it — Tier 0 work, done at SBD-DC01's console until course 1.8 builds AdminJumpBox01. The server is built and run by named server-administration accounts in a new group, SBD Tier 1 Admins in this sample, because course 1.8 makes member-server administration Tier 1; and client names are registered by a third, unprivileged account in lesson 3.
- [ ] Confirm the paths. Rule F04 in the System Hub lets VLAN 80 reach SBD-DHCP01 on UDP 67/68 through the core's DHCP relay, owned by the network owner; the relay is part of the network's build, so verify it from the network's record with the network owner — it must forward to 10.0.20.10 and nowhere else, which lesson 2's first lease then proves — and take any gap to the network owner rather than changing the router. As a domain member, SBD-DHCP01 also uses F01 (DNS), F02 (Kerberos), F03 (directory), and F09 (time); its registrations ride F01, and A02 already lists it for course 1.8's Tier 1 seat.

**Commands:**

```
# At SBD-DC01's console (Tier 0): the values and identities the design names
Resolve-DnsName SBD-DC01.sbd.test -Server 10.0.10.11; Resolve-DnsName SBD-DC02.sbd.test -Server 10.0.10.10
Get-ADOrganizationalUnit -Identity 'OU=Servers,OU=SBD,DC=sbd,DC=test' | Select-Object Name, DistinguishedName
Get-ADGroupMember 'Enterprise Admins' | Select-Object Name   # who can authorize a DHCP server
Get-ADGroupMember DnsUpdateProxy   # expected: no members
Get-DnsServerZone -ComputerName SBD-DC01 | Select-Object ZoneName, IsDsIntegrated, DynamicUpdate, ReplicationScope
```

**Verify:** The design records VLAN 80 as the only leased segment, the full-subnet scope with its two exclusion ranges and no reservations, the lease length with its reason, the three options, who holds each of the three identities, and the network's confirmation that the core relays VLAN 80 to 10.0.20.10 under F04.

**Evidence:** Keep the DHCP design (scope, exclusions, lease length, options, identities), the relay confirmation with where it came from, and the register rows that name SBD-DHCP01.

Notes / result / date: __________________________

## Build SBD-DHCP01 and its scope

- [ ] At SBD-DC01's console, create SBD Tier 1 Admins and a named server-administration account for each person who will run SBD-DHCP01, all in the Admin OU, and let the group create computer objects in the Servers OU. The delegation covers that OU and computer objects only, so the group can add servers but gains no rights over the ones already there, including SBD-SUBCA01 and SBD-PKI-MGMT01, which course 1.8 moves to their own OU.
- [ ] Install Windows Server on SBD-DHCP01 with its static address (10.0.20.10/24, the core's 10.0.20.1 as gateway, both domain controllers as DNS servers) and its hypervisor time synchronization off, then, at its console, join it straight into the Servers OU with Add-Computer -OUPath and a server-administration account, so course 1.5's member-server policies apply from first boot. After the restart, still as the local Administrator (the STIG policy may have renamed it), make SBD Tier 1 Admins the only domain group in its local Administrators group, in place of Domain Admins, per the current member-server STIG; from then on, work as your server-administration account.
- [ ] Install the DHCP role with its tools, create the DHCP Administrators and DHCP Users groups, and restart the service. An Enterprise Admins member then authorizes the server at SBD-DC01's console, after adding the DHCP management tools there (course 1.8 moves this work to AdminJumpBox01). Restart the DHCP Server service on SBD-DHCP01 so it checks its authorization now, and find event 1044: authorized, and servicing clients.
- [ ] Create the scope inactive, exactly as designed: 10.0.80.1–254, mask 255.255.255.0, the two exclusion ranges, an 8-day lease, and the router, DNS server, and domain name options. Turn dynamic DNS updates off for now (DynamicUpdates Never): a record registered under the server's own computer account stays owned by that account, so lesson 3's dedicated account could never update it. Then activate the scope.
- [ ] Verify the core's relay with the test client: on SBD-TEST80 in VLAN 80, release and renew, and confirm the lease came from 10.0.20.10 with the planned gateway, DNS servers, and suffix. The relay wrote its own VLAN 80 address, 10.0.80.1, into each request's gateway address field; that is how SBD-DHCP01 picked the 10.0.80.0 scope. On SBD-DHCP01, find the lease in the scope — and no DNS record yet, by design.

**Commands:**

```
# At SBD-DC01's console (Tier 0): the group and its one delegation; then create each person's named
# server-administration account in the Admin OU and add it to the group (New-ADUser, Add-ADGroupMember)
New-ADGroup 'SBD Tier 1 Admins' -GroupScope Global -Path 'OU=Admin,OU=SBD,DC=sbd,DC=test'
dsacls 'OU=Servers,OU=SBD,DC=sbd,DC=test' /G 'SBD\SBD Tier 1 Admins:CC;computer'
# On SBD-DHCP01 as its local Administrator: join with a server-administration account, then, after the restart:
Add-Computer -DomainName sbd.test -OUPath 'OU=Servers,OU=SBD,DC=sbd,DC=test' -Credential (Get-Credential) -Restart
Add-LocalGroupMember Administrators -Member 'SBD\SBD Tier 1 Admins'; Remove-LocalGroupMember Administrators -Member 'SBD\Domain Admins'
# As a server-administration account: the role and its local groups
Install-WindowsFeature DHCP -IncludeManagementTools; Add-DhcpServerSecurityGroup; Restart-Service DHCPServer
# At SBD-DC01's console, as an Enterprise Admins member: authorize
Install-WindowsFeature RSAT-DHCP; Add-DhcpServerInDC -DnsName SBD-DHCP01.sbd.test -IPAddress 10.0.20.10
# Back on SBD-DHCP01: the authorization check, then the scope, inactive until it is complete
Restart-Service DHCPServer; Get-DhcpServerInDC
Get-WinEvent -FilterHashtable @{ProviderName='Microsoft-Windows-DHCP-Server'; Id=1044} -MaxEvents 1
Add-DhcpServerv4Scope -Name 'VLAN 80 workstations' -StartRange 10.0.80.1 -EndRange 10.0.80.254 -SubnetMask 255.255.255.0 -LeaseDuration 8.00:00:00 -State InActive
Add-DhcpServerv4ExclusionRange -ScopeId 10.0.80.0 -StartRange 10.0.80.1 -EndRange 10.0.80.99
Add-DhcpServerv4ExclusionRange -ScopeId 10.0.80.0 -StartRange 10.0.80.200 -EndRange 10.0.80.254
Set-DhcpServerv4OptionValue -ScopeId 10.0.80.0 -Router 10.0.80.1 -DnsServer 10.0.10.10, 10.0.10.11 -DnsDomain sbd.test
Set-DhcpServerv4DnsSetting -DynamicUpdates Never   # lesson 3 turns registration on
Set-DhcpServerv4Scope -ScopeId 10.0.80.0 -State Active
Get-DhcpServerv4Lease -ScopeId 10.0.80.0   # after SBD-TEST80 runs ipconfig /release and ipconfig /renew
w32tm /query /source   # a domain controller, as course 1.3 designed
```

**Verify:** Get-DhcpServerInDC lists SBD-DHCP01 at 10.0.20.10 and event 1044 shows it servicing clients; the scope covers 10.0.80.1–254 with exclusions .1–.99 and .200–.254, an 8-day lease, and the three options; DNS updates are off; SBD Tier 1 Admins is the only domain group in its local Administrators; its time comes from a domain controller; and the test client's first lease came from 10.0.20.10 through the relay.

**Evidence:** Record the build sheet (OU placement, local Administrators, time source), the authorization output and event 1044, the scope, exclusion, and option configuration, and the test client's ipconfig /all with the matching lease.

Notes / result / date: __________________________

## Register client names securely

- [ ] At SBD-DC01's console, create the reverse lookup zone for 10.0.80.0/24 — Active Directory-integrated, with the replication scope you chose in course 1.2, and secure updates only — so client PTR records have somewhere to go; course 1.2 created only 10.0.10's.
- [ ] Create the update account there too: a standard user (svc-dhcp-dns in this sample) in the Admin OU and in Domain Users only, with a long random password — at least the length the current STIG sets for manually managed application accounts — set not to expire, which the current STIG allows for an application account whose owner changes the password on the schedule the STIG sets and whenever someone who knew it leaves. It needs no DNS permission of its own: any authenticated account may create a record in a secure zone and becomes the owner of what it creates. Keep DnsUpdateProxy empty: records its members create are left unsecured, so the next device to update the name takes it over.
- [ ] On SBD-DHCP01, store the credential with Set-DhcpServerDnsCredential, then set the server to register both A and PTR records for every client (DynamicUpdates Always), including clients that don't ask (UpdateDnsRRForOlderClients), to remove them when a lease expires or is deleted (DeleteDnsRROnLeaseExpiry), and to protect names (NameProtection). Name protection adds a DHCID record that ties each name to the client that registered it, and an update for that name from a different client fails instead of overwriting it.
- [ ] On SBD-TEST80, renew the lease and watch registration happen: SBD-DHCP01's audit log shows the update requested (30) and done (32), both controllers answer for the name and the address, and a DHCID record sits beside the A record. At SBD-DC01's console, read the record's owner: it must be SBD\svc-dhcp-dns, not SBD-DHCP01's computer account.
- [ ] Record the decision: one update identity for VLAN 80, its owner, where the sealed password lives, and that after any password change you set the credential again on SBD-DHCP01, because registrations fail until you do. With every VLAN 80 record owned by that one account, the server cleans up names when leases end, so VLAN 80 doesn't depend on scavenging, which course 1.2 left as a separate decision. Course 1.13 finishes the picture for the fleet: it turns off the workstations' own DNS self-registration by GPO on the Workstations OU, with the reason recorded, so SBD-DHCP01, as svc-dhcp-dns, stays the only writer of their records.

**Commands:**

```
# At SBD-DC01's console (Tier 0): the reverse zone (course 1.2's replication scope), the update account, an empty proxy group
Add-DnsServerPrimaryZone -NetworkId '10.0.80.0/24' -ReplicationScope Domain -DynamicUpdate Secure
New-ADUser svc-dhcp-dns -Path 'OU=Admin,OU=SBD,DC=sbd,DC=test' -AccountPassword (Read-Host -AsSecureString) -PasswordNeverExpires $true -Enabled $true
Get-ADGroupMember DnsUpdateProxy   # expected: no members
# On SBD-DHCP01: the credential, then registration for every client, with name protection
Set-DhcpServerDnsCredential -Credential (Get-Credential 'SBD\svc-dhcp-dns')
Set-DhcpServerv4DnsSetting -DynamicUpdates Always -UpdateDnsRRForOlderClients $true -DeleteDnsRROnLeaseExpiry $true -NameProtection $true
Get-DhcpServerDnsCredential; Get-DhcpServerv4DnsSetting
# On SBD-TEST80: renew, then ask both controllers for the name, the address, and the DHCID record
ipconfig /renew
Resolve-DnsName SBD-TEST80.sbd.test -Server 10.0.10.11
Resolve-DnsName (Resolve-DnsName SBD-TEST80.sbd.test -Type A -Server 10.0.10.10).IPAddress -Type PTR -Server 10.0.10.10
Resolve-DnsName SBD-TEST80.sbd.test -Type DHCID -Server 10.0.10.10
# At SBD-DC01's console: the record's owner (sbd.test lives in DomainDnsZones in this sample)
Import-Module ActiveDirectory
(Get-Acl 'AD:DC=SBD-TEST80,DC=sbd.test,CN=MicrosoftDNS,DC=DomainDnsZones,DC=sbd,DC=test').Owner   # SBD\svc-dhcp-dns
```

**Verify:** The 10.0.80 reverse zone exists with secure updates; svc-dhcp-dns is in Domain Users only and DnsUpdateProxy is empty; Get-DhcpServerDnsCredential names svc-dhcp-dns; the server registers A and PTR records for every client with name protection and cleanup on; and the test client's A, PTR, and DHCID records answer from both controllers, owned by SBD\svc-dhcp-dns.

**Evidence:** Keep the zone and account settings, the empty DnsUpdateProxy result, the server's DNS settings and the credential's account name (never the password), the audit-log lines for the update, both controllers' answers, and the record's owner.

Notes / result / date: __________________________

## Audit leases and write the restore note

- [ ] Read the audit log. Windows writes one file per weekday (DhcpSrvLog-Mon.log, and so on) in %windir%\System32\dhcp, each line carrying an event code, the time, the address, the host name, and the MAC address: 10 for a new lease, 11 a renewal, 12 a release, 30 and 32 a DNS update requested and done, 31 a failed one. Each file is reused a week later, and logging pauses when free disk space drops below the configured minimum, so check Get-DhcpServerAuditLog and keep that volume's free space well above it.
- [ ] Keep every day: a daily task, running as SYSTEM shortly after midnight, copies the previous day's file to D:\DHCP\AuditArchive under its date and appends its SHA-256 hash to a catalog. Keep the copies as long as your records requirement says — the period depends on your environment and policy, so record the value you chose and why — because lease history is what ties an address in any log to a machine.
- [ ] Review the leases each week: scope statistics show how full the pool is, and the lease list should hold only machines you know — today, just the test client. An unknown host name or MAC address is a finding to trace, not something to delete. The server's own event logs record every scope, option, exclusion, and reservation change with the account that made it, and warn when the scope is nearly full.
- [ ] Know what an unauthorized DHCP server can do here. A Windows DHCP server in the domain that isn't authorized refuses to lease and logs event 1046, and a workgroup Windows server stops when it meets an authorized one on its network; a server of any other kind ignores authorization entirely and can hand clients its own gateway and DNS servers, a ready-made interception point. So check that Get-DhcpServerInDC lists SBD-DHCP01 alone and that clients' DHCP server is 10.0.20.10, and record that network controls, such as 802.1X admission in course 1.13, carry the rest.
- [ ] Write the restore note. Windows backs the DHCP database up every 60 minutes, but to %windir%\System32\dhcp\backup on the same disk, so that copy fails with the server and isn't a backup of it. Course 1.19 defines and schedules SBD-DHCP01's backup — the database and an export of the configuration and leases — with every other system's, so this course sets up no backup job. What belongs here is what a restore will need: the DNS update credential isn't in a DHCP backup, so after any restore it is set again with Set-DhcpServerDnsCredential from the sealed record, before names register.

**Commands:**

```
Get-DhcpServerAuditLog   # Enable: True; Path: C:\Windows\system32\dhcp
$dir = Join-Path $env:windir 'System32\dhcp'
Get-Content (Join-Path $dir ('DhcpSrvLog-{0}.log' -f (Get-Date).ToString('ddd', [cultureinfo]'en-US'))) -Tail 5
# The daily task's work (SYSTEM, 00:15): yesterday's file kept under its date, with its hash
New-Item -ItemType Directory D:\DHCP\AuditArchive -Force | Out-Null
$y = (Get-Date).AddDays(-1); $copy = 'D:\DHCP\AuditArchive\DhcpSrvLog-{0:yyyy-MM-dd}.log' -f $y
Copy-Item (Join-Path $dir ('DhcpSrvLog-{0}.log' -f $y.ToString('ddd', [cultureinfo]'en-US'))) $copy
Get-FileHash $copy -Algorithm SHA256 | Export-Csv D:\DHCP\AuditArchive\catalog.csv -Append -NoTypeInformation
# Weekly review: pool use, who holds leases, who may serve
Get-DhcpServerv4ScopeStatistics -ScopeId 10.0.80.0 | Select-Object ScopeId, InUse, Free, PercentageInUse
Get-DhcpServerv4Lease -ScopeId 10.0.80.0 | Select-Object IPAddress, HostName, ClientId, AddressState, LeaseExpiryTime
Get-DhcpServerInDC   # SBD-DHCP01 alone
# For the restore note: the automatic copy sits on the same disk (BackupPath), so course 1.19 schedules the real backup
Get-DhcpServerDatabase
Get-DhcpServerDnsCredential   # the account the note says to set again after any restore (never the password)
```

**Verify:** Audit logging is on with free space to spare; yesterday's file sits in the archive under its date, with its hash in the catalog; the lease list holds only known machines; Get-DhcpServerInDC lists SBD-DHCP01 alone; and the restore note names the credential step for course 1.19's backup.

**Evidence:** Keep the audit log settings, the archive catalog, the dated lease review, the authorized-server list, and the restore note for course 1.19.

Notes / result / date: __________________________

## Prove the service and hand off

- [ ] On SBD-TEST80, release and renew, and check everything the client now believes: an address from 10.0.80.100–199, DHCP server 10.0.20.10, gateway 10.0.80.1, DNS servers 10.0.10.10 and 10.0.10.11, suffix sbd.test, and an 8-day lease. On SBD-DHCP01, find the same lease and its audit-log lines, and confirm both controllers answer for the name and the address.
- [ ] Try to take the name: shut the test client down, give it a new MAC address in the hypervisor — to the server, a new client with a new DHCID — and start it again. It gets a lease, but its registration is refused: event 1340 on SBD-DHCP01, a failed update (31) in the audit log, and the name still resolving to the original address. Restore the original MAC address, renew, delete the stray lease, and confirm the name still points at the test client.
- [ ] Take SBD-DHCP01's first SCAP baseline the course 1.4 way: copy SCC and the Windows Server STIG benchmark from the course 1.4 media set into C:\Staging\DISA, check them against the connected-side-hashes.csv that travels with the media, install the same SCC version, and scan locally with the same profile. Store the session unmodified in C:\Evidence\dhcp\baseline, classify each open finding as fix-by-GPO, deviation candidate, or POA&M candidate, and leave the manual checks for a STIG Viewer checklist on the Tier 1 seat in course 1.8.
- [ ] Seal both halves of the record, each into its own manifest: C:\Evidence\dhcp on SBD-DHCP01 (design, build sheet, scope export, registration and takeover results, audit catalog, restore note, baseline) and C:\Evidence\dhcp on SBD-DC01 (authorization, reverse zone, update account, record owner). Course 1.8 carries each to its tier's seat.
- [ ] Write the handoff to course 1.8: SBD-DHCP01 serves VLAN 80 and registers names as svc-dhcp-dns; SBD Tier 1 Admins runs it, still at its console; the test client stays for course 1.8's proof, where it joins the domain as the Tier 2 test machine; course 1.13 adds the Network Policy Server role for 802.1X to this server; and course 1.19 schedules its backup.

**Commands:**

```
# On SBD-TEST80: release, renew, and read what the client believes
ipconfig /release; ipconfig /renew; ipconfig /all
# On SBD-DHCP01: the lease, then, after the MAC change, the refused takeover
Get-DhcpServerv4Lease -ScopeId 10.0.80.0 | Select-Object IPAddress, HostName, ClientId, LeaseExpiryTime
Get-WinEvent -FilterHashtable @{ProviderName='Microsoft-Windows-DHCP-Server'; Id=1340} -MaxEvents 1 | Format-List TimeCreated, Message
Resolve-DnsName SBD-TEST80.sbd.test -Server 10.0.10.10   # still the original address
Remove-DhcpServerv4Lease -IPAddress '<stray lease address>'   # after the original MAC is back
# Before installing SCC: no output means every copied file is on the connected-side list
(Get-ChildItem C:\Staging\DISA\* -File -Exclude *.csv | Get-FileHash -Algorithm SHA256).Hash | Where-Object { $_ -notin (Import-Csv C:\Staging\DISA\connected-side-hashes.csv).Hash }
# After the SCC scan: keep the session unmodified (adapt the path to SCC's results directory), then seal the folder
$session = Get-ChildItem (Join-Path $env:USERPROFILE 'SCC\Sessions') -Directory | Sort-Object Name | Select-Object -Last 1
New-Item -ItemType Directory C:\Evidence\dhcp\baseline -Force | Out-Null
Copy-Item $session.FullName -Destination C:\Evidence\dhcp\baseline\SBD-DHCP01 -Recurse
Get-ChildItem C:\Evidence\dhcp -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\dhcp-manifest.csv -NoTypeInformation
Get-FileHash -Algorithm SHA256 C:\Evidence\dhcp-manifest.csv
# Run the same two lines at SBD-DC01's console for the Tier 0 half, its own C:\Evidence\dhcp
```

**Verify:** The test client holds a lease from the pool with every planned option; its A, PTR, and DHCID records answer from both controllers and belong to SBD\svc-dhcp-dns; the takeover attempt was refused with event 1340 and left the record unchanged; SBD-DHCP01 has a first baseline with every open item classified; and both manifests and the handoff are filed.

**Evidence:** Keep the client's ipconfig /all, the lease and audit-log lines, the takeover attempt with event 1340, the SCC session with its hashes and classified findings, both manifests with their own hashes, and the handoff note.

Notes / result / date: __________________________

## Sources

- [Microsoft · Dynamic Host Configuration Protocol (DHCP)](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-top)
- [Microsoft · DHCP scopes](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-scopes)
- [Microsoft · Deploy DHCP using Windows PowerShell](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-deploy-wps)
- [Microsoft · Troubleshooting guide: DHCP authorization failures](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshooting-guide-dhcp-authorization-failures)
- [Microsoft · Active Directory domain join permissions](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/active-directory-domain-join-permissions)
- [Microsoft · DHCP troubleshooting guidance](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dhcp-guidance)
- [Microsoft · DNS dynamic update](https://learn.microsoft.com/en-us/windows-server/networking/dns/dynamic-update)
- [Microsoft · Set-DhcpServerv4DnsSetting](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/set-dhcpserverv4dnssetting)
- [Microsoft · Set-DhcpServerDnsCredential](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/set-dhcpserverdnscredential)
- [Microsoft · Add-DnsServerPrimaryZone](https://learn.microsoft.com/en-us/powershell/module/dnsserver/add-dnsserverprimaryzone)
- [Microsoft · DHCP server events](https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-server-events)
- [Microsoft · Set-DhcpServerAuditLog](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/set-dhcpserverauditlog)
- [Microsoft · Backup-DhcpServer](https://learn.microsoft.com/en-us/powershell/module/dhcpserver/backup-dhcpserver)
- [DISA · Security Content Automation Protocol (SCC and SCAP benchmarks)](https://www.cyber.mil/stigs/SCAP/)
- [Microsoft · Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
