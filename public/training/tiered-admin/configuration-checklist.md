# Addressing and tiered administration — configuration checklist

Secure By Design · Edition 1.0 · 7 October 2026

This course builds the control plane before the fleet exists: DHCP for the workstation VLAN, and a tiered administration model where privileged sessions only ever start from dedicated hosts. The model's rule is strict — the jump systems administer; they browse nothing, read no mail, and accept no inbound sessions from user space.

## Before you start

- [ ] Complete course 1.5: the routed network with its ACL register, and course 1.3's OU structure with the Admin OU in place.
- [ ] Provision Windows Server 2025 hosts for SBD-DHCP01 (10.0.20.10) and the three administration systems in VLAN 60: AdminJumpBox01 (.10), SBD-ADMIN-SRV01 (.20), SBD-ADMIN-PC01 (.30).
- [ ] Decide the privileged accounts: separate admin identities per tier, never daily-driver accounts with admin rights.

## Design the tiers and the address plan

- [ ] Define three tiers against what exists: Tier 0 is the identity and trust fabric (DCs, both CAs, PKI-MGMT01), Tier 1 the member servers, Tier 2 the user endpoints. Map each tier to its OU from course 1.3 and to the admin system that will manage it.
- [ ] Write the credential rule per tier: a Tier 0 account signs in only on Tier 0 systems and AdminJumpBox01; Tier 1 admins work from SBD-ADMIN-SRV01; Tier 2 from SBD-ADMIN-PC01. Each administrator gets separate per-tier accounts — the daily account holds no admin rights anywhere.
- [ ] Plan the DHCP design: scope 10.0.80.100–149 for the workstation VLAN, options for router 10.0.80.1, the two DCs as DNS, and the sbd.test domain; the core router relays VLAN 80 broadcasts to SBD-DHCP01; everything else stays static.
- [ ] Add the register rows this course needs: VLAN 60 to each tier's management ports, DHCP relay from the core to SBD-DHCP01, and explicit denies from VLAN 80 into VLAN 60 — user space never initiates toward the admin plane.

**Verify:** The tier map names systems, OUs, admin hosts, and accounts for every tier; the DHCP plan is written; and the register has the new permit and deny rows with owners.

**Evidence:** Keep the tier access matrix, the per-administrator account plan, the DHCP scope design, and the updated register rows.

Notes / result / date: __________________________

## Build SBD-DHCP01 and the relay

- [ ] Install the DHCP role on SBD-DHCP01 in the Servers OU and complete directory authorization — an unauthorized Windows DHCP server refuses to serve domain networks, which is the built-in rogue check worth explaining on camera.
- [ ] Create the IPv4 scope 10.0.80.100–149 with the planned options: router 10.0.80.1, DNS 10.0.10.10 and 10.0.10.11, domain sbd.test. Leave every other VLAN static as designed.
- [ ] Configure dynamic DNS updates using a dedicated low-privilege credential so client records register securely in the sbd.test zone from course 1.2.
- [ ] Enable the DHCP relay on the core router's VLAN 80 interface toward 10.0.20.10, confirm the register row permits it, then pull a lease with a temporary test VM in VLAN 80 and watch its A record appear.

**Verify:** The server shows as authorized, the scope serves the planned range and options through the relay, and the test client's secure dynamic DNS record exists on both DCs.

**Evidence:** Record the authorization output, scope and option configuration, the relay setting on the core, and the test lease with its DNS registration.

Notes / result / date: __________________________

## Build the administration systems

- [ ] Build AdminJumpBox01, SBD-ADMIN-SRV01, and SBD-ADMIN-PC01 as clean Windows Server 2025 (or Windows 11, for the endpoint seat) installs, joined into an Admin OU sub-structure so course 1.3's hardening GPOs apply from first boot.
- [ ] Strip them to purpose: no browsing to anything but internal admin interfaces, no mail, no file shares hosted, and the management tools for exactly their tier — RSAT on the server seats, endpoint tooling on the PC seat.
- [ ] Register the management paths: VLAN 60 to Tier 0 and Tier 1 ports (remote desktop 3389, remote management 5985–5986) from the specific admin host each tier allows, and keep the VLAN 80 → VLAN 60 deny from lesson 1 in force.
- [ ] Require the admin hosts' own local firewalls to accept management inbound from nowhere — sessions originate here, they never terminate here.

