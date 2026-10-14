# Course 1.8 tiered-admin — notes

Five lessons, 165 minutes (2.8 h): `design` 20, `admin-hosts` 45 (was 50), `logon-restrictions` 45, `prove` 30, `scan` 25 (was 20). The validator passes. I started from the repository version, materials edition 1.5, and kept every PAW STIG decision. The `dhcp` lesson moved to course 1.7.

## What changed

- **Validator limits.** The validator allows at most 6 steps and 4 objectives. `admin-hosts` (9 steps, 5 objectives) and `logon-restrictions` (7 steps) were merged rather than cut, so they keep the same decisions and V-IDs. Both stay at 45 minutes, above the 40-minute guideline, because they carry the owner's edition 1.5 content.
- **Lesson numbers.** References to lessons 3–6 are now 2–5.
- **Course numbers.** Courses 1.3 and 1.4 are now 1.5 and 1.6 (OU and STIG GPOs, the exception record, PKI templates). The handoff now goes to 1.9 (SBD-REPO01) and the logging courses 1.10–1.12. SBD-WSUS01 joins SBD Tier 0 Console Hosts in course 1.14. SBD-EPO01 joins "when course 1.16 arrives", so no lesson depends on it.
- **Groups.** `design` creates the role groups in the Admin OU: SBD Tier 0 Admins, SBD Tier 2 Admins and SBD Audit Custodians. SBD Tier 1 Admins comes from 1.7. Lessons now name them.
- **`admin-hosts`.**
  - Admin Servers gets 1.5's member-server computer policy, the user policy and the loopback (Merge) GPO.
  - Admin Workstations gets the Windows client computer and user policies, which 1.5 left unlinked, plus the same loopback GPO.
  - SBD-DHCP01's administration moves to SBD-ADMIN-SRV01 over A02 (RDP and WinRM).
  - RSAT-DHCP comes off SBD-DC01.
- **`logon-restrictions`.**
  - The Tier 0 Servers OU also gets the user policy and the loopback GPO.
  - New step 3: a GPO linked only to the Servers OU puts SBD Tier 1 Admins in local Administrators in place of Domain Admins (Group Policy Preferences). It runs after the Tier 0 servers have left the OU. It stays separate from the tier logon GPO so other OUs can take the denies without the grant.
  - The test client from 1.7 joins the domain with a Tier 2 account. SBD Tier 2 Admins gets Create Computer objects on the Workstations OU. WinRM on the test client accepts only 10.0.60.30.
  - An OU created later for member servers, such as 1.11's Audit Servers, gets the Servers OU's tier logon GPO.
- **`scan`.**
  - SCC and STIG Viewer move from the controllers to AdminJumpBox01, with C:\Evidence, the 1.4/1.5/1.7 manifests and the exception record. Each set is hash-checked before the controllers' copies are retired.
  - Each tier assesses from its own seat. SBD-ADMIN-SRV01 gets a copy of the tools and 1.7's C:\Evidence\dhcp, and scans member servers locally in Tier 1 sessions, because A02 carries no SMB or RPC for SCC's remote modes. SBD-ADMIN-PC01 gets a copy for endpoints.
  - The DCs, SBD-DHCP01, SBD-SUBCA01 and SBD-PKI-MGMT01 are rescanned.
  - SBD-DHCP01's STIG Viewer checklist is completed on SBD-ADMIN-SRV01.
- **Quizzes.** Unchanged quizzes are byte-identical to the repo. Two answer texts were updated: "Course 1.3 linked them…" becomes 1.5, and the hand-off quiz now says "course 1.9". The scan rescan answer now lists all the rescanned systems. One new quiz is appended to `scan`.
- **Guide fix.** The step title "Create SBD-ADMIN-PC01 as a shielded VM" was wrong: the lesson builds a Secure Boot and vTPM VM, not a Hyper-V shielded VM. It now says "Secure Boot, vTPM VM".

## Cross-course conflicts (need changes elsewhere)

