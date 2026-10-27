#!/usr/bin/env python3
"""Writes content/range/questions.json for the Cyber Range (owner direction, 26 October 2026).

Each entry below lists the correct option first; the writer scrambles the order per question (seeded by the id)
so the answer letter varies. Facts come from the System Hub's design (sbd.test, SBD-DC01 as PDC emulator and
time source, pki.sbd.test on VLAN 30 from SBD-PKI-MGMT01, single Splunk/Nessus/ePO instances on an air-gapped
network) and from vendor documentation; nothing names a hardware make or model.
"""
import json, random, sys

IF = '/training/identity-foundation/?part='
Q = []
def q(id, system, type_, difficulty, move, prompt, options, explanation, lesson='', source='System Hub'):
    assert len(options) == 4, id
    Q.append(dict(id=id, system=system, type=type_, difficulty=difficulty, move=move, prompt=prompt,
                  options=options, explanation=explanation, lesson=lesson, source=source))

# SBD-DC01 ------------------------------------------------------------------------------------------------
q('dc1-001','sbd-dc01','Identity','easy','fsmo-check',
  'Which FSMO role makes SBD-DC01 the time source for the whole domain?',
  ['PDC emulator','RID master','Infrastructure master','Schema master'],
  'The PDC emulator sits at the top of the domain time hierarchy. SBD-DC02 and every member sync from it; there is no separate time server in this lab.',
  IF+'time')
q('dc1-002','sbd-dc01','Identity','easy','fsmo-check',
  'How many FSMO roles does a single-domain forest have?',
  ['Five','Three','Seven','Two'],
  'Schema master, domain naming master, RID master, PDC emulator and infrastructure master. All five can sit on SBD-DC01.',
  IF+'dc')
q('dc1-003','sbd-dc01','Identity','easy','fsmo-check',
  'Where do you check which domain controller holds the PDC emulator role in a console?',
  ['Active Directory Users and Computers, Operations Masters','DNS Manager','Group Policy Management','Server Manager, Roles'],
  'Right-click the domain in Active Directory Users and Computers and open Operations Masters; the PDC tab names the holder.',
  IF+'dc')
q('dc1-004','sbd-dc01','Identity','hard','replication-storm',
  'Replication between SBD-DC01 and SBD-DC02 fails with "The target principal name is incorrect." What is the most likely cause?',
  ['A Kerberos problem, such as clock skew or a domain controller machine account password out of sync','DNS scavenging removed the zone','The RID pool ran out','The two controllers are in different sites'],
  'That error is Kerberos failing to authenticate the replication partner. Check time on both controllers first, then the machine account password.',
  IF+'dc')
q('dc1-005','sbd-dc01','Identity','hard','replication-storm',
  'Which command summarizes replication failures across every domain controller at once?',
  ['repadmin /replsummary','ipconfig /flushdns','gpupdate /force','nltest /dsgetdc'],
  'repadmin /replsummary lists each controller with its largest delta and failure count. Active Directory Sites and Services shows the same partners in the console.',
  IF+'dc')
q('dc1-006','sbd-dc01','Identity','hard','replication-storm',
  'SBD-DC02 is restored from a backup older than the tombstone lifetime. What is the right outcome?',
  ['Treat it as unsafe: demote or forcibly remove it and promote it again','It replicates normally once it boots','It becomes the PDC emulator','Replication catches up faster than usual'],
  'A controller that missed deletions older than the tombstone lifetime can reintroduce lingering objects. It is removed and promoted fresh rather than trusted.',
  IF+'dc')
q('dc1-007','sbd-dc01','Trust','easy','time-sync',
  'Where does SBD-DC02 get its time?',
  ['From SBD-DC01, the PDC emulator','From its own hardware clock','From the L3 router','From a separate time server'],
  'The lab has no separate time server. The second controller and every domain member follow the domain hierarchy up to the PDC emulator.',
  IF+'time')
q('dc1-008','sbd-dc01','Trust','medium','time-sync',
  'Which command shows the time source a domain member is actually using?',
  ['w32tm /query /source','net time /set','nslookup','tzutil /g'],
  'w32tm is the supported tool for the Windows Time service. /query /source names the peer the member follows; /query /status shows the offset.',
  IF+'time')
