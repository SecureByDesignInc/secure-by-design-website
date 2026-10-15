# Audit: course 1.18 business-services

This course was renumbered from the old 1.9, not rewritten, so it carried stale course numbers, dependencies on SBD-NESSUS01, an incomplete Linux build and an impossible lesson order. The validator passes: 5 lessons, 160 minutes, 2.7 h. Lesson ids, lesson count and minutes are unchanged.

## Fixed

### catalog.json
- `number` "1.9" → "1.18".
- `categoryOrder` 9 → 18.
- Stages re-synced to the lesson summaries.

### course.json, prerequisites and sources
- Prerequisites:
  - "Complete courses 1.4–1.8" → courses 1.1–1.15, listing what each actually built (including the 1.6 autoenrollment GPO, 1.9's client package and the 1.11 KDS root key).
  - Removed SBD-NESSUS01 as a join model (rule 1); the model is now SBD-SPLUNK01 (course 1.12).
  - "the course 1.4 SBD Server Authentication template" → course 1.6.
  - Added 1.9's Linux assessment set and 1.4's SCC media.
- Sources:
  - Dropped `disa-gpo`: the GPO package page doesn't carry the Apache guidance it was cited for.
  - Added `dmsa`, `kds`, `sql-encrypt`, `audit-policy`, `firewall`, `redhat-ad`, `chrony`, `redhat-trust`, `ca-certificates`, `firewalld`, `apache`, `disa-scap`, `disa-tools` and `filehash`. All are on allowed origins. `dmsa`, `sql-encrypt` and `redhat-ad` were checked this session; the rest are reused from audited siblings.

### design (lesson 1)
- Step 1: rows now carry their register IDs (F05, F12, F13, F21, F22, F14 deny) and an owner.
- Step 2:
  - "Course 1.8's repository row named only those two because WEB01 did not exist yet" → F19 (course 1.9) and F07 already list SBD-WEB01.
  - Added the rows every new server needs: A02, F01–F03, F06, F09, F17, F18, and the course 1.6 enrollment row.
  - Removed SBD-NESSUS01.
- Step 3: gMSAs now rely on course 1.11's KDS root key. The step checks it with `Get-KdsRootKey`, never creates another, and creates each account from AdminJumpBox01 once its host exists.
  - Previously the gMSAs were "created" before any host existed. `-PrincipalsAllowedToRetrieveManagedPassword` needs the computer object.
  - The dMSA claim now cites the dMSA overview.
- Step 4: "course 1.3 Groups OU" → course 1.5, created from AdminJumpBox01.
- Step 5:
  - Certificates were "requested" before the servers existed, which would need off-host keys; 1.6's template allows exportable keys only where the recovery plan says so.
  - They are now planned here and requested on each host in its build lesson.
  - "course 1.4 process" → course 1.6. The step notes that 1.6's autoenrollment GPO already reaches the new members, so no new enrollment policy is created.
- `command`: runs from AdminJumpBox01, because the AD module needs ADWS, which is open only to AdminJumpBox01 (A01). Added the KDS key check. Dropped the meaningless pre-build `Test-NetConnection`.
- `check`, `evidence`, `sources` and recap 3 are aligned with the above.

### fileserver (lesson 2)
- New step 1 builds SBD-FS01:
  - address and gateway sample, both DCs for DNS, a data volume
  - hypervisor time sync off (rule 2)
  - joined into the Servers OU, so the 1.5, 1.8, 1.10 and 1.14 policies apply
  - a time-source check
- Steps 2–3 split the shares from ABE so the step count stays clear.
- Step 5 (two-role test): "the denial lands in the pipeline" was untrue, because nothing audited or forwarded share refusals. It now turns on Audit Detailed File Share (failure) on FS01, as a documented addition like 1.11's, so each refusal is event 5145; lesson 5 forwards it.
- `check`: "Signed reads False even though an encrypted connection is also signed" → "because encryption, which also protects integrity, takes the place of signing".
- `command`:
  - added an OU and time check, `auditpol` and the 5145 read
  - `Get-SmbConnection -ServerName SBD-FS01` → `Where-Object ServerName -like 'SBD-FS01*'`, which matches FQDN connections too
- Objective 1, `evidence` and `sources` (+`audit-policy`) are aligned.

### database (lesson 3)
- Lesson order was impossible. Lesson 3 tested from SBD-APPS01 and SBD-WEB01, but lesson 4 built both, and the gMSA login for APPS01 needs its computer object.
  - Step 1 now builds SBD-SQL01 and APPS01's host, as FS01 was built.
  - It then creates SBD-SQL$ and SBD-Apps$ (sample names), each allowed to one computer, from AdminJumpBox01.
- Step 2: the certificate is requested on SQL01 through the course 1.6 process. Added the gMSA's read on the private key (without it the service won't start; Microsoft documents this), Force Encryption, and the restart.
- Step 3: the database role goes to one login, SBD\SBD-Apps$.
- Step 4:
  - Added the host-firewall rule that admits 1433 from 10.0.40.30 only. Nothing in the draft made SQL01 refuse its VLAN 40 neighbours.
  - The same-VLAN refusal is now proven from SBD-FS01; WEB01's is proven in lesson 4, once it exists.
