# Stand up the business services — configuration checklist

Secure By Design · Edition 1.4 · 14 October 2026

The users finally get what the network exists for: files, licensing, and an internal web application with its application tier and database. The model's rule governs the whole course — permit only documented business service paths — so every service arrives with its register rows, its service identity, and its certificate, and nothing reaches it any other way.

## Before you start

- [ ] Complete courses 1.1–1.15: the domain with its DNS, time and hardened OUs, the course 1.6 PKI and its autoenrollment GPO, DHCP and the admin seats, SBD-REPO01 and its Linux client package, the logging pipeline with course 1.11's KDS root key, SBD-SPLUNK01 as the Linux server pattern, the fleet, the update rings, and the SBD-MGMT01 inventory.
- [ ] Provision the VLAN 40 hosts as virtual machines on SBD-HV05: SBD-FS01 (10.0.40.10), SBD-SQL01 (10.0.40.20) and SBD-APPS01 (10.0.40.30) on Windows Server, and SBD-WEB01 (10.0.40.40) on the Red Hat Enterprise Linux–family release course 1.9 chose, with Apache, to be joined to sbd.test with SSSD as SBD-SPLUNK01 was in course 1.12.
- [ ] Have the service-path register, the course 1.6 SBD Server Authentication template, course 1.9's client package and Linux assessment set, and course 1.4's SCC media within reach — every service here gets a documented path, a real certificate and a first baseline.

## Design the service paths and identities

- [ ] Write the service-path rows into the register, with the IDs Inside the Network gives them and an owner each: the fleet to SBD-FS01 on SMB 445 (F05), to SBD-APPS01 on its licensing port, recorded per application (F12), and to SBD-WEB01 on HTTPS 443 (F13); SBD-WEB01 to SBD-APPS01 for the application API on HTTPS 443 (F21); and SBD-APPS01 — and only SBD-APPS01 — to SBD-SQL01 on TCP 1433 with TLS (F22). Add the explicit deny from SBD-WEB01 to SBD-SQL01 (F14): the web tier has no database dependency. All four servers share VLAN 40, so the router never sees their traffic to each other — each server's host firewall enforces those rows. Everything else toward VLAN 40 stays denied, including endpoint-to-SQL directly.
- [ ] Add the rows every new server needs: administration from SBD-ADMIN-SRV01 (A02), and for the three Windows servers the domain rows (F01–F03, F09), Ring 3 updates (F06), event forwarding (F17), certificate publication (F18) and enrollment to SBD-SUBCA01 on the row course 1.6 confirmed. SBD-WEB01's Linux rows already name it: packages from SBD-REPO01 only (F19, HTTP with GPG-signed packages, course 1.9), syslog over TLS to the collector, SBD-SYSLOG01 (F07, TCP 6514), and time from both domain controllers (F09) — the same paths SBD-SPLUNK01 has used since course 1.12.
- [ ] Choose the service identities: group managed service accounts (gMSAs) for the SQL and application services, so passwords rotate themselves. They rely on the forest's one KDS root key, which course 1.11 created: confirm it with Get-KdsRootKey and never create another. Each account is created from AdminJumpBox01 once its host has joined, allowed to that one computer, as course 1.11 did (lesson 3). Note delegated managed service accounts, introduced in the newest Windows Server release, as the migration path for any legacy service account this lab later inherits.
- [ ] Create the access groups under the course 1.5 Groups OU from AdminJumpBox01 — per-share and per-application role groups — because permissions will be granted to roles, never to named humans.
- [ ] Plan the server certificates: one SBD Server Authentication certificate (course 1.6) each for SQL01, APPS01 (for its application API), and WEB01, with the host's DNS name in the subject alternative name. Each host requests its own in its build lesson through the course 1.6 process, so the private key never leaves it — the template allows exportable keys only where course 1.19's recovery plan says so. Course 1.6's autoenrollment GPO, linked at the domain root, already reaches every new member, so no other enrollment policy is created.

