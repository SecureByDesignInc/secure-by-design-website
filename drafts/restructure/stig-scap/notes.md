# Course 1.4 stig-scap — notes

Five lessons, 140 minutes (2.3 h): `stig-basics` 25 (new), `staging` 20 (moved), `baseline` 25 (moved), `checklists` 40 (new), `findings` 30 (new). The validator passes.

## Handoff to course 1.5 (harden-baseline). Use these names exactly.

All on SBD-DC01 unless noted. Administration happens at each DC's VM console until course 1.7.

| Artifact | Location | Made in |
|---|---|---|
| DISA content: SCC installer, STIG Viewer 3, Windows Server STIG SCAP benchmark, Windows Server / AD Domain / AD Forest STIGs, CCI list, **DISA GPO package** | `C:\Staging\DISA` (on both DCs) | staging |
| Transfer record: `connected-side-hashes.csv`, `lab-side-hashes.csv`, custody note | `C:\Evidence\baseline\transfer` | staging |
| Tools | SCC on **both** DCs; STIG Viewer on **SBD-DC01** only | staging |
| Raw SCC sessions, copied unmodified (XCCDF results `*XCCDF-Results*.xml` inside) | `C:\Evidence\baseline\SBD-DC01`, `C:\Evidence\baseline\SBD-DC02` | baseline |
| Hash lists for those sessions | `C:\Evidence\baseline\SBD-DC01-hashes.csv`, `...\SBD-DC02-hashes.csv` | baseline |
| STIG Viewer checklists (CKLB, JSON) | `C:\Evidence\baseline\checklists\SBD-DC01.cklb`, `SBD-DC02.cklb` (Windows Server STIG each), `sbd.test.cklb` (AD Domain + AD Forest STIGs) | checklists |
| Checklist hashes | `C:\Evidence\baseline\checklists-hashes.csv` | checklists |
| Findings record (columns: Target, GroupId, StigId, Severity, CCIs, Title, Classification, Owner, TargetDate) | `C:\Evidence\baseline\findings\findings-record.csv` | findings |
| Handoff note: SCC version, benchmark release and **profile**, STIG releases, GPO package release, paths | `C:\Evidence\baseline\findings\handoff.txt` | findings |
| Manifest sealing the whole baseline folder | `C:\Evidence\baseline-manifest.csv` (its own hash recorded) | findings |

Classification values in the findings record are exactly: **fix by GPO**, **deviation candidate**, **POA&M candidate**. POA&M candidates also need an owner and a target date.

What 1.5 must do, as 1.4 states it: check the manifest; rescan with the **same SCC version, benchmark release and profile** into `C:\Evidence\hardened`; update **copies** of the three checklists in `C:\Evidence\hardened` and leave the baseline copies as hashed; close or record every item in the findings record. Deviation candidates are decided in 1.5's exception record. Example given in 1.4: a STIG rule expecting the PDC emulator to sync to an authorized external time source conflicts with the course 1.3 design.

## Cross-course conflicts (need changes elsewhere)

