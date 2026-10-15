window.CATALOG = [
  {
    "id": "01",
    "title": "RMF and authorization fundamentals",
    "phase": "Foundations",
    "hours": "1",
    "outcome": "Explain the relationship between the RMF lifecycle, the Body of Evidence, the authorization package, and the authorization decision.",
    "lessons": [
      "01.1 Risk and mission impact",
      "01.2 Roles and accountability",
      "01.3 How the package fits together"
    ],
    "build": "Create a role map for the system owner, ISSM, ISSO, engineers, control assessor, common control provider, and Authorizing Official (AO). Identify applicable privacy responsibilities.",
    "prove": "Given a missing test result and an unresolved risk, identify who supplies evidence, who assesses it, and who has authority to accept the risk.",
    "sources": "[1]"
  },
  {
    "id": "02",
    "title": "Prepare and define the system",
    "phase": "Prepare",
    "hours": "1.5",
    "outcome": "Establish what is being authorized, why it exists, and which organizational and system preparation decisions must be made before documentation expands.",
    "lessons": [
      "02.1 Mission and stakeholders",
      "02.2 Boundary and data flows",
      "02.3 Governance and inherited services"
    ],
    "build": "Draft a mission statement, boundary diagram, asset list, data flow narrative, stakeholder register, and assumptions log. Record the governing authority, approved standards, overlays, and review expectations. Check each information flow in your narrative against the connection map in Inside the Network, which shows every permitted, pending, and denied rule for a system.",
    "prove": "Explain whether a shared service, hypervisor, management path, or offline update transfer is inside the boundary, external, or inherited, and identify supporting responsibility evidence.",
    "model": {"title": "Check the information flows", "text": "Open any system in Inside the Network and choose Show in 3D to draw every rule that names it: solid green for permitted, dashed amber for pending, dashed red for denied. Use it to test your data flow narrative and boundary diagram.", "href": "/inside-the-network#system=web", "label": "Open SBD-WEB01's connection map"},
    "sources": "[1,5,6]"
  },
  {
    "id": "03",
    "title": "Categorize information and impacts",
    "phase": "Categorize",
    "hours": "1.5",
    "outcome": "Justify confidentiality, integrity, and availability impacts using information types and mission consequences. Treat privacy applicability as an explicit decision.",
    "lessons": [
      "03.1 Information types and impact",
      "03.2 Categorization rationale",
      "03.3 Federal and national security contexts"
    ],
    "build": "Prepare a categorization worksheet with information types, impact rationale, mission dependencies, approval routing, and privacy considerations. Document the methodology required by the system’s authority.",
    "prove": "Defend a changed availability impact after a new mission dependency. Explain why an air gap alone does not establish a low impact level or eliminate risk.",
    "sources": "[1,4,5]"
  },
  {
    "id": "04",
    "title": "Select and tailor controls",
    "phase": "Select",
    "hours": "2",
    "outcome": "Translate the approved categorization and applicable requirements into a justified, assignable control set. Distinguish the control catalog from a selected baseline.",
    "lessons": [
      "04.1 Baselines and overlays",
      "04.2 Tailoring and parameters",
      "04.3 Ownership and inheritance"
    ],
    "build": "Start a Security Control Traceability Matrix (SCTM). Record control revision, applicability, tailoring rationale, organization-defined parameters, owner, and system-specific, common, or hybrid allocation.",
    "prove": "Resolve a proposed not-applicable control and an inherited-control claim using evidence and the required approval path. Pin the selected control and assessment-procedure versions.",
    "sources": "[2,3,4]"
  },
  {
    "id": "05",
    "title": "Write the system security plan",
    "phase": "Implement documentation",
    "hours": "2",
    "outcome": "Write a System Security Plan (SSP) that describes the actual system and explains how selected controls are implemented.",
    "lessons": [
      "05.1 System description and environment",
      "05.2 Implementation statements",
      "05.3 Policies and supporting plans"
    ],
    "build": "Draft SSP sections for the boundary, system components, roles, and selected controls. Write statements covering who performs the activity, what happens, where it occurs, when it happens, and the supporting evidence.",
    "prove": "Replace a vague “compliant with policy” statement with a specific implementation narrative. Reconcile it with the diagrams, inventory, and inheritance record.",
    "sources": "[1,2]"
  },
  {
    "id": "06",
    "title": "Connect implementation to proof",
    "phase": "Implement and validate",
    "hours": "2",
    "outcome": "Collect technical and operational evidence that addresses the selected requirement and can support an assessment.",
    "lessons": [
      "06.1 Configuration and STIG evidence",
      "06.2 Security operations evidence",
      "06.3 Coverage and evidence limitations"
    ],
    "build": "Collect configuration exports, a reviewed hardening checklist, scan coverage, log review records, and a recovery-test result. Use the practice network's SCAP Compliance Checker results, STIG Viewer checklists, Splunk review records, and course 1.19 restore record, or equivalent supplied training records.",
    "prove": "Explain what each item proves and leaves untested. Identify a scan that missed an in-scope host, an unreviewed alert, and a configuration screenshot that lacks system or time context.",
    "sources": "[2,3]"
  },
  {
    "id": "07",
    "title": "Organize the Body of Evidence",
    "phase": "Evidence management",
    "hours": "1.5",
    "outcome": "Make evidence easy to retrieve, trace, and maintain across system changes and assessment cycles.",
    "lessons": [
      "07.1 Evidence index and identifiers",
      "07.2 Control traceability",
      "07.3 Currency and version control"
    ],
    "build": "Create a master evidence index and link each selected control objective to the implementation, supporting record, owner, collection date, system scope, document version, and review status.",
    "prove": "Find stale evidence, a missing record, and a mismatch between the SSP and an exported configuration. Record the gap and its effect on the assessment.",
    "sources": "[1,3]"
  },
  {
    "id": "08",
    "title": "Plan and perform assessment",
    "phase": "Assess",
    "hours": "2",
    "outcome": "Turn implementation claims into assessable objectives and distinguish a planned test from an observed result.",
    "lessons": [
      "08.1 Assessment scope and independence",
      "08.2 Examine interview and test",
      "08.3 Findings and assessment reporting"
    ],
    "build": "Draft a Security Assessment Plan with objectives, methods, objects, scope, sampling rationale, responsibilities, and schedule. Execute sample procedures and prepare a Security Assessment Report (SAR) excerpt. Include negative tests: run the six attempts in the Inside the Network attack drill, record each expected and observed result in the Operational verification column of the network traffic matrix, and cite the matrix in your SAR excerpt.",
    "prove": "Link each conclusion to the assessment objective, evidence, actual observation, and limitation. Record unsupported objectives rather than treating a lack of evidence as a successful test.",
    "model": {"title": "Run the attack drill as a negative test", "text": "The drill replays six attempts with known expected results: a PC to SQL, a PC to Splunk management, peer SMB, peer remote desktop, web to SQL, and a stolen admin session to a domain controller. Record what each should do and what you observe in the Operational verification column of the traffic matrix, available from the model's security policy panel.", "href": "/inside-the-network#process=drill", "label": "Open the attack drill"},
    "sources": "[3]"
  },
  {
    "id": "09",
    "title": "Manage findings and residual risk",
    "phase": "Assess and risk response",
    "hours": "1.5",
    "outcome": "Translate weaknesses into mission-relevant risk and an accountable response. Explain the difference between technical severity and contextual risk.",
    "lessons": [
      "09.1 Findings and risk analysis",
      "09.2 Writing an actionable POA&M",
      "09.3 Remediation and verification"
    ],
    "build": "Create a risk analysis record and Plan of Action and Milestones (POA&M) entry with the weakness, affected assets and controls, owner, planned milestones, target dates, resources, status, and closure criteria.",
    "prove": "Prioritize two findings with different exposure and mission impact. Preserve the original result, document remediation, and require verification before claiming closure.",
    "sources": "[1,3]"
  },
  {
    "id": "10",
    "title": "Assemble the authorization package",
    "phase": "Authorize preparation",
    "hours": "2",
    "outcome": "Build a reviewable package whose claims, assessment results, and open risks agree across documents.",
    "lessons": [
      "10.1 Package structure and manifest",
      "10.2 Consistency and readiness review",
      "10.3 Submission workflow"
    ],
    "build": "Assemble an executive summary, security and applicable privacy planning material, assessment reports, POA&M, and required supporting references. Add a versioned manifest and review record.",
    "prove": "Reconcile control identifiers, asset counts, findings, dates, and status across the SSP, SCTM, SAR, and POA&M. Demonstrate a generic eMASS-style record workflow using training data.",
    "sources": "[1,5,7]"
  },
  {
    "id": "11",
    "title": "Present the authorization decision",
    "phase": "Authorize",
    "hours": "1.5",
    "outcome": "Communicate mission need, the assessed security posture, unresolved risk, and proposed risk responses to the decision maker.",
    "lessons": [
      "11.1 Briefing residual risk",
      "11.2 AO review and questions",
      "11.3 Decision and operating conditions"
    ],
    "build": "Prepare a five minute briefing and a fictional decision exercise. Capture the system scope, major risks, recommended actions, conditions, monitoring expectations, and next review triggers.",
    "prove": "Defend one unresolved finding and answer a request for additional evidence. Explain why a complete package or a passing score does not automatically produce an ATO.",
    "sources": "[1,5]"
  },
  {
    "id": "12",
    "title": "Monitor and maintain authorization",
    "phase": "Monitor",
    "hours": "1.5",
    "outcome": "Keep the authorization evidence useful as the system, threats, personnel, and dependencies change.",
    "lessons": [
      "12.1 Monitoring strategy and measures",
      "12.2 Change impact and reassessment",
      "12.3 Updating the package"
    ],
    "build": "Create a monitoring schedule with owners, evidence sources, review frequencies, escalation criteria, and update triggers. Add a change-impact record and an updated package version.",
    "prove": "Process a new server, a missed security update, and a changed common control. Determine what must be revalidated, what artifacts change, and when the AO or designated authority must be engaged.",
    "sources": "[1,2]"
  }
];

// The three Network Authorization courses as the Training Library presents them (content/videos.json);
// the page's learning path groups the modules by these. tests/video-catalog.test.mjs keeps them equal.
window.CATALOG_PARTS = [
  { number: '2.1', title: 'Risk Management Framework', modules: ['01', '02', '03', '04'] },
  { number: '2.2', title: 'Body of Evidence', modules: ['05', '06', '07', '08', '09'] },
  { number: '2.3', title: 'Authorization to Operate', modules: ['10', '11', '12'], capstone: true },
];
