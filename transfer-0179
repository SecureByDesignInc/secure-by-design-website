export type RmfStage = {
  slug: string;
  name: string;
  question: string;
  summary: string;
  intro: string;
  nist: string;
  sections: { heading: string; paragraphs: string[] }[];
  jsig: { text: string; section: string; page: number } | null;
  discussion: string[];
  handoff: string;
};

export const stages: RmfStage[] = [
  {
    slug: 'prepare',
    name: 'Prepare',
    question: 'What are we protecting, and why does it matter?',
    summary: 'Start with the work people need to do, the decisions someone has to own, and the questions we still need to answer.',
    intro: 'Before we talk about controls, let’s talk about the work. What is this system supposed to help people accomplish? Who depends on it? You can have a room full of capable people and still get very different answers. Prepare gives us a reason to have that conversation early, whether we’re planning something new or taking a fresh look at something already running.',
    nist: 'NIST’s Prepare guidance brings organizational priorities, risk tolerance, responsibilities, and system context into the same conversation. Preparation happens at both the organization and system levels, with security and privacy considered together.',
    sections: [
      {
        heading: 'Start with the work people need to do',
        paragraphs: [
          'Try describing the mission without naming a product. “We need this platform” tells us what someone wants to buy. We still need to understand the service it will provide, the decisions it will support, and the people who would feel its loss. That explanation gives later security choices something concrete to answer to.',
          'Bring in the people who do that work and the people responsible for the information. Ask what they rely on, where delays cause trouble, and what they would struggle to recover. You may find that the service everyone talks about depends on a much less visible process. That’s a useful discovery to make before the design starts hardening around an incomplete picture.',
        ],
      },
      {
        heading: 'Put names behind the decisions',
        paragraphs: [
          'Someone needs to own the system, someone needs to explain the information, and someone needs the authority to accept risk. Security, privacy, assessment, and operations bring different questions to the table. Work out the responsibilities and required separation of duties before treating a job title as the whole answer.',
          'Then talk about risk tolerance: how much risk is the organization willing to accept in pursuit of its mission? A team shouldn’t have to invent that position on its own. Get the organizational direction, applicable requirements, available resources, and escalation path clear enough that a disagreement can actually be resolved.',
        ],
      },
      {
        heading: 'Find the edges of what you know',
        paragraphs: [
          'Trace the information the system will process, store, and exchange. Identify its assets, dependencies, and the responsibilities that sit outside its proposed authorization boundary. A boundary defines the scope of the authorization decision; dependencies can still matter even when another team owns them.',
          'Ask which protections might be supplied as common controls and what remains the system’s responsibility. Consider suppliers and the potential effects of processing information about people. Keep unanswered questions visible, with someone responsible for resolving them. An assumption that everyone quietly repeats can start sounding like a fact surprisingly quickly.',
        ],
      },
    ],
    jsig: null,
    discussion: [
      'If the system owner and the people using the service describe its purpose differently, what would help them agree?',
      'Which dependency would change our plans the most if we discovered it worked differently than expected?',
      'Who can settle a disagreement about acceptable risk, and what would they need to hear from us?',
    ],
    handoff: 'Take an agreed purpose, identified responsibilities, a working scope, and the open questions into Categorize. We can then talk about the consequences of losing the information or service with the people who understand those consequences. Revisit this groundwork whenever the mission or scope changes.',
  },
  {
    slug: 'categorize',
    name: 'Categorize',
    question: 'What would a loss actually mean?',
    summary: 'Talk through the consequences of losing confidentiality, integrity, or availability before settling on impact levels.',
    intro: 'It’s easy to say a system is important. The more useful conversation is what would happen if its information got out, became unreliable, or wasn’t available when needed. Who gets hurt? What work stops? Categorize asks us to explain those consequences clearly enough that someone else can understand the impact levels we choose.',
    nist: 'NIST’s Categorize guidance calls for a documented system description, an analysis of confidentiality, integrity, and availability impacts, and review and approval of the categorization decision by the authorizing official.',
    sections: [
      {
        heading: 'Walk through the three kinds of loss',
        paragraphs: [
          'Confidentiality concerns unauthorized disclosure. Integrity concerns unauthorized modification or destruction. Availability concerns losing timely, reliable access to information or services. Keep the three conversations distinct long enough to understand what each loss would do.',
          'A useful question for integrity is, “What decisions could someone make using information that looks right but isn’t?” For availability, ask when the loss starts causing harm and who feels it. For confidentiality, follow the consequences beyond the person who first sees the disclosure. The answers need to come from the actual mission and information, so leave the impact levels open until that analysis is done.',
        ],
      },
      {
        heading: 'Bring the information owners into it',
        paragraphs: [
          'Identify the information types the system processes, stores, and transmits, then discuss the potential harm with the people responsible for them. Technical staff can explain what the system does. Mission and information owners help explain what a failure would mean to the organization and to others.',
          'Look at the collection as well as the individual pieces. Bringing information together can change its sensitivity or importance. A service can also support another function whose consequences are easy to overlook. Document the reasoning and any adjustments using the categorization method that actually applies to the system.',
        ],
      },
      {
        heading: 'Keep impact separate from confidence',
        paragraphs: [
          'Categorization asks about the potential consequences of loss. Confidence in an existing safeguard doesn’t replace that analysis. The likelihood of an event and the effectiveness of protections belong in the broader risk discussion; they don’t tell us, by themselves, what the loss would cost.',
          'If two people choose different levels, ask them to describe the consequences they have in mind. They may be considering different information, timeframes, or dependencies. Resolve that difference in the rationale and obtain the required approval. Carry privacy concerns forward too: potential harms from processing personal information need attention beyond the security category alone.',
        ],
      },
    ],
    jsig: {
      text: 'NIST gets us talking about the consequences of losing confidentiality, integrity, or availability. JSIG puts that analysis into practice for SAP systems through CNSSI 1253: determine the information and system impacts, identify applicable overlays, and involve the responsible officials in the categorization decision. The question to carry into that work is whether the chosen levels can be explained by the mission and information being protected.',
      section: '2.3.1', page: 30,
    },
    discussion: [
      'What consequence would persuade someone outside the technical team that our chosen impact level makes sense?',
      'Could combining information or depending on another service change the impact we first identified?',
      'If we disagree on a level, are we disagreeing about the harm, the scope, or how likely we think the event is?',
    ],
    handoff: 'Carry the approved categorization and its reasoning into Select. Keep the explanation with the decision so a future change in information or mission can be compared with what we originally considered.',
  },
  {
    slug: 'select',
    name: 'Select',
    question: 'Which controls belong here, and who owns them?',
    summary: 'Work out which requirements apply, how controls need to be tailored, and who will make each one work.',
    intro: 'Now we can have a better conversation about safeguards. What requirements apply? Which risks need attention? Who will provide the protection? A long control list can look reassuring, but we still need to explain how each selected requirement fits the system and who is responsible for it.',
    nist: 'NIST’s Select guidance covers choosing and tailoring controls, assigning them to providers and system components, planning continuous monitoring, and getting the resulting security and privacy plans reviewed and approved.',
    sections: [
      {
        heading: 'Check where the starting point comes from',
        paragraphs: [
          'First establish the governing requirements and the control catalog, baseline, and revision the organization is expected to use. SP 800-53 is a catalog of controls. A baseline is an initial selection from that catalog. Applicable overlays add context for particular communities or operating conditions.',
          'That distinction is worth slowing down for. Two teams can say they’re “using NIST” and mean different things. Confirm the applicable selection method and approval authority before comparing their lists. A familiar baseline from another project may give you questions to ask, but its applicability still needs to be established here.',
        ],
      },
      {
        heading: 'Make the choices explainable',
        paragraphs: [
          'Tailoring is where you apply the permitted adjustments and explain the result. Consider scope, control enhancements, organization-defined parameters, and any additional protections the risk assessment calls for. Record the rationale and obtain the approvals the governing process requires.',
          'Pay attention to phrases that leave a value for the organization to define. A review frequency or response period needs a reason that fits the requirement and the risk. If a control is difficult to implement, bring the constraint and possible responses into the conversation. Difficulty alone doesn’t establish that a requirement can be removed.',
        ],
      },
      {
        heading: 'Follow the responsibility all the way through',
        paragraphs: [
          'A system-specific control is implemented for that system. A common control is provided for inheritance by other systems. A hybrid control splits responsibility between the system and a common control provider. The useful question is what each party actually does and what the system can rely on.',
          'For inherited protection, establish the provider, scope, conditions, and available assessment information. For shared responsibility, make the handoff explicit. Start planning monitoring here as well: what will tell us the protection is still working, who will review that information, and what should trigger action?',
        ],
      },
    ],
    jsig: {
      text: 'NIST gives us the control requirements and the process for selecting and tailoring them. For SAP networks, JSIG directs how the NIST-based control set is selected through CNSSI 1253, applicable overlays, and tailoring. It also addresses inherited controls, monitoring, and approval of the plan. Exceptions to baseline and overlay controls require AO approval. That gives us a practical conversation: can we trace each selection to a requirement, a reason, and someone responsible for it?',
      section: '2.3.2', page: 33,
    },
    discussion: [
      'Could we explain our tailoring decisions without referring to what the last project did?',
      'If a provider says a control is covered, what scope and conditions would we need to confirm?',
      'Which control would be hardest to monitor, and does that reveal a problem with how we plan to implement it?',
    ],
    handoff: 'Move into Implement with an approved control selection, clear responsibilities, and a monitoring approach. The people doing the work should be able to explain both the requirement and the outcome they’re expected to deliver.',
  },
  {
    slug: 'implement',
    name: 'Implement',
    question: 'How does the plan become everyday practice?',
    summary: 'Turn selected controls into working safeguards and describe what actually happens when people use and maintain them.',
    intro: 'This is where the plan meets the way people actually work. A selected control needs a functioning implementation, and someone needs to keep it functioning. Some requirements involve technical settings. Others depend on procedures, people, physical protections, or a combination. Let’s follow the requirement far enough to see how it becomes a repeatable part of the operation.',
    nist: 'NIST’s Implement guidance asks for the controls in the security and privacy plans to be put into practice, with those plans updated to describe the actual implementation.',
    sections: [
      {
        heading: 'Explain what happens, from start to finish',
        paragraphs: [
          'Pick a selected requirement and walk through how it works. What starts the process? Who acts? What mechanism enforces the requirement? What happens when the expected action fails or someone needs an exception? Those questions turn a broad statement of intent into something another person can understand and assess.',
          'Be specific about scope. Identify the components, people, or activities covered, and explain any shared responsibility. If someone unfamiliar with the implementation read the description, could they follow the path from the requirement to the resulting protection? If they would have to guess, there’s more to explain.',
        ],
      },
      {
        heading: 'Make it possible to keep doing the right thing',
        paragraphs: [
          'Think about what happens after the person who built it leaves for the day. The operating procedure, required access, training, and support arrangements matter alongside the initial configuration. A control that depends on one person remembering an undocumented step can be difficult to sustain.',
          'Work through the handoffs between system staff and control providers. Explain who acts on an exception and who follows up. Decide how implementation changes will be reviewed and recorded. The people maintaining the control need to understand the outcome it protects, especially when a shortcut starts looking convenient.',
        ],
      },
      {
        heading: 'Describe the implementation you actually have',
        paragraphs: [
          'Plans will evolve as requirements meet practical constraints. Keep the System Security Plan, or SSP, and any applicable privacy plan aligned with what was implemented. Record incomplete work and deviations clearly, and route changes through the appropriate review. Planned work should stay distinguishable from completed work.',
          'Collect evidence with enough context to show what it represents: the scope, date, relevant configuration or procedure version, and the requirement it supports. That gives an assessor a starting point. The next step will examine whether the implementation achieves the intended outcome.',
        ],
      },
    ],
    jsig: {
      text: 'NIST establishes the protection a selected control needs to provide. JSIG adds SAP-specific implementation guidance for those controls, along with directions for documenting how they work. Read the NIST requirement, then the applicable JSIG implementation guidance, and explain the actual mechanism or process that delivers the protection. The SSP’s traceability matrix needs enough functional detail, including inputs, expected behavior, and outputs, for someone to assess it.',
      section: '2.3.3', page: 35,
    },
    discussion: [
      'Could someone maintain this control using the documented process if its usual owner were unavailable?',
      'Where does the implementation depend on a handoff, and how would we notice that the handoff failed?',
      'What would we show an assessor to connect the stated requirement with what actually happens?',
    ],
    handoff: 'Bring the implemented safeguards, accurate descriptions, known gaps, and supporting records into Assess. If implementation has exposed a problem with the selected approach, revisit that decision with the responsible people instead of leaving the plan out of step with reality.',
  },
  {
    slug: 'assess',
    name: 'Assess',
    question: 'How do we know the controls work?',
    summary: 'Ask what the evidence supports, test the intended outcomes, and talk honestly about findings and uncertainty.',
    intro: 'We’ve described how the controls are supposed to work. Now let’s put those claims under some scrutiny. What would convince us that a protection works? What might show that it doesn’t? Assessment gets much more useful when everyone understands the question being tested and is willing to learn from the answer.',
    nist: 'NIST’s Assess guidance looks at whether controls are correctly implemented, function as intended, and deliver the required security and privacy outcomes. It includes assessment planning, reporting, remediation, and updates to the plans.',
    sections: [
      {
        heading: 'Agree on what a useful assessment will answer',
        paragraphs: [
          'Start with the assessment objectives, scope, procedures, and required level of assessor independence. Identify the evidence to examine, the people to interview, and the mechanisms or activities to test. Get the assessment plan reviewed and approved through the applicable process before relying on the results.',
          'Talk about sampling and limitations up front. Which parts of the implementation will the assessment cover? What period will the records represent? What could remain untested? These choices affect what a conclusion can reasonably tell us. Agreeing on them early also gives control owners a fair understanding of what they need to make available.',
        ],
      },
      {
        heading: 'Follow the claim to the evidence',
        paragraphs: [
          'A procedure can explain the intended process. An interview can help establish how someone carries it out. A test or operational record can show what happens under the conditions examined. Use the assessment methods that answer the control’s objectives, and investigate when the different sources tell different stories.',
          'Ask what a result actually proves. A passing test has a scope and a set of conditions. A tool report may cover only part of a requirement. Keep conclusions tied to the evidence, and make missing information visible. “We haven’t established that yet” can be a more useful answer than confidence that the assessment hasn’t earned.',
        ],
      },
      {
        heading: 'Use findings to improve the decision',
        paragraphs: [
          'Describe the requirement, what was observed, and the evidence supporting the finding. Give the system owner enough detail to understand the issue and evaluate a response. Discuss limitations and residual uncertainty alongside the findings so the next decision reflects what is actually known.',
          'When a fix is made, reassess the affected implementation and record the result. Preserve the earlier findings so someone can follow what changed. Update the system description and the plans, and track unresolved work through the applicable corrective-action process. Finding a problem is useful; following it through is what makes the assessment improve the system.',
        ],
      },
    ],
    jsig: {
      text: 'NIST gives us the assessment question: does the implemented control achieve the required outcome? JSIG directs how that assessment is planned and carried out for SAP systems. The security control assessor approves the assessment plan, findings are documented, and reassessment preserves the original results alongside the updates. The implementation instructions and the assessment evidence should tell a consistent story about what was required, what was done, and what the assessment established.',
      section: '2.3.4', page: 35,
    },
    discussion: [
      'What evidence would make us reconsider a control we currently believe is effective?',
      'If the procedure, interview, and test result disagree, what would we investigate next?',
      'Which conclusion has the most uncertainty, and how could that uncertainty affect the authorization decision?',
    ],
    handoff: 'Carry supported findings, remediation results, unresolved issues, and their risk implications into Authorize. The decision-maker needs to understand what was assessed and where uncertainty remains, including what a promised fix has yet to demonstrate.',
  },
  {
    slug: 'authorize',
    name: 'Authorize',
    question: 'Who can accept the remaining risk?',
    summary: 'Bring the mission, findings, and available responses together for a decision someone has the authority to make.',
    intro: 'At some point, someone has to decide whether the risk of operating the system is acceptable. That conversation deserves more than a stack of completed documents. What work will the system support? What could still go wrong? What can we do about it? Authorize brings those questions to the official responsible for making the decision.',
    nist: 'NIST’s Authorize guidance places accountability with a senior official who evaluates security and privacy risk, considers responses, and approves or denies authorization for a system or the use of common controls.',
    sections: [
      {
        heading: 'Make the risk understandable',
        paragraphs: [
          'Bring together the system’s purpose and scope, the assessment results, and the planned responses to outstanding issues. Explain the potential consequences to operations, assets, individuals, and other affected parties. Connect a finding to the harm it could contribute to, and be clear about the conditions and uncertainty behind that explanation.',
          'The quality of this conversation depends on how well the pieces agree. If the assessment describes a different implementation than the plan, or a proposed fix has no owner or resources, the package leaves important questions unanswered. Give the authorizing official, or AO, a clear picture of the current state and the realistic choices available.',
        ],
      },
      {
        heading: 'Be clear about who is making the call',
        paragraphs: [
          'The system owner and the people supporting the assessment inform the decision. The AO is accountable for deciding whether the risk is acceptable within the applicable authority and organizational direction. A recommendation, a completed assessment, or an approaching deadline doesn’t make that decision on the AO’s behalf.',
          'Talk through the alternatives and their consequences. Could the intended operation be limited while an issue is addressed? Is further remediation or assessment needed before a decision can be supported? What does delaying operation mean for the mission? Make those tradeoffs explicit rather than allowing them to disappear behind a status label.',
        ],
      },
      {
        heading: 'Make the decision usable after the meeting',
        paragraphs: [
          'An authorization decision needs an identifiable scope, its terms and conditions, and the applicable duration or ongoing-authorization arrangements. The people operating the system need to understand what they must maintain, what they must report, and which limitations they must observe.',
          'A Plan of Action and Milestones (POA&M) tracks corrective work; recording an issue there doesn’t itself grant permission to operate with it. The decision and the follow-up responsibilities need to be clear. Make sure the monitoring approach can provide the information the AO expects to receive.',
        ],
      },
    ],
    jsig: {
      text: 'NIST puts an accountable risk decision at the center of authorization. JSIG carries that principle into the SAP authorization process by directing how the package is assembled and submitted, how the AO evaluates risk, and how the decision is recorded. Explicit risk acceptance belongs to the AO. The outcome, conditions, and duration give the operating team direction it can act on after the review.',
      section: '2.3.5', page: 36,
    },
    discussion: [
      'What would the AO need to know that a list of control findings might leave out?',
      'Which proposed response depends on resources or promises that haven’t been secured yet?',
      'What new information would make us recommend revisiting the decision?',
    ],
    handoff: 'Take the decision and its conditions into Monitor. If authorization is denied or more work is needed, return to the relevant steps with clear responsibilities. When operation is authorized, the evidence and reporting need to keep supporting that decision over time.',
  },
  {
    slug: 'monitor',
    name: 'Monitor',
    question: 'What has changed, and does our decision still hold?',
    summary: 'Keep checking the controls, follow meaningful changes, and decide when earlier conclusions need another look.',
    intro: 'The system keeps changing after an authorization decision. So do its users, mission, dependencies, and threats. A conclusion that made sense earlier may need another look. Monitor keeps the risk conversation connected to what is happening now, including changes people are proposing before they become part of the operation.',
    nist: 'NIST’s Monitor guidance connects ongoing awareness of the system and its environment with control assessments, analysis, reporting, risk responses, and ongoing authorization decisions.',
    sections: [
      {
        heading: 'Decide what would be useful to know',
        paragraphs: [
          'Use the monitoring strategy established earlier to decide what to assess or observe, how often, and who will review the results. Consider the risk, rate of change, applicable requirements, and authorization conditions. Different controls can need different kinds of evidence and different review frequencies.',
          'Ask what action each measure is meant to support. Who receives it? What would cause them to investigate, correct something, or raise a decision to the AO? Collecting more information only helps when someone can interpret it and do something with the result.',
        ],
      },
      {
        heading: 'Bring change back into the conversation',
        paragraphs: [
          'Consider changes to the mission, information, components, dependencies, and control providers. Work out how a proposed or actual change affects risk and the existing control implementation, then involve the responsible officials through the change process. The size of the technical change alone may not tell you the size of its consequences.',
          'Some changes can be handled within established monitoring and change procedures. Others may require another look at the boundary, categorization, control selection, assessment, or authorization. Use the impact analysis and applicable direction to determine the response. The seven steps remain available whenever new information challenges an earlier answer.',
        ],
      },
      {
        heading: 'Keep the record connected to reality',
        paragraphs: [
          'Verify corrective actions, update the relevant plans and assessment results, and report meaningful changes in risk. Preserve the history so someone can see what was found, what was changed, and why the conclusion moved. An open issue needs a credible next action; a closed issue needs support for its closure.',
          'Carry those responsibilities through the end of the system’s life. Disposal and decommissioning bring decisions about information, records, components, and remaining dependencies. Follow the applicable retention and handling requirements, and make the transfer or end of responsibility explicit.',
        ],
      },
    ],
    jsig: {
      text: 'NIST keeps the focus on whether the controls and risk decision still hold as the system changes. JSIG turns that into SAP operating direction: analyze security impacts, consult the appropriate officials about security-related changes, reassess controls, and maintain the authorization records. Monitoring results keep the AO involved in the risk decision. The same accountability carries through disposal and the retention of evidence.',
      section: '2.3.6', page: 38,
    },
    discussion: [
      'Which piece of evidence would become misleading first if the system changed tomorrow?',
      'What change could look routine to one team but alter another team’s risk?',
      'How would we know that monitoring has led to a useful decision instead of simply producing another report?',
    ],
    handoff: 'Bring what monitoring teaches you back to the people who own the mission and the risk. Revisit the relevant step when an earlier answer no longer fits. That feedback is how the framework stays useful throughout the system’s life.',
  },
];
