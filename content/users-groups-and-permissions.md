# Users, Groups, and Permissions: How Access Works

Dylan signs in to his Secure By Design workstation just fine. Then he opens the Pokemon folder and gets “Access denied.” Jon checks that he’s using the right account. So what do we change?

Before we reset a password or start handing out administrator rights, let’s follow the access request. A successful sign-in and permission to edit a file are two different things. This is where users, groups, and permissions start to make sense together.

## Start with the identity

A user account gives us an identity that can receive permissions. Windows identifies **security principals** using **security identifiers**, or **SIDs**. People work with recognizable names; Windows uses the underlying identifiers. Security groups have SIDs too, which can appear in access-control entries. [Microsoft’s security-principal overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-principals) explains the details.

Jon created Dylan’s account for his normal work. Editing project documents doesn’t require him to control the whole workstation or domain. If he eventually needs administrative access, that’s a separate request with its own scope.

Jon starts by asking what Dylan was trying to do. Could he open the folder but not save a change? Could he read a document but not delete it? “Give him access” sounds simple until you realize nobody has said what kind of access.

## Use groups to make access understandable

**Security groups** let you collect accounts and assign permissions to those groups. **Distribution groups** are for messaging and aren’t security-enabled entries you can use in a resource’s access list. Groups also have a **scope**, which affects membership and where you can assign permissions. [Microsoft’s group reference](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-groups) has the scope rules when you need them.

For Pokemon, Jon creates two security groups:

- `GG_Pokemon_Contributors`, a **global group**, represents the people contributing to the project.
- `DL_Pokemon_Modify`, a **domain local group**, represents Modify access to the project folder in this domain.

Dylan goes in the contributor group. That group goes in the resource-permission group. The resource-permission group gets the appropriate permissions on the folder.

The path is **Dylan → Pokemon contributors → Pokemon Modify → Pokemon folder**. You’ll hear this called **AGDLP**: Accounts, Global groups, Domain Local groups, Permissions. It’s a useful pattern for our single-domain example. More complex environments can need a different design.

Why bother with the extra group? It separates the people doing a job from the permission on a resource. The project owner can review the contributors, and Jon can manage the folder’s access without maintaining a separate entry for every person. The group names are our own convention; their purpose is what matters.

## The file server evaluates the requested access

AD supplies identity and membership information. The resource server checks the request against its access controls. With a Windows file share, network access has to get through both **share permissions** and **NTFS permissions**. Inheritance, group membership, and deny entries can all affect the result. [Microsoft’s access-control overview](https://learn.microsoft.com/en-us/windows/security/identity-protection/access-control/access-control) explains how access tokens and access-control lists fit together.

Jon checks that the share permits the operation Dylan needs, then grants the Pokemon resource group NTFS Modify permission on the intended folder. Jon checks the inherited permissions too. Calling a group “Modify” doesn’t do any of that configuration for you. The name is a label, not a magic switch.

Now imagine Dylan needs read-only access to another project. We should model that requirement separately. Reusing the Pokemon group because it happens to exist would tie two unrelated access decisions together, and that gets confusing fast.

## A membership change is not an instant session reset

Here’s another thing that can make a perfectly reasonable change look broken. Windows sessions use security information established during authentication. Updating a group doesn’t instantly rewrite every existing access token or application session.

Depending on the access path, Dylan may need a new sign-in or a renewed service session before the change shows up. Jon records the change and tests it in the intended session instead of assuming every connection has already picked it up.

Pay attention to this when you remove access, too. An existing connection isn’t enough to prove that your new membership or permission decision is being enforced the way you expect.

## Review access when the work changes

A few months later, Dylan moves to another project. Adding the new access is only half the job. Does he still need Pokemon? The project owner should make that call, and Jon should have a record of it.

This is where those clear group relationships earn their keep. You can follow how Dylan got access and decide whether he should keep it. If you’ve scattered individual permissions all over the file server, that same review becomes a scavenger hunt.

Build an access path you can explain to another person. Future you will appreciate it when someone asks why an account can still open a folder nobody remembers assigning.
