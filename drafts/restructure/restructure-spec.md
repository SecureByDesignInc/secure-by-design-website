# Training restructure: writing the new and split courses

Repository (read-only for you): /home/claude/secure-by-design-website. Do NOT edit, commit, or push anything in the repository. Write only inside your own draft folder: /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/newcourses/<course id>/ (create it).

## What the owner decided

The owner of Secure By Design asked to split three consolidated courses in the "Build the Network" path, and to expand every resulting tile into a full course that stands on its own (its own lessons, workbook, interactive guide, checklist and knowledge checks):

- Course 1.2 "Configure DNS and time" becomes two courses: DNS, and domain time (NTP / Windows Time).
- Course 1.3 "Harden the baseline" becomes two courses, in this order: STIG/SCAP measurement first, then Group Policy hardening. The GPO course applies the policies and rescans to prove the fix against the STIG course's baseline.
- Course 1.6 "See everything: the logging pipeline" becomes three courses, in pipeline order: SBD-SYSLOG01 (collect), SBD-AUDIT01 (preserve), SBD-SPLUNK01 (analyze).
- SBD-REPO01, the Linux repository server, becomes its own tile, placed before the logging courses (so SBD-SPLUNK01, the first Linux server, patches from it from day one). All REPO01 material moves out of the patching course and is consolidated in the REPO01 course.
- Course "Addressing and tiered administration" becomes two courses: DHCP (SBD-DHCP01) first, then tiered administration (the three admin seats and the tier rules).
- Course "Patch, protect, and watch for weakness" becomes four tiles: SBD-WSUS01, SBD-MGMT01, SBD-EPO01 and SBD-NESSUS01. EPO01 and NESSUS01 are listed as "Coming soon" with no material yet (their current lessons are withdrawn and kept unpublished).


## Current state (October 14 — read this)

