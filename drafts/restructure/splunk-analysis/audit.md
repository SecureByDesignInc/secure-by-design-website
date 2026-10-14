# Course 1.12 splunk-analysis — audit (October 14)

Checked against decisions.md (including "Settled by the first audit wave"), the 1.1–1.9 audit.md items addressed to 1.12, the 1.10 and 1.11 drafts (stream names, paths, subscription, F07/F10/F11/F17, the 01:00 UTC-day archive, SBD-Repository events 1000/1001/1100/1101, 4656/4660), Inside the Network (splunk 10.0.50.10, F01–F03, F07, F09, F10, F19, A01 = AdminJumpBox01 with Splunk DC monitoring, A02 = SBD-ADMIN-SRV01, `process=logs&step=3` = "Ingest for investigation"), and docs.splunk.com (the roles page confirms that admin doesn't hold delete_by_keyword). Validator passes: 5 lessons, 170 minutes, 2.8 h.

## Fixed

- prerequisites[0]: "Complete course 1.11" now reads "Complete courses 1.10 and 1.11". The collector belongs to 1.10.
- prerequisites[1]: now lists course 1.9's Linux assessment set (`C:\Staging\DISA\linux` on SBD-ADMIN-SRV01) and course 1.6's root certificate hash (settled: Linux scanning, root CA on Linux).
- prerequisites[2]: SCC for Linux and the distribution STIG are no longer staged here. Only DISA's Splunk Enterprise STIG is added. This follows the 1.9 audit.
- analysis-plan step 3: the staged set now includes DISA's Splunk Enterprise STIG, which matches the prerequisites.
- analysis-plan step 4: the VM's hypervisor time synchronization is turned off (decisions rule 2, settled: time).
- analysis-plan step 5: `realm join --computer-ou='OU=Servers,OU=SBD,DC=sbd,DC=test'` now runs with a Tier 1 account, using the computer-creation right course 1.7 delegated. `realm permit -g` now names SBD Tier 1 Admins, so it no longer says just "the AD group of its Tier 1 administrators" (rule 6).
- analysis-plan step 6, command, check, evidence: "the SBD chain in the system trust store" becomes the course 1.6 root placed by hand, as 1.9 did for SBD-REPO01. It is exported on SBD-ADMIN-SRV01, and its SHA-256 is checked against 1.6's record. The lesson adds an `openssl … -fingerprint -sha256` check, and the hash is kept as evidence.
- ingest step 4: the forwarder's Event Log Readers membership and its read right on D:\Logs\Syslog are now recorded in the course 1.5 exception record, as 1.11 records the matching SBD-Archive$ grants.
- analyze step 2: course 1.8's tier groups are named: SBD Tier 0 Admins, SBD Tier 1 Admins, SBD Tier 2 Admins.
- analyze step 4 and command comment: the conditional "if SBD-ForwardedSecurity doesn't carry them yet, add a query…" is gone. Course 1.10 now carries 4616 and Time-Service events 12/35/36/37/129/142 (rule 4, settled: time). The step also says event 12 on SBD-DC01 is expected.
- alerts step 1: the time alert now explicitly excludes event 12, which SBD-DC01 writes by design (settled: time).
- alerts step 3: the "results greater than zero" trigger couldn't fire for missing data as written. The step now says a missing-data search, such as the 15-minute silence, returns a row only when its count is zero.
- prove step 5 and command: `sudo /opt/scc/cscc` is replaced by course 1.9's procedure. Copy SCC for Linux and the benchmark from `C:\Staging\DISA\linux` over the Tier 1 SSH session, check the hashes on the host, run `sudo <SCC install directory>/cscc`, and collect the results to `C:\Evidence\splunk-analysis\baseline\SBD-SPLUNK01`. The classification now quotes course 1.4 with the Linux adaptation: "fix now (no GPO applies to Linux), deviation candidate, or POA&M candidate" (stig-scap audit).
- notes.md: the stale `/opt/scc/cscc` line now points at the `<SCC install directory>/cscc` form.

No quiz keys needed changing. All 15 marked answers are right and every distractor is wrong. Catalog stages, hours, guide step titles, step counts and controls (AC-6, SC-8(1), AU-6, SI-4, AU-6(3), all exact Rev. 5 titles) already matched.

## Judgment calls for the owner

1. **F07/F10 are server-authenticated TLS, but the register says "mutual trust" for F07.** The forwarder verifies SBD-SPLUNK01's certificate and name. The receiver keeps `requireClientCert = false`, and the host firewall admits only 10.0.20.20. This is the same model 1.10 uses for F07. Mutual TLS would need a 1.6 template with a client-authentication certificate whose key the forwarder can read as PEM.
   - Options: (a) keep server-only TLS and change F07's wording in Inside the Network, or (b) add a client-auth template in 1.6 and enable `requireClientCert` here and on 1.10's 6514 intake.
   - **Recommendation:** (a). It's simpler, and the sender is already pinned by address on both ends.
2. **Distribution.** The lessons show both RHEL-family and Ubuntu forms, following 1.9. The 1.9 audit recommends standardizing on the RHEL family. If you agree, drop the Ubuntu lines here too (apt, ufw, update-ca-certificates).
3. **Alert separation inside one Splunk instance.** Tier 0 operators own the DC-facing alerts from AdminJumpBox01 (A01) through `sbd_admin`, and Tier 1 works from SBD-ADMIN-SRV01 (A02). One instance can't technically fence one admin's alerts from another's, and root on the host can change any file. So the split is procedural: few holders, every change on record.
   - Options: keep it procedural (the current text) or give Tier 0 a separate app with app-level permissions. Even then, `admin` can still override them.
   - **Recommendation:** keep it procedural and say so, as the lesson does.
4. **Sample values:** 90-day searchable retention, alert thresholds, the 7-day triggered-alert expiration and the review cadence. Please confirm them.

## For other courses

- **logging-pipeline (1.10):**
  - `collector` step 1 still subscribes "the designed Security event IDs" only. Per rule 4 and the settled time item, SBD-ForwardedSecurity must also carry Security 4616 and a System-log query for Microsoft-Windows-Time-Service events 12, 35, 36, 37, 129 and 142. 1.12 `analyze` now relies on this, and checks it with `wecutil gs SBD-ForwardedSecurity /f:xml | Select-String 'Time-Service'`. If 1.10 uses a separate subscription instead, tell 1.12 its name.
  - Stale numbers are still in the draft:
    - `design` step 5: "until courses 1.11 and 1.11" → "1.11 and 1.12".
    - `collector-prove` next: "That completes course 1.9." → "course 1.10".
  - `collector-health` step 4, "Until course 1.12 turns these into alerts, run the check daily": 1.12 automates only the stopped collector/forwarder/F10, inactive sources and silent syslog senders. Free space on D: and the buffer's oldest event stay in the daily check. Say which checks remain manual.
  - Rule 4 also enrolls SBD-SUBCA01, SBD-PKI-MGMT01 and SBD-DHCP01. The `collector` step lists only the DCs and the admin hosts.
- **audit-repository (1.11):** the GPO filtered to SBD-SYSLOG01 that puts SBD-Archive$ in Event Log Readers must also add `NT SERVICE\SplunkForwarder`. If either course writes the membership alone (Restricted Groups or a replacing preference), it drops the other. Use a GPP "add" item, or list both, and say so in `protect` step 4.
- **business-services (1.18) `apps-web`:** can cite course 1.12 for the Linux join pattern: the 1.3 chrony file first, the root by hand, the 1.9 client package before the first update, `realm join --computer-ou` into the Servers OU with a Tier 1 account, `realm permit -g 'SBD Tier 1 Admins'`, sudo by drop-in, and F07 enrollment.
- **workstation-fleet (1.13):** the fleet's events arrive in `sbd_wineventlog` with no Splunk change. Add the workstations that must never go quiet to `sbd_expected_sources.csv`, and recheck index sizing and the license's daily volume (as 1.12's `prove` handoff says).
