# Secure By Design — network implementation plan

Security procedures, control mappings, acceptance checks, and operating schedules.

Control catalog: NIST SP 800-53 Rev. 5.

## Architecture

Eight VLANs; 50 clients in 10.0.80.100–149; offline root with no live link; manual media transfers only. One instance each of Splunk, Tenable/Nessus, and Trellix ePO/DLP. No cluster or standby.

## 1. Enforce network boundaries

Owner role: Network administrator
Controls: AC-4, SC-7, SC-7(5)

VLAN 80 isolates the client population. Routed boundaries deny unmatched sessions; host firewalls enforce local separation too.

- [ ] Maintain a versioned flow register with source, destination, service, purpose, owner, and test evidence.
- [ ] Configure the core DHCP relay for VLAN 80 and a reserved client pool of 10.0.80.100–149; confirm exclusions and lease options.
- [ ] Permit only identified service dependencies. Resolve AD replication, enrollment, and vendor protocols before enabling their rules.
- [ ] Review exceptions after changes and on a proposed quarterly cycle.

### Acceptance checks

- [ ] Approved client DNS and file access succeeds.
- [ ] Client-to-SQL, client-to-management, and peer SMB/RDP fail.
- [ ] Unspecified ports and sources remain denied; collect rule counters and denial logs.

Evidence: Approved traffic matrix and rule exports; Allowed and denied connection results.
Parameters: Suggested review cycle: quarterly and after change; approve the actual interval.
Assessment result: ____________________

## 2. Separate privileged access

Owner role: Identity and platform owners
Controls: AC-5, AC-6, IA-2(1), AU-12

Three dedicated administration hosts use separate identities and target scopes. No host has universal administrative reach.

- [ ] Use the existing jump box only for identity and PKI. Use ADMIN-SRV01 for approved member servers and ADMIN-PC01 for clients.
- [ ] Require offline-compatible MFA and separate everyday and privileged accounts. Prohibit ordinary browsing, email, and general file use on administrative hosts.
- [ ] Deny cross-tier sessions with host and routed controls. Within the server tier, separate scanner, endpoint-policy, SIEM, and audit-custodian permissions.
- [ ] Manage unique local credentials, service-account scope, emergency access, session logs, and account removal.

### Acceptance checks

- [ ] An endpoint administrator cannot manage a DC, issuing CA, or member server.
- [ ] A server operator cannot alter protected audit retention.
- [ ] MFA failure blocks privileged access; emergency access is recorded and reviewed.

Evidence: Privileged-access matrix and account review; MFA, session audit, and negative access tests.
Parameters: Suggested account review: quarterly and upon role changes; emergency access reviewed after use.
Assessment result: ____________________

## 3. Contain lateral movement

Owner role: Server and security administrators
Controls: AC-3, AC-4, SC-7

Sharing a VLAN never grants a service permission to contact its neighbors. Separate host policies protect data and security services.

- [ ] Permit SQL only from identified application consumers; keep the unconfirmed web-to-SQL dependency blocked.
- [ ] Keep file, licensing, and web listeners limited to their intended clients. Block unnecessary outbound server traffic.
- [ ] Scope Nessus targets, scan windows, and least-privilege scan credentials; never include the offline root.
- [ ] Constrain ePO/DLP management reach and separate audit retention authority from ordinary tool administration.

### Acceptance checks

- [ ] The web server cannot access SQL before an approved dependency exists.
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
Controls: AC-5, AC-6, IA-5, SC-12, SC-17

The root remains offline and non-domain-joined. Issuing services and template administration use the identity/PKI administration tier.

- [ ] Separate template modification, enrollment approval, and CA administration. Review template owners, enrollment rights, certificate purposes, and dangerous subject-name options.
- [ ] Protect CA private keys and recovery material with approved custody and cryptography. Record offline signing ceremonies.
- [ ] Publish CRLs and AIA material internally through a defined service. Export root publication artifacts manually; never add a live root connection.
- [ ] Monitor expiration and CRL freshness; test CA recovery using protected key backups.

### Acceptance checks

- [ ] An unauthorized user cannot modify a template or enroll for privileged identity.
- [ ] A revoked certificate is rejected using internal revocation data.
- [ ] Revocation and recovery continue to work without internet access.

Evidence: CA policy and template permission export; Ceremony, revocation, expiration, and recovery records.
Parameters: Choose publication endpoints and renewal lead times before enabling enrollment flows.
Assessment result: ____________________

