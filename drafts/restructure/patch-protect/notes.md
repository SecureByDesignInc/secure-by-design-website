# Course 1.14 patch-protect (and the 1.16–1.17 stubs): notes

Five lessons, 180 minutes (3.0 h): `design` 25 (kept), `wsus` 40 (kept), `wsus-offline` 35, `wsus-targeting` 40, `wsus-prove` 40. The validator passes. Course 1.15 has its own notes in `../management-server/notes.md`.

- `mgmt` moved to course 1.15 with its id kept.
- `epo` and `nessus` are withdrawn. They are copied verbatim from the repository (`content/configuration-courses.json`, materials edition 1.4, old course numbers) into `withdrawn-lessons.json`. That file also holds their four sources, their guide entries and their catalog stages.
- The stubs are `../endpoint-protection/catalog.json` and `../vulnerability-scanning/catalog.json`. Each has `comingSoon: true` plus an `id`, because every catalog entry needs one.
- Quizzes:
  - `design`: quiz 3 (the scanner's wide row) is replaced by a question on the expedited crossing. Quizzes 1 and 2 are kept.
  - `wsus`: all three quizzes are kept. Quiz 1 now says "export and import process", because WSUS has no "offline servicing" path. Quiz 2 now says "earlier rings", because "broad" is no longer a ring.

## Cross-course conflicts (need changes elsewhere)

1. **workstation-fleet (1.13)** still treats patching, protection and scanning as one course (1.8):
   - `prepare` step 5: "course 1.8 adds SBD-NESSUS01 for credentialed scans". This should name course 1.17 (coming soon).
   - Quiz answer "Nothing until course 1.8".
   - `scan` summary, objective 3 and step 3: "a fleet inventory that course 1.8's tooling will take over". This should be course 1.15.
   - `scan` step 4, quiz 3 and recap: "patching, endpoint protection, and vulnerability coverage are precisely what course 1.8 builds next", "course 1.8's entire agenda", "which is why 1.8 is next".
   - `next`: "Course 1.8 keeps the fleet alive: updates, approved software, endpoint protection, and the scanner".
   - The new path: 1.14 brings updates, 1.15 the inventory, and 1.16–1.17 are coming soon.
   - Separately, its command uses `C:\Staging\Win11-Reference.vhdx`, which contains a release number.
2. **business-services (1.18)**:
   - `prove-scan` step 2: "a credentialed scan of VLAN 40 from SBD-NESSUS01". SBD-NESSUS01 won't exist, so this should become SCC baselines now, with credentialed scanning arriving in 1.17.
   - Step 4: "every modeled system except the recovery design is now built, watched, patched". This is no longer true, because SBD-EPO01 and SBD-NESSUS01 aren't built.
   - The prerequisite "Complete courses 1.4–1.8 … with the ring/source rules in force" should become 1.1–1.15.
   - `design` step 2 says WEB01 uses "the same paths … SBD-SPLUNK01 and SBD-NESSUS01 use".
   - The VLAN 40 Windows servers join WSUS Ring 3 automatically if they are joined into the Servers OU.
3. **tiered-admin (1.8)** draft is consistent: "Course 1.14 adds SBD-WSUS01 to that group, and SBD-EPO01 joins it when course 1.16 arrives". The repository version still says "Course 1.8 adds SBD-WSUS01 and SBD-EPO01".
4. **linux-repository (1.9)** draft still uses interim numbers that touch these courses:
   - "SBD-NESSUS01 in 1.13, SBD-WEB01 in 1.14", "courses 1.12, 1.14 and 1.14", and "That completes course 1.8".
   - The final numbers are NESSUS01 in 1.17 (coming soon) and WEB01 in 1.18.
   - Its "Course 1.14 adopts this cadence into its software rule" is honoured: `design` step 5 puts the Windows crossing on the same monthly run.
5. **logging-pipeline (1.10)**: no course links the enrolling GPO to the Servers OU yet. SBD-DHCP01 and SBD-SYSLOG01 already live there. `wsus` step 1 says "link that GPO to the Servers OU if no course has yet". It would be cleaner done once, in 1.10 or 1.13.
6. **audit-repository (1.11)**: SBD-AUDIT01 takes updates in Ring 3, which is approved by WSUS administrators who are ordinary Tier 1 operators. `wsus` step 6 records that WSUS can't scope administrators, so the custodian's separation is procedural for updates. The owner may prefer the Ring 4 treatment for the Audit Servers OU: option 7 plus a custodian install.
7. **Inside the Network**:
   - `courses.js` maps wsus, repo, management, epo and nessus to "1.8 · Patch, protect, and watch for weakness". They should map to 1.14, 1.9, 1.15, 1.16 and 1.17.
   - F06 reads "pilot, workstations, member servers, then domain controllers". This matches the four rings. Ring 4 also holds SBD-SUBCA01, SBD-PKI-MGMT01 and AdminJumpBox01.
   - SBD-SUBCA01's "Certificate enrollment: Transport to define" leaves no register row for the certificate `wsus` requests (1.10 does the same for SBD-SYSLOG01).
8. **Saved progress**: `training:patch-protect:mgmt` should move to `training:management-server:mgmt`, with a migration like `drizzle/0012`. The `epo` and `nessus` records should be kept but hidden. `content/training-progress.json` needs the three new ids.

## Decisions worth a look

- **Four rings instead of three**, in F06's order. Ring 1 is the three 1.13 pilot PCs plus SBD-WSUS01. Ring 3 includes SBD-ADMIN-SRV01 and SBD-ADMIN-PC01. Ring 4 is the DCs and the rest of Tier 0, with AdminJumpBox01 last.
- **Ring 4 installs by hand.** It uses option 7 (download, then notify to install and restart) and its approvals carry no deadline. Tier 0 installs DC02, checks it with dcdiag and repadmin, then installs DC01.
- **WSUS has no per-group permissions.** Anyone who administers SBD-WSUS01 can change what Ring 4 installs, and an approval's deadline overrides client settings. So the October 7 rule that the DC-facing scope is Tier 0 is a procedure, not a boundary. The course records this as a residual risk and checks Ring 4 approvals by `AdministratorName`. Strictly, Microsoft's tier model would make a WSUS server that patches DCs wholly Tier 0. The owner may want to decide that.
- **WID is kept** and recorded as a decision, because WID is deprecated too.
- **Defender definitions are an optional part of the scope** until 1.16 decides how protection content is delivered.

## Sources added (all checked this session through Microsoft Learn search/fetch)

- `wsus-plan`: disconnected scenario, WID default, Report Viewer, UUP removal limit.
- `wsus-install`: `Install-WindowsFeature -Name UpdateServices -IncludeManagementTools`.
- `wsus-configure`: TLS on exactly five virtual roots, 8530/8531, and the air-gap tip that "requires two WSUS servers".
- `wsus-gpo`: every policy name used, option 7, `DetectNow`, client-side targeting with missing groups.
- `wsus-disconnected`: `wsusutil export`/`import`, the local-administrator requirement, "never import … from a source that you do not trust". A companion page also says declining doesn't stop export.
- `wsus-groups`: Unassigned Computers, deadlines.
- `wsus-rings`: client-side targeting with security groups.
- `wsus-approve`: deadlines, removal.
- `wsus-cleanup`: the 30-day computers rule and superseded criteria.
- `get-wsuscomputer`: fetched, parameters confirmed.
- Reused from sibling drafts: `gp-scope`, `dcdiag`, `filehash`, `disa-scap`, `disa-tools`, `controls`.
- The WSUS deprecation and WID wording come from `deprecated` and `wsus` (Learn search).

## Unsure

- WsusComputer property names (`FullDomainName`, `IPAddress`, `LastSyncTime`, `LastReportedStatusTime`, `RequestedTargetGroupName`) come from community scripts, not the Learn page.
- `GetUpdateApprovals(UpdateScope)`, `AdministratorName` and `GetComputerTargetGroup()` come from the Microsoft Scripting Guy blog.
- These config property names weren't fetched: `HostBinariesOnMicrosoftUpdate`, `DownloadExpressPackages`, `AllUpdateLanguagesEnabled`, `TargetingMode` and `GetSubscription().SynchronizeAutomatically`.
- I didn't claim whether SBD-WSUS01 recognizes copied files without `wsusutil reset`; the lesson offers reset if files show as waiting. I also avoided saying whether the import server's own product list filters an import; the scope is enforced on the export server.
- `Get-Certificate` hits the remoting double hop, so the request should be made in an RDP session on SBD-WSUS01.
- I don't know whether DISA's IIS STIGs have SCAP benchmarks. The lesson only says "answer … in a STIG Viewer checklist".
