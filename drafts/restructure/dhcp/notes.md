# Course 1.7 dhcp — notes

Five lessons, 145 minutes (2.4 h): `dhcp-design` 25 (new), `dhcp` 30 (moved from tiered-admin, id kept), `dhcp-dns` 30 (new), `dhcp-audit` 30 (new), `dhcp-prove` 30 (new). The validator passes.

## Cross-course conflicts (need changes elsewhere)

1. **two-tier-pki (1.6), repo text.** `validate.next` says "Course 1.5 brings DHCP and the tiered administration plane online before any fleet exists." It should say that course 1.7 builds DHCP on SBD-DHCP01 and course 1.8 brings the tiered administration plane online.
2. **workstation-fleet (1.13), repo text.**
   - The prerequisites say "Complete courses 1.4–1.6: working PKI services, DHCP with its relay, the tiered admin plane, and the logging pipeline". These are now courses 1.6–1.12, and the relay was verified in 1.7, not built.
   - `prepare` says "addressed by the course 1.5 DHCP scope". This should be course 1.7.
   - `pilot` expects "the secure dynamic DNS record exists on both DCs". That still holds, but the server registers these records under svc-dhcp-dns (DynamicUpdates Always), so the PCs don't own them. Don't add a check that a PC owns its record.
3. **prove-recovery (1.19), repo text.** `requirements` lists the recovery set as "the directory …, then the CA's database and keys, Group Policy, the router configuration, the log archive, and the living records". Add SBD-DHCP01's database backup and XML export (D:\Backups\DHCP, from 1.7 `dhcp-audit`), with the restore step "set the DNS update credential again". `offline-copies` ("a server custodian handles member-server backups") already covers carrying it.
4. **Outside course content.**
   - `public/inside-network-model/courses.js` needs a `dhcp` entry (`1.7 · Run DHCP on SBD-DHCP01`, href `/training/dhcp`). The mapping `dhcp:['admin','fleet']` should become `['dhcp','admin','fleet']`.
   - `content/training-progress.json` needs `training:dhcp:dhcp` in place of `training:tiered-admin:dhcp`, plus the four new IDs.
   - Saved progress needs a migration like `drizzle/0012`.
   - Old `/training/tiered-admin#dhcp` links can only be redirected client-side, because the hash never reaches the Worker.

## Decisions other courses rely on

- **Groups and accounts.** SBD Tier 1 Admins is created here, in the Admin OU, with Create Computer objects on the Servers OU. That covers that OU and computer objects only. It is the only domain group in SBD-DHCP01's local Administrators, set by hand here and by course 1.8's Servers-OU GPO after that. The update account is svc-dhcp-dns, a Domain Users member set not to expire, with its password rotated by hand. DnsUpdateProxy stays empty.
- **Scope.** The scope covers 10.0.80.1–254 with exclusions .1–.99 and .200–.254, which gives the Inside the Network pool .100–.199. There are no reservations, the lease is 8 days, and the options are 3, 6 and 15 only. DNS settings are server-level: Always, UpdateDnsRRForOlderClients, DeleteDnsRROnLeaseExpiry, NameProtection. The 10.0.80.0/24 reverse zone is created here, because course 1.2 made only 10.0.10's.
- **Test client.** SBD-TEST80 is a sample name. It stays out of the domain, with sbd.test as its primary DNS suffix. Course 1.8 joins it as the Tier 2 test machine.
- **Paths.**
  - Audit copies go to D:\DHCP\AuditArchive with a catalog.csv.
  - Backups go to D:\Backups\DHCP\<date> as a database copy plus `SBD-DHCP01.xml` and a `-hashes.csv`.
  - Evidence goes to C:\Evidence\dhcp on SBD-DHCP01 (server records, baseline) and on SBD-DC01 (Tier 0 outputs). Each has its own `C:\Evidence\dhcp-manifest.csv`, and course 1.8 checks both.
- **Tools on SBD-DC01.** Authorization needs RSAT-DHCP on SBD-DC01. Course 1.8 `admin-hosts` removes it.
- **Baseline.** SCC runs locally on SBD-DHCP01 from the 1.4 media set. The manual checks wait for a STIG Viewer checklist on SBD-ADMIN-SRV01, which course 1.8 `scan` completes.

## Sources (all checked)

- **Added**: `dhcp-scopes`, `dhcp-deploy`, `dhcp-authorize`, `domain-join`, `dhcp-troubleshoot`, `dynamic-update`, `dns-zone`, `audit-log` and `dhcp-backup`, all on learn.microsoft.com. Each came back as a hit from the Microsoft Learn search tool.
  - `dns-setting` and `dhcp-events` were fetched in full.
  - `dns-credential` and `dhcp-export` were checked with WebFetch.
- **Reused**: `dhcp` from the repo, `disa-scap` and `filehash` from 1.4, and `controls`.
- **Facts checked against those pages**:
  - Enterprise Admins authorizes, and authorization objects live in Configuration › Services › NetServices.
  - A DHCP server on a DC inherits the DC's DNS rights.
  - Members of DnsUpdateProxy create unsecured records.
  - DHCP DNS credentials aren't included in DHCP backups.
  - NameProtection makes an update fail when another client's record exists, and it writes DHCID records.
  - The DynamicUpdates values, and DeleteDnsRROnLeaseExpiry needing Always or OnClientRequest.
  - Events 1044, 1046, 1045, 1020, 1340 and the operational "… by %2" events.
  - Microsoft recommends a full-subnet scope with exclusions, and the default lease is 8 days.
  - Joining needs Create Computer objects on the OU, and Microsoft advises against relying on MachineAccountQuota.
  - Resolve-DnsName supports `-Type DHCID`.

## Unsure (check in a lab)

- **Event provider name.** Events are queried with `ProviderName='Microsoft-Windows-DHCP-Server'` rather than a log name. I believe this is the provider for 1044 and 1340, but I haven't run it.
- **STIG wording from memory.** The STIG pages couldn't be fetched, so these come from memory:
  - application accounts are excluded from the password-expiry check;
  - manually managed application passwords need at least 15 characters;
  - those passwords are changed at least once a year;
  - member servers replace Domain Admins with a server-administrator group.
- **Audit log codes.** I used 10/11/12/30/31/32. They come from the older "Analyze DHCP Server Log Files" page in previous-versions, which isn't cited.
- **Domain-joined clients.** With DynamicUpdates Always, a domain-joined Windows client (the 1.13 fleet, or the test client after 1.8) may still try to register its own A record and be refused, because the record belongs to svc-dhcp-dns. The records stay correct, but clients may log DNS Client errors. If that's noisy, course 1.13 could turn off client registration by GPO.
- **Stray lease.** Deleting the stray lease after the takeover test shouldn't touch the test client's record, because name protection checks the DHCID. The step re-checks the name anyway.
- **Backup-DhcpServer path.** It writes through the DHCP service, so the lesson backs up to the default `%windir%\System32\dhcp\backup` (Microsoft's own example) and then copies to D:, rather than pointing the service at D:.
