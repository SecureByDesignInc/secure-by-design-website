# Course 1.11 audit-repository: audit (14 October 2026)

Five lessons, 160 minutes (2.7 h). Lesson ids, counts, minutes and quiz keys are unchanged. The validator passes.

## Fixed

- **repository-design step 4** (1.8 audit, decisions "Audit groups"):
  - The step no longer creates SBD Audit Custodians. It reuses course 1.8's group and creates only SBD Auditors, in the Groups OU.
  - SBD Auditors is added to SBD-ADMIN-SRV01's seat GPO (Allow log on locally, beside SBD Tier 1 Admins and SBD Audit Custodians), and the change to the STIG value is noted in 1.8's exception record. Without this, "SBD Auditors read … from SBD-ADMIN-SRV01" was refused at sign-in.
  - The step title in the guide was updated to match.
- **repository-design step 5**:
  - "course 1.8's server-tier logon GPOs" now names 1.8's two deny GPOs (the tier logon GPO and the network-logon deny GPO), and says the Servers administrators GPO never goes there.
  - Added the time rule: hypervisor time sync off, and `w32tm /query /source` must name a DC.
- **repository-design command and check**: they now show the SBD Auditors group and the time source.
- **prerequisites[1]**: hypervisor time sync is turned off.
- **prerequisites[2]**: names SBD Audit Custodians from course 1.8. The first baseline uses the Tier 1 SCC copy that course 1.8 installed on SBD-ADMIN-SRV01 (rule 5), not loose course 1.4 media. This resolves the draft's own "unsure" note.
- **protect step 3** (rule 1): "VLAN 50 will also hold SBD-SPLUNK01, SBD-NESSUS01, and SBD-EPO01" now reads "SBD-SPLUNK01 (course 1.12) and the other security servers Inside the Network places there". The firewall reasoning is unchanged.
- **protect step 4, integrity step 3** (1.8 audit): the exception-record rows go to the record's owner on AdminJumpBox01.
- **integrity step 4** (rule 4): course 1.10 now forwards the whole Security log of every SBD Event Sources member, so 4656, 4660, 4663, 4670 and 5145 arrive without a separate query. The step adds only the Application-log query for the SBD-Repository events, filtered to SBD-AUDIT01. Enrolment uses 1.10's security-filtered GPO, linked to the Audit Servers OU.
- **repository-prove step 4**:
  - SCC arrives from SBD-ADMIN-SRV01's 1.8 copy over PowerShell remoting, and its hash is checked.
  - The classification now quotes course 1.4's values exactly: fix by GPO, deviation candidate, POA&M candidate.
- **guide**: the AdminJumpBox01 node said "the custodian and auditor groups"; it now says the SBD Auditors group and its seat sign-in right.

## Checked, no change needed

- **Numbering**: every reference is right — 1.10, 1.12, 1.13, 1.19, 2.2 (Body of Evidence), and in-course lessons 2–5. The superseded numbers in notes.md were already fixed in the JSON.
- **NIST titles**: AU-4, AU-9, SI-7 and AU-11 are exact, and AU-9(5) is used in text only.
- **Model links**: `system=audit`, `process=logs&step=4` (SYSLOG01 → AUDIT01) and `facility=backup` exist. A04 is the fourth `adminMatrix` row (audit custody from jump1, with independent approval). F11 and F17 match.
- **Facts**:
  - The KDS root key: up to a 10-hour wait, `-EffectiveImmediately`, and one key per forest.
  - `New-ADServiceAccount` with `-PrincipalsAllowedToRetrieveManagedPassword`. The gMSA names fit within 15 characters.
  - The icacls codes (WD, RA, S, DE, RC, OI, IO) and Owner Rights S-1-3-4.
  - `New-SmbShare -EncryptData`, and that RejectUnencryptedAccess defaults to true.
  - User rights don't merge across GPOs.
  - Audit File System writes only where SACLs match (checked on the Learn page).
  - The `wevtutil epl` timediff query, and that `Get-FileHash` defaults to SHA-256.
- **Enrolment timing**: SBD-AUDIT01 joins SBD Event Sources in lesson 3, not in the closing lesson (rule 4), because lesson 5's off-box proof depends on it. Lesson 5 then confirms it.
- **Sources**: all are on learn.microsoft.com, www.cyber.mil or csrc.nist.gov, and match what they're cited for.

## Judgment calls for the owner

1. **Create-without-delete for the writer.** SBD-Archive$ gets only (WD,RA,S) on each stream folder. `Copy-Item` may still fail on a metadata call after the file is created. Options:
   - test it in a lab and keep (WD,RA,S);
   - add WA (write attributes) on files only;
   - have the script write with .NET FileStream, which skips the metadata calls.

   Recommendation: lab-test before publishing. If it fails, add WA on files only, which still allows no delete or overwrite.
2. **Day-based export versus a record-ID high-water mark.** Archives cover completed UTC days by TimeCreated, and late events are caught by `-r1` re-exports after a gap. This is simple and auditable, but it relies on the gap window being recorded (1.10's health check). Recommendation: keep it.
3. **SBD Auditors on SBD-ADMIN-SRV01.** This adds a read-only role to a Tier 1 seat's local sign-in right, as decisions.md requires. If the owner would rather keep the seat to two groups, the alternative is for the custodians to produce read copies for auditors. That weakens the separation between custodian and auditor. Recommendation: keep it as written.

## For other courses

- **splunk-analysis (1.12) `analyze` step 4**: "as course 1.11 added SBD-AUDIT01's" now refers to the Application-log query for SBD-Repository events only. The Security IDs 4656, 4660, 4663, 4670 and 5145 arrive with 1.10's Security query.
- **business-services (1.18)**: if it creates gMSAs, say "the KDS root key from course 1.11" and run `Get-KdsRootKey`. Never run `Add-KdsRootKey` again (decisions rule 6). The current draft doesn't mention KDS.
- **harden-baseline (1.5) exception record** (via its owner): the documented additions from this course are batch-logon rights for SBD-Archive$ (SBD-SYSLOG01) and for SBD-Catalog$ and SBD-Retention$ (Audit Servers OU), object-access auditing on SBD-AUDIT01, and the SBD Auditors entry in SBD-ADMIN-SRV01's Allow log on locally.
- **prove-recovery (1.19)**: the custodians hold read only on `D:\LogArchive`, so they can copy archives to media but never delete them. The catalog (`D:\LogArchive\Catalog\catalog.csv` and the verify reports) travels with the archives.