- `command`:
  - `Get-Service -ComputerName` (gone in PowerShell 7, and it doesn't show the account) → `Win32_Service StartName`
  - added the ForceEncryption registry check, the certificate export with `certutil -verify -urlfetch`, and the 1433 firewall scope
  - removed `nc`, which isn't on a minimal install, and the WEB01 test
- Objectives, `check`, `evidence`, `sources` and recap 3 are aligned.
- Quiz 2 explanation: "course 1.4" → course 1.6.
- Quiz 3, correct answer: "SBD-WEB01" → "a VLAN 40 neighbour". The answer must match what the lesson proves.

### apps-web (lesson 4)
- Step 1: APPS01 (built in lesson 3) requests its certificate on the host and runs both services as SBD-Apps$, or records an exception where the product can't use a gMSA. Its host firewall admits the API from 10.0.40.40 only.
- New steps 2–3 build SBD-WEB01 the decided way:
  - hashed media
  - hypervisor time sync off
  - course 1.3's chrony file (both DCs, maxdistance 16) before anything else
  - course 1.9's client package (hash-checked) before the first update
  - the course 1.6 root in the system trust store by hand, hash-checked
  - `realm join` into the Servers OU, `realm permit -g SBD Tier 1 Admins`, a sudo drop-in
  - a firewall carrying only F13 and SSH from 10.0.60.20
  - syslog over TLS to SBD-SYSLOG01 (F07), with WEB01 added to the 6514 sender list
  - Removed "as SBD-SPLUNK01 and SBD-NESSUS01 are joined".
- Step 4: the WEB01 key and request are made on the host with openssl, through course 1.6. Apache is hardened against the Apache Server 2.4 UNIX STIGs that 1.9 staged. "course 1.4's templates" → 1.6.
- Step 5: added SQL01's `sys.dm_exec_connections` `encrypt_option` check of APPS01's live session.
- `command`:
  - added chrony, repository, `realm`, firewall, the TLS check to the collector, `logger` and `apachectl`
  - `nc` → bash `/dev/tcp` with `timeout`
  - the certificate check moved to SBD-ADMIN-SRV01
- Objective 2, `check`, `evidence`, `sources`, recap 2 and `next` are aligned.
- Quiz 1: "the 1.8 rule" → course 1.9 (F19).
- Quiz 2: correct answer and explanation rewritten. "Hardened config export … no SCAP automation" was wrong; Linux servers get SCC for Linux plus manual Apache items (first-wave decision).

### prove-scan (lesson 5)
- New step 1 enrols FS01, SQL01 and APPS01, as rule 4 requires:
  - SBD Event Sources, from AdminJumpBox01
  - the collector's WinRM scope widened (F17)
  - an FS01-filtered 5145 query, as in 1.11
  - a restart and an arrival check
- Step 2: "the matrix … beside course 1.5's" (old numbering) → the register's evidence beside the earlier courses' proofs.
- Step 3:
  - Removed the credentialed SBD-NESSUS01 scan (rule 1). Windows hosts get SCC run locally in Tier 1 sessions, as 1.14 did. WEB01 gets SCC for Linux from 1.9's `C:\Staging\DISA\linux`, the 1.9 way, plus the Apache items.
  - Added the SQL Server STIGs as a checklist.
  - Classifications use 1.4's values, with "fix now (no GPO applies to Linux)" for WEB01.
  - The one coming-soon mention (course 1.17).
- Step 4:
  - The MGMT01 rows turn from planned to active through 1.15's change log.
  - Deviations go to the exception record's owner on AdminJumpBox01 (first-wave rule).
- Step 5: "course 1.10" → 1.19.
- `command`:
  - added `wecutil gr`, a ForwardedEvents per-source count and the WEB01 syslog proof
  - the hash list is now recursive and exported (it previously hashed only top-level files)
- `check`, `evidence` (handoff to 1.19), objectives and `next` ("That completes course 1.9. Course 1.10…" → 1.18 and 1.19) are aligned.
- Quiz 2: correct answer and explanation rewritten. "WEB01 gets the hashed config export" was wrong under the Linux scanning decision.
- Quiz 3: "course 1.10" → 1.19.

### business-services.json (guide)
- Removed the SBD-NESSUS01 node ("Built in course 1.8", credentialed scan) and its flow.
- Added SBD-SYSLOG01 (existing, back row) with a WEB01 → collector "Syslog over TLS · TCP 6514 (F07)" flow, and SBD-ADMIN-SRV01 (existing, front row, the Tier 1 seat).
- Fleet "Built in course 1.7" → 1.13. The APPS01 and WEB01 descriptions follow the new lesson order and build.
- `stepTitles` were rewritten for all five lessons to match the new steps in count and meaning.
- The network captions, mistakes and checklists for design, fileserver, database, apps-web and prove-scan follow the changes above.
- prove-scan control RA-5 (it depended on the Nessus scan) → CM-2 Baseline Configuration.

## Judgment calls for the owner

1. **FS01 refusal auditing.** The draft claimed share denials "land in the pipeline"; I made that true with Audit Detailed File Share (failure) on FS01 and a 5145 query in the subscription. That is a documented addition beyond the STIG GPOs. Alternative: drop the claim and keep the denial as a test-session record only. Recommendation: keep it; it mirrors 1.11's SBD-AUDIT01 pattern and is low-volume.
2. **SQL Server STIG content.** Course 1.4 staged only Windows Server, AD and Windows client content. This course now stages DISA's SQL Server STIGs "as course 1.4 taught", as 1.14 does for IIS. Alternatively, 1.4 could stage it up front. Recommendation: keep the per-course staging.
3. **gMSA for the licensing service.** Many vendor license managers can't run under a gMSA. The lesson now says "or record an exception". Recommendation: keep it; the owner may prefer to name a specific product.
4. **APPS01's host is built in lesson 3.** It moved up so the database's one login and caller exist, while its services stay in lesson 4 (the guide already showed APPS01 from lesson 3). The alternative is to move the SQL login and proof into lesson 4. Recommendation: keep the current order.
5. **`whatsnew` source title "What's new in Windows Server 2025".** This is Microsoft's page title and its URL contains the release number, which sits awkwardly with rule 8. Audited courses 1.4, 1.6 and 1.8 keep it as is. Recommendation: decide once for all courses, e.g. retitle it "What's new in Windows Server (newest release)" with the URL unchanged.
6. **Recovery scope for VLAN 40** (see below). Which business data course 1.19 must restore is a policy choice.

## For other courses

- **prove-recovery (1.19)**: its recovery set and custodians list the member-server sets "SBD-DHCP01, SBD-REPO01, SBD-SPLUNK01, and SBD-MGMT01" but no VLAN 40 system. Add, or record as out of scope by owner decision:
  - SBD-FS01's share data with its NTFS ACLs
  - SBD-SQL01's application databases (and the gMSA logins they depend on)
  - SBD-APPS01's and SBD-WEB01's configuration and certificates
- **Inside the Network**:
  - the enrollment row (proposed F23, domain members → SBD-SUBCA01) also serves SBD-FS01, SBD-SQL01 and SBD-APPS01
  - SBD-SQL01's note could add "host firewall admits 1433 from 10.0.40.30 only"
- **splunk-analysis (1.12)** (FYI): this course uses SBD-SPLUNK01's `analysis-plan` build as the Linux member pattern. That lesson still carries the items linux-repository/audit.md lists (`/opt/scc/cscc`, root CA by hand), and 1.18 now follows the corrected 1.9 procedure rather than 1.12's current text.

## Owner decisions applied (14 October 2026)

- D1: prerequisites and lesson 4 build step name the Red Hat Enterprise Linux–family release; the Ubuntu apt-cache alternative removed from lesson 4's command; root CA placement now names /etc/pki/ca-trust/source/anchors and update-ca-trust.
- D1: Debian update-ca-certificates source dropped from the course and lesson 4.
- D13: "inside that course's threshold" removed from lesson 4 step 2; verification shows a selected controller with a small, steady offset.
- D2: the course defines no backups; lesson 3 records the databases and logins for course 1.19; lesson 4's configuration export is a change record and names course 1.19 as backing up APPS01/WEB01 configuration and certificates; lesson 1's exportable-key note points to course 1.19's recovery plan; lesson 5 handoff, quiz 3 answer and "next" say course 1.19 backs up the VLAN 40 servers (FS01 share data with NTFS permissions, SQL01 databases and logins, APPS01/WEB01 configuration and certificates); guide lesson 5 control question updated.
- D12: no single-instance risk listing present; nothing to change.