**Commands:**

```
# From AdminJumpBox01 (Tier 0): the course 1.11 KDS root key, the existing gMSAs, and the role groups
Invoke-Command SBD-DC01 { Get-KdsRootKey | Select-Object KeyId, EffectiveTime }   # one key, from course 1.11
Get-ADServiceAccount -Filter * | Select-Object Name, Enabled   # course 1.11's three; this course's arrive with their hosts
Get-ADGroup -SearchBase 'OU=Groups,OU=SBD,DC=sbd,DC=test' -Filter * | Select-Object Name
```

**Verify:** The register carries every VLAN 40 service row with its ID and owner — the SQL path restricted to APPS01 alone (F22), the WEB01-to-SQL01 deny (F14), and WEB01's repository, syslog and time rows — the course 1.11 KDS root key is the forest's only one, the role groups exist, and each server certificate is planned for the host that will request it.

**Evidence:** Keep the service-path rows, the identity and group design, the KDS root key check, and the certificate plan.

Notes / result / date: __________________________

## Build SBD-FS01 with least-privilege shares

- [ ] Build SBD-FS01 as a Windows Server virtual machine at 10.0.40.10/24, with the core's VLAN 40 interface as gateway (10.0.40.1 in this sample), both domain controllers for DNS, a separate data volume for the shares, and the hypervisor's time synchronization turned off. Join it straight into the Servers OU, so course 1.5's STIG policies, course 1.8's tier policies, course 1.10's event-forwarding GPO and course 1.14's Ring 3 update policy apply from its first boot, and check that it takes its time from a domain controller. Lessons 3 and 4 build SBD-SQL01 and SBD-APPS01 the same way.
- [ ] Create the planned shares, granting NTFS permissions to the lesson-1 role groups only — share permissions stay simple, the filesystem carries the detail, and no named human appears in an access control list (ACL).
- [ ] Enable access-based enumeration so users see only what their roles permit — the quiet UX of least privilege.
- [ ] Confirm the SMB posture. The newest Windows client release (Pro, Enterprise, and Education) requires SMB signing for both inbound and outbound connections, but the newest Windows Server release requires it only for its own outbound connections — so require signing on SBD-FS01 as well (RequireSecuritySignature in its SMB server configuration), and opt the sensitive share into SMB encryption. Verify both on a live connection from a fleet machine rather than assuming the defaults.
- [ ] Test as members of two different roles from fleet machines: each sees and opens exactly its shares, and the other's are invisible and, opened by path, denied. Turn on Audit Detailed File Share (failure) for SBD-FS01 in a GPO security-filtered to it, recorded as a documented addition as course 1.11 did for SBD-AUDIT01, so each refusal is event 5145 in its Security log; lesson 5 sends that event to the collector.

**Commands:**

```
# In a Tier 1 session on SBD-FS01 from SBD-ADMIN-SRV01
([adsisearcher]"(&(objectCategory=computer)(name=$env:COMPUTERNAME))").FindOne().Path   # ...OU=Servers,OU=SBD,DC=sbd,DC=test
w32tm /query /source   # a domain controller, never the local clock
Get-SmbShare | Select-Object Name, Path, FolderEnumerationMode, EncryptData
Get-SmbServerConfiguration | Select-Object RequireSecuritySignature   # expected True
icacls D:\Shares\Projects | Select-String 'SBD'
auditpol /get /subcategory:"Detailed File Share"   # Failure
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=5145} -MaxEvents 5 | Select-Object TimeCreated, Message
# On the fleet machine, during the test session
Get-SmbConnection | Where-Object ServerName -like 'SBD-FS01*' | Select-Object ShareName, Dialect, Signed, Encrypted
```

**Verify:** SBD-FS01 sits in the Servers OU with time from a domain controller, shares grant to role groups only, FS01 requires signing, a live connection from the fleet shows Signed True — or, on the encrypted share, Encrypted True, where Signed reads False because encryption, which also protects integrity, takes the place of signing — and the two-role test proves both the access and the invisible-denied behavior, with each refusal recorded as event 5145.

