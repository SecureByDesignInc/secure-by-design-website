# Course 1.7 dhcp: audit (14 October 2026)

Five lessons, 145 minutes (2.4 h). Lesson ids, counts and minutes are unchanged, and the validator passes.

## Fixed

- **prerequisites[1] and `dhcp` step 2** (rule 2): the hypervisor's time synchronization is turned off on SBD-DHCP01 and the VLAN 80 test client. The existing `w32tm /query /source` check now has a stated requirement behind it.
- **dhcp-design step 5** (rule 3): "a read-only look at the core's VLAN 80 interface" is removed. Router management isn't a course path, and in this course no admin seat exists yet. The relay is now verified from the network's record with the network owner, and lesson 2's first lease proves it through the giaddr. Gaps still go to the network owner.

## Checked, no change needed

- **Scope**: the whole subnet 10.0.80.1–254 with exclusions .1–.99 and .200–.254, which gives Inside the Network's pool, 10.0.80.100–199, for the fleet (F04 and SBD-DHCP01's service note). It has no reservations, an 8-day lease (renew at day 4, rebind at day 7), and options 3, 6 and 15. The guide sample matches.
- **Relay**: verified, never configured (rule 3), in `dhcp-design`, `dhcp`, the quiz and the labNote.
- **Event provider** (marked unsure in notes.md):
  - Microsoft Learn's "DHCP server events" lists 1044, 1045, 1046, 1020 and 1340 as DHCP Server administrative events, and the authorization troubleshooting guide puts 1046 in the System log.
  - A `FilterHashtable` with only `ProviderName` searches every log that provider writes to, so `ProviderName='Microsoft-Windows-DHCP-Server'` finds them whichever channel they land in.
  - Event Viewer shows that provider as the source "DHCP-Server". The provider name itself isn't printed on the page, so run it once in a lab.
- **Audit-log codes**: 10 new lease, 11 renewal, 12 release, 30 DNS update requested, 31 failed, 32 successful. These are the codes Windows writes in the log's own header.
- **Commands and parameters**:
  - `Add-DhcpServerv4Scope -State InActive`
  - `Set-DhcpServerv4DnsSetting -DynamicUpdates/-UpdateDnsRRForOlderClients/-DeleteDnsRROnLeaseExpiry/-NameProtection`
  - `Set-DhcpServerDnsCredential`
  - `Backup-DhcpServer`
  - `Export-DhcpServer -Leases`
  - `Add-DhcpServerInDC`
  - the DNS record DN under `DC=DomainDnsZones` used with `Get-Acl AD:`
  - the `dsacls … CC;computer` delegation
- **Shared names match decisions.md**: svc-dhcp-dns, SBD Tier 1 Admins, the 10.0.80 reverse zone, `C:\Evidence\dhcp` with its two manifests, which course 1.8 checks, and D:\Backups\DHCP.
- **Handoffs**: to course 1.8 (administration to SBD-ADMIN-SRV01, the test client joins as the Tier 2 test machine, RSAT-DHCP leaves SBD-DC01), 1.13 (NPS) and 1.19 (backups).
- **Model link** `process=signin&step=1`: "Obtain a network address" exists.
- **Quizzes**: all 15 keys are right and every wrong option is wrong.

## Judgment calls for the owner

1. **Records owned by svc-dhcp-dns, and clients that join the domain.** With DynamicUpdates Always, a domain-joined Windows client may still try to register its own A record and be refused, because the record belongs to svc-dhcp-dns. The record stays correct, but DNS Client warnings can appear on the fleet in course 1.13 and on the test client after course 1.8.
   - Options: accept the warnings, or have course 1.13 turn off client self-registration by GPO.
   - **Recommendation**: the GPO, with the reason recorded.
2. **STIG wording not re-verified.** cyber.mil isn't reachable from here, so these come from memory:
   - application-account passwords are at least 15 characters and changed yearly and when someone who knew them leaves;
   - PasswordNeverExpires is allowed for a documented application account;
   - member servers replace Domain Admins with a server-administrator group.

   They match my knowledge of the Windows Server STIG, but check them against the current release before publishing.
3. **SBD-TEST80** is a sample name for a disposable test client that Inside the Network doesn't list. Courses 1.7 and 1.8, and both guides, use it. Keep it as a labelled sample, or rename it to match your lab.

## For other courses

- **two-tier-pki (1.6) `validate.next`**: "Course 1.5 brings DHCP and the tiered administration plane online before any fleet exists." should become "Course 1.7 builds DHCP on SBD-DHCP01, and course 1.8 brings the tiered administration plane online, before any fleet exists."
- **workstation-fleet (1.13)**:
  - prerequisites[0]: "Complete courses 1.4–1.6: working PKI services, DHCP with its relay, the tiered admin plane, and the logging pipeline" should become courses 1.6–1.12. Its "DHCP with its relay" should become "DHCP (course 1.7), whose relay course 1.7 verified".
  - `prepare`: "addressed by the course 1.5 DHCP scope" should say course 1.7.
  - `pilot`: "the secure dynamic DNS record exists on both DCs" still holds, but the records belong to svc-dhcp-dns. Don't add a check that a PC owns its record.
  - The fleet VMs also need hypervisor time sync off (rule 2).
- **prove-recovery (1.19) `requirements`**: add SBD-DHCP01's database backup and XML export (`D:\Backups\DHCP`, course 1.7 `dhcp-audit`) to the recovery set, with the restore step "set the DNS update credential again" (`Set-DhcpServerDnsCredential`).
- **Outside course content**:
  - `public/inside-network-model/courses.js` needs a `dhcp` entry ("1.7 · Run DHCP on SBD-DHCP01", `/training/dhcp`), and the mapping `dhcp:['admin','fleet']` becomes `['dhcp','admin','fleet']`.
  - `training:tiered-admin:dhcp` becomes `training:dhcp:dhcp`, plus the four new progress IDs and a saved-progress migration.
