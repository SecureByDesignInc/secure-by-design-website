# Bring in the fleet — configuration checklist

Secure By Design · Edition 1.5 · 14 October 2026

Fifty endpoints join a network that is finally ready for them: addressed by DHCP, landed by OU redirect, hardened by policy at first boot, certified by autoenrollment, and watched by the pipeline from their first sign-in. Tier 0 steps run from AdminJumpBox01, Tier 1 steps on SBD-DHCP01 from SBD-ADMIN-SRV01, and Tier 2 steps inside SBD-ADMIN-PC01; each seat keeps its part of the record under C:\Evidence\workstation-fleet. The sample names run SBD-PC01 through SBD-PC50; match them to your own plan.

## Before you start

- [ ] Complete courses 1.6–1.12: the course 1.6 PKI with its SBD Computer Authentication template and the SBD Certificate Autoenrollment GPO at the domain root, SBD-DHCP01 (course 1.7), whose relay course 1.7 verified, the three administration seats (course 1.8), with SBD-ADMIN-PC01's own SCC copy and first baseline, and the logging pipeline (courses 1.10–1.12), on the network's routed, segmented VLANs.
- [ ] Prepare a patched Windows client reference image (or template) for the fifty endpoints, obtained through the approved offline media process.
- [ ] Confirm the Workstations OU and the computer redirect from course 1.5, and the Defense Information Systems Agency (DISA) Security Technical Implementation Guide (STIG) Group Policy objects (GPOs) for your Windows client release, imported in course 1.5 from the package course 1.4 staged and still unlinked there. Lesson 7 reuses SBD-ADMIN-PC01's own SCC copy, which course 1.8 installed with the Windows client benchmark course 1.4 staged, and the checked installer and connected-side-hashes.csv course 1.8 kept in C:\Staging\DISA there.
- [ ] Confirm the VLAN 80 access switch supports 802.1X port authentication, including a monitor (audit) mode that logs each result without blocking traffic. No new server is needed: the Network Policy Server (NPS) role goes on SBD-DHCP01.

## Prepare the fleet rollout

- [ ] Finalize the Windows client reference image: current patches via the approved media process, no preinstalled extras, one local administrator account for Windows LAPS to manage (the Windows client STIG disables the built-in Administrator), and a generalized state so each clone takes its own identity. Record the image version and hash — it is the fleet's common ancestor and belongs in evidence.
- [ ] Write the naming and rollout plan: SBD-PC01–SBD-PC50, addressed by the course 1.7 DHCP scope, joined in waves (pilot of three, then batches) rather than all fifty at once.
- [ ] From AdminJumpBox01, create a dedicated domain-join account delegated only Create Computer objects on the Workstations OU — no broader privilege rides along with fifty join operations — and record it beside the same delegation course 1.8 gave SBD Tier 2 Admins for its test client. The course 1.5 redirect already guarantees machines land in that OU. Add a GPO, linked only to the Workstations OU, that makes SBD Tier 2 Admins the managing group in each PC's local Administrators (Group Policy Preferences, Local Users and Groups), as course 1.8 did by hand on its test client; course 1.8's tier logon GPO already denies sign-ins there to SBD Tier 0 Admins, SBD Tier 1 Admins and SBD Audit Custodians.
- [ ] Link the DISA Windows client policies that course 1.5 imported and left unlinked to the Workstations OU now — the computer policy, the user policy, and course 1.5's loopback (Merge) GPO, as course 1.8 did for Admin Workstations — so the very first pilot boots into the hardened state, and note that the Windows client's own secure defaults will already satisfy some checks, just as Windows Server's did. Link each of them below course 1.8's tier logon GPO, which keeps link order 1 on the Workstations OU: user rights don't merge across GPOs, so a STIG GPO linked above it would win and drop the denies for Tier 0, Tier 1 and SBD Audit Custodians. Every GPO this course links to the OU goes below it.
- [ ] Create the workstation firewall GPO (SBD Workstation Firewall in this sample) on the Workstations OU: Windows Defender Firewall on for every profile with inbound traffic blocked by default, and inbound rules that allow Remote Desktop (TCP 3389) and remote management (TCP 5985–5986) only from SBD-ADMIN-PC01 at 10.0.60.30 — the ports its register row, A03, carries. No rule allows SMB or Remote Desktop between workstations: traffic inside VLAN 80 never reaches the router, so this policy, not the core router's rules, enforces the register's peer denies. Then turn off the PCs' own DNS registration in a separate GPO on the same OU (SBD Workstation DNS in this sample): Computer Configuration > Policies > Administrative Templates > Network > DNS Client > Dynamic update, Disabled. Record the reason with the GPO: SBD-DHCP01 already registers each PC's A and PTR records under svc-dhcp-dns (course 1.7), and a client that registers its own record can take it over, so the DHCP server's account can no longer update it — one owner per record.