**Evidence:** Keep the OU placement and time source, the share and NTFS permission reports, FS01's signing setting and the live connection's signing/encryption output, and the two-role test record with its 5145 events.

Notes / result / date: __________________________

## Build SBD-SQL01 behind its applications

- [ ] Build SBD-SQL01 (10.0.40.20) and the host of its one caller, SBD-APPS01 (10.0.40.30), as SBD-FS01 was built in lesson 2. Then, from AdminJumpBox01, create one gMSA per service, each allowed to one computer as course 1.11 did: SBD-SQL$ for SBD-SQL01$ and SBD-Apps$ for SBD-APPS01$ (sample names). Install the database engine with SBD\SBD-SQL$ as its service account and no password — the install itself demonstrates the managed account working where a password account used to live.
- [ ] Add SBD-SQL01 to the SBD TLS Servers group, then on SBD-SQL01 request its SBD Server Authentication certificate through the course 1.6 process, with SBD-SQL01.sbd.test in the subject alternative name. Give the gMSA read on the certificate's private key — without it the service won't start with the certificate — select the certificate in SQL Server Configuration Manager, set Force Encryption to Yes, and restart the service; the chain validates against pki.sbd.test like every other certificate on this network.
- [ ] Create the application databases with role-based database access for one login only, SBD\SBD-Apps$, the identity SBD-APPS01's services run as in lesson 4 — least privilege continues inside the engine, not just at its port. Record the databases and the logins they depend on: course 1.19 backs them up, so this course sets up no backup job.
- [ ] Prove the audience: allow TCP 1433 in SBD-SQL01's host firewall from 10.0.40.30 alone (F22), and turn on its dropped-packet logging if it is off. A connection from APPS01 succeeds. The same attempt from SBD-FS01 is refused by SBD-SQL01's host firewall — the two share VLAN 40, so the router never sees it, which is exactly how SBD-WEB01 will be refused in lesson 4 — and one from a fleet machine dies at the router with a deny-log entry.

**Commands:**

```
# From AdminJumpBox01 (Tier 0): one gMSA per service, each allowed to one computer
New-ADServiceAccount SBD-SQL -DNSHostName SBD-SQL.sbd.test -PrincipalsAllowedToRetrieveManagedPassword 'SBD-SQL01$'
New-ADServiceAccount SBD-Apps -DNSHostName SBD-Apps.sbd.test -PrincipalsAllowedToRetrieveManagedPassword 'SBD-APPS01$'
# In a Tier 1 session on SBD-SQL01 from SBD-ADMIN-SRV01: identity, encryption, certificate, firewall scope
Get-CimInstance Win32_Service -Filter "Name='MSSQLSERVER'" | Select-Object Name, StartName, State   # StartName SBD\SBD-SQL$
Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\*\MSSQLServer\SuperSocketNetLib' | Select-Object ForceEncryption, Certificate   # 1 and the thumbprint
$cer = Get-ChildItem Cert:\LocalMachine\My | Where-Object Subject -like '*SBD-SQL01*' | Export-Certificate -FilePath "$env:TEMP\sql01.cer"
certutil -verify -urlfetch $cer.FullName   # chain and revocation from pki.sbd.test
Get-NetFirewallPortFilter | Where-Object LocalPort -eq 1433 | Get-NetFirewallRule | Where-Object { $_.Enabled -eq 'True' -and $_.Direction -eq 'Inbound' } | Get-NetFirewallAddressFilter | Select-Object RemoteAddress   # 10.0.40.30 only
# From SBD-APPS01: expected TcpTestSucceeded True. From SBD-FS01 and from a fleet machine: expected False.
Test-NetConnection SBD-SQL01.sbd.test -Port 1433
```

