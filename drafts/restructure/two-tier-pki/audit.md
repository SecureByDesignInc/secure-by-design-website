# Course 1.6 two-tier-pki — audit (14 October 2026)

The validator passes: 10 lessons, 280 minutes, 4.7 hours. Lesson ids and counts are unchanged. One quiz was corrected, one was appended, and two lessons got five more minutes each. Before this audit, the draft was identical to the repository's live course, so every old number was still in it.

## Fixed

**Course numbers and references**
- `catalog`: number 1.4 → 1.6 and categoryOrder 4 → 6. estimatedHours 4.5 → 4.7, because first-templates went 25 → 30 minutes and validate 30 → 35. The description, `outcomes[3]` and `stages[8–9]` now match the lessons.
- `prerequisites[0]`: "courses 1.1–1.3 (identity, DNS and time, and the hardened baseline)" → courses 1.1–1.5, with what each one built.
- `prerequisites[1]`: "(course 1.5 moves it… to a Tier 0 Servers OU)" → course 1.8, covering both PKI servers. Both VMs now have hypervisor time sync off and take time from the domain (rule 2).
- `prerequisites[2]`: names rule F18 and the enrollment row that lesson 10 relies on (see judgment call 1).
- `template-admin.steps[1]`, `quizzes[1].answers[1]`, `recap[1]`: "the Admin OU from course 1.3" → 1.5. The step now names the group `SBD PKI Admins`, as its command already did.
- `first-templates.steps[3]`: "the lesson-3 change process" → lesson 8, where the change process is written.
- `first-templates.steps[2]`: "the business services in course 1.9" → the TLS consumers that really use the template: 1.10 (SBD-SYSLOG01), 1.12 (SBD-SPLUNK01), 1.14 (SBD-WSUS01) and 1.18.
  - The step now says the subject is supplied in the request.
  - Course 1.12 makes its request with openssl on the host, so it needs that setting.
- `first-templates.quizzes[2]`: "fifty machines in course 1.7" → 1.13.
- `validate.next`: "Course 1.5 brings DHCP and the tiered administration plane online" → "Course 1.7, Run DHCP on SBD-DHCP01…".
- `publication`: the DNS alias "from course 1.2" was already right and is kept.

**Time (rule 2)**
- `root.steps[0]`, `command`, `check`, `evidence`, and the guide checklist: the root's clock is set from course 1.3's approved reference, with both readings logged.
- `sign.steps[0]`, `command`, `check`, `evidence`, `objectives[0]`, and guide `stepTitles[0]` and `checklist[0]`: the root clock is checked before every signing ceremony and corrected only by the measured difference. Microsoft's ceremony module lists "Root time verification" as a ceremony control.
- `request.steps[0]` and `command`: SBD-SUBCA01 takes domain time with hypervisor sync off; `w32tm /query /source` is checked.
- `validate.steps[3]`: every later ceremony starts with the clock check.
- `labNote`: says the clock is set at every root session.

**Technical accuracy**
- `publish.steps[0]` and `command`: the root certificate and root CRL are now added to the issuing CA's local stores before its certificate is installed. Certificate Services checks its own chain when it starts. pki.sbd.test serves nothing until lessons 6–7, so without this the CA fails to start, with revocation offline.
- `publication.steps[0]`, `command` and `check`: double escaping is now allowed on the PKI site only. The issuing CA's delta CRL names contain "+", and IIS request filtering otherwise rejects them (404.11). This is Microsoft's "publish trust data" module. The `publish` source was added.
- `publication.steps[1]`, `publish-trust.steps[3]`, `validate.steps[1–2]`: "a client in another VLAN" / "a clean client" does not exist at this point in the path; SBD-TEST80 arrives only in course 1.7. The checks now run from SBD-DC01. It is a domain member in VLAN 10 that rule F18 lets reach pki.sbd.test, and its URL cache is cleared first (`certutil -urlcache * delete`).
- `publish-trust.command` and `check`:
  - The lesson verified `C:\Evidence\pki\test.cer` at lesson 7, when no template is published yet, so no end-entity certificate can exist. It now verifies `IssuingCA.cer`, the one certificate that exists, against the live site.
  - It also checks that the base and delta CRLs return 200.
  - `certutil -URL` was dropped: it opens a GUI and leaves no text evidence.
