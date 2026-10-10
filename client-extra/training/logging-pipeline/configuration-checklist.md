# See everything: the logging pipeline — configuration checklist

Secure By Design · Edition 1.4 · 9 October 2026

This course builds the model's collect → protect → analyze chain before the fleet arrives, so every later system is observed from its first boot. Collection is configuration you can show; protection is permissions and retention you can defend; analysis is a search someone actually runs.

## Before you start

- [ ] Complete course 1.5: the admin plane exists, and this course's systems are managed only from VLAN 60.
- [ ] Provision SBD-SYSLOG01 (10.0.20.20) as Windows Server, SBD-SPLUNK01 (10.0.50.10) on Linux joined to the sbd.test domain with its time service (chrony or ntpd) pointed at both domain controllers, and SBD-AUDIT01 (10.0.50.40) as Windows Server joined to the domain.
- [ ] Have the network's service-path register ready for the new rows: event forwarding to the collector, syslog from the core router, and the forwarder path into the analysis system.

## Design collect, protect, analyze

- [ ] Write the role sentence for each host: the collector receives Windows events and the core router's syslog; the repository holds the protected, long-retention copy; the analysis system indexes a working copy for search and alerting. One copy to keep, one copy to question.
- [ ] Scope the first collection to what already produces evidence: both DCs' Security logs, the core router's deny log, and the admin hosts' sign-in events — the fleet joins this scope in the next course, not now.
- [ ] Decide the AU-family answers and write them down: retention length per stage, who may read each stage, and that nobody — including administrators — writes or deletes in the repository outside the archival process (that is the AU-9 protection story).
- [ ] Add the register rows: DC and admin-host event forwarding to the collector (WinRM 5985), router syslog UDP 514 to the collector, and the forwarder path from collector to the analysis system; all three systems are managed only from VLAN 60 per course 1.5's handoff.

**Commands:**

```
# Capture the before state: what the DCs currently audit and where nothing is forwarded yet.
auditpol /get /category:* | Select-String 'Logon|Account Management|Directory Service|Policy Change'
Get-Service Wecsvc -ComputerName SBD-SYSLOG01
```

**Verify:** The design names each stage's job, scope, retention, and readers; the repository's no-delete rule is written; and the register carries the three pipeline paths with owners.

**Evidence:** Keep the pipeline design sheet, the retention and access table, and the new register rows.

Notes / result / date: __________________________

## Turn on the right auditing

- [ ] Review what the Defense Information Systems Agency (DISA) Group Policy objects (GPOs) from course 1.3 already audit — much of the advanced audit policy arrived with the STIGs. This lesson reconciles and fills gaps rather than starting over.
- [ ] Confirm the categories the design depends on are at least at the STIG values on the DCs: Logon/Logoff, Account Management, Directory Service Changes, and Policy Change — success and failure where the design says so.
- [ ] Extend the same policy to the admin hosts' OU so privileged sessions write the sign-in trail lesson 5 of course 1.5 started capturing by hand.
- [ ] Any place this course wants more auditing than the STIG sets, make it a documented addition in the GPO structure — never a local, invisible tweak — and note it in the exception/addition record.

**Commands:**

```
auditpol /get /subcategory:'Logon','User Account Management','Directory Service Changes','Audit Policy Change'
gpresult /r /scope:computer
```

**Verify:** Effective audit policy on the DCs and admin hosts covers the designed categories at or above the STIG values, applied through GPO, with any additions documented.

**Evidence:** Keep the auditpol output per host class, the GPO report, and the documented additions.

Notes / result / date: __________________________

## Build the collector

- [ ] On SBD-SYSLOG01, enable the Windows Event Collector service and create a source-initiated subscription for the designed event IDs from the DCs and admin hosts, delivered into the Forwarded Events log.
- [ ] By GPO on the relevant OUs, set the subscription manager to the collector and grant the Network Service read access to the Security log — the sources push; the collector never reaches into them.
- [ ] Add a syslog intake on the collector for UDP 514 and point the core router's deny logging at it, so the network boundary's decisions land beside the Windows record.
- [ ] Confirm the register rows are the only paths in use: WinRM from the source OUs to the collector, syslog from the core, and nothing listening that the design didn't ask for.

**Commands:**

```
wecutil es
wecutil gs SBD-ForwardedSecurity
Get-WinEvent -LogName ForwardedEvents -MaxEvents 5 | Select-Object TimeCreated, Id, MachineName
```

**Verify:** The subscription is active, events from both DCs and the admin hosts appear in Forwarded Events with correct source machine names, and router deny entries arrive on the syslog intake.

**Evidence:** Record the subscription configuration, the GPO that enrolls sources, the first forwarded events per source, and a received router deny entry.

Notes / result / date: __________________________

## Protect the record on SBD-AUDIT01

