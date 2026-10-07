# Finish the PKI services — configuration checklist

Secure By Design · Edition 1.0 · 7 October 2026

This course finishes the PKI chapter: the pki.sbd.test publication site goes live on SBD-PKI-MGMT01, and certificate template administration moves to that host, off the issuing CA. Publication stays plain HTTP by design — clients must be able to fetch revocation data before they can validate any certificate.

## Before you start

- [ ] Complete courses 1.4 and 1.5: a working two-tier PKI and the routed, default-deny network with pki.sbd.test reachable over HTTP per the register.
- [ ] Build SBD-PKI-MGMT01 as a hardened Windows Server 2025 member server at 10.0.30.30 in the Servers OU.
- [ ] Have the issuing CA's AIA and CDP URL plan from course 1.4 at hand — the filenames published here must match those embedded URLs exactly.

## Build the pki.sbd.test publication site

- [ ] On SBD-PKI-MGMT01, install the Web Server role and create a site (or virtual directory) whose folder will hold the published certificates and revocation lists. Serve .cer, .crt, and .crl files; nothing else belongs in this directory.
- [ ] Confirm the pki.sbd.test alias from course 1.2 resolves to 10.0.30.30 from a client in another VLAN, and that the register's HTTP row from course 1.5 permits the path.
- [ ] Leave the site on plain HTTP. Revocation checking has to work before any certificate can be trusted — putting the CRL behind HTTPS creates a loop where validating the site needs the very file it serves.
- [ ] Restrict who can write to the publication folder: the CA's publishing process and the PKI administrators, nobody else. Clients read; they never write.

**Verify:** pki.sbd.test resolves to the publication host from outside VLAN 30, the site answers on port 80, and the publication folder's permissions separate writers from readers.

**Evidence:** Record the site configuration, folder permissions, the DNS resolution output from a cross-VLAN client, and the register row that permits the path.

Notes / result / date: __________________________

## Publish the trust data at its advertised URLs

- [ ] Compare the issuing CA's configured AIA and CDP URLs against the publication folder's layout. Every embedded URL must map to a real file path on the site — the filenames are not yours to improve.
- [ ] Copy the current root certificate, root CRL, issuing certificate, and issuing CRL into the folder. The root's files still arrive by approved media; the issuing CA's can be written directly by its publishing process.
- [ ] Configure the issuing CA's CRL publication to write into the site's folder on its schedule, so each new CRL replaces the old file at the same name before it expires.
- [ ] From a clean client in another VLAN, fetch each URL and run the full verification: the chain must build and revocation data must come from the live site, not a cache.

**Verify:** Every AIA and CDP URL embedded in issued certificates returns the current file, urlfetch verification passes from a cross-VLAN client, and the CRL refresh lands at the same filename automatically.

**Evidence:** Keep the URL-to-file mapping table, the folder listing with timestamps, and the urlfetch output from the clean client.

Notes / result / date: __________________________

## Separate template administration

- [ ] Install the certificate management tools on SBD-PKI-MGMT01 and confirm the Certificate Templates console can read the directory's template store from there.
- [ ] Create a PKI administrators group in the directory, place it under the Admin OU from course 1.3, and delegate the template permissions to that group — membership is the record of who may change what the CA signs.
- [ ] Remove day-to-day template editing from everywhere else: the issuing CA's console stays for CA operations, not template design, and no Tier-0 account edits templates as routine work.
- [ ] Write the change process: a template change names its requester, its reviewer, the versioning action (edit, duplicate, or supersede), and lands in the evidence record like any other configuration change.

**Verify:** The templates console works from SBD-PKI-MGMT01, the PKI administrators group holds the delegated permissions, and the written change process names requester, reviewer, and versioning action.

**Evidence:** Keep the delegation record, the group membership listing, and the signed-off template change process.

Notes / result / date: __________________________

## Publish the first working templates

- [ ] From the administration seat, duplicate the Computer template as SBD Computer Authentication. Set the approved key provider, a key size of at least 2,048 bits, subject built from directory information, and autoenrollment permission for a pilot computer group only.
- [ ] Duplicate the Web Server template as SBD Server Authentication for the services wave ahead: enrollment permission for the server administrators, no autoenrollment, and exportable keys only if the recovery plan explicitly says so.
- [ ] Record each template's version, settings, and justification through the lesson-3 change process before publishing.
- [ ] Publish exactly these two templates on the issuing CA and remove any default template the plan does not call for — an unpublished template cannot be mis-enrolled.

**Verify:** The CA publishes exactly the two planned templates, each shows the approved key size and permissions, and both carry a completed change record.

**Evidence:** Keep each template's configuration export, its change record, and the CA's published-template listing.

Notes / result / date: __________________________

## Validate enrollment and delta scan

- [ ] Enable the autoenrollment policy for the pilot computer group, refresh policy on a pilot machine, and confirm it receives an SBD Computer Authentication certificate without a human touching the request.
- [ ] On that machine, run the full verification: the chain must reach the approved root and every revocation URL must answer from pki.sbd.test across the boundary.
- [ ] Rescan SBD-SUBCA01 and take SBD-PKI-MGMT01's first baseline with the same benchmark and tool versions as always; the publication site and template changes are the expected deltas.
- [ ] File the course evidence: enrollment output, urlfetch results, template records, and the scan set — wave 2 is complete and the PKI chapter is finished.

**Verify:** The pilot enrolls hands-free, verification passes with live retrieval from pki.sbd.test, and both VLAN 30 hosts have current, attributed scan results.

**Evidence:** Keep the pilot's certificate details, the urlfetch output, and the delta-scan comparison for SUBCA01 plus the PKI-MGMT01 baseline.

Notes / result / date: __________________________
