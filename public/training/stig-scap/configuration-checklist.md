# Measure against the STIG — configuration checklist

Secure By Design · Edition 1.0 · 14 October 2026

This course measures before anything changes. It stages the Defense Information Systems Agency (DISA) Security Content Automation Protocol (SCAP) tools and content, scans SBD-DC01 and SBD-DC02 against the Security Technical Implementation Guide (STIG) with the SCAP Compliance Checker (SCC), answers the rest in STIG Viewer checklists, and writes the findings record course 1.5 hardens against. Until course 1.8 builds AdminJumpBox01, SCC runs on both controllers and STIG Viewer on SBD-DC01; course 1.8 moves both tools to AdminJumpBox01 and removes them from the controllers. Versions, paths and session folders below are examples — record yours, because course 1.5's rescan must reuse them.

## Before you start

- [ ] Complete courses 1.1–1.3: both domain controllers healthy and replicating, DNS verified, and the domain time design in place with SBD-DC01, the PDC emulator, as the time source.
- [ ] Work at each domain controller's VM console with an authorized Domain Admin account: until course 1.8 builds AdminJumpBox01, that is where administration happens.
- [ ] Have an approved connected system and the removable-media procedure for bringing downloaded DISA content into the lab.

## Understand STIGs, SCAP and checklists

- [ ] Start with the two layers the Defense Information Systems Agency (DISA) publishes. A Security Requirements Guide (SRG) states requirements for a class of technology, such as general-purpose operating systems; a STIG turns them into checks and fixes for one product, so every STIG rule traces back to an SRG requirement.
- [ ] Read a rule's identity and weight. Each rule has a Group ID (V-…), a Rule ID (SV-…r…_rule, where the r number is its revision), a STIG ID naming the product and check, and a severity category: CAT I (high) when exploiting the weakness directly and immediately causes loss of confidentiality, integrity or availability, CAT II (medium) when it has the potential to, and CAT III (low) when it degrades the protections against that loss.
- [ ] Separate what a scanner can read from what a person must answer. A Security Content Automation Protocol (SCAP) benchmark is the automated part of a STIG — rules written in XCCDF with OVAL checks — which the SCAP Compliance Checker (SCC) evaluates on a host. Every other rule is a manual check, and STIG Viewer is where you build a checklist for each assessed asset, import SCC's results and record the human answers.
- [ ] Trace rules to controls and keep a scan's limits honest. Each rule cites Control Correlation Identifiers (CCIs), DISA's single, actionable requirement statements, each mapped to a NIST SP 800-53 control, so a result can serve as control evidence. A scan shows settings on one host, at one moment, against one release: it can err or miss, it says nothing about procedures, and a pass is not an authorization.
- [ ] Record what applies. These controllers take the Windows Server STIG (its domain controller rules included) plus the Active Directory Domain and Active Directory Forest STIGs. They also run DNS and Windows Defender Firewall, which have STIGs of their own — list those with an owner and a review date instead of dropping them silently.

**Commands:**

```
Get-CimInstance Win32_OperatingSystem | Select-Object CSName, Caption, Version
(Get-CimInstance Win32_ComputerSystem).DomainRole   # 5 = primary domain controller (holds the PDC emulator role), 4 = backup domain controller
Get-WindowsFeature AD-Domain-Services, DNS | Select-Object Name, InstallState
Get-ADForest | Select-Object Name, ForestMode, Domains
```

**Verify:** The applicability record lists each controller's operating system and roles, the STIGs that apply with the release you will measure against, and the later-scope STIGs with an owner and a review date.

**Evidence:** Keep the applicability record: host, operating system, roles, each applicable STIG with its release, the later-scope STIGs with owner and date, and the command output behind each line.

Notes / result / date: __________________________

## Stage the DISA content across the air gap