**Commands:**

```
Get-FileHash -Algorithm SHA256 C:\Staging\Windows-client-reference.vhdx
# On AdminJumpBox01 (Tier 0): the join account's delegation (svc-fleet-join in this sample) and the OU's links
(Get-Acl 'AD:\OU=Workstations,OU=SBD,DC=sbd,DC=test').Access | Where-Object IdentityReference -match 'svc-fleet-join|SBD Tier 2 Admins' | Select-Object IdentityReference, ActiveDirectoryRights, ObjectType
(Get-GPInheritance -Target 'OU=Workstations,OU=SBD,DC=sbd,DC=test').GpoLinks | Select-Object Order, DisplayName   # course 1.8's tier logon GPO stays at order 1
Get-GPOReport -Name 'SBD Workstation Firewall' -ReportType Html -Path C:\Evidence\workstation-fleet\workstation-firewall.html
Get-GPOReport -Name 'SBD Workstation DNS' -ReportType Html -Path C:\Evidence\workstation-fleet\workstation-dns.html
```

**Verify:** The image is hashed and recorded, the join account holds only Create Computer objects on the Workstations OU, and the client STIG, loopback, local Administrators, firewall and DNS registration GPO links show on that OU below course 1.8's tier logon GPO, still at link order 1, before any machine exists in it.

**Evidence:** Keep the image record with its hash, the naming and wave plan, the delegation output for the join account and SBD Tier 2 Admins, the OU's GPO links in order, and the firewall and DNS registration GPO reports with the recorded reason.

Notes / result / date: __________________________

## Join the pilot and inspect first boot

- [ ] Deploy SBD-PC01 through SBD-PC03 from the image into VLAN 80 — where the PCs are virtual machines, with the hypervisor's time synchronization turned off, as course 1.3 requires — let each take its DHCP lease, and join sbd.test with the delegated account; nothing about the join should require a privileged credential.
- [ ] Per machine, verify the inheritance chain: the computer object sits in the Workstations OU (the course 1.5 redirect working), gpresult shows the STIG policies applied, w32tm /query /source names a domain controller, and the A and PTR records SBD-DHCP01 registered for it under svc-dhcp-dns (course 1.7) answer from both DCs — with the PC's own registration off, as lesson 1's DNS GPO set.
- [ ] Confirm the deny side holds: a pilot machine cannot reach another pilot machine's SMB or RDP — the lesson 1 firewall policy refuses it on the destination PC, because traffic inside VLAN 80 never reaches the router — and cannot open anything toward VLAN 60, which the core router's rules deny at the boundary.
- [ ] Find the three joins in the logging pipeline: the domain controllers' computer-account creation events (4741) should already be on the course 1.10 collector and searchable in SBD-SPLUNK01 (course 1.12) — the first machines this network has watched arrive. If the course 1.10 subscription doesn't carry 4741, add it and record the change.

**Commands:**

```
Get-ADComputer -SearchBase 'OU=Workstations,OU=SBD,DC=sbd,DC=test' -Filter * | Select-Object Name, DNSHostName
gpresult /r /scope:computer
w32tm /query /source   # a domain controller, never Local CMOS Clock or the hypervisor
Resolve-DnsName SBD-PC01.sbd.test -Server SBD-DC02.sbd.test
Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' | Select-Object RegistrationEnabled   # 0: the PC leaves registration to SBD-DHCP01
Test-NetConnection SBD-PC02.sbd.test -Port 445   # expected: TcpTestSucceeded False
```

