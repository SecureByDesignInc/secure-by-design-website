# Audit: coming-soon stubs 1.16 endpoint-protection and 1.17 vulnerability-scanning

These are catalog.json entries only. Each was checked for the right number and categoryOrder, `comingSoon: true`, an accurate one-sentence description, its systems, and that nothing promises material.

## Fixed

- `vulnerability-scanning/catalog.json` description: "Credentialed vulnerability scanning of every VLAN" → "of the approved target list". Rule F15 scans a named target list (inside-the-network / security.js), not every VLAN.

## Checked without change

- **endpoint-protection.** Number 1.16, categoryOrder 16, `comingSoon: true`. Systems: `SBD-EPO01`. Platform: Windows Server. Network label: VLAN 50. The description matches Inside the Network: a single Trellix ePO + DLP instance, with every Windows agent checking in (F16). It has no outcomes, stages, lessons, guide or downloads.
- **vulnerability-scanning.** Number 1.17, categoryOrder 17, `comingSoon: true`. Systems: `SBD-NESSUS01`. Platform: Linux, matching "Linux, domain-joined". Network label: VLAN 50. It has no outcomes, stages or material.
- **Subtitles and artLabels.** They describe the topic only and make no dated promise.

## Judgment calls for the owner

- None.

## For other courses

- None.
