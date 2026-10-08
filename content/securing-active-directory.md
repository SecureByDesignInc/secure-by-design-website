# Securing Active Directory: Building on the Fundamentals

Dylan can sign in, open the Pokemon folder, and use a workstation with the intended settings. Jon knows what the two domain controllers do and can distinguish a discovery problem from a permissions problem.

That’s a good place to be. Now let’s ask what could let someone misuse this setup, how the team would notice, and what happens if they need to recover it.

## Begin with what matters to the company

Keeping the Pokemon file server online is useful, but it doesn’t answer every security question. Who can read the project files? Who can change the permissions? Who decides whether a new person should join the project group?

Jon assigns those responsibilities. Dylan’s project manager approves contributor access. Support staff handle documented requests using the permissions Jon has delegated, while Jon manages the supporting configuration. Someone also needs to review access and investigate changes that don’t match an approved request.

None of this needs to sound fancy. We just need to be able to explain why an account has access and who can change that decision. Being technically able to add someone to a group doesn’t mean every addition is justified.

## Keep powerful access deliberate

**Least privilege** means giving an identity the authority it needs for its task and limiting unnecessary privileges. Highly privileged accounts and service accounts deserve a close look here. [Microsoft’s administrative guidance](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/implementing-least-privilege-administrative-models) goes through that approach.

Resetting ordinary employee passwords doesn’t require routine membership in the Domain Admins group. Dylan doesn’t need local administrator rights to edit Pokemon documents. Jon uses a separate administrative identity for privileged work and an ordinary account for email and day-to-day activity.

Service accounts need an owner and a purpose too. If somebody says an application needs powerful access, Jon should ask which operations require it and whether those permissions are still needed. An old service account shouldn’t keep broad access forever because nobody remembers what it does.

When the application changes or gets retired, review its identity and permissions along with it. Otherwise, yesterday’s temporary workaround has a habit of becoming tomorrow’s mystery account.

## Protect the path administrators use

A separate admin account helps, but pay attention to where it gets used. The workstation used to manage a domain controller is part of that administrative path. Microsoft recommends secure administrative hosts and cautions against managing a more-trusted system from a less-trusted one. [Its administrative-host guidance](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/implementing-secure-administrative-hosts) explains the reasoning.

Jon plans a controlled workstation for domain-management tasks. The team also looks at the virtualization hosts and backup systems supporting the controllers. Someone who controls those systems may be able to affect the directory even if they aren’t in the AD group you first thought to check.

So widen the question a little. Which people, machines, and services can change this environment? One administrator-group membership list won’t necessarily give you the whole answer.

See what this protects against in [the attack drill, step 6](/inside-the-network#process=drill&step=6), where a stolen administrator session aims at a domain controller and is stopped.

## Make configuration changes explainable

Remember testing Workstation Baseline in Staging in the Group Policy article? Jon knew what was changing, where it applied, and what Dylan should see afterward. The same thinking helps with security changes.

Check the actual Windows versions and application requirements before tightening authentication or directory-communication settings. A setting copied from someone else’s environment may have dependencies they never mentioned in the post you read.

Jon’s notes help the team connect a reported problem with a recent change. If Dylan says something stopped working this morning, knowing what Jon changed last night gives them a starting point. It still needs investigation, but at least we aren’t relying on everyone’s memory.

## Collect evidence that someone will use

**Advanced audit policy** lets you choose security activities to record in more detail. Some object-level auditing also requires appropriate audit entries on the objects themselves. The configuration needs to match what you want to observe. [Microsoft’s audit-policy guidance](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/advanced-audit-policy-configuration) covers those choices.

Start with questions you care about. Who changed an important policy? Who added someone to a privileged group? Are unusual authentication failures being looked into?

Then work out collection, retention, review, and escalation. Generating logs is only part of the job; somebody needs a reason and a way to use them.

If Jon sees an unexpected Pokemon membership change, the next step is to compare it with the approved request and investigate anything unexplained. An alert isn’t automatically proof of an incident. It’s a signal that deserves the right follow-up.

## Practice recovery before it is needed

Our second controller helps with availability. It doesn’t guarantee that a bad change can be undone. Jon needs protected backups, trusted recovery information, and an isolated recovery exercise. A backup job reporting success and a recovery exercise succeeding are different pieces of evidence. [Microsoft’s forest recovery planning guidance](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-determine-how-to-recover) covers what to consider.

The team should know who can authorize recovery and how to reach the instructions if normal sign-in isn’t working. They also need to know which business services must come back afterward.

Dylan’s goal is to get back to project work. Restoring a server is a step toward that goal, so the exercise should check more than whether a machine starts up.

## Carry the foundation forward

We started with a person signing in and trying to open a folder. Now we can talk about the identities, permissions, controllers, policies, and recovery work behind that everyday task.

That foundation gives you a place to build from. You don’t have to memorize every setting to start asking better questions about a system.

Keep practicing the basics: know what’s there, understand who can change it, check what actually happens, and have a plan for getting it back when things go wrong.