q('dc1-009','sbd-dc01','Trust','medium','time-sync',
  'How far apart can two clocks be before Kerberos stops working, by default?',
  ['5 minutes','30 seconds','1 hour','24 hours'],
  'The default maximum tolerance is five minutes. Past that, tickets are rejected and sign-ins fail even though the password is right.',
  IF+'time')
q('dc1-010','sbd-dc01','Visibility','medium','event-trail',
  'Which log on a domain controller records a successful domain sign-in?',
  ['The Security log, event 4624','The Application log','The System log','The Setup log'],
  'Sign-ins, sign-outs and lockouts are Security log events. 4624 is a successful logon; 4625 a failed one; 4740 a lockout.',
  IF+'dc')

# SBD-DC02 ------------------------------------------------------------------------------------------------
q('dc2-001','sbd-dc02','Identity','easy','site-link',
  'Why do the two domain controllers run on different hosts?',
  ['So one host failing still leaves a domain controller and a DNS server running','Licensing requires it','Replication only works between hosts','DHCP needs two hosts'],
  'The lab places SBD-DC01 and SBD-DC02 on separate hosts so the directory and DNS survive a host outage.',
  IF+'dc')
q('dc2-002','sbd-dc02','Identity','easy','site-link',
  'What does SBD-DC02 add that SBD-DC01 alone does not?',
  ['A second copy of the directory and a second DNS server','The PDC emulator role','The certification authority','The time source'],
  'SBD-DC02 is a replica. The PDC emulator, the time source and the CA stay where they are.',
  IF+'dc')
q('dc2-003','sbd-dc02','Identity','easy','site-link',
  'Within one site, how soon does a change on SBD-DC01 reach SBD-DC02 by default?',
  ['Within seconds, after a change notification','Once a day','Every 180 minutes','Only when an administrator forces it'],
  'Intra-site replication is notification-based: a controller tells its partners shortly after a change and they pull it.',
  IF+'dc')
q('dc2-004','sbd-dc02','Identity','hard','tombstone',
  'What is the default tombstone lifetime for a forest created on current Windows Server versions?',
  ['180 days','60 days','30 days','365 days'],
  'Forests created on Windows Server 2003 SP1 or later default to 180 days. Older forests may still carry 60.',
  IF+'dc')
q('dc2-005','sbd-dc02','Identity','hard','tombstone',
  'Why must a backup used to restore a domain controller be younger than the tombstone lifetime?',
  ['So deletions made since the backup are still known as tombstones and lingering objects cannot reappear','Backups expire after that','Kerberos tickets in the backup expire','The RID pool resets'],
  'Once tombstones are garbage-collected, a restored controller has no record of those deletions and would replicate the objects back.',
  IF+'dc')
q('dc2-006','sbd-dc02','Resolution','easy','zone-transfer',
  'Where do the sbd.test DNS zones live in this lab?',
  ['On both domain controllers, as Active Directory-integrated zones','On the L3 router','On SBD-PKI-MGMT01','On Splunk'],
  'DNS runs on the domain controllers. Integrated zones are stored in the directory and replicated with it.',
  IF+'dns')
q('dc2-007','sbd-dc02','Resolution','easy','zone-transfer',
  'How do Active Directory-integrated zones reach SBD-DC02?',
  ['Through directory replication, not a classic zone transfer','Through AXFR on TCP 53 only','They do not; each controller keeps its own zone','Through DHCP'],
  'Integrated zones ride along with replication, so every controller running DNS holds a writable copy.',
  IF+'dns')
q('dc2-008','sbd-dc02','Identity','medium','sysvol-sync',
  'What does SYSVOL hold that every domain controller must agree on?',
  ['Group Policy templates and logon scripts','The DNS zones','User passwords','Issued certificates'],
  'SYSVOL carries the Group Policy template files and scripts that clients read. If it differs between controllers, policy applies inconsistently.',
  IF+'gpo')
q('dc2-009','sbd-dc02','Identity','medium','sysvol-sync',
  'Which service replicates SYSVOL between domain controllers on current domains?',
  ['DFS Replication','File Replication Service','Robocopy','Windows Update'],
  'Current domains use DFS Replication for SYSVOL; the older File Replication Service was retired.',
  IF+'gpo')
