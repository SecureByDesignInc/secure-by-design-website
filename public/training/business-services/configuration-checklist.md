# Stand up the business services — configuration checklist

Secure By Design · Edition 1.0 · 7 October 2026

The users finally get what the network exists for: files, a database, licensing, and an internal web service. The model's rule governs the whole wave — permit only documented business service paths — so every service arrives with its register rows, its service identity, and its certificate, and nothing reaches it any other way.

## Before you start

- [ ] Complete courses 1.5–1.10: the routed, watched, managed network with working PKI services and the ring/source rules in force.
- [ ] Provision the VLAN 40 hosts: SBD-FS01 (10.0.40.10), SBD-SQL01 (10.0.40.20), SBD-APPS01 (10.0.40.30), and SBD-WEB01 (10.0.40.40, Linux with Apache).
- [ ] Have the course 1.5 register and the course 1.6 SBD Server Authentication template ready — every service here gets a documented path and a real certificate.

## Design the service paths and identities

- [ ] Write the service-path rows: fleet to FS01 (SMB 445), fleet to APPS01 (its licensing port) and WEB01 (HTTPS 443), WEB01 and APPS01 — and only they — to SQL01 (1433). Everything else toward VLAN 40 stays denied, including endpoint-to-SQL directly.
- [ ] Choose the service identities: group managed service accounts for the SQL and application services, so passwords rotate themselves — and note Windows Server 2025's delegated managed service accounts as the migration path for any legacy service account this lab later inherits.
- [ ] Create the access groups under the course 1.3 Groups OU — per-share and per-application role groups — because permissions will be granted to roles, never to named humans.
- [ ] Request the server certificates through the course 1.6 process: one SBD Server Authentication certificate each for SQL01 and WEB01, enrolled from the template, with the publication site serving their revocation story.

**Verify:** The register carries the four services' rows with the SQL path restricted to its two callers, the gMSAs and role groups exist, and both server certificates are issued and recorded.

**Evidence:** Keep the service-path rows, the identity and group design, and the certificate enrollment records.

Notes / result / date: __________________________

## Build SBD-FS01 with least-privilege shares

- [ ] Build SBD-FS01 in the Servers OU and create the planned shares, granting NTFS permissions to the lesson-1 role groups only — share permissions stay simple, the filesystem carries the detail, and no named human appears in an ACL.
- [ ] Enable access-based enumeration so users see only what their roles permit — the quiet UX of least privilege.
- [ ] Confirm the SMB posture: Windows Server 2025 and the Windows 11 fleet already require signing by default, and this share design opts into SMB encryption for the sensitive share — verify both on a live session rather than assuming the default.
- [ ] Test as members of two different roles from fleet machines: each sees and opens exactly its shares, the other's are invisible and denied, and the denial lands in the pipeline like every other refusal on this network.

**Verify:** Shares grant to role groups only, a live session shows signing (and encryption where designed), and the two-role test proves both the access and the invisible-denied behavior.

**Evidence:** Keep the share and NTFS permission reports, the live session's signing/encryption output, and the two-role test record with its pipeline entry.

Notes / result / date: __________________________

## Build SBD-SQL01 behind its applications

- [ ] Install the database engine on SBD-SQL01 with the lesson-1 gMSA as its service identity — the install itself demonstrates the managed account working where a password account used to live.
- [ ] Bind the issued certificate to the instance and require encrypted connections; the chain validates against pki.sbd.test like every other certificate on this network.
- [ ] Create the application databases with role-based database access for the WEB01 and APPS01 identities — least privilege continues inside the engine, not just at its port.
- [ ] Prove the audience: a connection from WEB01 succeeds encrypted; the same attempt from a fleet machine dies at the boundary with a deny-log entry — the register row, demonstrated from both sides.

**Verify:** The service runs as the gMSA, connections are certificate-encrypted with a validating chain, application access works by database role, and the fleet's direct attempt fails with its logged deny.

**Evidence:** Keep the service identity proof, the certificate binding and urlfetch output, the database role grants, and the paired success/deny connection evidence.

Notes / result / date: __________________________

## Build SBD-APPS01 and SBD-WEB01

- [ ] Build SBD-APPS01 in the Servers OU, run its licensing service under a managed identity, and verify the fleet path on the registered port — the smallest of the four services, and the template for any future one: identity, row, evidence.
- [ ] Build SBD-WEB01 on the Linux platform, packages from SBD-REPO01 only, and harden the web tier against DISA's Apache guidance — the server's assessable record follows the Linux pattern: hardened configuration exported and hashed, checklist items answered in STIG Viewer.
- [ ] Install the SBD Server Authentication certificate with its chain and serve the internal application over HTTPS — the 2,048-bit floor from the accuracy review applies here as everywhere.
- [ ] Prove the chain from a fleet machine: the HTTPS page loads with a validating certificate, the page's data round-trips through SQL01, and the fleet still cannot touch 1433 directly — three courses of design visible in one browser request.

**Verify:** The licensing path works as registered, the Apache host serves HTTPS with a validating internal chain from a hardened, hashed configuration, and the end-to-end request proves fleet → web → database with the shortcut still denied.

**Evidence:** Keep APPS01's identity and path proof, WEB01's hardened config export with hashes and checklist, the certificate validation output, and the end-to-end chain test.

Notes / result / date: __________________________

## Reconcile, scan, and close the wave

- [ ] Run the full-register reconciliation one more time: every business-service row proven from its real source, every adjacent deny probed and logged — the VLAN 40 section of the matrix joins the evidence beside courses 1.5 and 1.7's.
- [ ] Run the cadence: SCAP baselines for FS01, SQL01, and APPS01; the config-export record for WEB01; a credentialed scan of VLAN 40 from SBD-NESSUS01 with its findings triaged into the three classifications.
- [ ] Update the living records: the four hosts, their identities, certificates, and rings into the SBD-MGMT01 inventory; the new rows' owners into the register; any service-hardening deviations into the exception record.
- [ ] Write the handoff: every modeled system except the recovery design is now built, watched, patched, and evidenced — course 1.12 proves the network can come back from the dead, and then path 2 takes the whole record to authorization.

**Verify:** The matrix covers every VLAN 40 row with paired permit/deny proof, the four hosts carry baselines or config records with triaged scan findings, and inventory, register, and exception record all reflect the finished wave.

**Evidence:** Finish the checklist: the reconciliation matrix, the scan and triage set, the updated living records, and the handoff note to course 1.12.

Notes / result / date: __________________________
