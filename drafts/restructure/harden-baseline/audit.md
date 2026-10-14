# Course 1.5 harden-baseline — audit (14 October 2026)

The validator passes: 5 lessons, 150 minutes, 2.5 hours. Lesson ids, counts and quizzes are unchanged, apart from one corrected explanation.

## Fixed

- `apply.steps[4]`, `apply.command`, `apply.check`, guide `apply.checklist[1]`: added decisions rule 2's check that no time setting comes from Group Policy.
  - The command runs `w32tm /query /configuration | Select-String '\(Policy\)'` and expects no output.
  - Any Windows Time Service setting in an imported GPO goes back to Not Configured, and the change is recorded.
  - Course 1.3 promised this check ("the STIG GPOs of courses 1.4–1.5 included").
  - The step's long last sentence is now two sentences.
- `apply.steps[3]`: the loopback (Merge) design now tells the learner to compare it with the package's own instructions for its user policy. The DISA ReadMe could not be checked, so this keeps the text conditional.
- `maintain.steps[1]`, `maintain.quizzes[0].explanation`, `maintain.next`: course 1.6's change-driven run was "the closing scans of the PKI servers". Those servers have no earlier scan, so their closing scans are first baselines. Course 1.6 now rescans both domain controllers: their DC certificates, root trust and autoenrollment GPO are the change. All three places now name that DC rescan as the first change-driven run.

## Verified (the "Unsure" items in notes.md)

- **XCCDF compare.** I ran the `rescan` script (`Read-Xccdf` with `Select-Xml` and `local-name()`, then `Compare-Object -Property Rule, Result`) in PowerShell 7.4 against synthetic SCC-style XCCDF 1.2 results. I used one file with `cdf:`-prefixed elements and one with a default namespace. It returns each changed rule twice, `<=` for the baseline and `=>` for now, exactly as the comment says. A parse check of every command in the course found no errors.
- **Loopback user-policy design.** The mechanics are correct: GPOs cannot link to `CN=Users`, and Merge applies the computer-OU GPOs' user settings after the user's own. Kept, with the added check against DISA's instructions.
- **Group Policy facts.** These all agree with the cited Microsoft pages: processing order, link order, Enforced and Block Inheritance, refresh intervals, MS16-072 Read for computers, account policies only at the domain root, and Import-GPO replacing settings without links, filtering or WMI filter.
- **DISA GPO package internals.** Still unverified, because the download is blocked: the GPO names, the ADD YOUR DOMAIN ADMINS placeholders, the migration table in Support Files, and account policies in the DC GPO. The text was already conditional: `<DISA GPO name>` placeholders, "Where the package's user-rights settings name placeholder groups…", "check the package's support files for one", "if the package carries account policies". Left as is.

## Judgment calls for the owner

1. **The DISA user policy through loopback (Merge) on the Domain Controllers and Servers OUs.** This was the writer's design. Options:
   - (a) Keep it (recommended). It is the only way the built-in Administrator in `CN=Users` gets the user settings on hardened servers.
   - (b) Link the user policy only to the Admin OU and accept that `CN=Users` accounts miss it.
   - (c) Follow DISA's ReadMe if it prescribes something else.

   Course 1.8 already links the same loopback GPO to its new OUs.

## For other courses

- **prove-recovery (1.19)**
  - Change "Refresh the Group Policy backup (the course 1.3 Backup-GPO set, now the whole policy estate)" to "the course 1.5 Backup-GPO set in `C:\Evidence\hardened\gpo-backup`, with its `gpo-links.csv`, now the whole policy estate, including course 1.6's SBD Certificate Autoenrollment". A restore brings back no links.
  - Change "This is the course 1.3 media procedure used for backups" to "the course 1.4 media procedure".
- **workstation-fleet (1.13)**: "the container redirects from course 1.3" and "The course 1.3 redirect" should say course 1.5. The quiz explanation "the course 1.3 design, now paying off at scale" should also say 1.5.
- **business-services (1.18)**: "Create the access groups under the course 1.3 Groups OU" should say course 1.5.
