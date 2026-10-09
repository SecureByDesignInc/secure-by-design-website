# Harden the baseline — configuration checklist

Secure By Design · Edition 1.2 · 8 October 2026

This course designs the organizational unit (OU) structure, applies the Defense Information Systems Agency (DISA) Security Technical Implementation Guide (STIG) Group Policy package, and verifies the result with Security Content Automation Protocol (SCAP) scans. Paths, versions, and session locations below are examples — adapt them to your tooling. Expect STIG settings to change behavior: that is the point, and the reason everything is scanned and recorded.

## Before you start

- [ ] Complete the identity build and DNS courses with replication and name resolution verified on both controllers.
- [ ] Use the isolated Windows Server 2025 environment and an account approved for organizational unit and Group Policy administration.
- [ ] Have an approved connected system and removable-media procedure for bringing downloaded hardening content into the lab.

## Design and build the OU structure

- [ ] Design the structure by administration: a top-level SBD OU containing Servers, Workstations, Users, Groups, and an Admin OU for privileged accounts. The built-in Domain Controllers OU stays where it is and keeps its name.
- [ ] Create the planned OUs with accidental-deletion protection enabled. Record each OU's purpose and who will administer its contents; an OU with no delegation or policy purpose is clutter.
- [ ] Redirect the default Computers and Users containers to managed OUs with redircmp and redirusr. Group Policy cannot be linked to the default containers, so anything landing there would get only domain-level policy, never the OU-linked hardening.
- [ ] Keep privileged accounts and systems separate: the Admin OU holds the identities that administer domain controllers. The issuing CA from course 1.4 joins the Servers OU for now; course 1.5 gives Tier 0 servers their own OU. Do not nest deeper than the delegation plan requires.

**Commands:**

```
Get-ADOrganizationalUnit -Filter * | Select-Object Name, DistinguishedName
Get-ADDomain | Select-Object ComputersContainer, UsersContainer
(Get-ADOrganizationalUnit -Identity 'OU=SBD,DC=sbd,DC=test' -Properties ProtectedFromAccidentalDeletion).ProtectedFromAccidentalDeletion
```

**Verify:** The planned OUs exist with deletion protection, the default container redirects point at managed OUs, and each OU has a recorded purpose and administrator.

**Evidence:** Keep the OU design sheet: each OU's distinguished name, purpose, delegated administrator, and the redirect commands with their output.

Notes / result / date: __________________________

## Stage the tooling across the air gap

- [ ] On an approved connected system, download the current DISA GPO package and the SRG/STIG tools (SCC and STIG Viewer) from DISA's public site. Note each file's version and the quarterly release it belongs to.
- [ ] Record a SHA-256 hash for every file on the connected side, then transfer the set with the approved removable-media procedure. No live link to the lab is created for convenience.
- [ ] In the lab, recalculate and compare every hash before opening anything. A mismatch stops the work, exactly as it would in the PKI signing ceremony.
- [ ] Install SCC and STIG Viewer on an administrative host and stage the GPO package where the import lesson can reach it. Record tool versions; scan results are only comparable when the benchmark and tool versions are known.

**Commands:**

```
Get-ChildItem C:\Staging\DISA | Select-Object Name, Length
Get-FileHash -Algorithm SHA256 C:\Staging\DISA\*
```

**Verify:** Every transferred file's hash matches the value recorded on the connected side, and tool and package versions are written down.

**Evidence:** Keep the transfer record: file names, versions, both hash sets, media custody, and the date.

Notes / result / date: __________________________

## Capture the pre-hardening baseline

- [ ] On each domain controller, run SCC with the Windows Server 2025 STIG benchmark and the directory-related content staged for this course. Save each session's results with the host name and date.
- [ ] Open the results and read, don't just count. Note which checks already pass: Windows Server 2025 ships with defaults such as required signing on outbound SMB connections and LDAP sealing on new deployments, so part of the STIG is green before you touch anything.
- [ ] Separate the automated results from the manual checks. SCAP answers what a scanner can read; items marked for manual review go to STIG Viewer for a human answer in lesson 5.
- [ ] Store the raw result files unmodified, with recorded hashes. The baseline is evidence; a cleaned-up copy is a summary, not the record.

**Commands:**

```
# Adapt paths to your SCC installation and session directory.
Get-ChildItem C:\Evidence\baseline -Recurse -Include *.xml | Select-Object Name, LastWriteTime
Get-FileHash -Algorithm SHA256 C:\Evidence\baseline\*
```

**Verify:** Both controllers have a dated baseline result set, the already-compliant OS defaults are noted, and the raw files are hashed and stored.

**Evidence:** Keep the per-host result files, their hashes, the benchmark and tool versions, and a short note of what the OS defaults already covered.

Notes / result / date: __________________________

## Import and link the DISA GPOs

