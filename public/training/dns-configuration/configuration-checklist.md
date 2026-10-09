# Configure DNS and time — configuration checklist

Secure By Design · Edition 1.2 · 8 October 2026

The addresses and names below continue the training example. Match every change to your own address plan. This network has no internet DNS or time dependency: names resolve on the domain controllers, and time comes from the internal reference clock, SBD-TIME01.

## Before you start

- [ ] Complete the DC01 + DC02 identity build with both domain controllers healthy.
- [ ] Use an isolated Windows Server 2025 practice environment and an account delegated to manage DNS.
- [ ] Continue the existing sbd.test example: SBD-DC01 is 10.0.10.10 and SBD-DC02 is 10.0.10.11 on 10.0.10.0/24.
- [ ] The network's routing and VLAN segmentation are already in place, with a documented service-path register; SBD-TIME01 answers at 10.0.20.40 (a stand-in Windows Server 2025 host is fine in a practice lab).

## Map names to the network

- [ ] Record the domain, each subnet, both DNS addresses, and the owner of each service name. Keep host records and service aliases distinguishable.
- [ ] On each domain controller, open DNS Manager and review the existing sbd.test and _msdcs zones. Promotion may already have created them; do not create duplicate zones.
- [ ] Check the DNS role and static network settings. Domain members must use internal DNS servers that resolve the AD namespace; a public resolver is not an alternate for this environment.
- [ ] Decide whether any separate internal namespace needs a conditional forwarder. With no recursive dependencies, document a no-recursion design; do not add internet forwarders or delete every root hint as a shortcut.

**Commands:**

```
Get-WindowsFeature DNS
Get-DnsClientServerAddress -AddressFamily IPv4
Get-DnsServerZone -ComputerName SBD-DC01
```

**Verify:** Both servers and the client point to the intended internal DNS service. Existing AD zones and the forwarding/recursion decision are recorded.

**Evidence:** Save the address/name worksheet and the initial zone inventory before changing anything.

Notes / result / date: __________________________

## Configure forward and reverse zones

- [ ] In DNS Manager, inspect sbd.test Properties. Confirm that it is AD-integrated and choose the domain or forest replication scope that matches the DNS servers intended to host it.
- [ ] Use secure dynamic updates for the AD-integrated zone. Review delegation and permissions before broadening who can change records.
- [ ] Under Reverse Lookup Zones, create an IPv4 primary AD-integrated zone for network ID 10.0.10 if an equivalent zone does not already exist. Select the approved replication scope and secure updates.
- [ ] Review zone-transfer settings. AD replication between these DCs does not require enabling transfers to arbitrary DNS servers; restrict any separately required secondary-server transfers explicitly.

**Commands:**

```
Get-DnsServerZone -ComputerName SBD-DC01 |
  Select-Object ZoneName, ZoneType, IsDsIntegrated, DynamicUpdate, ReplicationScope
Get-DnsServerZone -ComputerName SBD-DC02
```

**Verify:** The intended forward and reverse zones appear on both DNS hosts after replication. The reverse zone for this /24 is 10.0.10.in-addr.arpa.

**Evidence:** Capture the zone type, update policy, replication scope, and transfer policy for each zone.

Notes / result / date: __________________________

## Create and maintain service records

- [ ] Review the DC A and PTR records first. Correct mismatches through the owning host and DNS administration process rather than blindly adding another record with the same name.
- [ ] Choose one approved service host from your address plan. In sbd.test, use New Host (A or AAAA), enter its actual name and address, and select the associated PTR option when the reverse zone is ready.
- [ ] For a service alias, use New Alias (CNAME) and select the intended fully qualified host. For the later PKI course, reserve pki.sbd.test for the approved internal publication host; do not point it at the offline root.
- [ ] Set the record lifetime to the operational plan, record static ownership, and remove only records confirmed obsolete. An alias cannot coexist with other record types at the same name.

**Commands:**

```
Get-DnsServerResourceRecord -ComputerName SBD-DC01 -ZoneName sbd.test
Resolve-DnsName SBD-DC01.sbd.test -Type A -Server 10.0.10.10
Resolve-DnsName 10.0.10.10 -Type PTR -Server 10.0.10.10
```

**Verify:** Forward and reverse responses agree with the address plan. Each alias reaches the intended host; creating a DNS name alone does not configure its service.

**Evidence:** Keep a record table with owner, type, target, time to live, and reason for the change.

Notes / result / date: __________________________

## Prove resolution and directory discovery

- [ ] From a domain client, query each DNS server for the same host and reverse record. Record the server queried and the returned data.
- [ ] Query the AD LDAP service records below against both servers. These records let a client discover domain controllers; an ordinary host lookup does not prove that discovery works.
- [ ] Run the DNS diagnostics and directory replication checks on a domain controller. Investigate failures in context, including the intentionally isolated network design.
- [ ] During an approved lab test, make one DNS server unavailable to the test client and verify resolution through the other. Restore connectivity and repeat for the opposite server. Do not interrupt shared production services for this exercise.

**Commands:**