q('dc2-010','sbd-dc02','Identity','medium','sysvol-sync',
  'A GPO applies to clients talking to SBD-DC01 but not to those talking to SBD-DC02. Which console check comes first?',
  ['Group Policy Management, the GPO Status tab, for SYSVOL and directory replication state','DNS Manager','Certification Authority','Services'],
  'The Status tab compares the GPO on every controller and shows which copy is behind.',
  IF+'gpo')

# L3 router -----------------------------------------------------------------------------------------------
q('rtr-001','l3-router','Network','easy','dhcp-relay',
  'Why does the router need a DHCP relay for workstations on their own VLAN?',
  ['A DHCP discover is a broadcast that does not cross VLANs; the relay forwards it to the DHCP server','DHCP needs TCP','The router is the DHCP server','Workstations need static addresses'],
  'Broadcasts stop at the VLAN boundary. The relay, often called an IP helper, turns the discover into a unicast to the server.',
  IF+'dhcp')
q('rtr-002','l3-router','Network','easy','dhcp-relay',
  'Which UDP ports does DHCP use?',
  ['67 on the server and 68 on the client','53','80 and 443','123'],
  'DHCP servers listen on UDP 67; clients on UDP 68. The relay must be allowed to reach 67 on the server.',
  IF+'dhcp')
q('rtr-003','l3-router','Network','easy','dhcp-relay',
  'What does the DHCP "router" option hand a workstation?',
  ['Its default gateway, the L3 router interface on its VLAN','Its DNS server','Its hostname','The certification authority'],
  'Option 3 is the default gateway. The DNS servers come from option 6, and both have to be right for the domain to work.',
  IF+'dhcp')
q('rtr-004','l3-router','Network','hard','inter-vlan-rule',
  'A workstation on VLAN 20 pings SBD-DC01, but certificate enrollment against pki.sbd.test on VLAN 30 times out. DNS resolves the name. Which rule fixes it?',
  ['Permit TCP 80 and 443 from VLAN 20 to VLAN 30','Permit everything from VLAN 30 to VLAN 20','Add a static route to VLAN 30','Add a DHCP relay on VLAN 30'],
  'Enrollment and CRL checks use HTTP and HTTPS to the publication point. The router is the hop that has to allow them.',
  IF+'pki')
q('rtr-005','l3-router','Network','hard','inter-vlan-rule',
  'Which ports must a domain member reach on a domain controller for Kerberos and LDAP?',
  ['TCP and UDP 88, and TCP 389','TCP 80 and 443','UDP 123 only','TCP 3389'],
  'Kerberos uses 88 over both TCP and UDP; LDAP uses TCP 389 (636 for LDAPS). Blocking either breaks sign-in.',
  IF+'dc')
q('rtr-006','l3-router','Network','hard','inter-vlan-rule',
  'Splunk forwarders stop delivering after a rule change. Which port does forwarder-to-indexer traffic use by default?',
  ['TCP 9997','UDP 514','TCP 8000','TCP 443'],
  'Universal forwarders send to the indexer on TCP 9997 unless changed. 8000 is the web interface and 8089 the management port.',
  '', 'Vendor documentation')
q('rtr-007','l3-router','Network','medium','route-table',
  'When a router has several routes to a destination, which one does it use?',
  ['The most specific match, the longest prefix','The one listed first','The one with the highest metric','Always the default route'],
  'Longest prefix wins. Only when two routes match equally do administrative distance and metric decide.',
  '', 'Vendor documentation')
q('rtr-008','l3-router','Network','medium','route-table',
  'What should the default route do in this air-gapped lab?',
  ['Nothing should leave the enclave; there is no path out','Send traffic to the internet','Point at SBD-DC01','Point at the certification authority'],
  'The network is fully air-gapped. Transfers across the boundary are manual, on approved removable media.')
q('rtr-009','l3-router','Network','medium','isolate',
  'Which action isolates a compromised VLAN while the rest of the network keeps working?',
  ['A deny rule for that VLAN on the router\u2019s inter-VLAN interfaces','Powering off SBD-DC01','Deleting the DNS zone','Stopping DHCP'],
  'The router is the only path between VLANs, so a deny rule there contains the segment without touching the servers.')
q('rtr-010','l3-router','Network','medium','isolate',
  'If the router blocks a workstation VLAN from reaching the domain controllers, what fails first?',
  ['Sign-in, because Kerberos and LDAP cannot reach a controller','Printing','Time, because the clock stops','Nothing'],
  'Cached credentials may still let a user in, but new sign-ins, Group Policy and DNS all depend on reaching a controller.',
  IF+'dc')