- [ ] Copy the package's ADMX and ADML templates into the domain's Group Policy central store (the PolicyDefinitions folder in SYSVOL) so every editor on any domain controller shows the same settings.
- [ ] Create empty GPOs named for the package's policies and import the package's settings into them with the GPMC Import Settings wizard or Import-GPO. Keep DISA's names with a local prefix so the source release stays identifiable.
- [ ] Link the domain-controller policies to the Domain Controllers OU and the member-server policies to the Servers OU for future systems. Review link order and inheritance; do not use Enforced as a shortcut around understanding precedence.
- [ ] Walk the settings that need a decision in this network — anything referencing infrastructure the lab does not have. Record each deviation with its rationale instead of deleting the setting, then update policy and confirm application.

**Commands:**

```
Get-ChildItem \\sbd.test\SYSVOL\sbd.test\Policies\PolicyDefinitions | Measure-Object
Get-GPO -All | Select-Object DisplayName, GpoStatus, ModificationTime
Get-GPInheritance -Target 'OU=Domain Controllers,DC=sbd,DC=test'
gpupdate /force
gpresult /r /scope:computer
```

**Verify:** The central store serves the package's templates, the imported GPOs are linked to the intended OUs, gpresult shows them applying, and every deviation has a written reason.

**Evidence:** Keep the import record: package release, GPO names and links, inheritance output, and the deviation list with rationale and owner.

Notes / result / date: __________________________

## Rescan, reconcile, and record

- [ ] Rerun SCC on both controllers with the same benchmark and tool versions as the baseline. Changing versions between scans makes the comparison meaningless.
- [ ] Compare the two result sets per host: which checks moved from open to compliant, which stayed open, and whether anything regressed. Attribute each change to the policy that caused it.
- [ ] Create the course checklists in STIG Viewer and bring in the scan results so automated passes are populated. Work the manual-review items one by one, recording the observed evidence for each answer.
- [ ] Classify what remains open: a finding to fix now, a documented deviation from lesson 4, or a candidate for a Plan of Action and Milestones (POA&M) — the artifact the Body of Evidence course teaches you to write.

**Commands:**

```
# Compare result sets; adapt paths to your evidence layout.
Get-ChildItem C:\Evidence\baseline, C:\Evidence\hardened -Recurse -Include *.xml | Select-Object Directory, Name
Get-FileHash -Algorithm SHA256 C:\Evidence\hardened\*
gpresult /h C:\Evidence\hardened\SBD-DC01-gpresult.html
```

**Verify:** Both hosts show the expected movement from the baseline, every change is attributable, and every open item is a finding, a deviation, or a POA&M candidate — never unexplained.

**Evidence:** Keep the before/after comparison, the populated checklist files, manual-check answers with their observed evidence, and the classification of remaining opens.

Notes / result / date: __________________________

## Set the rescan cadence and exception record

- [ ] Consolidate the deviation records into one exception list: setting, reason, risk note, owner, and review date. This list travels into the authorization path as part of the Body of Evidence.
- [ ] Set the standing cadence: review each quarterly DISA release for applicable updates, and rescan after any role addition or significant configuration change. Course 1.4's closing delta scans of the PKI servers are the first scheduled instance.
- [ ] Export the Group Policy reports and back up the GPO set so the applied policy state is recoverable and reviewable without a live console.
- [ ] Write the handoff note a future administrator or assessor would need: where the evidence lives, which versions produced it, and what is intentionally open.

**Commands:**

```
Get-GPOReport -All -ReportType Html -Path C:\Evidence\gpo-report.html
Backup-GPO -All -Path C:\Evidence\gpo-backup
Get-FileHash -Algorithm SHA256 C:\Evidence\gpo-report.html
```

**Verify:** The exception list has owners and review dates, the GPO set is exported and backed up, and the rescan triggers are written where the next course will meet them.

**Evidence:** Finish the hardening checklist: exception list, GPO backup location, report hashes, the cadence, and the named owner of the next review.

Notes / result / date: __________________________

## Sources

- [Microsoft · New-ADOrganizationalUnit](https://learn.microsoft.com/en-us/powershell/module/activedirectory/new-adorganizationalunit)
- [Microsoft · Redirect the Users and Computers containers](https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/redirect-users-computers-containers)
- [Microsoft · Create and manage the Group Policy Central Store](https://learn.microsoft.com/en-us/troubleshoot/windows-client/group-policy/create-and-manage-central-store)
- [Microsoft · Import-GPO](https://learn.microsoft.com/en-us/powershell/module/grouppolicy/import-gpo)
- [Microsoft · Gpresult](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpresult)
- [Microsoft · What's new in Windows Server 2025](https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025)
- [DISA · STIG Group Policy Objects package](https://www.cyber.mil/stigs/gpo)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [NIST · National Checklist Program (SP 800-70)](https://csrc.nist.gov/projects/national-checklist-program)

© 2026 Secure By Design Team LLC