- **harden-baseline (1.5)**, `rescan.steps[2]`: "Create the course checklists in STIG Viewer and bring in the scan results so automated passes are populated." 1.4 now creates them, so 1.5 should **update copies** of 1.4's checklists. The same lesson's command uses `C:\Evidence\hardened`. That matches the path I gave 1.5.
- **harden-baseline (1.5)**, `ou-design.next`: "Lesson 2 brings the DISA tooling across the air gap the same controlled way course 1.4 will later carry certificate requests." Staging is now in 1.4, and the PKI course is now 1.6.
- **harden-baseline (1.5)**, `apply`: no conflict, but it should import from `C:\Staging\DISA` (verified in 1.4) and name the release in `handoff.txt`.
- **tiered-admin (1.7)** has no lesson that moves SCC and STIG Viewer to AdminJumpBox01 and removes them from the DCs. The spec's convention needs it. I suggest `admin-hosts` step 3 (RSAT and tooling) or `scan` step 1. Also carry `C:\Evidence` to the jump host.
- **tiered-admin (1.7)**, `scan.steps[0]`: "with the standard benchmark and tool versions". That is fine, but it should point at `handoff.txt` (1.4) and the 1.5 cadence for which versions are "standard".
- **tiered-admin (1.7)**: several "course 1.3" references (STIG GPOs, exception record, OU structure) need renumbering to 1.5. The tooling references need renumbering to 1.4.
- **two-tier-pki (1.6)**, `validate.steps[4]`: "with the same benchmark and tool versions as always". That is fine as is. The prerequisites say "Complete courses 1.1–1.3 (identity, DNS and time, and the hardened baseline)", which should become 1.1–1.5.
- **workstation-fleet (1.12)**: "the course 1.3 package" and "The GPO package staged in course 1.3 carried the endpoint STIGs too" should now say 1.4 (staged) and 1.5 (linked). The fleet's Windows client SCAP benchmark was not staged in 1.4: I only staged Windows Server and AD content. The fleet course should bring its own benchmark across, or 1.4's staging should be widened.
- **patch-protect (1.13)** and **prove-recovery (1.15)**: "the course 1.3 transfer procedure" and "the course 1.3 media procedure" now refer to 1.4 `staging`. "the course 1.3 cadence" and "course 1.3 rescan" refer to 1.5.
- **dns-configuration / domain-time**: the old `time` step says "course 1.3's hardening GPOs must leave it intact … that course's deviation record". The deviation is now flagged in 1.4 and decided in 1.5's exception record.

## Sources

Kept from the old course (already in the repository): `disa-tools`, `disa-gpo`, `ncp`, `whatsnew`, `controls` (the NIST SP 800-53 Rev. 5 URL used by tiered-admin and the generator). New sources, all checked:
- `disa-scap` https://www.cyber.mil/stigs/SCAP/ lists SCC 5.15 and the SCAP 1.3 benchmarks, including the Windows Server benchmark. It must stay uppercase: lowercase `/stigs/scap` and `/stigs/cci` redirect to a DoD sign-in.
- `disa-library` https://www.cyber.mil/stigs/downloads is the STIG document library, with the CCI category.
- `filehash` https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash

How I checked: WebFetch permission timed out, and the shell proxy blocks cyber.mil and csrc.nist.gov (403). I checked the cyber.mil and Microsoft pages through Firecrawl and Microsoft Learn instead. The csrc.nist.gov URLs were already in the repository and I did not re-check them.

Facts checked against DISA's STIG Viewer 3.x User Guide V1R8 (August 2026) and the SCC 5.15 readme and release notes:
- The four statuses, Finding Details and Comments.
- "Import XCCDF or CMRS Results", which reports matched, revision-mismatched and unmatched rules.
- A severity override requires a reason.
- CKLB is JSON. Its rules carry `status` (`open` / `not_a_finding` / `not_applicable` / `not_reviewed`), `severity` (`high` / `medium` / `low`), `group_id`, `rule_version` (the STIG ID), `ccis`, `finding_details` and `comments`.
- SCC saves to `<data dir>\Sessions\<date-time>\Results\...`, with a per-user default of `%USERPROFILE%\SCC`.
- DISA content has MAC and confidentiality profiles.

## Unsure

- **SCC results folder**: the default is per user (`%USERPROFILE%\SCC\Sessions`). Learners who set a custom data directory must adapt the `baseline` command. The command says so.
- **AD STIGs as a separate `sbd.test` checklist**: this is my design choice, since the AD STIGs are manual-only and domain-wide. 1.5 should reuse the same three checklist names.
- **CCI-000366 → CM-6** is the commonly cited mapping. I could not open DISA's CCI list (behind DoD sign-in or a blocked download), so I kept that as the only CCI example.
- **The CAT I/II/III definitions** come from DISA's published category definitions, which I saw quoted by Tenable. The STIG Viewer guide confirmed only the high/medium/low labels.