# SBD-PKI-MGMT01 ------------------------------------------------------------------------------------------
q('pki-001','sbd-pki-mgmt01','Trust','easy','autoenroll',
  'Where is certificate auto-enrollment turned on for domain computers?',
  ['Group Policy: Computer Configuration, Policies, Windows Settings, Security Settings, Public Key Policies','DNS Manager','The certification authority\u2019s properties only','Each workstation\u2019s control panel'],
  'The Certificate Services Client, Auto-Enrollment policy under Public Key Policies enables it for every computer the GPO reaches.',
  IF+'pki')
q('pki-002','sbd-pki-mgmt01','Trust','easy','autoenroll',
  'What must a certificate template grant domain computers for auto-enrollment to work?',
  ['Read, Enroll and Autoenroll permissions','Full control','Read only','No permissions are needed'],
  'All three are checked on the template\u2019s Security tab for the computers\u2019 group. Missing Autoenroll is the most common gap.',
  IF+'pki')
q('pki-003','sbd-pki-mgmt01','Trust','easy','autoenroll',
  'Which console shows the certificates a workstation itself has been issued?',
  ['certlm.msc, the local computer certificate store','certmgr.msc, the current user store','DNS Manager','Event Viewer'],
  'The local computer store under Personal holds machine certificates. The user store holds the signed-in user\u2019s.',
  IF+'pki')
q('pki-004','sbd-pki-mgmt01','Trust','hard','chain-of-trust',
  'In a two-tier PKI, why is the root CA kept offline?',
  ['Its key signs the issuing CA; keeping it offline limits exposure of the trust anchor','It is slower than the issuing CA','Windows requires it','To save licenses'],
  'If the root is compromised, every certificate below it is suspect. The issuing CA does the daily work; the root only signs it.',
  IF+'pki')
q('pki-005','sbd-pki-mgmt01','Trust','hard','chain-of-trust',
  'A workstation reports "the certificate chain could not be built to a trusted root." What is most likely missing?',
  ['The root or issuing CA certificate in its trust stores, usually published through the directory or Group Policy','A DHCP lease','Its hostname','The PDC emulator'],
  'Clients need the root in Trusted Root Certification Authorities and the issuing CA in Intermediate. Publishing to the directory places them automatically.',
  IF+'pki')
q('pki-006','sbd-pki-mgmt01','Trust','hard','chain-of-trust',
  'Why does certificate validation depend on the clock?',
  ['Validity periods and the CRL\u2019s next-update time are checked against the current time','Certificates are issued by the time service','Kerberos issues the certificates','It does not'],
  'A machine whose clock drifts past a certificate\u2019s validity window, or past the CRL\u2019s next update, fails validation even though nothing was revoked.',
  IF+'time')
q('pki-007','sbd-pki-mgmt01','Trust','medium','crl-refresh',
  'What does a certificate revocation list contain?',
  ['The serial numbers of revoked certificates, signed by the CA','Every certificate the CA issued','The CA\u2019s private key','The certificate templates'],
  'Clients download the CRL from the publication point and refuse any certificate whose serial number appears on it.',
  IF+'pki')
q('pki-008','sbd-pki-mgmt01','Trust','medium','crl-refresh',
  'Where is the CRL published in this lab?',
  ['As a web service at pki.sbd.test on VLAN 30, from SBD-PKI-MGMT01','On the offline root CA','In SYSVOL on SBD-DC01','On the L3 router'],
  'PKI publication is a VLAN 30 web service on SBD-PKI-MGMT01. The issuing CA and the root stay on their own hosts.')
q('pki-009','sbd-pki-mgmt01','Network','medium','publish',
  'What does the CDP extension in a certificate point to?',
  ['Where to download the CRL, such as a URL under pki.sbd.test','The DNS server','The domain controller','The time source'],
  'The CRL distribution point tells the client where to fetch revocation data; the AIA extension points to the CA certificate.',
  IF+'pki')
q('pki-010','sbd-pki-mgmt01','Network','medium','publish',
  'What has to be true for a VLAN 20 workstation to check revocation?',
  ['It can resolve pki.sbd.test and reach it over HTTP on VLAN 30','It is signed in as a domain admin','It runs the CA role','Nothing; revocation is checked on the CA'],
  'Revocation checking is a client-side download. Name resolution and the router rule are both in the path.')

