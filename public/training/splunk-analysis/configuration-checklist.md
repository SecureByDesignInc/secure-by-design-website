# Analyze the record in SBD-SPLUNK01 — configuration checklist

Secure By Design · Edition 2.0 · 15 October 2026

This is the last of three logging courses: course 1.10 collects the record on SBD-SYSLOG01, course 1.11 protects it on SBD-AUDIT01, and this course analyzes a working copy in SBD-SPLUNK01, then traces one event through all three. SBD-SPLUNK01 is a single Splunk instance: one server holds every Splunk role this network needs. Analysis is a search someone actually runs and an alert someone owns. Linux commands are for the Red Hat Enterprise Linux–family release course 1.9 chose. Retention periods, alert thresholds and alert expirations depend on your environment and policy: the course says what each one is for, and you record the value you chose.

## Before you start

- [ ] Complete courses 1.10 and 1.11: SBD-SYSLOG01 collects the two streams — the ForwardedEvents log on D:\Logs\ForwardedEvents, sized for the buffer course 1.10 recorded, and daily syslog files per sender under D:\Logs\Syslog — SBD-AUDIT01 archives them every night, and the register carries row F10 waiting for this course.
- [ ] Provision a virtual machine for SBD-SPLUNK01 on VLAN 50 (10.0.50.10) with a separate data volume for the indexes (/srv/splunk in this sample), and have course 1.9's client package for SBD-REPO01 and its Linux assessment set (SCC for Linux and the distribution's STIG benchmark in C:\Staging\DISA\linux on SBD-ADMIN-SRV01), course 1.3's chrony file, course 1.6's root certificate hash and SBD Server Authentication template, and course 1.8's administration seats ready.
- [ ] Stage across the air gap, hashed as in course 1.4: the Splunk Enterprise package for Linux (.tgz), the universal forwarder installer for Windows (.msi), the Splunk Add-on for Microsoft Windows, an Enterprise license file, and DISA's Splunk Enterprise STIG for lessons 3 and 6 (the Linux scan reuses course 1.9's set).

## Plan analysis and build SBD-SPLUNK01

