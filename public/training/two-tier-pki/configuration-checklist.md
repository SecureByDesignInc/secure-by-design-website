# Configure the two-tier PKI — configuration checklist

Secure By Design · Edition 2.1 · 9 October 2026

This course builds the whole PKI: a standalone offline Root CA, an enterprise subordinate/issuing CA, the pki.sbd.test publication site on SBD-PKI-MGMT01, and template administration on its own seat. The root stays disconnected; approved removable media carries requests and public artifacts. Publication stays plain HTTP by design — clients must be able to fetch revocation data before they can validate any certificate.

## Before you start

- [ ] Complete courses 1.1–1.3 (identity, DNS and time, and the hardened baseline); verify domain health and internal name resolution.
- [ ] Prepare separate Windows Server hosts: SBD-ROOTCA01 in a disconnected workgroup, SBD-SUBCA01 joined to sbd.test, and SBD-PKI-MGMT01 as a hardened member server at 10.0.30.30 in the Servers OU (course 1.5 moves it, with the issuing CA, to a Tier 0 Servers OU).
- [ ] Approve the CA names, cryptography, validity periods, publication URLs, administration, backups, and removable-media procedure before installation; confirm the network's service-path register permits HTTP to pki.sbd.test.

## Design the two-tier trust hierarchy

- [ ] Draw the hierarchy: offline standalone root → enterprise issuing CA → approved server/client certificates. There is no network connection to the root.
- [ ] Record final host and CA names, key provider, algorithm, key sizes, hashes, validity periods, renewal owners, and recovery arrangements. Start from this lab's example values in the next step and change any that your own policy requires: they are examples, not universal requirements.
- [ ] Example values for this lab: the root CA uses an RSA 4096 key with SHA-256 and a 20-year certificate, and publishes a base CRL every 26 weeks with an overlap period and no delta CRL, refreshed at each offline ceremony. The issuing CA uses RSA 4096 (3072 at minimum) with SHA-256 and a 10-year certificate, a weekly base CRL, and a daily delta CRL. End-entity certificates last one to two years. NIST SP 800-57 Part 1 rates RSA 2048 at 112 bits of security, which it accepts for new signatures only through 2030, so a CA that will still be signing after 2030 uses at least 3072 bits (128 bits of security); current Windows Server releases require at least 2,048-bit RSA for TLS server authentication.
- [ ] Know where each value is set. You choose the key, the hash, and the root's 20-year validity in the AD CS Configuration wizard. Each CA's CAPolicy.inf sets its CRL periods (CRLPeriod, CRLPeriodUnits, CRLDeltaPeriod, CRLDeltaPeriodUnits), which certutil -setreg can change later. The issuing CA's 10-year lifetime is set on the root (CA\ValidityPeriod and CA\ValidityPeriodUnits) before the signing ceremony, because a subordinate CA's lifetime comes from the CA that signs it.
- [ ] Plan a stable internal publication name such as pki.sbd.test. The Authority Information Access (AIA) location supplies issuer certificates; the CRL Distribution Point (CDP) supplies certificate revocation lists.
- [ ] Choose the publication host, paths, access rules, and refresh schedule before issuing certificates. Clients inside this air-gapped network must reach those locations without relying on the public internet.

**Commands:**

```
# Run on the future issuing CA, not the offline root.
Get-CimInstance Win32_ComputerSystem | Select-Object Name, Domain, PartOfDomain
Resolve-DnsName SBD-DC01.sbd.test
Resolve-DnsName SBD-DC02.sbd.test
```

**Verify:** The written plan separates trust, issuance, publication, and administration. It identifies who renews CRLs before they expire, and every key size, hash, lifetime, and CRL period has a recorded value and the setting that applies it.

**Evidence:** Keep the approved hierarchy, the cryptography and lifetime table with the setting that applies each value, and a worksheet mapping every certificate/CRL URL to its actual publisher and file.

Notes / result / date: __________________________

## Configure the offline Root CA

