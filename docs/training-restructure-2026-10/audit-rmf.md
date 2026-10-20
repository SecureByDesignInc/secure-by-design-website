# Audit: Network Authorization 2.1–2.3 (rmf)

The module ids (01–12), the lesson ids, the hours (6 / 9 / 5 + 4 capstone = 9), the artifact ids and the progress structure are unchanged. Both .js files still load and define `window.CATALOG` (12), `window.LEARNING` (12) and `window.ARTIFACTS` (10); this was checked with node. The source numbers [1]–[7] map to `sources` in public/training/rmf/app.js (800-37 r2, 800-53 r5, 800-53A r5, 800-53B, DoDI 8510.01, DoDM 5205.07, the DCSA newsletter).

## Fixed

1. catalog-data.js module 06 `build`: "Use Splunk, Tenable, and Trellix examples" → the practice network's SCC results, STIG Viewer checklists, Splunk review records and the course 1.19 restore record (SBD-NESSUS01/SBD-EPO01 are coming soon, decisions rule 1).
2. catalog-data.js module 06 `prove`: "a failed authenticated scan" → "a scan that missed an in-scope host". The practice system has no credentialed scanner yet.
3. catalog-data.js module 10 `sources`: [1,7] → [1,5,7]. DoDI 8510.01 is the source for the submission workflow the module practises.
4. learning-data.js module 02 learn[2]: removed "In the Inside the Network practice system, transfers across the air gap remain manual…" from the general chapter (AGENTS.md network-neutral chapters). It now reads "Record how information crosses the boundary and who is responsible for each transfer". The practice detail stays in the scope record.
5. learning-data.js module 03 learn[2]: the categorization authority is now explicit. Federal systems use FIPS 199 with the SP 800-60 information types; national security systems follow CNSSI 1253 (exact title given); a SAP adds program direction. This follows the AGENTS.md CNSSI 1253 framing.
6. learning-data.js module 04 learn[0]: "also requires the applicable CNSS and program direction" → a national security system selects controls under CNSSI 1253 and its overlays, and a SAP adds the JSIG and AO-approved program direction. 800-53B is no longer implied to be the NSS baseline.
7. learning-data.js module 06 learn[1]: the optional examples are now SCC, STIG Viewer, Splunk and restore-test records (was Splunk/Tenable/Trellix), and "equivalent records from any toolset" keeps the chapter neutral.
8. ARTIFACTS scope record and module 10 example: "22 named systems" → 21. Inside the Network has 21 named systems plus the "50 Windows PCs" fleet entry.
9. ARTIFACTS scope record: added that SBD-EPO01 and SBD-NESSUS01 are in the design while courses 1.16/1.17 are coming soon. Learners record them as planned components, which fits module 05's "describe the system that actually exists".
10. Module 10 example: "(the offline root CA has no network path to scan)" → "never on the network, so it is assessed only during its ceremonies". The path's assessment is SCC run locally, not network scanning.
11. catalog.json 2.1 description: makes the AGENTS.md relationship explicit: the network built by courses 1.1–1.19, shown in Inside the Network.

Checked and left as is: the 800-37 Rev. 2 statements (Prepare is the Rev. 2 addition, the package contents, the roles, and a POA&M not being risk acceptance), the 800-53A examine/interview/test text, and the PL-2, RA-7, CA-5, CA-6 and AU-2/3/6/12 usage. The SSP implementation chain (F17 WEF → SBD-SYSLOG01 → F10 SBD-SPLUNK01, F11 SBD-AUDIT01, F07 Linux syslog over TLS) matches courses 1.10–1.12. The attack-drill wording matches the model's six drill steps.

## Judgment calls for the owner

1. **Single-instance risk decision (SSP "Recorded risk decisions", summary, POA&M).** It still names "Tenable/Nessus, and Trellix ePO/DLP" as running single instances. That is the AGENTS.md design, but those systems aren't built yet.
   - Options: keep it as design; reword to "Splunk (and, once built, Nessus and ePO)"; or limit it to Splunk until 1.16/1.17 ship.
   - Recommendation: the second option, with "once built".
2. **Module 06 learn quiz on failed scan credentials.** Kept: it is a network-neutral evidence-quality point, not a dependency on SBD-NESSUS01.
3. **Word catalog** (`Secure_By_Design_RMF_Training_Catalog.docx`, materials edition 1.4) mirrors these texts. It needs the same edits and an edition bump when this is merged; I didn't change it, because it isn't in my folder.

## For other courses

- **Repository public/training/rmf/**: copy these catalog-data.js and learning-data.js over the originals. app.js is unchanged. Re-export the Word catalog (judgment call 3).
- **prove-recovery (1.19)** `record` closes with "Continue with course 2.1": consistent.

## Owner decisions applied (14 October 2026)

- Decision 12: learning-data.js module 05 SSP excerpt, "Recorded risk decisions" example: the Splunk/Nessus/ePO single-server risk decision → "None recorded in this excerpt", with RA-7 / CA-5 / CA-6 roles kept.
- Decision 12: learning-data.js POA&M "Status and decision" example: single-instance design and its restore-gap POA&M entries removed; "only the AO can accept risk (CA-6)" kept.
- Decision 12: learning-data.js decision-briefing "Residual risk" example: "Present the single-instance design for Splunk, Nessus, and ePO separately…" removed; the RA-7 / CA-6 sentence now refers to the safeguards already in place and the remaining risk.
- Decision 12: learning-data.js ConMon "Recovery exercise review": "each single-instance platform" → "each platform in the recovery set".
- catalog-data.js and catalog.json had no single-instance text; unchanged. Module ids unchanged; node loads both files: CATALOG 12, LEARNING 12, ARTIFACTS 10.
- Supersedes judgment call 1 above.
