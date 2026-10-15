# Course 1.13 workstation-fleet: audit (14 October 2026)

The validator passes: 7 lessons, 200 minutes, 3.3 hours. Lesson ids, lesson count and every quiz are kept; quiz answers and explanations were corrected where they were wrong, never reordered. The draft had only been renumbered, so it still carried the old path (1.3–1.8) throughout. The scripts are in `audit-scripts/fix_fleet.py` and `fix_fleet_guide.py`, and the pre-audit copy is in `audit-backup/workstation-fleet-pre`.

## Fixed

**Course numbers and handoffs**
- `catalog`: number 1.7 → 1.13, categoryOrder 7 → 13, estimatedHours 3.2 → 3.3 (scan went 20 → 30 minutes). Stages are regenerated from the lesson titles and summaries. The description, tags and outcomes now include 802.1X, which lessons 5–6 teach.
- `prerequisites[0]`: "courses 1.4–1.6: working PKI services, DHCP with its relay, the tiered admin plane, and the logging pipeline" → courses 1.6–1.12, naming what each built. DHCP is now "SBD-DHCP01 (course 1.7), whose relay course 1.7 verified".
- `prerequisites[2]`: "the container redirects from course 1.3" → the course 1.5 redirect. "From the course 1.3 package" → "imported in course 1.5 from the package course 1.4 staged and still unlinked". It now also asks for course 1.4's media set, which PC01's SCC copy needs.
- `prepare.steps[1]`: "course 1.5 DHCP scope" → course 1.7. `steps[2]`: "the course 1.3 redirect" → 1.5. Quiz 2 explanation: "course 1.3 design" → 1.5.
- `pilot` quiz 1 explanation: "the 1.3 redirect, the 1.3 GPO package" → the course 1.5 redirect, plus the client policies 1.5 imported from 1.4's package. Quiz 3: "the pipeline built in 1.6" → courses 1.10–1.12.
- `laps` quiz 2 explanation: "course 1.5 already made" the tiering decision → course 1.8.
- `certificates.summary`, `steps[0]`, quiz 1: "Course 1.4 proved autoenrollment on a pilot group" and "the course 1.4 change process" → course 1.6. Both DCs and the pilot, SBD-PKI-MGMT01, are named, and the change process is 1.6's lesson 8.
- `nac.steps[3]` and `scale.steps[5]`: "the course 1.6 collector / forwarding subscription" → course 1.10.
- `scale` quiz 3 explanation: "Course 1.6's investment" → courses 1.10–1.12.
- `scan` (summary, objectives, steps, quiz 3, recap, next), `scale.next`, and the guide's scan step title, control and checklist: everything handed to "course 1.8 (patching, endpoint protection, vulnerability coverage, management tooling)" now goes to course 1.14 for updates, with SBD-PC01–03 as Ring 1 and the other 47 as Ring 2, and to course 1.15 for the inventory. `next` now leads into course 1.14.
- Guide: SBD-ADMIN-PC01 "built in course 1.5" → 1.8. SBD-SYSLOG01 "the course 1.6 event collector" → 1.10. The pilot mistake "course 1.3 redirect" → 1.5. The certificates mistake "course 1.4 change process" → 1.6.

**Decisions rule 1 (no dependency on SBD-EPO01 or SBD-NESSUS01)**
- `prepare.steps[4]`: "course 1.8 adds SBD-NESSUS01 for credentialed scans" is removed. Quiz 4's wrong answer "Nothing until course 1.8" is now "SBD-DHCP01, which refuses leases…", and the explanation says why that's wrong.
- `scan`: the handoff no longer names endpoint protection or vulnerability scanning as the next course's work.

**First-wave binding items for 1.13 and other courses' audit items**
- `scan.steps[0]` (new step; the guide got a matching step title): SBD-ADMIN-PC01 gets its own SCC copy from course 1.4's media, hash-checked, and its first baseline before the fleet's (decisions rule 5, tiered-admin audit).
- `scan.steps[1]`: the sample is scanned from SBD-ADMIN-PC01. SCC is carried over PowerShell remoting and run locally in a Tier 2 session, then removed. Rule A03 carries RDP and WinRM, not the SMB and RPC ports a remote SCC scan needs; this is the same pattern 1.8 and 1.11 use.
- `certificates.steps[0–1]`, `check`, `evidence`, guide: autoenrollment widens to a computer group (SBD Fleet Computers in this sample), not "the Workstations OU's computers". The GPO is course 1.6's SBD Certificate Autoenrollment at the domain root, reused, and the restart for the group membership is shown. `scale.steps[0]` adds each wave to the group.
- `scan` quiz 1 explanation: "The GPO package staged in course 1.3 carried the endpoint STIGs" → the stig-scap audit's wording (1.4 staged the client STIG and benchmark; the package carries the GPOs that 1.5 imported).
- `prepare.steps[2]`: SBD Tier 2 Admins become the PCs' local Administrators by a GPO on the Workstations OU. The dedicated join account is kept and recorded beside 1.8's Create Computer objects delegation to SBD Tier 2 Admins (tiered-admin audit). It also mentions 1.8's tier logon GPO, which is already linked there.
- `pilot.steps[0–1]`, `command`, `check`: the PCs' hypervisor time sync is off where they are VMs, and `w32tm /query /source` must name a DC (rule 2). The DNS check now says the A and PTR records belong to svc-dhcp-dns via SBD-DHCP01 (dhcp audit), with no PC-ownership check.

