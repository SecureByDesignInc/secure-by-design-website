# Bring in the fleet — configuration checklist

Secure By Design · Edition 1.3 · 8 October 2026

Fifty endpoints join a network that is finally ready for them: addressed by DHCP, landed by OU redirect, hardened by policy at first boot, certified by autoenrollment, and watched by the pipeline from their first sign-in. The sample names run SBD-PC01 through SBD-PC50; match them to your own plan.

## Before you start

- [ ] Complete courses 1.4–1.6: working PKI services, DHCP with its relay, the tiered admin plane, and the logging pipeline, on the network's routed, segmented VLANs.
- [ ] Prepare a patched Windows 11 reference image (or template) for the fifty endpoints, obtained through the approved offline media process.
- [ ] Confirm the Workstations OU, the container redirects from course 1.3, and the Defense Information Systems Agency (DISA) Windows 11 Security Technical Implementation Guide (STIG) Group Policy objects (GPOs) from the course 1.3 package are ready to link.
- [ ] Confirm the VLAN 80 access switch supports 802.1X port authentication, including a monitor (audit) mode that logs each result without blocking traffic. No new server is needed: the Network Policy Server (NPS) role goes on SBD-DHCP01.

## Prepare the fleet rollout

- [ ] Finalize the Windows 11 reference image: current patches via the approved media process, no preinstalled extras, and a generalized state so each clone takes its own identity. Record the image version and hash — it is the fleet's common ancestor and belongs in evidence.
- [ ] Write the naming and rollout plan: SBD-PC01–SBD-PC50, addressed by the course 1.5 DHCP scope, joined in waves (pilot of three, then batches) rather than all fifty at once.
- [ ] Create a dedicated domain-join account delegated only the create-computer-objects right on the Workstations OU — no broader privilege rides along with fifty join operations. The course 1.3 redirect already guarantees machines land in that OU.
- [ ] Link the DISA Windows 11 STIG policies from the course 1.3 package to the Workstations OU now, so the very first pilot boots into the hardened state — and note that Windows 11's own secure defaults will already satisfy some checks, just as Server 2025 did.
- [ ] Create the workstation firewall GPO (SBD Workstation Firewall in this sample) on the Workstations OU: Windows Defender Firewall on for every profile with inbound traffic blocked by default, and inbound rules that allow SMB (TCP 445), Remote Desktop (TCP 3389), and remote management (TCP 5985–5986) only from SBD-ADMIN-PC01 at 10.0.60.30 — course 1.8 adds SBD-NESSUS01 for credentialed scans. No rule allows SMB or Remote Desktop between workstations: traffic inside VLAN 80 never reaches the router, so this policy, not the core router's rules, enforces the register's peer denies.

**Commands:**

```
Get-FileHash -Algorithm SHA256 C:\Staging\Win11-Reference.vhdx
Get-ADOrganizationalUnit -Identity 'OU=Workstations,OU=SBD,DC=sbd,DC=test'
Get-GPInheritance -Target 'OU=Workstations,OU=SBD,DC=sbd,DC=test'
Get-GPOReport -Name 'SBD Workstation Firewall' -ReportType Html -Path C:\Evidence\workstation-fleet\workstation-firewall.html
```

**Verify:** The image is hashed and recorded, the join account holds only the delegated right on the Workstations OU, and the STIG and firewall GPO links show on that OU before any machine exists in it.

**Evidence:** Keep the image record with its hash, the naming and wave plan, the delegation report for the join account, the OU's GPO inheritance output, and the firewall GPO report.

Notes / result / date: __________________________

## Join the pilot and inspect first boot

- [ ] Deploy SBD-PC01 through SBD-PC03 from the image into VLAN 80, let each take its DHCP lease, and join sbd.test with the delegated account — nothing about the join should require a privileged credential.
- [ ] Per machine, verify the inheritance chain: the computer object sits in the Workstations OU (the redirect working), gpresult shows the STIG policies applied, and the secure dynamic DNS record exists on both DCs.
- [ ] Confirm the deny side holds: a pilot machine cannot reach another pilot machine's SMB or RDP — the lesson 1 firewall policy refuses it on the destination PC, because traffic inside VLAN 80 never reaches the router — and cannot open anything toward VLAN 60, which the core router's rules deny at the boundary.
- [ ] Find the three joins in the logging pipeline: the domain controller events for the computer-account creations should already be on the collector and searchable in analysis — the first machines this network has watched arrive.

**Commands:**

```
Get-ADComputer -SearchBase 'OU=Workstations,OU=SBD,DC=sbd,DC=test' -Filter * | Select-Object Name, DNSHostName
gpresult /r /scope:computer
Resolve-DnsName SBD-PC01.sbd.test
Test-NetConnection SBD-PC02.sbd.test -Port 445   # expected: TcpTestSucceeded False
```

**Verify:** All three pilots sit in the Workstations OU with STIG policy applied and DNS registered, peer SMB/RDP fails as designed, and the join events are visible in analysis.

