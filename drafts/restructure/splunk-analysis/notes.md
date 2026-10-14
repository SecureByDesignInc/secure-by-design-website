# Course 1.12 splunk-analysis — notes

Five lessons, 170 minutes (2.8 h): `analysis-plan` 35 (new), `ingest` 40 (new), `analyze` 30 (moved from logging-pipeline, id kept, retitled "Build the working searches"), `alerts` 35 (new), `prove` 30 (moved, id kept, retitled "Prove the chain and hand off").

Moved quizzes: `analyze` keeps "Why does the repository stay out of the analysis flow?" and the time-health question (course 1.2 → 1.3 in its answer). Its alert question ("What makes an alert real rather than decorative?") moved word for word to `alerts`, where alerts now live; `analyze` got a new lookup question in its place. `prove` keeps all three (explanations updated: Splunk's own STIG, course 1.13).

## Cross-course conflicts (fix in the neighbouring courses)

1. **logging-pipeline (1.10) draft still has superseded numbers.** `design` step 5: "The last two stay unused until courses 1.11 and 1.11" (→ 1.11 and 1.12). `design` recap: "Collector gathers (1.9), repository preserves (1.10), analysis answers (1.11)." (→ 1.10, 1.11, 1.12). `collector-prove` next: "That completes course 1.9." (→ 1.10) and evidence "the handoff note to course 1.10" (→ 1.11). Its notes.md: "1.11 builds SBD-SPLUNK01".
2. **The 1.10 subscription carries Security events only**, but course 1.3 `time-verify` says to keep Time-Service events 12, 35, 36, 37, 129 and 142 "for the event set course 1.10 collects". This course's `analyze` step 4 adds that System-log query to SBD-ForwardedSecurity "if it doesn't carry them yet" (as 1.11 added SBD-AUDIT01's). Better: 1.10 `collector` includes it from the start.
3. **1.10 `collector-health` step 4** ("Until course 1.12 turns these into alerts, run the check daily"): this course automates the stopped collector/forwarder/F10 (no Windows events for 15 minutes), inactive sources and silent syslog senders (expected-sources lookup). Free space on D: and the buffer's oldest event stay in the daily check (Splunk sees missing data, not disks). 1.10 could say which checks remain manual.
4. **audit-repository (1.11):** the GPO filtered to SBD-SYSLOG01 that gives SBD-Archive$ Event Log Readers membership must also add `NT SERVICE\SplunkForwarder` (`ingest` step 4), so the two memberships can't overwrite each other. The forwarder also needs read on D:\Logs\Syslog. The repository findings 1001/1101, 4656 failures and 4660 are alerts in `alerts` step 2, as 1.11's handoff asked.
5. **tiered-admin (1.8):** `logon-restrictions` step 6 promises the break-glass account's "every use alarmed in a later logging course"; done in `alerts` step 1 (with Splunk's own sealed admin account). `scan` step 4 still hands off "for course 1.6"; the SIEM-console part lands here. Console design used: named Splunk accounts (no domain password is typed into a Tier 1 server's console); `sbd_analyst` and the host's Tier 1 administrators from SBD-ADMIN-SRV01 (A02); the alerts on the DCs changed from AdminJumpBox01 by Tier 0 operators holding `sbd_admin` (A01). The lesson says plainly that one Splunk instance can't fence one admin's alerts from another's, and that root on the host can change any Splunk file. So the split is procedural, with few holders and changes on record.
6. **two-tier-pki (1.6), rules F10 and F07:** F10 uses server-authenticated TLS. The forwarder verifies SBD-SPLUNK01's certificate and name, the receiver keeps `requireClientCert = false`, and the host firewall admits only 10.0.20.20. That is the same model 1.10 used for F07. Mutual TLS would need a client-authentication certificate whose private key the forwarder can read as a PEM file, and neither 1.6 template provides one. SBD Server Authentication (copied from Web Server) carries only Server Authentication. SBD Computer Authentication keys aren't exportable unless the template allows it. If the owner wants mutual TLS on F07 or F10, 1.6 needs a template for it.
7. **domain-time (1.3):** `time-members` step 6 already says SBD-SPLUNK01 (1.12) gets the chrony file (both DCs, `maxdistance 16`). This course applies it before `realm join`, because of Kerberos' five-minute limit. Consistent.
8. **business-services (1.18) `apps-web`:** "join it to the sbd.test domain with SSSD, as SBD-SPLUNK01 and SBD-NESSUS01 are joined". This course now defines that pattern: realm join into the Servers OU, `realm permit -g` for the host's Tier 1 group, sudo by drop-in, SSSD's DNS registration, F07 enrollment like REPO01's. 1.18 can cite course 1.12.
9. **workstation-fleet (1.13):** the fleet's events arrive in `sbd_wineventlog` with no Splunk change. Add the workstations that must never go quiet to `sbd_expected_sources.csv`, and recheck index sizing and the license's daily volume. Splunk Enterprise licenses daily ingest, so the `pilot` distractor "That Splunk licenses cover 50 hosts" stays wrong for the right reason.

## Sources (all lesson sources are on origins tests/video-catalog.test.mjs allows)

- Checked with WebFetch this session (pages load): docs.splunk.com 9.4.0 "Configure Splunk indexing and forwarding to use TLS certificates", "Configure Splunk Web to use TLS certificates", "Set a retirement and archiving policy", "Define roles on the Splunk platform with capabilities", "Getting started with alerts", "Monitor triggered alerts" (24-hour default); 9.1.0 "Secure Splunk Enterprise with FIPS"; the Windows add-on's "Configure" page (latest: ForwardedEvents stanza, `renderXml=true`, "use the host field", XML only for WEF); Red Hat RHEL 9 "Integrating RHEL systems directly with Windows Active Directory". Also docs.splunk.com/Documentation (the existing `splunkdocs`), cited for installation facts.
- Many docs.splunk.com pages no longer load: "latest" core pages, the Linux install, the Windows forwarder install, Splunk Free, inputs/outputs.conf. Splunk's documentation now lives on help.splunk.com, where I checked these facts:
  - tar to /opt, and the .tgz creates no splunk user;
  - the forwarder runs by default as a least-privileged virtual account, Event Log Readers is added manually, the AGREETOLICENSE and LAUNCHSPLUNK flags, and the service name SplunkForwarder;
  - inputs.conf: on Windows the drive letter does *not* count as a host_segment, so the setting is 3;
  - outputs.conf: `useSSL = true` uses TLS without a clientCert;
  - Splunk Free has no alerting, users or roles;
  - FIPS mode is set only before the first start, and Splunk turns it on by itself under a kernel already in FIPS mode.
  If current-version links are wanted, add `https://help.splunk.com/` to the test's allowed origins.
- Reused without re-fetching: wef, wecutil, get-winevent (Microsoft); disa-scap, disa-library, disa-tools; controls. A search confirmed that DISA publishes the "Splunk Enterprise 8.x for Linux" STIG (V2R3), which the lesson calls "DISA's Splunk Enterprise STIG".
- The test's origin list would also reject sources in the 1.9 and 1.10 drafts (readthedocs, github, debian, apache, openbsd, chrony-project, firewalld, rfc-editor).

## Unsure

- `EventCode` on XmlWinEventLog comes from the Windows add-on's mapping of the XML EventID; TargetUserName and IpAddress are the XML EventData names. This is standard behaviour, but no page I could load quotes it.
- The add-on's page says only "use the host field" for forwarded events. It doesn't say whether the forwarder or the indexer applies it, so the course installs the add-on on both.
- From experience, not re-verified: `connectionType=cookedSSL` (metrics.log tcpin_connections), the forwarder's "Connected to idx" splunkd.log line, `[httpServer] disableDefaultPort`, `useACK`, SSSD's default DNS update, and `realm permit -g` switching SSSD to the simple access provider.
- A community thread reports confusion over `useSSL = true` without a client certificate. The spec supports it, but test the F10 handshake in a lab.
- The SCC command is written `<SCC install directory>/cscc`, as course 1.9 writes it (audit, October 14).
- AU-6(3)'s title ("Audit Record Review, Analysis, and Reporting | Correlate Audit Record Repositories") is from my knowledge of Rev. 5, not re-fetched.
- Alert thresholds, the 7-day expiration and the review cadence are sample values.