- `first-templates.command`: `certutil -template … | Select-String 'msPKI-…'` matched nothing, because certutil prints `TemplateProp…` names. It now reads `msPKI-Minimal-Key-Size` and `msPKI-Certificate-Name-Flag` from the directory with `Get-ADObject`.
- `template-admin.steps[2]` and the guide control body: "no Tier-0 account edits templates" contradicted course 1.8's tier model, where SBD-PKI-MGMT01 and its administrators are Tier 0. It now reads "no Domain Admins or Enterprise Admins account". This also fixes the "Tier-0" hyphen.
- `validate.command`:
  - It verified `C:\Evidence\pki\pilot.cer` without ever creating it. The command now exports the certificates and adds the revoke and CRL commands.
  - It now backs up the new GPO, exports its link (a backup restores no links, as course 1.5 teaches), and seals `C:\Evidence\pki-manifest.csv`.
- `validate.quizzes[3]`, `steps[4]`, `check`, `evidence`: "Rescan SBD-SUBCA01" was wrong, because it was never scanned before. It is now first baselines of SBD-SUBCA01 and SBD-PKI-MGMT01, plus a rescan of both DCs, which this course changed.
  - The scans are done "the course 1.4 way": the same SCC, benchmark and profile from the 1.4 media set, run locally.
  - Results are carried to `C:\Evidence\pki\<host name>` on SBD-DC01 and their hashes checked again.
  - The IIS STIGs for the publication site are listed with an owner. Course 1.14 does the same for WSUS.
  - The quiz key and explanation are corrected.

**Domain controller certificates (the known 1.4 item)**
- The requirement is real: DISA's Windows Server STIG says domain controllers must have a PKI server certificate (CAT II).
- `first-templates`: it now duplicates Kerberos Authentication as **SBD Domain Controller Authentication**, following Microsoft's domain controller guidance:
  - subject name None with the DNS name in the SAN;
  - a key storage provider with RSA 2048 or more and SHA-256;
  - it supersedes Domain Controller, Domain Controller Authentication and Kerberos Authentication;
  - Domain Controllers and Enterprise Domain Controllers hold Read, Enroll and Autoenroll.

  The lesson now publishes three templates. The summary, objectives, steps (5), check, recap, next, sources (`dc-certs`), an appended quiz, and the guide (stepTitles, status, mistake, network, checklist) were updated to match.
- `validate.steps[0]`: the **SBD Certificate Autoenrollment** GPO (Certificate Services Client - Auto-Enrollment) is linked at the domain root. Template permissions decide who enrolls.
  - Both DCs autoenroll.
  - The pilot is named: SBD-PKI-MGMT01, the only non-DC member that exists in 1.6.
- `validate.steps[5]`: in copies of the course 1.5 checklists (`C:\Evidence\pki\checklists`), the DC certificate rule is answered Not A Finding with the certificates as the observation, and course 1.4's POA&M candidate is recorded closed.
  - The companion rule, that DC certificates come from the DoD PKI or an approved ECA (also confirmed in the STIG), stays open.
  - It goes into `C:\Evidence\exception-record.csv`.
- `summary`, `objectives`, `recap`, `labNote`, `catalog`: updated to match.
- Guide scene:
  - The TEST CLIENT viewpoint is removed, because no such system exists in 1.6.
  - SBD-DC01 now carries the AIA/CDP retrieval flow ("HTTP TCP 80 (F18)") and the autoenrollment flow (dc1 ↔ subca); it is `existing` and `from: 4`.
  - The label, completeCaption and the node descriptions for subca, pkimgmt and dc1 are updated ("three templates", pilot).
  - The validate and publish-trust captions, checklists and stepTitles are updated.
- Sources added:
  - `dc-certs`: Microsoft Learn, On-premises key trust deployment guide; checked, and it has the DC template and autoenrollment GPO steps.
  - `disa-scap` and `disa-library`: the same cyber.mil URLs as 1.4.

