// The twelve Network Authorization modules, in RMF step order (NIST SP 800-37 Rev. 2 with the April 2016 JSIG mapped in).
// Module ids are stable: saved progress (training:rmf-boe-ato:NN) and links depend on them.
window.CATALOG = [
  {
    "id": "01",
    "title": "RMF roles, steps, and editions",
    "phase": "Foundations",
    "hours": "1",
    "outcome": "Explain who performs, assesses, and approves Risk Management Framework (RMF) work, and how NIST and the Joint Special Access Program Implementation Guide (JSIG) organize its steps and outputs.",
    "lessons": [
      "01.1 Risk and the authorization decision",
      "01.2 Roles and accountability",
      "01.3 NIST, the JSIG, and their editions"
    ],
    "build": "Start the scope record. Map who holds each role for the practice system (system owner or ISO, ISSM, ISSO, ISSE, SCA, CCP, AO, and a PSO if assigned) and mark who performs, assesses, and approves. Record the governing documents and editions, the adopted control release, and privacy responsibilities.",
    "prove": "Given a missing test result and an unresolved risk, identify who supplies the evidence, who assesses it, and who can accept the risk, in NIST and JSIG terms. Then explain why the 2016 JSIG has no Prepare step.",
    "sources": "[1,6,8]",
    "rmf": {
      "step": "Foundations",
      "nist": [],
      "jsig": [],
      "roles": "NIST names roles by function (system owner, control assessor, common control provider, authorizing official); the JSIG uses SAP titles for the same work (ISO, SCA, CCP, AO) alongside the ISSM, ISSO, ISSE, and PSO. In both, only the AO accepts risk.",
      "outputs": [
        "A role map of who performs, assesses, and approves the work, in NIST and JSIG terms (the role assignments NIST covers in Task P-1)",
        "A record of the governing documents and editions: SP 800-37 Revision 2, the April 2016 JSIG or the successor your program directs, and the adopted SP 800-53 release",
        "The scope record, started with those roles and that governing direction"
      ],
      "jsigOutputs": [],
      "difference": "The JSIG of 11 April 2016 follows SP 800-37 Revision 1’s six steps, starting at Categorize, with SP 800-53 Revision 4 and CNSSI 1253 (March 2014). Prepare is the NIST Revision 2 addition. DoDM 5205.07 refers to the JSIG or its successor."
    }
  },
  {
    "id": "02",
    "title": "Define and register the system",
    "phase": "Prepare",
    "hours": "1.5",
    "outcome": "Establish what is being authorized and why: the mission, stakeholders, assets, boundary, information and its life cycle, early risks, and requirements. Then register the system.",
    "lessons": [
      "02.1 Organization and mission",
      "02.2 Assets, boundary, and information",
      "02.3 Risk, requirements, and registration"
    ],
    "build": "Complete the scope record’s Prepare fields for the practice system: mission and stakeholders, assets and boundary, information types and life cycle, the early risk picture, and requirements and allocation. Check each information flow against the connection map in Inside the Network, which shows every permitted, pending, and denied rule for a system. Then fill in the registration record.",
    "prove": "Explain whether a hypervisor host, the core switch’s management, a shared service, or an offline update transfer is inside the boundary, external, or inherited, with the supporting responsibility evidence. Say what changes in the registration if the boundary moves.",
    "sources": "[1,5,6,8]",
    "rmf": {
      "step": "Prepare",
      "nist": [
        [
          "P-1",
          "Risk management roles"
        ],
        [
          "P-2",
          "Risk management strategy"
        ],
        [
          "P-3",
          "Risk assessment—organization"
        ],
        [
          "P-4",
          "Organizationally-tailored baselines and Cybersecurity Framework Profiles (optional)"
        ],
        [
          "P-5",
          "Common control identification"
        ],
        [
          "P-6",
          "Impact-level prioritization (optional)"
        ],
        [
          "P-7",
          "Continuous monitoring strategy—organization"
        ],
        [
          "P-8",
          "Mission or business focus"
        ],
        [
          "P-9",
          "System stakeholders"
        ],
        [
          "P-10",
          "Asset identification"
        ],
        [
          "P-11",
          "Authorization boundary"
        ],
        [
          "P-12",
          "Information types"
        ],
        [
          "P-13",
          "Information life cycle"
        ],
        [
          "P-14",
          "Risk assessment—system"
        ],
        [
          "P-15",
          "Requirements definition"
        ],
        [
          "P-16",
          "Enterprise architecture"
        ],
        [
          "P-17",
          "Requirements allocation"
        ],
        [
          "P-18",
          "System registration"
        ]
      ],
      "jsig": [],
      "roles": "NIST gives the organization-level tasks (P-1 to P-7) to senior leaders and the risk executive function. At the system level, the mission or business owner and the system owner lead, the authorizing official determines the boundary (P-11), and the system owner registers the system (P-18). The 2016 JSIG has no Prepare step, so it assigns no roles here.",
      "outputs": [
        "Mission and stakeholders, recorded in the scope record (P-8, P-9)",
        "An asset list and a documented authorization boundary, with dependencies and candidate common controls (P-10, P-11)",
        "Information types and their life cycle, including every boundary transfer (P-12, P-13)",
        "An early risk picture (P-14), carried into the draft Risk Assessment Report in module 04",
        "Requirements defined, placed in the architecture, and allocated to the system or its environment (P-15 to P-17)",
        "A registered system, recorded in the registration record (P-18)"
      ],
      "jsigOutputs": [],
      "difference": "The 2016 JSIG has no Prepare step; it follows SP 800-37 Revision 1. It describes the system and its boundary (Task 1-2) and registers it (Task 1-3) in Categorize, and drafts its first Risk Assessment Report in Select. NIST does this work in Prepare (P-11, P-14, P-18)."
    },
    "model": {
      "title": "Check the information flows",
      "text": "Open any system in Inside the Network and choose Show in 3D to draw every rule that names it: solid green for permitted, dashed amber for pending, dashed red for denied. Use it to test your boundary and your information life cycle notes.",
      "href": "/inside-the-network#system=web",
      "label": "Open SBD-WEB01's connection map"
    }
  },
  {
    "id": "03",
    "title": "Describe and categorize the system",
    "phase": "Categorize",
    "hours": "1.5",
    "outcome": "Describe the system, justify its confidentiality, integrity, and availability impacts in the draft System Security Plan (SSP), and route the categorization for approval. Treat privacy applicability as an explicit decision.",
    "lessons": [
      "03.1 System description",
      "03.2 Impact and rationale",
      "03.3 Authority, approval, and registration"
    ],
    "build": "Draft the SSP’s system description and security categorization from the scope record: information types, impact rationale, mission dependencies, privacy considerations, and approval routing. Justify the exercise planning input (Moderate confidentiality, Low integrity, Low availability); don’t copy it. Complete the scope record’s categorization basis and confirm the registration follows JSIG Task 1-3.",
    "prove": "Defend a changed availability impact after a new mission dependency, and explain why an air gap alone doesn’t establish a low impact level. Then say who approves the categorization in NIST terms and where the JSIG documents it.",
    "sources": "[1,4,5,8]",
    "rmf": {
      "step": "Categorize",
      "nist": [
        [
          "C-1",
          "System description"
        ],
        [
          "C-2",
          "Security categorization"
        ],
        [
          "C-3",
          "Security categorization review and approval"
        ]
      ],
      "jsig": [
        [
          "1-1",
          "Categorize the system and document the results in the SSP"
        ],
        [
          "1-2",
          "Describe the system, including its boundary, and document it in the SSP"
        ],
        [
          "1-3",
          "Register the system with the appropriate SAP Service/Agency AO or designee"
        ]
      ],
      "roles": "The system owner describes the system (C-1) and categorizes it with the information owner (C-2); the authorizing official or a designated representative approves the categorization (C-3). In the JSIG, the ISO categorizes with the ISSM/ISSO and ISSE (Task 1-1).",
      "outputs": [
        "A documented system description in the draft SSP (C-1; JSIG Task 1-2)",
        "Impact levels for each information type and security objective, with a written rationale (C-2)",
        "The system’s security categorization recorded in the draft SSP (C-2; JSIG Task 1-1)",
        "The categorization routed to the authorizing official or a designated representative for approval (C-3)",
        "The module 02 registration checked against the JSIG route (Task 1-3)"
      ],
      "jsigOutputs": [
        "Draft SSP",
        "System registration"
      ],
      "difference": "NIST registers the system in Prepare (P-18) and describes it here (C-1). The JSIG describes the system and its boundary (Task 1-2) and registers it (Task 1-3) in this step."
    }
  },
  {
    "id": "04",
    "title": "Select controls and plan monitoring",
    "phase": "Select",
    "hours": "2",
    "outcome": "Turn the approved categorization into a selected, tailored, and allocated control set, with a draft Risk Assessment Report and a continuous monitoring strategy, ready for plan review and approval.",
    "lessons": [
      "04.1 Baselines, overlays, and tailoring",
      "04.2 Allocation and the security plan",
      "04.3 Risk, monitoring, and plan approval"
    ],
    "build": "Start the Security Controls Traceability Matrix (SCTM) with each selected control’s adopted revision, source, tailoring rationale, parameters, owner, and system-specific, common, or hybrid allocation. Draft the Risk Assessment Report (RAR) from the module 02 risk picture, write the continuous monitoring strategy, and route the plan for approval.",
    "prove": "Resolve a proposed not-applicable control and an inherited-control claim using evidence and the required approval path. Show which monitoring activity watches each draft RAR risk, and pin the control and assessment-procedure versions.",
    "sources": "[1,2,3,4,8]",
    "rmf": {
      "step": "Select",
      "nist": [
        [
          "S-1",
          "Control selection"
        ],
        [
          "S-2",
          "Control tailoring"
        ],
        [
          "S-3",
          "Control allocation"
        ],
        [
          "S-4",
          "Documentation of planned control implementations"
        ],
        [
          "S-5",
          "Continuous monitoring strategy—system"
        ],
        [
          "S-6",
          "Plan review and approval"
        ]
      ],
      "jsig": [
        [
          "2-1",
          "Identify common controls and document them in a security plan"
        ],
        [
          "2-2",
          "Select the security controls for the information system and document the controls in the security plan"
        ],
        [
          "2-3",
          "Develop a strategy for continuous monitoring of security control effectiveness"
        ],
        [
          "2-4",
          "Review and approve the SSP"
        ]
      ],
      "roles": "The system owner and any common control provider select, tailor, and document the controls and the monitoring strategy (S-1, S-2, S-4, S-5); security architects and the system security officer allocate them (S-3); the authorizing official or a designee approves the plan (S-6). In the JSIG, the ISO does Tasks 2-1 to 2-3 with the ISSE and/or ISSM/ISSO; the AO, SCA, or AO designee approves (2-4).",
      "outputs": [
        "Selected and tailored controls, with parameters and rationale, in the SCTM (S-1, S-2)",
        "Controls allocated to the system, its components, or a common control provider (S-3; JSIG Task 2-1)",
        "Planned implementations documented in the security plan and SCTM (S-4; JSIG Task 2-2)",
        "A draft Risk Assessment Report built from the early risk picture and the planned controls (JSIG Step 2 output)",
        "A system continuous monitoring strategy, including reporting and decommissioning (S-5; JSIG Task 2-3)",
        "The plan routed for review and approval (S-6; JSIG Task 2-4)"
      ],
      "jsigOutputs": [
        "Updated draft SSP/SCTM",
        "Draft Risk Assessment Report (RAR)",
        "Documented Continuous Monitoring (ConMon) Plan/Strategy",
        "Approved draft SSP/SCTM"
      ],
      "difference": "The JSIG produces a draft RAR in this step and updates it in Assess; NIST assesses system risk in Prepare (P-14) and analyzes and determines it in Authorize (R-2)."
    }
  },
  {
    "id": "05",
    "title": "Implement and document the controls",
    "phase": "Implement",
    "hours": "2",
    "outcome": "Implement the selected controls and record them as built in the System Security Plan (SSP) and Security Controls Traceability Matrix (SCTM), in statements an assessor can test.",
    "lessons": [
      "05.1 Implement the approved controls",
      "05.2 As-implemented statements",
      "05.3 Planned work and supporting plans"
    ],
    "build": "Update the SSP that course 2.1 drafted with as-implemented statements for the practice controls (AU-2, AU-3, AU-6, AU-12): who performs each activity, what happens, where, when, and which records show it. Update the matching SCTM rows with implementation status and evidence references, and mark planned work as planned.",
    "prove": "Replace a vague “compliant with policy” statement with a specific as-implemented narrative. Reconcile it with the diagrams, inventory, and inheritance record, and show how you would record a difference between the build and the approved plan.",
    "sources": "[1,2,6,8]",
    "rmf": {
      "step": "Implement",
      "nist": [
        [
          "I-1",
          "Control implementation"
        ],
        [
          "I-2",
          "Update control implementation information"
        ]
      ],
      "jsig": [
        [
          "3-1",
          "Implement the security controls specified in the SSP"
        ],
        [
          "3-2",
          "Document the control implementation in the SCTM portion of the SSP"
        ]
      ],
      "roles": "NIST gives I-1 and I-2 to the system owner and any common control provider, with engineers and security staff supporting. The Joint Special Access Program (SAP) Implementation Guide (JSIG) gives Tasks 3-1 and 3-2 to the Information System Owner (ISO), working with the Information System Security Engineer (ISSE).",
      "outputs": [
        "The controls the Build the Network courses put in place, checked against the approved selection and parameter values (NIST I-1; JSIG 3-1)",
        "As-implemented SSP statements for each practice control: who, what, where, when, and which records (I-2)",
        "SCTM rows updated with implementation status and evidence references (JSIG 3-2, output “Updated SSP/SCTM”)",
        "Planned work and differences from the approved plan recorded, not presented as operating",
        "Supporting plans referenced by owner, version, and review status"
      ],
      "jsigOutputs": [
        "Updated SSP/SCTM"
      ],
      "difference": "The JSIG records the implementation in the SCTM portion of the SSP. NIST updates the security and privacy plans themselves, with as-implemented detail sufficient for an assessor to use."
    }
  },
  {
    "id": "06",
    "title": "Connect implementation to proof",
    "phase": "Implement",
    "hours": "2",
    "outcome": "Collect technical and operational evidence of the as-built system, index it, and correct the SSP and SCTM wherever the evidence and the plan disagree.",
    "lessons": [
      "06.1 Configuration and hardening evidence",
      "06.2 Security operations evidence",
      "06.3 The evidence index and the as-built plan"
    ],
    "build": "Collect configuration exports, reviewed STIG checklists, SCAP Compliance Checker results with their coverage, log review records, and the course 1.19 restore record, or equivalent supplied training records. Start the master evidence index, and correct the SSP and SCTM wherever the evidence shows the system differs from the plan.",
    "prove": "Explain what each item proves and leaves untested. Identify a scan that missed an in-scope host, an unreviewed alert, and a configuration screenshot that lacks system or time context. Record credentialed vulnerability scanning (RA-5) as a limitation: the practice network does not run it yet.",
    "sources": "[1,2,3,8]",
    "rmf": {
      "step": "Implement",
      "nist": [
        [
          "I-1",
          "Control implementation"
        ],
        [
          "I-2",
          "Update control implementation information"
        ]
      ],
      "jsig": [
        [
          "3-1",
          "Implement the security controls specified in the SSP"
        ],
        [
          "3-2",
          "Document the control implementation in the SCTM portion of the SSP"
        ]
      ],
      "roles": "Engineers and administrators produce the records, and common control providers supply evidence for what the system inherits. The system owner (in the JSIG, the ISO with the ISSE) keeps the SSP and SCTM true to that evidence.",
      "outputs": [
        "Configuration evidence with system, scope, version, and collection time: scan results, hardening checklists, exports (I-1)",
        "Operational records that show processes run, such as log reviews and a restore test",
        "A master evidence index giving each record an identifier, owner, date, scope, and version",
        "Coverage gaps and limitations recorded, including credentialed vulnerability scanning not yet available",
        "SSP and SCTM corrected to the as-built state (I-2; JSIG output “Updated SSP/SCTM”)"
      ],
      "jsigOutputs": [
        "Updated SSP/SCTM"
      ],
      "difference": "The JSIG calls the record an assessment rests on the Body of Evidence (BoE): the SSP, test plans, test procedures, test reports, and exceptions. NIST SP 800-37 treats the same material task by task: updated plans (I-2), assessment plans (A-2), assessment evidence (A-3), and assessment reports (A-4)."
    }
  },
  {
    "id": "07",
    "title": "Prepare the assessment",
    "phase": "Assess",
    "hours": "1.5",
    "outcome": "Select an independent assessor, hand over current evidence, and get a Security Assessment Plan approved before any testing starts.",
    "lessons": [
      "07.1 Assessor selection and independence",
      "07.2 The evidence the assessor receives",
      "07.3 The Security Assessment Plan"
    ],
    "build": "Record who selected the assessor and the independence they provide. List the evidence handed over, with versions and known exceptions. Draft a Security Assessment Plan for the practice logging objectives: scope, objectives, methods, objects, sampling rationale, the attack drill’s six attempts as negative tests, responsibilities, schedule, and limits. Record its review and approval.",
    "prove": "Check the handover before approval: find stale evidence, a missing record, and a mismatch between the SSP and an exported configuration, and record each gap’s effect on the plan. Explain why your assessor is independent enough for this system.",
    "sources": "[1,2,3,8]",
    "rmf": {
      "step": "Assess",
      "nist": [
        [
          "A-1",
          "Assessor selection"
        ],
        [
          "A-2",
          "Assessment plan"
        ]
      ],
      "jsig": [
        [
          "4-1",
          "Develop, review, and approve a plan to assess the security controls"
        ]
      ],
      "roles": "The Authorizing Official (AO) or a designated representative selects the assessor (A-1) and, in NIST, approves the plan the assessor develops (A-2). In the JSIG, the ISO develops the plan with the Information System Security Manager (ISSM), Information System Security Officer (ISSO), or ISSE, and the Security Control Assessor (SCA) reviews and approves it (4-1).",
      "outputs": [
        "An assessor or team selected by the AO or designated representative, with the independence required (NIST A-1)",
        "A record of the evidence handed over: SSP, SCTM, evidence index, and known exceptions, with versions",
        "A Security Assessment Plan with scope, objectives, methods, objects, procedures, sampling, schedule, and limits (A-2; JSIG 4-1)",
        "The plan’s review and approval, recorded before testing (JSIG output “Security Assessment Plan”)"
      ],
      "jsigOutputs": [
        "Security Assessment Plan"
      ],
      "difference": "Assessor selection is a separate task only in NIST (A-1). NIST has the assessor develop the plan for the AO’s approval; the JSIG has the ISO’s team develop it and the SCA approve it, and defines it as the SSP, the SCTM, and the Security Control Assessment Procedures."
    }
  },
  {
    "id": "08",
    "title": "Perform and report the assessment",
    "phase": "Assess",
    "hours": "2",
    "outcome": "Assess the controls as planned, report supported findings in a Security Assessment Report (SAR), and remediate and reassess what can be fixed now.",
    "lessons": [
      "08.1 Examine, interview, and test",
      "08.2 The Security Assessment Report",
      "08.3 Initial remediation and reassessment"
    ],
    "build": "Run the procedures in your approved plan and prepare a SAR excerpt. Include negative tests: run the six attempts in the Inside the Network attack drill, record each expected and observed result in the Operational verification column of the network traffic matrix, and cite the matrix in your SAR. Remediate one finding, reassess it, and update the SSP and the Risk Assessment Report (RAR) that course 2.1 drafted.",
    "prove": "Link each conclusion to its objective, evidence, observation, and limitation. Record unsupported objectives as other than satisfied rather than treating missing evidence as a pass, and show a remediated finding still in the report beside its reassessment.",
    "sources": "[1,3,8]",
    "rmf": {
      "step": "Assess",
      "nist": [
        [
          "A-3",
          "Control assessments"
        ],
        [
          "A-4",
          "Assessment reports"
        ],
        [
          "A-5",
          "Remediation actions"
        ]
      ],
      "jsig": [
        [
          "4-2",
          "Assess the security controls per the Security Assessment Plan"
        ],
        [
          "4-3",
          "Prepare the Security Assessment Report (SAR)"
        ],
        [
          "4-4",
          "Conduct initial remediation based on the SAR and reassess remediated controls"
        ]
      ],
      "roles": "The control assessor performs the assessment and writes the report; in the JSIG that is the SCA or an AO designee, and the SCA submits the SAR with a recommended authorization decision. The system owner carries out initial remediation, and the assessor reassesses (A-5).",
      "outputs": [
        "Completed assessments with the observation and evidence for each objective (A-3; JSIG 4-2)",
        "A SAR with results, findings, limitations, and recommendations (A-4; JSIG output “SAR”)",
        "Initial remediation and reassessment, with original findings kept in the updated SAR (A-5; JSIG 4-4)",
        "The SSP updated where an implementation changed (A-5; JSIG output “Updated SSP”)",
        "The Risk Assessment Report (RAR) updated with the risk from confirmed weaknesses (JSIG output “Updated RAR”)"
      ],
      "jsigOutputs": [
        "SAR",
        "Updated RAR",
        "Updated SSP"
      ],
      "difference": "The JSIG updates the RAR here and has the SCA submit the SAR with a recommended authorization decision. NIST assesses system risk in Prepare (P-14) and analyzes and determines it in Authorize (R-2); its assessment report carries findings and recommendations for correcting deficiencies."
    },
    "model": {
      "title": "Run the attack drill as a negative test",
      "text": "The drill replays six attempts with known expected results: a PC to SQL, a PC to Splunk management, peer SMB, peer remote desktop, web to SQL, and a stolen admin session to a domain controller. Record what each should do and what you observe in the Operational verification column of the traffic matrix, available from the model's security policy panel, and cite it in your SAR.",
      "href": "/inside-the-network#process=drill",
      "label": "Open the attack drill"
    }
  },
  {
    "id": "09",
    "title": "Build the plan of action and milestones",
    "phase": "Assess",
    "hours": "1.5",
    "outcome": "Turn the findings still open into a risk-ranked Plan of Action and Milestones (POA&M) with accountable owners, resources, dated milestones, and closure criteria.",
    "lessons": [
      "09.1 From findings to ranked risk",
      "09.2 Writing an actionable POA&M",
      "09.3 Tracking to verified closure"
    ],
    "build": "Rank the findings still open after initial remediation and write a POA&M entry for each: the weakness, affected assets and controls, owner, resources, milestones with target dates, status, and closure criteria tied to reassessment. Link each entry to its SAR finding and the RAR.",
    "prove": "Prioritize two findings with different exposure and mission impact, and defend the order. Explain why a finding fixed and reassessed during the assessment needs no entry, and why an open entry cannot close without a verified reassessment.",
    "sources": "[1,2,8]",
    "rmf": {
      "step": "Assess",
      "nist": [
        [
          "A-6",
          "Plan of action and milestones"
        ]
      ],
      "jsig": [
        [
          "5-1",
          "Initiate and update the POA&M from the SAR’s findings and recommendations"
        ]
      ],
      "roles": "NIST gives A-6 to the system owner and any common control provider. In the JSIG, the ISO initiates and updates the POA&M (5-1), and the AO uses it to monitor progress.",
      "outputs": [
        "A POA&M entry for each finding still open after initial remediation (A-6; JSIG output “POA&M”)",
        "Entries ranked by contextual risk, not technical severity alone",
        "An accountable owner, resources, milestones, and completion dates for each entry",
        "Closure criteria tied to reassessment, linked to the SAR finding and the RAR"
      ],
      "jsigOutputs": [
        "POA&M"
      ],
      "difference": "NIST prepares the POA&M at the end of Assess (A-6); the JSIG initiates it as the first task of Authorize (5-1). Both build it from the assessment report’s findings and recommendations."
    }
  },
  {
    "id": "10",
    "title": "Assemble the authorization package",
    "phase": "Authorize",
    "hours": "2",
    "outcome": "Assemble an authorization package whose plans, assessment results, and open risks agree, and submit it for the authorizing official’s decision.",
    "lessons": [
      "10.1 Package contents in the JSIG and NIST",
      "10.2 Consistency and readiness review",
      "10.3 Submission workflow"
    ],
    "build": "Assemble the practice system’s package: an executive summary, the SSP with its SCTM, continuous monitoring strategy, and RAR, the SAR, the POA&M, and a privacy applicability record. List each in a versioned manifest with its basis (JSIG 5-2 or NIST R-1), owner, and review check.",
    "prove": "Reconcile control identifiers, asset counts, findings, dates, and status across the SSP, SCTM, RAR, SAR, and POA&M, and explain each difference you keep. Walk the package through a generic eMASS-style submission using training data.",
    "sources": "[1,5,6,7,8]",
    "rmf": {
      "step": "Authorize",
      "nist": [
        [
          "R-1",
          "Authorization package"
        ]
      ],
      "jsig": [
        [
          "5-2",
          "Assemble and submit the security authorization package to the AO"
        ]
      ],
      "roles": "The system owner (in the JSIG, the Information System Owner, ISO) assembles and submits the package; a common control provider does the same for the controls it provides. The Authorizing Official (AO) receives it and may direct additional evidence.",
      "outputs": [
        "An authorization package assembled and submitted to the AO (NIST R-1; JSIG output: Security Authorization Package)",
        "An executive summary of the system, the assessment results, and the remaining risk (NIST R-1)",
        "A versioned package manifest naming each component, its basis, owner, and review check",
        "A consistency review that reconciles scope, inventory, findings, and open actions across the SSP, SCTM, RAR, SAR, and POA&M"
      ],
      "jsigOutputs": [
        "Security Authorization Package"
      ],
      "difference": "The JSIG’s minimum package is the SSP (with the SCTM, continuous monitoring strategy, and RAR), the SAR, and the POA&M, plus any evidence the AO directs. NIST R-1 adds an executive summary and treats privacy plans and privacy assessment reports alongside the security ones."
    }
  },
  {
    "id": "11",
    "title": "Support the authorization decision",
    "phase": "Authorize",
    "hours": "1.5",
    "outcome": "Brief the risk the authorizing official must determine, propose a response to each significant risk, and record what an authorization decision contains.",
    "lessons": [
      "11.1 Risk determination",
      "11.2 Risk response",
      "11.3 The decision and its reporting"
    ],
    "build": "Write the executive risk summary and a five-minute AO briefing for the practice system. Then complete a fictional decision record: the decision type, terms and conditions, duration, and what monitoring must report.",
    "prove": "Defend one unresolved finding and answer a request for more evidence. Propose a response (mitigate, accept, or avoid), and explain why the decision belongs to the AO and why a complete package or a passing score doesn’t produce an ATO.",
    "sources": "[1,5,8]",
    "rmf": {
      "step": "Authorize",
      "nist": [
        [
          "R-2",
          "Risk analysis and determination"
        ],
        [
          "R-3",
          "Risk response"
        ],
        [
          "R-4",
          "Authorization decision"
        ],
        [
          "R-5",
          "Authorization reporting"
        ]
      ],
      "jsig": [
        [
          "5-3",
          "Determine the risk"
        ],
        [
          "5-4",
          "Determine whether the risk is acceptable (the authorization decision)"
        ]
      ],
      "roles": "The AO, helped by a designated representative for everything but the decision itself, determines the risk and chooses the response; making and signing the decision stays with the AO. The system owner (JSIG: ISO) and the Security Control Assessor (SCA) brief the risk and answer questions.",
      "outputs": [
        "A risk determination for operating the system, informed by the package and risk assessments (NIST R-2; JSIG 5-3)",
        "A response to each significant risk: mitigation tracked in the POA&M or set as conditions, acceptance, or avoidance (NIST R-3)",
        "An authorization decision document: ATO, IATT, or DATO, with terms and conditions and a duration (NIST R-4; JSIG 5-4)",
        "A report of the decision and any significant control deficiencies to the officials who oversee risk (NIST R-5)",
        "An executive risk summary and AO briefing that support the decision without making it"
      ],
      "jsigOutputs": [
        "Authorization decision document"
      ],
      "difference": "The JSIG’s decisions are ATO, IATT, and DATO; NIST names authorization to operate, authorization to use, common control authorization, or a denial. NIST also makes risk response (R-3) and authorization reporting (R-5) tasks of their own; the JSIG covers the AO’s work in Tasks 5-3 and 5-4."
    }
  },
  {
    "id": "12",
    "title": "Monitor and maintain authorization",
    "phase": "Monitor",
    "hours": "1.5",
    "outcome": "Keep the authorization true as the system changes: analyze each change, assess and report as the strategy requires, support ongoing authorization, and plan disposal.",
    "lessons": [
      "12.1 Changes and security impact analysis",
      "12.2 Assessment, updates, and reporting",
      "12.3 Ongoing authorization and disposal"
    ],
    "build": "Run one cycle of the continuous monitoring strategy course 2.1 drafted: the controls assessed, owners, evidence, reporting dates, and escalation triggers. Write a security impact analysis for one proposed change and a status report for the AO.",
    "prove": "Process a new licensed application on SBD-APPS01 (rule F12), a missed update in one of SBD-WSUS01’s rings, and a changed common control such as the server room’s badge access: what is reassessed, which records change, what the status report says, and when the AO is engaged. Then list the disposal steps if SBD-WEB01’s service were retired, including what depends on it.",
    "sources": "[1,2,8]",
    "rmf": {
      "step": "Monitor",
      "nist": [
        [
          "M-1",
          "System and environment changes"
        ],
        [
          "M-2",
          "Ongoing assessments"
        ],
        [
          "M-3",
          "Ongoing risk response"
        ],
        [
          "M-4",
          "Authorization package updates"
        ],
        [
          "M-5",
          "Security and privacy reporting"
        ],
        [
          "M-6",
          "Ongoing authorization"
        ],
        [
          "M-7",
          "System disposal"
        ]
      ],
      "jsig": [
        [
          "6-1",
          "Determine the security impact of proposed or actual changes"
        ],
        [
          "6-2",
          "Assess a selected subset of controls under the AO-approved monitoring strategy"
        ],
        [
          "6-3",
          "Conduct remediation actions from monitoring, risk assessment, and open POA&M items"
        ],
        [
          "6-4",
          "Update the SSP, SAR, and POA&M"
        ],
        [
          "6-5",
          "Report the security status"
        ],
        [
          "6-6",
          "Review the reported status: is the risk still acceptable?"
        ],
        [
          "6-7",
          "Implement a decommissioning strategy"
        ]
      ],
      "roles": "The system owner (JSIG: ISO), with the Information System Security Manager (ISSM) and the ISSO, analyzes changes, remediates, updates the package, reports status, and carries out disposal. The control assessor (JSIG: SCA) runs the ongoing assessments. The AO, or in the JSIG a designee, reviews the status and decides whether the risk is still acceptable.",
      "outputs": [
        "A security impact analysis for each proposed or actual change (NIST M-1; JSIG 6-1)",
        "Ongoing assessment results under the approved monitoring strategy (NIST M-2; JSIG 6-2)",
        "Remediation and an updated SSP, SAR, and POA&M that keep the original information (NIST M-3, M-4; JSIG 6-3, 6-4)",
        "Security status reports to the AO, event-driven, time-driven, or both (NIST M-5; JSIG 6-5)",
        "An ongoing authorization review, with the authorization updated as appropriate (NIST M-6; JSIG 6-6)",
        "A decommissioning strategy carried out when the system is retired (NIST M-7; JSIG 6-7)"
      ],
      "jsigOutputs": [
        "Periodic ConMon deliverables",
        "Updated SSP, SAR, POA&M",
        "Updated Security Authorization, as appropriate"
      ],
      "difference": "The steps match task for task. The JSIG is more specific: a security impact analysis that notifies the SCA, updates that keep the original information for oversight and audit, and a decommissioning strategy that includes a decommission letter. NIST reports security and privacy posture together."
    }
  }
];