**Verify:** The service runs as the gMSA, Force Encryption is on with the issued certificate bound and its chain validating, the database role admits SBD\SBD-Apps$ alone, TCP 1433 is open to 10.0.40.30 only, APPS01 reaches it, and both other attempts fail with a record: SBD-FS01's at SQL01's host firewall, the fleet's at the router.

**Evidence:** Keep the service identity proof, the encryption setting, certificate binding and urlfetch output, the database role grants, the firewall scope, and APPS01's successful connection paired with both refusals and their log entries.

Notes / result / date: __________________________

## Build SBD-APPS01 and SBD-WEB01

- [ ] On SBD-APPS01, built in lesson 3, and added to the SBD TLS Servers group, request its SBD Server Authentication certificate through the course 1.6 process and run both of its services as SBD\SBD-Apps$, or record an exception where the product can't use a gMSA: the licensing service, verified from the fleet on its registered vendor port (F12), and the application API on HTTPS 443 (F21), with its host firewall admitting the API from SBD-WEB01 (10.0.40.40) alone. APPS01 is the network's one SQL consumer — and the template for any future service: identity, row, evidence.
- [ ] Build SBD-WEB01 at 10.0.40.40/24 from hashed install media of the Red Hat Enterprise Linux–family release course 1.9 chose, with both domain controllers for DNS and the hypervisor's time synchronization turned off. Before anything else, install course 1.3's chrony file (both domain controllers, maxdistance 16) and confirm a controller is selected with a small, steady offset; then apply course 1.9's client package, checked against its hashes, so SBD-REPO01 is its only package source (F19), and update from the current snapshot. Place the course 1.6 root in its system trust store by hand (/etc/pki/ca-trust/source/anchors, then update-ca-trust), its SHA-256 checked against course 1.6's record, as course 1.9 did for SBD-REPO01.
- [ ] Join sbd.test with realm join into the Servers OU, as SBD-SPLUNK01 was joined in course 1.12, permit sign-in only to SBD Tier 1 Admins with realm permit -g, and give that group sudo through a drop-in file. Make the host firewall the register's copy: HTTPS 443 from the fleet (F13) and SSH from 10.0.60.20 alone. Then send its syslog over TLS to SBD-SYSLOG01 (F07) as course 1.10 enrolled SBD-REPO01: rsyslog-gnutls from the snapshot, the collector's certificate name checked, and SBD-WEB01 added to the collector's TCP 6514 sender list.
- [ ] Request SBD-WEB01's SBD Server Authentication certificate through the course 1.6 process, with the key and request made on the host with openssl and SBD-WEB01.sbd.test in both subject and subject alternative name, and the key readable by root alone. Serve the internal application over HTTPS with its chain, and harden Apache against the DISA Apache Server 2.4 UNIX STIGs that course 1.9 staged — the 2,048-bit key floor from course 1.6's templates applies here as everywhere. Export the hardened configuration and hash it as the change record (course 1.19 backs up SBD-APPS01's and SBD-WEB01's configuration and certificates); lesson 5 measures the host.
- [ ] Prove the chain from a fleet machine: the HTTPS page loads with a validating certificate, and its data travels fleet → WEB01 → APPS01 → SQL01, every hop a register row — on SBD-SQL01, sys.dm_exec_connections shows APPS01's session (10.0.40.30) with encrypt_option TRUE. Then prove the shortcuts stay shut: a direct attempt from SBD-WEB01 to SQL01 on 1433 is refused by SQL01's host firewall, and the fleet still cannot touch 1433 at all — three courses of design visible in one browser request.

**Commands:**

