# Re-audit review notes (8–9 October 2026)

Working notes behind the re-audit doc. Locations are `course id / lesson id` in `content/configuration-courses.json` unless a file is named. Course numbers: 1.2 dns-configuration, 1.3 harden-baseline, 1.4 two-tier-pki, 1.5 connect-segment, 1.6 pki-services, 1.7 tiered-admin, 1.8 logging-pipeline, 1.9 workstation-fleet, 1.10 patch-protect, 1.11 business-services, 1.12 prove-recovery.

## Evidence for the high and medium material findings

| ID | Where | What the material says |
| --- | --- | --- |
| M16 | two-tier-pki prerequisites and /request; connect-segment /design and /router; dc01-dc02 lesson.json | "SBD-SUBCA01 joined to sbd.test"; "today there is no gateway"; "10.0.30.1 on the issuing CA"; 1.1: "No gateway is needed for this same-subnet exercise". /publish imports only the root certificate before "start Certificate Services"; no `certutil -dspublish` or CRL `-addstore` anywhere. /validate runs `certutil -urlfetch -verify`; connect-segment /prove tests `pki.sbd.test` port 80; pki-services prerequisites need "pki.sbd.test reachable over HTTP", built in pki-services /publication. |
| M17 | pki-services /publication step 1; two-tier-pki /design | "install the Web Server role and create a site … Serve .cer, .crt, and .crl files"; daily delta CRL (`CRLDeltaPeriodUnits=1`). No `allowDoubleEscaping`. Microsoft: "How to avoid delta CRL download errors … IIS7". |
| M18 | connect-segment /acls; public/inside-network-model/security.js (rules from line 53); content/inside-the-network.json 369–370 | RPC permitted only "to VLAN 10"; only F15 and A01 target SUBCA01; "Certificate enrollment" / "Transport to define". Enrollment uses RPC TCP 135 plus 49152–65535 (Microsoft port requirements). |
| M19 | tiered-admin /admin-hosts step 0, /logon-restrictions steps 0–2, /prove; harden-baseline /ou-design step 3 | Member-server STIG GPOs linked to Admin Servers and Tier 0 Servers; the course notes the STIG sets "Domain Admins and Enterprise Admins"; prove: "From AdminJumpBox01, manage a DC and SBD-SUBCA01 with a Tier 0 account". WN25-MS-000110 (deny local logon) and WN25-MS-000080 (deny network logon). |
| M20 | pki-services /template-admin; tiered-admin /logon-restrictions | `Get-ADGroup` from PKI-MGMT01 and `(Get-ADGroup …).SID.Value # from an admin seat`; no rule carries TCP 9389 (ADWS), though the model's DC entry lists it. |
| M21 | logging-pipeline /design step 1, /collector steps 0 and 2; workstation-fleet /nac and /scale; business-services /design, /fileserver, /apps-web; patch-protect /epo; security.js:61 | Forwarding only from "the DCs and admin hosts"; syslog intake "for UDP 514"; F07 is "TCP 6514; mutual trust" and is never built; checks "NPS events appear in the collector", "the denial lands in the pipeline", "test detection traveled … to the analyst's search". |
| M22 | workstation-fleet /laps | "Grant read access … to the Tier 2 admin group only"; "managed built-in administrator"; "use it once"; `Get-LapsADPassword … -AsPlainText`. No decryptor setting. Microsoft LAPS policy settings; WN11-SO-000005. |
| M23 | workstation-fleet /nac step 2 | "(Wired AutoConfig, EAP-TLS, the approved root as the trusted CA)"; no authentication mode. Default is user re-authentication (Microsoft wired 802.3 policy settings). |
| M24 | business-services /apps-web | `curl -sS … https://SBD-APPS01.sbd.test/`; root trust distributed only through Group Policy (two-tier-pki /publish). |
| M25 | prove-recovery /offline-copies and /rehearse | `Get-FileHash … E:\Backups\SBD-DC02\*.vhdx`, `F:\Media-0012\SBD-DC02\*.vhdx`; `wbadmin get versions -backupTarget:<media-volume> -machine:SBD-DC02`. No WindowsImageBackup anywhere. |
| M26 | prove-recovery /rehearse | `wbadmin start systemstaterecovery …` without `-authsysvol` on an isolated copy, then "services, shares, a directory query". |
| M27 | content/inside-the-network.json building hosts; dc01-dc02 lesson.json /prepare; connect-segment /time | HV01 runs DC01, HV02 runs DC02; only "Verify clocks are aligned"; check "The PDC emulator reports SBD-TIME01 as its source". |
| M28 | connect-segment prerequisites and /time; content/inside-the-network.json:339; architecture.js:36; security.js:5 | "a new virtual machine for the layer-3 router (SBD-CORE01) … a Windows Server 2025 VM for SBD-TIME01"; "workgroup or domain-joined"; model: "Rack appliance · R01", "Two core switches"; `time` in windowsMembers (F01–F03, F06, F16–F18, A02). |
| M29 | prove-recovery /trust-state and /requirements; architecture.js:62 | Only `certutil -backup`; facility lists "AD/DNS, PKI, files, SQL, and network configuration" plus Splunk, Nessus and ePO. |
| M30 | patch-protect /mgmt, /wsus step 3, /nessus step 2; security.js:17 and :69 | Inventory "the 1.9 fleet list, the servers, the admin plane, the router"; "Pilot and broad-ring approvals are Tier 1 work"; "quarterly"; model "monthly patch/scan cycle"; F15 targets omit PKI-MGMT01, AUDIT01 and the admin seats. |
| M31 | pki-services /first-templates and /template-admin step 2 | `certutil -template 'SBDComputerAuthentication' \| Select-String 'msPKI-Certificate-Name-Flag','msPKI-Minimal-Key-Size'`; "no Tier-0 account edits templates as routine work". |
| M32 | public/training/rmf/app.js:84 | "Rules still pending in the Inside the Network policy register (F04, F08, F09, F12, F15, F16, and the A01–A04 management protocols)". |
| M33 | public/inside-network-model/app.js:93 and :96; inventory.js:154, 196, 343, 384, 405, 425; technical.js:45, 103, 111; content/inside-the-network.json 344, 405, 436; docs/inside-the-network.md; app/inside-the-network/page.tsx:9; model.html | "not specified", "Listeners to define", "unspecified", "not provided"; share text "Explore a 3D data center"; "AIR-GAPPED DATA CENTER". |

