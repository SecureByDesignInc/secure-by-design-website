# Secure By Design — network implementation plan

Security procedures, control mappings, acceptance checks, and operating schedules.

Control catalog: NIST SP 800-53 Rev. 5.

## Architecture

Eight VLANs; 50 clients in the 10.0.80.100–199 pool admitted by 802.1X (NPS on SBD-DHCP01; quarantine VLAN 90 has no routes); switch management on VLAN 100; offline root with no live link; manual media transfers only, including backups. One instance each of Splunk, Tenable/Nessus, and Trellix ePO/DLP. No cluster or standby.

## 1. Enforce network boundaries

Owner role: Network administrator
Controls: AC-4, SC-7, SC-7(5), IA-3

VLAN 80 isolates the client population. Routed boundaries deny unmatched sessions; host firewalls enforce local separation too.

- [ ] Maintain a versioned flow register with source, destination, service, purpose, owner, and test evidence.
- [ ] Configure the core DHCP relay for VLAN 80 and a reserved client pool of 10.0.80.100–199, with room for the 50 PCs, test clients, and replacements; confirm exclusions and lease options.
- [ ] Permit only identified service dependencies. Resolve AD replication, enrollment, and vendor protocols before enabling their rules.
- [ ] Review exceptions after changes and on a proposed quarterly cycle.
- [ ] Admit devices with 802.1X: VLAN 80 access ports require EAP-TLS with a machine certificate from the issuing CA, checked by the NPS role on SBD-DHCP01 (no new server). Unknown or failed devices land in quarantine VLAN 90, which has no routes. NPS handles port admission only; router logins stay named local accounts, so NPS does not become a Tier 0 system.

### Acceptance checks

- [ ] Approved client DNS and file access succeeds.
- [ ] Client-to-SQL, client-to-management, and peer SMB/RDP fail.
- [ ] Unspecified ports and sources remain denied; collect rule counters and denial logs.
- [ ] An unenrolled laptop on a VLAN 80 port lands in quarantine VLAN 90 and reaches nothing.

Evidence: Approved traffic matrix and rule exports; Allowed and denied connection results.
Parameters: Suggested review cycle: quarterly and after change; approve the actual interval.
Assessment result: ____________________

## 2. Separate privileged access

Owner role: Identity and platform owners
Controls: AC-5, AC-6, IA-2(1), AU-12, AC-6(5)

Three administration seats on two machines use separate identities and target scopes: the endpoint seat runs as a virtual machine on the server seat, the arrangement the Defense Information Systems Agency (DISA) Windows Privileged Access Workstation (PAW) Security Technical Implementation Guide (STIG) allows where workstations are scarce. Tier 0 covers identity, PKI, and every system that can control them, and its seat runs no virtual machines. No host has universal administrative reach.

- [ ] Tier 0 (AdminJumpBox01): the DCs, issuing CA, template administration, the core switch, the hypervisor hosts and their console, and the DC-facing scopes of WSUS, ePO, Nessus, and Splunk. ADMIN-SRV01 handles member servers, with the audit custodian in separate accounts and sessions; ADMIN-PC01, a virtual machine on the ADMIN-SRV01 seat, handles clients.
- [ ] Require offline-compatible MFA and separate everyday and privileged accounts. Prohibit ordinary browsing, email, and general file use on administrative hosts.
- [ ] Deny cross-tier sessions with host and routed controls. Within the server tier, separate scanner, endpoint-policy, SIEM, and audit-custodian permissions.
- [ ] Manage unique local credentials, service-account scope, emergency access, session logs, and account removal.
- [ ] Keep the seat virtual machine’s boundary: Tier 1 accounts sign in only on the ADMIN-SRV01 host and Tier 2 accounts only in the ADMIN-PC01 virtual machine, with no shared clipboard, drives, folders, or key-value data between them. Each seat has its own maintenance group; tier accounts only use the seats. AdminJumpBox01 never hosts a virtual machine.

### Acceptance checks

- [ ] An endpoint administrator cannot manage a DC, issuing CA, or member server.
- [ ] A server operator cannot alter protected audit retention.
- [ ] MFA failure blocks privileged access; emergency access is recorded and reviewed.
- [ ] Each seat refuses the other tiers’ accounts: Tier 0 and Tier 2 on the ADMIN-SRV01 host, Tier 1 and Tier 2 on AdminJumpBox01, and Tier 0 and Tier 1 inside the ADMIN-PC01 virtual machine.
- [ ] A server-tier operator cannot approve DC updates, change DC agent policy, or run credentialed scans against the domain controllers.

