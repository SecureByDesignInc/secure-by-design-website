# Configure a Root CA & issuing CA — configuration checklist

Secure By Design · Edition 1.0 · 5 October 2026

This course chooses a standalone offline Root CA and an enterprise subordinate/issuing CA for the training build. The root stays disconnected; approved removable media carries requests and public artifacts. The internal publication service must be provisioned separately.

## Before you start

- [ ] Complete the identity and DNS courses; verify domain health and internal name resolution.
- [ ] Prepare separate Windows Server 2025 hosts: SBD-ROOTCA01 in a disconnected workgroup and SBD-SUBCA01 joined to sbd.test.
- [ ] Approve the CA names, cryptography, validity periods, publication URLs, administration, backups, and removable-media procedure before installation.

## Design the two-tier trust hierarchy

- [ ] Draw the hierarchy: offline standalone root → enterprise issuing CA → approved server/client certificates. There is no network connection to the root.
- [ ] Record final host and CA names, key provider, algorithm, key sizes, hashes, validity periods, renewal owners, and recovery arrangements. Avoid treating example lifetimes as universal requirements.
- [ ] Plan a stable internal publication name such as pki.sbd.test. The Authority Information Access (AIA) location supplies issuer certificates; the CRL Distribution Point (CDP) supplies certificate revocation lists.
- [ ] Choose the publication host, paths, access rules, and refresh schedule before issuing certificates. Clients inside this air-gapped network must reach those locations without relying on the public internet.

**Verify:** The written plan separates trust, issuance, publication, and administration. It identifies who renews CRLs before they expire.

**Evidence:** Keep the approved hierarchy and a worksheet mapping every certificate/CRL URL to its actual publisher and file.

Notes / result / date: __________________________

## Configure the offline Root CA

- [ ] Verify SBD-ROOTCA01 is in a workgroup with no active network path. Prepare approved installation media, protected administration, correct time, and backup storage.
- [ ] Place the reviewed CAPolicy.inf in %SystemRoot% before configuration. Tailor it to the root role; a self-signed root's own CDP/AIA choices differ from the extensions the root places into issued subordinate certificates.
- [ ] Install the Certification Authority role with management tools. In the AD CS Configuration wizard choose Standalone CA, Root CA, and a new private key, then apply the approved provider, cryptography, CA name, validity, database, and log settings.
- [ ] Before signing anything, configure the root's issued-certificate AIA/CDP settings, subordinate validity policy, and base-CRL schedule. Hold requests for explicit approval. Produce and inspect a current root CRL, then capture a protected CA backup.

**Verify:** The host remains disconnected, the CA is standalone/root, requests require approval, and the planned subordinate URLs are configured before signing.

**Evidence:** Record the root certificate identity, policy file, publication settings, CRL dates, backup location, and operator sign-off. Protect backups containing private keys.

Notes / result / date: __________________________

## Create the issuing CA request

- [ ] Confirm SBD-SUBCA01 has its final hostname, domain membership, static address, internal DNS, and correct time. Use a dedicated host and the privileges approved for enterprise CA configuration.
- [ ] Prepare its role-specific CAPolicy.inf and protected request directory. Decide which templates may later be published instead of enabling a broad default enrollment set.
- [ ] Install the CA role and management tools. In the AD CS Configuration wizard choose Enterprise CA, Subordinate CA, and the approved new-key/provider settings. Enter the planned CA identity and storage locations.
- [ ] Choose Save a certificate request to file. Inspect the resulting request's subject, public key, and CA constraints; record its SHA-256 hash before handing it to the media custodian.

**Verify:** The request matches the approved issuing identity and key profile. The CA is waiting for its signed certificate; do not troubleshoot that expected state by installing another CA.

**Evidence:** Retain the request, its reviewed fields and hash, and the request-transfer record. Do not place private keys in the transfer package.

Notes / result / date: __________________________

## Sign through the offline ceremony

- [ ] Use approved removable media and custody procedures to bring the request to the root. Recalculate its hash and compare it with the independently recorded value; inspect the request before submission.
- [ ] Verify the root's issued-certificate validity policy and publication extensions. In Certification Authority, submit the request, review its pending entry, and issue it only after the required approval.
- [ ] Export the subordinate certificate, root certificate, and current root CRL. Check identities, constraints, validity, signatures, URLs, and revocation data against the approved hierarchy. Record file hashes and the request ID.
- [ ] Transfer only the approved public artifacts back to the connected environment. Match published filenames to the URLs embedded in certificates, retain the ceremony record and protected backup, then shut down and secure the root.

**Verify:** Artifact identities, signatures, validity, and custody checks pass. The root remains offline; a field dump alone is not end-to-end trust validation.

**Evidence:** Keep approval, request ID, artifact hashes, verified certificate/CRL properties, media custody, and root shutdown evidence together.

Notes / result / date: __________________________

## Activate issuance and publish trust data

- [ ] Verify the returned artifacts and import the approved root certificate into the issuing server's trusted root store. Complete CA certificate installation through Certification Authority and start Certificate Services.
- [ ] Configure the issuing CA's AIA/CDP settings before issuing test certificates. Publish current root and issuing certificates and CRLs to the planned internal locations, preserving the actual filenames referenced by their extensions.
- [ ] Distribute the approved root trust through the managed domain policy and arrange the required intermediate/directory publication with delegated administrators. Public CA certificates and CRLs may be readable to clients; private keys and backups must never enter that web directory.
- [ ] Publish only the certificate templates required for the lab. Review purpose, subject construction, key settings, validity, and enrollment permissions; grant a small test group the minimum enrollment rights first.

**Verify:** Issuance is configured, the approved trust chain reaches the client, and the exact published URLs return the current files from the internal network.

**Evidence:** Keep publication mappings, permissions, template settings, trust-distribution policy, and retrieval results.

Notes / result / date: __________________________

## Validate enrollment, revocation, and recovery

- [ ] Enroll a disposable test certificate using the approved template. Export only its public certificate as test.cer and inspect the subject, purpose, issuer, and validity.
- [ ] On a clean validation client, verify the chain and retrieval using the command below. Inspect each AIA/CDP URL and current CRL dates; cached success is insufficient evidence of publication reachability.
- [ ] Revoke only the disposable test certificate, publish an updated issuing CRL, and verify that a fresh client evaluation detects revocation. Diagnose retrieval or stale-publication problems rather than turning off revocation checks.
- [ ] Record owners and reminders for root/issuing CRL publication, certificate renewal, backup, and an isolated recovery rehearsal. Schedule offline root ceremonies early enough to transfer and publish replacement CRLs before expiry.

**Verify:** A valid test certificate chains to the approved root and retrieves current revocation data. After revocation and publication, the test certificate is rejected for the expected reason.

**Evidence:** Finish the PKI checklist with enrollment, retrieval and revocation results, renewal dates, backup verification, and recovery ownership.

Notes / result / date: __________________________

## Sources

- [Microsoft · PKI design considerations](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/pki-design-considerations)
- [Microsoft · CAPolicy.inf syntax](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/prepare-the-capolicy-inf-file)
- [Microsoft · Install the offline root](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/2-install-offline-root)
- [Microsoft · Deploy the issuing CA role](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/3-deploy-issuing-certification-authority-role)
- [Microsoft · Perform the offline root signing ceremony](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/4-perform-offline-root-signing-ceremony)
- [Microsoft · Publish trust data and validate clients](https://learn.microsoft.com/en-us/training/modules/certificate-services-root-issuing-authority/6-publish-trust-data-validate-clients)
- [Microsoft · Certutil reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil)
