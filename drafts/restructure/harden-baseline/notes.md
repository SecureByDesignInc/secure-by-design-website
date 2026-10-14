# Course 1.5 harden-baseline — notes

Five lessons, 150 minutes (2.5 h): `ou-design` 20, `gpo-basics` 30 (new), `apply` 40, `rescan` 35, `maintain` 25. The validator passes.

## Built on course 1.4's handoff (exact paths)

- `apply` checks the package in `C:\Staging\DISA` against `C:\Evidence\baseline\transfer\connected-side-hashes.csv` before extracting, and reads the release in `handoff.txt`.
- `rescan` checks the hash of `C:\Evidence\baseline-manifest.csv` and every baseline file against it, reads `C:\Evidence\baseline\findings\handoff.txt`, and rescans into `C:\Evidence\hardened\<host>`. SBD-DC02's set is copied and verified as in 1.4. It copies `SBD-DC01.cklb`, `SBD-DC02.cklb` and `sbd.test.cklb` into `C:\Evidence\hardened\checklists` and updates only those copies. The findings record is copied to `C:\Evidence\hardened\findings\findings-record.csv` with added `Resolution` and `Evidence` columns. The values are closed by GPO / deviation / POA&M candidate.
- `maintain` keeps the living exception record at `C:\Evidence\exception-record.csv`, outside the sealed folder, so later courses add rows there. A dated copy, the GPO backup, `gpo-links.csv` and the report are sealed in `C:\Evidence\hardened-manifest.csv`.

## Cross-course conflicts (need changes elsewhere)

1. **stig-scap (1.4)** still numbers tiered administration 1.7. Examples: prerequisites[1] "until course 1.7 builds AdminJumpBox01, that is where administration happens", the labNote "course 1.7 moves both tools to AdminJumpBox01", staging step 4, and the guide's DC CONSOLES node. On the final path it is 1.8.
2. **stig-scap (1.4)**, `findings` step 2, has the POA&M example "the server certificates the STIG expects on domain controllers, which need the PKI course 1.6 builds". **two-tier-pki (1.6)** publishes only SBD Computer Authentication and SBD Server Authentication and never enrolls the DCs, so nothing closes that item. Either 1.6 adds DC certificate enrollment and a DC rescan, or the example changes.
3. **tiered-admin (1.8)** needs these renumbered to 1.5: "link course 1.3's … (GPOs) to them", "Course 1.3 linked them only to the Domain Controllers and Servers OUs" (in the step and in a quiz answer), "in the course 1.3 exception record", and "the entries course 1.3's STIG GPO sets".
   - New in 1.5: the DISA user policy is linked to the Domain Controllers and Servers OUs, together with a loopback (merge) GPO. Admin Servers and the Tier 0 Servers OU should therefore get the user policy and the loopback GPO too, not only "the member-server STIG GPOs".
   - The Windows client GPOs are imported in 1.5 but left unlinked (`apply` step 2), ready for Admin Workstations and course 1.13.
   - When 1.8 moves SCC and STIG Viewer, it should also carry `C:\Evidence`, including `exception-record.csv`, to AdminJumpBox01.
4. **two-tier-pki (1.6)** needs these updates:
   - "Complete courses 1.1–1.3 (identity, DNS and time, and the hardened baseline)" should become 1.1–1.5.
   - "(course 1.5 moves it, with the issuing CA, to a Tier 0 Servers OU)" should become course 1.8.
   - "the Admin OU from course 1.3" (in the `template-admin` step and in a quiz answer) should become 1.5.
5. **domain-time (1.3)**, `time`, still says "course 1.3's hardening Group Policy objects (GPOs) must leave it intact … that course's deviation record is where the decision lives". It should name courses 1.4–1.5 and the course 1.5 exception record. 1.5 `apply` checks `w32tm /query /source` after the import. `maintain` uses the AD Forest STIG rule on the PDC emulator's external time source as its worked exception.
6. **workstation-fleet (1.13)**: "from the course 1.3 package, are ready to link" should say the GPOs were imported in 1.5 from the package 1.4 staged. "The course 1.3 redirect" should become 1.5; the redirect still targets the Workstations OU. The client user policy is imported but unlinked, so 1.13 must decide where it links.
7. **prove-recovery (1.19)**: "the course 1.3 Backup-GPO set" should become 1.5. The backup is in `C:\Evidence\hardened\gpo-backup`, with the links in `gpo-links.csv`, because a restore does not bring links back.
8. **Outside course content**:
   - `public/inside-network-model/courses.js` still has `harden:{title:'1.3 · Harden the baseline',…}`. It needs 1.5, a new stig-scap entry and the DC mappings.
   - `content/training-progress.json` needs `training:harden-baseline:gpo-basics`. The `staging` and `baseline` progress IDs move to stig-scap, so saved progress needs a migration like `drizzle/0012`.

## Sources

WebFetch's permission request timed out and the shell proxy blocks cyber.mil, so I checked every URL with Microsoft Learn fetch and Firecrawl instead. All resolve.

- **Added**: `gp-processing`, `gp-scope`, `gpinheritance`, `gpo-read`, `gpupdate`, `gp-results`, `gp-backup`, `new-gplink`, `dc-rules`, `backup-gpo` (learn.microsoft.com), and `disa-scap` (https://www.cyber.mil/stigs/SCAP/, uppercase, as in 1.4).
- **Kept**: `ou`, `redirect`, `central-store`, `import-gpo`, `gpresult`, `disa-gpo`, `disa-tools`, `ncp`.
- **Dropped**: `whatsnew`. Only the moved `baseline` lesson used it.

Facts checked against those pages:
- **Processing order and precedence**: local → site → domain → OU, and link order 1 wins. Enforced overrides Block Inheritance.
- **Refresh**: 90 minutes plus a random 0–30 on members, 5 minutes on DCs.
- **Replication**: the Active Directory part of a GPO and its SYSVOL part replicate separately, through AD replication and DFS Replication.
- **Filtering and loopback**: security filtering needs Read plus Apply group policy. Since MS16-072, computers need Read on user-only GPOs. WMI filters and loopback merge/replace work as the lesson states.
- **Import**: it replaces all settings and leaves links, security filtering and the WMI filter alone. Migration tables map user-rights principals.
- **Account policies**: DCs take them only from GPOs linked at the domain root.
- **Tools**: `Backup-GPO` and `Get-GPOReport -All`. STIG Viewer's XCCDF import reports matched, revision-mismatched and unmatched rules.
- **DISA package**: it contains ADMX templates, GPO backups, reports, WMI filter exports and checklists.

## Unsure

- **DISA package internals.** The download was blocked (proxy 403), so these are unconfirmed:
  - the exact GPO names (DC computer, MS computer, MS-and-DC user);
  - the placeholder groups ADD YOUR DOMAIN ADMINS / ADD YOUR ENTERPRISE ADMINS, which only a third-party article confirms;
  - a migration table under Support Files, which only a forum snippet mentions.
  The lesson words all of these conditionally.
- **Account policies in the DC GPO.** I don't know whether the current package puts them there. The lesson says "if the package carries account policies".
- **Loopback merge for the DISA user policy on servers** is my design choice. It reaches admins in the Admin OU and the built-in Administrator in CN=Users, where no GPO can link. It should be checked against DISA's ReadMe.
- **The XCCDF compare** reads `rule-result/@idref` and its `result` child through PowerShell's XML adapter, which ignores namespace prefixes. I could not run it against a real SCC results file.