**Verify:** All three hosts sit in the Admin OU with the hardening GPOs applied, management ports answer from the correct admin host per tier, and nothing in user space can open a session toward VLAN 60.

**Evidence:** Record each host's build sheet, OU placement, gpresult output, and the register rows for its permitted management paths.

Notes / result / date: __________________________

## Restrict where privilege can sign in

- [ ] Create tier logon GPOs: on the Workstations and Servers OUs, deny interactive, remote desktop, and network logon to the Tier 0 admin group; on the Workstations OU, deny the Tier 1 group the same — each tier's credentials simply stop working below their tier.
- [ ] Add Tier 0 administrators to the Protected Users group so the domain refuses their weaker authentication paths, and note the Windows Server 2025 behavior that supports this design: RC4 ticket-granting tickets are gone and legacy remote password changes are blocked for protected accounts.
- [ ] Keep the built-in safety valves: one documented break-glass account, excluded from the deny policies, with its password sealed and its every use alarmed in a later logging course.
- [ ] Record the multifactor decision the model calls for on VLAN 60 — smart card or certificate-based sign-in for privileged accounts is the natural follow-on to course 1.6's templates; write the decision and its target date even if implementation waits.

**Verify:** A Tier 0 account's sign-in attempt on a Tier 2 test machine is refused by policy and produces the matching denial event; Protected Users contains the Tier 0 admins; the break-glass and MFA decisions are written.

**Evidence:** Keep the logon-rights GPO reports, the refused sign-in's event capture, the Protected Users membership, and the break-glass and MFA decision records.

Notes / result / date: __________________________

## Prove the tiers and the addressing

- [ ] From AdminJumpBox01, manage a DC with a Tier 0 account; from SBD-ADMIN-SRV01, manage SBD-DHCP01 with a Tier 1 account; from SBD-ADMIN-PC01, manage the VLAN 80 test client with a Tier 2 account. Record each success with its session details.
- [ ] Attempt the forbidden combinations — Tier 0 credentials at the test client, a session from VLAN 80 toward VLAN 60 — and capture both the refusal the user sees and the event or deny-log entry the infrastructure writes.
- [ ] Renew the test client's lease and confirm options, registration, and the relay still behave with all restrictions active; the control plane must not have broken the service plane.
- [ ] Reconcile the tier access matrix against what you just proved and file it with the register — the two documents together are the admin plane's assessable record.

**Verify:** Every in-tier path succeeds, every tested out-of-tier path fails with captured evidence, and DHCP with dynamic DNS still works end to end under the full rule set.

**Evidence:** Keep the completed tier matrix with timestamps, the denial captures, and the post-restriction lease and registration proof.

Notes / result / date: __________________________

## Delta scan and hand off

- [ ] Run first baselines on SBD-DHCP01 and the three admin hosts with the standard benchmark and tool versions, and rescan the domain controllers — the logon-rights GPOs are the expected delta there.
- [ ] Add this course's rows to the living records: the deny-logon and Protected Users decisions into the exception record where they interact with STIG values, and the new permit and deny rows into the register with owners.
- [ ] Confirm the admin hosts appear in the hardening course's quarterly cadence; privileged seats are rescanned first from now on, not last.
- [ ] Write the handoff: administration now has a home, which means the logging course can require that SIEM consoles and collectors are managed only from VLAN 60 — say so explicitly for course 1.8.

**Verify:** Four baselines and the DC rescans are filed with attributed deltas, the exception record and register carry the new rows, and the handoff names the logging course's management constraint.

**Evidence:** Finish the checklist: scan set, updated records, the tier matrix, and the handoff note.

Notes / result / date: __________________________