## M36: smaller fixes in courses 1.2–1.7

1. dns-configuration /records: titled "Create and maintain service records" and the model text says "The SRV records you create here", but the lesson creates A, PTR and CNAME records; the DCs register SRV records themselves. Retitle to host and alias records.
2. dns-configuration /zones: only the 10.0.10 reverse zone is created, and 10.0.10 reads the same reversed. Plan a reverse zone per subnet with a non-palindromic example (10.0.30.0/24 is 30.0.10.in-addr.arpa).
3. two-tier-pki /design: "a base CRL every 26 weeks with an overlap period" gives no overlap value. Add CRLOverlapPeriod/CRLOverlapUnits for the root and the issuing CA.
4. two-tier-pki /publish and /validate: "Enroll a disposable test certificate using the approved template", but LoadDefaultTemplates=0 and no template exists until 1.6. Name the 1.4 test template or move the enrollment test to 1.6.
5. pki-services /publish-trust: `certutil -verify -urlfetch C:\Evidence\pki\test.cer` "passes", but the only test.cer is 1.4's, which 1.4 revokes. Enroll a fresh certificate, or expect "revoked".
6. pki-services /first-templates quiz: says Windows Server 2025 rejects TLS server certificates under 2048 bits; Microsoft's change covers roots in the Trusted Root Program, not enterprise CAs. Base the 2048-bit floor on NIST SP 800-57.
7. harden-baseline /staging sources: SCC is downloaded from https://www.cyber.mil/stigs/SCAP/, not only the SRG/STIG tools page. Add it.
8. tiered-admin prerequisites: "Provision Windows Server 2025 hosts for … the three administration systems", but SBD-ADMIN-PC01 runs Windows 11.
9. tiered-admin /logon-restrictions and /design: drill step 6 is stopped by the register's default deny, not by the logon-restriction GPOs (which never apply to DCs); "explicit denies from VLAN 80 into VLAN 60" has no register row; /prove links the peer-RDP view whose host-firewall rule is built in 1.9.

