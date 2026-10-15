# Authorization Workspace

`/authorization-workspace` is where a signed-in learner takes a practice system through an Authorization to Operate (ATO). It models how authorization teams manage an ATO in eMASS (DoD's Enterprise Mission Assurance Support Service) and Telos Xacta 360: a system record, the selected controls, a Body of Evidence, a Plan of Action and Milestones (POA&M), approval chains for each control and for the package, the Authorizing Official's decision, and continuous monitoring. It is an original Secure By Design teaching tool. It is not affiliated with DISA or Telos and copies neither product's screens or branding.

It is the hands-on half of course 2.1 "RMF to ATO" (`/training/rmf/`): each RMF step page in the course links to the matching workspace tab and shows whether that step's workspace check passes (`GET /api/authorization/progress`), and the lifecycle list here links back to the course steps. The capstone runs here, on the network the Build the Network courses create.

## What the learner does

| Tab | Seat | What happens |
| --- | --- | --- |
| Overview | — | RMF lifecycle progress (Prepare → Monitor), counts, monitoring alerts, and the next reviewer checks |
| System | ISSO with the system owner | Identity, description, authorization boundary, interconnections, the five roles, information types (SP 800-60) and categorization with its rationale |
| Controls | ISSO | Select controls (search, the capstone's nine, or an SP 800-53B baseline), record the selection rationale, write implementation statements, choose inheritance from a common control provider, and submit each control to the assessor |
| Assessment | Security control assessor | Record Satisfied / Other than satisfied / Not applicable for every SP 800-53A objective, then validate the control or return it to the ISSO |
| Evidence | ISSO, then the assessor | Body of Evidence entries linked to controls (title, type, date, version, description, excerpt, where the full record is kept); the assessor accepts or rejects. Three required package documents: authorization boundary diagram, hardware and software inventory, and ports, protocols and services |
| POA&M | ISSO | One item per weakness: control, source, severity (CAT I/II/III), residual risk, mitigations, resources, point of contact, scheduled completion, milestones; CSV export with eMASS-style columns |
| Package | ISSM | Package type, executive summary, assessment report summary, live readiness checks, submission through the chain, decision history, and generated documents (SSP, SAR, Body of Evidence index, decision record, control traceability matrix CSV) |
| Monitor | ISSO and ISSM | Termination countdown, conditions, alerts, reassessment schedule, recording a change (sends the affected controls back to the assessor), the annual review, and starting reauthorization |
| History | — | Audit trail of every submission, review, return, decision and change |

The learner plays the ISSO and the assessor. The ISSM review, the assessor's package review and the AO decision are automated with transparent rules, so a learner working alone gets the full chain.

## Approval chains

**Control approval chain.** In progress → (ISSO submits) → With the assessor → (assessor validates) → Assessed, or → Returned for rework with a comment. Submitting needs an implementation statement, a responsible role, and linked evidence (or, for a Planned control, a POA&M item; for Not applicable, a justification). Fully inherited controls complete on submission because their provider assesses them. Changing a submitted or assessed control's implementation sends it back to In progress; changing assessed results sends it back to the assessor.

**Package approval chain.** ISSM (you) submits → ISSM review → assessor review → Authorizing Official. Each review returns the package with its failed checks as comments; the package keeps its summaries and is resubmitted after fixes.

## Rules (`lib/authorization/model.mjs`)

The server (authoritative) and the page (readiness checks) import the same module, so what the learner sees before submitting is what the reviewers apply.

ISSM review: every role named; the assessor is someone other than the ISSO and system owner (CA-2(1)); description and boundary written; categorization set with information types, a rationale, and no objective below its information types' high-water mark; the selection justified; every control submitted; every Implemented or Hybrid control has accepted evidence; the three package documents accepted; inherited controls rely on current provider assurance; every open POA&M item complete; executive summary written.

Assessor review: every control assessed; every result recorded and every Other than satisfied explained; every non-compliant control has an open POA&M item; accepted evidence is less than a year old; the assessment summary written.

AO decision (practice rules): an open CAT I, or very high residual risk, is a Denial of Authorization to Operate; open CAT II and CAT III items become the conditions of an ATO with conditions; no open items earns an ATO; an IATT package gets an Interim Authorization to Test. Risk acceptance requests are accepted for CAT III, or CAT II with mitigations and residual risk no higher than moderate, and declined for CAT I. Practice terms: ATO 3 years, ATO with conditions 365 days, IATT 90 days. The page says plainly that a real AO weighs mission need and the organization's risk tolerance within their own authority, and the generated decision record says it carries no authority.

Common control providers (`PROVIDERS`): SBD Facilities & Physical Security (PE), SBD Security Governance Office (the -1 policy controls, AT-2/3/4, PL-4) and SBD Personnel Security (PS-2 to PS-9). Validity is counted from the day the system is registered; Personnel Security's has lapsed on purpose, so inheriting from it is flagged until the learner requests current assurance (the RMF course's expired-inheritance question).

## Data

D1 tables from `drizzle/0014_authorization_workspace.sql`: `auth_systems` (profile and current decision as JSON), `auth_controls`, `auth_artifacts`, `auth_poam`, `auth_packages` (review, decision and a snapshot as JSON) and `auth_history`. Every row hangs off a system that belongs to one account; every API route checks that ownership. Limits per account and system: 5 systems, 400 controls, 300 evidence entries, 300 POA&M items; history shows the latest 300 entries. Deleting a system or the account removes everything (`server/account-deletion.js`); the foreign keys also cascade.

There is no file storage (the Worker has no R2 bucket): evidence entries hold a description, an excerpt of up to 20,000 characters and where the full record is kept. The page asks learners to use practice data only.

## API (`server/authorization.js`)

All under `/api/authorization`, JSON, the reader session cookie, and same-origin checks on writes. `GET /` lists systems (or `{user:null}` signed out). `POST /systems` registers one from a template (`sbd-enclave` or `blank`). `GET|PATCH|DELETE /systems/:id`. Controls: `POST /systems/:id/controls`, `PATCH|DELETE …/controls/:control`, `POST …/controls/:control/submit|validate|return`, `PUT …/controls/:control/results`. `POST …/providers/:provider/renew`. Evidence: `POST …/artifacts`, `PATCH|DELETE …/artifacts/:id`, `POST …/artifacts/:id/submit|review`. POA&M: `POST …/poam`, `PATCH|DELETE …/poam/:id`. Package: `PUT …/package`, `POST …/package/submit`. Monitoring: `POST …/changes`, `POST …/annual-review`. Every write returns the system's full state.

## Control catalog

`scripts/build-control-catalog.py` builds the catalog from NIST's OSCAL content (github.com/usnistgov/oscal-content, `nist.gov/SP800-53/rev5/json`: the Rev. 5 catalog and the LOW/MODERATE/HIGH baseline profiles):

- `public/authorization-workspace/controls-rev5.json`: every active control and enhancement with its statement and SP 800-53A objectives, parameters shown as `[Assignment: …]` / `[Selection: …]`. About 850 KB (115 KB compressed); the page loads it only when control text is shown.
- `content/authorization/control-index.json`: id → title, family, baselines and objective ids, bundled for validation and search.

To refresh after NIST updates the catalog: clone or download that folder, run `python3 scripts/build-control-catalog.py <folder>`, and run `node --test tests/authorization.test.mjs`.

## Tests

`tests/authorization.test.mjs` covers the catalog, signed-out access, ownership and origin checks, limits, the control approval chain, an ATO with conditions, a denial for CAT I followed by remediation and a full ATO, risk acceptance decisions, the ISSM's independence, categorization and inheritance checks, monitoring alerts, and deletion with the system and the account.

## One registration per system

An account keeps one Secure By Design enclave (`once: true` on its template in `lib/authorization/model.mjs`), and no two of its systems share a name (compared ignoring case and spacing). The server checks both before registering, and `auth_systems.registration_key` (`'sbd-enclave'` for the enclave, NULL for blank systems) has a unique index on (`account_id`, `registration_key`), so two requests sent together cannot both create an enclave. Once the enclave exists, the page shows it as already added with a button to open it, and ignores a second tap while a registration is in flight. Deleting the enclave frees the key. Migration `drizzle/0015_auth_one_enclave.sql` removed duplicate enclaves made before this rule if nothing was ever saved in them; a duplicate someone worked on was kept, without the key, for them to review or delete.