**Checked and kept:**
- The NIST titles: SC-12, CP-9, CM-6, MP-5, SC-17, AC-6, IA-5(2), AC-5, CM-7, CA-2.
- The SP 800-57 claim about 112 bits through 2030.
- The 2,048-bit TLS floor in the newest Windows Server release (Microsoft Learn, What's new).
- The CAPolicy.inf keys, and the "CAPolicy.inf Syntax" title.
- The model links: trust step 2, web steps 2 and 3.
- A parse check of every command. The only flags were the deliberate `'<…>'` placeholders.

## Judgment calls for the owner

1. **The enrollment path to SBD-SUBCA01 is not in the network.** Inside the Network lists SBD-SUBCA01's "Certificate enrollment" as "Transport to define", and no register rule carries it. Autoenrollment uses DCOM/RPC: TCP 135, then the dynamic 49152–65535 range. The DCs in VLAN 10 (now), and later the fleet in VLAN 80 and the member servers, cross the default-deny core to reach it. Options:
   - (a) Add a register row, for example F23 "Windows domain members → SBD-SUBCA01 · certificate enrollment · RPC TCP 135 + 49152–65535", to Inside the Network and its matrix.
   - (b) Do (a), and also pin the CA's DCOM port to one static port and register only that.
   - (c) Use the enrollment web services (CEP/CES over HTTPS). That needs another role and design.

   I recommend (a), and (b) if the owner wants a tighter rule. Until then, the course tells learners to confirm the row exists.
2. **The pilot computer is SBD-PKI-MGMT01.** Alternatives: a disposable test VM, which adds a system, or no computer pilot until course 1.13. I recommend keeping SBD-PKI-MGMT01.
3. **The autoenrollment GPO is linked at the domain root.** Microsoft's DC guidance links it to the Domain Controllers OU. With the domain root, course 1.8's Tier 0 Servers move and course 1.13's fleet need no new links, and template permissions still gate enrollment. A narrower alternative: links on Domain Controllers, Servers and later OUs.
4. **The DoD PKI/ECA companion rule is recorded as a deviation.** The alternative is Not Applicable for a non-DoD lab. I recommend the exception record, because it is the honest choice.
5. **Materials.** The workbook, checklist and package need regenerating, and the edition bumping, after these changes. That is out of scope here.

## For other courses

- **tiered-admin (1.8)**, `scan`:
  - Carry course 1.6's evidence. The command `'baseline', 'hardened', 'dhcp' | ForEach-Object {…}` should become `'baseline', 'hardened', 'dhcp', 'pki' | ForEach-Object {…}`.
  - "the baseline, hardening, and course 1.7 Tier 0 folders" should add "the course 1.6 `pki` folder, with SBD-SUBCA01's and SBD-PKI-MGMT01's first baselines".
  - Its rescans of those two servers compare against `C:\Evidence\pki\<host name>`.
  - FYI: SBD Certificate Autoenrollment is linked at the domain root, so the Tier 0 Servers and Admin OUs need no link for it.
- **workstation-fleet (1.13)**, `certificates`:
  - "Course 1.4 proved autoenrollment on a pilot group" → "Course 1.6 proved autoenrollment on both domain controllers and its pilot group (SBD-PKI-MGMT01)".
  - "Through the course 1.4 change process" and the quiz answer "The course 1.4 change process" → course 1.6 (its lesson 8 process).
  - "from the pilot group to the Workstations OU's computers": template permissions name groups, not OUs. Grant Autoenroll to a fleet computer group, or Domain Computers. The autoenrollment GPO already reaches the Workstations OU from the domain root, so only the template permission widens.
- **business-services (1.18)**:
  - "the course 1.4 SBD Server Authentication template", "through the course 1.4 process", "the payoff moment for course 1.4" and "course 1.4's templates" → course 1.6.
  - "Complete courses 1.4–1.8: working PKI services…" needs the final numbers.
- **prove-recovery (1.19)**: "the CA key protection decisions from course 1.4", "the root CA's protected backup from the course 1.4 ceremony", "the course 1.4 ceremony artifacts" and "The course 1.4 custody discipline" → course 1.6.
- **Inside the Network**: SBD-SUBCA01's "Certificate enrollment · Transport to define" (judgment call 1).