- [ ] Verify SBD-ROOTCA01 is in a workgroup with no active network path. Prepare approved installation media, protected administration, correct time, and backup storage.
- [ ] Place the reviewed CAPolicy.inf in %SystemRoot% before configuration. Tailor it to the root role: in this lab it sets CRLPeriod=Weeks and CRLPeriodUnits=26, and CRLDeltaPeriodUnits=0 so the root publishes no delta CRL. A self-signed root's own CDP/AIA choices differ from the extensions the root places into issued subordinate certificates.
- [ ] Install the Certification Authority role with management tools. In the AD CS Configuration wizard choose Standalone CA, Root CA, and a new private key, then apply the approved provider, cryptography (RSA 4096 with SHA-256 in this lab), CA name, validity (20 years), database, and log settings.
- [ ] Before signing anything, configure the root's issued-certificate AIA/CDP settings, the subordinate validity policy (CA\ValidityPeriod Years and CA\ValidityPeriodUnits 10 in this lab), and the base-CRL schedule (26 weeks with an overlap period, and no delta CRL). Hold requests for explicit approval. Produce and inspect a current root CRL, then capture a protected CA backup.

**Commands:**

```
# Inspect locally on SBD-ROOTCA01 during the approved root session.
Get-CimInstance Win32_ComputerSystem | Select-Object Name, Domain, PartOfDomain
Get-Service CertSvc
certutil -getreg CA\CRLPublicationURLs
certutil -getreg CA\CACertPublicationURLs
certutil -getreg CA\ValidityPeriodUnits
certutil -getreg CA\CRLPeriodUnits
```

**Verify:** The host remains disconnected, the CA is standalone/root, requests require approval, and the planned subordinate URLs and 10-year subordinate validity are configured before signing.

**Evidence:** Record the root certificate identity, policy file, publication settings, CRL dates, backup location, and operator sign-off. Protect backups containing private keys.

Notes / result / date: __________________________

## Create the issuing CA request

- [ ] Confirm SBD-SUBCA01 has its final hostname, domain membership, static address, internal DNS, and correct time. Use a dedicated host and the privileges approved for enterprise CA configuration.
- [ ] Prepare its role-specific CAPolicy.inf (in this lab: CRLPeriod=Weeks, CRLPeriodUnits=1, CRLDeltaPeriod=Days, CRLDeltaPeriodUnits=1, and LoadDefaultTemplates=0) and protected request directory. Decide which templates may later be published instead of enabling a broad default enrollment set.
- [ ] Install the CA role and management tools. In the AD CS Configuration wizard choose Enterprise CA, Subordinate CA, and the approved new-key/provider settings (RSA 4096 with SHA-256 in this lab). Enter the planned CA identity and storage locations.
- [ ] Choose Save a certificate request to file. Inspect the resulting request's subject, public key, and CA constraints; record its SHA-256 hash before handing it to the media custodian.

**Commands:**

```
# Use the actual request path chosen in the wizard.
certutil -dump C:\CAConfig\IssuingCA.req
Get-FileHash -Algorithm SHA256 C:\CAConfig\IssuingCA.req
```

**Verify:** The request matches the approved issuing identity and key profile. The CA is waiting for its signed certificate; do not troubleshoot that expected state by installing another CA.

**Evidence:** Retain the request, its reviewed fields and hash, and the request-transfer record. Do not place private keys in the transfer package.

Notes / result / date: __________________________

## Sign through the offline ceremony

- [ ] Use approved removable media and custody procedures to bring the request to the root. Recalculate its hash and compare it with the independently recorded value; inspect the request before submission.
- [ ] Verify the root's issued-certificate validity policy and publication extensions. In Certification Authority, submit the request, review its pending entry, and issue it only after the required approval.
- [ ] Export the subordinate certificate, root certificate, and current root CRL. Check identities, constraints, validity, signatures, URLs, and revocation data against the approved hierarchy. Record file hashes and the request ID.
- [ ] Transfer only the approved public artifacts back to the connected environment. Match published filenames to the URLs embedded in certificates, retain the ceremony record and protected backup, then shut down and secure the root.

**Commands:**

```
# Inspect public artifacts; use your actual approved paths.
certutil -dump C:\CAConfig\IssuingCA.cer
certutil -dump C:\CAConfig\RootCA.crl
Get-FileHash -Algorithm SHA256 C:\CAConfig\IssuingCA.cer, C:\CAConfig\RootCA.cer, C:\CAConfig\RootCA.crl
```

**Verify:** Artifact identities, signatures, validity, and custody checks pass. The root remains offline; a field dump alone is not end-to-end trust validation.

**Evidence:** Keep approval, request ID, artifact hashes, verified certificate/CRL properties, media custody, and root shutdown evidence together.

Notes / result / date: __________________________

## Activate the issuing CA and distribute trust