## M37: smaller fixes in courses 1.8–1.12 and the model

1. -MaxEvents 5 as proof: logging-pipeline /collector, workstation-fleet /scale and patch-protect /epo prove coverage with the five newest forwarded events. Filter by StartTime and group by MachineName.
2. logging-pipeline /analyze: "Search three: time-service events and offsets" has no data, because the subscription carries Security-log IDs only. Add the Time-Service events or collect w32tm /stripchart output.
3. workstation-fleet /certificates: "Autoenrollment permission … to the Workstations OU's computers" can't be granted to an OU. Use a group (Domain Computers) and note that new members need a restart.
4. Evidence paths: C:\Evidence\fleet\SBD-PC01.cer (1.9) and C:\Evidence\services\ (1.11) sit outside the folders those courses hash; 1.12's `C:\Evidence\recovery\gpo-backup\*` misses the per-GPO subfolders. Use `Get-ChildItem -Recurse -File | Get-FileHash`.
5. workstation-fleet /scale: "every unknown device that appears later is quarantined", but a re-imaged PC then can't join. Add a staging port or a temporary monitor-mode change under change control.
6. patch-protect /wsus: WSUS products include Defender definitions, but lesson 1 says definitions come only through SBD-EPO01. Drop them or record the exception.
7. patch-protect /epo (and the model): "endpoints open no listener (TCP 8081, UDP 8082)" with peer-to-peer and RelayServer off; Trellix lists 8081 as inbound for ePO wake-up calls. Also disable wake-up call support.
8. business-services: the model maps SC-28(1) to SBD-FS01 and SBD-SQL01, but no step configures BitLocker or TDE or records a deviation.
9. patch-protect wording versus the model: "credentialed reach into each VLAN" (F15 omits several hosts); WMI without ports (TCP 135 plus the dynamic range); `Test-NetConnection 10.0.70.20 -Port 80` from Windows is blocked by F19 (use curl from SPLUNK01); the scanner and analysis hosts are fixed as domain-joined Linux in the model.
10. security.js F06 lists four update rings (pilot, workstations, member servers, then DCs); patch-protect has three.
11. Model control names: AU-9(4), IA-2(2), AC-6(5), SI-4(2) and SI-4(4) show the enhancement name alone, against the AGENTS.md "Base | Enhancement" rule.

## Security evidence

- S18: server/reader-auth.js:38 (`signin-email-all…` capped at 50 per inbox, plus 10 per inbox per network), checked at line 63 before the password at 64–65; line 76 caps code emails at 10 a day and 5 an hour per inbox. server/native-auth.js:70–74 shares the counters.
- S19: server/sign-in-methods.js:305–306; app/app-sign-in/app-sign-in.tsx:15; server/index.js:34.
- S20: server/limits.js:42–49 strips only +tags.
- S21: server/native-auth.js:56–62 against server/sign-in-methods.js:308–311.
- S22: server/security-headers.js:6.
- S25: Worker observability `redact_query_string: false`; app hand-off codes live two minutes (server/sign-in-methods.js:302).
- S26: production `d1_migrations` includes 0010_founding_waitlist.sql, which drizzle/ doesn't contain.
