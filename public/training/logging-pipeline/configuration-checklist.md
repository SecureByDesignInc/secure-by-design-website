# Collect the record on SBD-SYSLOG01 — configuration checklist

Secure By Design · Edition 2.0 · 14 October 2026

This is the first of three logging courses. Course 1.10 designs the whole collect → protect → analyze pipeline and builds the collect stage on SBD-SYSLOG01; course 1.11 protects the record on SBD-AUDIT01, and course 1.12 analyzes it in SBD-SPLUNK01. Collection is configuration you can show: a subscription, a listener, and events with the right source names and times.

## Before you start

- [ ] Complete courses 1.1–1.9: every Windows system they built — both DCs, SBD-SUBCA01, SBD-PKI-MGMT01, SBD-DHCP01, and the three admin seats — becomes a source; the tiered admin plane (course 1.8) means the collector is administered only from VLAN 60 (SBD-ADMIN-SRV01, Tier 1); and SBD-REPO01 (10.0.70.20, course 1.9) is running and becomes this course's first Linux source.
- [ ] Provision SBD-SYSLOG01 (10.0.20.20) as Windows Server joined to sbd.test in the Servers OU, so course 1.5's member-server STIG policies apply from first boot, with a separate data volume (D: in this sample) for the logs. Turn off the hypervisor's time synchronization and check that w32tm /query /source names a domain controller (course 1.3).
- [ ] Have the network's service-path register, the course 1.6 SBD Server Authentication template, and an approved syslog receiver for Windows (staged across the air gap and hashed, as in course 1.4) ready: Windows has no built-in syslog listener.

## Design collect, protect, analyze

- [ ] Write the role sentence for each host and the course that builds it: SBD-SYSLOG01 (course 1.10) receives Windows events and syslog; SBD-AUDIT01 (course 1.11) holds the protected copy for the full retention period; SBD-SPLUNK01 (course 1.12) indexes a working copy for search and alerting. One copy to keep, one copy to question.
- [ ] Scope the first collection to what already produces evidence: the Security log and the Windows Time events course 1.3 keeps from every Windows system that exists — both DCs, SBD-SUBCA01, SBD-PKI-MGMT01, SBD-DHCP01, and the three admin seats — plus the core router's deny log and SBD-REPO01's syslog. The fleet joins in course 1.13, and every later server in the course that builds it.
- [ ] Decide the AU answers per stage. How long each stage keeps its records is dependent on your environment and your records policy, so write down the period you chose for each and why: the collector keeps a local buffer long enough for the downstream pickups to catch up after an outage, administered by Tier 1 from SBD-ADMIN-SRV01; the repository keeps the protected record for the whole period your policy requires, written only by a write-only archival account, read by a named auditors group, and deleted by nobody outside the custodian's logged retention process, with independent approval (rule A04); analysis keeps as much searchable history as investigations need, read by analysts.
- [ ] Name the two streams and where they are picked up: Windows events land in the ForwardedEvents log (file on D:\Logs\ForwardedEvents) and syslog in daily files per sender under D:\Logs\Syslog. Course 1.11's archival job and course 1.12's forwarder both read from these two places; nothing else writes there.
- [ ] Add the register rows with owners: Windows sources to the collector (F17, WinRM 5985, source-initiated), Linux syslog over TLS (F07, TCP 6514), the core router's deny log (rule F24, UDP 514, owned by the network owner: the router already sends it to the collector's address as part of the network's existing configuration, and this course only receives it), the archive path (F11, SMB 3 with encryption) and the forwarder path (F10, TCP 9997 with TLS). The last two stay unused until courses 1.11 and 1.12.

**Commands:**

```
# From AdminJumpBox01 (Tier 0): what the DCs audit today.
Invoke-Command SBD-DC01, SBD-DC02 { auditpol /get /category:* /r } | Out-File C:\Evidence\logging-pipeline\DCs-auditpol-before.csv
# From SBD-ADMIN-SRV01 (Tier 1): no collector runs yet.
Invoke-Command SBD-SYSLOG01 { Get-Service Wecsvc | Select-Object Status, StartType }
```

**Verify:** The design names each stage's job, building course, scope, chosen retention period with its reason, and readers; the no-delete rule is written; the two streams and their pickup folders are named; and the register carries the five pipeline paths with owners, F24 for the router's deny log included.

