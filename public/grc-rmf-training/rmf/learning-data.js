// Lesson text, worked example, knowledge check and practice artifacts for each module, in CATALOG order.
window.LEARNING = [
  {
    "learn": [
      [
        "Start with the mission, then ask about risk.",
        "The Risk Management Framework (RMF) connects a system’s purpose to the safeguards, evidence, and decisions needed to operate it. Begin with what the organization needs the system to do. Then ask what could happen if its information is exposed, changed incorrectly, or unavailable.",
        "Each step produces outputs the next one builds on, ending in an authorization package. An Authorization to Operate (ATO) is the authorizing official’s decision about the risk that remains; installing tools or finishing a checklist doesn’t make it."
      ],
      [
        "Everyone contributes. The responsibilities differ.",
        "NIST names roles by function: system owner, control assessor, common control provider, and authorizing official. The Joint Special Access Program (SAP) Implementation Guide (JSIG) uses SAP titles for that work: Information System Owner (ISO), Security Control Assessor (SCA), Common Control Provider (CCP), and Authorizing Official (AO).",
        "An Information System Security Manager (ISSM) oversees the security program, an Information System Security Officer (ISSO) supports day-to-day implementation, and an Information System Security Engineer (ISSE) designs security in; SAP programs add a Program Security Officer (PSO). Local appointments set the exact split. Only the AO accepts risk."
      ],
      [
        "Know which document, and which edition, you’re following.",
        "NIST Special Publication (SP) 800-37 Revision 2 (December 2018) has seven steps: Prepare, Categorize, Select, Implement, Assess, Authorize, and Monitor. Each is a set of numbered tasks, such as P-11 for the authorization boundary, with expected outputs and responsible roles. SP 800-53 supplies the controls.",
        "The JSIG of 11 April 2016 applies that foundation to SAP systems, with SP 800-53 Revision 4 and Committee on National Security Systems Instruction (CNSSI) 1253 of March 2014. It follows SP 800-37 Revision 1’s six steps, so it has no Prepare step; its tasks run from 1-1 to 6-7, and each step lists its outputs.",
        "The public JSIG is this 2016 edition. Department of Defense Manual (DoDM) 5205.07 refers to the JSIG or its successor, so confirm what your program directs. This course follows the NIST steps, maps the JSIG tasks into each, and notes where the two differ."
      ]
    ],
    "example": [
      "From a claim to a decision",
      [
        [
          "Claim",
          "“Privileged account changes are logged and reviewed,” as the System Security Plan (SSP) states it for the practice system."
        ],
        [
          "Evidence",
          "The control owners supply the event-forwarding configuration, a sample account change from SBD-DC01, and the analyst’s review record in SBD-SPLUNK01."
        ],
        [
          "Assessment",
          "The assessor (SCA) tests the event and checks that the expected review happened."
        ],
        [
          "Decision",
          "The AO weighs the supported result and any remaining gap. Only the AO can accept the risk."
        ]
      ]
    ],
    "quiz": [
      "Your program directs the public JSIG of 11 April 2016. Which statement fits it?",
      [
        "It is built on SP 800-53 Revision 5 and begins with Prepare.",
        "It replaces NIST, so SP 800-37 no longer applies.",
        "It follows SP 800-37 Revision 1’s six steps, starting at Categorize, with SP 800-53 Revision 4 and CNSSI 1253."
      ],
      2,
      "NIST is the foundation; the JSIG is SAP-specific direction for applying it. The 2016 edition predates the Revision 2 Prepare step and the Revision 5 controls, and your program may direct a successor."
    ],
    "artifacts": [
      "scope"
    ]
  },
  {
    "learn": [
      [
        "Prepare starts above the system.",
        "Prepare is the step NIST SP 800-37 Revision 2 added. Its organization-level tasks (P-1 to P-7) assign roles, set the risk strategy and tolerance, identify common controls systems can inherit, and set an organization-wide monitoring strategy. A system team works inside those decisions.",
        "At the system level, start with the mission (P-8) and the stakeholders (P-9): what work the system supports, who depends on it, who owns its information, and what an interruption or misuse would affect."
      ],
      [
        "Draw the boundary, then test the assumptions.",
        "Identify the assets to protect (P-10), then the authorization boundary (P-11), which the authorizing official determines. It’s more than a subnet diagram: consider management interfaces, hosting, shared services, information flows, and dependencies.",
        "List the information types the system processes, stores, and transmits (P-12), and follow each from creation to disposal (P-13). A component outside the boundary can still affect risk. Record the relationship and the responsible party; don’t use the boundary to make a hard dependency disappear."
      ],
      [
        "Assess early, allocate the requirements, then register.",
        "Assess system risk early (P-14): threats, weaknesses, and likely consequences, so the requirements can answer them. Then define the security and privacy requirements (P-15), place the system in the enterprise architecture (P-16), and allocate each requirement to the system or its environment (P-17).",
        "Last, the system owner registers the system with the office the organization designates (P-18). The 2016 JSIG has no Prepare step, so it describes the system and its boundary and registers it in Categorize (Tasks 1-2, 1-3), and drafts its first Risk Assessment Report (RAR) in Select."
      ]
    ],
    "example": [
      "Resolve a boundary question",
      [
        [
          "Question",
          "Are the seven hypervisor hosts that run the enclave’s servers covered by this authorization?"
        ],
        [
          "Record",
          "List SBD-HV01 to SBD-HV07, who administers them, and the systems each one runs, including the domain controllers and the issuing CA."
        ],
        [
          "Resolve",
          "They can control the domain controllers, so they are Tier 0 assets wherever the line falls. Propose inside or external with the reason, and route it to the authorizing official, who determines the boundary (P-11)."
        ],
        [
          "Prove",
          "Keep the asset list, boundary diagram, scope record, and registration consistent with the decision."
        ]
      ]
    ],
    "quiz": [
      "Your program follows the 2016 JSIG, which has no Prepare step. Where does the boundary and registration work happen?",
      [
        "In Categorize: describe the system and its boundary (Task 1-2), then register it (Task 1-3).",
        "Nowhere. Without a Prepare step, the JSIG skips it.",
        "In Monitor, once the system is operating."
      ],
      0,
      "The JSIG follows SP 800-37 Revision 1, so work that NIST Revision 2 puts in Prepare (P-11, P-18) appears in the JSIG’s Categorize step."
    ],
    "artifacts": [
      "scope",
      "registration"
    ]
  },
  {
    "learn": [
      [
        "Describe the system someone else will assess.",
        "Categorize opens with a system description (C-1): what the system is for, what it contains, who uses it, what it connects to, and where its boundary lies, drawn from the Prepare records. The JSIG asks for the same in Task 1-2: describe the system, including its boundary, in the System Security Plan (SSP).",
        "Write it so a reviewer who has never seen the system can follow it. Every later decision, from categorization to control selection, points back to this description."
      ],
      [
        "Evaluate the consequences for each objective.",
        "Confidentiality concerns inappropriate disclosure, integrity improper change, and availability reliable access when needed. For each information type, judge the impact of a loss on each objective, then set the system’s impact for each objective from those results (C-2), using the method that applies.",
        "In the JSIG, the ISO categorizes the system with the ISSM or ISSO and the ISSE, and documents the results in the SSP (Task 1-1). Write a rationale someone else can review: the information, what’s affected, the consequence, and why each level fits. An isolated network alone doesn’t decide the result."
      ],
      [
        "Apply the right authority, then get approval.",
        "Federal systems categorize under Federal Information Processing Standard (FIPS) 199 with the information types in NIST SP 800-60; national security systems follow CNSSI 1253, and a SAP adds its program direction. Treat privacy applicability as an explicit decision.",
        "NIST makes approval a task of its own (C-3): the authorizing official or a designated representative approves the categorization. In the JSIG, the categorization is documented in the draft SSP, and the whole plan is approved in Select (Task 2-4). This JSIG step also registers the system (Task 1-3), which NIST did in Prepare (P-18)."
      ]
    ],
    "example": [
      "A new dependency reopens availability",
      [
        [
          "Initial rationale",
          "Engineering work can wait out a short outage of the internal web application, so the exercise input rates availability Low."
        ],
        [
          "New information",
          "A deadline-driven engineering process now depends on timely access to the application on SBD-WEB01 and its records in SBD-SQL01."
        ],
        [
          "Review",
          "Reevaluate the availability consequences for those information types under the applicable method (C-2)."
        ],
        [
          "Update",
          "Record the new rationale in the draft SSP and the scope record’s categorization basis, route it for approval (C-3), and update the registration if the category changes."
        ]
      ]
    ],
    "quiz": [
      "The system owner has categorized the system and wants to start selecting controls. What does NIST SP 800-37 Revision 2 call for first?",
      [
        "Nothing more. The system owner’s categorization is final.",
        "Review and approval of the categorization by the authorizing official or a designated representative (C-3).",
        "A control assessment by the security control assessor."
      ],
      1,
      "The system owner and information owner categorize (C-2); approval is a separate task (C-3). In the JSIG, the categorization is documented in the draft SSP (Task 1-1), and the plan is approved in Select (Task 2-4)."
    ],
    "artifacts": [
      "ssp",
      "scope"
    ]
  },
  {
    "learn": [
      [
        "A catalog is not the same as a selected control set.",
        "SP 800-53 is a catalog; a baseline is a starting set under a selection method, and overlays can change it. SP 800-53B holds the federal baselines; a national security system selects under CNSSI 1253 and its overlays, and a SAP adds the JSIG and approved program direction.",
        "Select the controls (S-1), then tailor them (S-2): record why each is added, adjusted, or not applicable, resolve organization-defined parameters such as roles and frequencies, and note who approves. Difficulty alone doesn’t make a requirement not applicable."
      ],
      [
        "Allocate the work before asking for evidence.",
        "Allocate each control to the system, its components, or its environment (S-3), and name its owner: system-specific, common from a provider, or hybrid with shared responsibility. The JSIG begins Select here, with Task 2-1: identify the common controls and document them in a security plan.",
        "Then document the planned implementations (S-4). The JSIG’s Task 2-2 selects the controls and documents them in the security plan. A Security Controls Traceability Matrix (SCTM) can record each control’s selection, parameters, allocation, and inheritance; its format follows local requirements."
      ],
      [
        "Plan how you’ll know it still works, then get approval.",
        "A system continuous monitoring strategy (S-5; JSIG Task 2-3) says which controls are monitored, how often, by whom, and what triggers action, within the organization’s strategy (P-7). The JSIG also drafts a Risk Assessment Report (RAR) here; NIST assessed system risk in Prepare (P-14).",
        "Then the plan is reviewed and approved: by the authorizing official or a designated representative in NIST (S-6), or by the AO, SCA, or AO designee in the JSIG (Task 2-4). The JSIG calls the result the approved draft SSP/SCTM."
      ]
    ],
    "example": [
      "Credentialed scanning isn’t built yet",
      [
        [
          "Proposal",
          "“Mark RA-5 not applicable until a credentialed scanner exists.”"
        ],
        [
          "Question",
          "Is the control inapplicable, or only hard to meet today? The network still runs software that needs vulnerability monitoring."
        ],
        [
          "Decision",
          "Keep RA-5 selected. Allocate what exists, SCAP Compliance Checker and Security Technical Implementation Guide (STIG) results from the administration seats, and record credentialed scanning as a gap."
        ],
        [
          "Record",
          "The SCTM row shows the allocation and the gap, the draft RAR carries the risk, and the monitoring strategy reviews scan coverage."
        ]
      ]
    ],
    "quiz": [
      "A facility office says physical access to the server room is “covered.” What does the SCTM need before the plan goes for approval?",
      [
        "Nothing more. Mark PE-3 inherited on the provider’s word.",
        "Mark PE-3 not applicable, since the system team doesn’t run the building.",
        "The provider, the parts it performs, its assessment information, and what the system team still does."
      ],
      2,
      "An inherited or hybrid allocation needs an identified provider and applicable evidence. Record the split in the SCTM so the assessor knows what to ask of whom."
    ],
    "artifacts": [
      "sctm",
      "rar",
      "monitoring"
    ]
  },
  {
    "learn": [
      [
        "Build what the approved plan describes.",
        "Implement turns the approved plan into a working system. NIST Task I-1 implements the controls in the security and privacy plans; Task 3-1 of the Joint Special Access Program (SAP) Implementation Guide (JSIG) implements those specified in the System Security Plan (SSP).",
        "The system owner is accountable, and engineers build to the approved selection, parameter values, and control revision. That revision matters: the public JSIG is the 11 April 2016 edition, built on SP 800-53 Revision 4 and CNSSI 1253, and a program may direct a successor or its own guidance."
      ],
      [
        "Record the controls as they were built.",
        "NIST Task I-2 updates the plans with the as-implemented state, in enough detail for an assessor to use. JSIG Task 3-2 records it in the Security Controls Traceability Matrix (SCTM) portion of the SSP. Both lead to the JSIG output “Updated SSP/SCTM.”",
        "Write who performs each activity, what happens, where it applies, when it happens, and which records show it. “We comply with policy” leaves an assessor nothing to examine, interview, or test."
      ],
      [
        "Keep planned work and supporting plans honest.",
        "Describe what operates today, and mark planned work as planned. Where the build could not follow the plan, say so; the assessor will test each statement as written.",
        "Configuration, access, incident response, contingency, and other supporting plans describe processes the SSP relies on. Reference each by owner, version, and review status instead of copying procedures that drift apart. A plan shows intent; records show the process happens."
      ]
    ],
    "example": [
      "Turn a vague statement into an as-implemented one",
      [
        [
          "Before",
          "“Audit records are reviewed according to policy.” It names no reviewer, sources, schedule, or record."
        ],
        [
          "As built",
          "Windows systems forward the selected events to SBD-SYSLOG01 by Windows Event Forwarding (F17), the Linux servers send syslog over TLS (F07), and the collector feeds SBD-SPLUNK01 (F10) and SBD-AUDIT01 (F11)."
        ],
        [
          "After",
          "The assigned analyst reviews those events in SBD-SPLUNK01 on the approved schedule, records each exception and its follow-up, and keeps the review record."
        ],
        [
          "Trace",
          "Put the statement in the SSP and update the AU-6 row of the SCTM with its status and evidence identifiers, ready for the assessor."
        ]
      ]
    ],
    "quiz": [
      "The engineers built the log path differently from the approved plan. What does the Implement step call for?",
      [
        "Leave the plan as approved and let the assessor find the difference.",
        "Update the SSP and SCTM to the as-implemented state.",
        "Change the system back, whatever the reason for the difference."
      ],
      1,
      "NIST Task I-2 and JSIG Task 3-2 record the controls as actually implemented. The assessor tests that record, so it has to match the system."
    ],
    "artifacts": [
      "ssp",
      "sctm"
    ]
  },
  {
    "learn": [
      [
        "Capture the configuration and its context.",
        "Evidence shows what Implement actually produced. A configuration export or Security Technical Implementation Guide (STIG) checklist is useful when a reviewer can identify the system, setting, scope, version, and collection time. Keep the review record alongside it.",
        "A passing automated check has a defined scope. Manual checks, applicability decisions, and technical limits still need attention."
      ],
      [
        "Show that processes run, and how far the evidence reaches.",
        "Logs, review records, tickets, access reviews, and restore tests support different claims. Connect each item to the question it can answer. Owning a security product does not show that a control is effective; its records might.",
        "Check that every relevant system was included, the collection worked, and the data is current. Keep collection failures rather than silently excluding them, and say what an item cannot show: a backup job’s success message does not prove recovery."
      ],
      [
        "Index the evidence, then let it correct the plan.",
        "A master evidence index gives each record a stable identifier, title, scope, owner, collection date, version, and location, so nobody depends on a folder name or someone’s memory. One record can support several objectives, and one objective can need several records.",
        "When the evidence shows the system differs from the SSP or SCTM, update them to the as-built state. That is still NIST Task I-2 and JSIG Task 3-2, and it means the assessor tests the real system."
      ]
    ],
    "example": [
      "A clean view with a coverage gap",
      [
        [
          "Result",
          "A Splunk search by host shows recent events from the domain controllers and member servers."
        ],
        [
          "Inspection",
          "The audit source inventory lists SBD-MGMT01, but none of its events reached SBD-SYSLOG01 in the collection period."
        ],
        [
          "Conclusion",
          "The evidence does not support complete source coverage, so the SSP’s AU-12 statement cannot claim it."
        ],
        [
          "Follow-up",
          "Record the gap in the evidence index and the SSP, and hand it to the assessor. Do not drop SBD-MGMT01 from the inventory to make the view look complete."
        ]
      ]
    ],
    "quiz": [
      "A configuration scan reports no open findings, but one in-scope server is missing from its results. What does the scan support?",
      [
        "A clean result for every in-scope server.",
        "Nothing, so it should be deleted.",
        "A clean result for the servers it covered; the missing server is a coverage gap to record and close."
      ],
      2,
      "A result supports only the scope it covered. Keep it, record the gap, and collect the missing evidence before anyone relies on the result."
    ],
    "artifacts": [
      "evidence"
    ]
  },
  {
    "learn": [
      [
        "Choose an assessor who can be trusted with the answer.",
        "NIST Task A-1 opens Assess: the Authorizing Official (AO), or a designated representative, selects the assessor or team. In the JSIG, Step 4 starts with the plan, and the Security Control Assessor (SCA) is a defined role.",
        "Choose for skill and independence. An impartial assessor does not assess their own work or advocate for the team that built it. The AO decides how much independence the system’s categorization and risk call for."
      ],
      [
        "Hand over evidence the assessor can rely on.",
        "The assessor starts from what Implement produced: the SSP, the SCTM, the evidence index, and the exceptions you already know about. Check that each record is current, and record the versions you hand over so the plan and results refer to the same material.",
        "The JSIG describes this as the Body of Evidence (BoE): the SSP, test plans, test procedures, test reports, and exceptions. The system team supplies the plan and the exceptions; the assessment adds the rest."
      ],
      [
        "Agree on the plan before anyone tests.",
        "In NIST Task A-2, the assessor develops the plan from the implementation detail, and the AO or a designated representative approves it. In JSIG Task 4-1, the ISO develops it with the information system security manager, officer, or engineer, and the SCA reviews and approves it.",
        "The JSIG’s Security Assessment Plan is made up of the SSP, the SCTM, and the Security Control Assessment Procedures. Either way, the plan states scope, objectives, methods, objects, coverage, responsibilities, schedule, and limits, with sampling decisions written down."
      ]
    ],
    "example": [
      "Plan the logging assessment",
      [
        [
          "Assessor",
          "The exercise AO’s designated representative selects a training assessor who did not build or operate the logging pipeline."
        ],
        [
          "Evidence",
          "The assessor receives the SSP and SCTM at their recorded versions, evidence index EI-001, and the known SBD-MGMT01 coverage gap."
        ],
        [
          "Procedures",
          "Examine the event configuration and source records, interview the analyst, test an approved account change on SBD-DC01, and replay the attack drill’s six attempts as negative tests."
        ],
        [
          "Approval",
          "Plan AP-001 is reviewed and approved before any testing: by the SCA in JSIG terms, or by the AO or a designated representative in NIST’s."
        ]
      ]
    ],
    "quiz": [
      "The engineer who built the logging pipeline offers to assess it. What is the problem?",
      [
        "An assessor should not assess their own work; the AO sets the independence required.",
        "None, as long as the engineer follows the procedures.",
        "Engineers cannot take part in an assessment at all."
      ],
      0,
      "Independence keeps the result credible. The engineer still takes part, as someone the assessor interviews and observes."
    ],
    "artifacts": [
      "assessment",
      "evidence"
    ]
  },
  {
    "learn": [
      [
        "Run the approved procedures and record what you see.",
        "NIST Task A-3 and JSIG Task 4-2 assess the controls the way the approved plan describes. Each assessment asks whether a control is implemented correctly, operating as intended, and producing the desired outcome.",
        "Examine records and configurations, interview the people who run the process, and test behavior where the plan calls for it, including what should fail. Record the expected result, the observation, the evidence, and any limitation, using the adopted SP 800-53A procedures."
      ],
      [
        "Report only what the evidence supports.",
        "NIST Task A-4 and JSIG Task 4-3 produce the Security Assessment Report (SAR): what was assessed, the result for each objective, the findings and limitations, and recommendations for correcting deficiencies. An objective the evidence cannot support is “other than satisfied,” not a pass by default.",
        "In the JSIG, the SCA submits the SAR with a recommended authorization decision. The recommendation informs the AO; it is not the decision."
      ],
      [
        "Fix what you can, reassess it, and keep the record.",
        "NIST Task A-5 and JSIG Task 4-4 cover initial remediation. Review each finding’s significance; the system owner corrects those that should be fixed now, and the assessor reassesses the changed controls. The SAR keeps the original finding beside the new result.",
        "Then update what the results changed: the SSP for any implementation that moved and, in the JSIG, the Risk Assessment Report (RAR) drafted in Select. Whatever stays open goes to the Plan of Action and Milestones (POA&M)."
      ]
    ],
    "example": [
      "Assess the logging objectives",
      [
        [
          "Test",
          "Make an approved account change on SBD-DC01 and follow it through SBD-SYSLOG01 to SBD-SPLUNK01 and the analyst’s review. Replay the attack drill: all six attempts should be refused."
        ],
        [
          "Observe",
          "The event arrives and is reviewed (EV-003, EV-004), and every drill attempt is refused. SBD-MGMT01 has no verified events in the period, and one review exception has no recorded follow-up."
        ],
        [
          "Report",
          "SAR-001 records the results, FND-001 for SBD-MGMT01 coverage, and FND-002 for the missing follow-up, and cites the traffic matrix for the drill."
        ],
        [
          "Remediate",
          "The analyst records the follow-up, and the reassessment finds the AU-6 objective satisfied; FND-002 stays in the report as remediated. FND-001 needs a scheduled change, so it stays open for the POA&M."
        ]
      ]
    ],
    "quiz": [
      "During the assessment, the team fixes a finding and the reassessment passes. What happens to the original finding in the SAR?",
      [
        "It is deleted, since the control now works.",
        "It stays, with the remediation and the reassessment result beside it.",
        "It moves to the POA&M as an open item."
      ],
      1,
      "Initial remediation (NIST A-5, JSIG 4-4) adds the reassessment to the report; it does not erase what the assessment found. Findings that remain open go to the POA&M."
    ],
    "artifacts": [
      "sar",
      "rar"
    ]
  },
  {
    "learn": [
      [
        "Rank what is still open by risk.",
        "Findings that survive initial remediation go into the Plan of Action and Milestones (POA&M). NIST Task A-6 prepares it from the assessment report’s findings and recommendations; JSIG Task 5-1 initiates it the same way, as the first task of Authorize.",
        "Rank the entries by risk in the system’s context: threat, exposure, mission consequence, existing safeguards, and remaining uncertainty. Technical severity informs the order, but it is not the complete risk determination."
      ],
      [
        "Write an action someone can manage.",
        "Each entry names the weakness, affected scope, accountable owner, planned actions, resources, milestones with completion dates, dependencies, and closure criteria. In the JSIG, the ISO keeps it updated with corrective actions, resources, milestone completion dates, and residual findings.",
        "“Fix soon” is not a milestone. A useful milestone describes a verifiable action with a target date and a clearly accountable owner."
      ],
      [
        "Track each entry to verified closure.",
        "The AO reviews the POA&M and uses it to monitor progress. Close an entry only when a reassessment verifies the fix, and keep the original finding and dates when plans change.",
        "A POA&M is a management record; it does not accept risk or grant permission to operate. Tracking a weakness and accepting its risk are different actions, and only the AO accepts risk."
      ]
    ],
    "example": [
      "Turn the open logging finding into a POA&M entry",
      [
        [
          "Finding",
          "FND-001: SBD-MGMT01 is not in verified audit collection. It remained open after initial remediation because the fix needs a scheduled change."
        ],
        [
          "Risk",
          "Privileged activity on a management server could go unreviewed. Weigh the local records that remain, then set the entry’s contextual risk and rank."
        ],
        [
          "Milestones",
          "Confirm the forwarding configuration, test a selected event end to end, and verify the analyst’s review covers SBD-MGMT01, each with an owner and a date."
        ],
        [
          "Closure",
          "Close PM-001 only after reassessment, then update the SSP, evidence index, RAR, and SAR. FND-002 was fixed during the assessment and needs no entry."
        ]
      ]
    ],
    "quiz": [
      "Does adding a finding to the POA&M mean its risk has been accepted?",
      [
        "Yes, automatically.",
        "Only if the entry has a due date.",
        "No. Only the AO accepts risk, as part of the authorization decision."
      ],
      2,
      "The POA&M plans and tracks corrective action. Accepting the remaining risk is a separate decision that belongs to the AO."
    ],
    "artifacts": [
      "poam"
    ]
  },
  {
    "learn": [
      [
        "Assemble what the decision needs.",
        "In NIST SP 800-37 Revision 2, Task R-1, the system owner assembles the authorization package and submits it to the Authorizing Official (AO). It holds an executive summary, the security and privacy plans, the assessment reports, and the Plan of Action and Milestones (POA&M).",
        "The Joint Special Access Program (SAP) Implementation Guide (JSIG) applies that NIST foundation to SAP systems; its public edition, 11 April 2016, is built on SP 800-53 Revision 4. Its Task 5-2 sets a minimum: the System Security Plan (SSP), with its Security Controls Traceability Matrix (SCTM), continuous monitoring strategy, and Risk Assessment Report (RAR); the Security Assessment Report (SAR); and the POA&M. The AO can direct more."
      ],
      [
        "Check that the documents agree.",
        "Compare the boundary, inventory, selected controls, implementation statements, findings, and open actions across the SSP, SCTM, RAR, SAR, and POA&M. Resolve identifiers, status, dates, and scope that disagree.",
        "Follow the risk as well: each significant SAR finding should reach the RAR, the POA&M or a proposed acceptance, and the executive summary. A package can be complete as a collection of files and still be unreliable."
      ],
      [
        "Submit through the approved workflow.",
        "Follow the authority’s system of record, required reviews, signatures, and submission steps. Whatever tool the authority uses, the records still need the same substance.",
        "Submitting hands the package to the AO; it decides nothing. This course uses a generic record workflow, and no live government submission is part of the training."
      ]
    ],
    "example": [
      "A package consistency review",
      [
        [
          "SSP",
          "Describes 21 named systems, two of them planned and not yet built (SBD-NESSUS01, SBD-EPO01), and 50 Windows workstations."
        ],
        [
          "SAR",
          "Reports testing on the network for 18 named systems and the workstation sample."
        ],
        [
          "Reconcile",
          "Nothing claims the planned servers’ controls. SBD-ROOTCA01 is never on the network, so it is assessed during its key ceremonies: a stated limitation, not a missing test."
        ],
        [
          "Record",
          "Note each explanation in the manifest’s review checks and the executive summary before submitting."
        ]
      ]
    ],
    "quiz": [
      "Your authority follows the JSIG. What must the authorization package contain at a minimum?",
      [
        "The executive summary only; the AO requests the rest.",
        "The SSP and the latest scan report.",
        "The SSP (with its SCTM, continuous monitoring strategy, and RAR), the SAR, and the POA&M, plus any evidence the AO directs."
      ],
      2,
      "That is the JSIG Task 5-2 minimum. NIST Task R-1 adds an executive summary and puts privacy plans and assessment reports alongside the security ones."
    ],
    "artifacts": [
      "manifest",
      "summary"
    ]
  },
  {
    "learn": [
      [
        "Support the AO’s risk determination.",
        "In NIST Task R-2, the AO analyzes the package and determines the risk of operating the system. In JSIG Task 5-3, risk assessments, formal or informal, inform the AO’s final determination.",
        "Your briefing supports that analysis: the mission, the assessed posture, significant findings and their consequences, limitations, and the recommendation the Security Control Assessor (SCA) made with the SAR. A request for more evidence is part of the process, not a setback."
      ],
      [
        "Choose a response for each significant risk.",
        "In NIST Task R-3, the AO chooses a response to the risk determined. Planned mitigation is tracked in the POA&M, and conditions on operation go into the decision. Accepted deficiencies stay documented in the assessment report and are watched for change. Avoiding a risk can mean limiting the operation.",
        "A POA&M entry tracks work; it doesn’t accept risk. JSIG Task 5-4 puts the explicit acceptance of risk with the AO, who decides whether the risk to organizational operations and assets, individuals, other organizations, or national security is acceptable."
      ],
      [
        "Record the decision so people can act on it.",
        "The authorization decision document records the decision, its terms and conditions, and its duration. JSIG decisions are an Authorization to Operate (ATO), an Interim Authorization to Test (IATT), for testing rather than operation, or a Denied Authorization to Operate (DATO). NIST Task R-4 names authorization to operate or to use, common control authorization, or a denial.",
        "Duration is time-driven or ongoing, backed by robust continuous monitoring. Only the AO makes and signs the decision. NIST Task R-5 then reports it, with any significant control deficiencies, to the officials who oversee risk."
      ]
    ],
    "example": [
      "From an open finding to a decision record",
      [
        [
          "Determine",
          "FND-001: SBD-MGMT01 is missing from verified audit collection, so privileged activity there could go unseen in Splunk review."
        ],
        [
          "Respond",
          "Mitigate through PM-001, and propose an interim condition: the Information System Security Officer (ISSO) reviews SBD-MGMT01’s local Security log and records each review."
        ],
        [
          "Decide",
          "The reviewer, acting as AO, records an exercise decision: the type, terms and conditions tied to PM-001, and a duration."
        ],
        [
          "Report",
          "Monitoring reports PM-001’s milestones and the interim reviews. A course score is not an ATO."
        ]
      ]
    ],
    "quiz": [
      "The AO will allow operation while an open finding is fixed. What must the decision document record?",
      [
        "The decision, the terms and conditions tied to that finding, and the duration.",
        "Only the POA&M due dates.",
        "Nothing more: the open POA&M entry already accepts the risk."
      ],
      0,
      "The decision document carries the decision, its terms and conditions, and its duration. A POA&M tracks corrective work; accepting the risk is the AO’s decision."
    ],
    "artifacts": [
      "summary",
      "decision"
    ]
  },
  {
    "learn": [
      [
        "Analyze a change before it changes the risk.",
        "NIST Task M-1 watches the system and its environment for changes that affect its security and privacy posture. JSIG Task 6-1 makes that a security impact analysis (SIA): determine the impact of a proposed or actual change, notify the SCA, and revise the package as required.",
        "A new component, information flow, dependency, control provider, or threat can undercut the assessment the decision relied on. The size of a technical change doesn’t tell you the size of its consequence."
      ],
      [
        "Assess, respond, update, and report.",
        "The continuous monitoring (ConMon) strategy the AO approved sets which controls are assessed, how often, and by whom; JSIG Task 6-2 assesses a selected subset (NIST M-2). Continuous doesn’t mean testing every control constantly.",
        "Results feed remediation and risk response (M-3, 6-3) and updates to the SSP, SAR, and POA&M that keep the original information needed for oversight and audit (M-4, 6-4). The system owner reports status to the AO, event-driven, time-driven, or both (M-5, 6-5)."
      ],
      [
        "Keep the decision current until the system retires.",
        "In NIST Task M-6 and JSIG Task 6-6, the AO (or, in the JSIG, a designee) reviews the reported status to decide whether the risk is still acceptable. If not, the AO decides what follows: new conditions, reassessment, or a new decision.",
        "Disposal closes the loop (M-7, 6-7). The JSIG’s decommissioning strategy covers media sanitization, a records retention plan the AO approves, inventory updates, notifications, a review of inherited relationships, and a decommission letter."
      ]
    ],
    "example": [
      "A change goes through security impact analysis",
      [
        [
          "Change",
          "A second licensed application is proposed for SBD-APPS01, adding its vendor licensing port to rule F12 for the VLAN 80 workstations."
        ],
        [
          "Impact",
          "New software and a changed flow: configuration (CM-6, a SCAP Compliance Checker rescan), the vendor’s update path (SI-2), its events (AU-2, AU-12), and the course 1.12 recovery set (CP-9)."
        ],
        [
          "Decide",
          "Notify the SCA, reassess before go-live, and give the SIA to the AO or designee, who decides whether it fits the current authorization."
        ],
        [
          "Update",
          "Update the inventory, SSP, SCTM, rule register, and evidence index, report the change in the next status report, and keep the prior versions."
        ]
      ]
    ],
    "quiz": [
      "A proposed change adds a port to a documented information flow. What comes first?",
      [
        "Make the change; the current authorization covers future services.",
        "A security impact analysis: identify the affected controls and records, notify the SCA, and follow the required review.",
        "Nothing until the next reauthorization."
      ],
      1,
      "NIST Task M-1 and JSIG Task 6-1 evaluate a change against the assessed and authorized scope before it quietly changes the risk."
    ],
    "artifacts": [
      "monitoring",
      "sia"
    ]
  }
];