**Evidence:** Keep each pilot's placement, gpresult, and DNS proof; the peer-deny output; and the analysis search showing the three computer-account creations.

Notes / result / date: __________________________

## Manage local administrators with Windows LAPS

- [ ] Extend the directory schema for Windows LAPS (Update-LapsADSchema) and grant the Workstations OU's computers the right to update their own password attributes — a one-time Tier 0 action, performed from the jump host and recorded like any schema change.
- [ ] Grant read access on the managed passwords to the Tier 2 admin group only — exactly the people SBD-ADMIN-PC01 exists for — and nobody else; the tier model decides who may know an endpoint's local secret.
- [ ] Create the LAPS GPO on the Workstations OU: managed built-in administrator, the password complexity and age the plan sets, and post-authentication reset so a used password does not live on.
- [ ] On a pilot, confirm the policy applied, retrieve the password from the admin seat, use it once, and watch rotation — one cycle, fully observed, is the proof the other forty-nine inherit.

**Commands:**

```
Get-LapsADPassword -Identity SBD-PC01 -AsPlainText   # from SBD-ADMIN-PC01, Tier 2 admin
Get-ADComputer SBD-PC01 -Properties msLAPS-PasswordExpirationTime | Select-Object Name, msLAPS-PasswordExpirationTime
gpresult /r /scope:computer
```

**Verify:** The schema holds the LAPS attributes, only the Tier 2 group can read passwords, the policy shows on the pilots, and one retrieve-use-rotate cycle is recorded.

**Evidence:** Keep the schema-change record, the permission delegation, the LAPS policy report, and the observed rotation cycle.

Notes / result / date: __________________________

## Autoenroll the fleet's certificates

- [ ] Through the course 1.4 change process, update the SBD Computer Authentication template's autoenrollment permission from the pilot group to the Workstations OU's computers — the change record names the widening and its approver.
- [ ] Confirm the autoenrollment policy already applies through the Workstations OU, refresh policy on the pilots, and watch certificates arrive with no human in the loop.
- [ ] On an enrolled endpoint, run the full verification: the chain must reach the approved root, and the AIA and CDP fetches must answer live from pki.sbd.test through the register's HTTP row.
- [ ] Record the issuing CA's view: the issued-certificate log now shows the fleet enrolling — volume the CA was designed for, finally arriving, and itself a record worth sampling into evidence.

**Commands:**

```
gpupdate /force
Get-ChildItem Cert:\LocalMachine\My | Select-Object Subject, NotAfter
certutil -verify -urlfetch C:\Evidence\fleet\SBD-PC01.cer
```

**Verify:** Pilot endpoints enroll hands-free at policy refresh, verification passes with live publication retrieval, and the CA's issued log reflects the fleet with the widened template version.

**Evidence:** Keep the template change record, an endpoint's certificate details, the urlfetch output, and a sample of the CA's issued log.

Notes / result / date: __________________________

## Admit only enrolled devices with 802.1X

- [ ] Add the Network Policy Server role to SBD-DHCP01 and register it in Active Directory. Give it a server certificate with the Server Authentication purpose from the issuing CA. It handles port admission only; router logins stay named local accounts, so the server stays in the member-server tier.
- [ ] Add the VLAN 80 access switch as a RADIUS client with a long, unique shared secret, then create the network policy: wired 802.1X, EAP-TLS only, machine certificates that chain to the approved root and carry the Client Authentication purpose, from the Domain Computers group.
- [ ] Create quarantine VLAN 90 with no gateway and no routes and set it as the ports' failure and guest VLAN, but enable 802.1X on the VLAN 80 access ports in monitor (audit) mode: the switch runs every authentication and reports the result, yet keeps forwarding on VLAN 80 whatever the outcome (vendors name this mode differently). The other 47 PCs have no machine certificate until they join the domain in lesson 6, so enforcing now would strand them in VLAN 90, with no route to a domain controller. Push the wired 802.1X client settings to the Workstations OU by Group Policy (Wired AutoConfig, EAP-TLS, the approved root as the trusted CA).
- [ ] Prove monitor mode with the pilots: each authenticates with EAP-TLS and NPS logs a grant (event 6272), while a failed attempt is logged — as event 6273 when the request reaches NPS — but still forwards on VLAN 80. Add register row F20 with its owner, and confirm the NPS events reach the course 1.6 collector through the existing event forwarding subscription.

**Commands:**

```
# On an enrolled pilot: the wired interface authenticated with EAP-TLS.
netsh lan show interfaces
# On SBD-DHCP01: recent NPS grants (6272) and denials (6273).
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=6272,6273} -MaxEvents 5 | Select-Object TimeCreated, Id
```

**Verify:** Every pilot authenticates with EAP-TLS and NPS logs the grant (6272); a failed authentication is logged but, in monitor mode, the port still forwards on VLAN 80; the ports name VLAN 90 as their failure VLAN; and the NPS events appear in the collector.

**Evidence:** Keep the network policy export, the RADIUS client list (without the secret), the monitor-mode port configuration, the pilots' grant events and the failed test, and the F20 register row.