**Evidence:** Keep the pipeline design sheet, the retention and access table, the stream and pickup definitions, and the new register rows.

Notes / result / date: __________________________

## Turn on the right auditing

- [ ] Review what the Defense Information Systems Agency (DISA) Group Policy objects (GPOs) linked in course 1.5 already audit — most of the advanced audit policy arrived with the STIGs, including the setting that makes subcategories override the old category policy. This lesson reconciles and fills gaps rather than starting over.
- [ ] Confirm the subcategories the design depends on are at least at the STIG values on the DCs: Credential Validation, Logon, Special Logon, User Account Management, Security Group Management, Directory Service Changes, Audit Policy Change, and Security State Change, which writes event 4616 for every clock change course 1.3 records — success and failure where the design says so. Directory Service Changes writes event 5136 only for objects whose auditing entries ask for it, so check the domain's auditing entries too.
- [ ] Extend the same policy to the Admin OU's computer sub-OUs from course 1.8, so privileged sessions on the admin hosts write their sign-in trail, and confirm that SBD-SUBCA01, SBD-PKI-MGMT01, and SBD-DHCP01 already carry the member-server STIG values.
- [ ] Make every addition a separate, documented GPO linked above the STIG GPO, never an auditpol /set on one server. Advanced audit settings merge across GPOs per subcategory, and only a conflicting subcategory is decided by precedence — record each addition in the course 1.5 exception record, kept on AdminJumpBox01.

**Commands:**

```
# From AdminJumpBox01 (Tier 0): effective audit policy and the policy result on a DC.
Invoke-Command SBD-DC01 { auditpol /get /category:* /r } | Out-File C:\Evidence\logging-pipeline\SBD-DC01-auditpol.csv
Invoke-Command SBD-DC01 { auditpol /get /subcategory:"Directory Service Changes,Security State Change" }
gpresult /s SBD-DC01 /scope computer /h C:\Evidence\logging-pipeline\SBD-DC01-gpresult.html
```

**Verify:** Effective audit policy on the DCs and admin hosts covers the designed subcategories at or above the STIG values, applied through GPO, with every addition documented.

**Evidence:** Keep the auditpol output per host class, the GPO report, and the documented additions.

Notes / result / date: __________________________

## Build the collector

- [ ] On SBD-SYSLOG01, run wecutil qc /q, move the ForwardedEvents log file to D:\Logs\ForwardedEvents, and create the subscription SBD-ForwardedSecurity from an XML file: SourceInitiated, MinLatency delivery (push, 30-second batches), into ForwardedEvents, with two queries — the whole Security log (event 4616 included), and the Microsoft-Windows-Time-Service events 12, 35, 36, 37, 129, and 142 from the System log that course 1.3 keeps. Allow one computer group, SBD Event Sources, created from AdminJumpBox01 and holding every Windows system that exists now: both DCs, SBD-SUBCA01, SBD-PKI-MGMT01, SBD-DHCP01, and the three admin seats. The default allows Domain Computers, which does not include domain controllers.
- [ ] From AdminJumpBox01, enroll the sources with one GPO linked to the Domain Controllers, Tier 0 Servers, Servers, and Admin sub-OUs and security-filtered to SBD Event Sources (Authenticated Users keep read), so the collector and later servers stay out until a course adds them: the subscription manager Server=http://SBD-SYSLOG01.sbd.test:5985/wsman/SubscriptionManager/WEC,Refresh=60, the WinRM service set to automatic, and NETWORK SERVICE in Event Log Readers — on the DCs through the domain's built-in group, on the other sources as a local group preference. Restart each source so the group changes apply; the sources push, the collector reads nothing.
- [ ] Allow WinRM 5985 inbound on the collector only from the enrolled sources: VLANs 10 and 60, SBD-SUBCA01 and SBD-PKI-MGMT01 (10.0.30.20 and 10.0.30.30), and SBD-DHCP01 (10.0.20.10), which shares VLAN 20, so only this host firewall scopes it. Rule F17 covers every Windows member; each later course widens this scope when it enrolls new sources. Kerberos authenticates both ends and encrypts the forwarded events, even over HTTP.
- [ ] Install the approved syslog receiver as a service: UDP 514 for the core router, which already sends its deny log to this address (rule F24), and TCP 6514 with TLS using an SBD Server Authentication certificate for SBD-SYSLOG01.sbd.test, requested from the course 1.6 issuing CA through its process after adding SBD-SYSLOG01 to the SBD TLS Servers group. Write daily files per sender under D:\Logs\Syslog, and allow each port only from its registered senders.
- [ ] Confirm the register rows are the only paths in use: WinRM from the enrolled sources (F17), syslog from the core (F24), and nothing listening that the design didn't ask for.

