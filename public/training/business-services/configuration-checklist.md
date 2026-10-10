# Stand up the business services — configuration checklist

Secure By Design · Edition 1.3 · 9 October 2026

The users finally get what the network exists for: files, licensing, and an internal web application with its application tier and database. The model's rule governs the whole course — permit only documented business service paths — so every service arrives with its register rows, its service identity, and its certificate, and nothing reaches it any other way.

## Before you start

- [ ] Complete courses 1.4–1.8: working PKI services and the watched, managed network with the ring/source rules in force, on the routed, segmented VLANs.
- [ ] Provision the VLAN 40 hosts: SBD-FS01 (10.0.40.10), SBD-SQL01 (10.0.40.20), SBD-APPS01 (10.0.40.30), and SBD-WEB01 (10.0.40.40, Linux with Apache, joined to the sbd.test domain with SSSD like SBD-SPLUNK01 and SBD-NESSUS01).
- [ ] Have the network's service-path register and the course 1.4 SBD Server Authentication template ready — every service here gets a documented path and a real certificate.

## Design the service paths and identities

- [ ] Write the service-path rows: fleet to FS01 (SMB 445); fleet to APPS01 on its licensing port, recorded per application; fleet to WEB01 (HTTPS 443); WEB01 to APPS01 for the application API (HTTPS 443); and APPS01 — and only APPS01 — to SQL01 (TCP 1433 with TLS). Add an explicit deny from WEB01 to SQL01: the web tier has no database dependency. All four servers share VLAN 40, so the router never sees their traffic to each other — each server's host firewall enforces those rows. Everything else toward VLAN 40 stays denied, including endpoint-to-SQL directly.
- [ ] Register WEB01's Linux maintenance rows as well: packages from SBD-REPO01 only (HTTP with GPG-signed packages) and syslog over TLS to the collector, SBD-SYSLOG01 (TCP 6514) — the same paths the other domain-joined Linux servers, SBD-SPLUNK01 and SBD-NESSUS01, use. Course 1.8's repository row named only those two because WEB01 did not exist yet.
- [ ] Choose the service identities: group managed service accounts (gMSAs) for the SQL and application services, so passwords rotate themselves — and note delegated managed service accounts, introduced in the newest Windows Server release, as the migration path for any legacy service account this lab later inherits.
- [ ] Create the access groups under the course 1.3 Groups OU — per-share and per-application role groups — because permissions will be granted to roles, never to named humans.
- [ ] Request the server certificates through the course 1.4 process: one SBD Server Authentication certificate each for SQL01, APPS01 (for its application API), and WEB01, enrolled from the template, with the publication site serving their revocation story.

**Commands:**

```
Get-ADServiceAccount -Filter * | Select-Object Name, Enabled
Get-ADGroup -SearchBase 'OU=Groups,OU=SBD,DC=sbd,DC=test' -Filter * | Select-Object Name
Test-NetConnection 10.0.40.20 -Port 1433   # expected before build: TcpTestSucceeded False
```

**Verify:** The register carries every service row — the SQL path restricted to APPS01 alone, the WEB01-to-SQL01 deny, and WEB01's repository and syslog rows — the gMSAs and role groups exist, and the three server certificates are issued and recorded.

**Evidence:** Keep the service-path rows, the identity and group design, and the certificate enrollment records.

Notes / result / date: __________________________

## Build SBD-FS01 with least-privilege shares

- [ ] Build SBD-FS01 in the Servers OU and create the planned shares, granting NTFS permissions to the lesson-1 role groups only — share permissions stay simple, the filesystem carries the detail, and no named human appears in an access control list (ACL).
- [ ] Enable access-based enumeration so users see only what their roles permit — the quiet UX of least privilege.
- [ ] Confirm the SMB posture. The newest Windows client release (Pro, Enterprise, and Education) requires SMB signing for both inbound and outbound connections, but the newest Windows Server release requires it only for its own outbound connections — so require signing on SBD-FS01 as well (RequireSecuritySignature in its SMB server configuration), and opt the sensitive share into SMB encryption. Verify both on a live connection from a fleet machine rather than assuming the defaults.
- [ ] Test as members of two different roles from fleet machines: each sees and opens exactly its shares, the other's are invisible and denied, and the denial lands in the pipeline like every other refusal on this network.