```
Resolve-DnsName SBD-DC01.sbd.test -Server 10.0.10.10
Resolve-DnsName SBD-DC01.sbd.test -Server 10.0.10.11
Resolve-DnsName _ldap._tcp.dc._msdcs.sbd.test -Type SRV -Server 10.0.10.10
Resolve-DnsName _ldap._tcp.dc._msdcs.sbd.test -Type SRV -Server 10.0.10.11
dcdiag /test:dns /v
repadmin /replsummary
```

**Verify:** Both DNS servers return the expected host and AD service records, replication is healthy, and the client still resolves internal names when either resolver is unavailable.

**Evidence:** Keep paired lookup results, diagnostic output, and the failover test record with start, restore, and final verification times.

Notes / result / date: __________________________

## Stand up SBD-TIME01 and the time hierarchy

- [ ] Confirm SBD-TIME01 at 10.0.20.40 answers as an NTP server. In the model it is a rack appliance; in a practice lab a small Windows Server 2025 host with the Windows Time service configured as an NTP server can stand in for it. In an air-gapped network its clock is the reference by declaration — record the source decision (an approved hardware source, or the stand-in host's clock) with its expected accuracy and drift threshold.
- [ ] On SBD-DC01, the domain controller holding the PDC emulator role, configure Windows Time to use SBD-TIME01 as its manual peer and mark it reliable. Only the PDC emulator points at TIME01: SBD-DC02 syncs from the PDC emulator, every other domain member keeps the default domain-hierarchy sync from the domain controllers, and the domain-joined Linux servers in later courses point chrony or ntpd at both domain controllers.
- [ ] Confirm the network's service-path register permits time — members to both domain controllers on UDP 123, and SBD-DC01 alone to SBD-TIME01. Write the time design into the build record now: course 1.3's hardening Group Policy objects (GPOs) must leave it intact, and if a Security Technical Implementation Guide (STIG) value disagrees with it, that course's deviation record is where the decision lives.
- [ ] Verify the chain end to end: TIME01 serving, the PDC emulator sourcing from it, SBD-DC02 and a member server sourcing from a domain controller, and offsets within your recorded threshold.

**Commands:**

```
Get-ADDomain | Select-Object PDCEmulator   # expected: SBD-DC01.sbd.test
# On the PDC emulator, then on SBD-DC02 and a member server:
w32tm /query /source
w32tm /query /status
w32tm /stripchart /computer:10.0.20.40 /samples:3 /dataonly   # from SBD-DC01 only
```

**Verify:** The PDC emulator reports SBD-TIME01 as its source, SBD-DC02 and the member server report a domain controller, and measured offsets sit inside the documented threshold.

**Evidence:** Record the time design decisions, the source and status output from both controllers and the member, the stripchart offsets, and the register rows that permit time: members to the domain controllers, and SBD-DC01 to SBD-TIME01.

Notes / result / date: __________________________

## Find the fault and record the fix

- [ ] For a failing lookup, record the exact name, record type, client, resolver, timestamp, and error. Compare the fully qualified name with any short-name search behavior.
- [ ] Query both servers directly. If they disagree, inspect zone scope and replication. If both are correct but the client is not, inspect client DNS settings and cached data.
- [ ] Distinguish a missing name (NXDOMAIN) from a timeout or service failure. Fix the owning configuration first, then use Clear-DnsClientCache on the test client if stale cache remains relevant.
- [ ] Repeat the original test and the redundancy checks. Record what changed and the rollback method. Review aging/scavenging separately against DHCP, static records, and backup practices before enabling automatic deletion.

**Commands:**

```
Get-DnsClientServerAddress -AddressFamily IPv4
Get-DnsClientCache
Resolve-DnsName SBD-DC02.sbd.test -Server 10.0.10.10
Resolve-DnsName SBD-DC02.sbd.test -Server 10.0.10.11
```

**Verify:** The original failure is reproducibly resolved, both resolvers agree, and the change record explains the cause rather than only showing a passing screenshot.

**Evidence:** Complete the DNS checklist and retain the before/after lookup results with the configuration owner.

Notes / result / date: __________________________

## Sources

- [Microsoft · Install and configure DNS Server](https://learn.microsoft.com/en-us/windows-server/networking/dns/quickstart-install-configure-dns-server)
- [Microsoft · Manage DNS zones](https://learn.microsoft.com/en-us/windows-server/networking/dns/manage-dns-zones)
- [Microsoft · Manage DNS resource records](https://learn.microsoft.com/en-us/windows-server/networking/dns/manage-resource-records)
- [Microsoft · Resolve-DnsName](https://learn.microsoft.com/en-us/powershell/module/dnsclient/resolve-dnsname)
- [Microsoft · Dcdiag](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/dcdiag)
- [Microsoft · Windows Time service](https://learn.microsoft.com/en-us/windows-server/networking/windows-time-service/windows-time-service-top)
- [Microsoft · Windows Time service tools and settings](https://learn.microsoft.com/en-us/windows-server/networking/windows-time-service/windows-time-service-tools-and-settings)

© 2026 Secure By Design Team LLC