**Commands:**

```
# On SBD-SYSLOG01 (Tier 1 session from SBD-ADMIN-SRV01): the subscription, the first events, and the listeners.
wecutil es
wecutil gs SBD-ForwardedSecurity
Get-WinEvent -LogName ForwardedEvents -MaxEvents 20 | Select-Object TimeCreated, Id, MachineName
Get-NetUDPEndpoint -LocalPort 514
Get-NetTCPConnection -LocalPort 6514,5985 -State Listen
# On each source, from its tier's seat: Network Service is in Event Log Readers, and the forwarder connected (events 104 and 100).
net localgroup "Event Log Readers"
Get-WinEvent -LogName 'Microsoft-Windows-Forwarding/Operational' -MaxEvents 5 | Select-Object TimeCreated, Id, Message
```

**Verify:** The subscription is enabled, events from every member of SBD Event Sources — Security and Time-Service — appear in ForwardedEvents with correct source machine names, router deny entries arrive in the syslog files, and only the registered ports listen.

**Evidence:** Record the subscription XML and wecutil gs output, the enrolling GPO report, the first forwarded event per source, a received router deny line, and the listener list.

Notes / result / date: __________________________

## Keep the collector trustworthy

- [ ] Read wecutil gr SBD-ForwardedSecurity: each source shows a runtime status and its last heartbeat. A source that is inactive, or whose last heartbeat is older than the subscription's heartbeat interval (wecutil gs shows it), has gone silent — check its Microsoft-Windows-Forwarding/Operational log first.
- [ ] Set the ForwardedEvents log's size and behavior with wevtutil sl: overwrite the oldest events (/rt:false) so new events are never refused, sized so the oldest event is always older than the buffer period you chose in lesson 1. Overwriting is safe only while courses 1.11 and 1.12 pick events up well inside that window; a full log in retain mode would drop new events instead.
- [ ] Check the data volume and the syslog intake: free space on D:, both listeners up, and today's file growing for every registered sender. A sender with no file today is a silent source too.
- [ ] Write the failure response (AU-5): a stopped Windows Event Collector service, an inactive source, the oldest event younger than the buffer, a data volume past the fill level you set (dependent on your environment; record the value you chose), or a silent syslog sender. The logging owner is told the same day, restores collection, and records the gap window. Until course 1.12 turns these into alerts, run the check daily and keep each result.

**Commands:**

```
wecutil gr SBD-ForwardedSecurity
wevtutil sl ForwardedEvents /ms:4294967296 /rt:false   # 4 GB in this sample: size it to hold your chosen buffer
wevtutil gl ForwardedEvents
Get-WinEvent -LogName ForwardedEvents -Oldest -MaxEvents 1 | Select-Object TimeCreated
Get-Volume -DriveLetter D | Select-Object SizeRemaining, Size
Get-ChildItem D:\Logs\Syslog -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 5 FullName, LastWriteTime
```

**Verify:** Every enrolled source is active with a recent heartbeat, ForwardedEvents overwrites oldest-first and holds more than the chosen buffer period, the data volume has headroom, every registered syslog sender wrote today, and the failure response names its owner.

**Evidence:** Keep the runtime status output, the log configuration, the oldest-event time, the volume figures, and the written failure response with its first daily check.

Notes / result / date: __________________________

## Prove collection and hand off

