# Course 1.1 dc01-dc02: audit

`lesson.json` and `catalog.json` started as unchanged copies of the repository's `public/training/dc01-dc02/lesson.json` and the `dc01-dc02` episode entry in `content/videos.json`.
- After the edits, `lesson.json` is valid JSON with exactly the same structure: same keys and types, chapter, step, foundation and quiz counts, and `version` 0.1.0.
- Quiz answers and keys and the checklist wording are unchanged, so saved answers and saved ticks keep their meaning.
- `catalog.json` needed no change.

## Fixed (lesson.json)

- **foundations `segment` block 2.** "…the services in "What crosses the network?", and course 1.8's credentialed scans." becomes "…name resolution (course 1.2) and the services in "What crosses the network?"." Course 1.8 is tiered administration, and Nessus is course 1.17, coming soon (decisions.md rule 1).
- **foundations `segment` block 3.** "AdminJumpBox01, the Tier 0 host on VLAN 60 that course 1.5 builds" becomes course 1.8.
- **foundations `segment` block 4.** "until course 1.5 limits them to the Tier 0 host" becomes course 1.8. The 1.8 draft's `admin-hosts` step is what scopes the DCs' Remote Desktop, WinRM and ADWS rules.
- **foundations `ports` takeaway.** "Name resolution (F01) and credentialed scanning (F15) have their own rules" becomes "Name resolution has its own rule (F01), and so does credentialed scanning (F15), which arrives with course 1.17, coming soon". This is the single coming-soon mention (rule 1), and F15 stays named because Inside the Network still shows it.
- **chapters `prepare` step 3.** "document the intended internal time source" now adds ": SBD-DC01, which course 1.3 makes the domain's time source". This adds the pointer to course 1.3, as decisions.md rule 2 asks.
- **chapters `evidence` control name.** "Maintain the configuration and its evidence" is not a NIST title. For "CM-2 / CM-6" it becomes the exact Rev. 5 titles, "Baseline Configuration / Configuration Settings".

## Workbook (workbook-replacements.json, 5 entries)

Each "old" was checked: it appears exactly once in one paragraph of the Word workbook.
- The four foundation edits above. The workbook mirrors those paragraphs verbatim.
- The workbook-only line "Next in the path: course 1.2, Configure DNS and time." becomes "…course 1.2, Configure DNS."
- The `prepare` step and the control name don't appear in the workbook.

## Checked and left as is

- **Commands:** DCDiag, repadmin, `netdom query fsmo`, the Get-SmbShare/CimSession checks, and the firewall profile checks with `-PolicyStore ActiveStore`.
- **Facts:**
  - The first controller in a forest is always a global catalog.
  - The DCDiag default tests.
  - Microsoft's recommendation of two virtualized DCs on different hosts.
- **Network:** the port table against Inside the Network (F02, F03, F09, A01) and the model links.
- **Controls:** CM-2, CM-6, CP-9 and IA-2 have exact titles.
- **Time:** nothing in 1.1 conflicts with rule 2. Course 1.3 turns off hypervisor time sync and configures the source.

## Judgment calls for the owner

- **The workbook's time row.** The sample-configuration row "Network and time: Isolated, no internet / record the internal time source" could also point to course 1.3. It was left alone to avoid re-flowing that table. Recommendation: leave it, because the guide now carries the pointer.

## For other courses / integration

- After applying these changes:
  - Apply workbook-replacements.json to the Word workbook.
  - Re-export the PDF.
  - Rebuild the 1.1 guide and package with `scripts/prepare-training-sharing.py` and `prepare-training-packages.py`.
  - Bump the 1.1 materials edition.
