# What Is Active Directory Certificate Services (AD CS)?

Dylan can sign in, open the Pokemon folder, and get through his workday. Then Jon adds an internal project portal. Dylan opens it, and his browser throws a certificate warning. So much for a quiet morning.

His domain account still works. The portal might even be running perfectly well. But the browser has a different question: can it trust the server on the other end of this connection? Let’s follow that question through **Active Directory Certificate Services**, or **AD CS**, and see where certificates, keys, and administration fit together.

## Where AD CS fits

In the [Active Directory Foundations post](/blog/what-is-active-directory), we worked through identities, systems, and permissions. AD CS adds certificate services to that picture. It’s an optional Windows Server role used to issue and manage digital certificates as part of a **public key infrastructure**, or **PKI**. Certificates can support things like secure websites, device authentication, and smart-card sign-in. [Netwrix’s AD CS overview](https://netwrix.com/en/cybersecurity-glossary/security-concepts/active-directory-certificate-services-ad-cs/) introduces those uses.

The similar names can trip you up. **AD DS** handles the directory and domain identity services. **AD CS** handles certificate services. A domain can operate without AD CS, and installing a domain controller doesn’t automatically make it a certificate authority.

For Secure By Design, let’s have Jon configure an internal portal at `portal.sbd.test`. We’ll stick with that one service instead of trying to build every possible certificate use case at once.

## The certificate is public. The private key needs protection.

A **digital certificate** connects an identity to a public key, with a digital signature from its issuer. For our portal, useful details include the server names the certificate covers, its validity dates, and its permitted purposes. The **Subject Alternative Name**, or **SAN**, is where we’ll find the portal’s DNS name. **Extended Key Usage**, or **EKU**, can identify a purpose such as server authentication.

The certificate contains the **public key**. The corresponding **private key** is separate and needs protection. Microsoft explains that relationship in its [certificate and public-key documentation](https://learn.microsoft.com/en-us/windows/win32/seccrypto/certificates-and-public-keys).

In our setup, the portal server generates the key pair and keeps the private key. Sharing its public certificate with Dylan’s browser is expected. Handing out its private key is a very different situation.

This is also why finding a certificate file on a server doesn’t prove the application is ready. Jon still needs the matching private key, the right permissions to use it, and the correct application configuration.

## Give the certificate authority a specific job

A **certificate authority**, or **CA**, evaluates certificate requests under its configured rules and signs the certificates it issues. Think of the CA’s signature as something a client can verify, rather than just taking the server’s word for who it is.

Two sets of terms describe different choices:

- **Enterprise and standalone:** an enterprise CA integrates with AD DS and uses certificate templates. A standalone CA doesn’t require AD DS or use those templates.
- **Root and subordinate:** a root CA sits at the top of a certificate hierarchy. A subordinate CA has a CA certificate issued by another CA. An issuing subordinate can handle the certificates used by our services.

Either CA type can be a root or subordinate. Microsoft’s [CA role-service guide](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/certification-authority-role) explains the distinction.

An offline root with a separate issuing CA is one possible design. It isn’t a reason to start adding servers before Jon has worked out the requirements. The hierarchy should have a purpose the team can explain and maintain.

## Templates decide what gets issued

On an enterprise CA, a **certificate template** describes the requirements for a kind of certificate. That includes settings such as its purposes, validity period, and how identity information is supplied. Permissions help determine who can enroll using it.

Jon creates a template for the internal web service. The useful question is whether that template issues what the portal needs, to the identities that should be allowed to request it. “Let everyone enroll for anything” would certainly save a few clicks. It would also leave Jon with a much bigger problem to explain later.

Publishing a template on a CA makes it available there for issuance. It doesn’t automatically hand a certificate to everyone in the domain. Client configuration, permissions, and the request still matter. Microsoft’s [template concepts](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/certificate-template-concepts) are a useful reference for how those pieces relate.

Keep the use case narrow enough to understand. A portal certificate and a certificate intended for user authentication have different jobs, even though both are certificates.

## Follow the certificate to Dylan’s browser

Jon requests the portal certificate, receives it from the issuing CA, and configures the web service to use it with its private key. Now Dylan tries the portal again.

In a certificate-based **Transport Layer Security**, or **TLS**, connection, the server presents its certificate and proves possession of the corresponding private key as part of the handshake. The endpoints establish the keys used to protect the connection. The CA isn’t sitting between Dylan and the portal encrypting each page for them. That separation is part of the [TLS protocol](https://www.rfc-editor.org/rfc/rfc8446.html).

The browser also needs to validate what it receives. Among the important checks are:

- Does the certificate cover `portal.sbd.test`?
- Is it within its validity period and suitable for the intended use?
- Does its chain lead to a root the client trusts?
- What does the application’s revocation policy require, and can it obtain the information it needs?

Microsoft’s [certificate-validation guidance](https://learn.microsoft.com/en-us/windows/win32/secauthn/manually-validating-schannel-credentials) describes these checks. A certificate being issued successfully doesn’t settle all of them.

If the connection succeeds but the portal says Dylan can’t open a project, we’re back to an authorization question. A trusted server certificate doesn’t grant Dylan permission to every page it hosts.

Inside the Network shows both outcomes: [Use a web app, step 2](/inside-the-network#process=web&step=2) verifies a valid certificate, and [What if a certificate expired?](/inside-the-network#process=cert-expired) shows the browser refusing one the network still allows.

## Internal trust still has to reach the client

An internal CA isn’t automatically trusted by every browser and device. The client needs an appropriate trust configuration and a valid chain from the portal certificate through any intermediate CAs to a trusted root. A self-signed root certificate doesn’t establish that trust just by existing. Microsoft’s [certificate-chain explanation](https://learn.microsoft.com/en-us/windows/win32/seccrypto/certificate-chains) walks through that relationship.

Suppose the portal works on Dylan’s managed workstation but warns on Ben’s test device. That gives Jon something specific to compare: the certificate being presented, the available chain, and the trust configuration used by each client. Applications can use different trust stores, so “it’s installed somewhere on the device” may not finish the investigation.

Ben records the actual warning before changing anything. A name mismatch, an expired certificate, and an untrusted issuer are different problems. Clicking through the warning doesn’t tell us which one we’ve got.

## Enrollment can save work, but it needs rules

**Enrollment** is the process of requesting and obtaining a certificate. With a suitable enterprise CA setup, **autoenrollment** can reduce the manual work of issuing and renewing certificates for eligible domain identities. Jon still needs appropriate template permissions, publication on the issuing CA, and an applicable client policy. Microsoft documents the [template configuration](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/configure-server-certificate-template-remote-access-network-policy-server) and [autoenrollment policy](https://learn.microsoft.com/en-us/windows-server/networking/core-network-guide/cncg/server-certs/configure-server-certificate-auto-enrollment) separately.

AD CS also has optional services for other enrollment needs. **Network Device Enrollment Service**, or **NDES**, supports enrollment for devices without domain accounts. Certificate Enrollment Policy and Certificate Enrollment Web Services support policy-based enrollment over HTTPS. They aren’t all required for Jon’s portal; Microsoft’s [role-service overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/active-directory-certificate-services-overview) lays out their jobs.

Even with enrollment automated, Jon checks which certificate the portal actually serves. Getting a new certificate into a store and getting an application to use it are separate things to verify.

## Expiration and revocation solve different problems

**Expiration** is the scheduled end of a certificate’s validity. **Revocation** marks a certificate as no longer acceptable before that date, such as after a private-key compromise.

For routine renewal, Jon needs enough time to obtain the replacement, configure the service, and confirm that clients receive the new certificate. An expiry alert with an owner is more useful than a reminder everybody assumes somebody else is handling.

For revocation, a CA can publish a **certificate revocation list**, or **CRL**. An **Online Certificate Status Protocol**, or **OCSP**, responder can provide status information for a certificate. Clients and applications need to use that information according to their validation rules.

Revocation isn’t an instant disconnect button for every existing session. Cached status information, retrieval failures, and application behavior affect the result. Microsoft’s [revocation-checking documentation](https://learn.microsoft.com/en-us/windows/win32/seccrypto/certificate-revocation-list-semantics) explains Windows caching and retrieval behavior.

If the portal’s private key is exposed, Jon needs to address the compromised system, replace the key and certificate, and handle revocation. Simply renewing with the exposed key would leave the central problem sitting right there.

## Certificate settings can become an access problem

Templates and enrollment permissions deserve the same attention as other settings that can affect identity. Broad enrollment rights, requester-controlled identity information, authentication purposes, and weak issuance controls can combine into an impersonation risk. Microsoft’s [AD CS enrollment assessment](https://learn.microsoft.com/en-us/defender-for-identity/security-assessment-insecure-adcs-certificate-enrollment) describes that kind of configuration problem.

That doesn’t mean any certificate with someone’s name on it automatically lets you sign in as them. The certificate’s use, trust, and account mapping matter. Microsoft’s [strong certificate-mapping requirements](https://support.microsoft.com/en-us/servicing/os/windows-server/2022/05/kb5014754-certificate-based-authentication-changes-on-windows-domain-controllers) are part of the picture for domain certificate authentication.

For Jon, the practical review is straightforward: who can request this certificate, who can change its template, what identity can it represent, and what will accept it? Those questions are worth answering before a template becomes everyone’s favorite shortcut.

## Plan for the part after setup

A working portal is a good start. Jon also needs to know who owns the CA, how its private keys are protected, which certificate and revocation publication locations clients depend on, and how the service would be recovered. Microsoft’s [PKI design considerations](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/pki-design-considerations) cover those planning decisions.

For Secure By Design, that means giving the team a few things it can actually use: an inventory of issued service certificates and their owners, renewal reminders, records of important template changes, and a recovery plan somebody has practiced.

Follow the certificate from request to issuance to use, and know what happens when it needs to be replaced. That’s a much better starting point than waiting for Dylan’s next browser warning.