**Technical accuracy**
- `prepare.steps[3]`: only "the STIG policies" were linked. Now the client computer policy, the user policy and course 1.5's loopback (Merge) GPO are linked to the Workstations OU, as 1.8 did for Admin Workstations. User settings linked to an OU that holds only computers do nothing without loopback.
- `prepare.steps[0]` and `laps.steps[2]`: the LAPS GPO managed "the built-in administrator". The Windows client STIG disables that account, so the image now carries a named local administrator account, which the LAPS policy names; Windows LAPS doesn't create accounts.
- `laps.steps[1]`, `check`, guide: "Tier 2 admin group only… and nobody else" was wrong, because Domain Admins can read LAPS passwords by default (Microsoft Learn). The group is named SBD Tier 2 Admins and the cmdlets are named.
- `laps.steps[2]`: password encryption was added, with SBD Tier 2 Admins as the decryptor. Microsoft recommends encryption, and without that setting only Domain Admins can decrypt.
- `laps.command`: `Find-LapsADExtendedRights` was added for the rights evidence. The schema step now says it runs from AdminJumpBox01 and needs Schema Admins.
- `nac.steps[3]`, `command`, `check`, `evidence`, guide: Audit Network Policy Server is turned on in a separate GPO. Under the STIG's advanced audit policy that subcategory is off, so the 6272/6273 evidence the lesson relies on would never be written. The step also checks that SBD-ForwardedSecurity carries 6272 and 6273.
- `nac.steps[0]`: NPS gets an SBD Server Authentication certificate (course 1.6). The role is installed in a Tier 1 session, and registering it in AD (RAS and IAS Servers) is a Tier 0 action from AdminJumpBox01.
- `nac.steps[2]`: VLAN 90 is created on the access switch, and the core gets no VLAN 90 interface (rule 3).
- `prepare.steps[4]`, guide node: the firewall GPO allowed SMB 445 from SBD-ADMIN-PC01, but rule A03 doesn't register SMB, so the router would drop it. It now allows RDP and WinRM only, matching A03.
- `pilot.steps[3]`: names event 4741 for computer-account creation and checks that the subscription carries it.
- `certificates.steps[2]`, `command`: the certificate is now exported before `certutil -verify -urlfetch`, since the old command verified a file it never created. The URL cache is cleared, as in 1.6. "The register's HTTP row" → F18, and the enrollment row is F23.
- `certificates.check`: "the widened template version" is gone, because a permission change doesn't create a new template version. Quiz 2: "five courses in one command" was inaccurate; it is now courses 1.2 and 1.6.
- `scale.steps[1]`, `check`, `command`: course 1.7's temporary test client, SBD-TEST80, would have made the Workstations OU hold 51 objects and broken the 50-count check. It is now retired, with a record. Inside the Network has no such system, and course 1.14's "other 47" ring count depends on it.
- `scale.steps[5]`: "extend the subscription to the Workstations OU" → 1.10's mechanism: SBD Fleet Computers goes into SBD Event Sources, the enrolling GPO is linked to the Workstations OU, the collector's WinRM scope is widened to VLAN 80 (F17), and the PCs restart.
- `scale.command`: the per-machine context was added (SBD-SYSLOG01 for ForwardedEvents), plus the fleet-group count.