```
# On SBD-WEB01 (Tier 1 SSH session from SBD-ADMIN-SRV01): time, packages, domain, firewall, logging, web
chronyc sources -v; chronyc tracking   # ^* one controller, ^+ or ^- the other
dnf repolist --all   # expected: only the sbd-repo01 repositories enabled
realm list   # sbd.test, kerberos-member, permitted group SBD Tier 1 Admins
sudo firewall-cmd --get-active-zones
openssl s_client -connect SBD-SYSLOG01.sbd.test:6514 -verify_hostname SBD-SYSLOG01.sbd.test </dev/null 2>/dev/null | grep 'Verify return code'   # 0 (ok): the SBD root is trusted
logger -t sbd-web-proof 'SBD-WEB01 syslog over TLS test'
sudo apachectl -S   # one HTTPS site on 10.0.40.40:443
curl -sS -o /dev/null -w '%{http_code}\n' https://SBD-APPS01.sbd.test/   # use your application's health path
timeout 5 bash -c '</dev/tcp/SBD-SQL01.sbd.test/1433' && echo open || echo 'refused or timed out'   # expected: refused or timed out
# On SBD-ADMIN-SRV01: the issued certificate's chain and revocation
certutil -verify -urlfetch C:\Evidence\business-services\web01.cer
# From a fleet machine: the page answers, the database does not
Test-NetConnection SBD-WEB01.sbd.test -Port 443
Test-NetConnection SBD-SQL01.sbd.test -Port 1433   # expected: False
# On SBD-SQL01, in a query: APPS01's live session is encrypted
# SELECT client_net_address, encrypt_option, auth_scheme FROM sys.dm_exec_connections WHERE client_net_address = '10.0.40.30'
```

**Verify:** The licensing path and the application API work as registered under the managed identity; SBD-WEB01 takes its time from the controllers and its packages only from SBD-REPO01, trusts the SBD root, is domain-joined with SSSD in the Servers OU, and sends its syslog to the collector over TLS; the Apache host serves HTTPS with a validating internal chain from a hardened, hashed configuration; and the end-to-end request proves fleet → web → application → database, encrypted to the database, with both shortcuts denied.

**Evidence:** Keep APPS01's identity and path proof, WEB01's time, repository, trust, domain-join and syslog checks, its hardened config export with hashes, the certificate validation output, the end-to-end chain test with SQL01's connection record, and the refused WEB01-to-SQL01 attempt.

Notes / result / date: __________________________

## Reconcile, scan, and hand off

- [ ] Enrol the three Windows servers in the record: from AdminJumpBox01, add SBD-FS01, SBD-SQL01 and SBD-APPS01 to SBD Event Sources (course 1.10). On the collector, in a Tier 1 session, widen the WinRM 5985 scope to 10.0.40.10, 10.0.40.20 and 10.0.40.30 (F17) and add a query to SBD-ForwardedSecurity for SBD-FS01's event 5145, filtered to that computer as course 1.11 did for SBD-AUDIT01. Restart the three servers and confirm their events reach ForwardedEvents; SBD-WEB01 already sends its syslog over TLS (lesson 4).
- [ ] Run the full-register reconciliation one more time: every business-service row proven from its real source, every adjacent deny probed and logged, including WEB01 to SQL01 — the VLAN 40 rows join the register's evidence beside the earlier courses' proofs.
- [ ] Take the first baselines. SBD-FS01, SBD-SQL01 and SBD-APPS01 get course 1.4's SCC and Windows Server benchmark versions, run locally in Tier 1 sessions from SBD-ADMIN-SRV01 as course 1.14 did for SBD-WSUS01, plus DISA's SQL Server STIGs for the instance, staged across the air gap as course 1.4 taught and answered in a STIG Viewer checklist. SBD-WEB01 gets SCC for Linux and the distribution benchmark from course 1.9's set in C:\Staging\DISA\linux, scanned the course 1.9 way, with the Apache STIG items in its checklist. Classify every open item as course 1.4 taught — fix by GPO, deviation candidate or POA&M candidate, with fix now (no GPO applies to Linux) for SBD-WEB01. Credentialed vulnerability scanning arrives with course 1.17, coming soon.
- [ ] Update the living records: the four hosts' planned rows in the SBD-MGMT01 inventory turn active through its change log (course 1.15), with their identities, certificates, rings and baselines; the new rows' owners go into the register; and any service-hardening deviations go to the owner of the exception record, C:\Evidence\exception-record.csv on AdminJumpBox01.
- [ ] Write the handoff: every modeled system that isn't marked coming soon is now built, watched, patched, and evidenced. This course sets up no backups: course 1.19 defines and schedules them for the VLAN 40 servers — SBD-FS01's share data with its NTFS permissions, SBD-SQL01's databases and the logins they depend on, and SBD-APPS01's and SBD-WEB01's configuration and certificates — and proves the network can come back from the dead; then path 2 takes the whole record to authorization.

