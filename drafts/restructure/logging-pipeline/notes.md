# Course 1.10 logging-pipeline — notes

## Pipeline decisions courses 1.11 and 1.12 depend on (stated in lesson `design`)

- **Who builds what:** 1.9 builds SBD-SYSLOG01 (collect); 1.10 builds SBD-AUDIT01 (protect); 1.11 builds SBD-SPLUNK01 (analyze).
- **Retention (sample values):** collector keeps ≥ 14 days locally as a buffer; repository keeps 1 year; analysis keeps 90 days searchable. ForwardedEvents is set to overwrite oldest (`wevtutil sl ForwardedEvents /ms:4294967296 /rt:false`), so the 1.10 archive job and the 1.11 forwarder must pick events up well inside 14 days.
- **Readers:** collector administered by Tier 1 from SBD-ADMIN-SRV01; repository written only by a write-only archival account (F11), read by a named auditors group, deleted only by the audit custodian's logged retention process (separate custodian accounts on SBD-ADMIN-SRV01); analysis read by analysts.
- **Streams and pickup:** (1) Windows events in the `ForwardedEvents` log, file moved to `D:\Logs\ForwardedEvents`; subscription `SBD-ForwardedSecurity` (source-initiated, MinLatency, allowed group `SBD Event Sources`). (2) Syslog in daily files per sender under `D:\Logs\Syslog\<sender>\*.log`. 1.10's archive job and 1.11's forwarder read only from these two places.
- **Register rows / ports:** F17 WinRM 5985 (Windows sources → collector; inbound scoped to VLANs 10 and 60 for now, later courses widen it); F07 syslog TLS TCP 6514 (Linux → collector; REPO01 enrolled in lesson 5, server cert = SBD Server Authentication for SBD-SYSLOG01.sbd.test from the 1.6 CA); router deny log syslog UDP 514; F11 SMB 3 + encryption 445 (collector → AUDIT01, 1.10); F10 TCP 9997 + TLS (collector → SPLUNK01, 1.11).
- **Failure response (AU-5):** daily manual check by the logging owner until 1.11 automates the alerts (stopped Wecsvc, inactive source, oldest event younger than buffer, D: > 80 %, silent syslog sender).
- **Evidence folder:** `C:\Evidence\logging-pipeline`.

## Inside the Network: router syslog rule

There is **no rule ID for the core router's syslog** to SBD-SYSLOG01. The model only says "the router's deny log" (security.js logging practice, F10 purpose "forwarded events and router syslog", netmgmt practice "Send switch syslog (including ACL denies) to SBD-SYSLOG01"); no port is given and the collector's listed services are only TCP 6514, F10, F11. I kept UDP 514 as the existing lessons had it, registered as an unnumbered row. The model may want a numbered rule (or the router could use TLS 6514 if it supports it — vendor-neutral, so left as UDP 514).

## Cross-course conflicts to fix elsewhere

- **tiered-admin (1.7) `scan`:** "say so explicitly for course 1.6", quiz "What does this course hand to course 1.6?", recap "Course 1.6 inherits…", next "Course 1.6 builds the logging pipeline — collect, protect, analyze" → next course is now 1.8 (REPO01); logging is 1.9–1.11. Also `logon-restrictions`: "its every use alarmed in a later logging course" — fine, but the alarm belongs to 1.11.
- **workstation-fleet (1.12):** "Complete courses 1.4–1.6 … the logging pipeline"; `nac` "reach the course 1.6 collector through the existing event forwarding subscription" and `scale` "Extend the course 1.6 forwarding subscription to the Workstations OU" → course 1.9. Note for that writer: the subscription's allowed group is `SBD Event Sources` (add Workstations computers or a group of them), WinRM 5985 inbound on the collector must be widened to VLAN 80, and the enrolling GPO (subscription manager, Event Log Readers) must be linked to the Workstations OU. NPS events on SBD-DHCP01 need the same enrollment (member server OU) — 1.12 should say so.
- **patch-protect (1.13) `epo`:** "forward the server's threat events into the course 1.6 pipeline" → course 1.10; SBD-EPO01/WSUS01 need enrolling in the subscription (Servers OU GPO + `SBD Event Sources`).
- **business-services (1.14) `design`:** says WEB01 syslog over TLS uses "the same paths the other domain-joined Linux servers, SBD-SPLUNK01 and SBD-NESSUS01, use. Course 1.9's repository row named only those two" — the F07 row is now opened in course 1.10 with REPO01 as first sender; each Linux course must add its server to the collector's 6514 sender allowlist.
- **Old `prove` lesson (now 1.11)** traced "a failed privileged sign-in" end to end; 1.9 `collector-prove` traces only to the collector, so 1.11 should not duplicate the router-deny trace beyond the analysis side.
- The SCAP baseline of SBD-SYSLOG01 now happens in 1.9 (not with AUDIT01/SPLUNK01).

## Sources

- Added and checked via Microsoft Learn fetch: `wec-si` (Setting up a source initiated subscription — source of Domain Computers default SDDL, NETWORK SERVICE / Event Log Readers, `wecutil qc`, events 104/100), `wevtutil`, `audit-faq` (subcategory merge rule). Kept `wef`, `wecutil`, `auditpol`, `controls`; dropped `splunkdocs` (no Splunk content now).
- `rfc5425` (https://www.rfc-editor.org/rfc/rfc5425) is the URL Inside the Network already uses (technical.js); it could not be fetched from this sandbox (proxy blocks rfc-editor.org). Not Microsoft/DISA/NIST — drop it if only those are allowed.
- `disa-tools` reused from the current harden-baseline course.

## Unsure

- Windows has no built-in syslog receiver; I wrote "an approved syslog receiver for Windows" (vendor-neutral, staged across the air gap). Owner may want to name one.
- REPO01 forwarding assumes rsyslog with its GnuTLS module (`rsyslog-gnutls`) and checks with `rsyslogd -N1`; adjust if course 1.9 picks another syslog daemon.
- Directory Service Changes (5136) needs SACLs on the directory; I only said "check the domain's auditing entries" — the STIG normally sets them.
- The probe in lesson 5 (SBD-ADMIN-SRV01 → SBD-DHCP01 TCP 23) crosses the core VLAN 60 → 20 and is not in A02's ports, so it should be a default deny logged by the router.
- Retention numbers (14 days / 1 year / 90 days) are labelled sample values.