**Style and sources**
- `prepare.command`: `C:\Staging\Win11-Reference.vhdx` → `Windows-client-reference.vhdx` (rule 8). The command now shows the delegation it says to keep.
- Sources: dropped "What's new in Windows Server 2025" (a release number, and it didn't support the LAPS steps). Added `laps-ad` (Microsoft Learn, "Get started with Windows LAPS and Windows Server Active Directory"), checked this session; it supports the Domain Admins default, the custom-account rule, encryption and the cmdlets. Added `disa-scap` (www.cyber.mil/stigs/SCAP/, as used in 1.8) to the scan lesson. Dropped `autoenroll` from `pilot`, where nothing used it.
- `labNote`: says which seat does Tier 0, Tier 1 and Tier 2 work, and where each keeps its evidence.

## Judgment calls for the owner

1. **Join account vs. SBD Tier 2 Admins.** Course 1.8 already delegated Create Computer objects on the Workstations OU to SBD Tier 2 Admins. The draft keeps a dedicated join account with only that right, and records both. Options: (a) keep both (current); (b) join with Tier 2 accounts and drop the join account; (c) keep only the join account and remove 1.8's delegation after its test client. I recommend (a). The rollout credential then can't administer PCs, and the Tier 2 delegation stays for one-off rebuilds.
2. **SBD-TEST80 retirement.** I retired it in lesson 6, because 1.7 calls it temporary and Inside the Network has no such system. If you'd rather keep a standing Tier 2 test machine, it needs a place in Inside the Network and in 1.14's ring table, and the counts change (51).
3. **NPS network policy group.** The policy still admits machine certificates "from the Domain Computers group". Admitting only SBD Fleet Computers would be tighter now that the group exists. I recommend switching, but it's a policy choice, so I left it.
4. **Media path into SBD-ADMIN-PC01.** 1.8 closed every host–guest channel. The lesson brings SCC in as a read-only ISO attached to the VM's virtual DVD drive by a Tier 1 console user. Confirm this is acceptable, or name another approved path.
5. **Remote SCC scanning from SBD-ADMIN-PC01.** The fleet sample is scanned locally over WinRM (A03 as registered). Remote SCC scans would need SMB 445 and RPC from 10.0.60.30 to VLAN 80, which means a register change. I recommend keeping the local pattern.
6. **Rule 4 timing.** Fleet enrolment in SBD Event Sources is in lesson 6 (scale), not the closing lesson 7. That keeps the rollout watched and the sample checks on the same data. I read rule 4 as "by the closing lesson"; move it if you mean it literally.
7. **Built-in Administrator and LAPS.** I made LAPS manage a named account carried in the image, because the client STIG disables the built-in Administrator. The newest Windows client release can instead create and manage its own account (automatic account management). Either works; the lesson mentions only the named account.

## For other courses

- **logging-pipeline (1.10)**: courses 1.13 (`pilot`, `nac`) need events 4741 (computer account created) and 6272/6273 (NPS) in SBD-ForwardedSecurity. 1.13 now adds any that are missing, but listing them in 1.10's designed event set would remove the conditional. 6272/6273 also need Audit Network Policy Server, which 1.13 turns on for SBD-DHCP01.
- **management-server (1.15)**: `mgmt-build` (or wherever it says) "course 1.10's event-forwarding GPO (linked to the Servers OU in course 1.14)" should say course 1.10. 1.10 links its enrolling GPO to the Servers OU, filtered to SBD Event Sources. 1.15 reads course 1.13's fleet inventory; it lives in `C:\Evidence\workstation-fleet` on SBD-ADMIN-PC01, with `C:\Evidence\workstation-fleet-manifest.csv`.
- **two-tier-pki (1.6)** (optional): `first-templates.steps[1]` grants autoenrollment to "a pilot computer group only — SBD-PKI-MGMT01 for now" without naming the group. Naming it (for example SBD PKI Pilot) would let 1.13's change record refer to it exactly.
- **tiered-admin (1.8)**: no change needed. 1.13 now installs PC01's SCC copy, adds the Tier 2 local Administrators GPO, and retires SBD-TEST80 in lesson 6. 1.8's "test client" references stay correct for its own course.

## Owner decisions applied (14 October 2026)
- Decision 6: lesson 7 no longer installs SCC on SBD-ADMIN-PC01; it reuses course 1.8's copy (installer re-checked in C:\Staging\DISA) and scans only the fleet sample. Old step 1 removed (lesson 7 now 4 steps; guide step titles, checklist, PC node, prerequisites 1 and 3, summary, objective, command, check, evidence, recap and catalog stage 7 updated).
- Decision 5: lesson 1 names SBD Audit Custodians among the tier logon GPO's denies and requires every workstation GPO (STIG, local Administrators, firewall, DNS, later course 1.10's enrolling GPO in lesson 6) to link below course 1.8's tier logon GPO (link order 1); command now lists link order; check, evidence, recap and guide updated.
- Decision 8: lesson 5's network policy explicitly admits Domain Computers (servers included on 802.1X ports), not narrowed to SBD Fleet Computers; check and guide checklist updated.
- Decision 9: lesson 1 step 5 adds the SBD Workstation DNS GPO (DNS Client > Dynamic update, Disabled) with the recorded reason; new quiz; lesson 2 step 2/command (RegistrationEnabled = 0)/check; guide step title, network captions, DC node, flow label; sources dns-client-policy and dns-dynamic-update added.
- Decisions 2, 12, 13, 14: nothing to change.