# Splunk --------------------------------------------------------------------------------------------------
q('spl-001','splunk','Visibility','easy','index-search',
  'Which Windows event shows an account lockout?',
  ['Security log event 4740','Security log event 4624','System log event 6005','Application log event 1000'],
  '4740 is logged on the PDC emulator when an account is locked out. 4624 is a successful logon.',
  IF+'dc')
q('spl-002','splunk','Visibility','easy','index-search',
  'What does an index do in Splunk?',
  ['Stores events so searches can find them by time and field','Blocks traffic','Issues certificates','Assigns addresses'],
  'Events land in an index; searches run against it. Retention and access are set per index.',
  '', 'Vendor documentation')
q('spl-003','splunk','Visibility','easy','index-search',
  'Which event code finds failed Windows sign-ins?',
  ['4625','4624','4740','4688'],
  '4625 is a failed logon. 4688 is process creation, useful for a different question.',
  IF+'dc')
q('spl-004','splunk','Network','hard','forwarder-down',
  'A domain controller stops appearing in Splunk after a VLAN rule change. Which port must its forwarder reach?',
  ['TCP 9997 on the indexer','UDP 514','TCP 8089','TCP 8000'],
  'Receiving is on TCP 9997 by default. 8089 is the management port the deployment server uses; 8000 is the web interface.',
  '', 'Vendor documentation')
q('spl-005','splunk','Network','hard','forwarder-down',
  'The forwarder runs as a domain account and the Security log stops arriving while other logs continue. What is the gap?',
  ['The account lacks rights to read the Security log, such as Event Log Readers membership','The disk is full','The time zone is wrong','DHCP expired'],
  'The Security log needs explicit read rights. Event Log Readers, or the Manage auditing and security log right, grants them.',
  '', 'Vendor documentation')
q('spl-006','splunk','Network','hard','forwarder-down',
  'Splunk runs on domain-joined Linux in this lab. What does joining the domain give it?',
  ['Kerberos sign-in for administrators and a trusted hostname in DNS','Faster indexing','A certificate automatically','A DHCP reservation'],
  'Domain-joined Linux lets administrators use their directory accounts and gives the host a registered name the forwarders can trust.')
q('spl-007','splunk','Visibility','medium','retention',
  'What decides how long events stay searchable?',
  ['The index\u2019s retention settings: maximum size and maximum age','The forwarder','The domain controller','DNS'],
  'Each index has a size cap and an age limit. When either is hit, the oldest bucket is frozen, deleted or archived.',
  '', 'Vendor documentation')
q('spl-008','splunk','Visibility','medium','retention',
  'Events are to stay searchable for 90 days, then be archived. Where is that configured?',
  ['In the index\u2019s settings on the indexer','On each forwarder','In Group Policy','In DNS'],
  'Retention is an index property on the indexer; forwarders only ship events.',
  '', 'Vendor documentation')
q('spl-009','splunk','Visibility','medium','alert',
  'Ten failed sign-ins against one account within five minutes should raise an alert. Which Splunk feature does that?',
  ['A scheduled saved search with an alert condition','A dashboard panel','A lookup table','A new index'],
  'Alerts are saved searches on a schedule with a trigger condition, such as a count over a threshold per account.',
  '', 'Vendor documentation')
q('spl-010','splunk','Visibility','medium','alert',
  'Why forward the domain controllers\u2019 Security log, not just the System log?',
  ['Sign-ins, lockouts and privilege use are recorded in the Security log','The System log is larger','The Application log holds sign-ins','There is no difference'],
  'The System log covers services and drivers. Account activity, the thing a security team watches, is in the Security log.',
  IF+'dc')

# Nessus --------------------------------------------------------------------------------------------------
q('nes-001','nessus','Visibility','easy','scan-sweep',
  'What does a discovery scan find?',
  ['Live hosts and their open ports','Group Policy objects','Certificates','User passwords'],
  'Discovery maps what is on the network before a vulnerability scan looks deeper at each host.',
  '', 'Vendor documentation')
q('nes-002','nessus','Visibility','easy','scan-sweep',
  'Why does the scanner run inside the enclave rather than from outside?',
  ['The network is air-gapped; there is no path in from outside','It is faster','Licensing requires it','Nessus only scans local hosts'],
  'Nothing crosses the air gap automatically, so the scanner lives on the network it assesses.')