**Commands:**

```
Get-SmbShare | Select-Object Name, Path, FolderEnumerationMode, EncryptData   # on FS01
Get-SmbServerConfiguration | Select-Object RequireSecuritySignature   # on FS01: expected True
Get-SmbConnection -ServerName SBD-FS01 | Select-Object ShareName, Dialect, Signed, Encrypted   # on the fleet machine, during the test session
icacls D:\Shares\Projects | Select-String 'SBD'
```

**Verify:** Shares grant to role groups only, FS01 requires signing, a live connection from the fleet shows Signed True — or, on the encrypted share, Encrypted True, where Signed reads False even though an encrypted connection is also signed — and the two-role test proves both the access and the invisible-denied behavior.

**Evidence:** Keep the share and NTFS permission reports, FS01's signing setting and the live connection's signing/encryption output, and the two-role test record with its pipeline entry.

Notes / result / date: __________________________

## Build SBD-SQL01 behind its applications

- [ ] Install the database engine on SBD-SQL01 with the lesson-1 gMSA as its service identity — the install itself demonstrates the managed account working where a password account used to live.
- [ ] Bind the issued certificate to the instance and require encrypted connections; the chain validates against pki.sbd.test like every other certificate on this network.
- [ ] Create the application databases with role-based database access for the APPS01 application identity only — least privilege continues inside the engine, not just at its port.
- [ ] Prove the audience: a connection from APPS01 succeeds encrypted. The same attempt from SBD-WEB01 is refused by SBD-SQL01's host firewall — the two share VLAN 40, so the router never sees it — and one from a fleet machine dies at the router with a deny-log entry. Turn on the host firewall's dropped-packet logging if it is off, so both refusals leave a record.

**Commands:**

```
Get-Service MSSQLSERVER -ComputerName SBD-SQL01 | Select-Object Status
# From SBD-APPS01, the registered caller: expected TcpTestSucceeded True.
Test-NetConnection SBD-SQL01.sbd.test -Port 1433
# From a fleet machine: expected TcpTestSucceeded False.
Test-NetConnection SBD-SQL01.sbd.test -Port 1433
# From SBD-WEB01 (Linux): expected to be refused or time out.
nc -zv SBD-SQL01.sbd.test 1433
certutil -verify -urlfetch C:\Evidence\services\sql01.cer
```

**Verify:** The service runs as the gMSA, connections are certificate-encrypted with a validating chain, APPS01's access works by database role, and both direct attempts fail with a record: SBD-WEB01's at SQL01's host firewall, the fleet's at the router.

**Evidence:** Keep the service identity proof, the certificate binding and urlfetch output, the database role grants, and APPS01's successful connection paired with both refusals and their log entries.

Notes / result / date: __________________________

## Build SBD-APPS01 and SBD-WEB01

- [ ] Build SBD-APPS01 in the Servers OU and run both of its services under managed identities: the licensing service, verified from the fleet on its registered vendor port, and the application API on HTTPS 443 with its SBD Server Authentication certificate, answering SBD-WEB01 only. APPS01 is the network's one SQL consumer — and the template for any future service: identity, row, evidence.
- [ ] Build SBD-WEB01 on Linux and join it to the sbd.test domain with SSSD, as SBD-SPLUNK01 and SBD-NESSUS01 are joined. Point its packages at SBD-REPO01 only, its syslog over TLS at the collector, and its time service at both domain controllers, and harden the web tier against DISA's Apache guidance — the server's assessable record follows the Linux pattern: hardened configuration exported and hashed, checklist items answered in STIG Viewer.
- [ ] Install the SBD Server Authentication certificate with its chain and serve the internal application over HTTPS — the 2,048-bit key floor from course 1.4's templates applies here as everywhere.
- [ ] Prove the chain from a fleet machine: the HTTPS page loads with a validating certificate, and its data travels fleet → WEB01 → APPS01 → SQL01, every hop a register row. Then prove the shortcuts stay shut: a direct attempt from SBD-WEB01 to SQL01 on 1433 is refused by SQL01's host firewall, and the fleet still cannot touch 1433 at all — three courses of design visible in one browser request.

