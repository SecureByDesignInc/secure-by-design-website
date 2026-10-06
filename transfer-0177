# Replication and FSMO Roles: Keeping AD Working Together

Jon adds Dylan to the Pokemon contributor group through `SBD-DC01`. A moment later, Jon checks the membership through `SBD-DC02` and doesn’t see the change yet.

Before anyone announces that AD has lost the account, let’s look at which controller Jon contacted at each step. We have two servers answering questions about information that recently changed. They need a way to catch each other up.

## Replication moves directory changes

**Replication** distributes directory updates between controllers that hold the relevant data. Most changes can start on different writable controllers. AD sends logical changes for the receiving controller to apply to its own database; it doesn’t copy the entire database file every time Jon edits a group. [Microsoft’s database and replication module](https://learn.microsoft.com/en-us/training/modules/understand-active-directory-database/) explains that process.

Timing matters here. Jon needs to know whether the update has reached the controller being queried. A brief difference after a change isn’t automatically corruption. If the controllers consistently fail to converge, though, that needs attention.

For our example, Jon records the controller names and the time of the change. That gives the team a useful place to start. Two different screenshots alone don’t tell us why the results differ.

## Sites describe the network context

**AD sites** represent well-connected groups of IP subnets. **Site links** help describe connections used to plan replication between sites. The **Knowledge Consistency Checker**, or **KCC**, uses the topology information to build replication connections. Sites describe a different part of the environment than domains do. [Microsoft’s replication concepts](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/replication/active-directory-replication-concepts) cover the terminology.

Both of our current controllers are in the headquarters site. If the branch office gets a controller later, Jon needs to account for its subnet and network connection. A slow connection is something to plan around, not something we want to discover halfway through troubleshooting.

There isn’t one replication delay you can promise for every change in every environment. Look at the topology and configuration you actually have, then check whether replication is behaving as expected.

## Some operations need a designated owner

Most writable-controller operations use the **multi-master** model. A smaller set of jobs has designated owners called **flexible single master operations**, or **FSMO**, role holders.

There are five role types to know. Two are forest-wide, and three exist in each domain:

- **Schema master — forest:** handles changes to the definitions of directory objects and attributes.
- **Domain naming master — forest:** coordinates additions and removals involving domain and application directory partitions.
- **RID master — domain:** hands out pools of relative identifiers used to create unique security identifiers.
- **PDC emulator — domain:** has responsibilities involving password changes, account lockouts, and time hierarchy. The forest-root PDC emulator is the forest’s authoritative Windows time source.
- **Infrastructure master — domain:** maintains certain cross-domain object references. How much work it has depends on the forest’s configuration.

One controller can hold several roles, or the roles can be spread across eligible controllers. Holding a role doesn’t make a server responsible for every sign-in and directory update. [Microsoft’s FSMO overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-fsmo-roles) explains the jobs and placement considerations.

Jon records where all five roles live in our single-domain example. If a controller goes offline, the team can work out which jobs may be affected. That’s a useful reason to know the role holders. Moving roles around because one laptop can’t sign in would be a pretty big leap from the evidence.

## A second controller helps availability

Say `SBD-DC01` goes offline for maintenance. If `SBD-DC02` and the services clients need remain reachable, that second controller can keep many domain requests working. The exact impact depends on the missing server’s roles and the available services.

But two virtual machines on the same host still share a host failure. Two controllers using the same broken network connection still share a network problem. More servers help only with the failures your design actually accounts for.

Jon checks those dependencies instead of treating the number two as a complete availability plan. Dylan cares whether he can work, not how many server icons are on the diagram.

## Replication does not replace recovery

This part is easy to overlook: a bad change can replicate too. Another domain controller isn’t a historical backup waiting to hand you yesterday’s environment.

Recovery needs protected backups and a supported process that you’ve tested for your requirements. [Microsoft’s forest recovery guide](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-guide) is the reference to spend time with when you plan that work.

Jon treats availability and recovery as separate exercises. One asks how to keep services running when a server fails. The other asks how to return the directory to a trusted state after something damaging happens. Jon needs to know the escalation path for both.

Keep those jobs straight: replication shares current changes, FSMO roles coordinate selected operations, and recovery planning gives you a way back when the current state is the problem.