q('nes-003','nessus','Visibility','easy','scan-sweep',
  'What does the CVSS score on a finding express?',
  ['How severe the vulnerability is, from 0 to 10','How old the finding is','The host\u2019s uptime','How long the scan took'],
  'CVSS rates severity. The plugin output says what was found; the score helps decide what to fix first.',
  '', 'Vendor documentation')
q('nes-004','nessus','Identity','hard','credentialed-scan',
  'Why does a credentialed scan find more than an unauthenticated one?',
  ['It signs in and checks installed software, patches and settings directly','It scans more ports','It runs longer','It uses more bandwidth'],
  'Without credentials the scanner can only infer from the outside. With them it reads the host\u2019s own state.',
  '', 'Vendor documentation')
q('nes-005','nessus','Identity','hard','credentialed-scan',
  'Which account design fits a Windows credentialed scan in a tiered administration model?',
  ['A dedicated scan account with local administrator rights on the hosts it scans, never a Domain Admin','The Domain Admin account','The administrator\u2019s own account','The Guest account'],
  'A scanning account touches every host, so it is kept out of the top tier and limited to what the scan needs.',
  IF+'tier')
q('nes-006','nessus','Identity','hard','credentialed-scan',
  'A credentialed scan of the domain controllers reports a sign-in failure although the password is right. Which lab fact matters first?',
  ['Time: if the scanner\u2019s clock drifts from the domain, Kerberos rejects it','The CA has not issued it a certificate','Its DHCP lease expired','It sits on VLAN 30'],
  'Nessus is domain-joined Linux here, so it follows the domain time hierarchy. More than five minutes of skew and Kerberos refuses the login.',
  IF+'time')
q('nes-007','nessus','Visibility','medium','plugin-update',
  'How do plugin updates reach an air-gapped scanner?',
  ['Downloaded outside, moved in on approved removable media, and applied offline','Over the internet automatically','They never update','Through the domain controller'],
  'Every transfer across the boundary is manual and human-controlled. Plugins, content and patches all come in the same way.')
q('nes-008','nessus','Visibility','medium','plugin-update',
  'Why does plugin age matter?',
  ['New vulnerabilities are not detected until the plugins that check for them arrive','Scans fail outright','The license expires','The host slows down'],
  'A scan is only as current as its plugins. The date of the last update is part of the evidence.',
  '', 'Vendor documentation')
q('nes-009','nessus','Visibility','medium','false-positive',
  'How is a confirmed false positive handled?',
  ['Documented and marked so later reports exclude it, with the evidence kept','Deleted quietly','Ignored','Patched anyway'],
  'A finding can be wrong, but the decision to dismiss it is itself evidence. It stays on record with the reason.')
q('nes-010','nessus','Visibility','medium','false-positive',
  'What does a compliance scan against a STIG give you?',
  ['A pass or fail per check against the host\u2019s configuration','A certificate','A Group Policy object','A DNS record'],
  'Compliance audits compare settings to the benchmark. Vulnerability plugins and compliance checks are different scan types.',
  IF+'stig')

# ePO -----------------------------------------------------------------------------------------------------
q('epo-001','epo','Endpoint','easy','agent-push',
  'What does the management agent on an endpoint do?',
  ['Talks to ePO to pull policies and report status','Issues certificates','Resolves names','Routes packets'],
  'The agent is the endpoint\u2019s side of the conversation. No agent, no policy and no reporting.',
  '', 'Vendor documentation')
q('epo-002','epo','Endpoint','easy','agent-push',
  'How can the agent reach every domain-joined workstation at once?',
  ['Deploy it through Group Policy or an ePO push using domain credentials','Email it to each user','Carry it on a USB drive to each machine','Hand it out through a DHCP option'],
  'Both routes lean on the directory: Group Policy software installation, or a push that signs in with a domain account.',
  IF+'gpo')
q('epo-003','epo','Endpoint','easy','agent-push',
  'Why is there one ePO instance in this lab?',
  ['One enclave, one console: its policies and repository cover every endpoint','Licensing allows only one','It only runs on Linux','One per VLAN is not allowed'],
  'The lab keeps Splunk, Nessus and ePO as single instances. The System Hub shows where each one sits.')
