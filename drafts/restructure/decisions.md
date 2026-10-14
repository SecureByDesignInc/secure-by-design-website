# Cross-course decisions (binding for every course)

These settle the questions the course writers raised. Where a course disagrees with this file, the course changes.

## Path and who builds what

| No. | Course id | Builds / owns |
|---|---|---|
| 1.1 | dc01-dc02 | SBD-DC01 (10.0.10.10), SBD-DC02 (10.0.10.11), the sbd.test forest, AD-integrated DNS installed at promotion |
| 1.2 | dns-configuration | Zones, records, DNS client order, the 10.0.10 reverse zone, the reserved pki.sbd.test alias |
| 1.3 | domain-time | The time hierarchy (SBD-DC01 = PDC emulator = reliable source), the Linux chrony file |
| 1.4 | stig-scap | SCC (on both DCs) and STIG Viewer (on SBD-DC01); staged DISA content in C:\Staging\DISA; baseline, checklists and findings record under C:\Evidence\baseline |
| 1.5 | harden-baseline | The OU structure and redirects; the DISA GPOs imported and linked; rescan under C:\Evidence\hardened; the living exception record C:\Evidence\exception-record.csv; GPO backups |
| 1.6 | two-tier-pki | SBD-ROOTCA01 (offline), SBD-SUBCA01, SBD-PKI-MGMT01 (pki.sbd.test publication, template seat), the certificate templates |
| 1.7 | dhcp | SBD-DHCP01 (10.0.20.10), the VLAN 80 scope (pool 10.0.80.100–199), svc-dhcp-dns, the SBD Tier 1 Admins group, the 10.0.80 reverse zone; verifies the core's relay (F04) |
| 1.8 | tiered-admin | AdminJumpBox01 (Tier 0, no VMs), SBD-ADMIN-SRV01 (Tier 1, Hyper-V host), SBD-ADMIN-PC01 (Tier 2 VM on SBD-ADMIN-SRV01); Admin Servers, Admin Workstations and Tier 0 Servers OUs; tier logon GPOs; Protected Users; break-glass; the SBD Audit Custodians group; moves SCC, STIG Viewer and C:\Evidence to AdminJumpBox01 |
| 1.9 | linux-repository | SBD-REPO01 (10.0.70.20, not domain-joined); the Linux client configuration; stages SCC for Linux and the distribution STIG benchmark for every Linux server |
| 1.10 | logging-pipeline | SBD-SYSLOG01 (10.0.20.20), Windows Event Forwarding, the SBD Event Sources group, the syslog intake |
| 1.11 | audit-repository | SBD-AUDIT01 (10.0.50.40), the Audit Servers OU, the LogArchive share, the KDS root key (first gMSA in the path), the SBD-Archive$/SBD-Catalog$/SBD-Retention$ gMSAs, the SBD Auditors group |
| 1.12 | splunk-analysis | SBD-SPLUNK01 (10.0.50.10, domain-joined Linux), the universal forwarder on SBD-SYSLOG01, the alerts |
| 1.13 | workstation-fleet | The 50 Windows PCs (10.0.80.100–199), NPS/802.1X on SBD-DHCP01 (F20), Windows LAPS, fleet certificates |
| 1.14 | patch-protect | SBD-WSUS01 (10.0.20.30), the four update rings, the air-gap export/import path |
| 1.15 | management-server | SBD-MGMT01 (10.0.70.10), the living inventory |
| 1.16 | endpoint-protection | COMING SOON — SBD-EPO01. No material. |
| 1.17 | vulnerability-scanning | COMING SOON — SBD-NESSUS01. No material. |
| 1.18 | business-services | SBD-FS01, SBD-SQL01, SBD-APPS01, SBD-WEB01 (VLAN 40) |
| 1.19 | prove-recovery | Backups, custody, the rehearsed restore, the closing record |
| 2.1–2.3 | rmf-boe-ato, rmf-body-of-evidence, rmf-authorization-to-operate | Network Authorization (unchanged numbering) |

Every "course X.Y" reference must point at the course in this table that actually teaches the thing. Lessons inside a course are referred to by their number in that course.

## Rules

