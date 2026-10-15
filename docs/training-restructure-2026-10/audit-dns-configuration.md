# Course 1.2 dns-configuration: audit

Validator passes (5 lessons, 110 minutes, 1.8 h). Lesson ids, counts and quiz keys are unchanged.

## Fixed

- **prerequisites[1].** "an account delegated to manage DNS" is replaced by working at a domain controller's VM console with an authorized Domain Admin account, "until course 1.8 builds AdminJumpBox01". The reasons:
  - The plan lesson changes the controllers' DNS client settings and uses Invoke-Command against them, which needs administrator rights on the controllers.
  - A DnsAdmins-only account can't sign in at a DC console.
  - The new wording matches courses 1.1, 1.3 and 1.4.
- **sources `locator`.** The URL changes from `…/ad-ds/manage/dc-locator-changes` to the current page, `…/ad-ds/manage/dc-locator` ("Locating domain controllers in Windows and Windows Server"). That page matches the source title and the lesson's claims about SRV records and the LDAP ping.
- **`zones` command.** Adds `SecureSecondaries` to the Select-Object, so the command produces the transfer policy that the lesson's evidence asks for.
- **`records` (pki.sbd.test alias).** Course 1.6's draft expects "the pki.sbd.test alias from course 1.2 resolves to 10.0.30.30", and decisions.md gives the reserved alias to 1.2. The lesson only said "reserve pki.sbd.test for the approved internal publication host" for "the later PKI course". Four parts change:
  - Step 3 now creates pki.sbd.test as a CNAME for SBD-PKI-MGMT01.sbd.test, the course 1.6 publication host at 10.0.30.30.
  - The command adds `Add-DnsServerResourceRecordCName … -Name pki -HostNameAlias SBD-PKI-MGMT01.sbd.test` and a CNAME query against SBD-DC02.
  - The check explains that the alias returns an address only once course 1.6 builds the host.
  - The step now says to *enter* the target FQDN rather than *select* it, because the target doesn't exist yet.
- **catalog.json stages.** The `plan`, `zones` and `verify` details were shortened versions of the lessons' summaries. They now equal the summaries, as in every other course and as the spec requires.

## Checked and left as is

- Commands checked: the pktmon syntax, `dcdiag /test:DNS /e /v`, the Get-DnsServerZone properties, and Set-DnsClientServerAddress through a CIM session.
- The DNS client order: partner first, loopback second, applied only after replication succeeds both ways.
- Rule F01, the reverse zone name, and the CNAME exclusivity quiz.
- The guide's controls, which have exact titles: CM-2, CM-6, CM-3, SC-22 and CM-4.
- The `troubleshoot.next` handoff to course 1.3 "Configure domain time".

## Judgment calls for the owner

- **Stage text length.** The catalog stage text for `plan`, `zones` and `verify` is now the full lesson summary, so those expanded-tile stages are longer than the live ones. If you prefer the shorter tile wording, shorten the lesson summaries themselves so the two stay equal. Recommendation: keep the summaries as they are.

## For other courses

- **two-tier-pki (1.6) lesson 6** checks that pki.sbd.test resolves to 10.0.30.30. That is now consistent: 1.2 creates the CNAME, and SBD-PKI-MGMT01's own A record arrives when 1.6 joins it to the domain. Course 1.6 shouldn't create a second pki record.
- **dhcp (1.7) `dhcp-dns` command (minor).** It hard-codes `-ReplicationScope Domain` under the comment "(course 1.2's replication scope)". Course 1.2 leaves domain or forest scope to the learner, so the comment should read "use the scope you chose in course 1.2 (Domain in this sample)". Its step text already says this.
- **Repository.** The DNS workbook still contains its time pages, so regenerate it with `scripts/sync-workbooks.py`.