**Commands:**

```
Test-NetConnection SBD-WEB01.sbd.test -Port 443   # from a fleet machine
certutil -verify -urlfetch C:\Evidence\services\web01.cer
Test-NetConnection SBD-SQL01.sbd.test -Port 1433   # from the fleet: expected False
# On SBD-WEB01 (Linux): domain membership, the API answers, the database does not.
realm list
curl -sS -o /dev/null -w '%{http_code}\n' https://SBD-APPS01.sbd.test/   # use your application's health path
nc -zv SBD-SQL01.sbd.test 1433   # expected: refused or timed out
```

**Verify:** The licensing path works as registered, SBD-WEB01 is domain-joined with SSSD and patches only from SBD-REPO01, the Apache host serves HTTPS with a validating internal chain from a hardened, hashed configuration, and the end-to-end request proves fleet → web → application → database with both shortcuts denied.

**Evidence:** Keep APPS01's identity and path proof, WEB01's domain-join and repository settings, its hardened config export with hashes and checklist, the certificate validation output, the end-to-end chain test, and the refused WEB01-to-SQL01 attempt.

Notes / result / date: __________________________

## Reconcile, scan, and hand off

- [ ] Run the full-register reconciliation one more time: every business-service row proven from its real source, every adjacent deny probed and logged, including WEB01 to SQL01 — the VLAN 40 section of the matrix joins the evidence beside course 1.5's.
- [ ] Run the cadence: SCAP baselines for FS01, SQL01, and APPS01; the config-export record for WEB01; a credentialed scan of VLAN 40 from SBD-NESSUS01 with its findings triaged into the three classifications.
- [ ] Update the living records: the four hosts, their identities, certificates, and rings into the SBD-MGMT01 inventory; the new rows' owners into the register; any service-hardening deviations into the exception record.
- [ ] Write the handoff: every modeled system except the recovery design is now built, watched, patched, and evidenced — course 1.10 proves the network can come back from the dead, and then path 2 takes the whole record to authorization.

**Commands:**

```
Get-ChildItem C:\Evidence\business-services -Recurse | Select-Object Name, LastWriteTime
Get-FileHash -Algorithm SHA256 C:\Evidence\business-services\*
```

**Verify:** The matrix covers every VLAN 40 row with paired permit/deny proof, the four hosts carry baselines or config records with triaged scan findings, and inventory, register, and exception record all reflect the finished services.

**Evidence:** Finish the checklist: the reconciliation matrix, the scan and triage set, the updated living records, and the handoff note to course 1.10.

Notes / result / date: __________________________

## Sources

- [Microsoft · SMB security enhancements](https://learn.microsoft.com/en-us/windows-server/storage/file-server/smb-security)
- [Microsoft · SMB signing](https://learn.microsoft.com/en-us/windows-server/storage/file-server/smb-signing)
- [Microsoft · Get-SmbConnection](https://learn.microsoft.com/en-us/powershell/module/smbshare/get-smbconnection)
- [Microsoft · MSFT_SmbConnection class (Signed and Encrypted)](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/smb/msft-smbconnection)
- [Microsoft · Securing SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/security/securing-sql-server)
- [Microsoft · Group managed service accounts](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview)
- [Microsoft · What's new in Windows Server 2025](https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025)
- [DISA · STIGs and GPO package (incl. Apache guidance)](https://www.cyber.mil/stigs/gpo)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