Notes / result / date: __________________________

## Scale to fifty, enforce 802.1X, and prove by sample

- [ ] Deploy the remaining machines in the planned waves while the VLAN 80 ports are still in monitor mode, watching the DHCP scope's utilization and the join events arriving in analysis as each wave lands — the pipeline is now the rollout's progress bar.
- [ ] Confirm every PC enrolled its machine certificate and authenticates: compare the issuing CA's issued certificates and the NPS grant events (6272) against the fifty computer objects, and fix any machine that is missing before going further.
- [ ] Switch the VLAN 80 access ports from monitor mode to enforcement, and prove it both ways: an enrolled PC still authenticates and gets its normal lease, and an unenrolled test laptop lands in quarantine VLAN 90 and reaches nothing. Record the switch's port status and the NPS events for both.
- [ ] Define the sample before checking it: for example one machine per wave plus any machine that logged an error — then run the pilot's full set on each sampled host (OU, policy, DNS, LAPS, certificate, 802.1X admission, peer-deny).
- [ ] Write the sample rule down: one failed check in the sample widens the sample; a repeated failure stops the rollout and becomes a finding. A sample without a failure rule is a formality.
- [ ] Extend the course 1.6 forwarding subscription to the Workstations OU so all fifty endpoints report their security events — and confirm fleet sign-ins now appear in the analyst's searches.

**Commands:**

```
(Get-ADComputer -SearchBase 'OU=Workstations,OU=SBD,DC=sbd,DC=test' -Filter *).Count
# On SBD-DHCP01: authentication results in the last hour (6272 granted, 6273 denied).
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=6272,6273; StartTime=(Get-Date).AddHours(-1)} | Group-Object Id | Select-Object Name, Count
Get-DhcpServerv4ScopeStatistics -ScopeId 10.0.80.0 | Select-Object PercentageInUse, AddressesInUse
Get-WinEvent -LogName ForwardedEvents -MaxEvents 5 | Select-Object MachineName, Id
```

**Verify:** Fifty computer objects sit in the Workstations OU, every PC enrolled and authenticates, the ports enforce 802.1X with the unenrolled laptop quarantined in VLAN 90, scope utilization matches the rollout, every sampled host passes the full check set, and fleet events flow through the pipeline.

**Evidence:** Keep the wave log, the enrollment reconciliation, the enforcement change with both admission results and their records, the sample definition with its failure rule, the per-sample check results, and the widened subscription proof.

Notes / result / date: __________________________

## Delta scan the fleet and hand off

- [ ] Run the SCAP Compliance Checker (SCC) with the Windows 11 STIG benchmark against the sampled endpoints — the same sample set as lesson 6 — and note how much the pre-linked policies and the OS defaults already satisfy, exactly as the server baselines taught.
- [ ] Rescan what changed: the DCs (schema and LAPS attributes), the issuing CA (fleet enrollment volume), and SBD-DHCP01 (the new NPS role and a scope in daily use); attribute each delta to its lesson.
- [ ] Assemble the fleet inventory — names, image ancestry, certificate thumbprints, sample status — as the course's closing artifact; course 1.8's management tooling will take ownership of keeping it current.
- [ ] Write the handoff: the fleet exists, watched and hardened, but updates itself not at all — patching, endpoint protection, and vulnerability coverage are precisely what course 1.8 builds next.

**Commands:**

```
Get-ChildItem C:\Evidence\workstation-fleet -Recurse | Select-Object Name, LastWriteTime
Get-FileHash -Algorithm SHA256 C:\Evidence\workstation-fleet\*
```

**Verify:** Sampled endpoints hold dated Windows 11 baselines, the infrastructure rescans carry attributed deltas, and the fleet inventory is complete and filed.

**Evidence:** Finish the checklist: endpoint baselines, infrastructure rescans, the fleet inventory, and the handoff note to course 1.8.

Notes / result / date: __________________________

## Sources

- [Microsoft · Windows LAPS overview](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview)
- [Microsoft · Configure certificate autoenrollment](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/configure-server-certificate-autoenrollment)
- [DISA · STIG Group Policy Objects package](https://www.cyber.mil/stigs/gpo)
- [Microsoft · Use Windows Event Forwarding to help with intrusion detection](https://learn.microsoft.com/en-us/windows/security/threat-protection/use-windows-event-forwarding-to-assist-in-intrusion-detection)
- [Microsoft · What's new in Windows Server 2025](https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025)
- [Microsoft · Configure Windows Firewall rules with Group Policy](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/configure)
- [NIST · SP 800-53 Rev. 5 security controls](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [Microsoft · Network Policy Server overview](https://learn.microsoft.com/en-us/windows-server/networking/technologies/nps/nps-top)
- [Microsoft · Configure RADIUS clients](https://learn.microsoft.com/en-us/windows-server/networking/technologies/nps/nps-radius-clients-configure)
- [Microsoft · Certificate requirements for EAP-TLS](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/certificate-requirements-eap-tls-peap)

© 2026 Secure By Design Team LLC