- [ ] Create the archival job: on schedule, the collector exports its Forwarded Events and syslog intake to dated archive files and transfers them to SBD-AUDIT01's repository share — the only inbound write path the repository allows.
- [ ] On arrival, hash each archive and append the hash to a catalog kept with the archives; an archive whose hash no longer matches is a finding, not a file.
- [ ] Set the permissions to match lesson 1's decision: the archival process writes, a named auditors group reads, and no interactive account holds delete rights — retention-driven deletion runs as its own documented, logged process, administered only under the audit custodian's separate accounts.
- [ ] Fill in the AU table with what now exists: where each stage's data lives, its retention clock, and who can touch it — this table is the kind of artifact course 2.2 shows joining the Body of Evidence for the audit controls.

**Commands:**

```
Get-ChildItem \\SBD-AUDIT01\LogArchive | Select-Object Name, Length, LastWriteTime -First 5
Get-FileHash -Algorithm SHA256 \\SBD-AUDIT01\LogArchive\*.evtx | Select-Object -First 3
icacls \\SBD-AUDIT01\LogArchive
```

**Verify:** Dated archives arrive on schedule with catalog hashes that verify, the permission listing matches the access model exactly, and the AU table reflects reality.

**Evidence:** Keep the archival job definition, the hash catalog excerpt, the permissions output, and the completed AU table.

Notes / result / date: __________________________

## Analyze in SBD-SPLUNK01

- [ ] Install the analysis platform on SBD-SPLUNK01 and bring in the collector's two streams — the forwarded Windows events and the router syslog — over the registered forwarder path; the repository stays out of this flow by design.
- [ ] Build search one: failed sign-ins (event 4625) involving the tier admin accounts, grouped by source host — the tiering course's denials now have a dashboard.
- [ ] Build search two: router denies by source VLAN and destination port — the network boundary, now trending; and search three: time-service events and offsets, so clock drift surfaces before Kerberos complains.
- [ ] Turn the first search into an alert with a threshold, a named responder from the admin plane, and a written first-response step — an alert nobody owns is a log entry with extra steps. Console access to all of this: VLAN 60 only, per the handoff.

**Commands:**

```
Test-NetConnection SBD-SPLUNK01.sbd.test -Port 9997
# In the analysis console, confirm the three saved searches return today's events
Get-WinEvent -FilterHashtable @{LogName='Security';Id=4625} -MaxEvents 3 | Select-Object TimeCreated, MachineName
```

**Verify:** Both streams index with correct timestamps, the three searches return real current events, and the alert fires in a test with its responder and first step documented.

**Evidence:** Record the input configuration, each search with a result sample, and the alert definition with its responder.

Notes / result / date: __________________________

## Prove the chain and delta scan

- [ ] Generate the test event: one failed sign-in on a DC with a wrong password for a tier admin account. Find it in the DC's Security log, in Forwarded Events on the collector, flag it for the next archive's verification on the repository, and watch the alert fire in analysis.
- [ ] Repeat with the boundary: probe one unregistered port, then find that deny in the syslog stream and in search two — the boundary's evidence pair — attempt and deny — now assembles itself.
- [ ] Run the cadence: first baselines for SBD-SYSLOG01, SBD-AUDIT01, and SBD-SPLUNK01 (Windows hosts with the standard benchmark; SBD-SPLUNK01 runs Linux, so scan it with the DISA STIG benchmark for its distribution), plus a DC rescan for the audit-policy deltas.
- [ ] File the end-to-end trace as this course's signature evidence and write the handoff: the fleet course inherits a pipeline that will see its first domain join happen.

**Commands:**

```
Get-WinEvent -FilterHashtable @{LogName='ForwardedEvents'; Id=4625; StartTime=(Get-Date).AddHours(-1)} | Select-Object TimeCreated, MachineName
Get-ChildItem C:\Evidence\logging-pipeline -Recurse | Select-Object Name, LastWriteTime
Get-FileHash -Algorithm SHA256 C:\Evidence\logging-pipeline\*
```

**Verify:** The test event appears at every stage with consistent timestamps, the deny trace matches, the new hosts have baselines, and the DC rescan deltas are attributed to the audit policy.

**Evidence:** Keep the four-stage trace of the test event, the deny trace, the scan set, and the handoff note to course 1.7.

Notes / result / date: __________________________

## Sources

- [Microsoft · Use Windows Event Forwarding to help with intrusion detection](https://learn.microsoft.com/en-us/windows/security/threat-protection/use-windows-event-forwarding-to-assist-in-intrusion-detection)
- [Microsoft · Wecutil (Windows Event Collector)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wecutil)
- [Microsoft · Auditpol](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/auditpol)
- [Splunk · product documentation](https://docs.splunk.com/Documentation)
- [NIST · SP 800-53 Rev. 5 security controls (AU family)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
