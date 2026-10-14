# Course 1.3 domain-time: notes

Five lessons, 150 minutes (2.5 h): `time-plan` 25 (new), `time` 30 (moved from dns-configuration, id and its five quizzes kept unchanged), `time-members` 35 (new), `time-verify` 30 (new), `time-troubleshoot` 30 (new). The files are built by `tools/build_time_courses.py`, which reads the repository's current content.

## Path-wide decision: chrony `maxdistance 16` on every Linux server

**What I verified.** The 1.9 notes are right.
- When SBD-DC01 serves its own clock, it advertises a root dispersion equal to `LocalClockDispersion`. The default is 10 seconds (Microsoft Learn, W32Time registry reference).
- Its followers pass that dispersion on, at about 10–11 seconds (Microsoft Q&A 1497296; Citrix CTX475390, which cites Red Hat bug 1525833 and solution 3425701).
- chrony rejects any source whose root distance is above `maxdistance`. The default is 3 seconds (chrony.conf(5), checked by the 1.9 writer).
- So without a fix, `chronyc sources` marks both controllers `^?`.

**Choice.** Every Linux server sets `maxdistance 16` in chrony. SBD-DC01 keeps the default `LocalClockDispersion` of 10. The reasons:
1. SBD-DC02 adds its own dispersion to SBD-DC01's. If SBD-DC01 advertised a lowered value, SBD-DC02 would sit near or above chrony's 3-second limit. The Linux servers could then quietly lose their second source.
2. SBD-DC01 doesn't claim an accuracy that a clock checked by hand can't promise. W32Time stays exactly as Microsoft documents a reliable source (`/reliable:yes`), so there is no extra setting to carry when the PDC emulator role moves.
3. It is the fix the vendors publish.
4. 16 seconds is NTP's largest defined dispersion (MAXDISP), so the setting admits the controllers without admitting an unsynchronized source.

ntpd's equivalent is `tos maxdist 16`.