**Verify:** All three pilots sit in the Workstations OU with STIG policy applied, time from a domain controller and DNS registered by SBD-DHCP01 on both DCs with the PC's own registration off, peer SMB/RDP fails as designed, and the join events are visible in analysis.

**Evidence:** Keep each pilot's placement, gpresult, time source and DNS proof; the peer-deny output; and the analysis search showing the three computer-account creations.

Notes / result / date: __________________________

## Manage local administrators with Windows LAPS

- [ ] From AdminJumpBox01, extend the directory schema for Windows LAPS (Update-LapsADSchema, which needs Schema Admins) and grant the Workstations OU's computers the right to update their own password attributes (Set-LapsADComputerSelfPermission) — a one-time Tier 0 action, recorded like any schema change.
- [ ] Grant read access on the managed passwords to SBD Tier 2 Admins (Set-LapsADReadPasswordPermission) — exactly the people SBD-ADMIN-PC01 exists for. Domain Admins can read them by default; no other group gets the right, and Tier 0 accounts don't sign in on workstations to use one. The tier model decides who may know an endpoint's local secret.
- [ ] Create the LAPS GPO on the Workstations OU: back up to Active Directory, manage the local administrator account the image carries (named in the policy, because Windows LAPS manages the built-in Administrator unless told otherwise and doesn't create accounts), encrypt the password with SBD Tier 2 Admins as its authorized decryptor (otherwise only Domain Admins can decrypt it), the complexity, length and age the plan sets, and post-authentication actions that reset the password and sign the account out after a short grace period, so a used password does not live on.
- [ ] On a pilot, confirm the policy applied, retrieve the password from SBD-ADMIN-PC01, use it once, and watch rotation after the grace period — one cycle, fully observed, is the proof the other forty-nine inherit.

**Commands:**

```
# On AdminJumpBox01 (Tier 0): who holds the LAPS rights on the Workstations OU
Find-LapsADExtendedRights -Identity 'OU=Workstations,OU=SBD,DC=sbd,DC=test'
# Inside SBD-ADMIN-PC01 (Tier 2)
# The LAPS cmdlets read the directory over LDAP; the AD module's web service (TCP 9389) is open only to AdminJumpBox01
Get-LapsADPassword -Identity SBD-PC01 -AsPlainText | Select-Object ComputerName, Account, ExpirationTimestamp
# On the pilot
gpresult /r /scope:computer
```

**Verify:** The schema holds the LAPS attributes, only SBD Tier 2 Admins (beside the default Domain Admins) can read and decrypt passwords, the policy shows on the pilots, and one retrieve-use-rotate cycle is recorded.

**Evidence:** Keep the schema-change record, the permission delegation, the LAPS policy report, and the observed rotation cycle.

Notes / result / date: __________________________

## Autoenroll the fleet's certificates

- [ ] Through the course 1.6 change process (its lesson 8), grant a new computer group — SBD Fleet Computers in this sample, created from AdminJumpBox01 — Read, Enroll and Autoenroll on the SBD Computer Authentication template, from SBD-PKI-MGMT01. Template permissions name groups, never an OU; the change record names the widening and its approver.
- [ ] Confirm with gpresult that course 1.6's SBD Certificate Autoenrollment GPO, linked at the domain root, already reaches the Workstations OU, then add the pilots to SBD Fleet Computers and restart them so the membership reaches their Kerberos tickets. Watch certificates arrive with no human in the loop: the requests reach SBD-SUBCA01 over the enrollment row course 1.6 confirmed (F23 in this sample).
- [ ] On an enrolled pilot, export its certificate, clear the URL cache, and run the full verification: the chain must reach the approved root, and the AIA and CDP fetches must answer live from pki.sbd.test through the register's publication row, F18.
- [ ] Record the issuing CA's view: the issued-certificate log now shows the pilots enrolling — volume the CA was designed for, beginning to arrive, and itself a record worth sampling into evidence.

**Commands:**

```
# On SBD-PC01, after the restart
gpupdate /force
certutil -pulse
Get-ChildItem Cert:\LocalMachine\My | Select-Object Subject, NotAfter, Thumbprint
Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.EnhancedKeyUsageList.FriendlyName -contains 'Client Authentication' } | Select-Object -First 1 | Export-Certificate -FilePath C:\Evidence\workstation-fleet\SBD-PC01.cer
certutil -urlcache * delete
certutil -verify -urlfetch C:\Evidence\workstation-fleet\SBD-PC01.cer   # carry the output to SBD-ADMIN-PC01's record
```

**Verify:** Pilot endpoints enroll hands-free once they are in SBD Fleet Computers, verification passes with live publication retrieval and nothing cached, and the CA's issued log shows their SBD Computer Authentication certificates.

**Evidence:** Keep the template change record, the SBD Fleet Computers membership, an endpoint's certificate details, the urlfetch output, and a sample of the CA's issued log.

Notes / result / date: __________________________

## Admit only enrolled devices with 802.1X

- [ ] Add the Network Policy Server role to SBD-DHCP01 in a Tier 1 session from SBD-ADMIN-SRV01, and register it in Active Directory from AdminJumpBox01 (a Tier 0 action: it adds the server to RAS and IAS Servers). Give it an SBD Server Authentication certificate (course 1.6) for SBD-DHCP01.sbd.test, adding SBD-DHCP01 to the SBD TLS Servers group before it requests. It handles port admission only; router logins stay named local accounts, so the server stays in the member-server tier.
- [ ] Add the VLAN 80 access switch as a RADIUS client with a long, unique shared secret, then create the network policy: wired 802.1X, EAP-TLS only, machine certificates that chain to the approved root and carry the Client Authentication purpose, from the Domain Computers group — any domain-joined computer, servers included where one sits on an 802.1X port. Don't narrow it to SBD Fleet Computers: that group decides who enrolls the fleet's certificate, not who may connect.
- [ ] Create quarantine VLAN 90 on the access switch with no gateway and no routes (the core gets no VLAN 90 interface) and set it as the ports' failure and guest VLAN, but enable 802.1X on the VLAN 80 access ports in monitor (audit) mode: the switch runs every authentication and reports the result, yet keeps forwarding on VLAN 80 whatever the outcome (vendors name this mode differently). The other 47 PCs have no machine certificate until they join the domain in lesson 6, so enforcing now would strand them in VLAN 90, with no route to a domain controller. Push the wired 802.1X client settings to the Workstations OU by Group Policy (Wired AutoConfig, EAP-TLS, the approved root as the trusted CA).
- [ ] Turn on Audit Network Policy Server (success and failure) for SBD-DHCP01 in a separate GPO linked above the STIG GPO, recorded as course 1.10 records audit additions — the STIG's audit policy leaves it off. Then prove monitor mode with the pilots: each authenticates with EAP-TLS and NPS logs a grant (event 6272), while a failed attempt is logged — as event 6273 when the request reaches NPS — but still forwards on VLAN 80. Add register row F20 with its owner, as the System Hub records it, and confirm the NPS events reach the course 1.10 collector, adding 6272 and 6273 to SBD-ForwardedSecurity's query if it doesn't carry them yet.

**Commands:**

```
# On an enrolled pilot: the wired interface authenticated with EAP-TLS.
netsh lan show interfaces
# On SBD-DHCP01 (Tier 1): NPS auditing is on, then recent grants (6272) and denials (6273).
auditpol /get /subcategory:"Network Policy Server"
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=6272,6273} -MaxEvents 5 | Select-Object TimeCreated, Id
```

**Verify:** The network policy admits Domain Computers with EAP-TLS; NPS auditing records success and failure; every pilot authenticates with EAP-TLS and NPS logs the grant (6272); a failed authentication is logged but, in monitor mode, the port still forwards on VLAN 80; the ports name VLAN 90 as their failure VLAN; and the NPS events appear in the collector.

**Evidence:** Keep the network policy export, the RADIUS client list (without the secret), the audit GPO report, the monitor-mode port configuration, the pilots' grant events and the failed test, and the F20 register row.

Notes / result / date: __________________________

## Scale to fifty, enforce 802.1X, and prove by sample

- [ ] Deploy the remaining machines in the planned waves while the VLAN 80 ports are still in monitor mode, adding each wave to SBD Fleet Computers from AdminJumpBox01 and restarting it so it enrolls, and watch the DHCP scope's utilization and the join events arriving in analysis as each wave lands — the pipeline is now the rollout's progress bar.
- [ ] Confirm every PC enrolled its machine certificate and authenticates: compare the issuing CA's issued certificates and the NPS grant events (6272) against the fifty computer objects, and fix any machine that is missing before going further. Then retire course 1.7's temporary test client, SBD-TEST80, whose Tier 2 test role the pilots now carry: remove it from the domain, delete its computer object, lease and DNS records, and record the retirement.
- [ ] Switch the VLAN 80 access ports from monitor mode to enforcement, and prove it both ways: an enrolled PC still authenticates and gets its normal lease, and an unenrolled test laptop lands in quarantine VLAN 90 and reaches nothing. Record the switch's port status and the NPS events for both.
- [ ] Define the sample before checking it: for example one machine per wave plus any machine that logged an error — then run the pilot's full set on each sampled host (OU, policy, DNS, LAPS, certificate, 802.1X admission, peer-deny).
- [ ] Write the sample rule down: one failed check in the sample widens the sample; a repeated failure stops the rollout and becomes a finding. A sample without a failure rule is a formality.
- [ ] Enrol the fleet in course 1.10's collection: from AdminJumpBox01, add SBD Fleet Computers to SBD Event Sources and link course 1.10's enrolling GPO to the Workstations OU, below course 1.8's tier logon GPO; from SBD-ADMIN-SRV01, widen the collector's WinRM 5985 scope to VLAN 80 (rule F17); restart the PCs so both apply — and confirm fleet sign-ins now appear in the analyst's searches.

**Commands:**

```
# On AdminJumpBox01 (Tier 0): the fleet's computer objects and its group
(Get-ADComputer -SearchBase 'OU=Workstations,OU=SBD,DC=sbd,DC=test' -Filter *).Count   # 50, once SBD-TEST80 is retired
(Get-ADGroupMember 'SBD Fleet Computers').Count   # 50
# On SBD-DHCP01: authentication results in the last hour (6272 granted, 6273 denied).
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=6272,6273; StartTime=(Get-Date).AddHours(-1)} | Group-Object Id | Select-Object Name, Count
Get-DhcpServerv4ScopeStatistics -ScopeId 10.0.80.0 | Select-Object PercentageInUse, AddressesInUse
# On SBD-SYSLOG01: the fleet's events arriving
Get-WinEvent -LogName ForwardedEvents -MaxEvents 5 | Select-Object MachineName, Id
```

**Verify:** Fifty computer objects sit in the Workstations OU and in SBD Fleet Computers, SBD-TEST80 is retired, every PC enrolled and authenticates, the ports enforce 802.1X with the unenrolled laptop quarantined in VLAN 90, scope utilization matches the rollout, every sampled host passes the full check set, and fleet events flow through the pipeline.

**Evidence:** Keep the wave log, the enrollment reconciliation, the SBD-TEST80 retirement record, the enforcement change with both admission results and their records, the sample definition with its failure rule, the per-sample check results, and the enrolment proof from the collector.

Notes / result / date: __________________________

## Delta scan the fleet and hand off

- [ ] Baseline the lesson 6 sample with the Windows client benchmark from SBD-ADMIN-PC01, reusing the SCC copy course 1.8 installed there and baselined the seat with — this course scans only the fleet sample. First check the installer course 1.8 kept in C:\Staging\DISA against connected-side-hashes.csv. Rule A03 carries remote management, not the file-sharing and RPC ports a remote SCC scan uses, so copy SCC to each sampled PC over PowerShell remoting, check its hash there, scan locally in a Tier 2 session, bring the results back to C:\Evidence\workstation-fleet\baseline, and remove SCC from the PC. Note how much the pre-linked policies and the OS defaults already satisfy, and classify open items the course 1.4 way.
- [ ] Rescan what changed and attribute each delta to its lesson: the DCs (schema and LAPS attributes) and SBD-SUBCA01 (fleet enrollment volume) from AdminJumpBox01, and SBD-DHCP01 (the NPS role, its audit GPO and a scope in daily use) locally in a Tier 1 session from SBD-ADMIN-SRV01. Send any new deviation to the exception record's owner on AdminJumpBox01.
- [ ] Assemble the fleet inventory — names, image ancestry, certificate thumbprints, sample status — as the course's closing artifact; course 1.15 makes it a source of SBD-MGMT01's living inventory.
- [ ] Write the handoff: the fleet exists, watched and hardened, but takes no updates yet — course 1.14 builds SBD-WSUS01, with SBD-PC01–SBD-PC03 as its pilot ring and the other 47 PCs as Ring 2, and course 1.15 keeps the inventory current.

**Commands:**

```
# Inside SBD-ADMIN-PC01 (Tier 2): the installer course 1.8 kept still matches the record (expected: True)
$scc = Get-Item 'C:\Staging\DISA\<SCC installer>'
(Get-FileHash $scc.FullName -Algorithm SHA256).Hash -in (Import-Csv C:\Staging\DISA\connected-side-hashes.csv).Hash
# Per sampled PC: carry the installer over remote management (A03), install and scan there, bring the results back
$s = New-PSSession SBD-PC07.sbd.test
Copy-Item $scc.FullName -ToSession $s -Destination C:\Windows\Temp\
Copy-Item '<SCC results folder on the PC>' -FromSession $s -Destination C:\Evidence\workstation-fleet\baseline\SBD-PC07 -Recurse
# After the scans: this seat's record, hashed
Get-ChildItem C:\Evidence\workstation-fleet -Recurse -File | Get-FileHash -Algorithm SHA256 | Export-Csv C:\Evidence\workstation-fleet-manifest.csv -NoTypeInformation
```

**Verify:** The installer course 1.8 kept on SBD-ADMIN-PC01 still matches its recorded hash, the sampled endpoints hold dated Windows client baselines with SCC removed afterwards, the infrastructure rescans carry attributed deltas, and the fleet inventory is complete and filed.

**Evidence:** Finish the checklist: the installer's hash check, the endpoint baselines, infrastructure rescans, the fleet inventory, the hashed manifest, and the handoff note to courses 1.14 and 1.15.

Notes / result / date: __________________________

## Sources

- [Microsoft · Windows LAPS overview](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview)
- [Microsoft · Get started with Windows LAPS and Windows Server Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-scenarios-windows-server-active-directory)
- [Microsoft · Configure certificate autoenrollment](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/configure-server-certificate-autoenrollment)
- [DISA · STIG Group Policy Objects package](https://www.cyber.mil/stigs/gpo)
- [Microsoft · Use Windows Event Forwarding to help with intrusion detection](https://learn.microsoft.com/en-us/windows/security/threat-protection/use-windows-event-forwarding-to-assist-in-intrusion-detection)
- [Microsoft · Configure Windows Firewall rules with Group Policy](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/configure)
- [Microsoft · Policy CSP – ADMX_DnsClient (Dynamic update)](https://learn.microsoft.com/en-us/windows/client-management/mdm/policy-csp-admx-dnsclient)
- [Microsoft · DNS dynamic update](https://learn.microsoft.com/en-us/windows-server/networking/dns/dynamic-update)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [Microsoft · Network Policy Server overview](https://learn.microsoft.com/en-us/windows-server/networking/technologies/nps/nps-top)
- [Microsoft · Configure RADIUS clients](https://learn.microsoft.com/en-us/windows-server/networking/technologies/nps/nps-radius-clients-configure)
- [Microsoft · Certificate requirements for EAP-TLS](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/certificate-requirements-eap-tls-peap)
- [DISA · Security Content Automation Protocol (SCC and SCAP benchmarks)](https://www.cyber.mil/stigs/SCAP/)

© 2026 Secure By Design Team LLC
