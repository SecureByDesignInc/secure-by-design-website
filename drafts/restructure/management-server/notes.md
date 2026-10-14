# Course 1.15 management-server: notes

Five lessons, 160 minutes (2.7 h): `mgmt-design` 25, `mgmt-build` 35, `mgmt` 30 (moved from patch-protect, id kept), `inventory-sources` 35, `mgmt-prove` 35. The validator passes.

The moved `mgmt` lesson keeps all three quizzes. Its build step moved to `mgmt-build`, and the reconciliation moved to `mgmt-prove`. Its currency rule now also compares against the WSUS computer list.

## Cross-course conflicts (need changes elsewhere)

1. **prove-recovery (1.19)** should include `D:\Inventory` on SBD-MGMT01 in its recovery set (record, history with hashes, change log, sources). Its `record` step 3, "inventory against directory and leases", matches this course's method, which also checks WSUS rings.
2. **business-services (1.18)** `prove-scan` step 3, "the four hosts … and rings into the SBD-MGMT01 inventory", fits. Those rows already exist as *planned*, so 1.18 turns them active as each server is built.
3. **workstation-fleet (1.13)** `scan` hands "the fleet inventory" to "course 1.8's management tooling". That should say course 1.15. `mgmt` step 1 reads its columns (names, image ancestry, certificate thumbprints, sample status). 1.13 never names the file, so the lesson doesn't either.
4. **Inside the Network** lists SBD-MGMT01's service as "Listeners to define". This course defines it as management only, through A02 from SBD-ADMIN-SRV01, with no collection path of its own. The model could record that.

## Decisions worth a look

- **No collection path for SBD-MGMT01.** Sources are gathered from SBD-ADMIN-SRV01 over existing paths:
  - LDAP to the DCs (F03)
  - A02 sessions to SBD-DHCP01 and SBD-WSUS01
  - SSH to SBD-REPO01, as course 1.9 does
  - `Copy-Item -ToSession` to file them

  No new register rows are needed, and the server holds no credentials to other systems. The alternative is a pull design with read-only accounts (DHCP Users, WSUS Reporters), which would need new rows.
- **The directory is read over LDAP (`[adsisearcher]`), not `Get-ADComputer`.** The AD module needs ADWS 9389, and the DCs open it only to AdminJumpBox01 (A01, course 1.8's firewall scoping). Other courses' Tier 1 commands that use the AD module would fail for the same reason.
- **The boundary includes more than the domain members:**
  - the seven hypervisor hosts, SBD-HV01–HV07, all named in `inside-the-network.json` location fields
  - the core and the VLAN 80 access switch
  - SBD-ROOTCA01

  SBD-EPO01, SBD-NESSUS01 and the VLAN 40 servers are rows with status `planned`.
- **Tier 0 baseline dates arrive through the change record**, because Tier 0 evidence stays on AdminJumpBox01 and Tier 0 accounts can't sign in to Tier 1 systems.
- **Controls:** CM-8, AC-6, CM-8(1), CM-8(2) and CM-8(3). CM-8(2) is beyond the Moderate baseline; it is used only to frame the automated sources.

## Sources added (all checked this session through Microsoft Learn search)

- `dirsearcher` (DirectorySearcher, LDAP, 1000-entry server default)
- `lastlogon` (Last-Logon-Timestamp)
- `lastlogon-lag` (9 to 14 days)
- `dhcp-lease` (Get-DhcpServerv4Lease, `-AllLeases`)
- `wsus-cleanup` (30-day computer cleanup)
- `copy-item` (`-ToSession`)

Reused from the repository and sibling drafts: `get-wsuscomputer`, `firewall`, `icacls`, `filehash`, `disa-scap`, `disa-tools`, `controls`.

## Unsure

- `New-Item` on a new volume: "inherited defaults let ordinary users read and create files" rests on the standard root ACL (Users: read and execute, create folders and append data). I didn't re-check this on the newest release.
- `Get-WsusComputer` property names are the same caveat as in 1.14.
- `<your-account>` in the `scp` line is a placeholder, as in course 1.9. PowerShell won't parse it until it is replaced.
