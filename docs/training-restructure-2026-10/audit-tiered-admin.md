# Course 1.8 tiered-admin: audit (14 October 2026)

Five lessons, 165 minutes (2.8 h). Lesson ids, counts and minutes are unchanged, and the validator passes.

The main-branch PAW decisions (rule 7) are kept unchanged:
- the STIG IDs: V-243445, -54, -47, -57, -50, -51, -56, -62, -63, -52, -55 and -53;
- the `*S-1-5-83-0` entry;
- enhanced session mode, the Guest Service Interface and Key-Value Pair Exchange off, with no shared folders;
- one console user at a time;
- the Tier 1 account in Hyper-V Administrators, with no `Grant-VMConnectAccess`;
- the SBD PAW Maintenance T0/T1/T2 groups.

## Fixed

- **admin-hosts step 4, command, check, evidence** (rule 2): SBD-ADMIN-PC01's Time Synchronization integration service is turned off. The command checks it alongside the Guest Service Interface and KVP, and inside the guest runs `w32tm /query /source`, which must name a domain controller and never the VM IC provider. The "basic integration services that remain" wording is still accurate (heartbeat, shutdown, VSS).
- **prerequisites[1]**: where a seat is itself a virtual machine in the learner's lab, its hypervisor time synchronization is turned off too.
- **prerequisites[3], labNote**: these now say the tools move to AdminJumpBox01, with a Tier 1 copy on SBD-ADMIN-SRV01 (rule 5).
- **logon-restrictions steps 2 and 4**: the Audit Servers sentence moved to step 4, after both deny GPOs exist. It now says both deny GPOs (the tier logon GPO and the network-logon deny GPO) link to course 1.11's Audit Servers OU before a server joins, and never step 3's administrators GPO. That matches 1.11's "course 1.8's server-tier logon GPOs", plural. Step 3 now names "course 1.11's Audit Servers OU".
- **logon-restrictions step 4** (rule 1): the ePO dependency is removed. Tier 0 manages the DC update ring on SBD-WSUS01 once course 1.14 adds it to SBD Tier 0 Console Hosts. SBD-EPO01 appears once, as "when course 1.16, coming soon, arrives". The step stays at four sentences.
- **logon-restrictions quiz 5**: rewritten from "on SBD-WSUS01 and SBD-EPO01" to SBD-WSUS01 only (rule 1). The correct answer is still the first; the wrong option "Those two servers are Tier 0 systems" became "SBD-WSUS01 sits in the Tier 0 Servers OU". The explanation is unchanged.
- **logon-restrictions step 6**: "alarmed in a later logging course" became "alarmed once course 1.12 builds the alerts". 1.12's `alerts` lesson implements it.
- **scan step 1, step 2, check, objective 2, summary, catalog stage, guide checklist and network caption** (rule 5): SCC for SBD-ADMIN-PC01 is installed in course 1.13, so the draft's "the SBD-ADMIN-PC01 virtual machine gets a copy for endpoints" and its Windows client baseline inside the VM are gone. First baselines now cover the two physical seats. PC01's baseline waits for its SCC copy in 1.13, and until then its record is lesson 2's gpresult and host and guest settings.
- **Guide**: the SBD-ADMIN-SRV01 node now says it holds the Tier 1 copy of the assessment tools from lesson 5.

## Checked, no change needed

- SBD Audit Custodians is created in `design`, in the Admin OU (rule 6), and admitted on SBD-ADMIN-SRV01.
- SCC, STIG Viewer and `C:\Evidence` (with the exception record) move to AdminJumpBox01, with the hash checks against the 1.4, 1.5 and 1.7 manifests.
- The handoff and `next` point at course 1.9.
- The course 1.5, 1.7 and 1.14 references.
- The in-course lesson numbers.
- The event 4625 / 0xC000015B pairing.
- The model links: `process=drill&step=6` and `process=peer-rdp` exist.

## Judgment calls for the owner