- [ ] Generate one failed sign-in on SBD-DC01 with a wrong password for a tier admin account. Find event 4625 in the DC's Security log, then in ForwardedEvents with MachineName SBD-DC01 and the same time; compare the delay with the 30-second delivery setting.
- [ ] Probe one unregistered port across the core — from SBD-ADMIN-SRV01, TCP 23 on SBD-DHCP01 — and find the router's deny line (rule F24) in the syslog files with the right source, destination, port, and time. Attempt and deny now form an evidence pair.
- [ ] Enroll SBD-REPO01 (rule F07): install rsyslog's TLS driver, rsyslog-gnutls, with dnf from REPO01's own repository; in a file under /etc/rsyslog.d, point the driver's CA file at the system trust bundle, which holds the course 1.6 root that course 1.9 placed there, and forward to SBD-SYSLOG01.sbd.test on TCP 6514 with x509/name authentication, so the collector's certificate name is checked; then check the configuration and restart rsyslog. Add REPO01 to the 6514 sender list, send a test message with logger, and find it in REPO01's daily file.
- [ ] Run the cadence: SBD-SYSLOG01's first SCAP baseline with the course 1.4 benchmark and tool versions, run locally in a Tier 1 session from SBD-ADMIN-SRV01 with SCC copied from that seat's course 1.8 copy over PowerShell remoting and its hash checked, and a rescan of both DCs from AdminJumpBox01, attributing the deltas to lesson 2's audit policy.
- [ ] Write the handoff to course 1.11: the two streams, their pickup folders, the buffer period you chose, which the archive job must stay inside, the gap windows the daily check records (those days need re-exporting once a source replays its backlog), and the F11 row waiting for SBD-AUDIT01.

**Commands:**

```
# On SBD-SYSLOG01 (Tier 1 session): the failed sign-in, and the router's deny of the probe to SBD-DHCP01.
Get-WinEvent -FilterHashtable @{LogName='ForwardedEvents'; Id=4625; StartTime=(Get-Date).AddHours(-1)} | Select-Object TimeCreated, MachineName
Select-String -Path D:\Logs\Syslog\*\*.log -Pattern '10\.0\.20\.10' | Select-Object -Last 3
# On SBD-REPO01: the TLS driver, then /etc/rsyslog.d/sbd-forward.conf:
sudo dnf install rsyslog-gnutls
#   global(DefaultNetstreamDriverCAFile="/etc/pki/tls/certs/ca-bundle.crt")
#   *.* action(type="omfwd" target="SBD-SYSLOG01.sbd.test" port="6514" protocol="tcp"
#          StreamDriver="gtls" StreamDriverMode="1" StreamDriverAuthMode="x509/name"
#          StreamDriverPermittedPeers="SBD-SYSLOG01.sbd.test")
# Check the configuration, restart, confirm the TLS session, then send the test message.
sudo rsyslogd -N1
sudo systemctl restart rsyslog
ss -tn 'dport = :6514'
logger -t sbd-collector-proof 'SBD-REPO01 syslog over TLS test'
# Back on SBD-SYSLOG01: the test message in REPO01's daily file.
Select-String -Path D:\Logs\Syslog\*\*.log -Pattern 'sbd-collector-proof' | Select-Object -First 3
# On SBD-ADMIN-SRV01: this course's evidence, hashed.
Get-FileHash -Algorithm SHA256 C:\Evidence\logging-pipeline\*
```

**Verify:** The failed sign-in, the router deny, and REPO01's test message each appear on the collector with the right source and a time that matches the source; SBD-SYSLOG01 has its first baseline; and the DC rescan deltas are attributed to the audit policy.

**Evidence:** Keep the three traces with their timestamps, REPO01's forwarding configuration, the scan set with hashes, and the handoff note to course 1.11.

Notes / result / date: __________________________

## Sources

- [Microsoft · Use Windows Event Forwarding to help with intrusion detection](https://learn.microsoft.com/en-us/windows/security/threat-protection/use-windows-event-forwarding-to-assist-in-intrusion-detection)
- [Microsoft · Setting up a source initiated subscription](https://learn.microsoft.com/en-us/windows/win32/wec/setting-up-a-source-initiated-subscription)
- [Microsoft · Wecutil (Windows Event Collector)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wecutil)
- [Microsoft · Wevtutil](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wevtutil)
- [Microsoft · Auditpol](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/auditpol)
- [Microsoft · Advanced security auditing FAQ](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/advanced-security-auditing-faq)
- [Microsoft · Advanced audit policy configuration](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/advanced-audit-policy-configuration)
- [Red Hat · Configuring a remote logging solution](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/assembly_configuring-a-remote-logging-solution_security-hardening)
- [RFC 5425 · Transport Layer Security (TLS) Transport Mapping for Syslog](https://www.rfc-editor.org/rfc/rfc5425)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [NIST · SP 800-53 Rev. 5 security controls (AU family)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