## 6. Keep trustworthy audit evidence

Owner role: Security analyst and audit custodian
Controls: AU-5, AU-6, AU-8, AU-9, AU-11, AU-12, SC-45

One Splunk server provides analysis. The separate audit repository retains protected evidence; it is not a second Splunk instance.

- [ ] Use internal time: TIME01 supplies the domain time authority; domain members follow the domain hierarchy. Define a reference source, tolerance, and fallback without opening an external network path.
- [ ] Forward selected authentication, privilege, policy, media, and security-tool events; protect transport and restrict senders.
- [ ] Use protected retention with separate audit-custodian permissions and offline backups. Select and validate the storage protection mechanism.
- [ ] Alert on stopped sources, audit-policy changes, clock drift, full storage, and unauthorized deletion. Size local queues for a Splunk outage and test replay without silent loss.

### Acceptance checks

- [ ] Generate an event and trace its timestamps through collection, search, and retention.
- [ ] An ordinary platform administrator cannot delete retained audit evidence.
- [ ] Stop Splunk in a test environment, verify queue alerts, restore it, and reconcile replayed events.

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
Controls: CP-2, CP-4, CP-9, CP-10, IR-3, IR-4

Splunk, Tenable/Nessus, and Trellix ePO/DLP each have exactly one server instance. Recovery uses protected backups, not clustering or standby servers.

- [ ] Define recovery time and recovery point objectives per service; record the accepted outage exposure of each single instance.
- [ ] Protect offline backups of required data, configurations, licenses, keys, and vendor-supported application/database recovery material. Use separate backup credentials.
- [ ] Restore identity/DNS/time dependencies, PKI, data services, then security and management functions in a dependency-tested order. Put the two DCs in separate infrastructure failure domains where feasible.
- [ ] During a Splunk outage retain and monitor local logs; during a Nessus outage track deferred scans; during an ePO/DLP outage verify installed agents retain their last policy and document lost central visibility.
- [ ] Exercise malicious-media, ransomware, and privileged-account compromise scenarios; retain results and corrective actions.

### Acceptance checks

- [ ] Restore each of the three single-instance security platforms independently.
- [ ] Verify restored policies, searches, scan configuration, agent reconnection, and required data.
- [ ] Time a full recovery exercise and compare observed results with approved objectives.

Evidence: Backup inventory and integrity checks; Restore exercise records and measured recovery times; Incident exercise findings and corrective actions.
Parameters: Suggested schedule: quarterly sampled restores and annual end-to-end/incident exercises, plus material changes. RTO/RPO remain owner decisions.
Assessment result: ____________________

## Privileged access

- Identity / PKI: AdminJumpBox01; targets: SBD-DC01, SBD-DC02, SBD-SUBCA01, SBD-PKI-MGMT01. Identity: Dedicated identity or PKI operator; separate task permissions. Prohibited: Member-server and endpoint administration; remote access to offline root.
- Member servers: SBD-ADMIN-SRV01; targets: SBD-DHCP01, SBD-SYSLOG01, SBD-WSUS01, SBD-TIME01, SBD-FS01, SBD-SQL01, SBD-APPS01, SBD-WEB01, SBD-SPLUNK01, SBD-NESSUS01, SBD-EPO01, SBD-MGMT01, SBD-REPO01. Identity: Named role limited to assigned servers; separate security-tool operators. Prohibited: DC/CA/template administration, client administration, and audit-retention changes.
- User endpoints: SBD-ADMIN-PC01; targets: 50 Windows 11 PCs. Identity: Endpoint-only operator; scoped local credentials. Prohibited: Identity, PKI, member-server, and security-tool management.
- Audit custody: SBD-ADMIN-SRV01; targets: SBD-AUDIT01. Identity: Separate audit custodian; protected retention changes require independent approval. Prohibited: Ordinary server operators cannot use this role or delete retained records.

## Control verification record

Control / responsible person / configuration / verification method / evidence location / actual result / test date / corrective action and due date.

## Media transfer record template

Transfer ID / direction / media ID / custodian / source / destination / classification / file manifest and hashes / signature verification / scan result and content date / release approval / delivery acknowledgment / sanitization or storage disposition.

## Recovery exercise record template

Service / single-instance dependencies / protected backup ID / last successful backup / approved RPO and RTO / outage procedure / restoration steps / actual start and finish / recovered data cutoff / functional checks / issues / owner and due date.