- The repository working tree is on branch `training-restructure`, rebased onto the latest main. Main now includes the owner's two-machine admin seats change for the current tiered-admin course (materials edition 1.5): SBD-ADMIN-PC01 is a Windows client virtual machine (generation 2, Secure Boot, virtual TPM, Credential Guard) hosted on SBD-ADMIN-SRV01 (Hyper-V); AdminJumpBox01 stays dedicated and runs no VMs; Tier 1 accounts work on the SBD-ADMIN-SRV01 host and Tier 2 accounts only inside the SBD-ADMIN-PC01 VM; the DISA Windows PAW STIG rules (V-2434xx) are cited. content/configuration-courses.json in the repository is that current version — start from it, and keep its PAW decisions.
- Already drafted with the final numbers (read them for handoffs; don't edit them): newcourses/stig-scap (1.4), newcourses/harden-baseline (1.5), newcourses/linux-repository (1.9), newcourses/logging-pipeline (1.10), newcourses/audit-repository (1.11). Their notes.md files list decisions and cross-course items. newcourses/patch-protect is a partial draft (REPO01 removed) that still needs the four-way split.
- The interactive-guide spec is at /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/guide-content-spec.md.
- Usage limits are tight. Research efficiently: rely on the repository's own content and well-known official documentation; fetch only to verify a new source URL or a fact you're unsure of; keep tool calls lean.

## The new path (use these numbers everywhere)

| New | Course id (slug) | Title (working; you may refine yours) | Was |
|---|---|---|---|
| 1.1 | dc01-dc02 | Promote Primary & Secondary Domain Controller | 1.1 |
| 1.2 | dns-configuration | Configure DNS | 1.2 (DNS part) |
| 1.3 | domain-time | Configure domain time | 1.2 (time lesson, expanded) |
| 1.4 | stig-scap | Measure against the STIG | 1.3 (scan part, expanded) |
| 1.5 | harden-baseline | Harden with Group Policy | 1.3 (OU + GPO part, expanded) |
| 1.6 | two-tier-pki | Configure the two-tier PKI | 1.4 |
| 1.7 | dhcp | Run DHCP on SBD-DHCP01 | 1.5 (DHCP part, expanded) |
| 1.8 | tiered-admin | Tiered administration | 1.5 (admin seats and tier rules) |
| 1.9 | linux-repository | Build the Linux repository on SBD-REPO01 | 1.8 (repo lesson, expanded) |
| 1.10 | logging-pipeline | Collect the record on SBD-SYSLOG01 | 1.6 (collect part, expanded) |
| 1.11 | audit-repository | Protect the record on SBD-AUDIT01 | 1.6 (protect part, expanded) |
| 1.12 | splunk-analysis | Analyze the record in SBD-SPLUNK01 | 1.6 (analyze part, expanded) |
| 1.13 | workstation-fleet | Bring in the fleet | 1.7 |
| 1.14 | patch-protect | Deliver Windows updates from SBD-WSUS01 | 1.8 (design + WSUS, expanded) |
| 1.15 | management-server | Keep the living inventory on SBD-MGMT01 | 1.8 (MGMT lesson, expanded) |
| 1.16 | endpoint-protection | Endpoint protection on SBD-EPO01 — COMING SOON, no material | 1.8 (EPO lesson withdrawn) |
| 1.17 | vulnerability-scanning | Credentialed scanning with SBD-NESSUS01 — COMING SOON, no material | 1.8 (Nessus lesson withdrawn) |
| 1.18 | business-services | Stand up the business services | 1.9 |
| 1.19 | prove-recovery | Prove you can recover | 1.10 |
| 2.1–2.3 | rmf-… | Network Authorization (RMF, Body of Evidence, ATO) | unchanged |

When your text refers to another course, use these FINAL numbers (e.g. "course 1.8 builds AdminJumpBox01", "the course 1.6 PKI", "SBD-DHCP01 from course 1.7", "packages from SBD-REPO01 (course 1.9)", "the collector from course 1.10"). Old (live site) → final: 1.2 → 1.2 (DNS) or 1.3 (time); 1.3 → 1.4 (staging, scanning, checklists, findings) or 1.5 (OUs, GPOs, rescan, exception record, cadence); 1.4 → 1.6; 1.5 → 1.7 (DHCP) or 1.8 (admin seats, tiers); 1.6 → 1.10 / 1.11 / 1.12 by topic; 1.7 → 1.13; 1.8 → 1.9 (REPO01), 1.14 (WSUS, rings), 1.15 (MGMT, inventory), 1.16 (EPO), 1.17 (Nessus); 1.9 → 1.18; 1.10 → 1.19.

SUPERSEDED: earlier versions of this spec used other numbers (REPO01 at 1.8, logging at 1.8–1.11, later courses up to 1.14 or 1.15). Use only the table above. Where a later course would rely on EPO01 or NESSUS01, remember those courses are "coming soon": don't make a lesson depend on them; say what is checked with what exists now (SCC/STIG baselines) and that credentialed vulnerability scanning arrives with course 1.17.

## Lesson allocation (lesson ids are fixed — keep them exactly)

Moved lessons keep their id so saved progress carries over. Their text must be adapted to the new course (lesson numbers, "next", course references, no duplication with sibling courses) — keep what is good, fix what no longer fits, and keep each moved lesson's existing quizzes unless one no longer fits (then replace it, never just reorder answers). New lessons are yours to write.

**1.2 dns-configuration — Configure DNS** (trimmed): `plan`, `zones`, `records`, `verify`, `troubleshoot` (all existing). Remove time from the course: description, outcomes, subtitle, tags, stages, `verify.next` (now points to `troubleshoot`), and the final `troubleshoot.next` → course 1.3. The troubleshoot lesson stays DNS-only.

**1.3 domain-time — Configure domain time** (new course, 5 lessons):
1. `time-plan` (new) — why time matters here (Kerberos's default five-minute skew tolerance, log correlation, certificate validity, replication), the Windows Time hierarchy (forest-root PDC emulator at the top, other DCs from the PDC emulator, members from DCs via NT5DS), the air-gapped reality (no internet time; the reference is a declared, checked clock), the threshold you will hold, and the service-path row (every member to both DCs on UDP 123; find the rule ID in content/inside-the-network.json).
2. `time` (moved from dns-configuration; keep id) — make SBD-DC01 (the PDC emulator) the reliable source with no external peer; hypervisor time sync off for DC VMs; how the reference clock is set and checked.
3. `time-members` (new) — every other system follows the hierarchy: SBD-DC02 and Windows members on the domain hierarchy (NT5DS, defaults), what not to configure by GPO and why, domain-joined Linux servers (chrony or ntpd) pointed at both DCs — later courses build SBD-SPLUNK01 (1.12) and SBD-WEB01 (1.18) this way, and SBD-NESSUS01 (1.17, coming soon) will too — and SBD-REPO01 (course 1.9, not domain-joined) also takes its time from both DCs with chrony; the STIG/GPO courses (1.4–1.5) must leave the time design intact.
4. `time-verify` (new) — prove the chain: w32tm /query /source and /status on DC01, DC02 and a member, w32tm /monitor and /stripchart offsets against the threshold, the Time-Service events to keep, the evidence record.
5. `time-troubleshoot` (new) — find and fix time faults: Kerberos skew symptoms, a member sourcing "Local CMOS Clock" or the hypervisor, a moved PDC emulator role (the new holder must become the reliable source and the old one return to the hierarchy), a restored or reverted VM; resync safely and record the fix.

**1.4 stig-scap — Measure against the STIG** (new course, 5 lessons):
1. `stig-basics` (new) — what DISA STIGs and SRGs are, rule IDs and severity categories (CAT I/II/III), SCAP benchmarks (what a scanner can read) vs manual checks (what a person must answer), CCIs and how they map to NIST SP 800-53 controls, what SCC and STIG Viewer each do, and the honest limits of a scan.
2. `staging` (moved from harden-baseline; keep id) — stage the DISA content across the air gap: SCC, STIG Viewer, the SCAP benchmarks and STIGs for Windows Server and AD, and the DISA GPO package (staged now for course 1.5), hashed on both sides.
3. `baseline` (moved from harden-baseline; keep id) — capture the pre-hardening SCAP baseline of both DCs.
4. `checklists` (new) — create STIG Viewer checklists for both DCs, import the SCC results so automated checks populate, and answer the manual checks with observed evidence (status, finding details, comments).
5. `findings` (new) — turn results into a findings record: counts by severity, each open item classified as fix-by-GPO (course 1.5), documented deviation candidate, or POA&M candidate, CCI → control mapping for the evidence trail, and the handoff course 1.5 consumes.
Convention (both courses 1.4 and 1.5 must follow it): until course 1.8 builds the administration hosts, administration happens at a domain controller's console. Install SCC on both domain controllers and scan each locally; install STIG Viewer on SBD-DC01 for checklist work. Course 1.8 later moves both tools to AdminJumpBox01 and removes them from the controllers — say so where it matters. Keep raw results and checklists under a single evidence folder with hashes (the old course used C:\Evidence\baseline; keep that pattern).

**1.5 harden-baseline — Harden with Group Policy** (5 lessons):
1. `ou-design` (existing; keep id).
2. `gpo-basics` (new) — how Group Policy applies before you trust it: local → site → domain → OU order, link order, inheritance, block inheritance vs Enforced (and why Enforced is not a shortcut), security filtering, WMI filters, loopback (only where needed), refresh and gpupdate, SYSVOL replication of GPO content, the central store, and reading gpresult / RSoP.
3. `apply` (existing; keep id) — import and link the DISA GPOs from the package staged in course 1.4.
4. `rescan` (existing; keep id) — rescan with the same SCC and benchmark versions as the course 1.4 baseline, compare, update the course 1.4 STIG Viewer checklists, classify what remains.
5. `maintain` (existing; keep id) — exception record, cadence, GPO backups and reports, handoff (final `next` → course 1.6).

**1.9 linux-repository — Build the Linux repository on SBD-REPO01** (new course, 5 lessons; consolidates every REPO01 topic from the patching course):
1. `repo-design` (new) — the repository's job: the one approved source of operating-system packages for the domain-joined Linux servers (SBD-SPLUNK01 in course 1.12, SBD-WEB01 in 1.18, SBD-NESSUS01 in 1.17 when it arrives), the one-source rule, which distribution repositories are mirrored and why, GPG signature trust (verify upstream signing keys before anything is published), dated snapshots as the repository's version, its place (VLAN 70, 10.0.70.20, not domain-joined per Inside the Network), administration from VLAN 60 under the tier model, and the register rows (consumers to REPO01 on HTTP 80, rule F19; REPO01's syslog over TLS to the collector, rule F07, enabled when course 1.10 builds the collector).
2. `repo-build` (new) — build and harden SBD-REPO01: the Linux install, static address, time per course 1.3 (check Inside the Network for REPO01's time path), a minimal web server serving only the repository directory, a host firewall allowing only the registered paths, local accounts and SSH administration from VLAN 60 only.
3. `repo` (moved from patch-protect; keep id) — mirror the approved package set on the connected side, hash it, carry it across, verify signatures and hashes, publish a dated snapshot, keep the snapshot catalog.
4. `repo-consumers` (new) — the client configuration every Linux server uses: one source definition pointing at SBD-REPO01, the trusted GPG keys, every external source removed or disabled, and the verification commands. No consumer exists yet in this course — prove it on SBD-REPO01's own package manager or a disposable test VM, and write the configuration that courses 1.12 and 1.18 (and 1.17 later) apply when they build each Linux server.
5. `repo-prove` (new) — keep it current and prove it: the update cadence across the air gap, promoting a new snapshot and rolling back to the previous one, the first SCAP baseline of SBD-REPO01 (the DISA STIG for its distribution), the assessable record (snapshot catalog with hashes, administration record), and the handoff to course 1.10.
(The patching course is now split further; see 1.14–1.17 below. REPO01 material lives only in this course.)

**1.10 logging-pipeline — Collect the record on SBD-SYSLOG01** (5 lessons):
1. `design` (existing; keep id) — still designs the whole collect → protect → analyze pipeline (it is the first of three courses); make clear which course builds which stage.
2. `auditing` (existing; keep id).
3. `collector` (existing; keep id).
4. `collector-health` (new) — keep the collector trustworthy: subscription runtime status (wecutil gr), sources that went silent, Forwarded Events log size and retention behavior, disk capacity, the syslog intake's health, what a collection failure looks like and who is told (AU-5).
5. `collector-prove` (new) — prove collection: a deliberate failed sign-in and a probed unregistered port land on the collector with the right source names and times; first SCAP baseline of SBD-SYSLOG01 and the DC rescan for the audit-policy deltas; handoff to course 1.11. SBD-REPO01 (built in course 1.9) is already running, so enrol it as the first Linux syslog-over-TLS source (TCP 6514, rule F07) in this course.

**1.11 audit-repository — Protect the record on SBD-AUDIT01** (5 lessons):
1. `repository-design` (new) — the repository's job and rules: retention per the course 1.10 design (AU-11), capacity, the single inbound write path from the collector (SMB 3 with encryption, rule F11 in Inside the Network), the audit custodian's separate accounts, no interactive delete rights, build SBD-AUDIT01 (Windows Server, domain-joined) in its place.
2. `protect` (moved from logging-pipeline; keep id) — the archival job, hash catalog, permissions.
3. `integrity` (new) — verify the catalog on a schedule, treat a mismatch as a finding, audit access to the repository itself (who read or tried to change what), review the readers group.
4. `retention` (new) — run retention as a logged process by the custodian, and prove retrieval: restore a past archive, verify its hash, and read it.
5. `repository-prove` (new) — prove the record survives: an administrator's delete attempt is refused and logged, a tampered copy is caught, the first SCAP baseline of SBD-AUDIT01, handoff to course 1.12 (offline copies arrive in course 1.19).

**1.12 splunk-analysis — Analyze the record in SBD-SPLUNK01** (5 lessons):
1. `analysis-plan` (new) — what analysis is for and what it is not (the repository keeps the record; analysis holds a working copy), indexes and retention in the analysis platform, roles (analyst vs admin), console access from VLAN 60 only, the offline install media (hashed, carried across the air gap), the domain-joined Linux host with its time set per course 1.3 and its operating-system packages only from SBD-REPO01 (course 1.9).
2. `ingest` (new) — install the platform and bring in the collector's two streams over the registered forwarder path (TCP 9997 with TLS, rule F10): forwarder on SBD-SYSLOG01, receiving port, indexes and source types, and checks that counts and timestamps match the collector.
3. `analyze` (moved from logging-pipeline; keep id) — the working searches (adapt: installation and ingestion now live in `ingest`).
4. `alerts` (new) — own the alerts: thresholds, a named responder, a written first response, testing an alert, tuning noise, and the review cadence (AU-6).
5. `prove` (moved from logging-pipeline; keep id) — trace one event end to end across all three systems (source → collector → repository archive → analysis), the first baseline of SBD-SPLUNK01 (Linux: the DISA STIG for its distribution), and the handoff to course 1.13 (the fleet).


**1.7 dhcp — Run DHCP on SBD-DHCP01** (new course, 5 lessons): 1. `dhcp-design` (new) — scopes per VLAN that needs leases (VLAN 80 workstations; the temporary test client), exclusions and reservations, lease length, options (both DCs for DNS, the core's VLAN gateway), authorization in Active Directory, and the register rows (the core's DHCP relay forwards VLAN 80 requests to SBD-DHCP01 — later courses never configure the router, so treat the relay as already in place and verify it, don't build it; find the rule ID in content/inside-the-network.json). 2. `dhcp` (moved from tiered-admin; keep id) — build SBD-DHCP01 and its scope. 3. `dhcp-dns` (new) — secure dynamic DNS registration with dedicated credentials, name protection, and why DnsUpdateProxy is a trap. 4. `dhcp-audit` (new) — DHCP audit logging, lease review, what unauthorized DHCP servers do in a domain, and backing up the DHCP database. 5. `dhcp-prove` (new) — a VLAN 80 test client gets the right lease and registers securely, the first SCAP baseline of SBD-DHCP01, and the handoff to course 1.8. NPS / 802.1X on SBD-DHCP01 stays in course 1.13.
**1.8 tiered-admin — Tiered administration** (5 lessons): `design`, `admin-hosts`, `logon-restrictions`, `prove`, `scan` (existing ids; `dhcp` moves out). Remove DHCP from it (refer to course 1.7). Add the move of SCC and STIG Viewer from the domain controllers to AdminJumpBox01 (the course 1.4 convention) where it fits, and make sure the handoff points to course 1.9.
**1.14 patch-protect — Deliver Windows updates from SBD-WSUS01** (5 lessons): `design` (existing; refocus on update rings and the Windows update rule — the software rule's REPO01, EPO01 and NESSUS01 parts are handled by their own courses), `wsus` (existing), plus three new lessons, e.g. `wsus-offline` (the air-gapped export/import path for update metadata and content), `wsus-targeting` (computer groups, client-side targeting by GPO, deadlines, domain controllers in their own ring), `wsus-prove` (compliance reports, ring progression, the first SCAP baseline of SBD-WSUS01, handoff to course 1.15). Be accurate about WSUS's status (deprecated by Microsoft in 2024: still included and supported, no new features) and about offline servicing.
**1.15 management-server — Keep the living inventory on SBD-MGMT01** (5 lessons): `mgmt` (moved from patch-protect; keep id) plus four new lessons (e.g. `mgmt-design`, `mgmt-build`, `inventory-sources`, `mgmt-prove`): what the management tools server holds, build and harden it (VLAN 70, administered from VLAN 60), feed the inventory from what already exists (AD computer objects, DHCP leases, WSUS reports, REPO01 snapshots, scan results), and reconcile recorded vs discovered (CM-8).
**1.16 endpoint-protection** and **1.17 vulnerability-scanning** — COMING SOON: a catalog entry only (`comingSoon: true`, number, categoryOrder, title, subtitle, a one-sentence description, systems, tags, platform, artLabels, networkLabel). No lessons, guide, workbook or downloads.

## Facts to keep straight

- Read AGENTS.md (the dated sections from October 8 onward win), EDITORIAL_STYLE.md, content/inside-the-network.json (systems, addresses, VLANs, services, rule IDs), and the existing lessons in content/configuration-courses.json for your course and its neighbours.
- The network is air-gapped. Everything from outside crosses on approved removable media, hashed on both sides. No internet time, DNS, updates or licensing calls.
- Time: SBD-TIME01 does not exist. SBD-DC01, the PDC emulator, is the domain's time source.
- No Windows release numbers anywhere: say "Windows Server" and "Windows" (or "Windows client"), never "Windows Server 2025" or "Windows 11"; where a default belongs to one release only, say "the newest Windows Server release".
- Later courses never build or configure the core router; they may read its deny log and add rows to the service-path register.
- Splunk and Nessus are single instances on domain-joined Linux. Keep hardware vendor agnostic. Don't add systems that aren't in content/inside-the-network.json.
- Every technical statement must be correct. Commands must be real (PowerShell cmdlets, w32tm, wecutil, auditpol, icacls, Splunk CLI, chronyc…) and safe to run in a lab. Use only real, official sources (Microsoft Learn, DISA/Cyber Exchange, NIST, Splunk docs); prefer source URLs already used in content/configuration-courses.json; check any new URL with WebFetch and drop it if it doesn't resolve. NIST control IDs and titles must be exact (SP 800-53 Rev. 5).
- Voice: plain, direct, welcoming teaching; sentence case; the same density and length as the existing lessons (summary 2–3 sentences; 4 steps, at most 6; each step 1–4 sentences; 3 objectives; 3 recap lines; 3 quiz questions with 3 answers each; minutes 15–40). Vary which answer is correct across questions. Write commands so the evidence they produce is what the lesson asks the learner to keep.

## What to write (four files in your folder)

1. `course.json` — the course's entry for content/configuration-courses.json: `{ "id", "prerequisites": [..], "labNote": "..", "sources": [{"id","title","url"}..], "lessons": [ { "id", "title", "minutes", "summary", "steps": [..], "command": "line1\nline2", "check", "evidence", "sources": [source ids], "objectives": [..], "quizzes": [{"question","answers":[3],"correct":0-2,"explanation"}], "recap": [..], "next", "model"?: {"href","label","text"} } ] }`. Look at existing entries for the exact shape and tone. `model` links into Inside the Network are optional; only use href formats that already appear in the file (`/inside-the-network#system=<id>`, `#process=<id>&step=<n>`, `#facility=backup`) and only ids/steps that exist (see public/inside-network-model/flow-policy.js and content/inside-the-network.json).
2. `catalog.json` — the course's entry for content/videos.json `courses[]`, without `afterEpisode`, `categoryId`, `kind`, `moduleCount`, `lessonCount` or `training` (filled in later): `categoryOrder` (= the number after the dot), `number`, `estimatedHours` (total minutes ÷ 60, one decimal), `title`, `subtitle`, `description`, `tags`, `platform`, `systems`, `artLabels` (exactly 3 short tile labels), `outcomes` (3–4), `stages` (one per lesson: `title` = the lesson title, `detail` = the lesson summary), `outcomeSummary`, `networkLabel` (e.g. "VLAN 10 / DOMAIN CONTROLLERS"). For an existing course, start from its current entry.
3. `<course id>.json` — the course's interactive-guide content, following /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/guide-content-spec.md exactly (read it fully; the 3D scene, step titles, mistakes, control cards, checklists). Flows may also use "core" as an endpoint for the core router (drawn as the switch in the middle). For an existing course, start from content/course-guides/<id>.json and update it.
4. `notes.md` — short: sources you added (and that you checked them), anything in neighbouring courses that now conflicts with your course and needs a change there (quote it), and anything you were unsure about.

Validate with `node /tmp/claude-0/-home-claude/a8e52fba-0352-51f7-ac48-f5732f822fe0/scratchpad/validate-draft.mjs <course id>` and fix every error. Then reread your lessons once more for technical accuracy and for consistency with the sibling courses described above.

Reply briefly: the files written, each lesson's title and minutes, and the notes.md highlights (cross-course conflicts first).