1. **SBD-ADMIN-PC01 goes unbaselined from course 1.8 to course 1.13.** Rule 5 puts PC01's SCC copy in 1.13. A Tier 2 scan can't come from another seat, because Tier 0 and Tier 1 accounts are denied inside the VM.
   - Options: keep rule 5 as it is, so 1.13 baselines PC01 first and then the fleet; or amend rule 5 so 1.8 installs PC01's copy and baselines the seat when it's built, and 1.13 reuses it.
   - **Recommendation**: amend rule 5. Privileged seats are meant to be scanned first. This needs course 1.4 to stage the Windows client benchmark, which rule 5 already says it does.
2. **SBD Audit Custodians is on no deny list outside SBD-ADMIN-SRV01.** The Workstations OU and SBD-ADMIN-PC01 deny SBD Tier 0 and Tier 1 Admins only. Custodian accounts, which control the audit repository, could therefore sign in on Tier 2 machines, where Allow log on locally includes Users.
   - **Recommendation**: add SBD Audit Custodians beside SBD Tier 1 Admins on the Workstations OU's denies and inside SBD-ADMIN-PC01. This is a change to the main-branch tier design, so I left it to you.
3. **How AdminJumpBox01 scans the Tier 0 servers.** Scanning the DCs remotely relies on F03's SMB/RPC, and SCC may also need its WMI and firewall prerequisites on the DCs, scoped to 10.0.60.10. SBD-SUBCA01 and SBD-PKI-MGMT01 have no SMB/RPC path from VLAN 60 under A01.
   - **Recommendation**: scan those two locally in Tier 0 sessions, copying SCC over WinRM, which mirrors the Tier 1 pattern. Confirm SCC's remote-scan prerequisites in a lab before relying on them for the DCs.

## For other courses

- **audit-repository (1.11)**:
  - Reuse course 1.8's SBD Audit Custodians and create only SBD Auditors. It currently reads "create the two groups (custodians under the Admin OU, auditors under the Groups OU)".
  - Add SBD Auditors to SBD-ADMIN-SRV01's seat GPO (Allow log on locally) and record the STIG value change, because "SBD Auditors read the record in remote sessions from SBD-ADMIN-SRV01" is otherwise refused.
  - Link only 1.8's two deny GPOs to the Audit Servers OU.
- **workstation-fleet (1.13)** (rule 5):
  - Install SBD-ADMIN-PC01's own SCC copy (and STIG Viewer if Tier 2 keeps checklists) from course 1.4's media, baseline PC01 itself with the Windows client benchmark, then scan the fleet sample from PC01.
  - Give SBD Tier 2 Admins local Administrators on the Workstations OU by GPO; 1.8 sets it by hand only on the test client.
  - Its dedicated join account duplicates 1.8's Create Computer objects delegation to SBD Tier 2 Admins on the Workstations OU. Reuse one, or record both.
  - `prepare`: "course 1.8 adds SBD-NESSUS01 for credentialed scans" should become course 1.17, coming soon, with no dependency.
- **stig-scap (1.4) `staging` step 1**: it stages no Windows client benchmark or STIG, although rule 5 says 1.4 stages the Windows client content. Course 1.13, and PC01's baseline, depend on it.
- **logging-pipeline (1.10) guide**: "AdminJumpBox01, SBD-ADMIN-SRV01, and SBD-ADMIN-PC01 from course 1.7" should be course 1.8.
- **Any course that adds exception-record rows** (1.10 onward): the record lives on AdminJumpBox01 with its owner. Tier 1 and Tier 2 work sends rows to the owner rather than editing the file.
- **Outside course content**:
  - `public/inside-network-model/courses.js`: `admin` should be "1.8 · Tiered administration".
  - AGENTS.md's "The lessons now take 190 minutes" is now 165.
  - The progress ID `training:tiered-admin:dhcp` moves to `training:dhcp:dhcp`.
  - The edition 1.5 workbook needs re-syncing.