Evidence: Privileged-access matrix and account review; MFA, session audit, and negative access tests.
Parameters: Suggested account review: quarterly and upon role changes; emergency access reviewed after use.
Assessment result: ____________________

## 3. Contain lateral movement

Owner role: Server and security administrators
Controls: AC-3, AC-4, SC-7

Sharing a VLAN never grants a service permission to contact its neighbors. Separate host policies protect data and security services.

- [ ] Permit SQL only from SBD-APPS01, the registered application consumer (F22); deny SBD-WEB01 (F14), which reaches data only through the application API (F21).
- [ ] Keep file, licensing, and web listeners limited to their intended clients. Block unnecessary outbound server traffic.
- [ ] Scope Nessus targets, scan windows, and least-privilege scan credentials; never include the offline root.
- [ ] Constrain ePO/DLP management reach and separate audit retention authority from ordinary tool administration.

### Acceptance checks

- [ ] The web server cannot reach SQL directly; only SBD-APPS01, the registered consumer, connects.
- [ ] A compromised client cannot reach security-tool management interfaces.
- [ ] The scanner cannot reach the offline root or unapproved targets.

Evidence: Per-host policy exports; Approved scan scope and credential review; Lateral movement denial tests.
Parameters: Define consumers and product transports before activation; no broad any-to-any exception.
Assessment result: ____________________

## 4. Control every media transfer

Owner role: Media custodian and release approver
Controls: MP-4, MP-5, MP-6, MP-7, SI-3, SI-7

Separate import and export procedures preserve the physical air gap. Every transfer is performed by an authorized person.

- [ ] Import: approve source and media ID; record custody; scan on the designated intake station; verify publisher signatures and trusted hashes; approve and record internal delivery.
- [ ] Quarantine rejected media. Disable autorun and restrict removable devices. Use write protection where compatible with the operation.
- [ ] Export: authorize the release, review classification and destination, apply DLP/content checks, record approver and contents, then physically transport approved media.
- [ ] Sanitize or destroy media under the approved procedure. Never connect an intake station to outside and inside networks at the same time.

### Acceptance checks

- [ ] Unknown media and failed signature checks prevent import.
- [ ] An export without release approval is stopped and logged.
- [ ] A sample transfer can be reconstructed from source through disposition.

Evidence: Media register and transfer records; Scan, integrity, approval, and sanitization records.
Parameters: Each transfer requires a record; retention duration and sanitization methods require local approval.
Assessment result: ____________________

## 5. Protect certificate trust

Owner role: PKI custodian
Controls: AC-5, AC-6, IA-5, SC-12, SC-17, SC-13, IA-2(2)

The root remains offline and non-domain-joined. Issuing services and template administration use the identity/PKI administration tier.

- [ ] Separate template modification, enrollment approval, and CA administration. Review template owners, enrollment rights, certificate purposes, and dangerous subject-name options.
- [ ] Protect CA private keys and recovery material with approved custody and cryptography. Record offline signing ceremonies.
- [ ] Publish CRLs and AIA material internally through a defined service. Export root publication artifacts manually; never add a live root connection.
- [ ] Monitor expiration and CRL freshness; test CA recovery using protected key backups.
- [ ] Publish CRLs and AIA certificates at pki.sbd.test (HTTP 80, rule F18) so every domain member can check revocation.
- [ ] Decide user MFA: smart cards with certificates from the issuing CA (IA-2(2)), or record the approved alternative in the system security plan.

### Acceptance checks

- [ ] An unauthorized user cannot modify a template or enroll for privileged identity.
- [ ] A revoked certificate is rejected using internal revocation data.
- [ ] Revocation and recovery continue to work without internet access.
- [ ] A client fetches the current CRL from pki.sbd.test; a revoked certificate is rejected.

Evidence: CA policy and template permission export; Ceremony, revocation, expiration, and recovery records.
Parameters: Choose publication endpoints and renewal lead times before enabling enrollment flows.
Assessment result: ____________________

## 6. Keep trustworthy audit evidence