// Practice artifacts (Body of Evidence starters). module is the module that starts each one; {+N} in an example is N days from today.
window.ARTIFACTS = [
  {
    "id": "scope",
    "title": "System scope record",
    "module": "01",
    "kind": "Prepare outputs",
    "short": "SCOPE",
    "owner": "System owner (ISO) with the security team",
    "purpose": "Agree on the roles, governing direction, mission, boundary, information, early risks, and requirements before the package grows. Module 01 starts it, module 02 completes the Prepare fields, and module 03 adds the categorization basis.",
    "fields": [
      [
        "Roles and governing direction",
        "Who holds each role, in NIST and JSIG terms; the governing documents, their editions, and the adopted control release.",
        "Exercise roles: system owner (Information System Owner, ISO), a training role; Information System Security Manager (ISSM) and Officer (ISSO), the learner team; Information System Security Engineer (ISSE), the build engineer; Security Control Assessor (SCA), an independent reviewer; Common Control Provider (CCP), the facility for server-room access; Authorizing Official (AO), the exercise authority; a Program Security Officer (PSO) only if assigned. Steps: NIST SP 800-37 Revision 2, with the April 2016 JSIG mapped in (SP 800-53 Revision 4, CNSSI 1253 of March 2014). Controls: the SP 800-53 Revision 5 release the authority adopts; map revisions explicitly."
      ],
      [
        "Mission and stakeholders",
        "Missions and business processes the system supports (P-8); everyone with an interest in it (P-9).",
        "SBD Learning Enclave, the System Hub build (domain sbd.test), supports a fictional internal engineering team: sign-in, shared files, an internal web application and its database, licensing, and certificates. Stakeholders: the engineering users, the system owner, the owners of engineering files and application records, administrators at each tier, the audit custodians, and the exercise authority."
      ],
      [
        "Assets and boundary",
        "Assets to protect (P-10); the authorization boundary the AO determines (P-11), with management paths, shared services, and external dependencies.",
        "Eight VLANs, 21 named systems, and 50 Windows workstations: directory and DNS, an offline root and issuing CA, DHCP with 802.1X admission, time, file, database, licensing, web, logging, scanning, endpoint, update, and administration services. The core switch’s management, the hypervisor hosts and their console (named in text, not in the inventory), and common-control responsibilities must be resolved in the exercise. Endpoint protection (SBD-EPO01) and credentialed scanning (SBD-NESSUS01) are in the design, but their build courses, 1.9 and 1.10, are coming soon: record them as planned components until they exist."
      ],
      [
        "Information types and life cycle",
        "Information the system processes, stores, and transmits (P-12), and each type’s path from creation to disposal (P-13), including boundary transfers.",
        "Engineering files on SBD-FS01; application records in SBD-SQL01, reached only through SBD-APPS01; identities and credentials in the directory; certificates and keys in the PKI; and the audit record, from SBD-SYSLOG01 to SBD-SPLUNK01 and SBD-AUDIT01. The network has no external link: transfers are manual, human-controlled, and use approved removable media. There is no backup server: custodians carry backup copies to the offline cabinet under the media custody procedure. Retention periods are dependent on your environment; record the values chosen."
      ],
      [
        "Early risk picture",
        "The first system risk assessment (P-14): threats, weaknesses or conditions, likely consequences, and assumptions. Module 04 carries it into the draft Risk Assessment Report (RAR).",
        "Leading concerns for an isolated network: misuse of administrative access, and malicious or unapproved content arriving on transfer media. Known condition: no credentialed vulnerability scanning yet, so flaw visibility rests on SCAP Compliance Checker and Security Technical Implementation Guide (STIG) results. Assumption to test: every system’s events reach central review."
      ],
      [
        "Requirements and allocation",
        "Security and privacy requirements (P-15), the system’s place in the architecture (P-16), and where each requirement lands (P-17), including candidate common controls.",
        "Requirements come from the exercise authority and the selected practice controls. The enclave stands alone: no shared enterprise service crosses its boundary. Most requirements land on the system’s own components; the server room’s badge access and logged entry are a candidate common control from the facility. Privacy: user accounts hold people’s names; record the privacy applicability decision and who made it."
      ],
      [
        "Categorization basis",
        "Method and authority, the information types considered, and where the result is recorded and approved. Completed in module 03.",
        "Method: the one the exercise authority assigns, either Federal Information Processing Standard (FIPS) 199 with SP 800-60 for a federal system, or CNSSI 1253 for a national security system. Exercise planning input: Moderate confidentiality, Low integrity, Low availability. Record the rationale in the System Security Plan’s security categorization section and route it for approval (C-3); these labels are not an authorization."
      ]
    ],
    "note": "The scope record is an exercise starter. The relevant authority determines the formal boundary, categorization, and approval requirements."
  },
  {
    "id": "registration",
    "title": "System registration",
    "module": "02",
    "kind": "Registration record",
    "short": "REG",
    "owner": "System owner (ISO)",
    "purpose": "Register the system with the office the organization or program designates, so it is known, tracked, and accountable before the package grows. NIST registers in Prepare (P-18); the JSIG in Categorize (Task 1-3).",
    "fields": [
      [
        "System identity",
        "Name, registration number, owner, and points of contact.",
        "SBD Learning Enclave (domain sbd.test), exercise registration REG-001. System owner (Information System Owner, ISO): training role. Information System Security Manager (ISSM) and Officer (ISSO): learner team."
      ],
      [
        "Registered with",
        "The office the organization designates (NIST P-18) or, for a Special Access Program (SAP) system, the appropriate SAP Service/Agency Authorizing Official (AO) or designee (JSIG Task 1-3).",
        "The exercise authority, acting as the AO’s designee. Status: submitted, awaiting acceptance."
      ],
      [
        "Purpose and characteristics",
        "The mission in a sentence or two, location, connections, and operating status.",
        "Supports a fictional internal engineering team with sign-in, shared files, an internal web application and its database, licensing, and certificates. One building, no external network connection, transfers on approved removable media only. Status: operating as built in the Build the Network courses; SBD-EPO01 and SBD-NESSUS01 planned."
      ],
      [
        "Boundary summary",
        "What the authorization covers, with a reference to the documented boundary.",
        "Eight VLANs and the offline root CA (SBD-ROOTCA01): 21 named systems, two of them planned, and 50 Windows workstations. Details in the scope record’s assets and boundary."
      ],
      [
        "Categorization and plan status",
        "The approved security categorization, the System Security Plan reference, and the authorization status.",
        "Categorization: not yet approved (exercise planning input Moderate, Low, Low; module 03). Plan: draft SSP-001. Authorization: none recorded."
      ],
      [
        "Update triggers",
        "Changes that require an update to the registration.",
        "Update when the categorization is approved or changes, when the boundary or owner changes, after each authorization decision, and when the system is decommissioned."
      ]
    ],
    "note": "A fictional exercise record. The registering office, the required content, and the format follow the organization’s or program’s policy."
  },
  {
    "id": "ssp",
    "title": "System Security Plan",
    "module": "03",
    "kind": "System description to as-built controls",
    "short": "SSP",
    "owner": "System owner with the security team and engineers",
    "purpose": "Describe the system and its categorization, record the plan’s approval, and explain how each selected control is implemented.",
    "fields": [
      [
        "System description",
        "Name, identifier, mission, boundary, components, environment, and references (NIST C-1; JSIG 1-2).",
        "SBD Learning Enclave, the System Hub build (domain sbd.test): 21 named systems, including the offline root CA, and 50 Windows workstations across eight VLANs. Boundary, inventory, and architecture follow the system scope record. SBD-EPO01 and SBD-NESSUS01 are planned components; their courses are coming soon."
      ],
      [
        "Security categorization",
        "Information types; confidentiality, integrity, and availability impacts with rationale; method; reviewer; approval (C-2, C-3; JSIG 1-1).",
        "Exercise planning input from the scope record: Moderate confidentiality, Low integrity, Low availability, with its rationale and recorded review. These labels are exercise input, not an authorization result."
      ],
      [
        "Plan review and approval",
        "Version reviewed, reviewer and role, date, decision, and any conditions (S-6; JSIG 2-4).",
        "Exercise record: the draft SSP and SCTM were reviewed and approved as the plan to implement by the training AO designee. Approving the plan is not an authorization to operate."
      ],
      [
        "As-implemented control statements",
        "Control ID and adopted revision, approved parameters (from the SCTM), and who does what, where, when, and with which records (I-2; JSIG 3-2).",
        "AU-2, AU-3, AU-12: the domain controllers and other Windows systems generate the defined event set with the required record content and forward it to SBD-SYSLOG01 by Windows Event Forwarding (F17); the Linux servers send syslog over TLS (F07). The collector feeds SBD-SPLUNK01 (F10) and archives to SBD-AUDIT01 (F11). AU-6: the assigned analyst reviews the events in Splunk on the approved schedule and records each exception and its follow-up."
      ],
      [
        "Evidence and responsibilities",
        "Evidence identifiers, owners, provider dependencies, and review status.",
        "Evidence index EI-001: EV-001 event configuration, EV-002 source inventory, EV-004 review record, EV-005 collector configuration results. Operations supplies the records; the assessor evaluates the selected objectives and adds test records such as EV-003."
      ],
      [
        "Limitations and planned work",
        "Separate what operates from planned work and known gaps.",
        "Verified collection from SBD-MGMT01 is unresolved (FND-001, tracked as PM-001); do not describe complete source coverage until a reassessment verifies the fix. Credentialed vulnerability scanning is not available yet and is recorded as a limitation."
      ],
      [
        "Recorded risk decisions",
        "Risk responses, rationale, mitigation, decision owner, and review trigger.",
        "None recorded in this excerpt. When a risk response is made, record its rationale and the remaining risk (RA-7) and keep it separate from POA&M tracking (CA-5); accepting risk is the AO’s authorization decision (CA-6)."
      ]
    ],
    "note": "The example is an excerpt, not a full SSP or a finding of compliance. In the JSIG, the SSP also includes the SCTM, the continuous monitoring strategy, and a Risk Assessment Report; this course keeps them as separate practice artifacts."
  },
  {
    "id": "sctm",
    "title": "Security Controls Traceability Matrix",
    "module": "04",
    "kind": "Requirement to implementation",
    "short": "SCTM",
    "owner": "System owner (ISO) and security team, with implementation owners",
    "purpose": "Record each selected control’s source, tailoring, parameters, allocation, and inheritance, then trace it to implementation, evidence, and results. Started in Select; module 05 adds the as-implemented statements.",
    "columns": [
      "Control",
      "Selection and tailoring",
      "Parameters",
      "Allocation and inheritance",
      "Implementation and trace"
    ],
    "template": [
      "[ID / title / adopted revision]",
      "[Baseline or overlay source; tailoring decision, rationale, approval]",
      "[Organization-defined values and their source]",
      "[System-specific, common, or hybrid; provider and what it supplies; components; owner]",
      "[Planned (module 04), then as implemented (module 05); evidence, result, and finding IDs]"
    ],
    "rows": [
      [
        "AU-2 Event Logging (SP 800-53 Revision 5)",
        "Exercise baseline; selected as written.",
        "Event types: the Windows and Linux set in the selection register. Review frequency: dependent on your environment; record the value chosen.",
        "System-specific: every Windows system and Linux server. Owner: logging owner.",
        "As implemented: Windows Event Forwarding (F17) and syslog over TLS (F07) to SBD-SYSLOG01. EV-001; pending assessment."
      ],
      [
        "AU-6 Audit Record Review, Analysis, and Reporting",
        "Exercise baseline; selected as written.",
        "Review frequency and who receives findings: dependent on your environment; record the values chosen. Activity to look for: listed in the review procedure.",
        "System-specific: the assigned analyst, in SBD-SPLUNK01.",
        "As implemented: the analyst reviews defined sources; the scope must include SBD-MGMT01. EV-002, EV-004; FND-001."
      ],
      [
        "AU-12 Audit Record Generation",
        "Exercise baseline; selected as written.",
        "Components: every system in the audit source inventory. Who selects event types: the logging owner.",
        "System-specific: sources generate, SBD-SYSLOG01 collects, SBD-AUDIT01 keeps the protected record.",
        "As implemented: the SBD-MGMT01 path is not yet verified. EV-001, EV-003; FND-001."
      ],
      [
        "RA-5 Vulnerability Monitoring and Scanning",
        "Exercise baseline. A not-applicable proposal was declined: difficulty isn’t a reason.",
        "Scan frequency and remediation response times: dependent on your environment; record the values chosen.",
        "System-specific: SCAP Compliance Checker and Security Technical Implementation Guide (STIG) results from the administration seats. Credentialed scanning: planned, not built.",
        "Recorded limitation; Risk Assessment Report (RAR) risk RSK-002."
      ],
      [
        "PE-3 Physical Access Control",
        "Exercise baseline; selected as written. Inheritance claimed in part.",
        "Entry points, access devices, and inventory and key-change frequencies: per the facility’s direction.",
        "Hybrid: the facility’s badge access and entry log for the server room (common); the system team controls the offline vault (system-specific).",
        "Provider’s control description and assessment information requested; no evidence yet."
      ]
    ],
    "note": "Mappings are instructional. Expand rows to the exact selected control parts and assessment objectives; a single record doesn’t prove an entire control. In the JSIG, the SCTM is part of the System Security Plan."
  },
  {
    "id": "rar",
    "title": "Risk Assessment Report",
    "module": "04",
    "kind": "Risk analysis",
    "short": "RAR",
    "owner": "System owner (ISO) with the ISSM and ISSO",
    "purpose": "Record the risks that remain with the selected controls, how likely and harmful each is, and what the assessment must confirm. Drafted in Select as a JSIG Step 2 output; module 08 updates it with assessment results.",
    "columns": [
      "Risk",
      "Planned safeguards",
      "Likelihood and impact",
      "Risk level",
      "Response and next update"
    ],
    "template": [
      "[RSK-ID: threat event, the weakness or condition it exploits, and what it affects]",
      "[Selected controls from the Security Controls Traceability Matrix (SCTM) that address it]",
      "[Ratings and reasons, using the authority’s method and scale]",
      "[Result, confidence, and assumptions]",
      "[Planned response and owner; what the assessment must confirm (module 08)]"
    ],
    "rows": [
      [
        "RSK-001: Misuse of administrative access on a management host goes unnoticed because its events don’t reach central review.",
        "AU-2, AU-6, AU-12; tiered administration (AC-6)",
        "Likelihood: moderate; administrators work on these hosts daily, and one missed source hides their actions. Impact: moderate; engineering records and directory changes are at stake.",
        "Moderate (exercise rating). Assumes every source reaches SBD-SYSLOG01.",
        "Assessment verifies coverage for every management host. Owner: logging owner."
      ],
      [
        "RSK-002: A missing patch or weak setting goes undetected because credentialed vulnerability scanning isn’t available yet.",
        "RA-5 with SCAP Compliance Checker and Security Technical Implementation Guide (STIG) results; SI-2 through SBD-WSUS01 and SBD-REPO01; CM-6",
        "Likelihood: moderate; benchmark scans don’t find every flaw. Impact: moderate.",
        "Moderate (exercise rating). A recorded limitation, not a tailoring decision.",
        "Keep the gap visible; the monitoring strategy reviews scan coverage. Owner: vulnerability owner."
      ],
      [
        "RSK-003: Malicious or unapproved content arrives on removable media during a manual transfer.",
        "The approved transfer procedure; package and update verification before SBD-REPO01 and SBD-WSUS01 publish them",
        "Likelihood: low; every transfer is human-controlled and recorded. Impact: moderate.",
        "Low (exercise rating).",
        "Assessment examines transfer records and checks. Owner: change owner."
      ]
    ],
    "note": "Ratings are exercise values, not an assessment of any real system; use the method and scale your authority directs. In the JSIG’s authorization package, the System Security Plan includes a RAR (Task 5-2). Only the AO accepts risk."
  },
  {
    "id": "monitoring",
    "title": "Continuous monitoring strategy",
    "module": "04",
    "kind": "Maintain the authorization basis",
    "short": "MON",
    "owner": "System owner (ISO) with control owners; approved by the Authorizing Official (AO)",
    "purpose": "Define what is monitored, how often, by whom, and what triggers action, so the authorization basis stays current. Written in Select (S-5; JSIG Task 2-3) and run in module 12.",
    "columns": [
      "Activity",
      "Owner",
      "Frequency / trigger",
      "Evidence and escalation"
    ],
    "template": [
      "[Monitoring activity and the NIST and JSIG task it serves]",
      "[Role]",
      "[Frequency or trigger approved in the strategy]",
      "[Record produced / threshold / action]"
    ],
    "rows": [
      [
        "Control monitoring and ongoing assessment (M-2 · Task 6-2)",
        "Control owners; the Security Control Assessor (SCA) for assessments",
        "Per control, as the strategy sets and the AO approves",
        "Audit source coverage; SCAP Compliance Checker and Security Technical Implementation Guide (STIG) scan coverage and results, noting that credentialed scanning isn’t available yet; current provider evidence for inherited controls; the course 1.12 restore exercise. A failed check opens a finding."
      ],
      [
        "Security impact analysis (M-1 · Task 6-1)",
        "Change owner with the Information System Security Manager (ISSM)",
        "Before a relevant change, and again after it is verified",
        "Impact record; notify the SCA; revise affected package records as required"
      ],
      [
        "Remediation and record updates (M-3, M-4 · Tasks 6-3, 6-4)",
        "System owner (ISO) and remediation owners",
        "Findings from monitoring, risk assessment updates, and open Plan of Action and Milestones (POA&M) items",
        "Updated System Security Plan, Security Assessment Report, and POA&M, keeping the original information needed for oversight and audit"
      ],
      [
        "Security status reporting (M-5 · Task 6-5)",
        "System owner (ISO)",
        "Time driven, event driven, or both, as the AO directs",
        "Status report to the AO or designee, who reviews whether the risk remains acceptable (M-6 · Task 6-6)"
      ],
      [
        "Decommissioning (M-7 · Task 6-7)",
        "System owner (ISO)",
        "When the system is removed from operation",
        "Media sanitization, an AO-approved records retention plan, inventory updates, notifications, review of inherited relationships, and a decommission letter"
      ]
    ],
    "note": "Frequencies and thresholds are dependent on your environment and set by the applicable direction and system risk; this example doesn’t prescribe universal intervals. Module 12 runs the strategy and records each security impact analysis."
  },
  {
    "id": "evidence",
    "title": "Master evidence index",
    "module": "06",
    "kind": "Evidence inventory",
    "short": "BoE",
    "owner": "Evidence custodian and control owners",
    "purpose": "Make every supporting record retrievable, attributable, current, and traceable to the objectives it supports.",
    "columns": [
      "ID",
      "Record",
      "Scope / owner",
      "Collection / version",
      "Supports"
    ],
    "template": [
      "[EV-ID]",
      "[Title and approved location]",
      "[System scope / owner]",
      "[Date / version / reviewer]",
      "[Control, objective, and limits]"
    ],
    "rows": [
      [
        "EV-001",
        "Selected-event configuration export (Windows Event Forwarding subscription)",
        "Windows systems / operations",
        "Training snapshot / v1",
        "AU-2 event selection and AU-12 generation checks"
      ],
      [
        "EV-002",
        "Audit source inventory",
        "Enclave / operations",
        "Training snapshot / v1",
        "AU-12 coverage; no verified events from SBD-MGMT01 (known gap, then FND-001)"
      ],
      [
        "EV-003",
        "Sample account-change event, followed to SBD-SPLUNK01",
        "SBD-DC01 / assessor",
        "Assessment test T-001",
        "AU-3 record content and AU-12 generation for that event only"
      ],
      [
        "EV-004",
        "Analyst review record",
        "Selected sources / analyst",
        "Training review / v2, after FND-002",
        "AU-6 review, exceptions, and their follow-up"
      ],
      [
        "EV-005",
        "SCAP Compliance Checker results and reviewed STIG checklist",
        "SBD-SYSLOG01 / operations",
        "Training scan / v1",
        "Collector configuration (CM-6), for the checks scanned only"
      ]
    ],
    "note": "This index describes sample records. The referenced technical exports are exercise specifications, not attached operational evidence. Keep superseded versions: the assessment refers to the versions it received."
  },
  {
    "id": "assessment",
    "title": "Security Assessment Plan",
    "module": "07",
    "kind": "Assessment design",
    "short": "PLAN",
    "owner": "Control assessor and system owner",
    "purpose": "Define who assesses, what they receive, and what will be assessed and how, so the results are defensible.",
    "fields": [
      [
        "Assessor and independence",
        "Assessor or team, who selected them, and the independence they provide (NIST A-1).",
        "Exercise plan AP-001. A training assessor who did not build or operate the logging pipeline, selected by the exercise AO’s designated representative."
      ],
      [
        "Evidence received",
        "Documents and records handed over, with versions, dates, and known exceptions.",
        "SSP-001 and SCTM-001 at their recorded versions; evidence index EI-001 (EV-001, EV-002, EV-004, EV-005); the known SBD-MGMT01 coverage gap recorded in the SSP and EV-002."
      ],
      [
        "Scope and objectives",
        "System and version, selected controls and objectives, exclusions, assumptions.",
        "Selected AU-2, AU-3, AU-6, and AU-12 objectives for the domain controllers, the management hosts, and the collection path through SBD-SYSLOG01 to SBD-SPLUNK01 and SBD-AUDIT01. Use the adopted SP 800-53A procedures."
      ],
      [
        "Methods, objects, and expected results",
        "Examine, interview, or test for each objective; objects; coverage and sampling rationale; expected results.",
        "Examine the event configuration and source records; interview the analyst; test an approved account-change event on SBD-DC01. Negative tests: replay the attack drill’s six attempts. Expected: selected events reach the review process for every in-scope source, and every drill attempt is refused."
      ],
      [
        "Responsibilities, schedule, and approval",
        "Assessor, system contacts, dates, and the plan’s review and approval (A-2; JSIG 4-1; CA-2).",
        "Training roles for the assessor and operations. AP-001 is reviewed and approved before testing: by the SCA in JSIG terms, or by the AO or designated representative in NIST’s."
      ],
      [
        "Limitations and safety",
        "Collection limits, access needs, constraints, authorized test conditions.",
        "Use the supplied fictional data or a permitted lab. Record failed collection or inaccessible sources as limitations, never as passes."
      ]
    ],
    "note": "Assessment plan is written in full here to avoid confusing its acronym with Special Access Program. In the JSIG, the Security Assessment Plan is made up of the SSP, the SCTM, and the Security Control Assessment Procedures; this excerpt shows the procedures."
  },
  {
    "id": "sar",
    "title": "Security Assessment Report",
    "module": "08",
    "kind": "Observed assessment results",
    "short": "SAR",
    "owner": "Control assessor (the JSIG’s security control assessor)",
    "purpose": "Record what was assessed, what was observed, the findings and limitations, and the result of any reassessment.",
    "fields": [
      [
        "Assessment basis",
        "Approved plan, scope and version, objectives, dates, assessor.",
        "SAR-001, against approved plan AP-001: the selected logging objectives and the attack drill’s six negative tests, using the evidence versions listed in EI-001."
      ],
      [
        "Observed results",
        "Actual observation and evidence for each objective; satisfied or other than satisfied.",
        "The sample account-change event reached SBD-SPLUNK01 and the analyst’s review (EV-003, EV-004), which supports the selected objectives for that event only. All six drill attempts were refused, as recorded in the traffic matrix’s Operational verification column. EV-002 does not establish coverage for SBD-MGMT01."
      ],
      [
        "Findings",
        "Finding ID, affected scope, requirement and objective, evidence, effect.",
        "FND-001: audit coverage for management host SBD-MGMT01 is unverified; the related AU-12 and AU-6 objectives are other than satisfied. FND-002: the review record shows an exception without its follow-up (AU-6)."
      ],
      [
        "Conclusions and limitations",
        "Supported determinations, missing support, scope limits.",
        "Report the identity-event result only as observed. Do not extend it to every host or to all of AU-2, AU-3, AU-6, or AU-12."
      ],
      [
        "Recommendations",
        "Corrections the assessor recommends and, in the JSIG, the SCA’s recommended authorization decision.",
        "Restore and verify collection from SBD-MGMT01; require exception follow-up in every review record. The exercise SCA’s recommendation goes to the AO with the report; only the AO decides."
      ],
      [
        "Initial remediation and reassessment",
        "What was corrected, the reassessment result, and the original finding kept (A-5; JSIG 4-4).",
        "FND-002: the analyst recorded the follow-up and the review procedure now requires it; reassessment (examine, interview) found the AU-6 objective satisfied. FND-001 needs a scheduled change, so it stays open as PM-001. Both findings stay in the report."
      ]
    ],
    "note": "The report is a fictional excerpt for practicing traceability and assessment writing. A reassessment adds results to the report; it never removes the original finding."
  },
  {
    "id": "poam",
    "title": "Plan of Action and Milestones",
    "module": "09",
    "kind": "Accountable corrective action",
    "short": "POA&M",
    "owner": "System owner and remediation owner",
    "purpose": "Turn an open finding into a risk-ranked, resourced, dated plan that the AO can review and use to monitor progress.",
    "fields": [
      [
        "Finding and affected scope",
        "POA&M ID, finding ID, controls and objectives, affected assets.",
        "PM-001 / FND-001: SBD-MGMT01 is not fully represented in verified audit collection. Map the affected objectives in the SCTM and the risk in the RAR."
      ],
      [
        "Risk and priority",
        "Threat, exposure, mission consequence, current safeguards, uncertainty, and the resulting rank.",
        "Privileged activity on a management host may be missed by centralized review. The exercise team weighs the local records still available before assigning contextual risk and its rank."
      ],
      [
        "Owner, resources, and milestones",
        "Accountable owner, actions, resources, target dates, dependencies.",
        "Operations lead, with a scheduled change window. Exercise milestones: confirm configuration by {+14}; perform the event test by {+21}; verify review coverage by {+30}. Sample dates are set 14, 21, and 30 days from today."
      ],
      [
        "Closure criteria",
        "What must be verified, by whom, and with which record.",
        "The assessor reassesses: the approved events from SBD-MGMT01 reach SBD-SYSLOG01 and Splunk and are reviewed. Then update EV-002, the SSP, the RAR, and the SAR disposition, keeping the original finding."
      ],
      [
        "Status and decision",
        "Open or closed, milestone updates, the AO’s review, any risk decision reference.",
        "Open in this example. The AO reviews the plan and monitors progress; no risk acceptance or authorization is implied by this entry. Only the AO can accept risk (CA-6)."
      ]
    ],
    "note": "Milestone tracking and risk acceptance are separate responsibilities. Follow the authority’s required POA&M format. FND-002 has no entry because it was fixed and reassessed during the assessment."
  },
  {
    "id": "manifest",
    "title": "Authorization package manifest",
    "module": "10",
    "kind": "Versioned package assembly",
    "short": "PKG",
    "owner": "System owner and package coordinator",
    "purpose": "Identify the exact records submitted for the AO’s decision, what each one satisfies (JSIG Task 5-2, NIST Task R-1), and whether their scope and versions agree.",
    "note": "The JSIG sets a minimum and the AO can direct more; the applicable authority sets the format and submission path. This manifest does not establish submission or approval.",
    "columns": [
      "Package component",
      "Basis",
      "Identifier / version",
      "Owner",
      "Review check"
    ],
    "template": [
      "[Required component]",
      "[JSIG 5-2 / NIST R-1 / AO direction]",
      "[Document ID / version / date]",
      "[Responsible role]",
      "[Required review / status]"
    ],
    "rows": [
      [
        "Executive summary",
        "NIST R-1; JSIG: as the AO directs",
        "ES-001 / v1",
        "System owner",
        "Residual risk agrees with the SAR, RAR, and POA&M"
      ],
      [
        "System Security Plan, with the SCTM, continuous monitoring strategy, and RAR",
        "JSIG 5-2 minimum; NIST R-1 security plan",
        "SSP-001 / v1; SCTM-001; MON-001; RAR-001",
        "System owner",
        "21 named systems (two planned) and 50 workstations, matching the inventory"
      ],
      [
        "Security Assessment Report",
        "JSIG 5-2 minimum; NIST R-1 assessment report",
        "SAR-001 / v1",
        "Security control assessor",
        "Objectives, limitations, and the recommendation are clear; credentialed scanning (RA-5) shown as a limitation"
      ],
      [
        "Plan of Action and Milestones",
        "JSIG 5-2 minimum; NIST R-1",
        "PM-001 / v1",
        "System owner / remediation owner",
        "FND-001 linked and open, with dated milestones"
      ],
      [
        "Privacy and additional evidence",
        "NIST R-1 privacy plans and assessments; JSIG: as the AO directs",
        "Privacy applicability record; EI-001; AP-001",
        "Privacy role / security team",
        "Included where required or directed; identifiers and versions agree"
      ]
    ]
  },
  {
    "id": "summary",
    "title": "Executive risk summary",
    "module": "10",
    "kind": "Package executive summary and AO briefing",
    "short": "BRIEF",
    "owner": "System owner with risk stakeholders",
    "purpose": "Give the AO the system, the assessed posture, the significant risk, and the decision requested on one page: the package’s executive summary and the basis of the briefing.",
    "note": "The summary informs the decision; it doesn’t make it. Keep recommendations separate from the AO’s recorded decision and its conditions.",
    "fields": [
      [
        "System and mission",
        "What the system enables, its boundary and categorization, the authority, and the package version under review.",
        "SBD Learning Enclave (exercise), domain sbd.test, supporting a fictional internal engineering team: eight VLANs, 21 named systems (two planned, not built), 50 Windows workstations, and the offline root CA. Exercise planning categorization: Moderate confidentiality, Low integrity, Low availability. Package PKG-001 v1."
      ],
      [
        "Assessment result",
        "Significant supported results, limitations, and the assessor’s recommendation, quoted from the SAR.",
        "Selected identity-event behavior was observed (EV-003, EV-004). Complete management-host logging coverage is unverified (FND-001). There is no credentialed vulnerability scanning, so RA-5 rests on SCAP Compliance Checker and STIG results and is reported as a limitation. SBD-ROOTCA01 is assessed only during its key ceremonies. The assessor’s recommendation is quoted from the SAR, not rewritten."
      ],
      [
        "Risk to the mission",
        "Consequences, likelihood, uncertainty, existing safeguards, and the significant open findings, consistent with the RAR.",
        "A gap in SBD-MGMT01’s audit visibility could delay detection of privileged activity on the inventory server. Safeguards in place: Tier 1 administration only from SBD-ADMIN-SRV01 (rule A02) and the server’s own Security log. The risk response records its rationale (RA-7); the AO decides whether the remaining risk is acceptable (CA-6)."
      ],
      [
        "Proposed response",
        "For each significant risk: mitigate (POA&M actions, conditions), accept, or avoid, with owners and alternatives.",
        "FND-001: mitigate through PM-001 (confirm configuration by {+14}, test the event by {+21}, verify review by {+30}), with an interim condition: the ISSO reviews SBD-MGMT01’s local Security log at an interval the AO sets. RA-5: report the limitation and revisit it when a credentialed scanning capability exists. These are proposals for the AO."
      ],
      [
        "Decision requested",
        "The decision requested (ATO, IATT, or DATO), the proposed duration, and who is authorized to decide.",
        "Request the AO’s evaluation for an ATO with the conditions above, for a duration the AO sets. The learner briefing grants nothing; only the AO decides."
      ]
    ]
  },
  {
    "id": "decision",
    "title": "Authorization decision document",
    "module": "11",
    "kind": "Fictional decision exercise",
    "short": "DEC",
    "owner": "Authorizing official (played by the reviewer)",
    "purpose": "Practice recording what an AO’s decision contains: the decision, its terms and conditions, its duration, and what monitoring must report.",
    "note": "Exercise material only. A real authorization decision document is issued and signed by the appointed AO under the governing authority; nothing in this course grants an ATO, IATT, or DATO.",
    "fields": [
      [
        "System and scope",
        "System name, boundary, and the package version the AO reviewed.",
        "SBD Learning Enclave (exercise), domain sbd.test: eight VLANs, 21 named systems (two planned, not built), 50 Windows workstations, and the offline root CA. Package PKG-001 v1, as listed in the manifest."
      ],
      [
        "Decision",
        "ATO, IATT, or DATO (JSIG); NIST also names authorization to use, common control authorization, and denial. Who decided, and when.",
        "Exercise decision: ATO, with the terms and conditions below, recorded by the reviewer acting as AO at the end of the exercise briefing. Another reviewer could reasonably decide differently."
      ],
      [
        "Terms and conditions",
        "What must be done, maintained, or limited for the decision to stand, and who is responsible.",
        "1. Complete PM-001; the assessor verifies SBD-MGMT01’s audit collection by {+30}, and the result goes to the AO. 2. Until then, the ISSO reviews SBD-MGMT01’s local Security log at an interval the AO sets and records each review. 3. No change to a documented information flow without a security impact analysis. 4. Credentialed vulnerability scanning (RA-5) stays a reported limitation until a capability is assessed."
      ],
      [
        "Duration",
        "Time-driven (an end date) or ongoing authorization backed by robust continuous monitoring, and the events that trigger an earlier review.",
        "Exercise value: time-driven, ending {+180}, with an earlier review if a condition is missed or a significant change occurs. A real duration is the AO’s to set."
      ],
      [
        "Monitoring and reporting",
        "What the system owner reports, when (event-driven, time-driven, or both), and to whom.",
        "Each status report covers PM-001’s milestones, the interim SBD-MGMT01 reviews, completed security impact analyses, and the ongoing assessments the continuous monitoring strategy schedules. Report at once: lost event collection from any source, a missed update in any ring, or a condition that can’t be met."
      ],
      [
        "Authority and signature",
        "Who signed, under which authority, and what the record is not.",
        "Exercise only: signed by the reviewer acting as AO for training. Only the appointed AO issues and signs a real authorization decision document; this record grants nothing."
      ]
    ]
  },
  {
    "id": "sia",
    "title": "Security impact analysis",
    "module": "12",
    "kind": "Change impact record",
    "short": "SIA",
    "owner": "System owner with the ISSM and ISSO",
    "purpose": "Decide what a proposed or actual change does to the security posture before it goes ahead: which controls and records it touches, what must be reassessed, and who must be told (NIST M-1, JSIG 6-1).",
    "note": "The authority’s change process decides who approves a change and when the AO must be engaged. The example is a fictional change to the practice system.",
    "fields": [
      [
        "Change",
        "Change ID, what changes and why, requester, proposed date, affected components and information flows.",
        "SIA-001 (exercise): register a second licensed engineering application on SBD-APPS01. Its vendor licensing port is added to rule F12 for the VLAN 80 workstations. Requested by the application owner for {+21}."
      ],
      [
        "Security impact",
        "Affected controls, implementations, and evidence, and the effect on each: better, worse, or unknown.",
        "New software and a changed information flow. CM-6: SBD-APPS01’s configuration baseline and a SCAP Compliance Checker rescan. SI-2: how the vendor’s updates are brought in and approved; they don’t arrive through SBD-WSUS01. AU-2 and AU-12: which license events are recorded and forwarded (F17). CP-9: the course 1.12 recovery set adds the application’s configuration. RA-5: no credentialed scan covers it; record the limitation."
      ],
      [
        "Determination",
        "Significant or not, and why; what must be reassessed; whether the boundary or categorization changes.",
        "Exercise determination: the boundary and categorization don’t change, but a documented information flow and the software baseline do. Reassess CM-6, SI-2, AU-2, and AU-12 for SBD-APPS01 before go-live, and recommend to the AO that the change fits the current authorization with an updated package."
      ],
      [
        "Notifications and approvals",
        "Who is told or must approve before the change: SCA, ISSM, change board, AO or designee.",
        "Notify the SCA (JSIG 6-1) and the ISSM. The change board reviews the F12 change, and the AO or designee reviews this analysis before the port is opened."
      ],
      [
        "Records to update",
        "Which package records change, who updates them, and which versions are kept.",
        "The inventory on SBD-MGMT01; the SSP’s description of SBD-APPS01; the F12 row in the rule register; SCTM rows for CM-6, SI-2, AU-2, AU-12, and CP-9; new evidence (the rescan, a sample license event, the recovery set entry); a SAR addendum after reassessment. Keep the prior versions (JSIG 6-4)."
      ],
      [
        "Outcome",
        "Approved, deferred, or rejected; the reassessment result; date closed; the status report that carried it.",
        "Open in this example. Close it once the reassessment results are recorded and the change appears in the next status report to the AO."
      ]
    ]
  }
];

