# Secure By Design — Working System Brief

**Record:** SBD-PREP-01  
**System:** Secure By Design · Enterprise Services  
**Stage:** Prepare · Initial planning record

| Topic | Starting position |
| --- | --- |
| Purpose | Support internal project work, applications, and administration with controlled access and recoverable services. |
| Information | Project files, directory identities, application records, security logs, configurations, and backups. |
| Scope | Internal network services in VLANs 10–70, media handling, and offline recovery arrangements; boundary details to review. |
| Transfers | Fully air-gapped. Manual, human-controlled transfers using approved removable media only; no automated connection across the boundary. |
| Control framework | NIST SP 800-53 Revision 5, with SP 800-53B for baseline selection and tailoring. |
| CIA impact levels | Moderate confidentiality, Low integrity, and Low availability (MLL); document the supporting rationale in Categorize. |
| People | Infrastructure lead, support lead, and project representative. Accountable owners and approval authorities still to be named. |
| Risk questions | Misused administrator access, untrusted software transfers, and loss of services or recoverable data. Likelihood and impact still to assess. |
| Shared responsibilities | Identify common control providers, supporting evidence, and the duties retained by the system team. Agree on monitoring ownership and escalation. |
| Open decisions | Media-handling procedures, control tailoring and applicable additional requirements, information ownership, recovery needs, and risk acceptance responsibilities. |
| Next step | Document the information-type analysis and consequences supporting the MLL impact levels. |

## Proposed network areas

- VLAN 10 — Domain controllers: identity and DNS.
- VLAN 20 — Identity & services: addressing, updates, and logs.
- VLAN 30 — PKI infrastructure: certificates and trust.
- VLAN 40 — Servers & data: project files and applications.
- VLAN 50 — Security & monitoring: detection and vulnerability management.
- VLAN 60 — Administrative access: controlled management sessions.
- VLAN 70 — Management tools: configuration and system maintenance.
- Offline backup and recovery arrangements, and controlled media handling.

Logical grouping for the boundary discussion. Allowed traffic and implementation details come later.

## Confirmed architecture decisions

- Transfers across the air gap are manual and human-controlled, using approved removable media. There is no automated transfer path or physical network connection across the boundary.
- The control catalog is NIST SP 800-53 Revision 5. Use SP 800-53B for baseline selection and document tailoring for this environment.
- The original planning diagram's data-diode and Revision 4 annotations are earlier notes; the decisions above replace them.

## Decisions to record during review

- System owner, information owners, and risk acceptance authority:
- Applicable legal, contractual, privacy, and control-baseline requirements:
- Media approval, content checks, transfer records, and handling procedures:
- Common control providers and retained system responsibilities:
- Information inventory, owners, flows, retention, and disposal needs:
- Initial risk assessment and recovery requirements:
- Monitoring owners, review schedule, and escalation rules:
- Reviewed boundary and organizational system inventory reference:
- Review date and next action:

## Guidance

- [NIST Prepare step](https://csrc.nist.gov/projects/risk-management/about-rmf/prepare-step)
- [NIST Prepare FAQs](https://csrc.nist.gov/CSRC/media/Projects/risk-management/documents/01-Prepare%20Step/NIST%20RMF%20Prepare%20Step-FAQs.pdf)
- [NIST SP 800-53 Revision 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

This initial brief records the starting assumptions and open decisions. Supporting inventories, risk assessments, and governance records develop alongside it.
