# Analyze the record in SBD-SPLUNK01 — configuration checklist

Secure By Design · Edition 1.0 · 14 October 2026

This is the last of three logging courses: course 1.10 collects the record on SBD-SYSLOG01, course 1.11 protects it on SBD-AUDIT01, and this course analyzes a working copy in SBD-SPLUNK01, then traces one event through all three. Analysis is a search someone actually runs and an alert someone owns. Linux commands show the RHEL family (dnf) and Ubuntu (apt) forms of the distribution course 1.9 chose; retention lengths and alert thresholds are sample values.

## Before you start

- [ ] Complete courses 1.10 and 1.11: SBD-SYSLOG01 collects the two streams — the ForwardedEvents log on D:\Logs\ForwardedEvents, holding at least 14 days, and daily syslog files per sender under D:\Logs\Syslog — SBD-AUDIT01 archives them every night, and the register carries row F10 waiting for this course.
- [ ] Provision a virtual machine for SBD-SPLUNK01 on VLAN 50 (10.0.50.10) with a separate data volume for the indexes (/srv/splunk in this sample), and have course 1.9's client package for SBD-REPO01 and its Linux assessment set (SCC for Linux and the distribution's STIG benchmark in C:\Staging\DISA\linux on SBD-ADMIN-SRV01), course 1.3's chrony file, course 1.6's root certificate hash and SBD Server Authentication template, and course 1.8's administration seats ready.
- [ ] Stage across the air gap, hashed as in course 1.4: the Splunk Enterprise package for Linux (.tgz), the universal forwarder installer for Windows (.msi), the Splunk Add-on for Microsoft Windows, an Enterprise license file, and DISA's Splunk Enterprise STIG for lesson 5's checklist (the Linux scan reuses course 1.9's set).

## Plan analysis and build SBD-SPLUNK01

- [ ] Write analysis's job and its limits: SBD-SPLUNK01 indexes a working copy of the collector's two streams (rule F10) for searches, dashboards, and alerts, while the protected record stays on SBD-AUDIT01 — when an investigation needs evidence, it retrieves the archive. Plan one index per stream, sbd_wineventlog for the forwarded Windows events and sbd_syslog for the syslog files, each searchable for 90 days (course 1.10's sample value) and then deleted, because the repository already keeps the year. Size each from a typical day times 90 plus headroom, starting from course 1.11's daily figures until lesson 2 measures what Splunk actually stores, and cap its size above that, so age rather than size retires the data.
- [ ] Decide who does what: analysts (sbd_analyst) search and review alerts but change nothing, administrators (sbd_admin) manage inputs, indexes, roles, and alerts, and no role used by people gets delete_by_keyword, so nothing in the working copy can be quietly removed. Everyone signs in with a named Splunk account, so no domain password is typed into the console, and the admin account made at install is sealed like course 1.8's break-glass account. Splunk Web and SSH answer VLAN 60 only: analysts and the host's Tier 1 administrators work from SBD-ADMIN-SRV01 (rule A02), and the Tier 0 operators who own the alerts on the domain controllers, the model's DC-facing scope, from AdminJumpBox01 (rule A01). One Splunk instance can't fence one administrator's alerts from another's, and root on the host can change any Splunk file, so keep both groups small and every change on record.
- [ ] Stage the media as course 1.4 taught: the Splunk Enterprise package for Linux (.tgz) and the universal forwarder installer for Windows (.msi), each checked on the connected side against the SHA-512 that Splunk publishes for it, plus the Splunk Add-on for Microsoft Windows, your Enterprise license file, and DISA's Splunk Enterprise STIG. Hash the set for the transfer record and check it again on the lab side before anything is opened. Don't plan on the 60-day trial license: Splunk Free has no users, roles, or alerts, and an Enterprise license installs from its file with no connection to Splunk.
- [ ] Build SBD-SPLUNK01 from hashed install media of the distribution course 1.9 chose, with the VM's hypervisor time synchronization turned off so the domain controllers are its only clock: the name SBD-SPLUNK01.sbd.test, the static address 10.0.50.10/24 with the core's VLAN 50 interface as gateway (10.0.50.1 in this sample), both domain controllers as DNS servers, and the data volume mounted at /srv/splunk. Before its first update, apply course 1.9's client package, checked against its hashes, so SBD-REPO01 is its only package source (rule F19) and no other source remains; then update from the current snapshot.
- [ ] Install course 1.3's chrony file, both domain controllers with maxdistance 16, and confirm a controller is selected inside that course's threshold before anything else: Kerberos refuses a clock more than five minutes off. Then join sbd.test with realm join --computer-ou='OU=Servers,OU=SBD,DC=sbd,DC=test' and a Tier 1 account, which course 1.7 allowed to create computers there (rules F01, F02, and F03), permit sign-in only to SBD Tier 1 Admins with realm permit -g, and give that group sudo through a drop-in file; SSSD then registers the host's address in DNS.
- [ ] Make the host firewall the register's copy, with firewalld (or ufw on Ubuntu): SSH from 10.0.60.20, Splunk Web on TCP 8000 from 10.0.60.10 and 10.0.60.20, and TCP 9997 from SBD-SYSLOG01 (10.0.20.20) alone. Then send the host's own syslog, sudo use included, to the collector over TLS (rule F07) as course 1.10 enrolled SBD-REPO01: rsyslog-gnutls from the snapshot, the course 1.6 root placed in the system trust store by hand as course 1.9 placed it on SBD-REPO01 (exported on SBD-ADMIN-SRV01 and its SHA-256 checked against course 1.6's record), the collector's certificate name checked, and SBD-SPLUNK01 added to the collector's TCP 6514 sender list.

**Commands:**

```
# On SBD-SPLUNK01 (Tier 1 SSH session from SBD-ADMIN-SRV01)
cd /srv/media && sha256sum -c --quiet SHA256SUMS-splunk.txt   # expected: no output
dnf repolist --all              # RHEL family: only the sbd-repo01 repositories enabled
apt-cache policy | grep http    # Ubuntu: only SBD-REPO01.sbd.test
chronyc sources -v; chronyc tracking   # ^* one controller, ^+ or ^- the other
realm list                      # sbd.test, kerberos-member, one permitted group
openssl x509 -inform der -in /tmp/sbd-root.cer -noout -fingerprint -sha256   # matches course 1.6's record
firewall-cmd --get-active-zones
logger -t sbd-splunk-proof 'SBD-SPLUNK01 syslog over TLS test'
# On SBD-SYSLOG01 (Tier 1 session): the test message in SBD-SPLUNK01's daily file
Select-String -Path D:\Logs\Syslog\*\*.log -Pattern 'sbd-splunk-proof' | Select-Object -First 1
```

**Verify:** The design names analysis's job, both indexes with their retention and sizing, the roles and who holds them, and the console paths; the media matches its published and transfer hashes; and SBD-SPLUNK01 resolves to 10.0.50.10, lists SBD-REPO01 as its only package source, has a controller selected inside the course 1.3 threshold, is joined with one permitted group, trusts the course 1.6 root whose hash matches that course's record, admits only the registered paths, and its test message arrives on the collector.

**Evidence:** Keep the analysis design (job, indexes, retention, sizing, roles, console paths), the media hashes with the transfer record, and SBD-SPLUNK01's build record: package sources, chrony output, realm list, the root certificate's hash compared with course 1.6's record, firewall zones, and its first syslog line on the collector.

Notes / result / date: __________________________

## Install Splunk and bring in the streams

- [ ] As root on SBD-SPLUNK01, create the splunk account (the package doesn't), extract the package with tar -xzf into /opt, and give splunk ownership of /opt/splunk and /srv/splunk. Before the first start, add SPLUNK_DB=/srv/splunk to /opt/splunk/etc/splunk-launch.conf and, where your rules require FIPS mode, SPLUNK_FIPS=1: Splunk can enter FIPS mode only at its first start (it turns it on by itself if the Linux kernel already runs in FIPS mode), and an instance started without it can't gain it later, even by upgrading. Start it as splunk with --accept-license, create the admin account when prompted and seal its password, install the license file, and enable boot-start under systemd for the splunk user.
- [ ] Request one SBD Server Authentication certificate for SBD-SPLUNK01.sbd.test through the course 1.6 process, with the key and request made on the host with openssl and the name in both subject and subject alternative name, and keep the key readable by splunk alone. Turn on HTTPS for Splunk Web in web.conf (enableSplunkWebSSL, serverCert, privKeyPath), install the Splunk Add-on for Microsoft Windows, and, in a small app of your own, create both indexes with frozenTimePeriodInSecs = 7776000 (90 days) and the sized maxTotalDataSizeMB, and the two roles: sbd_analyst inheriting the built-in user role, sbd_admin inheriting admin. Create each person's named account with one role, then sign out of the admin account.
- [ ] Open the receiving port in inputs.conf: a [splunktcp-ssl:9997] stanza and an [SSL] stanza whose serverCert is one PEM file holding the certificate, its key, and the SBD chain, with sslVersions = tls1.2. The forwarder checks the server's certificate, and requireClientCert stays false: as on the collector's syslog path in course 1.10, the sender is held to its address, by the host firewall's rule that admits 10.0.20.20 alone.
- [ ] On SBD-SYSLOG01, in a Tier 1 session, install the forwarder with msiexec (AGREETOLICENSE=Yes LAUNCHSPLUNK=0 /quiet); by default it runs as a low-privilege virtual account, NT SERVICE\SplunkForwarder. The STIG's user-rights policy replaces any rights the installer grants, so give the account what it needs explicitly: Event Log Readers membership, added beside SBD-Archive$ in the course 1.11 GPO as a second add-member preference item so neither account replaces the other, and read on D:\Logs\Syslog, both recorded in the course 1.5 exception record. Copy the Windows add-on into the forwarder's apps folder and enable two inputs in its local inputs.conf: [WinEventLog://ForwardedEvents] with renderXml = true and index = sbd_wineventlog, and [monitor://D:\Logs\Syslog] with sourcetype = syslog, index = sbd_syslog, and host_segment = 3, so each line's host is its sender, not the collector.
- [ ] Point it at rule F10 in outputs.conf: server = SBD-SPLUNK01.sbd.test:9997, useSSL = true, sslVerifyServerCert = true, sslAltNameToCheck = SBD-SPLUNK01.sbd.test, and useACK = true, so the forwarder keeps each block until the indexer confirms it. In server.conf, set sslRootCAPath to the SBD chain and turn off the forwarder's own management port ([httpServer] disableDefaultPort = true): nothing manages it remotely, and course 1.10 allows no listener the design didn't ask for. Start the service; on its first run the forwarder reads ForwardedEvents from the oldest event, so the whole 14-day buffer arrives, and its size on disk, divided by the days it covers, replaces lesson 1's sizing estimate.
- [ ] Prove the copy is faithful. Pick one closed hour, count it on the collector with Get-WinEvent and in Splunk over the same window, and compare one event on both sides: the counts must match, and the event's time in Splunk must be when its source wrote it, not when it arrived. Do the same for yesterday's syslog file from each sender, check that host names each source system rather than SBD-SYSLOG01, and confirm in the indexer's own metrics that the forwarder's connection is TLS (connectionType cookedSSL).

**Commands:**

```
# On SBD-SPLUNK01 (Tier 1 SSH session): the first-start decisions, an index, and the TLS port
grep -E '^SPLUNK_(DB|FIPS)' /opt/splunk/etc/splunk-launch.conf
sudo -u splunk /opt/splunk/bin/splunk btool indexes list sbd_wineventlog | grep -E 'frozenTimePeriodInSecs|maxTotalDataSizeMB'
sudo -u splunk /opt/splunk/bin/splunk btool inputs list splunktcp-ssl:9997 --debug
openssl s_client -connect SBD-SPLUNK01.sbd.test:9997 -CAfile /opt/splunk/etc/auth/sbd/sbd-chain.pem </dev/null 2>/dev/null | grep -E 'Verify return code|Protocol'
# On SBD-SYSLOG01 (Tier 1 session): the forwarder's account and connection, and one closed hour
Get-CimInstance Win32_Service -Filter "Name='SplunkForwarder'" | Select-Object StartName, State
Select-String 'C:\Program Files\SplunkUniversalForwarder\var\log\splunk\splunkd.log' -Pattern 'Connected to idx' | Select-Object -Last 1
$start = (Get-Date).Date.AddHours((Get-Date).Hour - 2); $end = $start.AddHours(1)
(Get-WinEvent -FilterHashtable @{LogName='ForwardedEvents'; StartTime=$start; EndTime=$end}).Count
# In Splunk Web (Search), as sbd_admin: the same hour, the forwarder's connection, and the stored size
index=sbd_wineventlog earliest=-2h@h latest=-1h@h | stats count
index=_internal source=*metrics.log group=tcpin_connections | stats latest(connectionType) AS type, latest(version) AS version BY hostname, sourceIp
| dbinspect index=sbd_wineventlog index=sbd_syslog | stats sum(sizeOnDiskMB) AS MB BY index
```

**Verify:** Splunk runs as splunk under systemd with the designed indexes and retention, Splunk Web answers over HTTPS, TCP 9997 presents the SBD-SPLUNK01 certificate over TLS 1.2, the forwarder runs as NT SERVICE\SplunkForwarder with a TLS connection to the indexer, and a closed hour's count and one event's time match the collector for both streams.

**Evidence:** Keep the first-start settings and the FIPS decision, the btool listings for the indexes and the receiving port, the TLS handshake result, the forwarder's inputs and outputs files and its service account, the measured daily size, and the count-and-time comparison for both streams.

Notes / result / date: __________________________

## Build the working searches

- [ ] Sign in from SBD-ADMIN-SRV01 with your named sbd_analyst account and check what the role allows: | rest /services/authentication/current-context lists your roles and capabilities, and delete_by_keyword is not among them. Then read the shape of the data with | tstats count where index=sbd_* by index, host, sourcetype: every source system should appear, the Windows events with their source computer in host and their event ID in EventCode, and the syslog lines with their sender in host.
- [ ] Build search one: failed sign-ins (event 4625) involving the tier admin accounts, grouped by source host — the tiering course's denials now have a dashboard. Take the accounts from course 1.8's tier groups (SBD Tier 0 Admins, SBD Tier 1 Admins, and SBD Tier 2 Admins), not from a naming pattern: from AdminJumpBox01, a Tier 0 operator exports the groups' members to sbd_tier_admins.csv (TargetUserName and tier), uploads it as a lookup the analysts can read, and refreshes it after every membership change.
- [ ] Build search two: router denies by source VLAN and destination port — the network boundary, now trending. Extract src_ip, dest_ip, and dest_port from the core's deny lines once with the field extractor, and derive each VLAN from an address's third octet, since every segment is 10.0.<VLAN>.0/24.
- [ ] Build search three: time-service events, so clock drift surfaces before Kerberos complains. Course 1.10's SBD-ForwardedSecurity already carries Security event 4616 and the System log's Microsoft-Windows-Time-Service events course 1.3 keeps (12, 35, 36, 37, 129, and 142); event 12 on SBD-DC01 is expected, because the PDC emulator serves its own clock. The Linux servers report through chronyd in the syslog stream: which source they selected, or that none was selectable.
- [ ] Save each as a report with its question, owner, the events it depends on, and a known event it must find, and have an sbd_admin share it with the analysts read-only: a wrong password for your Tier 1 account at SBD-ADMIN-SRV01's sign-in screen for search one, a probe of an unregistered port for search two, and a chronyd restart on SBD-SPLUNK01 for search three. Cause each, run each search, and keep the result: lesson 4 turns them into alerts.

**Commands:**

```
# In Splunk Web (Search), signed in as an analyst from SBD-ADMIN-SRV01
| rest /services/authentication/current-context splunk_server=local | table username roles capabilities
| tstats count where index=sbd_* by index, host, sourcetype
index=sbd_wineventlog EventCode=4625 [| inputlookup sbd_tier_admins.csv | fields TargetUserName] | stats count, values(IpAddress) AS sources, latest(_time) AS last BY host, TargetUserName | convert ctime(last)
index=sbd_syslog host=<core> src_ip=* | eval src_vlan="VLAN ".mvindex(split(src_ip, "."), 2) | stats count BY src_vlan, dest_port
(index=sbd_wineventlog "Microsoft-Windows-Time-Service") OR (index=sbd_syslog chronyd) | fillnull value="-" EventCode | stats count, latest(_time) AS last BY host, EventCode | convert ctime(last)
# On SBD-SYSLOG01 (Tier 1 session): course 1.10's subscription carries the Time-Service query
wecutil gs SBD-ForwardedSecurity /f:xml | Select-String 'Time-Service'
```

**Verify:** The analyst role searches both indexes and carries no delete capability, every source system appears with the right host and source type, the subscription carries the Time-Service query, and each saved search finds its known test event.

**Evidence:** Record your role listing, the data-shape table, each saved search with its question, owner, and a result showing its test event, the lookup's source and date, and the subscription's Time-Service query.

Notes / result / date: __________________________

## Own the alerts

- [ ] Write the alert register before building anything: for each alert, its search, threshold, schedule, severity, named responder with a deputy, and written first response. Start from lesson 3's searches (sample thresholds): any failed sign-in for a tier account, since privileged sign-ins are few and each failure deserves a look; any deny from VLAN 80 toward VLAN 60 or from VLAN 60 itself, whose seats use only registered paths, or 20 denies from one source in 10 minutes; and Time-Service events 36, 129, or 142, or chronyd finding no selectable source (never event 12, which SBD-DC01 writes by design). Add any use of a sealed account: course 1.8's break-glass account signing in anywhere, as that course promised, and Splunk's own admin account signing in to Splunk.
- [ ] Add the conditions course 1.10's daily check has watched by hand (AU-5): no Windows events at all for 15 minutes, which means the collector, its forwarder, or rule F10 has stopped, and a known source quiet past its own limit, taken from a lookup of expected sources (each host as Splunk shows it, with the longest quiet it may have). Add course 1.11's repository findings: SBD-Repository events 1001 and 1101 from SBD-AUDIT01, refused access to its archive (event 4656 with an audit failure), and any deletion (event 4660), which the responder matches to an approved retention run. Splunk sees missing data, not disks: the collector's free space and its buffer's oldest event stay in the daily check.
- [ ] Build each as a scheduled alert owned by sbd_admin, the ones on the domain controllers from AdminJumpBox01: a cron schedule such as every 5 minutes, a window of the last 15 minutes by index time (earliest=-24h _index_earliest=-15m), so events that arrive late after an outage are still checked, a trigger when the number of results is greater than zero (so a missing-data search, such as the 15-minute silence, is written to return a row only when its count is zero), throttling on the field that names one problem (the account, the source) for an hour, a severity, and the Add to Triggered Alerts action. This network has no mail server, so the Triggered Alerts list is the responder's queue, and it keeps each entry for 24 hours by default: set each alert's expiration to 7 days, so a weekend can't empty it. Name every alert SBD - <condition>, so the register, the queue, and the scheduler's log use the same names.
- [ ] Test each alert by causing its condition where that is safe, and record when you caused it, when it fired, and who saw it: one wrong password for your Tier 1 account at SBD-ADMIN-SRV01's sign-in screen, a probe of an unregistered port from SBD-ADMIN-SRV01 across the core, and the SplunkForwarder service stopped on SBD-SYSLOG01 for 20 minutes, which also shows the backlog arriving without a gap once it restarts. Where a condition can't be caused safely, such as a repository mismatch or a break-glass sign-in, run the alert's search over a window that holds a real or test example instead.
- [ ] Tune before you trust: run each alert's search over the last seven days and count how often it would have fired. If that is more than the responder can act on, raise the threshold, widen the throttle, or exclude a known benign source, never just lower the severity, and record each change and its reason in the register.
- [ ] Set the review cadence (AU-6; sample values): the responder works the queue at the start of each day and records every alert's outcome; once a week an analyst reviews each saved search's results and signs the review; and each month the register's thresholds, noise, and owners are reviewed, with both lookups refreshed after any change to the tier groups or the sources.

**Commands:**

```
# In Splunk Web (Search), as sbd_admin: the alerts as built
| rest /servicesNS/-/-/saved/searches splunk_server=local | search title="SBD - *" is_scheduled=1 | table title cron_schedule dispatch.earliest_time alert.severity alert.suppress.period alert.expires actions
# Each alert's runs and what it triggered, from the scheduler's own log
index=_internal sourcetype=scheduler savedsearch_name="SBD - *" | stats count, sum(result_count) AS results, values(alert_actions) AS actions BY savedsearch_name
# The silent-source alert's search: each expected source's last event against its limit
| inputlookup sbd_expected_sources.csv | join type=left host [| tstats max(_time) AS last where index=sbd_* earliest=-7d by host] | where isnull(last) OR last < relative_time(now(), "-" . max_quiet_minutes . "m")
# The pipeline test, on SBD-SYSLOG01 (Tier 1 session): stop the forwarder for 20 minutes
Stop-Service SplunkForwarder; Start-Sleep -Seconds 1200; Start-Service SplunkForwarder
```

**Verify:** Every alert in the register has a threshold, schedule, severity, responder with deputy, and written first response; each safe condition fired its alert in a test, with the cause and the alert's time recorded; the 20-minute forwarder stop fired the pipeline alert and its backlog arrived without a gap; and the first daily and weekly reviews are on record.

**Evidence:** Keep the alert register, the listing of the alerts as built, each test's cause-and-fire record, the seven-day tuning counts with any changes, and the first review records.

Notes / result / date: __________________________

## Prove the chain and hand off

- [ ] Generate the test event: one failed sign-in on SBD-DC01 with a wrong password for a tier admin account. From AdminJumpBox01, record its time, account, and event ID in the DC's Security log, then find the same event in ForwardedEvents on SBD-SYSLOG01 with MachineName SBD-DC01 and the same time, about 30 seconds after it happened.
- [ ] Watch analysis catch it: the event appears in sbd_wineventlog with host SBD-DC01 and the same time, and the privileged sign-in alert fires on its next run. The responder sees it in the Triggered Alerts list and records the first response as written — the alert is part of the trace, not an extra.
- [ ] The next morning, after course 1.11's 01:00 run has archived the event's completed UTC day, open that day's ForwardedEvents archive on SBD-AUDIT01 in an auditor's or the custodian's session, confirm its catalog line shows matching hashes, and read the event with Get-WinEvent -Path. Four places, one event, and the same source time in each: that is the chain working.
- [ ] Repeat with the boundary on the analysis side: probe one unregistered port from SBD-ADMIN-SRV01 as course 1.10 did, which already traced the deny to the collector, and find it in search two with the boundary alert firing for a deny from VLAN 60. Attempt, deny, and alert now form one evidence set.
- [ ] Run the cadence: take SBD-SPLUNK01's first SCAP baseline the way course 1.9 scans every Linux server. Over your Tier 1 SSH session, copy SCC for Linux and the distribution's STIG benchmark from C:\Staging\DISA\linux, check their hashes on the host, install SCC as its readme directs, and run it as root with the benchmark and the profile course 1.4 recorded. Answer DISA's Splunk Enterprise STIG for the application in a STIG Viewer checklist on SBD-ADMIN-SRV01, classify every open item as course 1.4 taught, adapted for Linux as in course 1.9 — fix now (no GPO applies to Linux), deviation candidate, or POA&M candidate — and store the session under C:\Evidence\splunk-analysis\baseline\SBD-SPLUNK01 with hashes.
- [ ] File the end-to-end trace as the signature evidence of all three logging courses and write the handoff: the fleet course inherits a pipeline that will see its first domain join happen. When course 1.13 enrolls the workstations, their events arrive in sbd_wineventlog with no change in Splunk; add the ones that must never go quiet to the expected-sources lookup, and recheck the index sizing and the license's daily volume.

**Commands:**

```
# From AdminJumpBox01 (Tier 0): the test event on its source
Invoke-Command SBD-DC01 { Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625; StartTime=(Get-Date).AddHours(-1)} | Select-Object TimeCreated, Id, MachineName }
# On SBD-SYSLOG01 (Tier 1 session): the same event on the collector
Get-WinEvent -FilterHashtable @{LogName='ForwardedEvents'; Id=4625; StartTime=(Get-Date).AddHours(-1)} | Select-Object TimeCreated, MachineName
# In Splunk Web (Search), as an analyst: the same event; its alert is in Triggered Alerts
index=sbd_wineventlog host=SBD-DC01* EventCode=4625 earliest=-1h | table _time host TargetUserName
# Next morning, in an auditor's or the custodian's session on SBD-AUDIT01: that UTC day's archive
Get-WinEvent -Path D:\LogArchive\ForwardedEvents\ForwardedEvents-<UTC date>.evtx -FilterXPath '*[System[EventID=4625]]' | Select-Object TimeCreated, MachineName
# On SBD-ADMIN-SRV01: copy course 1.9's Linux assessment set to the host
scp C:\Staging\DISA\linux\<SCC for Linux package> C:\Staging\DISA\linux\<STIG benchmark> <your-account>@SBD-SPLUNK01.sbd.test:/tmp/
# On SBD-SPLUNK01: the same hashes, then SCC's command-line scanner as root (path and options from the SCC readme)
sha256sum /tmp/<SCC for Linux package> /tmp/<STIG benchmark>
sudo <SCC install directory>/cscc
# On SBD-ADMIN-SRV01: collect the session, then hash the course's evidence
New-Item -ItemType Directory -Force C:\Evidence\splunk-analysis\baseline | Out-Null
scp -r <your-account>@SBD-SPLUNK01.sbd.test:<SCC session folder> C:\Evidence\splunk-analysis\baseline\SBD-SPLUNK01
Get-ChildItem C:\Evidence\splunk-analysis -Recurse -File | Get-FileHash -Algorithm SHA256
```

**Verify:** The test event appears on SBD-DC01, in ForwardedEvents, in Splunk with its alert fired, and in the next morning's archive with matching catalog hashes, all with the same source time; the probe's deny appears in search two and fired its alert; and SBD-SPLUNK01 has its first baseline and Splunk STIG checklist with every open item classified.

**Evidence:** Keep the four-place trace of the test event with its timestamps and the alert's record, the deny with its alert, SBD-SPLUNK01's scan set and checklist with hashes, and the handoff note to course 1.13.

Notes / result / date: __________________________

## Sources

- [Splunk · product documentation](https://docs.splunk.com/Documentation)
- [Splunk · Secure Splunk Enterprise with FIPS](https://docs.splunk.com/Documentation/Splunk/9.1.0/Security/SecuringSplunkEnterprisewithFIPS)
- [Splunk · Configure Splunk indexing and forwarding to use TLS certificates](https://docs.splunk.com/Documentation/Splunk/9.4.0/Security/ConfigureSplunkforwardingtousesignedcertificates)
- [Splunk · Configure Splunk Web to use TLS certificates](https://docs.splunk.com/Documentation/Splunk/9.4.0/Security/SecureSplunkWebusingasignedcertificate)
- [Splunk · Set a retirement and archiving policy](https://docs.splunk.com/Documentation/Splunk/9.4.0/Indexer/Setaretirementandarchivingpolicy)
- [Splunk · Define roles on the Splunk platform with capabilities](https://docs.splunk.com/Documentation/Splunk/9.4.0/Security/Rolesandcapabilities)
- [Splunk · Configure the Splunk Add-on for Windows (forwarded events)](https://docs.splunk.com/Documentation/WindowsAddOn/latest/User/Configuration)
- [Splunk · Getting started with alerts](https://docs.splunk.com/Documentation/Splunk/9.4.0/Alert/Aboutalerts)
- [Splunk · Monitor triggered alerts](https://docs.splunk.com/Documentation/Splunk/9.4.0/Alert/Triggeredalertaction)
- [Red Hat · Integrating RHEL systems directly with Windows Active Directory](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/integrating_rhel_systems_directly_with_windows_active_directory/index)
- [Microsoft · Use Windows Event Forwarding to help with intrusion detection](https://learn.microsoft.com/en-us/windows/security/threat-protection/use-windows-event-forwarding-to-assist-in-intrusion-detection)
- [Microsoft · Wecutil (Windows Event Collector)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wecutil)
- [Microsoft · Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent)
- [DISA · Security Content Automation Protocol (SCC and SCAP benchmarks)](https://www.cyber.mil/stigs/SCAP/)
- [DISA · STIGs document library (operating system and Splunk Enterprise STIGs)](https://www.cyber.mil/stigs/downloads)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [NIST · SP 800-53 Rev. 5 security controls (AU family)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