1. **audit-repository (1.11).**
   - It says "In a Tier 0 session from AdminJumpBox01, create the two groups (custodians under the Admin OU, auditors under the Groups OU)". Course 1.8 now creates **SBD Audit Custodians**, because SBD-ADMIN-SRV01's seat GPO admits it, so 1.11 should reuse that group and create only SBD Auditors.
   - 1.11 also has "SBD Auditors read the record in remote sessions from SBD-ADMIN-SRV01". 1.8's seat GPO lets only SBD Tier 1 Admins and SBD Audit Custodians sign in there, so 1.11 must add SBD Auditors to that seat GPO's Allow log on locally (and record the STIG value change).
   - 1.11 should link only the tier logon (deny) GPOs to the Audit Servers OU, never 1.8's "SBD Tier 1 Admins as local Administrators" GPO.
   - This resolves its open SCC question: SBD-ADMIN-SRV01 holds the Tier 1 copy of the 1.4 media, so "the installer arrives over PowerShell remoting (Copy-Item -ToSession)" works from the custodian's session.
2. **logging-pipeline (1.10).** The guide says "AdminJumpBox01, SBD-ADMIN-SRV01, and SBD-ADMIN-PC01 from course 1.7". It should say course 1.8.
3. **patch-protect (withdrawn-lessons.json).** It says "add SBD-NESSUS01 to the course 1.7 workstation firewall policy" (now 1.13), and its ePO lesson adds SBD-EPO01 to SBD Tier 0 Console Hosts. That fits 1.8's "when course 1.16 arrives".
4. **workstation-fleet (1.13), repo text.**
   - `prepare` says "course 1.8 adds SBD-NESSUS01 for credentialed scans". That is now course 1.17, coming soon.
   - Its "dedicated domain-join account delegated only the create-computer-objects right on the Workstations OU" now sits beside 1.8's same delegation to SBD Tier 2 Admins. Either reuse it or keep both and record them.
   - 1.13 should give SBD Tier 2 Admins local Administrators on the Workstations OU by GPO; 1.8 sets it only on the test client, by hand.
5. **Any course that adds exception-record rows** (1.10, 1.11, 1.14 and later). The record (C:\Evidence\exception-record.csv) now lives on AdminJumpBox01 with its owner. Tier 1 and Tier 2 work sends rows to that owner rather than writing the file itself.
6. **Outside course content.**
   - `public/inside-network-model/courses.js`: `admin:{title:'1.5 · Addressing and tiered administration',detail:'DHCP, admin seats & where privilege may sign in'…}` should become 1.8 · Tiered administration.
   - `tests/video-catalog.test.mjs` has the lesson counts `[6, 10, 6, 6, 6, 7, 6, 5, 6]`.
   - The edition 1.5 workbook (18 pages) needs re-syncing.
   - AGENTS.md says "The lessons now take 190 minutes"; they now take 165.
   - Progress ID `training:tiered-admin:dhcp` moves to `training:dhcp:dhcp`.

## Sources

- **Added**: `domain-join` (Microsoft Learn, confirmed by search), plus `disa-scap` and `disa-tools` with 1.4's URLs.
- **Removed**: `dhcp`.
- **Kept**: everything else, including `whatsnew`, whose title keeps Microsoft's own release wording.

## Unsure (check in a lab)

- **SCC remote scans of the DCs.** These run from AdminJumpBox01. F03 covers SMB and RPC from domain members, but the SCC manual's remote modes also list WMI and firewall exceptions. The DC host firewall may need SCC's exceptions, scoped to AdminJumpBox01.
- **Test client remote management.** `Set-NetFirewallRule -DisplayGroup 'Windows Remote Management' -RemoteAddress 10.0.60.30` uses the English display group name.
- **Delegation syntax.** I used `dsacls … /G 'SBD\SBD Tier 2 Admins:CC;computer'`, the standard form. The creator-owner rights from the computer class cover the join.