- [ ] Verify the returned artifacts and import the approved root certificate into the issuing server's trusted root store. Complete CA certificate installation through Certification Authority and start Certificate Services.
- [ ] Configure the issuing CA's AIA and CDP settings before issuing any certificate, pointing them at the planned pki.sbd.test locations. Every certificate the CA signs carries these URLs, so they are fixed now and served exactly as written in lessons 6 and 7.
- [ ] Distribute the approved root trust through the managed domain policy and arrange the required intermediate/directory publication with delegated administrators.
- [ ] Hold off on certificate templates: lessons 8 and 9 give template administration its own seat and publish only the templates the plan needs.

**Commands:**

```
# Inspect the issuing CA after installation and publication.
Get-Service CertSvc
certutil -getreg CA\CRLPublicationURLs
certutil -getreg CA\CACertPublicationURLs
certutil -store Root
certutil -store CA
```

**Verify:** Certificate Services is running, the AIA and CDP settings carry the planned pki.sbd.test URLs, and the approved root reaches domain clients through policy.

**Evidence:** Keep the CA installation record, the AIA and CDP settings, and the trust-distribution policy.

Notes / result / date: __________________________

## Build the pki.sbd.test publication site

- [ ] On SBD-PKI-MGMT01, install the Web Server role and create a site (or virtual directory) whose folder will hold the published certificates and revocation lists. Serve .cer, .crt, and .crl files; nothing else belongs in this directory.
- [ ] Confirm the pki.sbd.test alias from course 1.2 resolves to 10.0.30.30 from a client in another VLAN, and that the service-path register's HTTP row permits the path.
- [ ] Leave the site on plain HTTP. Revocation checking has to work before any certificate can be trusted — putting the CRL behind HTTPS creates a loop where validating the site needs the very file it serves.
- [ ] Restrict who can write to the publication folder: the CA's publishing process and the PKI administrators, nobody else. Clients read; they never write.

**Commands:**

```
Resolve-DnsName pki.sbd.test
Test-NetConnection pki.sbd.test -Port 80
Get-Website | Select-Object Name, State, PhysicalPath
```

**Verify:** pki.sbd.test resolves to the publication host from outside VLAN 30, the site answers on port 80, and the publication folder's permissions separate writers from readers.

**Evidence:** Record the site configuration, folder permissions, the DNS resolution output from a cross-VLAN client, and the register row that permits the path.

Notes / result / date: __________________________

## Publish the trust data at its advertised URLs

- [ ] Compare the issuing CA's configured AIA and CDP URLs against the publication folder's layout. Every embedded URL must map to a real file path on the site — the filenames are not yours to improve.
- [ ] Copy the current root certificate, root CRL, issuing certificate, and issuing CRL into the folder. The root's files still arrive by approved media; the issuing CA's can be written directly by its publishing process.
- [ ] Configure the issuing CA's CRL publication to write into the site's folder on its schedule, so each new CRL replaces the old file at the same name before it expires.
- [ ] From a clean client in another VLAN, fetch each URL and run the full verification: the chain must build and revocation data must come from the live site, not a cache.

**Commands:**

```
certutil -verify -urlfetch C:\Evidence\pki\test.cer
certutil -URL http://pki.sbd.test/RootCA.crl
Get-ChildItem C:\inetpub\pkiroot | Select-Object Name, LastWriteTime
```

**Verify:** Every AIA and CDP URL embedded in issued certificates returns the current file, urlfetch verification passes from a cross-VLAN client, and the CRL refresh lands at the same filename automatically.

**Evidence:** Keep the URL-to-file mapping table, the folder listing with timestamps, and the urlfetch output from the clean client.

Notes / result / date: __________________________

## Separate template administration

- [ ] Install the certificate management tools on SBD-PKI-MGMT01 and confirm the Certificate Templates console can read the directory's template store from there.
- [ ] Create a PKI administrators group in the directory, place it under the Admin OU from course 1.3, and delegate the template permissions to that group — membership is the record of who may change what the CA signs.
- [ ] Remove day-to-day template editing from everywhere else: the issuing CA's console stays for CA operations, not template design, and no Tier-0 account edits templates as routine work.
- [ ] Write the change process: a template change names its requester, its reviewer, the versioning action (edit, duplicate, or supersede), and lands in the evidence record like any other configuration change.

**Commands:**

```
Get-ADGroup 'SBD PKI Admins' -Properties Members | Select-Object Name, Members
certutil -template | Select-String 'TemplatePropCommonName' | Select-Object -First 10
```

