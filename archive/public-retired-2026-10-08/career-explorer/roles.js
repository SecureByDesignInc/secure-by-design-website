const careerFamilies = {
  operations: {
    code: "DEFEND", title: "Security Operations",
    summary: "Security operations teams turn activity into decisions. They monitor the environment, determine what is normal, investigate what is not, contain incidents, and improve the organization’s ability to detect the next one.",
    titles: ["SOC Analyst", "Security Analyst", "Incident Responder", "Threat Hunter", "Detection Engineer"],
    facts: [["WORK STYLE", "Investigative & time-sensitive"], ["TECHNICAL DEPTH", "Moderate to high"], ["INTERRUPTIONS", "Often frequent"], ["ENTRY REALITY", "One of the clearer direct paths"]],
    work: ["Review and prioritize alerts using context—not severity alone.", "Build an evidence-based timeline across identity, endpoint, network, and application logs.", "Determine whether activity is benign, suspicious, or an incident requiring escalation.", "Contain threats while preserving evidence and minimizing operational impact.", "Document findings, tune detections, and communicate lessons to system owners."],
    foundations: ["Networking, ports, protocols, and normal traffic", "Windows and Linux processes, services, permissions, and logs", "Identity, authentication, Active Directory, and cloud IAM", "Common attacker behavior and the incident-response lifecycle", "Clear technical writing and defensible decision-making"],
    path: ["IT Support / Systems", "SOC Analyst", "Security or IR Analyst", "Threat Hunter / Detection Engineer", "SOC Lead / Security Architect"],
    tools: ["SIEM", "EDR/XDR", "Network telemetry", "Threat intelligence", "Case management", "Forensics"],
    fit: ["Do I enjoy following incomplete clues?", "Can I make a decision before I know everything?", "Am I comfortable documenting why an alert is—or is not—a concern?"],
    simulation: ["Investigate repeated privileged-account failures", "Create an incident timeline, state your working hypothesis, identify missing evidence, recommend containment, and write both a technical note and a five-sentence leadership summary.", "Incident timeline · Evidence list · Containment recommendation · Leadership summary"]
  },
  engineering: {
    code: "BUILD", title: "Security Engineering",
    summary: "Security engineers design, integrate, harden, automate, and sustain security capabilities. The job is part architecture, part administration, and part troubleshooting—and it depends heavily on understanding the systems being protected.",
    titles: ["Security Engineer", "IAM Engineer", "Cloud Security Engineer", "Endpoint Engineer", "Security Architect"],
    facts: [["WORK STYLE", "Build, integrate & troubleshoot"], ["TECHNICAL DEPTH", "High"], ["INTERRUPTIONS", "Project work plus escalations"], ["ENTRY REALITY", "Usually follows infrastructure experience"]],
    work: ["Turn security requirements into technical designs and implementation plans.", "Deploy and maintain identity, endpoint, logging, vulnerability, network, or cloud controls.", "Test integrations, upgrades, policies, and failure conditions before production changes.", "Troubleshoot performance, compatibility, coverage, and data-quality problems.", "Automate repetitive work and produce diagrams, procedures, and implementation evidence."],
    foundations: ["Deep administration in at least one operating system or cloud platform", "Networking, DNS, certificates, APIs, and enterprise identity", "Scripting, configuration management, and repeatable deployment", "System design, dependencies, availability, and recovery", "Change control, testing, documentation, and operational ownership"],
    path: ["Support / Network / Systems", "Platform Administrator", "Junior Security Engineer", "Security Engineer", "Senior Engineer / Architect"],
    tools: ["Identity & access", "Endpoint security", "Vulnerability platforms", "SIEM pipelines", "Cloud controls", "Automation & APIs"],
    fit: ["Do I want to own systems after deployment?", "Do I enjoy tracing failures across multiple technologies?", "Can I balance stronger controls against usability and availability?"],
    simulation: ["Design centralized logging for a new application", "Produce a data-flow diagram, identify required log sources and retention, define failure monitoring, plan access controls, and write validation steps that prove useful events reach the SIEM.", "Data-flow diagram · Source inventory · Validation plan · Operations runbook"]
  },
  offensive: {
    code: "ASSESS", title: "Offensive Security & Testing",
    summary: "Offensive teams safely test assumptions. They model adversaries, find exploitable weaknesses, demonstrate impact within strict boundaries, and give defenders evidence they can use to reduce risk.",
    titles: ["Penetration Tester", "Application Security Analyst", "Red Team Operator", "Security Consultant", "Vulnerability Researcher"],
    facts: [["WORK STYLE", "Creative, methodical & report-heavy"], ["TECHNICAL DEPTH", "High"], ["INTERRUPTIONS", "Usually engagement-driven"], ["ENTRY REALITY", "Competitive; broad foundations matter"]],
    work: ["Define scope, authorization, constraints, success criteria, and safe testing rules.", "Enumerate systems, applications, identities, and trust relationships.", "Validate weaknesses and demonstrate impact without causing unnecessary harm.", "Chain technical findings into realistic attack paths and business consequences.", "Write reproducible evidence and remediation guidance, then communicate it to owners."],
    foundations: ["Networking, operating systems, web applications, and enterprise identity", "Scripting and comfort reading unfamiliar code or configurations", "Vulnerability classes, exploitation fundamentals, and attacker tradecraft", "Evidence handling, rules of engagement, and professional ethics", "Concise report writing for both engineers and decision-makers"],
    path: ["Systems / Development / SOC", "Security Tester", "Penetration Tester", "Senior Tester / Red Team", "Offensive Lead / AppSec Architect"],
    tools: ["Reconnaissance", "Web testing", "Network testing", "Code analysis", "Exploit validation", "Reporting"],
    fit: ["Will I spend as much effort documenting as testing?", "Can I stay inside scope when curiosity pulls elsewhere?", "Do I enjoy deeply learning how systems fail—not merely running scanners?"],
    simulation: ["Assess a deliberately vulnerable internal web service", "Write rules of engagement, document discovery and validation, rank findings by business impact, capture reproducible evidence, and deliver remediation guidance without publishing sensitive exploit details.", "Rules of engagement · Evidence package · Findings report · Remediation brief"]
  },
  grc: {
    code: "GOVERN", title: "Governance, Risk & Compliance",
    summary: "GRC professionals connect business missions, legal obligations, threats, controls, and evidence. Strong practitioners do more than manage checklists: they help leaders understand risk and help technical teams build defensible systems.",
    titles: ["GRC Analyst", "Security Compliance Analyst", "ISSO", "Security Control Assessor", "Risk Manager"],
    facts: [["WORK STYLE", "Analytical, collaborative & evidence-driven"], ["TECHNICAL DEPTH", "Broad; varies by role"], ["INTERRUPTIONS", "Deadline and stakeholder driven"], ["ENTRY REALITY", "Accessible through audit, policy, or IT"]],
    work: ["Translate laws, contracts, frameworks, and policy into applicable requirements.", "Interview system owners and determine how controls are really implemented.", "Evaluate risk using threat, likelihood, impact, exposure, and compensating controls.", "Collect, test, organize, and explain evidence for authorization or assurance decisions.", "Track weaknesses, exceptions, remediation plans, and accepted residual risk."],
    foundations: ["How enterprise systems, networks, identity, and security operations function", "Risk concepts, control intent, evidence quality, and assessment methods", "One or more frameworks such as NIST CSF, RMF, 800-53, ISO 27001, or PCI DSS", "Policy writing, stakeholder interviews, and project coordination", "The ability to explain technical risk without exaggeration or false certainty"],
    path: ["IT / Audit / Business Ops", "GRC or Compliance Analyst", "ISSO / Risk Analyst", "Assessor / GRC Lead", "ISSM / Risk Director"],
    tools: ["GRC platforms", "Evidence repositories", "Ticketing & workflow", "Vulnerability data", "Policy libraries", "Reporting & dashboards"],
    fit: ["Can I ask precise questions without becoming adversarial?", "Do I enjoy turning ambiguity into documented decisions?", "Can I explain why a control matters to both engineers and leaders?"],
    simulation: ["Assess access control for a new internal application", "Map the requirement to control intent, interview the owner, identify evidence, test a sample, document a gap, rate the risk, and propose a practical corrective action with an owner and due date.", "Control assessment · Evidence map · Risk statement · Corrective-action plan"]
  }
};

