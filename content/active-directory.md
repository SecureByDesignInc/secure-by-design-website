# What Is Active Directory?

You’ve probably signed in to a work computer, opened a shared drive, or connected to a printer without giving it much thought. You entered your credentials, got to your files, and carried on with your day.

Behind the scenes, **Microsoft Active Directory** may have done quite a bit to help make that happen.

Active Directory Domain Services, or **AD DS**, gives administrators a central place to manage identities, systems, and directory information. It also supports the policies and access decisions that keep a Windows environment working. Once you have more than a handful of machines, managing all of that separately gets old pretty quickly.

Windows isn’t the only environment with directory services. OpenLDAP can fill directory-service needs in Linux and Unix environments, for example. The implementations differ, but the basic idea is familiar: keep useful information about identities and resources somewhere organized and accessible.

For now, keep two questions in mind: **Who are you? What are you allowed to access?** Those questions show up throughout identity and access management, and they’re a good place to start with AD.

## Meet Secure By Design

Let’s put these terms to work at **Secure By Design**. Dylan is a project analyst, Jon manages the infrastructure, and Ben handles help-desk support.

Dylan has just joined the team. He sits down at his workstation, signs in, and tries to open the Pokemon project folder. Nothing unusual there. But following that one request will give us a way to see how the pieces fit together.

The internal domain is `sbd.test`, the same name the training labs use. Here’s what Jon has set up:

- `SBD-DC01` and `SBD-DC02`: two writable domain controllers, both also running DNS and global catalog services.
- `SBD-FS01`: the file server where the project documents live.
- `SBD-WS01`: Dylan’s workstation.

You don’t need to memorize the names. Just keep track of the jobs. When something breaks, knowing which system handles which job is a lot more useful than pointing at everything and saying, “AD is down.”

## Authentication and authorization

These terms sound similar, but they answer different questions.

**Authentication** is, “Are you who you say you are?” When Dylan signs in to a domain-joined computer, AD can verify his credentials. Protocols such as **Kerberos** support single sign-on to compatible services, so he doesn’t have to enter his password again for every resource he uses.

**Authorization** is, “Okay, what are you allowed to access?” Security groups, permissions, and access control lists help answer that question.

Say Dylan signs in successfully, opens the Pokemon folder, and gets “Access denied.” Annoying, sure. But that doesn’t automatically mean his password is wrong. He’s already signed in. Now we need to look at the resource he’s requesting, the permissions on it, and the groups he belongs to.

Keep that distinction handy. It can save you from resetting a perfectly good password and wondering why nothing changed.

## What does Active Directory actually do?

Authentication and authorization get a lot of the attention, but there’s more going on. Let’s walk through the main pieces and connect each one to our company.

### Domain controllers

A **domain controller**, or **DC**, is a server running AD DS. It handles directory requests and domain authentication, and supplies identity information that other systems use when checking access. Most directory updates can happen through either writable controller in our example. You don’t have one universal primary server doing everything while the other waits for its big moment. [Microsoft’s logical model](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/understanding-the-active-directory-logical-model) explains that relationship.

Jon puts the two DCs on separate virtualization hosts. If one host fails, both controllers won’t go down with it. That helps with that particular failure, although shared power or network problems can still affect both.

Dylan’s project files live on `SBD-FS01`, not on the controllers. AD helps establish who Dylan is; the file server hosts the documents and checks whether he can use them. Keeping those jobs straight makes the rest much easier to follow.

### Centralized resource management

AD keeps information about users, systems, groups, and other objects in the directory. That gives Jon a way to organize the environment and manage related resources together.

Imagine having to keep a separate account list on every machine and update all of them whenever someone joins or leaves. Central management saves you a lot of that work, and gives you a clearer picture of what you actually have.

### Group Policy

**Group Policy** lets administrators manage settings for users and systems. A **Group Policy object**, or **GPO**, can contain operating-system settings, security requirements, and other configurations that should apply to a defined set of objects.

Changing a setting on five systems might be manageable. Doing it on 500, then remembering the next 50 that arrive, is a different kind of afternoon.

Jon can use Group Policy to distribute the intended configuration. Later in the series, we’ll follow one setting from a GPO to Dylan’s workstation and check whether it actually took effect.

### The directory database and SYSVOL

Each controller has a local database supporting AD DS. Its familiar filename is `ntds.dit`. The database contains directory information about objects such as users, groups, and systems. You normally manage that information through directory tools and services; you don’t open the database file and start editing it yourself.

