# Course 1.10 logging-pipeline: audit (14 October 2026)

Five lessons, 140 minutes (2.3 h). Lesson ids, counts, minutes and quiz keys are unchanged. The validator passes.

## Fixed

- **prerequisites[0]** (rule 4): now "courses 1.1–1.9". It names every Windows source that exists at this point: both DCs, SBD-SUBCA01, SBD-PKI-MGMT01, SBD-DHCP01 and the three admin seats.
- **prerequisites[1]** (rule 2): SBD-SYSLOG01's hypervisor time sync is turned off, and `w32tm /query /source` must name a DC.
- **design step 2, quiz 2 answer 2** (rule 4): the scope was "DC Security logs, admin-host sign-ins". It is now the Security log and course 1.3's time events from every existing Windows system.
- **design step 3**: deletion now needs "independent approval (rule A04)", which matches 1.11's two-person retention.
- **design step 5** (rule 3): the router already sends its deny log on UDP 514, and this course only receives it. Fixed the stale "until courses 1.11 and 1.11" to 1.11 and 1.12.
- **design recap 1**: "(1.9) … (1.10) … (1.11)" is now 1.10 / 1.11 / 1.12.
- **design command, auditing command**: these wrote to `C:\Evidence` on the DC, which course 1.8 retired. Both now run from AdminJumpBox01 with `Invoke-Command` or `gpresult /s`. SYSLOG01's service check runs from SBD-ADMIN-SRV01 (Tier 1), not as Tier 0. The auditpol query also covers Security State Change.
- **auditing step 2** (rule 4 / time decision): added Security State Change, the subcategory that writes event 4616.
- **auditing step 3**: confirm that SUBCA01, PKI-MGMT01 and DHCP01 carry the member-server STIG audit values.
- **auditing step 4**: the exception record is kept on AdminJumpBox01 (1.8).
- **auditing sources**: added `audit-policy` (Microsoft Learn, Advanced audit policy configuration). It was fetched and checked: it covers Security State Change, File System and Detailed File Share.
- **collector summary and catalog stage 3**: changed "DC and admin-host events" to every existing Windows system, and "from the next lessons" to "from lesson 5".
- **collector step 1** (rule 4, time decision): the subscription has two queries, the whole Security log (so 4616 is included) and Microsoft-Windows-Time-Service 12, 35, 36, 37, 129 and 142 from the System log. SBD Event Sources holds all eight existing Windows systems and is created from AdminJumpBox01.
- **collector step 2**: one enrolling GPO, linked to the Domain Controllers, Tier 0 Servers, Servers and Admin sub-OUs. It is security-filtered to SBD Event Sources, with read kept for Authenticated Users. Without the filter, linking at the Servers OU would also enroll the collector itself and any later server. Later courses (1.11, 1.14, 1.15) already "add to SBD Event Sources and widen the scope", which matches this.
- **collector step 3**: the WinRM 5985 scope was VLANs 10 and 60 only. It now also covers 10.0.30.20, 10.0.30.30 and 10.0.20.10. DHCP01 shares VLAN 20, so only the host firewall scopes it.
- **collector step 4**: rule 3 wording ("already sends its deny log to this address"). The certificate is requested through the course 1.6 process (that template has no autoenrollment).
- **collector command, check, recap 2**: the commands say where each part runs, and the check covers every SBD Event Sources member and the Time-Service events.
- **collector quiz 2**: "Both admin hosts forward" is now "The admin seats forward", because there are three. The key is unchanged and correct.
- **collector-prove step 3** (1.9 audit item): REPO01's rsyslog TLS uses the system trust store, which holds the 1.6 root that course 1.9 placed there.
- **collector-prove step 4** (rule 5 / 1.8): SYSLOG01's baseline runs locally in a Tier 1 session, with SCC copied over remoting from SBD-ADMIN-SRV01's 1.8 copy and its hash checked. A02 carries no SMB or RPC for remote scans.
- **collector-prove step 5**: the handoff names the gap windows that 1.11 re-exports (`-r1`).
- **collector-prove command**: reordered so `logger` runs before the search for its message. Added the router-deny search (by the probe's destination, 10.0.20.10, which works whatever the router vendor) and an `ss` check of the TLS session. Each part says where it runs.
- **collector-prove evidence, next**: changed "handoff note to course 1.10" to 1.11, and "That completes course 1.9" to 1.10.
- **catalog**: the systems list adds SBD-SUBCA01, SBD-PKI-MGMT01 and SBD-DHCP01. The description and outcome 3 now say every existing Windows system. Stages were re-synced to the summaries.
- **guide**:
  - The REPO01 node said "Built in course 1.8"; it is now 1.9. The admin node said "from course 1.7"; it is now 1.8 (1.8 audit item).
  - Added a "PKI + DHCP" node (SUBCA01, PKI-MGMT01, DHCP01) with its F17 flow, giving 5 back-row nodes and 6 flows.
  - The sample "Sources" row, the scene label and the design, collector and collector-prove network captions now include them.
  - The design caption's "courses 1.11 and 1.11" is now 1.11 and 1.12.
  - The collector step-2 title and checklist were updated.
  - The collector-prove checklist's "handoff to course 1.10" is now 1.11.

## Checked, no change needed

- NIST titles: AU-11, AU-12, AU-3, AU-5 and AU-8 are exact.
- Model links: `process=logs` steps 1 and 2 (DC01→SYSLOG01, REPO01→SYSLOG01) and `system=syslog` exist.
- Rule IDs: F07, F10, F11 and F17 match `security.js`. The TCP 23 probe from SBD-ADMIN-SRV01 to SBD-DHCP01 is outside A02's ports, so the core denies and logs it.
- Facts:
  - The subscription-manager string, MinLatency (30 s push), "Domain Computers excludes DCs", and Network Service in Event Log Readers.
  - Kerberos encryption over HTTP 5985, and `wecutil gr` heartbeats.
  - Retain mode refuses new events when the log is full, so overwrite-oldest is correct here.
  - The 5136 SACL caveat, and per-subcategory audit merging.
- Sources: all are on allowed origins. The `audit-faq` URL contains "windows-10", but AGENTS.md lets Microsoft URLs keep their own wording.

## Judgment calls for the owner

1. **Which syslog receiver.** Windows has no syslog listener, and the course says "an approved syslog receiver for Windows". Options: keep it vendor-neutral, or name one product and add its official docs. Recommendation: keep it neutral, as Inside the Network does, but list the required capabilities in the workbook: UDP 514, TLS 6514 with a server certificate, per-sender daily files, and a sender allowlist.
2. **F07 "mutual trust".** Inside the Network describes F07 as "mutual trust and sender allowlist". The course (and 1.12) authenticates the collector by certificate and the senders by address allowlist, without client certificates. SBD-REPO01 isn't domain-joined, so it can't autoenroll. Options: keep server-only TLS plus the allowlist and reword F07, or require client certificates from the 1.6 CA for every Linux sender. Recommendation: reword F07 to "server certificate checked, sender allowlist". Client certificates add manual issuance and renewal for every Linux host.
3. **The router's syslog row has no rule ID** (rule 3 says Inside the Network gets one). The course registers it as an unnumbered row. Recommendation: add a numbered row (core → SBD-SYSLOG01, UDP 514) to `security.js` and regenerate the matrix.
4. **The whole Security log versus a designed ID list.** Rule 4 says "collect the Security log", so the subscription now forwards all of it. Event volume is then set by the audit policy, not by the subscription. If the owner prefers an ID-filtered query, 1.11's integrity step needs its Security-ID query back.

## For other courses

- **splunk-analysis (1.12) `analyze` step 4**: drop the conditional "if SBD-ForwardedSecurity doesn't carry them yet, add a query on the collector for the Microsoft-Windows-Time-Service events…". Course 1.10 now carries them. "as course 1.11 added SBD-AUDIT01's" should become "as course 1.11 added SBD-AUDIT01's Application-log query". The command's `Select-String 'Time-Service'` check still works.
- **workstation-fleet (1.13)**: to enroll the fleet:
  - add the PCs, or a fleet group nested in it, to SBD Event Sources;
  - link course 1.10's filtered enrolling GPO to the Workstations OU;
  - widen the collector's WinRM 5985 scope to 10.0.80.0/24.
  SBD-DHCP01 is already enrolled, so its NPS events need only an extra query for the NPS events 1.13 wants beyond the Security log (NPS writes 6272/6273 to the Security log, which is already collected).
- **Every later Windows course**: the Servers and Tier 0 Servers OUs already carry the enrolling GPO. A new server there needs only SBD Event Sources membership, a restart and the WinRM scope widened. 1.14 and 1.15 already say this.
- **Inside the Network**: judgment calls 2 and 3.
