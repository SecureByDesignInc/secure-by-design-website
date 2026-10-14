# Course 1.3 domain-time: audit

Validator passes (5 lessons, 150 minutes, 2.5 h). Lesson ids, lesson counts and quiz keys are unchanged.

## What was verified against Microsoft Learn (the notes.md "unsure" items)

- **Event 12 with AnnounceFlags 5: confirmed.** The Microsoft Engage Center page says the forest-root PDC emulator writes event 12 whenever it is set to sync with the domain hierarchy (NT5DS). The AnnounceFlags value doesn't change that. "Expect warning 12" stays, and the page is now a cited source.
- **`/syncfromflags:NO`: not documented.** Microsoft Learn's w32tm table lists only MANUAL and DOMHIER. The lessons never use NO, which is correct.
- **The lesson's own configuration matches Microsoft's.** The documented approach is `/reliable:yes`, which gives AnnounceFlags 5, on NT5DS. The w32tm /resync article confirms "PDC: AnnounceFlags = 5; member DCs: 10".
- **Defaults: confirmed.** LocalClockDispersion is 10. The MaxPos/MaxNegPhaseCorrection limits are 48 h on domain controllers and 0xFFFFFFFF ("always correct") on domain members. AnnounceFlags defaults to 10.
- **Net Logon signing: confirmed.** How the Windows Time service works says the time "has been authenticated with the session key from the Net Logon service". That supports the time-plan quiz.
- **Hyper-V guidance: confirmed.** "Virtualizing domain controllers with Hyper-V" recommends turning off host time sync for DC VMs.
- **Output strings.**
  - "Local CMOS Clock" (unsynchronized, or a reliable server on its own clock) and "VM IC Time Synchronization Provider" are documented (Azure time-sync page).
  - "Free-running System Clock", `LOCL` and the `*** PDC ***` marker are real w32tm output but aren't on Microsoft Learn. They are kept, and listed here so a lab run can confirm them.
- **chrony: confirmed.** The `maxdistance` default of 3 s is confirmed on chrony-project.org.

## Fixed

- **sources**
  - Added `event-12` (Microsoft · Configure the root PDC with an authoritative time source; fetched). It is cited by `time` and `time-verify`, which describe event 12 and had no source for it.
  - Added `chrony-conf` (chrony.conf(5)) and `ntp` (RFC 5905). They are cited by `time-members` for the 3-second maxdistance default and NTP's 16-second MAXDISP. decisions.md rule 9 now allows both origins.
- **SBD-REPO01's time path** (decisions.md rule 2; 1.9's `repo-design` adds REPO01 to F09 rather than writing a separate row):
  - `time-plan` step 5: now reads "F09 does not list it yet; course 1.9 adds it", replacing "course 1.9 adds its row".
  - `time-members` step 6: now reads "leaves it out until course 1.9 adds it".
  - `time-members` quiz 3: the question is now "Why must course 1.9 add SBD-REPO01 to rule F09?". The explanation is aligned. The answers and key are unchanged.
- **`time-members` step 6:** now says to apply the chrony file "to every Linux server before its first domain join or package update" (decisions.md rule 2). SBD-NESSUS01 is mentioned once, as "course 1.17, coming soon" (rule 1).
- **`time-members` step 3:** names SBD-ADMIN-PC01, the Tier 2 VM on SBD-ADMIN-SRV01, among the VMs whose hypervisor time sync is turned off (rule 2).
- **`time` quiz 5 explanation:** "the register permits UDP 123 from every VLAN" is now "rule F09 permits UDP 123 from every domain member to both domain controllers". F09 is defined by domain membership, not by VLAN.
- **`time-troubleshoot` step 4:** "It returns with the time it had when saved" is now "It can come back with the clock it had when it was saved". This holds for saved states and standard checkpoints, not every restore.
- **`time-troubleshoot` command:** the nltest comment now says "must name the current PDC emulator". nltest returns the reliable time server, and that has to be the PDC emulator.
- **Guide `time.network`:** "no member path is shown yet" is now "…in this lesson". Lesson 1 already shows the member paths.

