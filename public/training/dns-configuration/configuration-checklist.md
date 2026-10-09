# Configure DNS and time — configuration checklist

Secure By Design · Edition 1.3 · 9 October 2026

The addresses and names below continue the training example. Match every change to your own address plan. This network has no internet DNS or time dependency: names resolve on the domain controllers, and time comes from the PDC emulator, SBD-DC01.

## Before you start

- [ ] Complete course 1.1, the DC01 + DC02 identity build, with both domain controllers healthy. Both were promoted with the DNS server option selected, and SBD-DC02 still uses SBD-DC01 for DNS.
- [ ] Use an isolated Windows Server 2025 practice environment and an account delegated to manage DNS.
- [ ] Continue the existing sbd.test example: SBD-DC01 is 10.0.10.10 and SBD-DC02 is 10.0.10.11 on 10.0.10.0/24.
- [ ] The network's routing and VLAN segmentation are already in place, with a documented service-path register.

## Map names to the network

- [ ] Start with what DNS answers. An A record maps a host name to an IPv4 address (AAAA maps to IPv6), so SBD-DC01.sbd.test resolves to 10.0.10.10. Service (SRV) records advertise which servers offer a service: a domain member asks for _ldap._tcp.dc._msdcs.sbd.test, resolves a listed controller's name, contacts it, and only then authenticates. DNS never checks a password, and it works on an isolated network with no internet access.
- [ ] Record the domain, each subnet, both DNS addresses, and the owner of each service name. Keep host records and service aliases distinguishable.
- [ ] On each domain controller, confirm the DNS Server service is installed and running; an address typed into a network adapter installs nothing. Then open DNS Manager and review the sbd.test and _msdcs.sbd.test zones that promotion created, without creating duplicates. The DNS delegation warning from course 1.1's promotion is expected: no parent zone exists above the isolated .test namespace, so no action is needed.
- [ ] Set each controller's DNS client order. Promotion pointed SBD-DC01 at itself (the loopback address, 127.0.0.1) while it was the only controller, and SBD-DC02 pointed at SBD-DC01 so it could find the domain. Run the replication summary first; once replication succeeds in both directions, list the partner controller first and the loopback address second on each, and never an outside resolver. Domain members list both controllers; a public resolver is not an alternate for this environment.
- [ ] Confirm the network's service-path register permits DNS: every networked system to both domain controllers on TCP and UDP 53 (rule F01 in Inside the Network). A member has to find a controller before any Kerberos, LDAP, or Group Policy traffic can start.
- [ ] Decide whether any separate internal namespace needs a conditional forwarder. With no recursive dependencies, document a no-recursion design; do not add internet forwarders or delete every root hint as a shortcut.

**Commands:**

```
Invoke-Command SBD-DC01,SBD-DC02 { Get-WindowsFeature DNS; Get-Service DNS }
repadmin /replsummary
Get-DnsClientServerAddress -AddressFamily IPv4 -CimSession SBD-DC01,SBD-DC02
# After replication succeeds both ways (adapter name varies):
Set-DnsClientServerAddress -CimSession SBD-DC01 -InterfaceAlias Ethernet `
  -ServerAddresses 10.0.10.11,127.0.0.1
Set-DnsClientServerAddress -CimSession SBD-DC02 -InterfaceAlias Ethernet `
  -ServerAddresses 10.0.10.10,127.0.0.1
Get-DnsClientServerAddress -AddressFamily IPv4 -CimSession SBD-DC01,SBD-DC02
Get-DnsServerZone -ComputerName SBD-DC01
```

**Verify:** Both controllers run the DNS Server service and, once replication succeeds both ways, list their partner first and the loopback address second. Members list both controllers only; the AD zones, the recursion decision, and the register rows that permit DNS are recorded.

**Evidence:** Save the address/name worksheet, each controller's DNS client order and the reason for it, and the initial zone inventory before changing anything else.

Notes / result / date: __________________________

## Configure forward and reverse zones

- [ ] In DNS Manager, inspect sbd.test Properties. Confirm that it is AD-integrated and choose the domain or forest replication scope that matches the DNS servers intended to host it. Domain-wide zones live in the DomainDnsZones partition and forest-wide zones in ForestDnsZones, the partitions you saw in course 1.1's replication and DCDiag output.
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

- [ ] From a domain client or either controller, query each DNS server by address for both controllers' host records, so each result tells you which server answered. Expect SBD-DC01.sbd.test at 10.0.10.10 and SBD-DC02.sbd.test at 10.0.10.11 from both servers.
- [ ] Query the domain controller locator service (SRV) records against both servers. These records let a client discover domain controllers; an ordinary host lookup does not prove discovery works, and a locator answer does not by itself prove that every listed controller is reachable.
- [ ] Run the DNS diagnostics against every domain controller, then the replication summary. Classify root-hint, forwarder, and delegation findings against the documented isolated design instead of treating them as faults, and investigate everything else.
- [ ] During an approved lab test, make one DNS server unavailable to the test client and verify resolution through the other. Restore connectivity and repeat for the opposite server. Do not interrupt shared production services for this exercise.
- [ ] Optional: see the locator query on the wire. On SBD-DC02, in an elevated PowerShell window, capture port 53 with Packet Monitor (pktmon), which is built into Windows Server 2025, while you query SBD-DC01, so the request crosses the network. Expect a query from 10.0.10.11 to 10.0.10.10 on UDP port 53 and an answer naming both controllers on port 389. Read the text file, or open the .pcapng file in a packet analyzer such as Wireshark, and keep the capture with your evidence; it holds only the traffic the filter allowed.

**Commands:**