// Course 2.3 capstone: the authorization package exercise.
window.CAPSTONE = {
  "deliverables": [
    "Authorization package manifest covering the JSIG Task 5-2 minimum and the NIST Task R-1 executive summary, with the scope, registration, and categorization records the package rests on.",
    "SSP excerpt with its SCTM, continuous monitoring strategy, and RAR, covering the selected practice objectives.",
    "Evidence index, Security Assessment Plan, and SAR excerpt with supported conclusions and visible limitations, including RA-5 scanning coverage.",
    "At least two justified findings with POA&M entries and one remediation retest record, with any risk response (RA-7) presented for the AO’s acceptance decision (CA-6).",
    "Executive risk summary, five-minute AO briefing, a fictional authorization decision record (type, terms and conditions, duration), and one security impact analysis with a status report."
  ],
  "scopeTitle": "Nine controls, one coherent story",
  "scopeControls": "AC-2 · AU-2 · AU-3 · AU-6 · AU-12 · CM-6 · RA-5 · SI-2 · CP-9",
  "scopeText": [
    "Record the exact adopted requirements, parameters, and assessment objectives. This selection is a teaching subset; the actual system baseline follows its governing authority.",
    "Use the logging trail in the Body of Evidence as the model: FND-001, SBD-MGMT01 missing from verified audit collection. Add a second finding from the rest of the scope. RA-5 is a good candidate: the SCAP Compliance Checker and Security Technical Implementation Guide (STIG) results cover configuration, but the network has no credentialed vulnerability scanning, so record that as a gap or limitation, never as a passed test. CM-6, SI-2 (SBD-WSUS01 and SBD-REPO01), and CP-9 (the course 1.12 restore record) offer others. Only the AO can accept risk (CA-6)."
  ],
  "rubric": [
    [
      "Package completeness and consistency",
      "20",
      "The manifest covers the JSIG 5-2 minimum and the NIST R-1 executive summary; scope, inventory, identifiers, and versions agree."
    ],
    [
      "Traceability",
      "25",
      "Each selected objective links to implementation, evidence, and a conclusion or explicit gap."
    ],
    [
      "Assessment quality",
      "20",
      "Methods and observations support conclusions; limitations, including RA-5 scanning coverage, stay visible."
    ],
    [
      "Risk determination and response",
      "20",
      "Risk relates to mission impact; each significant risk has a proposed response, and POA&M actions have owners, dates, and verification criteria."
    ],
    [
      "Decision record and monitoring",
      "15",
      "The briefing is clear; the decision record has a type, terms and conditions, and a duration; the change is analyzed and reported through the right records."
    ]
  ],
  "rubricNote": "Completion threshold: 80 of 100 points. Revisions are required for unsupported successful assessment claims, inconsistent boundaries, or a claim that the learner granted a real ATO. Course completion is a training outcome; only the AO issues an authorization decision.",
  "sequence": [
    [
      "01 / ASSEMBLE",
      "Reconcile the package",
      "Check the JSIG 5-2 minimum and the NIST R-1 contents, then identifiers, scope, dates, versions, findings, and open actions."
    ],
    [
      "02 / DETERMINE",
      "Brief the risk",
      "Explain mission need, significant results, limitations, and the response you propose for each significant risk."
    ],
    [
      "03 / DECIDE",
      "Record the decision",
      "The reviewer, acting as AO, questions the evidence and records a fictional ATO, IATT, or DATO with terms, conditions, and a duration."
    ],
    [
      "04 / MONITOR",
      "Process the change",
      "Run a security impact analysis, update the affected records, and send the status report the decision asks for."
    ]
  ],
  "challenges": [
    [
      "The SAR has no credentialed vulnerability scan results. Can RA-5 be marked satisfied?",
      "No. SCAP Compliance Checker and STIG results show configuration compliance, not vulnerability scanning coverage. Record the gap as a limitation or finding, carry it into the RAR and the executive summary, and let the AO weigh it. Plan its assessment for when a credentialed scanning capability exists, and bring that capability in through a security impact analysis."
    ],
    [
      "The AO wants operation to start before FND-001 is fixed. What do you bring?",
      "The risk in mission terms, the safeguards already in place, PM-001’s milestones and verification, and proposed terms and conditions, such as a recorded interim review of SBD-MGMT01’s local Security log. Present them as proposals: the AO decides whether to accept the risk with conditions, wait, or deny. An IATT isn’t the answer; it covers testing, not operation. Record the outcome in the decision record, not in the POA&M."
    ],
    [
      "A new service crosses the documented boundary. What must be reviewed?",
      "Run a security impact analysis: identify the new information flow, owner, data, dependencies, and protection requirements. Revisit the boundary and categorization assumptions, determine the affected controls, notify the SCA, and update the architecture, SSP, evidence, assessment, and risk records. The AO or designee decides whether the change still fits the current authorization."
    ]
  ]
};