## Judgment calls for the owner

1. **The PDC emulator on NT5DS logs warning 12 by design.**
   - Option A, the current design: keep NT5DS with `/reliable:yes` (KB 816042's documented method) and treat event 12 as expected. Course 1.12 must not alert on it.
   - Option B: set NtpClient `Type` to `NoSync` on SBD-DC01. How the Windows Time service works documents "no synchronization", and it silences the warning, but it adds a setting that has to be reversed every time the PDC emulator role moves.
   - Recommendation: A.
2. **The reference clock.** Microsoft (Engage Center and the event 142 article) warns that a virtual DC with host sync off and no external source runs on its local clock, which drifts. The design accepts this deliberately (decisions.md rule 2) and relies on the manual reference check. The daily interval and the 1 s / 2 s thresholds are sample values. Confirm them, or set your own, before publishing.

## For other courses

- **tiered-admin (1.8).** The draft never turns off Hyper-V time sync for SBD-ADMIN-PC01 (rule 2). Add to the VM build: `Disable-VMIntegrationService -VMName SBD-ADMIN-PC01 -Name 'Time Synchronization'`, then check that `w32tm /query /source` inside the VM names a domain controller.
- **logging-pipeline (1.10).** The draft collects no time events. Rule 4 requires Security 4616 plus the System-log Microsoft-Windows-Time-Service events. The set to collect is the one `time-verify` step 4 names: 12, 35, 36, 37, 129 and 142. Event 12 is expected on SBD-DC01. Once 1.10 carries these, the conditional in splunk-analysis `analyze` step 4 ("if SBD-ForwardedSecurity doesn't carry them yet, add a query…") can go.
- **linux-repository (1.9) `repo-build` step 2.** The draft says: "If chronyc sources marks both controllers unusable … Set maxdistance 16 and record why." It should become standard practice: "Apply the course 1.3 chrony file (both controllers, maxdistance 16, no pool/server/sourcedir/allow lines) before the first package update." Also turn off the REPO01 VM's hypervisor time sync.
- **business-services (1.18).**
  - The draft never applies the course 1.3 chrony file to SBD-WEB01. Add it before the realm join (rule 2), with `chronyc sources -v` and `chronyc tracking` as checks.
  - "the course 1.3 Groups OU" should be course 1.5.
- **prove-recovery (1.19).**
  - After restoring a domain controller, check its clock against the reference before members follow it (1.3 `time-troubleshoot` step 4). The draft has no clock check.
  - "the course 1.3 Backup-GPO set" should be course 1.5.
  - "the course 1.3 media procedure" should be course 1.4.
  - The prerequisite "courses 1.1–1.9" should be 1.1–1.18.
- **two-tier-pki (1.6).**
  - The prerequisite "Complete courses 1.1–1.3 (identity, DNS and time, and the hardened baseline)" should be 1.1–1.5.
  - "Admin OU from course 1.3" appears in `lessons[7]` steps[1] and quiz 2, answer 2. It should be course 1.5.
  - catalog.json `number` is "1.4" and should be "1.6".
  - Add the ceremony clock check for SBD-ROOTCA01 (`time-members` step 6).
- **workstation-fleet (1.13).** It still uses old numbers:
  - "container redirects from course 1.3" and "The course 1.3 redirect" (also in the guide's pilot mistake) should be course 1.5.
  - "the course 1.3 design" in quiz explanations should be course 1.5.
  - "from the course 1.3 package" and "staged in course 1.3" should be course 1.4.
- **Repository integration.**
  - In `security.js`, add `repo` to F09's sources, and change the comment "The Linux package repository uses DNS only" to "uses DNS and time".
  - `tests/video-catalog.test.mjs` must allow https://chrony-project.org/ and https://www.rfc-editor.org/ (decisions.md rule 9).
  - The other integration items in notes.md (courses.js, training-progress, the migration for `time`, workbook) still apply.