```
foreach ($server in '10.0.10.10','10.0.10.11') {
  Write-Output "DNS server: $server"
  Resolve-DnsName 'SBD-DC01.sbd.test' -Type A -Server $server
  Resolve-DnsName 'SBD-DC02.sbd.test' -Type A -Server $server
  Resolve-DnsName '_ldap._tcp.dc._msdcs.sbd.test' -Type SRV -Server $server
}
dcdiag /test:DNS /e /v
repadmin /replsummary
# Optional, on SBD-DC02: capture the locator query
New-Item -ItemType Directory C:\Evidence -Force
pktmon filter remove
pktmon filter add DNS -p 53
pktmon start --capture --comp nics --pkt-size 0 --file-name C:\Evidence\dc-locator.etl
Resolve-DnsName '_ldap._tcp.dc._msdcs.sbd.test' -Type SRV -Server 10.0.10.10
pktmon stop
pktmon etl2txt C:\Evidence\dc-locator.etl --out C:\Evidence\dc-locator.txt
pktmon etl2pcap C:\Evidence\dc-locator.etl --out C:\Evidence\dc-locator.pcapng
pktmon filter remove
```

**Verify:** Both DNS servers return both controllers' host records and the domain controller locator records, the DCDiag DNS findings are explained, replication is healthy, and the client still resolves internal names when either resolver is unavailable. If you ran the capture, it shows the query from 10.0.10.11 and the answer from 10.0.10.10.

**Evidence:** Keep paired lookup results with the server queried, the DCDiag and replication output, the failover test record with start, restore, and final verification times, any capture file, and a short statement of what the results do and don't establish: DNS helps users find the identity service, but a correct answer proves nothing about authentication.

Notes / result / date: __________________________

## Make SBD-DC01 the domain's time source

- [ ] Confirm which domain controller holds the PDC emulator role — SBD-DC01 in this sample. The PDC emulator of the forest root domain sits at the top of the Windows Time hierarchy, so it is the one system you configure; everything else follows it.
- [ ] On SBD-DC01, mark Windows Time as a reliable time source with no external peer, so it serves time from its own clock. In an air-gapped network that clock is the reference by declaration: record how it is set and checked — for example, compared on a schedule against an approved reference and corrected by an administrator, with each correction recorded — and the drift threshold you will hold it to.
- [ ] Turn off the hypervisor's time synchronization for both domain controller virtual machines, so the host clock cannot silently override the PDC emulator. SBD-DC02 syncs from the PDC emulator, every other domain member keeps the default domain-hierarchy sync from the domain controllers, and the domain-joined Linux servers in later courses point chrony or ntpd at both domain controllers.
- [ ] Confirm the network's service-path register permits time — every member to both domain controllers on UDP 123 — and write the time design into the build record: course 1.3's hardening Group Policy objects (GPOs) must leave it intact, and if a Security Technical Implementation Guide (STIG) value disagrees with it, that course's deviation record is where the decision lives.
- [ ] Verify the chain end to end: SBD-DC01 serving as the reliable source, SBD-DC02 and a member server sourcing from a domain controller, and offsets within your recorded threshold.

**Commands:**

```
Get-ADDomain | Select-Object PDCEmulator   # expected: SBD-DC01.sbd.test
# On SBD-DC01 (the PDC emulator): serve time from its own clock as the reliable source
w32tm /config /reliable:yes /update
Restart-Service w32time
w32tm /query /source   # on SBD-DC01: Local CMOS Clock
# On SBD-DC02 and a member server:
w32tm /query /source   # expected: a domain controller
w32tm /query /status
w32tm /stripchart /computer:SBD-DC01.sbd.test /samples:3 /dataonly
```

**Verify:** SBD-DC01 reports itself as the reliable source (Local CMOS Clock), SBD-DC02 and the member server report a domain controller, host time synchronization is off for both domain controllers, and measured offsets sit inside the documented threshold.

**Evidence:** Record the time design decisions (how DC01's clock is set and checked, and the drift threshold), the source and status output from both controllers and the member, the stripchart offsets, the hypervisor setting for both domain controller VMs, and the register rows that permit time: every member to the domain controllers.

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
- [Microsoft · What is DNS?](https://learn.microsoft.com/en-us/windows-server/networking/dns/dns-overview)
- [Microsoft · Best practices for DNS client settings](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/best-practices-for-dns-client-settings)
- [Microsoft · Manage DNS zones](https://learn.microsoft.com/en-us/windows-server/networking/dns/manage-dns-zones)
- [Microsoft · Active Directory-integrated DNS zones](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/active-directory-integrated-dns-zones)
- [Microsoft · Manage DNS resource records](https://learn.microsoft.com/en-us/windows-server/networking/dns/manage-resource-records)
- [Microsoft · Locating domain controllers](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/dc-locator-changes)
- [Microsoft · Resolve-DnsName](https://learn.microsoft.com/en-us/powershell/module/dnsclient/resolve-dnsname)
- [Microsoft · Dcdiag](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/dcdiag)
- [Microsoft · Packet Monitor (pktmon)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/pktmon)
- [Microsoft · Service overview and network port requirements](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/service-overview-and-network-port-requirements)
- [Microsoft · AD DS configuration wizard page descriptions](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/ad-ds-installation-and-removal-wizard-page-descriptions)
- [Microsoft · Install-ADDSForest](https://learn.microsoft.com/en-us/powershell/module/addsdeployment/install-addsforest)
- [Microsoft · Windows Time service](https://learn.microsoft.com/en-us/windows-server/networking/windows-time-service/windows-time-service-top)
- [Microsoft · Windows Time service tools and settings](https://learn.microsoft.com/en-us/windows-server/networking/windows-time-service/windows-time-service-tools-and-settings)

© 2026 Secure By Design Team LLC