- [ ] On an approved connected system, download from DISA's Cyber Exchange: SCC for Windows and STIG Viewer 3 with their published checksums; the SCAP benchmarks for Windows Server and for the Windows client; the Windows Server, Windows client, Active Directory Domain and Active Directory Forest STIGs and the CCI list from the document library; and the current GPO package. The Windows client content waits for the Tier 2 seat in course 1.8 and the fleet in course 1.13, and the GPO package travels now so course 1.5 imports policies from the same quarterly release as the STIGs you measure; note each file's version and release.
- [ ] Check SCC and STIG Viewer against DISA's published checksums, then hash every file with Get-FileHash into connected-side-hashes.csv, which travels with the media, and transfer the set with the approved removable-media procedure. No live link to the lab is created for convenience.
- [ ] In the lab, at SBD-DC01's console, copy the files into C:\Staging\DISA and the hash list into C:\Evidence\baseline\transfer, and compare every hash before opening anything; repeat on SBD-DC02 with the same full set, so its comparison is one-to-one as well, although it needs only SCC and the Windows Server benchmark. A mismatch stops the work, exactly as it will in the course 1.6 signing ceremony.
- [ ] Install SCC on both controllers and STIG Viewer on SBD-DC01, then install the Windows Server benchmark into SCC on each controller. Until course 1.8 builds AdminJumpBox01, administration happens at the controllers' consoles; course 1.8 then moves both tools there and removes them from the controllers. Record SCC's, STIG Viewer's, each benchmark's and each STIG's version, and leave the GPO package (for course 1.5) and the Windows client content hashed in C:\Staging\DISA.

**Commands:**

```
Get-ChildItem C:\Staging\DISA -File | Select-Object Name, Length, LastWriteTime
New-Item -ItemType Directory C:\Evidence\baseline\transfer -Force | Out-Null
Get-ChildItem C:\Staging\DISA -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\baseline\transfer\lab-side-hashes.csv -NoTypeInformation
# connected-side-hashes.csv came with the media; no output means every hash matches
Compare-Object (Import-Csv C:\Evidence\baseline\transfer\connected-side-hashes.csv).Hash (Import-Csv C:\Evidence\baseline\transfer\lab-side-hashes.csv).Hash
```

**Verify:** Every transferred file's hash matches the value recorded on the connected side on both controllers, SCC and STIG Viewer match DISA's published checksums, SCC runs on both controllers and STIG Viewer on SBD-DC01, and every version is written down.

**Evidence:** Keep the transfer record in C:\Evidence\baseline\transfer on SBD-DC01: file names, versions and releases, both hash lists, the comparison result on each controller, media custody, and the date.

Notes / result / date: __________________________

## Capture the pre-hardening baseline

- [ ] On each controller's console, run SCC locally against the Windows Server STIG benchmark staged in lesson 2. DISA content offers several mission assurance category (MAC) and confidentiality profiles: use the one your direction calls for, the same on both controllers, and record it. Each scan is a dated session; note SCC's version and the benchmark's version and release with it.
- [ ] Open the results and read, don't just count. Note which checks already pass: the newest Windows Server release ships with defaults such as required signing on outbound SMB connections and LDAP sealing on new deployments, so part of the STIG is green before you touch anything.
- [ ] Separate the automated results from the manual checks. SCAP answers what a scanner can read; the manual rules, and any check that returned an error rather than a pass or a fail, go to STIG Viewer for a human answer in lesson 4.
- [ ] Store the raw results unmodified, with recorded hashes: copy each session into C:\Evidence\baseline\<host name> and hash it, then carry SBD-DC02's set to the evidence folder on SBD-DC01, where its hashes must match again. The baseline is evidence; a cleaned-up copy is a summary, not the record.

**Commands:**

