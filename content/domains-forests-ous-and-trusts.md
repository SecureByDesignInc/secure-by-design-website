# Understanding Domains, Forests, OUs, and Trusts

Secure By Design is growing. Dylan’s team needs more workstations, the support team needs to reset employee passwords, and Jon is planning for a possible branch office.

It would be easy to pull up the organization chart and start making a domain for every department. Before we do that, let’s figure out what the company actually needs to manage. Otherwise, we’re just making more work for Jon.

## Begin with one forest and one domain

Our example starts with one forest and one domain: `securebydesigninc.com`. The forest shares a schema and configuration. The domain gives us a scope for directory data, authentication, and administration. Domains with a contiguous DNS namespace form a tree; a single domain already counts. [Microsoft’s logical model](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/understanding-the-active-directory-logical-model) covers how these pieces relate.

That’s our starting point, not a template you should blindly copy into every environment. Jon needs to ask what changes when the new team arrives. Do they need different permissions? Different settings? Someone else handling their accounts?

Those requirements don’t automatically call for another domain. We may already have the tools to handle them in the one we’ve got.

One other thing: an AD domain and a public website domain aren’t the same service. Registering a web address doesn’t create an Active Directory environment.

## Use OUs to express management responsibilities

An **organizational unit**, or **OU**, gives Jon a container for directory objects. Jon sketches out OUs for employees, workstations, member servers, and administrative accounts. The domain controllers stay in their dedicated Domain Controllers OU. A Staging OU under Workstations gives us a small place to try configuration changes.

Now take the support team’s password-reset task. Helping employees get back into their accounts doesn’t require control of the entire domain. Jon can delegate the specific permissions needed to reset passwords for those accounts. [Microsoft’s OU delegation guidance](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/delegating-administration-of-account-ous-and-resource-ous) explains that approach.

Be specific when you describe the job. “The support team manages users” leaves a lot open to interpretation. “The support team can reset passwords for these employee accounts” gives everyone a much clearer idea of the scope. Privileged administrator accounts need their own consideration.

## An OU and a group solve different problems

This is an easy distinction to lose track of when you’re getting started. Dylan’s account sits somewhere in the directory, but he can also belong to several groups. He might work on Pokemon and another project at the same time.

Jon uses OUs to help organize administration and policy. Security groups and resource permissions handle Dylan’s access to the project folders. Putting his account in an OU called Pokemon doesn’t grant folder access on its own.

That’s useful. We can add Dylan to another project without picking up his account and moving it around every time his assignments change. The directory doesn’t have to become a constantly shifting copy of the project schedule.

## Treat the forest as a trust decision

Here’s where the neat folder-like structure can give you the wrong impression. Putting a department in its own OU doesn’t isolate it from the forest’s most powerful administrators.

Sharing a forest means trusting its service administrators, whose authority can affect the wider environment. [Microsoft’s explanation of that authority](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/service-administrator-scope-of-authority) is worth reading before you rely on a boundary that isn’t really there.

Say Secure By Design acquires another company, and that company must remain independently administered. Jon needs to unpack what “independent” means. Adding an OU or child domain might not give them the isolation they require. That’s a security-design conversation, not just a naming decision.

## Trusts enable an authentication relationship

A **trust** can let identities from one domain be recognized for access in another. Domains within a forest have automatic two-way, transitive trusts. Trusts between separate forests take deliberate planning. Permissions still decide what a recognized identity can actually use. [Microsoft’s authentication concepts](https://learn.microsoft.com/en-us/windows-server/security/windows-authentication/windows-authentication-concepts) explain the relationship.

Imagine a partner needs to read one project folder. “We trust them” still doesn’t tell Jon which accounts need access or what those accounts should be allowed to do.

Start with that business need. Then work out the authentication and permission requirements. Depending on how the company shares information, an application-based sharing option might meet the need without an AD trust at all.

## A new office is a network question too

If the branch office opens, Jon has to think about subnets, connectivity, service location, and replication. **AD sites** help describe the network placement. They don’t have to line up one-for-one with domains or office names. [Microsoft’s replication concepts](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/replication/active-directory-replication-concepts) cover sites and site links.

For our company, the useful question is what the branch needs and how it connects. We shouldn’t create another domain just because someone signed a lease.

Give each part of the structure a job you can explain. That makes the environment easier to manage now, and easier for the next person to understand later.