q('epo-004','epo','Identity','hard','policy-enforce',
  'An endpoint still shows the old policy after a change. Which agent action comes first?',
  ['An agent wake-up: collect and send properties, then enforce policies','Reboot the endpoint','Re-image the endpoint','Remove it from the system tree'],
  'The agent polls on its interval. A wake-up forces the conversation now, and the policy enforcement follows.',
  '', 'Vendor documentation')
q('epo-005','epo','Identity','hard','policy-enforce',
  'Why synchronize the ePO system tree with Active Directory?',
  ['So endpoints are grouped by organizational unit and policies follow the directory structure','For DNS','For time','For certificates'],
  'A tree that mirrors the OUs lets one policy assignment cover the right machines, the same way a GPO link does.',
  IF+'gpo')
q('epo-006','epo','Identity','hard','policy-enforce',
  'A policy assigned to a parent group never reaches a child group. Why?',
  ['Inheritance was broken on the child group','DNS is misconfigured','The agent is out of date','The VLAN rule blocks it'],
  'Policies inherit down the tree unless a group breaks inheritance. Check the child group\u2019s assigned policies for the override.',
  '', 'Vendor documentation')
q('epo-007','epo','Endpoint','medium','repository-sync',
  'How does an air-gapped ePO get content and engine updates?',
  ['Pulled outside, moved in on approved removable media, and checked into the master repository','Over the internet','From the domain controller','From Splunk'],
  'Same rule as plugins and patches: a human carries it across the boundary, then it is checked in.')
q('epo-008','epo','Endpoint','medium','repository-sync',
  'What does a distributed repository do?',
  ['Serves content to endpoints nearer to them and takes load off the ePO server','Issues policies','Stores logs','Routes packets'],
  'Repositories hold content; the master is the source of truth and distributed copies serve it out.',
  '', 'Vendor documentation')
q('epo-009','epo','Endpoint','medium','quarantine',
  'What does a quarantine or isolation policy do to a suspect endpoint?',
  ['Blocks its traffic except to ePO so it can be investigated','Deletes its files','Reboots it','Removes the agent'],
  'The host stays reachable by the management server and nothing else, which keeps the evidence and stops the spread.',
  '', 'Vendor documentation')
q('epo-010','epo','Endpoint','medium','quarantine',
  'Which evidence shows the agent on a host is current?',
  ['Its last communication time and version in the system tree','A DNS record','A certificate','Nothing shows it'],
  'The system tree lists each managed host with the agent version and the last time it checked in.',
  '', 'Vendor documentation')