**The file every Linux server uses** (`time-members` step 4):
- `server SBD-DC01.sbd.test iburst`
- `server SBD-DC02.sbd.test iburst`
- `maxdistance 16`
- No `pool`, other `server`, `sourcedir` or `allow` lines.
- Checks: `chronyc sources -v`, `chronyc ntpdata` (shows `Authenticated: No`, because W32Time time isn't signed for chrony) and `chronyc tracking`.

## Cross-course items (quote, then the change needed)

1. **linux-repository (1.9) `repo-build` step 2.** It says: "If chronyc sources marks both controllers unusable, the usual cause is root distance … Set maxdistance 16 and record why." That is the same setting, but written as a conditional fix. Make it standard: "Apply the course 1.3 chrony file (both controllers, maxdistance 16, no pool/server/sourcedir/allow lines)."
   - REPO01's VM should also have hypervisor time sync turned off (`time-members` step 3).
   - Its `repo-design` step 4 already adds SBD-REPO01 to the F09 time row, which matches `time-members` step 6.
2. **tiered-admin (1.8), SBD-ADMIN-PC01.** Current design: "Enhanced session mode, the Guest Service Interface and Key-Value Pair Exchange are off … The remaining integration services … still let Hyper-V administrators manage the guest." That leaves Hyper-V time synchronization on. A Windows guest then usually reports `VM IC Time Synchronization Provider`, which `time-members` and `time-troubleshoot` treat as off the hierarchy. Add Time Synchronization to the services turned off: `Disable-VMIntegrationService -VMName SBD-ADMIN-PC01 -Name 'Time Synchronization'`. Then check that `w32tm /query /source` names a controller.
3. **logging-pipeline `analyze` (repository; moves to splunk-analysis 1.12).**
   - Its quiz answer says: "Drift breaks Kerberos quietly — course 1.2 set up the clock, this search watches it". Change "course 1.2" to "course 1.3".
   - Its "search three: time-service events and offsets" has nothing to search. The 1.10 draft's subscription carries only "the designed Security event IDs".
   - Course 1.10 should add Security 4616 and the System-log Microsoft-Windows-Time-Service events 36, 129 and 142, with 12, 35 and 37 for context (`time-verify` step 4).
   - Event 12 is expected on the PDC emulator, so it shouldn't trigger an alert.
4. **SBD-SPLUNK01 (1.12), SBD-WEB01 (1.18) and SBD-NESSUS01 (1.17, later).** Each build applies the 1.3 chrony file, turns off the VM's hypervisor time sync, and checks with `chronyc sources -v` and `chronyc tracking`. The repository's logging-pipeline prerequisite reads "with its time service (chrony or ntpd) pointed at both domain controllers". Change it to cite the course 1.3 file.
5. **Every later course that builds a VM.** Covers SYSLOG01, AUDIT01, DHCP01, the PKI servers, WSUS01 and MGMT01. Add a build check that `w32tm /query /source` names a controller, which also proves hypervisor time sync is off. The audit-repository draft already says "time from the domain hierarchy (course 1.3)".
6. **harden-baseline (1.5) `apply`.**
   - It already checks `w32tm /query /source`, which is consistent.
   - Suggested addition: `w32tm /query /configuration | Select-String '\(Policy\)'` on both controllers, with no output expected. This proves the DISA GPOs left Windows Time alone, as `time-members` step 2 asks.
   - The `maintain` worked exception (PDC emulator without an external source) and the stig-scap `findings` deviation candidate match `time-members` step 2.
7. **two-tier-pki (1.6).**
   - Its prerequisite "Complete courses 1.1–1.3 (identity, DNS and time, and the hardened baseline)" should become 1.1–1.5.
   - SBD-ROOTCA01 is never on the network. `time-members` step 6 says to set its clock against the approved reference before each signing ceremony, so the `sign` lesson should include that check, because certificate and CRL dates come from that clock.
8. **prove-recovery (1.19).** After restoring or reverting a controller, check its clock (`time-troubleshoot` step 4). Check SBD-DC01 against the reference before members follow it.
9. **Repository integration (outside course content):**
   - `public/inside-network-model/security.js`, rule F09: add `repo` to its sources (the 1.9 notes say the same).
   - `public/inside-network-model/courses.js`: change `dns:{title:'1.2 · Configure DNS and time', detail:'Service discovery, name resolution & the domain time hierarchy',…}` to "1.2 · Configure DNS". Add `time:{title:'1.3 · Configure domain time', detail:'The Windows Time hierarchy, the PDC emulator & chrony', href:'/training/domain-time'}`, and add `'time'` to the dc1 and dc2 mappings.
   - `content/training-progress.json`: rename `training:dns-configuration:time` to `training:domain-time:time`, and add the four new lessons.
   - Add a drizzle migration that carries saved progress and learning activity for that lesson, as `0012_course_restructure.sql` did.
   - `content/training-resources.json`: the "Configure DNS and time · …" titles need updating, and domain-time needs its own guide, ZIP, checklist and workbook entries.
   - `content/videos.json`: the category description "identity, DNS and time, a hardened baseline, …" needs updating.
   - The DNS workbook loses its time pages. Domain-time needs a workbook and cover.

## Sources added (all checked this session)

- How the Windows Time service works: fetched. Covers the hierarchy, that reliable servers are trusted without upstream sync, and NoSync for the root.
- KB 816042, configure an authoritative time server: fetched. Covers the hierarchy and AnnounceFlags 5 vs 0xA.
- Virtualizing domain controllers with Hyper-V: fetched. Recommends disabling host time sync for DC VMs.
- Kerberos authentication troubleshooting guidance: fetched. Covers the five-minute limit, KRB_AP_ERR_SKEW and `w32tm /resync /rediscover`.
- w32tm /resync "no time data" (KB 929276): fetched. Gives the event 129 text.
- Event 142 article: fetched.
- Red Hat RHEL 9 "Configuring time synchronization": fetched. Covers chronyc sources, tracking, makestep and ntpdata.
- Reused: Windows Time service, tools and settings (re-read for LocalClockDispersion, AnnounceFlags, the 48-hour DC phase limits and GPO precedence), Manage Hyper-V Integration Services, the DISA STIG library and NIST SP 800-53.
- Not citable: chrony.conf(5) and the Citrix KB are outside the origins `tests/video-catalog.test.mjs` allows, so neither is a lesson source. The 1.9 draft cites chrony-project.org and several other disallowed origins, and that test will fail on them.

## Unsure (worth a lab check)

- **Event 12 on SBD-DC01.** I kept SBD-DC01 on NT5DS with `/reliable:yes`, because `/syncfromflags:NO` isn't in Microsoft Learn's w32tm table and 1.5 expects "Local CMOS Clock". Microsoft documents event 12 for a forest-root PDC on NT5DS, and reliable servers are trusted without upstream sync. Confirm that event 12 still appears with AnnounceFlags 5.
- **Event IDs.** 12, 36, 129 and 142 are confirmed in Microsoft docs. 35 and 37 are confirmed in the event 142 article.
- **Event 4771 (failure code 0x25)** only appears where Kerberos failure auditing is on. The lesson says so.
- **Output strings from memory.** `Free-running System Clock`, the `*** PDC ***` marker in `w32tm /monitor`, and `ReferenceId: LOCL` are from my knowledge, not from a live system.
- **SBD-DC02 during a long SBD-DC01 outage.** It eventually stops advertising as a time source (event 142). I didn't claim more about its dispersion growth.
- **Sample decisions.** The thresholds (1 s for members, 2 s for SBD-DC01 against the reference, checked daily) are sample values. The firewall check matches by UDP 123 port filter, not by the rule's display name. The Hyper-V command is labelled as an example, because the hosts are vendor-neutral.