(() => {
  const tabs = [...document.querySelectorAll(".role-family")];
  const set = (selector, value) => { document.querySelector(selector).textContent = value; };
  const fillList = (selector, items) => {
    const element = document.querySelector(selector); element.replaceChildren();
    items.forEach((item) => { const li = document.createElement("li"); li.textContent = item; element.append(li); });
  };
  function render(key) {
    const family = careerFamilies[key]; if (!family) return;
    tabs.forEach((tab) => { const selected = tab.dataset.family === key; tab.classList.toggle("active", selected); tab.setAttribute("aria-selected", String(selected)); });
    set("#role-code", family.code); set("#role-title", family.title); set("#role-summary", family.summary); set("#role-titles", family.titles.join(" · "));
    const facts = document.querySelector("#role-facts"); facts.replaceChildren();
    family.facts.forEach(([label, value]) => { const item = document.createElement("div"); const small = document.createElement("span"); const strong = document.createElement("b"); small.textContent = label; strong.textContent = value; item.append(small, strong); facts.append(item); });
    fillList("#role-work", family.work); fillList("#role-foundations", family.foundations); fillList("#role-fit", family.fit);
    const path = document.querySelector("#role-path"); path.replaceChildren();
    family.path.forEach((step, index) => { const li = document.createElement("li"); const number = document.createElement("span"); const title = document.createElement("b"); number.textContent = String(index + 1).padStart(2, "0"); title.textContent = step; li.append(number, title); path.append(li); });
    const tools = document.querySelector("#role-tools"); tools.replaceChildren();
    family.tools.forEach((tool) => { const span = document.createElement("span"); span.textContent = tool; tools.append(span); });
    set("#simulation-title", family.simulation[0]); set("#simulation-copy", family.simulation[1]); set("#simulation-output", family.simulation[2]);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => render(tab.dataset.family));
    tab.addEventListener("keydown", (event) => { if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length; tabs[next].focus(); tabs[next].click(); });
  });
  render("operations");
})();
