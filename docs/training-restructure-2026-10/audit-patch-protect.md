# Course 1.14 patch-protect: audit (14 October 2026)

The validator passes: 5 lessons, 180 minutes, 3.0 hours. Lesson ids, counts and quiz keys are unchanged. The draft was already written to the final path, so the fixes are few. The script is `audit-scripts/fix_patch.py`, and the pre-audit copy is in `audit-backup/patch-protect-pre`.

I checked the commands and claims against the WSUS sources the draft cites: the five TLS virtual roots, the 8530/8531 split, option 7, the client-side targeting policy names, `wsusutil export`/`import` (local administrator, copy content first, trusted source), `Get-WsusUpdate`/`Approve-WsusUpdate`/`Get-WsusComputer`/`Invoke-WsusServerCleanup` parameters, the September 2024 deprecation status, and the NIST titles (CM-3, SC-8, SI-7, SI-2, SI-2(2)). They hold. The rings match F06, and the pilots (SBD-PC01–03) and the "other 47" match course 1.13, which now retires SBD-TEST80.

## Fixed

- **Rule 1 (coming soon at most once).** The course named 1.16/1.17 five times, and none of them said "coming soon":
  - `labNote` keeps the one mention: "endpoint protection and credentialed scanning are coming soon, as courses 1.16 and 1.17, and nothing here depends on them".
  - `design.steps[0]`: "protection and scanner content get their rules with courses 1.16 and 1.17" → "are outside this course".
  - `wsus.steps[3]`: "until course 1.16" is dropped from the Defender definitions option.
  - `wsus-prove.steps[3]`: "an independent, credentialed check… arrives with course 1.17" → the spot checks are the independent view.
  - `wsus-prove` quiz 3: the marked answer and the explanation no longer promise credentialed scanning; it is still the correct answer.
  - `wsus-prove.recap[2]`: "scanning comes later" is gone.
  - Guide `wsus-prove` control body: "until credentialed scanning arrives with course 1.17" is gone.
- **Rule 2 / first-wave time item.** `wsus.steps[0]`, `command`, `check`: SBD-WSUS01's hypervisor time sync is turned off, and `w32tm /query /source` must name a domain controller.
- **Stale hedge.** `wsus.steps[0]` said "link that GPO to the Servers OU if no course has yet". Course 1.10 links its enrolling GPO to the Servers OU, filtered to SBD Event Sources, when it enrols SBD-DHCP01, so the step now says so. Lesson 2's `steps[5]` already adds SBD-WSUS01 to SBD Event Sources and widens F17's scope.

## Judgment calls for the owner

These are carried forward from notes.md and still open:

1. **WSUS and Tier 0.** WSUS can't limit an administrator to some computer groups. So Tier 0's control of Ring 4 is a written procedure, checked by `AdministratorName`, and not a boundary. By Microsoft's rule, a server that patches the DCs is itself Tier 0. Options: (a) keep the procedure plus the residual-risk entry (current); (b) treat SBD-WSUS01 as Tier 0 (Tier 0 Servers OU, administered only from AdminJumpBox01); (c) a second, Tier 0-only WSUS for Ring 4, which would be a new system. I recommend (a) for the lab and recording (b) as the target.
2. **SBD-AUDIT01's ring.** It takes Ring 3 updates approved by ordinary Tier 1 operators. Options: keep it there, or give the Audit Servers OU the Ring 4 treatment (option 7, installed by the custodian). I recommend the custodian install, because it keeps the separation 1.11 builds.
3. **WID kept.** WID is deprecated too, so it's recorded as a decision with a review date. SQL Server would be a new product to carry across. I recommend keeping WID.
4. **Rule 4 timing.** SBD-WSUS01 is enrolled in SBD Event Sources in lesson 2 (build), not the closing lesson, so its first imports are already logged. I read rule 4 as "by the closing lesson".
5. **Certificate request for SBD-WSUS01.** `Get-Certificate` into the machine store runs in the computer's context, so SBD Server Authentication must grant Enroll to SBD-WSUS01 (or a server group), not only to "the server administrators" as 1.6 words it. This also affects 1.10, 1.12 and 1.18. Please confirm the 1.6 permission model; see For other courses.

## For other courses

- **management-server (1.15)**: "course 1.10's event-forwarding GPO (linked to the Servers OU in course 1.14)" → "linked to the Servers OU in course 1.10". 1.14 no longer links it.
- **two-tier-pki (1.6)** `first-templates.steps[2]`: "enrollment permission for the server administrators". A machine-store request made on the server (as 1.14 does with `Get-Certificate -CertStoreLocation Cert:\LocalMachine\My`) is checked against the computer account. Grant Enroll to the requesting servers too, or say that the request is made in the administrator's context and imported. Please verify before changing.
- **business-services (1.18)**: the notes.md items still apply (no NESSUS01 scan, prerequisites 1.1–1.15, VLAN 40 servers in Ring 3 via the Servers OU).
- **Repository integration**: notes.md items 7–8 (courses.js mapping, F06 note, saved-progress migration for `mgmt`, hidden `epo`/`nessus`) still apply.

## Owner decisions applied (14 October 2026)
- Decision 3: SBD-WSUS01 stays Tier 1; lesson 1 step 3 says so, lesson 2 step 6 writes the Ring 4 procedure and records the residual risk with "move SBD-WSUS01 to Tier 0" as the target; lesson 2 check, evidence, recap and guide checklist updated.
- Decision 4: SBD-AUDIT01 gets its own WSUS group, Ring 3 - Audit archive (Ring 3 timing, option 7, no deadline, GPO at the Audit Servers OU in place of the Ring 3 link there); its custodian starts the install. Lesson 1 step 2/check, lesson 4 summary/steps 1–4/command/check/evidence/recap, lesson 5 step 1/check/evidence, prerequisite 1, catalog stage 4 and guide (design/wsus/targeting/prove captions and checklists, targeting step title 2) updated.
- Decisions 2, 12, 13, 14: nothing to change (Invoke-WsusServerCleanup's 30-day obsolete-computer rule is the cmdlet's behaviour, not a retention value).