Owner role: Security analyst and audit custodian
Controls: AU-5, AU-6, AU-8, AU-9, AU-11, AU-12, SC-45, AU-2, AU-3, AU-9(4), SI-4(2), SI-4(4)

One Splunk server provides analysis. The separate audit repository retains protected evidence; it is not a second Splunk instance.

- [ ] Use internal time: the PDC emulator, SBD-DC01, is the reliable source and serves time from its own clock; every other domain member syncs from the domain controllers over UDP 123 (F09). Define how its clock is checked and corrected, the tolerance, and the fallback without opening an external network path, and turn off hypervisor time synchronization for the domain controllers.
- [ ] Define the logged event set (AU-2) and the fields each record must carry (AU-3). Forward Windows security events with a source-initiated WEF subscription (F17), events from the Linux servers over syslog TLS (F07), and the router’s deny log; restrict senders.
- [ ] Collector → Splunk over the forwarder with TLS (F10); collector → SBD-AUDIT01 over encrypted SMB with a write-only archival account (F11). Only the audit custodian’s separate accounts administer protected retention (AU-9(4)); offline backups follow the recovery practice.
- [ ] Alert on stopped sources, audit-policy changes, clock drift, full storage, and unauthorized deletion. Size local queues for a Splunk outage and test replay without silent loss.
- [ ] Watch the traffic through the router’s deny log in Splunk: alert on repeated denied attempts and on denied traffic from unexpected VLANs (SI-4(4)).

### Acceptance checks

- [ ] Generate an event and trace its timestamps through collection, search, and retention.
- [ ] An ordinary platform administrator cannot delete retained audit evidence.
- [ ] Stop Splunk in a test environment, verify queue alerts, restore it, and reconcile replayed events.
- [ ] A test connection on an unregistered port appears as a router deny in Splunk and fires its alert.

Evidence: Event coverage and retention policy; Alert tests, capacity calculations, and replay reconciliation.
Parameters: Set retention, queue capacity, maximum clock drift, alert response, and review frequency.
Assessment result: ____________________

## 7. Maintain the isolated estate

Owner role: Configuration manager and system owners
Controls: CM-2, CM-3, CM-6, CM-7, CM-8, SI-2, SI-3, RA-5

Updates and security content arrive only through controlled media. One Nessus server scans the approved scope; one Trellix ePO/DLP server manages endpoint policies.

- [ ] Maintain inventory and hardened baselines for hosts, applications, switches, and security products. Remove unused services and restrict application execution.
- [ ] Validate imported updates and signatures; test a pilot group, approve rollout, verify installation, and retain a rollback procedure.
- [ ] Refresh Nessus plugins and Trellix protection content through their supported disconnected workflows. Track content age and missing or unhealthy agents.
- [ ] Maintain a remediation register with severity, owner, due date, exception approval, and rescan result. Separate package publishers from consumers.

### Acceptance checks

- [ ] Unsigned or unapproved packages cannot be published.
- [ ] Pilot and broad deployment results reconcile to the inventory.
- [ ] Remediated findings are rescanned and baseline drift is detected.

Evidence: Approved baselines and change records; Content import and patch results; Vulnerability register and rescan reports.
Parameters: Suggested cadence: weekly content review and monthly patch/scan cycle, with expedited handling for urgent risk; owners must approve timelines.
Assessment result: ____________________

## 8. Recover and exercise the design

Owner role: Recovery lead and system owners
Controls: CP-2, CP-4, CP-9, CP-10, IR-3, IR-4, CP-9(1), CA-5, PL-2, RA-7, CA-6

Splunk, Tenable/Nessus, and Trellix ePO/DLP each run on one server. Recovery uses protected backups, not clustering or standby servers.

- [ ] Define recovery time and recovery point objectives per service.
- [ ] Protect offline backups of required data, configurations, licenses, keys, and vendor-supported application/database recovery material. Use separate backup credentials.
- [ ] Restore identity/DNS/time dependencies, PKI, data services, then security and management functions in a dependency-tested order. Put the two DCs in separate infrastructure failure domains where feasible.
- [ ] During a Splunk outage retain and monitor local logs; during a Nessus outage track deferred scans; during an ePO/DLP outage verify installed agents retain their last policy and document lost central visibility.
- [ ] Exercise malicious-media, ransomware, and privileged-account compromise scenarios; retain results and corrective actions.
- [ ] Backup path: each server writes its backup (DC system state, CA database and keys, configurations, the audit archive) to a protected local backup volume. Tier 0 custodians carry DC and CA backups, and the audit custodian carries the archive, to the offline backup facility under the media custody procedure. No network path to the backup facility exists.
- [ ] Track restore gaps found in recovery exercises in the POA&M (CA-5).

