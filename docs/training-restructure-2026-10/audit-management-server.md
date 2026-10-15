# Audit: course 1.15 management-server

Validator passes (5 lessons, 160 minutes, 2.7 h). Checked against decisions.md, Inside the Network (A02, F01–F03, F06, F09, F17, F18; SBD-HV07; 10.0.70.10), and the 1.5, 1.8, 1.9, 1.10, 1.11, 1.13 and 1.14 drafts.

## Fixed

- `labNote`: removed "Endpoint agents and credentialed scanning … arrive with courses 1.16 and 1.17". Rule 1 allows one coming-soon mention, and that mention is now the final `next` line.
- `mgmt-design` quiz 2 explanation: "When course 1.16 builds it, the row turns active" → "When the system is built, its row turns active as part of that build". The course no longer promises material that doesn't exist.
- `mgmt-build` step 1, `check` and guide checklist 1: added turning off the hypervisor's time synchronization (rule 2 and the first-wave time decision).
- `mgmt-build` step 1: added course 1.10's event-forwarding GPO (linked to the Servers OU by course 1.14) to the first-boot policies. Step 2's Event Sources enrolment depends on it, and course 1.14 applies it the same way.
- `mgmt` quiz 1, correct answer: "sources that cannot lie" → "sources the record doesn't control". Lesson 4 teaches that each source proves only something narrow.
- `inventory-sources` step 4: removed the sentence about agents and scans arriving with courses 1.16 and 1.17 (rule 1).
- `mgmt-prove` step 5: removed "courses 1.16 and 1.17 will add agent and scan results as sources", and "course 1.18 adds the VLAN 40 servers" became "turns the VLAN 40 servers' planned rows active". Those rows already exist as planned (lesson 1), and course 1.18 now does this.
- `mgmt-prove` `next`: "adds their rows to this inventory" → "turns their planned rows in this inventory active". This is the one remaining 1.16/1.17 mention, phrased as coming soon.
- Stub `vulnerability-scanning/catalog.json` description: "of every VLAN" → "of the approved target list". F15 scans a named target list, not every VLAN.
- Stub `endpoint-protection/catalog.json`: no change needed. It has number 1.16 and categoryOrder 16, `comingSoon: true`, an accurate one-sentence description (F16: every Windows agent checks in to the one Trellix ePO/DLP server), systems `SBD-EPO01`, and no outcomes, stages or lessons. The NESSUS01 stub otherwise has number 1.17 and categoryOrder 17, `comingSoon: true`, systems `SBD-NESSUS01` and platform Linux.

Verified without change:
- `[adsisearcher]` paging, and that `lastLogonTimestamp` lags by 9 to 14 days.
- `Get-DhcpServerv4Lease -AllLeases` and its properties.
- `Get-WsusComputer -All` and its `IComputerTarget` property names.
- The `icacls /inheritance:r /grant:r` syntax, and the default root ACL of a new volume.
- The firewall rule-scoping logic, that A02 refuses SBD-ADMIN-PC01 (10.0.60.30), and Ring 3 - Member servers (course 1.14's name).
- `/srv/repo-records` and the httpd and apache2 access-log paths (course 1.9).
- CM-8, CM-8(1), CM-8(2), CM-8(3), CM-8(4) and AC-6 titles.

## Judgment calls for the owner

1. **No collection path for SBD-MGMT01.** Sources are gathered from SBD-ADMIN-SRV01 over existing rows and filed on SBD-MGMT01. The alternative is a pull design with read-only accounts (DHCP Users, WSUS Reporters), which would need new register rows. Recommendation: keep it; no new rows are needed and the server holds no credentials to other systems.
2. **Inventory boundary.** The boundary includes the seven hypervisor hosts, the core, the VLAN 80 access switch and SBD-ROOTCA01. It lists SBD-EPO01, SBD-NESSUS01 and the VLAN 40 servers as `planned`. Recommendation: keep it; Inside the Network shows all of these. The planned rows for the coming-soon systems aren't a dependency.
3. **CM-8(2)** (Automated Maintenance) is beyond the Moderate baseline; it frames the automated sources. Recommendation: keep it, or swap it for CM-8(1) if the owner wants only baseline controls.
4. **The AD PowerShell module from Tier 1.** The module needs ADWS 9389, which course 1.8 opens only to AdminJumpBox01 (A01). This course therefore reads the directory over LDAP. Any Tier 1 command in another course that uses `Get-AD*` from SBD-ADMIN-SRV01 will fail the same way. Course 1.18 now runs its AD cmdlets from AdminJumpBox01. Recommendation: have the next audit wave grep 1.10–1.19 for this pattern.

## For other courses

- **prove-recovery (1.19)**: already lists `D:\Inventory on SBD-MGMT01` in its recovery set and the reconciliation against directory, leases and WSUS rings. Consistent; no change.
- **workstation-fleet (1.13)**: now hands the fleet inventory to course 1.15. Consistent; no change.
- **Inside the Network**: SBD-MGMT01's service reads "Listeners to define". This course defines it as management only, through A02 from SBD-ADMIN-SRV01, with no collection path of its own. The model could record that, e.g. "Management only · RDP 3389 / WinRM 5985 from SBD-ADMIN-SRV01 (A02); no outbound collection".