// The course as the Training Library presents it (content/videos.json; tests keep them equal). Owner direction, 15 October
// 2026: courses 2.1, 2.2 and 2.3, the ATO Template Library and the Authorization Workspace became one learning process,
// course 2.1 "RMF to ATO" at /training/rmf/, built by scripts/prepare-rmf-courses.mjs. Module IDs and the
// training:rmf-boe-ato:NN progress IDs are unchanged.
window.CATALOG_PARTS = [
  {
    "number": "2.1",
    "workspace": "The practice records every step starts or updates, from the scope and registration to the package manifest and the security impact analysis. Compare a completed excerpt with its blank starter.",
    "id": "rmf-boe-ato",
    "folder": "rmf",
    "title": "RMF to ATO",
    "hero": "Take the system you built in Build the Network all the way to an Authorization to Operate, one RMF step at a time. Each step pairs its lessons with the same task in the Authorization Workspace and the templates that step uses, from preparing the system to keeping its authorization current.",
    "modules": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    "capstone": true
  }
];

// The seven RMF steps of NIST SP 800-37 Rev. 2 that organize the course. Each step groups its modules, names the
// Authorization Workspace tab and check that match it (lib/authorization/model.mjs phases(), same IDs), and the
// ATO Template Library section with its sources (content/ato-templates.json groups, same IDs; Authorize has none).
window.RMF_STEPS = [
  {"id": "prepare", "number": 1, "title": "Prepare", "modules": ["01", "02"], "tab": "system",
   "lead": "Learn who is accountable for the authorization, then define the system: its mission, boundary, assets and registration.",
   "task": "Register the Secure By Design enclave, name the five roles, and write its description and boundary.",
   "done": "All five roles are named, and the description and boundary are written."},
  {"id": "categorize", "number": 2, "title": "Categorize", "modules": ["03"], "tab": "system",
   "lead": "Describe the system and decide the impact of a loss of confidentiality, integrity and availability, with the rationale.",
   "task": "Add the information types, set confidentiality, integrity and availability, and write the categorization rationale.",
   "done": "At least one information type is recorded, each impact is at or above its high-water mark, and the rationale is written."},
  {"id": "select", "number": 3, "title": "Select", "modules": ["04"], "tab": "controls",
   "lead": "Choose the baseline, apply overlays and tailoring, allocate controls and plan how they will be monitored.",
   "task": "Choose the controls in scope and write the selection rationale.",
   "done": "The system has controls in scope and a selection rationale."},
  {"id": "implement", "number": 4, "title": "Implement", "modules": ["05", "06"], "tab": "controls",
   "lead": "Implement the controls, record them as implemented, and connect each one to the evidence that proves it.",
   "task": "Write an implementation statement for every control, submit each one, and get evidence accepted into the Body of Evidence.",
   "done": "No control is in draft or returned, and at least one piece of evidence is accepted."},
  {"id": "assess", "number": 5, "title": "Assess", "modules": ["07", "08", "09"], "tab": "assessment",
   "lead": "Prepare and perform an independent assessment, report it, and turn the findings into a plan of action and milestones.",
   "task": "Take the assessor's seat: record a result for every SP 800-53A objective, validate each control, and plan each weakness in the POA&M.",
   "done": "Every control is assessed."},
  {"id": "authorize", "number": 6, "title": "Authorize", "modules": ["10", "11"], "tab": "package",
   "lead": "Assemble the authorization package, determine and respond to the risk, and support the Authorizing Official's decision.",
   "task": "Assemble the package and route it through the ISSM, the assessor and the Authorizing Official to a decision.",
   "done": "The Authorizing Official grants an ATO, an ATO with conditions, or an IATT."},
  {"id": "monitor", "number": 7, "title": "Monitor", "modules": ["12"], "tab": "monitor",
   "lead": "Keep the authorization current: analyze changes, keep assessing, report, and plan for disposal.",
   "task": "Track the termination date, milestones, changes and the annual review for your authorized system.",
   "done": "The system's authorization is current."}
];