```
# On each controller, after its SCC scan. Adapt the path to SCC's results directory.
New-Item -ItemType Directory C:\Evidence\baseline -Force | Out-Null
$session = Get-ChildItem "$env:USERPROFILE\SCC\Sessions" -Directory | Sort-Object Name | Select-Object -Last 1
Copy-Item $session.FullName -Destination "C:\Evidence\baseline\$env:COMPUTERNAME" -Recurse
Get-ChildItem "C:\Evidence\baseline\$env:COMPUTERNAME" -Recurse -Filter '*XCCDF-Results*.xml' | Select-Object Name, LastWriteTime
Get-ChildItem "C:\Evidence\baseline\$env:COMPUTERNAME" -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv "C:\Evidence\baseline\$env:COMPUTERNAME-hashes.csv" -NoTypeInformation
# On SBD-DC02: carry its set to SBD-DC01. Then, on SBD-DC01, no output means the copy is identical.
Copy-Item C:\Evidence\baseline\SBD-DC02, C:\Evidence\baseline\SBD-DC02-hashes.csv -Destination '\\SBD-DC01\C$\Evidence\baseline\' -Recurse
Compare-Object (Import-Csv C:\Evidence\baseline\SBD-DC02-hashes.csv).Hash (Get-ChildItem C:\Evidence\baseline\SBD-DC02 -Recurse -File | Get-FileHash -Algorithm SHA256).Hash
```

**Verify:** Both controllers have a dated baseline session from the same SCC version, benchmark release and profile; the already-compliant operating system defaults are noted; and both raw result sets sit hashed in C:\Evidence\baseline on SBD-DC01, with SBD-DC02's hashes matching after the copy.

**Evidence:** Keep the per-host result sets and their hash lists in C:\Evidence\baseline, the SCC version, benchmark release and profile, and a short note of what the operating system defaults already covered.

Notes / result / date: __________________________

## Build the checklists and answer the manual checks

- [ ] On SBD-DC01, open STIG Viewer, add the staged STIGs to its library, and create three checklists: SBD-DC01 and SBD-DC02, each with the Windows Server STIG, and sbd.test with the Active Directory Domain and Active Directory Forest STIGs, whose rules assess the domain and the forest rather than one host. Fill in each controller's target data — host name, fully qualified domain name, address, and the domain controller role.
- [ ] Import each controller's XCCDF results from C:\Evidence\baseline into its own checklist with Import XCCDF or CMRS Results, and record the import summary: rules matched, rules matched with a different revision, and rules not matched. A revision mismatch means the rule changed between the benchmark and the STIG release in the checklist, so align the releases or review those rules by hand — don't include loosely matched results blindly.
- [ ] Work every rule still Not Reviewed — the manual checks, the whole sbd.test checklist, and anything the scan could not evaluate. Read the check text, look at the system, and set Open, Not A Finding, or Not Applicable. Write what you observed in Finding Details (the command or screen and what it showed) and the context in Comments (who reviewed, when, and any related decision).
- [ ] Change an automated result only with evidence in Finding Details, and never lower a severity to improve the numbers: STIG Viewer requires an override reason because an assessor will read it. Save the checklists in STIG Viewer's CKLB format in C:\Evidence\baseline\checklists as SBD-DC01.cklb, SBD-DC02.cklb and sbd.test.cklb, then hash them.

**Commands:**

```
foreach ($t in 'SBD-DC01', 'SBD-DC02', 'sbd.test') {
  $ckl = Get-Content "C:\Evidence\baseline\checklists\$t.cklb" -Raw -Encoding UTF8 | ConvertFrom-Json
  $ckl.stigs | Select-Object @{n='Checklist';e={$t}}, stig_name, version, release_info | Format-Table -AutoSize
  $ckl.stigs.rules | Group-Object status | Select-Object @{n='Checklist';e={$t}}, Name, Count | Format-Table -AutoSize   # expect no not_reviewed
}
Get-ChildItem C:\Evidence\baseline\checklists -Filter *.cklb | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\baseline\checklists-hashes.csv -NoTypeInformation
```

**Verify:** All three checklists hold the intended STIG releases and target data, each import matched by exact revision or had its mismatches reviewed, no rule is left Not Reviewed, and every manual answer carries its observation in Finding Details.

**Evidence:** Keep the three .cklb files with their hashes, each import's summary counts, the status counts per checklist, and any severity override with its reason.

Notes / result / date: __________________________