**Commands:**

```
# On SBD-SYSLOG01 (Tier 1 session): the new sources report
wecutil gr SBD-ForwardedSecurity   # SBD-FS01, SBD-SQL01 and SBD-APPS01: Active
Get-WinEvent -FilterHashtable @{LogName='ForwardedEvents'; StartTime=(Get-Date).AddHours(-1)} | Group-Object MachineName | Select-Object Name, Count
Select-String -Path D:\Logs\Syslog\*\*.log -Pattern 'sbd-web-proof' | Select-Object -First 1
# On SBD-ADMIN-SRV01: collect the course's records and hash them
Get-ChildItem C:\Evidence\business-services -Recurse -File | Select-Object FullName, LastWriteTime
Get-ChildItem C:\Evidence\business-services -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\business-services-hashes.csv -NoTypeInformation
```

**Verify:** The three Windows servers forward their events and SBD-WEB01 its syslog, the register covers every VLAN 40 row with paired permit/deny proof, all four hosts carry first baselines with classified findings, and inventory, register, and exception record all reflect the finished services.

**Evidence:** Finish the checklist: the enrolment proof, the reconciliation record, the baselines and checklists with classified findings, the updated living records, and the handoff note to course 1.19.

Notes / result / date: __________________________

## Sources

- [Microsoft · SMB security enhancements](https://learn.microsoft.com/en-us/windows-server/storage/file-server/smb-security)
- [Microsoft · SMB signing](https://learn.microsoft.com/en-us/windows-server/storage/file-server/smb-signing)
- [Microsoft · Get-SmbConnection](https://learn.microsoft.com/en-us/powershell/module/smbshare/get-smbconnection)
- [Microsoft · MSFT_SmbConnection class (Signed and Encrypted)](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/smb/msft-smbconnection)
- [Microsoft · Securing SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/security/securing-sql-server)
- [Microsoft · Group managed service accounts](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview)
- [Microsoft · What's new in Windows Server (newest release)](https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [Microsoft · Delegated Managed Service Accounts overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/delegated-managed-service-accounts/delegated-managed-service-accounts-overview)
- [Microsoft · Create a Key Distribution Service (KDS) root key](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key)
- [Microsoft · Encrypt connections to SQL Server by importing a certificate](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-sql-server-encryption)
- [Microsoft · Advanced audit policy configuration (File System, Detailed File Share)](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/advanced-audit-policy-configuration)
- [Microsoft · Configure Windows Firewall rules with Group Policy](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/configure)
- [Red Hat · Integrating RHEL systems directly with Windows Active Directory](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/integrating_rhel_systems_directly_with_windows_active_directory/index)
- [chrony · chrony.conf(5)](https://chrony-project.org/doc/latest/chrony.conf.html)
- [Red Hat · Using shared system certificates](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/securing_networks/using-shared-system-certificates_securing-networks)
- [firewalld · documentation](https://firewalld.org/documentation/)
- [Apache HTTP Server 2.4 · Security tips](https://httpd.apache.org/docs/2.4/misc/security_tips.html)
- [DISA · Security Content Automation Protocol (SCC and SCAP benchmarks)](https://www.cyber.mil/stigs/SCAP/)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [Microsoft · Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash)

© 2026 Secure By Design Team LLC
