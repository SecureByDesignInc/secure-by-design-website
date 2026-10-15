# Course 1.4 stig-scap — audit (14 October 2026)

The validator passes: 5 lessons, 140 minutes, 2.3 hours. Lesson ids, lesson counts and the existing quizzes are unchanged.

## Fixed

- `staging.steps[0]`: the download list now includes the Windows client STIG and its SCAP benchmark, alongside the Windows Server, AD Domain and AD Forest content and the GPO package (decisions rule 5). The step says which courses use the client content: course 1.8 for the Tier 2 seat and course 1.13 for the fleet. The unverified claim "(DISA keeps the two within a few weeks of each other)" is gone. The step now asks for the GPO package from the same quarterly release as the STIGs.
- `staging.steps[2]`: SBD-DC02 now gets the same full media set as SBD-DC01. The lesson's `Compare-Object` compares the whole hash list, so if DC02 received only SCC and the benchmark, the documented "no output means every hash matches" result could never happen there.
- `staging.steps[3]`, `summary`, `objectives[0]`, `recap[0]`, `recap[2]`, `stig-basics.next`: "benchmark" became "benchmarks". Only the Windows Server benchmark is installed into SCC on the controllers. The GPO package and the Windows client content wait, hashed, in `C:\Staging\DISA`.
- `findings.steps[1]`: the POA&M example now names the real requirement: every domain controller must have a PKI server certificate. This is a medium-severity rule in DISA's Windows Server STIG, and its check is a certificate for the DC in the computer's Personal store. The example also says the course 1.6 PKI issues that certificate. Course 1.6 now publishes SBD Domain Controller Authentication, both DCs autoenroll it, and its validate lesson closes this item. That resolves the known inconsistency.
- `catalog.stages[1].detail`: set to the new staging summary.
- Guide `staging`: the network caption and checklist items 2 and 3 now include the Windows client content.

## Verified (the "Unsure" items in notes.md)

- **CCI-000366 → CM-6.** This is the standard DISA mapping (CCI-000366, "implements the security configuration settings", to CM-6 b). Kept.
- **CAT I–III definitions.** These match DISA's severity category code definitions: direct and immediate loss, potential for loss, and degraded protection. Kept.
- **Windows Server STIG rule on DC PKI certificates.** Confirmed for the newest release (WN25-DC-000280, CAT II). The course describes the requirement without a rule ID.
- **SCC results folder** (`%USERPROFILE%\SCC\Sessions`). Not re-verifiable, because cyber.mil is blocked. The command already says to adapt the path. Kept.
- **Scripts.** I ran the `checklists` and `findings` commands (CKLB `ConvertFrom-Json`, `Group-Object status`, and the open-rule export with empty Classification, Owner and TargetDate columns) in PowerShell 7.4 against a synthetic CKLB. They work as written. A parse check of every command found no syntax errors.
- **`whatsnew` source.** Microsoft Learn confirms the claims it supports: outbound SMB signing required, and LDAP signing (sealing) by default on new AD deployments.

## Judgment calls for the owner

1. **Which Windows client release the later scans use.** The client content staged now will be one or more quarters old by courses 1.8 and 1.13. Options:
   - (a) Take the first baselines with the 1.4 release, then adopt newer releases through course 1.5's rule: scan once with the new content before changing any policy.
   - (b) Have 1.13 stage fresh content of its own.

   I recommend (a). It keeps one comparable measuring stick and matches the cadence 1.5 already teaches.
2. **AD STIGs in a separate `sbd.test` checklist.** This was the original writer's design choice. Both AD STIGs are manual and domain-wide, and courses 1.5 and 1.6 now reuse the three checklist names. I recommend keeping it.

## For other courses

- **workstation-fleet (1.13)**
  - Change "The GPO package staged in course 1.3 carried the endpoint STIGs too" (baseline quiz explanation) to: "Course 1.4 staged the Windows client STIG and its SCAP benchmark beside the server content; the GPO package carries the client GPOs, which course 1.5 imported."
  - Change "from the course 1.3 package" (prerequisites, lesson 1) to "imported in course 1.5 from the package course 1.4 staged".
- **splunk-analysis (1.12)**, `prove`: "Classify every open item as course 1.4 taught — fix now, deviation candidate, or POA&M candidate". Course 1.4's values are fix by GPO, deviation candidate and POA&M candidate. For a Linux host, call "fix now" an explicit adaptation, for example "fix now (no GPO applies to Linux)".
- **tiered-admin (1.8)**, `scan`: no change is needed. The Windows client benchmark it uses inside SBD-ADMIN-PC01 is now really on the course 1.4 media set.