## Write the findings record for hardening

- [ ] Export the open rules from all three checklists into one findings record, C:\Evidence\baseline\findings\findings-record.csv, and count them per checklist by severity. Read the CAT I items first: their exploitation directly and immediately causes loss.
- [ ] Classify every open item with one of three values. Fix by GPO: the DISA package sets it, so course 1.5's import should close it. Deviation candidate: the setting conflicts with a design decision — for example a rule expecting the PDC emulator to synchronize with an authorized external time source, where the course 1.3 design declares and checks its own clock — and course 1.5 decides and records it. POA&M candidate: the fix lies outside Group Policy, such as the PKI server certificate the STIG expects on every domain controller, which the course 1.6 PKI issues, so it needs an owner and a planned date — the start of a Plan of Action and Milestones (POA&M) entry.
- [ ] Trace each finding to its controls. A rule's CCIs map to NIST SP 800-53 controls in DISA's CCI list, and STIG Viewer shows them with each rule — CCI-000366, for example, is implementing the security configuration settings under CM-6 — so the record tells an assessor which control each open item weakens.
- [ ] Write the handoff course 1.5 works from as C:\Evidence\baseline\findings\handoff.txt: SCC's version, the benchmark release and profile, the STIG releases, the GPO package release waiting hashed in C:\Staging\DISA, and where the checklists and this record live. Then hash the whole folder into C:\Evidence\baseline-manifest.csv. Course 1.5 checks that manifest, rescans with exactly those versions into C:\Evidence\hardened, updates copies of the checklists there, and closes or records every item.

**Commands:**

```
New-Item -ItemType Directory C:\Evidence\baseline\findings -Force | Out-Null
$rows = foreach ($t in 'SBD-DC01', 'SBD-DC02', 'sbd.test') {
  $ckl = Get-Content "C:\Evidence\baseline\checklists\$t.cklb" -Raw -Encoding UTF8 | ConvertFrom-Json
  $ckl.stigs.rules | Where-Object status -eq 'open' | Select-Object @{n='Target';e={$t}}, @{n='GroupId';e={$_.group_id}}, @{n='StigId';e={$_.rule_version}}, @{n='Severity';e={$_.severity}}, @{n='CCIs';e={$_.ccis -join ' '}}, @{n='Title';e={$_.rule_title}}, Classification, Owner, TargetDate
}
$rows | Group-Object Target, Severity | Select-Object Name, Count
$rows | Export-Csv C:\Evidence\baseline\findings\findings-record.csv -NoTypeInformation
# After you fill in Classification, Owner and TargetDate and write handoff.txt, close the baseline:
Get-ChildItem C:\Evidence\baseline -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\baseline-manifest.csv -NoTypeInformation
Get-FileHash -Algorithm SHA256 C:\Evidence\baseline-manifest.csv
```

**Verify:** The findings record lists every open rule from the three checklists with target, severity and CCIs; each carries one of the three classifications and an owner, POA&M candidates also a planned date; the counts by severity are recorded; and handoff.txt and the manifest give course 1.5 every version, path and hash it reuses.

**Evidence:** Keep findings-record.csv, the counts by severity per checklist, the CCI-to-control notes for the open items, handoff.txt, and C:\Evidence\baseline-manifest.csv with its own hash.

Notes / result / date: __________________________

## Sources

- [DISA · Security Content Automation Protocol (SCC and SCAP benchmarks)](https://www.cyber.mil/stigs/SCAP/)
- [DISA · SRG/STIG tools (STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [DISA · STIGs document library (STIGs, SRGs and the CCI list)](https://www.cyber.mil/stigs/downloads)
- [DISA · STIG Group Policy Objects package](https://www.cyber.mil/stigs/gpo)
- [NIST · National Checklist Program (SP 800-70)](https://csrc.nist.gov/projects/national-checklist-program)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [Microsoft · What's new in Windows Server (newest release)](https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025)
- [Microsoft · Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash)

© 2026 Secure By Design Team LLC