There’s also **SYSVOL**, a shared system volume containing files used by features such as Group Policy and logon scripts. It’s separate from the directory database, and its files follow a different replication path. [Microsoft’s database and SYSVOL module](https://learn.microsoft.com/en-us/training/modules/understand-active-directory-database/) walks through both.

Here’s a useful way to keep the distinction straight. When Jon creates Dylan’s account, that changes directory information. When Dylan saves Pokemon meeting notes, that changes a document on the file server. Both involve servers, but you’d investigate them in different places.

### LDAP

**Lightweight Directory Access Protocol**, or **LDAP**, is a standard way for applications to communicate with a directory service.

An application might use LDAP to find Dylan’s account or read an attribute from it. You can think of it as the application asking the directory for information in a format both sides understand.

You don’t need every protocol detail right now. Just recognize the name and the job: LDAP is one of the ways other systems interact with AD’s directory information.

### DNS

Before Dylan’s workstation can use domain services, it needs to find a suitable controller. **Domain Name System**, or **DNS**, helps it do that. AD uses service-location records, including **SRV records**, to identify servers offering the services it needs. [Microsoft’s SRV record guidance](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/verify-srv-dns-records-have-been-created) shows what those records are for.

This is why “I can open a website” doesn’t prove that your AD-related DNS is working. Public website lookups and internal domain-service lookups aren’t the same request.

Dylan’s workstation needs DNS servers that can resolve the internal AD records. If he can browse the internet but can’t find a controller, Jon has a more useful question to investigate than whether the internet is up.

### Trust relationships

A **trust relationship** can let identities authenticated in one domain be recognized for access in another. Domains within a forest have automatically established trusts; other trust relationships can be configured when the environment needs them.

The part to remember is that a trust doesn’t hand everyone unrestricted access. It supports the authentication relationship. Permissions still determine which resources someone can use.

So if Secure By Design ever needs to work with another domain, Jon still has to decide who needs access to what. Creating a trust doesn’t make that decision for the company.

### Replication

Having two controllers is useful only if they can share the directory changes they need. That’s where **replication** comes in.

AD DS uses a **multi-master replication** model for most directory changes. Updates can originate on different writable controllers and then travel to the other controllers holding the relevant data.

If Jon adds Dylan to a group through `SBD-DC01`, that change needs to reach `SBD-DC02` too. Another controller can also keep many domain services available when one is offline. We’ll come back to timing, failures, and the special responsibilities called FSMO roles later in the series.

## How Active Directory is organized

Now that we know where AD runs, let’s look at how its information is organized. You’ll hear these terms constantly:

**Forest → Tree → Domain → Organizational Unit → Object**

That’s a simplified view. The point is to understand what each level is doing, rather than turn the diagram into something you memorize and immediately forget.

### Forest

The **forest** is the highest-level logical structure in AD. It contains one or more domains that share a schema and configuration. The first domain created becomes the **forest root domain**.

The forest is also a security boundary. Highly privileged forest administrators can affect resources throughout it, so choosing to share a forest means accepting some significant trust relationships.

Secure By Design starts with one forest. That gives us enough to work with while we learn the fundamentals.

### Tree

A **tree** is a collection of domains with a contiguous DNS namespace. Our example domain, `sbd.test`, could have child domains such as `westcoast.sbd.test` or `eastcoast.sbd.test` if a future requirement called for them.

Those domains would form a domain tree, connected through automatic transitive trusts. We haven’t actually added those child domains to our example. The company still has one domain, and that’s perfectly fine. A tree doesn’t need a bunch of extra branches just to count as a tree.

### Domain

A **domain** contains objects such as users, systems, groups, and OUs, and is served by domain controllers. It provides a scope for administration, authentication, replication, and policies such as domain password and account-lockout policies.

It also doesn’t have to match a physical office. Secure By Design could open a branch office and keep the same domain. **Active Directory Sites and Services** helps represent the network layout separately.

Before creating another domain, Jon needs an actual requirement. A new building on the company map isn’t automatically one.

### Organizational units

An **organizational unit**, or **OU**, is a container for organizing objects within a domain. Jon might have OUs for workstations, member servers, employees, administrative accounts, and service accounts.

OUs give administrators places to link Group Policy and delegate management tasks. For example, Jon can target a server configuration at the appropriate server OU without applying it to Dylan’s workstation.

This is where a bit of planning helps. An OU structure should make it easier to manage the environment. If nobody can explain why a particular container exists, it’s worth revisiting the design.

### Active Directory objects

An **object** is something represented in the directory. Users, systems, groups, printers, contacts, and OUs are examples. Some objects are containers themselves, so the directory is more than a flat list.

Each object has **attributes** describing it. Dylan’s account might have a username, display name, email address, and security identifier. His workstation has a computer object representing that domain-joined machine.

That’s what makes AD a directory: you can organize and search information about identities and resources. The terms sound formal, but you’re working with descriptions of things your environment actually uses.

## Follow the request, then identify the responsibility

Let’s get back to Dylan. For an online domain sign-in and file-access request, think about three stages: find the service, authenticate, then request access to the resource. That’s a simplified walkthrough, not every step of a protocol exchange.

Windows can also allow some offline sign-ins using previously cached information. A successful workstation sign-in by itself therefore doesn’t prove that a controller is currently reachable.

If Dylan can’t find a controller, Jon investigates discovery and connectivity. If his identity can’t be verified, the focus shifts to authentication. If he signs in but can’t open Pokemon, the file server and permissions deserve attention.

Follow where the request got stuck. You’ll get further with that than by changing three unrelated settings and hoping one of them was the problem.

To watch Dylan’s request travel through a working design, open [Open a file in Inside the Network](/inside-the-network#process=files). Each step shows which system answers and which rule allows it.

## Active Directory is more than a login server

It’s easy to think of AD as the thing that lets people sign in. But look at everything we’ve connected to it: identities, group memberships, configuration, administration, and access to shared resources.

That’s why understanding AD matters to security. If you can’t explain who an account belongs to, what it can access, or who can change its permissions, securing the environment gets a lot harder.

You don’t need to master all of this in one sitting. Start by recognizing the components and the jobs they do. In the next article, we’ll take the structure we just covered and work through how Jon might organize it for the people using it.
