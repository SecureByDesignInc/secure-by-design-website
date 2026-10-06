export const evidenceGuidePath = '/rmf-series';

export const jsigSource = 'https://www.dcsa.mil/Portals/69/documents/io/rmf/JSIG_2016April11_Final_(53Rev4).pdf';
export const handbookSource = 'https://www.dcsa.mil/Portals/91/Documents/CTP/special/DoD_SAP_PM_Handbook_JSIG_RMF_2015Aug11.pdf';
export const prepareSource = 'https://csrc.nist.gov/projects/risk-management/about-rmf/prepare-step';

// These are lifecycle summaries, not a Revision 4-to-5 control crosswalk.
export const evidencePhases = [
  {
    slug: 'prepare', name: 'Prepare', step: null,
    purpose: 'Get the mission, boundaries, and responsibilities straight before deciding what protection the system needs.',
    outputs: [
      'Mission and stakeholder records; assigned responsibilities.',
      'Information and asset inventories; an initial authorization boundary.',
      'Risk priorities, requirements, and potential common control providers.',
    ],
    responsibility: 'The system owner works with information owners, security staff, and control providers. Organization-level preparation sets the risk strategy and responsibilities they work within.',
    maintain: 'Revisit these records when the mission, information, people, or dependencies change. Carry them into the system description and categorization analysis.',
    application: 'Clearly define the scope, responsibilities, and processes needed to support the work.',
    reference: 'NIST SP 800-37 Rev. 2 · Prepare',
    source: prepareSource,
  },
  {
    slug: 'categorize', name: 'Categorize', step: 1,
    purpose: 'Describe the system and make the impact of losing confidentiality, integrity, or availability explainable.',
    outputs: [
      'Draft System Security Plan (SSP), including the system description and boundary.',
      'System registration with the appropriate SAP authority.',
      'Categorization analysis and applicable overlay considerations; an early Risk Assessment Report (RAR) is recommended.',
    ],
    responsibility: 'The information system owner (ISO) and information owner propose the impact levels. The security control assessor (SCA) reviews the rationale; the authorizing official (AO) approves the categorization.',
    maintain: 'Reconcile the SSP, inventories, information types, and boundary whenever the scope or mission impact changes. Keep the rationale and approval with the category.',
    application: 'Secure By Design starts at Moderate confidentiality, Low integrity, and Low availability (MLL). Document why each level fits; the three letters alone do not explain the decision.',
    reference: 'JSIG section 2.3.1, pages 2-30 through 2-33',
    source: jsigSource + '#page=30',
  },
  {
    slug: 'select', name: 'Select', step: 2,
    purpose: 'Agree on the controls, who provides them, and how their effectiveness will be monitored.',
    outputs: [
      'Updated and approved draft SSP with its Security Controls Traceability Matrix (SCTM).',
      'Draft RAR.',
      'Documented Continuous Monitoring (ConMon) Plan or Strategy.',
    ],
    responsibility: 'The ISO coordinates with security managers or officers (ISSM/ISSO), security engineers (ISSE), and common control providers. The AO, SCA, or AO designee reviews the plan; baseline exceptions require AO approval.',
    maintain: 'Keep control allocation, inheritance, parameters, tailoring rationale, and approvals together. Update them when a requirement, provider, or assigned responsibility changes.',
    application: 'Keep Secure By Design’s Revision 5 selection separate from the 2016 JSIG baseline. For a SAP system, establish the applicable CNSSI 1253 selection, overlays, and AO direction; an SP 800-53B Moderate baseline alone is not a JSIG baseline.',
    reference: 'JSIG section 2.3.2, pages 2-33 through 2-35',
    source: jsigSource + '#page=33',
  },
  {
    slug: 'implement', name: 'Implement', step: 3,
    purpose: 'Put the controls into operation, then describe what was actually built and how it works.',
    outputs: [
      'Updated SSP/SCTM with functional implementation descriptions.',
      'Supporting implementation evidence, such as approved procedures, configuration records, and scoped exports.',
    ],
    responsibility: 'The ISO is accountable, with the ISSE and the people implementing each control. Common control providers supply the information needed to describe inherited protection.',
    maintain: 'Update the implementation description after changes. Keep the approved configuration, observed settings, responsible person, and collection context aligned so an assessor can evaluate the same system the plan describes.',
    application: 'For a manual transfer process, retain the approved procedure, media inventory, transfer records, and content-check results. These support assessment; they do not establish effectiveness by themselves.',
    reference: 'JSIG section 2.3.3, page 2-35',
    source: jsigSource + '#page=35',
  },
  {
    slug: 'assess', name: 'Assess', step: 4,
    purpose: 'Use agreed procedures to determine whether the controls work, and record what the evidence actually supports.',
    outputs: [
      'Security Assessment Plan, reviewed and approved by the SCA.',
      'Security Assessment Report (SAR) with findings and recommendations.',
      'Updated RAR and SSP; assessment and reassessment evidence.',
    ],
    responsibility: 'The ISO and security staff develop the assessment plan. The SCA approves it; assessors perform the work and document results. Control owners address weaknesses, with reassessment as appropriate.',
    maintain: 'Tie findings to the assessment objective, evidence, scope, and result. Add retest results after remediation, preserve the original assessment results, and correct the SSP to match the implementation.',
    application: 'A transfer log can show that a transfer was recorded. A scoped assessment must also check the approvals, handling steps, and required checks behind that entry.',
    reference: 'JSIG section 2.3.4, pages 2-35 through 2-36',
    source: jsigSource + '#page=35',
  },
  {
    slug: 'authorize', name: 'Authorize', step: 5,
    purpose: 'Give the decision-maker a complete account of the system, its weaknesses, and the risk that remains.',
    outputs: [
      'Plan of Action and Milestones (POA&M).',
      'Security authorization package: SSP, including SCTM, ConMon Plan/Strategy, and RAR; SAR; and POA&M.',
      'Authorization decision document, issued after review, with its outcome, conditions, and duration.',
    ],
    responsibility: 'The ISO verifies and submits the package and maintains the POA&M. The AO determines whether the risk is acceptable and issues the decision.',
    maintain: 'Track the exact package version reviewed, unresolved findings, corrective actions, resources, and milestones. Retain the decision and its conditions. New evidence or changed risk can require another decision.',
    application: 'An assessment report is not permission to operate. Outcomes include Authorization to Operate (ATO), Interim Authorization to Test (IATT), or Denial of Authorization to Operate (DATO).',
    reference: 'JSIG section 2.3.5, pages 2-36 through 2-38',
    source: jsigSource + '#page=36',
  },
  {
    slug: 'monitor', name: 'Monitor', step: 6,
    purpose: 'Keep the risk picture current as the system, its controls, and its operating environment change.',
    outputs: [
      'Periodic ConMon deliverables and security status reports.',
      'Updated SSP/SCTM, SAR, POA&M, RAR, and monitoring information as the work changes.',
      'Updated authorization when appropriate; decommissioning and record-retention documentation when the system leaves service.',
    ],
    responsibility: 'The ISO keeps records and status reporting current. Control owners and providers supply results; assessors evaluate affected controls; the AO or designee reviews whether the risk remains acceptable.',
    maintain: 'Follow the approved monitoring strategy and event triggers. Document change impacts, reassess where needed, track corrective actions, and preserve earlier information needed for oversight and audit. Record destruction follows an AO-approved retention plan.',
    application: 'Air-gapped does not mean unchanging. A manually imported software update can change the configuration baseline, assessment evidence, and risk analysis. Record the transfer and follow the change process.',
    reference: 'JSIG section 2.3.6, pages 2-38 through 2-40',
    source: jsigSource + '#page=38',
  },
];

// Retired article addresses resolve to the relevant part of the consolidated guide.
export const retiredEvidenceAnchors: Record<string, string> = {
  'system-context': 'prepare',
  boundary: 'categorize',
  categorization: 'categorize',
  'control-matrix': 'select',
  ssp: 'implement',
  'identity-evidence': 'implement',
  configuration: 'implement',
  sap: 'assess',
  sar: 'assess',
  poam: 'authorize',
  decision: 'authorize',
  monitoring: 'monitor',
};