- [ ] Decide the shape before the details: SBD-SPLUNK01 is a single instance, the design Splunk calls S1. One installation is the indexer that stores the events, the search head people sign in to, its own license manager, and its own Monitoring Console. There is no deployment server, because one forwarder is configured by hand, and no search peers. That fits this network: one forwarder, a few people searching, and a daily volume far below what one server indexes. Size the VM from Splunk's reference hardware for a single instance (12 physical cores or 24 vCPU, 12 GB of RAM, and at least 800 sustained IOPS on the volume Splunk writes to); a lab this size runs on less, so record what you allocated, and lesson 3's health report tells you when it isn't enough. A single instance has no second copy to switch to: while SBD-SPLUNK01 is down, searching waits, the forwarder picks up where it stopped once it is back, the record keeps reaching SBD-AUDIT01, and course 1.19 restores the configuration.
- [ ] Write analysis's job and its limits: SBD-SPLUNK01 indexes a working copy of the collector's two streams (rule F10) for searches, dashboards, and alerts, while the protected record stays on SBD-AUDIT01 — when an investigation needs evidence, it retrieves the archive. Plan one index per stream, sbd_wineventlog for the forwarded Windows events and sbd_syslog for the syslog files, each searchable for as long as investigations in your environment need to look back and then deleted, because the repository already keeps the record for its own retention period. The period depends on your environment and policy; record the value you chose and why. Size each from a typical day times that period plus headroom, starting from course 1.11's daily figures until lesson 2 measures what Splunk actually stores, and cap its size above that, so age rather than size retires the data. Then size the volume for both caps, Splunk's own indexes (_internal, _audit), which live there too, and lesson 3's free-space reserve: per the current STIG, Splunk stops indexing once the volume is three-quarters full, so everything you plan to keep must fit in that three-quarters.
- [ ] Decide who does what: analysts (sbd_analyst) search and review alerts but change nothing, administrators (sbd_admin) manage inputs, indexes, roles, and alerts, and no role used by people gets delete_by_keyword, so nothing in the working copy can be quietly removed. Everyone signs in with a named Splunk account, so no domain password is typed into the console, and the admin account made at install is sealed like course 1.8's break-glass account once lesson 3 has created the named accounts. Splunk listens on four ports: Splunk Web (TCP 8000), the receiving port (TCP 9997), splunkd's management port (TCP 8089), and the KV store (TCP 8191). Only Splunk Web and the receiving port, with SSH, are in the register: no other host calls the management port or the KV store in this design, so the host firewall never admits them. Splunk Web and SSH answer VLAN 60 only: analysts and the host's Tier 1 administrators work from SBD-ADMIN-SRV01 (rule A02), and the Tier 0 operators who own the alerts on the domain controllers, the model's DC-facing scope, from AdminJumpBox01 (rule A01). Splunk's roles can't fence one administrator's alerts from another's, and root on the host can change any Splunk file, so keep both groups small and every change on record.
- [ ] Stage the media as course 1.4 taught: the Splunk Enterprise package for Linux (.tgz) and the universal forwarder installer for Windows (.msi), each checked on the connected side against the SHA-512 that Splunk publishes for it, plus the Splunk Add-on for Microsoft Windows, your Enterprise license file, and DISA's Splunk Enterprise STIG. Hash the set for the transfer record and check it again on the lab side before anything is opened. Don't plan on the 60-day trial license: Splunk Free has no users, roles, or alerts, and an Enterprise license installs from its file with no connection to Splunk.
- [ ] Build SBD-SPLUNK01 from hashed install media of the Red Hat Enterprise Linux–family release course 1.9 chose, with the VM's hypervisor time synchronization turned off so the domain controllers are its only clock: the name SBD-SPLUNK01.sbd.test, the static address 10.0.50.10/24 with the core's VLAN 50 interface as gateway (10.0.50.1 in this sample), both domain controllers as DNS servers, and the data volume mounted at /srv/splunk. Before its first update, apply course 1.9's client package, checked against its hashes, so SBD-REPO01 is its only package source (rule F19) and no other source remains; then update from the current snapshot.
- [ ] Install course 1.3's chrony file, both domain controllers with maxdistance 16, and confirm a controller is selected with a small, steady offset before anything else: Kerberos refuses a clock that is too far from the domain's. Then join sbd.test with realm join --computer-ou='OU=Servers,OU=SBD,DC=sbd,DC=test' and a Tier 1 account, which course 1.7 allowed to create computers there (rules F01, F02, and F03), permit sign-in only to SBD Tier 1 Admins with realm permit -g, and give that group sudo through a drop-in file; SSSD then registers the host's address in DNS.
- [ ] Make the host firewall the register's copy, with firewalld: SSH from 10.0.60.20, Splunk Web on TCP 8000 from 10.0.60.10 and 10.0.60.20, and TCP 9997 from SBD-SYSLOG01 (10.0.20.20) alone, and nothing for TCP 8089 or 8191. Then send the host's own syslog, sudo use included, to the collector over TLS (rule F07) as course 1.10 enrolled SBD-REPO01: rsyslog-gnutls from the snapshot, the course 1.6 root placed in the system trust store by hand as course 1.9 placed it on SBD-REPO01 (exported on SBD-ADMIN-SRV01 and its SHA-256 checked against course 1.6's record), the collector's certificate name checked, and SBD-SPLUNK01 added to the collector's TCP 6514 sender list.

**Commands:**

```
# On SBD-SPLUNK01 (Tier 1 SSH session from SBD-ADMIN-SRV01)
cd /srv/media && sha256sum -c --quiet SHA256SUMS-splunk.txt   # expected: no output
dnf repolist --all              # expected: only the sbd-repo01 repositories enabled
chronyc sources -v; chronyc tracking   # ^* one controller, ^+ or ^- the other
realm list                      # sbd.test, kerberos-member, one permitted group
openssl x509 -inform der -in /tmp/sbd-root.cer -noout -fingerprint -sha256   # matches course 1.6's record
firewall-cmd --get-active-zones
firewall-cmd --list-all       # SSH, 8000, and 9997 from their sources only; no 8089 or 8191
logger -t sbd-splunk-proof 'SBD-SPLUNK01 syslog over TLS test'
# On SBD-SYSLOG01 (Tier 1 session): the test message in SBD-SPLUNK01's daily file
Select-String -Path D:\Logs\Syslog\*\*.log -Pattern 'sbd-splunk-proof' | Select-Object -First 1
```

**Verify:** The design names what the single instance holds and the VM's allocation, analysis's job, both indexes with their retention and sizing inside the free-space reserve, the roles and who holds them, and the console paths; the media matches its published and transfer hashes; and SBD-SPLUNK01 resolves to 10.0.50.10, lists SBD-REPO01 as its only package source, has a controller selected with a small, stable offset, is joined with one permitted group, trusts the course 1.6 root whose hash matches that course's record, admits only the registered paths, and its test message arrives on the collector.

**Evidence:** Keep the analysis design (the single instance and its allocation, job, indexes, the retention period you chose and why, sizing with the reserve, roles, ports and console paths), the media hashes with the transfer record, and SBD-SPLUNK01's build record: package sources, chrony output, realm list, the root certificate's hash compared with course 1.6's record, firewall zones, and its first syslog line on the collector.

Notes / result / date: __________________________

## Prepare the host, install Splunk, and bring in the streams

- [ ] Prepare the host before Splunk touches it. Splunk asks for Transparent Huge Pages (THP) to be off on Linux, because THP slows its indexing and searches: add transparent_hugepage=never to every kernel's command line with grubby, reboot, and check that /sys/kernel/mm/transparent_hugepage/enabled shows [never]. Leave SELinux enforcing, as the distribution's STIG set it. Check whether fapolicyd is running (systemctl is-active fapolicyd): where the STIG turned it on, it blocks programs it doesn't trust, and Splunk, installed from a .tgz rather than an RPM, isn't in its trust database until you add it in the next step.
- [ ] As root on SBD-SPLUNK01, create the splunk account (the package doesn't), extract the package with tar -xzf into /opt, and give splunk ownership of /opt/splunk and /srv/splunk with mode 700, as the STIG asks for Splunk's directories. Where fapolicyd runs, trust what you extracted before the first start (fapolicyd-cli --file add /opt/splunk/ --trust-file splunk, then fapolicyd-cli --update): it trusts each file by its hash, so do the same for every add-on you install, and refresh it after every upgrade. Before the first start, add SPLUNK_DB=/srv/splunk to /opt/splunk/etc/splunk-launch.conf and, where your rules require FIPS mode, SPLUNK_FIPS=1: Splunk can enter FIPS mode only at its first start (it turns it on by itself if the Linux kernel already runs in FIPS mode), and an instance started without it can't gain it later, even by upgrading. Start it as splunk with --accept-license, create the admin account when prompted (lesson 3 seals it), install the license file, and enable boot-start under systemd (splunk enable boot-start -systemd-managed 1 -user splunk -group splunk). The unit it writes already allows 65,536 open files; add the process limits Splunk recommends in a drop-in (systemctl edit Splunkd: LimitNPROC=16000 and TasksMax=16000), restart, and look for SELinux denials.
- [ ] Request one SBD Server Authentication certificate for SBD-SPLUNK01.sbd.test through the course 1.6 process, with the key and request made on the host with openssl and the name in both subject and subject alternative name, and keep the key readable by splunk alone. Turn on HTTPS for Splunk Web in web.conf (enableSplunkWebSSL, serverCert, privKeyPath) and install the Splunk Add-on for Microsoft Windows, trusted by fapolicyd like the rest. In a small app of your own, create both indexes with frozenTimePeriodInSecs set to lesson 1's retention period in seconds, the sized maxTotalDataSizeMB, and enableDataIntegrityControl = true, which the STIG asks for and which Splunk applies only to data indexed after it is on, so it goes in before the first event. Add the two roles: sbd_analyst inheriting the built-in user role, sbd_admin inheriting admin. People's accounts wait for lesson 3's password rules.
- [ ] Open the receiving port in inputs.conf: a [splunktcp-ssl:9997] stanza and an [SSL] stanza whose serverCert is one PEM file holding the certificate, its key, and the SBD chain, with sslVersions = tls1.2. The forwarder checks the server's certificate, and requireClientCert stays false: as on the collector's syslog path in course 1.10, the sender is held to its address, by the host firewall's rule that admits 10.0.20.20 alone. A single instance keeps its own logs in its own indexes, so leave Forward data empty under Settings > Forwarding and receiving: an output that points back at itself would loop.
- [ ] On SBD-SYSLOG01, in a Tier 1 session, install the forwarder with msiexec (AGREETOLICENSE=Yes LAUNCHSPLUNK=0 /quiet); by default it runs as a low-privilege virtual account, NT SERVICE\SplunkForwarder. The STIG's user-rights policy replaces any rights the installer grants, so give the account what it needs explicitly: Event Log Readers membership, added beside SBD-Archive$ in the course 1.11 GPO as a second add-member preference item so neither account replaces the other, and read on D:\Logs\Syslog, both recorded in the course 1.5 exception record. Copy the Windows add-on into the forwarder's apps folder and enable two inputs in its local inputs.conf: [WinEventLog://ForwardedEvents] with renderXml = true and index = sbd_wineventlog, and [monitor://D:\Logs\Syslog] with sourcetype = syslog, index = sbd_syslog, and host_segment = 3, so each line's host is its sender, not the collector.
- [ ] Point it at rule F10 in outputs.conf: server = SBD-SPLUNK01.sbd.test:9997, useSSL = true, sslVerifyServerCert = true, sslAltNameToCheck = SBD-SPLUNK01.sbd.test, and useACK = true, so the forwarder keeps each block until the indexer confirms it. In server.conf, set sslRootCAPath to the SBD chain and turn off the forwarder's own management port ([httpServer] disableDefaultPort = true): nothing manages it remotely, and course 1.10 allows no listener the design didn't ask for. Start the service; on its first run the forwarder reads ForwardedEvents from the oldest event, so the whole buffer arrives, and its size on disk, divided by the days it covers, replaces lesson 1's sizing estimate.
- [ ] Prove the copy is faithful. Pick one closed hour, count it on the collector with Get-WinEvent and in Splunk over the same window, and compare one event on both sides: the counts must match, and the event's time in Splunk must be when its source wrote it, not when it arrived. Do the same for yesterday's syslog file from each sender, check that host names each source system rather than SBD-SYSLOG01, and confirm in the indexer's own metrics that the forwarder's connection is TLS (connectionType cookedSSL).

**Commands:**

```
# On SBD-SPLUNK01 (Tier 1 SSH session): the host prepared for Splunk
sudo grubby --update-kernel=ALL --args="transparent_hugepage=never"   # then reboot
cat /sys/kernel/mm/transparent_hugepage/enabled   # expected: always madvise [never]
getenforce; systemctl is-active fapolicyd         # Enforcing; active where the STIG turned it on
sudo fapolicyd-cli --file add /opt/splunk/ --trust-file splunk && sudo fapolicyd-cli --update
stat -c '%U %a %n' /opt/splunk /srv/splunk         # splunk 700
systemctl show Splunkd -p User -p LimitNOFILE -p LimitNPROC -p TasksMax
sudo ausearch -m AVC,USER_AVC,SELINUX_ERR,USER_SELINUX_ERR -ts recent   # expected: <no matches>
# On SBD-SPLUNK01 (Tier 1 SSH session): the first-start decisions, an index, and the TLS port
grep -E '^SPLUNK_(DB|FIPS)' /opt/splunk/etc/splunk-launch.conf
sudo -u splunk /opt/splunk/bin/splunk btool indexes list sbd_wineventlog | grep -E 'frozenTimePeriodInSecs|maxTotalDataSizeMB|enableDataIntegrityControl'
sudo -u splunk /opt/splunk/bin/splunk btool inputs list splunktcp-ssl:9997 --debug
openssl s_client -connect SBD-SPLUNK01.sbd.test:9997 -CAfile /opt/splunk/etc/auth/sbd/sbd-chain.pem </dev/null 2>/dev/null | grep -E 'Verify return code|Protocol'
# On SBD-SYSLOG01 (Tier 1 session): the forwarder's account and connection, and one closed hour
Get-CimInstance Win32_Service -Filter "Name='SplunkForwarder'" | Select-Object StartName, State
Select-String 'C:\Program Files\SplunkUniversalForwarder\var\log\splunk\splunkd.log' -Pattern 'Connected to idx' | Select-Object -Last 1
$start = (Get-Date).Date.AddHours((Get-Date).Hour - 2); $end = $start.AddHours(1)
(Get-WinEvent -FilterHashtable @{LogName='ForwardedEvents'; StartTime=$start; EndTime=$end}).Count
# In Splunk Web (Search), as admin (lesson 3 creates the named accounts): the same hour, the forwarder's connection, and the stored size
index=sbd_wineventlog earliest=-2h@h latest=-1h@h | stats count
index=_internal source=*metrics.log group=tcpin_connections | stats latest(connectionType) AS type, latest(version) AS version BY hostname, sourceIp
| dbinspect index=sbd_wineventlog index=sbd_syslog | stats sum(sizeOnDiskMB) AS MB BY index
```

**Verify:** THP shows [never], SELinux is enforcing with no denials from Splunk, and fapolicyd, where it runs, trusts /opt/splunk; Splunk runs as splunk under systemd with its directories at mode 700 and the recommended process limits; the indexes carry integrity control and the designed retention; Splunk Web answers over HTTPS, TCP 9997 presents the SBD-SPLUNK01 certificate over TLS 1.2, the forwarder runs as NT SERVICE\SplunkForwarder with a TLS connection to the indexer, and a closed hour's count and one event's time match the collector for both streams.

**Evidence:** Keep the THP, SELinux, and fapolicyd state, the unit's account and limits, the first-start settings and the FIPS decision, the btool listings for the indexes and the receiving port, the TLS handshake result, the forwarder's inputs and outputs files and its service account, the measured daily size, and the count-and-time comparison for both streams.

Notes / result / date: __________________________

## Harden Splunk to the STIG

- [ ] Work from the Splunk Enterprise STIG you staged in lesson 1, open in STIG Viewer on SBD-ADMIN-SRV01, and put every setting in the small app that already holds the indexes and roles, so one folder carries the hardening and course 1.19's backup of /opt/splunk/etc keeps it. Splunk reads system/local ahead of every app, so check with btool --debug that each value comes from your app and nothing in system/local overrides it. The values below follow the STIG's text; check each against the release you staged, and record any difference.
- [ ] Set the front door. In web.conf, put the notice and consent text your organization requires in login_content, so it shows before anyone signs in. Splunk Web counts idle time in two parts: the browser's ui_inactivity_timeout (60 minutes by default) runs first, then the shorter of web.conf's tools.sessions.timeout and server.conf's sessionTimeout. Set ui_inactivity_timeout = 1 and both session timeouts to 14 minutes, so an idle session ends within the STIG's 15 minutes. Allow TLS 1.2 only, with sslVersions = tls1.2 in web.conf and in server.conf's [sslConfig] stanza, sslVersionsForClient = tls1.2 there too, and the cipher suites the STIG lists. Add a global banner ([BANNER_MESSAGE_SINGLETON] in global-banner.conf) with the system's name and the marking your environment requires, so every page says where you are.
- [ ] Write the rules for Splunk's own accounts into authentication.conf's [splunk_auth] stanza, with the STIG's values: minPasswordLength = 15; minPasswordUppercase, minPasswordLowercase, minPasswordDigit, and minPasswordSpecial = 1; expirePasswordDays = 60; enablePasswordHistory = true with passwordHistoryCount = 5; and lockoutUsers = true, lockoutAttempts = 3, and lockoutThresholdMins = 15. Splunk checks a password when it is set, so the rules come first: now create each person's named account with one role, sbd_analyst or sbd_admin, and require a password change at first sign-in. Then give the install-time admin a long random password, seal it as course 1.8 seals the break-glass account, and sign out: it is the one local emergency account, and lesson 5 alerts on any use of it.
- [ ] Settle the authentication item before the checklist does. The STIG expects people to sign in through organization-level authentication, LDAP or SAML, with one local account kept for emergencies, and rates that item high. This course keeps named Splunk accounts so no domain password, a Tier 0 operator's included, is ever typed into a Tier 1 server's sign-in page, and holds them to step 3's rules and lesson 5's alerts. Record SPLK-CL-000320 as a deviation candidate with that reason and those measures, as course 1.4 taught. If your authorizing official prefers the STIG's way, the alternative is LDAPS to both domain controllers over rule F03, with AD groups mapped to the two roles and people signing in with standard user accounts, never a tier account. Record the same way every item this network meets differently: email notice (there is no mail server, so the health report and lesson 5's Triggered Alerts carry it), Common Criteria mode, and CAC sign-in.
- [ ] Reserve free space and watch it. In server.conf's [diskUsage] stanza, set minFreeSpace to a quarter of the index volume in megabytes, so Splunk stops indexing once the volume is three-quarters full (per the current STIG). A pause loses nothing here: the forwarder waits and resumes where it stopped, as long as the collector's buffer still holds the events. In Settings > Health report manager, set the Disk Space feature's red and yellow thresholds to the STIG's values, and put the Monitoring Console in standalone mode, so its dashboards show one instance holding every role. Then confirm what lesson 2 set: both indexes report enableDataIntegrityControl, splunk check-integrity passes on their warm buckets (a bucket gets its final hash when it rolls from hot to warm), and /opt/splunk and /srv/splunk are still splunk's with mode 700.
- [ ] Watch Splunk itself. The _audit index records every sign-in and sign-out, account and role change, change under /opt/splunk/etc, capability used, and each start and stop, whatever else you configure. Signed in with your sbd_admin account, search it for the accounts you created, one wrong password you type on purpose for your analyst account, and the settings you changed in this lesson, and keep the results: lesson 5 alerts on the sealed admin account, and the weekly review reads these events. Finish the record for lesson 6's checklist: each setting, the STIG item it answers, the btool line that shows it, and every item met another way with its reason.

**Commands:**

```
# On SBD-SPLUNK01 (Tier 1 SSH session): each value, and the file it comes from
sudo -u splunk /opt/splunk/bin/splunk btool web list settings --debug | grep -E 'login_content|sessions.timeout|ui_inactivity_timeout|sslVersions|enableSplunkWebSSL'
sudo -u splunk /opt/splunk/bin/splunk btool server list --debug | grep -E 'sessionTimeout|sslVersions|minFreeSpace'
sudo -u splunk /opt/splunk/bin/splunk btool authentication list splunk_auth --debug
sudo -u splunk /opt/splunk/bin/splunk btool global-banner list --debug
df -m /srv/splunk                                   # minFreeSpace = a quarter of this volume's size
sudo -u splunk /opt/splunk/bin/splunk btool indexes list sbd_syslog | grep enableDataIntegrityControl
sudo -u splunk /opt/splunk/bin/splunk check-integrity -index sbd_wineventlog
stat -c '%U %a %n' /opt/splunk /srv/splunk          # splunk 700
# In Splunk Web (Search), signed in with your sbd_admin account
| rest /services/authentication/users splunk_server=local | table title roles
index=_audit action="login attempt" earliest=-24h | stats count BY user, info
index=_audit sourcetype=audittrail earliest=-24h | stats count BY action, info
```

**Verify:** The login page shows the notice, an idle session ends within 15 minutes, Splunk Web and splunkd accept TLS 1.2 only, and the banner names the system; authentication.conf carries the STIG's password and lockout values, every person has a named account in one role, and the install-time admin is sealed; minFreeSpace is a quarter of the index volume, Disk Space is in the health report, and the Monitoring Console is in standalone mode; both indexes have integrity control and pass check-integrity; /opt/splunk and /srv/splunk are splunk's with mode 700; _audit shows the new accounts, the failed sign-in, and the changes; and every STIG item met another way has its reason recorded.

**Evidence:** Keep the btool listings with the file each value comes from, the account list with roles, the sealed-admin record, the minFreeSpace calculation, the health report and Monitoring Console mode, the check-integrity results, the permissions, the _audit results, and the record of STIG items met another way, SPLK-CL-000320 with its reason and measures among them.

Notes / result / date: __________________________

## Build the working searches

- [ ] Sign in from SBD-ADMIN-SRV01 with your named sbd_analyst account and check what the role allows: | rest /services/authentication/current-context lists your roles and capabilities, and delete_by_keyword is not among them. Then read the shape of the data with | tstats count where index=sbd_* by index, host, sourcetype: every source system should appear, the Windows events with their source computer in host and their event ID in EventCode, and the syslog lines with their sender in host.
- [ ] Build search one: failed sign-ins (event 4625) involving the tier admin accounts, grouped by source host — the tiering course's denials now have a dashboard. Take the accounts from course 1.8's tier groups (SBD Tier 0 Admins, SBD Tier 1 Admins, and SBD Tier 2 Admins), not from a naming pattern: from AdminJumpBox01, a Tier 0 operator exports the groups' members to sbd_tier_admins.csv (TargetUserName and tier), uploads it as a lookup the analysts can read, and refreshes it after every membership change.
- [ ] Build search two: router denies by source VLAN and destination port — the network boundary, now trending. Extract src_ip, dest_ip, and dest_port from the core's deny lines (its deny log reaches the collector as syslog on UDP 514 under rule F24, part of the network's existing configuration) once with the field extractor, and derive each VLAN from an address's third octet, since every segment is 10.0.<VLAN>.0/24.
- [ ] Build search three: time-service events, so clock drift surfaces before Kerberos complains. Course 1.10's SBD-ForwardedSecurity already carries Security event 4616 and the System log's Microsoft-Windows-Time-Service events course 1.3 keeps (12, 35, 36, 37, 129, and 142); event 12 on SBD-DC01 is expected, because the PDC emulator serves its own clock. The Linux servers report through chronyd in the syslog stream: which source they selected, or that none was selectable.
- [ ] Save each as a report with its question, owner, the events it depends on, and a known event it must find, and have an sbd_admin share it with the analysts read-only: a wrong password for your Tier 1 account at SBD-ADMIN-SRV01's sign-in screen for search one, a probe of an unregistered port for search two, and a chronyd restart on SBD-SPLUNK01 for search three. Cause each, run each search, and keep the result: lesson 5 turns them into alerts.

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

- [ ] Write the alert register before building anything: for each alert, its search, threshold, schedule, severity, named responder with a deputy, and written first response. The threshold, schedule, throttle and expiration of each alert depend on your environment and policy, so record the value you chose and why. Start from lesson 4's searches: any failed sign-in for a tier account, since privileged sign-ins are few and each failure deserves a look; any deny from VLAN 80 toward VLAN 60 or from VLAN 60 itself, whose seats use only registered paths, or a burst of denies from one source above the count and window you record; and Time-Service events 36, 129, or 142, or chronyd finding no selectable source (never event 12, which SBD-DC01 writes by design). Add any use of a sealed account: course 1.8's break-glass account signing in anywhere, as that course promised, and Splunk's own admin account signing in to Splunk.
- [ ] Add the conditions course 1.10's daily check has watched by hand (AU-5): no Windows events at all for longer than the silence threshold you record, which means the collector, its forwarder, or rule F10 has stopped, and a known source quiet past its own limit, taken from a lookup of expected sources (each host as Splunk shows it, with the longest quiet it may have). Add course 1.11's repository findings: SBD-Repository events 1001 and 1101 from SBD-AUDIT01, refused access to its archive (event 4656 with an audit failure), and any deletion (event 4660), which the responder matches to an approved retention run. Splunk sees missing data, not disks: the collector's free space and its buffer's oldest event stay in the daily check.
- [ ] Build each as a scheduled alert owned by sbd_admin, the ones on the domain controllers from AdminJumpBox01: a cron schedule and a search window by index time, the window longer than the interval between runs (earliest=-24h _index_earliest=-<window>), so events that arrive late after an outage are still checked, a trigger when the number of results is greater than zero (so a missing-data search, such as the silence alert, is written to return a row only when its count is zero), throttling on the field that names one problem (the account, the source) for the period you record, a severity, and the Add to Triggered Alerts action. This network has no mail server, so the Triggered Alerts list is the responder's queue, and it keeps each entry for 24 hours by default: set each alert's expiration to cover the longest gap between reviews in your environment, so a weekend can't empty it, and record the value. Name every alert SBD - <condition>, so the register, the queue, and the scheduler's log use the same names.
- [ ] Test each alert by causing its condition where that is safe, and record when you caused it, when it fired, and who saw it: one wrong password for your Tier 1 account at SBD-ADMIN-SRV01's sign-in screen, a probe of an unregistered port from SBD-ADMIN-SRV01 across the core, and the SplunkForwarder service stopped on SBD-SYSLOG01 for longer than the silence threshold, which also shows the backlog arriving without a gap once it restarts. Where a condition can't be caused safely, such as a repository mismatch or a break-glass sign-in, run the alert's search over a window that holds a real or test example instead.
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
# The pipeline test, on SBD-SYSLOG01 (Tier 1 session): stop the forwarder past the silence threshold
Stop-Service SplunkForwarder; Start-Sleep -Seconds <silence threshold plus one run interval, in seconds>; Start-Service SplunkForwarder
```

**Verify:** Every alert in the register has a recorded threshold, schedule, expiration, severity, responder with deputy, and written first response; each safe condition fired its alert in a test, with the cause and the alert's time recorded; the forwarder stop fired the pipeline alert and its backlog arrived without a gap; and the first daily and weekly reviews are on record.

**Evidence:** Keep the alert register, the listing of the alerts as built, each test's cause-and-fire record, the seven-day tuning counts with any changes, and the first review records.

Notes / result / date: __________________________

## Prove the chain and hand off

- [ ] Generate the test event: one failed sign-in on SBD-DC01 with a wrong password for a tier admin account. From AdminJumpBox01, record its time, account, and event ID in the DC's Security log, then find the same event in ForwardedEvents on SBD-SYSLOG01 with MachineName SBD-DC01 and the same time, about 30 seconds after it happened.
- [ ] Watch analysis catch it: the event appears in sbd_wineventlog with host SBD-DC01 and the same time, and the privileged sign-in alert fires on its next run. The responder sees it in the Triggered Alerts list and records the first response as written — the alert is part of the trace, not an extra.
- [ ] The next morning, after course 1.11's 01:00 run has archived the event's completed UTC day, open that day's ForwardedEvents archive on SBD-AUDIT01 in an auditor's or the custodian's session, confirm its catalog line shows matching hashes, and read the event with Get-WinEvent -Path. Four places, one event, and the same source time in each: that is the chain working.
- [ ] Repeat with the boundary on the analysis side: probe one unregistered port from SBD-ADMIN-SRV01 as course 1.10 did, which already traced the deny to the collector over rule F24, and find it in search two with the boundary alert firing for a deny from VLAN 60. Attempt, deny, and alert now form one evidence set.
- [ ] Run the cadence: take SBD-SPLUNK01's first SCAP baseline the way course 1.9 scans every Linux server. Over your Tier 1 SSH session, copy SCC for Linux and the distribution's STIG benchmark from C:\Staging\DISA\linux, check their hashes on the host, install SCC as its readme directs, and run it as root with the benchmark and the profile course 1.4 recorded. Answer DISA's Splunk Enterprise STIG for the application in a STIG Viewer checklist on SBD-ADMIN-SRV01: lesson 3's record answers most items with the setting and the btool line that shows it, and carries the items met another way with their reasons. Classify every remaining open item as course 1.4 taught, adapted for Linux as in course 1.9 — fix now (no GPO applies to Linux), deviation candidate, or POA&M candidate — and store the session under C:\Evidence\splunk-analysis\baseline\SBD-SPLUNK01 with hashes.
- [ ] Write SBD-SPLUNK01's upgrade procedure, because the STIG asks for a version the vendor still supports and Splunk doesn't arrive through SBD-REPO01. Record splunk version against Splunk's support policy. For each upgrade: stage the new .tgz, and the forwarder's .msi, hashed as in course 1.4; read Splunk's notes on upgrading to that version first; confirm course 1.19 holds a current copy of /opt/splunk/etc; stop Splunk, extract over /opt as the same owner, refresh fapolicyd's trust (fapolicyd-cli --file update, then --update), start with --accept-license --answer-yes, and repeat lesson 2's count check. Splunk has no downgrade: going back means reinstalling the old version and restoring its configuration. When endpoint protection reaches this host, exclude /opt/splunk, /srv/splunk, and Splunk's processes from on-access scanning, as Splunk advises.
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
# The version the upgrade procedure starts from
sudo -u splunk /opt/splunk/bin/splunk version
# On SBD-ADMIN-SRV01: collect the session, then hash the course's evidence
New-Item -ItemType Directory -Force C:\Evidence\splunk-analysis\baseline | Out-Null
scp -r <your-account>@SBD-SPLUNK01.sbd.test:<SCC session folder> C:\Evidence\splunk-analysis\baseline\SBD-SPLUNK01
Get-ChildItem C:\Evidence\splunk-analysis -Recurse -File | Get-FileHash -Algorithm SHA256
```

**Verify:** The test event appears on SBD-DC01, in ForwardedEvents, in Splunk with its alert fired, and in the next morning's archive with matching catalog hashes, all with the same source time; the probe's deny appears in search two and fired its alert; SBD-SPLUNK01 has its first baseline and a Splunk STIG checklist that answers lesson 3's items and classifies every open one; and the upgrade procedure is written, starting from a version the vendor supports.

**Evidence:** Keep the four-place trace of the test event with its timestamps and the alert's record, the deny with its alert, SBD-SPLUNK01's scan set and checklist with hashes, the upgrade procedure with the current version, and the handoff note to course 1.13.

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
- [Splunk · Validated Architectures: Single Server Deployment (S1)](https://help.splunk.com/en/data-management/splunk-validated-architectures/splunk-platform-indexing-and-search/single-server-deployment-s1)
- [Splunk · Reference hardware](https://help.splunk.com/en/splunk-enterprise/get-started/deployment-capacity-manual/10.2/performance-reference/reference-hardware)
- [Splunk · System requirements for use of Splunk Enterprise on-premises](https://docs.splunk.com/Documentation/Splunk/9.4.0/Installation/Systemrequirements)
- [Splunk · Transparent huge memory pages and Splunk performance](https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.2/known-issues-for-this-release/transparent-huge-memory-pages-and-splunk-performance)
- [Splunk · Run Splunk Enterprise as a systemd service](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.0/start-splunk-enterprise-and-perform-initial-tasks/run-splunk-enterprise-as-a-systemd-service)
- [Splunk · Manage data integrity](https://docs.splunk.com/Documentation/Splunk/9.4.0/Security/Dataintegritycontrol)
- [Splunk · Customize the login page](https://help.splunk.com/en/splunk-enterprise/developing-views-and-apps-for-splunk-web/10.2/customize-splunk-web/customize-the-login-page)
- [Splunk · Configure user session timeouts](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/manage-users/configure-user-session-timeouts)
- [Splunk · global-banner.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.0/configuration-file-reference/10.0.2-configuration-file-reference/global-banner.conf)
- [Splunk · Configure a password policy with authentication.conf](https://docs.splunk.com/Documentation/Splunk/9.4.0/Security/Configurepasswordsinspecfile)
- [Splunk · Set limits on disk usage](https://docs.splunk.com/Documentation/Splunk/9.4.0/Indexer/Setlimitsondiskusage)
- [Splunk · Configure the splunkd health report](https://help.splunk.com/en/splunk-enterprise/administer/monitor/10.0/proactive-splunk-component-monitoring-with-the-splunkd-health-report/configure-the-splunkd-health-report)
- [Splunk · Single-instance Monitoring Console setup steps](https://help.splunk.com/en/splunk-enterprise/administer/monitor/10.0/configure-the-monitoring-console/single-instance-monitoring-console-setup-steps)
- [Splunk · Auditing activities in a Splunk platform instance](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.0/audit-activity-in-splunk-enterprise/auditing-activities-in-a-splunk-platform-instance)
- [Splunk · Upgrade on UNIX](https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/upgrade-on-unix)
- [Splunk · Splunk Enterprise and anti-virus products](https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.2/known-issues-for-this-release/splunk-enterprise-and-anti-virus-products)
- [Red Hat · Integrating RHEL systems directly with Windows Active Directory](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/integrating_rhel_systems_directly_with_windows_active_directory/index)
- [Red Hat · Configuring kernel command-line parameters (RHEL 9)](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_monitoring_and_updating_the_kernel/configuring-kernel-command-line-parameters_managing-monitoring-and-updating-the-kernel)
- [Red Hat · Blocking and allowing applications by using fapolicyd (RHEL 9)](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/assembly_blocking-and-allowing-applications-using-fapolicyd_security-hardening)
- [Red Hat · Troubleshooting problems related to SELinux (RHEL 9)](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/troubleshooting-problems-related-to-selinux_using-selinux)
- [Microsoft · Use Windows Event Forwarding to help with intrusion detection](https://learn.microsoft.com/en-us/windows/security/threat-protection/use-windows-event-forwarding-to-assist-in-intrusion-detection)
- [Microsoft · Wecutil (Windows Event Collector)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wecutil)
- [Microsoft · Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent)
- [DISA · Security Content Automation Protocol (SCC and SCAP benchmarks)](https://www.cyber.mil/stigs/SCAP/)
- [DISA · STIGs document library (operating system and Splunk Enterprise STIGs)](https://www.cyber.mil/stigs/downloads)
- [DISA · SRG/STIG tools (SCC and STIG Viewer)](https://www.cyber.mil/stigs/srg-stig-tools)
- [NIST · SP 800-53 Rev. 5 security controls (AU family)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

© 2026 Secure By Design Team LLC