# RMF, asked by signoff -----------------------------------------------------------------------------------
R = lambda id, prompt, options, expl: q(id,'rmf','Authorization', 'medium' if int(id[-3:]) % 3 else 'hard', 'rmf', prompt, options, expl, '/grc-rmf-training', 'NIST SP 800-37 Rev. 2, SP 800-53 Rev. 5, the 2016 JSIG')
R('rmf-001','Which publication defines the Risk Management Framework steps?',['NIST SP 800-37 Revision 2','NIST SP 800-53','FIPS 199','NIST SP 800-171'],'SP 800-37 Rev. 2 is the RMF itself. SP 800-53 supplies the controls it selects from.')
R('rmf-002','Which publication supplies the control catalog this lab uses?',['NIST SP 800-53 Revision 5','NIST SP 800-37','NIST SP 800-30','FIPS 200'],'SP 800-53 Rev. 5 is the catalog; SP 800-53B holds the federal baselines.')
R('rmf-003','Which step did SP 800-37 Revision 2 add?',['Prepare','Monitor','Assess','Authorize'],'Prepare was added at the organization and system level. The public 2016 JSIG predates it and describes six steps.')
R('rmf-004','What follows Categorize in the RMF?',['Select','Implement','Assess','Authorize'],'Categorize, Select, Implement, Assess, Authorize, Monitor, with Prepare ahead of them in Rev. 2.')
R('rmf-005','This lab\u2019s system is categorized Moderate, Low, Low. What does that mean?',['Moderate confidentiality, low integrity, low availability','Moderate impact overall','Low impact overall','Three separate systems'],'The three values are the CIA impact levels. The owner\u2019s categorization is planning input, not a completed assessment.')
R('rmf-006','Who makes the authorization decision?',['The Authorizing Official','The ISSO','The system administrator','The assessor'],'The AO accepts the risk and signs the decision. Everyone else prepares, implements, assesses or recommends.')
R('rmf-007','What is a POA&M?',['A plan of action and milestones for weaknesses that are not yet corrected','The system security plan','A scan report','A contract'],'Each open weakness gets a planned fix, resources, milestones and a date, and the AO sees it with the package.')
R('rmf-008','What does the system security plan document?',['How the system implements its selected controls','The scan results','The open POA&M items','The budget'],'The SSP describes the system, its boundary and each control\u2019s implementation. It is the heart of the package.')
R('rmf-009','What does the assessor produce?',['A security assessment report','The authorization decision','The POA&M','The system security plan'],'The SAR records what was tested, how, and what was found. Its findings feed the POA&M.')
R('rmf-010','How is the JSIG framed in this lab?',['SAP-specific implementation direction for the NIST RMF, used with CNSSI 1253','A replacement for NIST','The control catalog','A scanning tool'],'NIST is the foundation; the JSIG says how special access programs apply it, together with CNSSI 1253 and AO direction.')
R('rmf-011','Which instruction provides categorization and control selection for national security systems?',['CNSSI 1253','CNSSI 4009','NIST SP 800-30','FIPS 140'],'CNSSI 1253 supplies the national security system overlays and selection; it is not a Moderate baseline from SP 800-53B.')
R('rmf-012','What is continuous monitoring for?',['Keeping the authorization current by tracking control effectiveness and changes','Scanning once a year','Replacing the AO','Replacing the assessment'],'Monitor is the step that never ends: ongoing assessments, change tracking and reporting keep the risk picture current.')
R('rmf-013','Which control family is AC?',['Access Control','Audit and Accountability','Awareness and Training','Assessment, Authorization and Monitoring'],'AC is Access Control. AU is Audit and Accountability; AT is Awareness and Training; CA is Assessment, Authorization and Monitoring.')
R('rmf-014','Which control family is AU?',['Audit and Accountability','Authorization','Access Control','Assessment'],'AU covers audit records, logging and review, the family Splunk evidence maps to.')
R('rmf-015','Which control family is CM?',['Configuration Management','Contingency Planning','System and Communications Protection','Continuous Monitoring'],'CM is Configuration Management: baselines, change control and the settings STIGs enforce. CP is Contingency Planning.')
R('rmf-016','What is an authorization with conditions?',['An authorization granted while specified weaknesses are tracked to completion','A denial','A test environment','A permanent waiver'],'The AO accepts the risk for now and the conditions, usually POA&M items with dates, stay on the record.')
R('rmf-017','What is the Body of Evidence?',['The collected artifacts that show controls are implemented and working','A list of users','Only the network diagram','Only the hardware inventory'],'Policies, procedures, configurations, scan results, screenshots and logs: whatever proves a control, kept and maintained.')
R('rmf-018','Which role owns the system\u2019s day-to-day security posture?',['The ISSO','The AO','The SCA','The CIO'],'The Information System Security Officer runs the system\u2019s security operations; the ISSM manages the program; the SCA assesses.')
R('rmf-019','What triggers a review of an existing authorization?',['A significant change to the system or its environment','Every reboot','A new user account','A new printer'],'Significant changes, such as a new boundary, new interconnections or a changed categorization, send the system back through the relevant steps.')
R('rmf-020','How do evidence artifacts leave this air-gapped enclave?',['By manual, human-controlled transfer on approved removable media','Cloud synchronization','Email','A VPN'],'The lab\u2019s baseline: no physical connection or automated path crosses the air gap.')

out = []
for item in Q:
    rng = random.Random(item['id'])
    correct = item['options'][0]
    options = item['options'][:]
    rng.shuffle(options)
    item['options'] = options
    item['answer'] = 'ABCD'[options.index(correct)]
    out.append(item)

ids = [i['id'] for i in out]
assert len(ids) == len(set(ids)), 'duplicate ids'
json.dump({'_': 'Cyber Range question bank seed (26 October 2026): 10 per system plus 20 RMF questions for signoff. Written by scripts/author-range-questions.py; edit that script, not this file.', 'questions': out},
          open(sys.argv[1], 'w'), indent=1, ensure_ascii=False)
print(len(out), 'questions')