// Source documents; modules cite them by number.
window.RMF_SOURCES = [
  [
    "NIST SP 800-37 Revision 2",
    "RMF lifecycle, tasks and outputs, authorization package, roles, and monitoring. See Chapter 3 and Appendix E.",
    "https://csrc.nist.gov/pubs/sp/800/37/r2/final"
  ],
  [
    "NIST SP 800-53 Revision 5",
    "Security and privacy control catalog. Record the release adopted by the governing authority.",
    "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"
  ],
  [
    "NIST SP 800-53A Revision 5",
    "Control assessment procedures and examine, interview, and test methods.",
    "https://csrc.nist.gov/pubs/sp/800/53/a/r5/final"
  ],
  [
    "NIST SP 800-53B",
    "Control baselines, tailoring, and overlays. Apply the appropriate system context.",
    "https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final"
  ],
  [
    "DoDI 8510.01",
    "Risk Management Framework for DoD Systems, July 19, 2022.",
    "https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/851001p.pdf"
  ],
  [
    "DoDM 5205.07",
    "Special Access Program Security Manual, January 17, 2025.",
    "https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/520507m1.PDF"
  ],
  [
    "DCSA Voice of Industry · September 2025",
    "DCSA newsletter for cleared industry on the DAAG transition. Confirm the current guide, version, and effective date with DCSA.",
    "https://www.dcsa.mil/Portals/128/Documents/CTP/tools/250930%20VOI%20Newsletter.pdf"
  ],
  [
    "JSIG · Joint SAP Implementation Guide, 11 April 2016",
    "The six RMF steps, tasks, and outputs for Special Access Program (SAP) systems, built on NIST SP 800-37 Revision 1, SP 800-53 Revision 4, and CNSSI 1253 (March 2014). Confirm whether your program directs it or a successor.",
    "https://www.dcsa.mil/portals/91/documents/ctp/nao/JSIG_2016April11_Final_(53Rev4).pdf"
  ]
];