1. **Coming soon means absent.** No lesson in any course may depend on SBD-EPO01 or SBD-NESSUS01, their agents, or credentialed vulnerability scans. Where a course used them, use what exists: SCC/STIG baselines and rescans, the inventory, the logs. Mention courses 1.16/1.17 only as "coming soon", at most once where it genuinely helps. Inside the Network still shows both systems.
2. **Time.** SBD-DC01 (PDC emulator) is the only reliable source, with no external peer; every other Windows system follows the domain hierarchy (NT5DS). Every virtual machine — the DCs and every member, including SBD-ADMIN-PC01 — has the hypervisor's time synchronization turned off and takes time from the domain. Every Linux server (domain-joined or not, including SBD-REPO01) uses the course 1.3 chrony file — both DCs as servers, `maxdistance 16` — applied before its first domain join or package update. No time settings come from Group Policy.
3. **The core router is never configured by a course.** Courses read its deny log, add rows to the service-path register and probe denials. Its deny log already goes to the collector address as syslog on UDP 514 (part of the network's existing configuration; Inside the Network gets a matching register row). Course 1.10 opens the intake and confirms the router's traffic arrives; it does not "point the router" anywhere. The DHCP relay (F04) is likewise already configured and only verified.
4. **Event collection.** Course 1.10 enrols every Windows system that exists at that point (both DCs, SBD-SUBCA01, SBD-PKI-MGMT01, SBD-DHCP01, the admin seats) and collects the Security log plus the time events (4616 and the Microsoft-Windows-Time-Service events the course 1.3 troubleshooting lesson names). From course 1.11 on, every course that builds a Windows system enrols it in the SBD Event Sources group in its closing lesson, and every Linux server sends syslog over TLS (TCP 6514, F07) to SBD-SYSLOG01, trusting the course 1.6 root CA.
5. **Assessment follows the tiers.** Course 1.4 runs SCC on both DCs and STIG Viewer on SBD-DC01. Course 1.8 moves SCC, STIG Viewer and C:\Evidence (with the exception record) to AdminJumpBox01 for Tier 0 scans, and installs a separate SCC copy on SBD-ADMIN-SRV01 for Tier 1 (member-server) scans. Workstation (Tier 2) scans run from SBD-ADMIN-PC01 with its own SCC copy, installed in course 1.13. Linux servers are scanned with SCC for Linux, staged in course 1.9, in one consistent way across 1.9, 1.12 and 1.18. Course 1.4 stages the Windows Server, Active Directory and Windows client STIG content plus the DISA GPO package.
6. **Shared names.** Use the names the owning course creates, exactly: groups SBD Tier 1 Admins (1.7), SBD Audit Custodians (1.8), SBD Event Sources (1.10), SBD Auditors (1.11); accounts svc-dhcp-dns (1.7), gMSAs SBD-Archive$, SBD-Catalog$, SBD-Retention$ (1.11); the KDS root key exists from 1.11 (later courses reuse it, never create another). The exception record is C:\Evidence\exception-record.csv. Check the owning course's draft for any other shared name you use.
7. **Two machines, three seats.** Keep the main-branch admin seat design: AdminJumpBox01 dedicated; SBD-ADMIN-PC01 is a Windows client VM on SBD-ADMIN-SRV01; Tier 1 accounts on the host, Tier 2 only inside the VM.
8. **No release numbers.** "Windows Server", "Windows" or "Windows client"; never a release number, including file names (e.g. no "Win11").
9. **Sources.** Cite only official, primary documentation. Allowed origins: learn.microsoft.com, www.cyber.mil, public.cyber.mil, csrc.nist.gov, docs.splunk.com, help.splunk.com, docs.tenable.com, docs.trellix.com, docs.redhat.com, access.redhat.com, dnf-plugins-core.readthedocs.io, github.com/rpm-software-management, manpages.debian.org, httpd.apache.org, man.openbsd.org, chrony-project.org, firewalld.org, www.rfc-editor.org. Every source must support the statement it's cited for.
10. **Independent tiles.** Every course stands alone with its own material; it may build on earlier courses (say which in its prerequisites) but never re-teaches them, and never depends on a later one.

## Settled by the first audit wave (courses 1.1–1.9) — binding for 1.10–1.19

- **Enrollment path:** course 1.6 adds an SBD Domain Controller Authentication template (from Kerberos Authentication), an autoenrollment GPO linked at the domain root, and asks learners to confirm a register row for enrollment to SBD-SUBCA01 (proposed F23: domain members → SBD-SUBCA01, RPC TCP 135 + 49152–65535). Later courses reuse that GPO; they do not create another.
- **Root CA on Linux:** course 1.9 places the course 1.6 root CA in SBD-REPO01's system trust store by hand (hash checked against 1.6's record). Every later Linux server (1.12, 1.18) does the same in its build lesson; 1.10's syslog over TLS relies on it.
- **Linux scanning:** SCC for Linux and the distribution's STIG benchmark are staged once by course 1.9 at `C:\Staging\DISA\linux` on SBD-ADMIN-SRV01, with one scan procedure that 1.12 and 1.18 reuse. The SCC install path is written `<SCC install directory>/cscc` (never `/opt/scc/cscc`).
- **Time:** every course that builds a VM turns the hypervisor's time synchronization off and checks the system takes time from a domain controller; Linux servers apply the course 1.3 chrony file before their first domain join or package update. Course 1.10 collects event 4616 and the Microsoft-Windows-Time-Service events (12, 35, 36, 37, 129, 142); event 12 on SBD-DC01 is expected and must not raise an alert in 1.12.
- **Audit groups:** SBD Audit Custodians is created in 1.8 (1.11 reuses it); 1.11 creates SBD Auditors and must add it to SBD-ADMIN-SRV01's sign-in rights; only 1.8's deny GPOs are linked to the Audit Servers OU.
- **Findings classification values** (from 1.4): fix by GPO / deviation candidate / POA&M candidate; 1.5 adds Resolution and Evidence columns. Quote these exactly.
- **1.13 (fleet)** installs SCC on SBD-ADMIN-PC01 and takes that seat's first baseline before the fleet's; template permissions go to a computer group, never an OU; the Windows client STIG content was staged by 1.4 (not carried in the GPO package).
- **1.19** adds the DHCP backup (with the step to reset the DNS update credential after a restore) to the recovery set and checks a restored controller's clock.
