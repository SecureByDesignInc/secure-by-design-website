# Patch, protect, and watch for weakness — configuration checklist

Secure By Design · Edition 1.1 · 7 October 2026

Wave 5 keeps the proven state from drifting: updates and software arrive only through controlled channels, every endpoint runs managed protection, and a credentialed scanner turns the course 1.3 cadence into routine. In an air-gapped lab, every one of these systems feeds on content carried across the boundary — which is the recurring lesson.

## Before you start

- [ ] Complete course 1.9: the fleet exists, inventoried and reporting into the logging pipeline.
- [ ] Provision SBD-WSUS01 (10.0.20.30), SBD-REPO01 (10.0.70.20, Linux), SBD-MGMT01 (10.0.70.10), SBD-EPO01 (10.0.50.30), and SBD-NESSUS01 (10.0.50.20) per the model's placements.
- [ ] Keep the approved-media process ready: update content, package mirrors, protection definitions, and scanner plugins all cross the air gap the same reviewed, hashed way.

## Design the rings and the software rules

- [ ] Define three rings and their order: a pilot ring (the course 1.9 sample machines plus one member server), the broad ring (fleet and member servers), and the critical ring last (domain controllers and both VLAN 30 hosts) — updates earn their way up, never down.
- [ ] Write the software rule: Windows updates come only from SBD-WSUS01, Linux packages only from SBD-REPO01, protection definitions only through SBD-EPO01, and anything else arrives as a documented exception — one source per type is what makes 'unauthorized software' a checkable claim.
- [ ] Decide the air-gap feeding cadence: what content crosses on media, how often, hashed by whom — the course 1.3 transfer procedure, now on a schedule.
- [ ] Add the register rows: every Windows system to WSUS (8530/8531), domain controllers included, Linux consumers to REPO01 (HTTP), agent-to-ePO and ePO-to-agent ports per the product's documentation, and the scanner's credentialed reach into each VLAN — the one deliberate wide permit, owned and logged.

**Verify:** The ring table names every system's ring, the one-source rule and feeding cadence are written, and the register carries the wave's rows with owners.

**Evidence:** Keep the ring assignments, the software source rules, the feeding cadence, and the new register rows.

Notes / result / date: __________________________

## Build SBD-WSUS01 and the ring policies

- [ ] Install the WSUS role on SBD-WSUS01, scope its products and classifications to what the network actually runs — Windows Server 2025, Windows 11, and defender definitions — and nothing speculative.
- [ ] Feed it offline: export the needed content on the connected side, hash it, carry it across, and import — the WSUS offline servicing path is the course 1.3 media procedure wearing an update hat.
- [ ] Create WSUS computer groups matching the rings, and link ring GPOs at the OUs: update source SBD-WSUS01, the ring's group assignment, and install/restart windows that respect what each ring does for a living.
- [ ] Approve one update cycle for the pilot ring only, watch it install and report, then promote the approval ring by ring — the critical ring installs only what two rings already survived. Pilot and broad-ring approvals are Tier 1 work from SBD-ADMIN-SRV01; critical-ring approvals for the domain controllers are Tier 0 work from AdminJumpBox01.

**Verify:** Every system reports to its ring's group, the pilot ring installed and reported the first approved cycle, and the promotion to later rings followed the written order.

**Evidence:** Record the product scope, the offline import with hashes, the ring GPO reports, and the first cycle's per-ring approval and install timeline.

Notes / result / date: __________________________

## Build SBD-REPO01 for approved packages

- [ ] Build SBD-REPO01 per your Linux platform plan and serve a repository directory over HTTP at 10.0.70.20 — the register row from lesson 1 already permits the path from its consumers.
- [ ] Mirror the approved package set on the connected side, hash the set, carry it across, and verify before publishing — same ceremony, different payload; record the repository's snapshot date as its version.
- [ ] Configure each Linux consumer (the analysis platform's host if Linux, the scanner appliance's feeds where applicable) to use only the internal repository — remove or disable every external source definition so the one-source rule is configuration, not convention.
- [ ] Document the repository's own administration under the tier model — managed from VLAN 60, changes recorded — and its assessable record: the hashed snapshot catalog, like the router's config export.