### Acceptance checks

- [ ] Restore each of the three security platforms independently.
- [ ] Verify restored policies, searches, scan configuration, agent reconnection, and required data.
- [ ] Time a full recovery exercise and compare observed results with approved objectives.

Evidence: Backup inventory and integrity checks; Restore exercise records and measured recovery times; Incident exercise findings and corrective actions.
Parameters: Suggested schedule: quarterly sampled restores and annual end-to-end/incident exercises, plus material changes. RTO/RPO remain owner decisions.
Assessment result: ____________________

## 9. Protect the network’s own management

Owner role: Network administrator
Controls: AC-6, CM-6, AU-12, SC-7

The core switch is managed only on a separate management VLAN (VLAN 100, switch interfaces only), reachable from AdminJumpBox01. Device logins use named accounts, and every change leaves a log entry and a versioned configuration.

- [ ] Move switch management to VLAN 100 and bind SSH and HTTPS management to it; disable Telnet, HTTP, and unused services.
- [ ] Give each device administrator a named account, keep one sealed break-glass account, and log every session.
- [ ] Send switch syslog (including ACL denies) to SBD-SYSLOG01 and keep time from the internal hierarchy.
- [ ] Back up the running configuration after every approved change; keep versions with hashes and compare them on a schedule.

### Acceptance checks

- [ ] A switch management login from any host but AdminJumpBox01 fails.
- [ ] A switch login with an unknown account is refused and logged.
- [ ] The latest configuration backup matches the running configuration.

Evidence: Management VLAN and access-list export; AAA and switch log samples; Configuration versions with hashes.
Parameters: Suggested configuration comparison: weekly and after every change.
Assessment result: ____________________

## Privileged access

- Tier 0 · identity, PKI, and what controls them: AdminJumpBox01; targets: SBD-DC01, SBD-DC02, SBD-SUBCA01, SBD-PKI-MGMT01, SBD-WSUS01, SBD-EPO01, SBD-NESSUS01, SBD-SPLUNK01. Identity: Tier 0 operators with separate task permissions. Includes the DC-facing administration of WSUS (DC update ring), ePO (DC agent policy), Nessus (DC scan credentials), and Splunk (DC monitoring), plus the core switch and the hypervisor hosts and their console. Prohibited: Member-server and endpoint administration; remote access to offline root.
- Member servers: SBD-ADMIN-SRV01; targets: SBD-DHCP01, SBD-SYSLOG01, SBD-WSUS01, SBD-FS01, SBD-SQL01, SBD-APPS01, SBD-WEB01, SBD-SPLUNK01, SBD-NESSUS01, SBD-EPO01, SBD-MGMT01, SBD-REPO01. Identity: Named role limited to assigned servers; separate security-tool operators with member-server and endpoint scope only. Prohibited: DC/CA/template administration, DC-facing scopes in WSUS, ePO, Nessus, and Splunk, client administration, and audit-retention changes.
- User endpoints: SBD-ADMIN-PC01; targets: 50 Windows PCs. Identity: Endpoint-only operator; scoped local credentials. Prohibited: Identity, PKI, member-server, and security-tool management.
- Audit custody: SBD-ADMIN-SRV01; targets: SBD-AUDIT01. Identity: Separate audit custodian accounts and a separate session on SBD-ADMIN-SRV01; protected retention changes require independent approval. Prohibited: Ordinary server operators cannot use this role or delete retained records.

## Control verification record

Control / responsible person / configuration / verification method / evidence location / actual result / test date / corrective action and due date.

## Media transfer record template

Transfer ID / direction / media ID / custodian / source / destination / classification / file manifest and hashes / signature verification / scan result and content date / release approval / delivery acknowledgment / sanitization or storage disposition.

## Recovery exercise record template

Service / dependencies / protected backup ID / last successful backup / approved RPO and RTO / outage procedure / restoration steps / actual start and finish / recovered data cutoff / functional checks / issues / owner and due date.