**Verify:** The templates console works from SBD-PKI-MGMT01, the PKI administrators group holds the delegated permissions, and the written change process names requester, reviewer, and versioning action.

**Evidence:** Keep the delegation record, the group membership listing, and the signed-off template change process.

Notes / result / date: __________________________

## Publish the first working templates

- [ ] From the administration seat, duplicate the Computer template as SBD Computer Authentication. Set the approved key provider, a key size of at least 2,048 bits, a validity period within lesson 1's one-to-two-year example, subject built from directory information, and autoenrollment permission for a pilot computer group only.
- [ ] Duplicate the Web Server template as SBD Server Authentication for the business services in course 1.9: enrollment permission for the server administrators, no autoenrollment, and exportable keys only if the recovery plan explicitly says so.
- [ ] Record each template's version, settings, and justification through the lesson-3 change process before publishing.
- [ ] Publish exactly these two templates on the issuing CA and remove any default template the plan does not call for — an unpublished template cannot be mis-enrolled.

**Commands:**

```
certutil -CATemplates -config 'SBD-SUBCA01\SBD Issuing CA'
certutil -template 'SBDComputerAuthentication' | Select-String 'msPKI-Certificate-Name-Flag','msPKI-Minimal-Key-Size'
```

**Verify:** The CA publishes exactly the two planned templates, each shows the approved key size and permissions, and both carry a completed change record.

**Evidence:** Keep each template's configuration export, its change record, and the CA's published-template listing.

Notes / result / date: __________________________

## Validate enrollment, revocation, and recovery

- [ ] Enable the autoenrollment policy for the pilot computer group, refresh policy on a pilot machine, and confirm it receives an SBD Computer Authentication certificate without a human touching the request.
- [ ] On that machine, export the public certificate and run the full verification: the chain must reach the approved root and every AIA and CDP URL must answer from pki.sbd.test with current CRL dates — cached success is not evidence of publication.
- [ ] Enroll a disposable test certificate, revoke only that one, publish an updated issuing CRL, and verify that a fresh client evaluation detects the revocation. Diagnose retrieval or stale-publication problems rather than turning off revocation checks.
- [ ] Record owners and reminders for root and issuing CRL publication, certificate renewal, backup, and an isolated recovery rehearsal. Schedule offline root ceremonies early enough to transfer and publish replacement CRLs before expiry.
- [ ] Rescan SBD-SUBCA01 and take SBD-PKI-MGMT01's first baseline with the same benchmark and tool versions as always; the publication site and template changes are the expected deltas.
- [ ] File the course evidence: enrollment output, urlfetch and revocation results, template records, renewal owners, and the scan set — the PKI chapter is finished.

**Commands:**

```
gpupdate /force
certutil -pulse
Get-ChildItem Cert:\LocalMachine\My | Select-Object Subject, NotAfter, Thumbprint
certutil -verify -urlfetch C:\Evidence\pki\pilot.cer
# After revoking the disposable test certificate and publishing the new CRL:
certutil -urlfetch -verify test.cer
```

**Verify:** The pilot enrolls hands-free and verifies with live retrieval from pki.sbd.test; after revocation and publication the test certificate is rejected for the expected reason; both VLAN 30 hosts have current, attributed scan results.

**Evidence:** Finish the PKI checklist with the pilot's certificate details, urlfetch and revocation results, renewal dates and recovery owners, and the delta-scan comparison for SUBCA01 plus the PKI-MGMT01 baseline.

Notes / result / date: __________________________

## Sources

- [Microsoft · PKI design considerations](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/pki-design-considerations)
- [Microsoft · CAPolicy.inf syntax](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/prepare-the-capolicy-inf-file)
- [Microsoft · Install the offline root](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/2-install-offline-root)
- [Microsoft · Deploy the issuing CA role](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/3-deploy-issuing-certification-authority-role)
- [Microsoft · Perform the offline root signing ceremony](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/4-perform-offline-root-signing-ceremony)
- [Microsoft · Publish trust data and validate clients](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/6-publish-trust-data-validate-clients)
- [Microsoft · Certutil reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil)
- [NIST · SP 800-57 Part 1 Rev. 5, Recommendation for key management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)
- [Microsoft · Manage certificate templates](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/manage-certificate-templates)
- [Microsoft · Configure certificate autoenrollment](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/configure-server-certificate-autoenrollment)
- [Microsoft · What's new in Windows Server 2025](https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025)

© 2026 Secure By Design Team LLC