**Verify:** The repository answers on its registered path, consumers list the internal source and only the internal source, and the snapshot catalog with hashes is filed.

**Evidence:** Keep the snapshot date and hash catalog, the consumer source listings, and the repository's administration record.

Notes / result / date: __________________________

## SBD-MGMT01 and the living inventory

- [ ] Build SBD-MGMT01 in the Servers OU, administered from VLAN 60 per the tier rules, with your chosen configuration and inventory tooling — the record matters more than the brand.
- [ ] Load the inventory with every system the network now has — the 1.9 fleet list, the servers, the admin plane, the router — each with its OU, VLAN, address, ring, software sources, and scan status: the CM-8 component inventory, in one place.
- [ ] Define currency: joins and retirements update the inventory as part of their process, and a monthly reconciliation compares the inventory against the directory and the DHCP leases — drift between them is a finding.
- [ ] Name the owner and file the inventory's first reconciliation as evidence; course 2.2 will cite this record directly for the configuration-management controls.

**Verify:** The inventory lists every modeled system with its attributes, the first directory-and-DHCP reconciliation matches (or its mismatches are findings), and ownership and cadence are written.

**Evidence:** Keep the populated inventory export, the reconciliation record, and the ownership and cadence note.

Notes / result / date: __________________________

## Endpoint protection through SBD-EPO01

- [ ] Build SBD-EPO01 in VLAN 50, fed its definitions through the offline process on the lesson-1 cadence, with its console reachable only from the admin plane — the register rows from lesson 1 carry agent traffic both ways.
- [ ] Deploy agents to the pilot ring first, confirm check-ins, then follow the ring order through the fleet and member servers — the same earn-your-way-up discipline as updates. Agent policy for the domain controllers is a Tier 0 scope in ePO, changed only from AdminJumpBox01 with a Tier 0 account.
- [ ] Apply the policy baseline: on-access protection, the scan schedule, and the data-loss-prevention policy scoped to what the model's DLP role calls for — each setting a decision in the record, not a default accepted silently.
- [ ] Verify coverage against the living inventory — every endpoint present and checking in — and forward the server's threat events into the course 1.8 pipeline so detections land beside everything else; a standard test file makes the whole path fire once, on record.

**Verify:** Every inventoried endpoint shows a checking-in agent, the policy baseline is applied and recorded, and a test detection traveled from endpoint to console to the analyst's search.

**Evidence:** Keep the coverage-vs-inventory comparison, the policy baseline record, and the traced test detection.

Notes / result / date: __________________________

## SBD-NESSUS01 and the standing cadence

- [ ] Build SBD-NESSUS01 in VLAN 50, plugins fed on the offline cadence, with dedicated scan accounts — least privilege for credentialed checks, its use logged, its register row the deliberate wide permit from lesson 1. The account that scans the domain controllers is a Tier 0 credential, kept apart from the member-server scan account and used only for DC scan jobs.
- [ ] Run the first credentialed scan VLAN by VLAN against the inventory, and triage like the course 1.3 rescan taught: every finding becomes fix-now, documented deviation, or POA&M candidate — never unexplained.
- [ ] Wire results outward: findings into the analysis pipeline for trending, the triage into the living exception record, and the scan schedule into the cadence — quarterly with the DISA cycle, plus change-triggered, now automated enough to keep.
- [ ] Close wave 5's own books: baselines for WSUS01, REPO01 (config-export pattern), MGMT01, EPO01, and NESSUS01, rescans where agents and policies changed existing systems, and the handoff — the network now sustains itself; wave 6 finally gives it something to serve.

**Verify:** The credentialed scan covered the inventory with the scan account's use logged, every finding is classified, results and schedule are wired into pipeline and cadence, and the wave's baselines and rescans are filed.

**Evidence:** Keep the scan summary with its triage, the scan-account and register records, the cadence entry, and the wave's scan set.

Notes / result / date: __________________________
