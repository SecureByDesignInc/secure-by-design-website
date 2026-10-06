const stages = {
  exploring: {
    kicker: "Your starting point", title: "Explore the work before choosing the path.", duration: "2–4 weeks", outcome: "You can choose what to explore next",
    summary: "Cybersecurity is a collection of very different jobs. Your goal is not to pick a lifelong specialty today—it is to understand the industry well enough to make your next decision with confidence.",
    questions: ["What problems do security teams solve for an organization?", "How are IT, cybersecurity, privacy, and compliance different?", "Do I enjoy investigating, building, testing, advising, or organizing?", "How much coding, on-call work, or customer interaction do different roles require?", "What expectations are realistic for a first cybersecurity role?"],
    trap: ["Buying training before choosing a direction", "A certification can support a destination, but it cannot choose the destination for you. Explore the work first, then spend time and money."],
    plan: [["01", "Map the industry", "Learn how identity, networks, endpoints, applications, cloud, governance, and security operations fit together."], ["02", "Sample the work", "Watch or read day-in-the-life examples from technical, investigative, and governance roles."], ["03", "Test the foundations", "Try one short networking, operating-system, and log-analysis exercise. Notice what holds your attention."], ["04", "Write your direction brief", "Record the two career families you want to explore, why they fit, and what you need to validate next."]],
    practice: { label: "Observation exercise", title: "Sit in on a fictional security meeting", scenario: "A company has a vulnerable public server, repeated failed logins, and an overdue audit finding. Decide which teams and roles should own each part of the response.", deliverable: "A one-page responsibility map showing who investigates, who fixes, who accepts risk, and who needs evidence.", proof: "You can explain why the same problem requires technical, operational, and governance roles." },
    checks: ["I can describe cybersecurity in business terms—not just ‘stopping hackers.’", "I can name at least four career families and distinguish their daily work.", "I know which working styles energize me and which do not.", "I have selected one or two paths to investigate next."],
    resources: [["NICE Career Profiles", "https://niccs.cisa.gov/workforce-development/nice-framework"], ["CISA Careers", "https://www.cisa.gov/careers"], ["CyberSeek Pathway", "https://www.cyberseek.org/pathway.html"]]
  },
  choosing: {
    kicker: "Choose by work, not hype", title: "Find the problems you want to solve.", duration: "2–3 weeks", outcome: "You have a primary role and a backup path",
    summary: "Job titles are inconsistent. Compare career paths by the work performed, required foundations, pressure level, entry routes, and the evidence employers expect.",
    questions: ["Do I want to defend, build, assess, investigate, or govern?", "Which tasks appear repeatedly across real job descriptions?", "What feeder roles commonly lead into my target role?", "Which skills transfer if I later change specialties?", "Does the role match my preferred pace, collaboration style, and tolerance for ambiguity?"],
    trap: ["Choosing from salary or social-media visibility", "The most visible roles are not automatically the best fit. A sustainable path matches both your strengths and the work employers actually need."],
    plan: [["01", "Compare career families", "Score operations, engineering, offensive security, and GRC against your interests and working style."], ["02", "Read 15 job descriptions", "Ignore titles at first. Highlight repeated responsibilities, tools, and foundational skills."], ["03", "Find the feeder role", "Identify the realistic first job that builds toward your destination—even if its title is not ‘cybersecurity.’"], ["04", "Choose and validate", "Select a primary path, a backup path, and one small project that tests your assumptions."]],
    practice: { label: "Career analysis", title: "Reverse-engineer the job market", scenario: "You find three ‘Security Analyst’ postings: one is SOC monitoring, one is compliance, and one is vulnerability management. Determine what each employer actually needs.", deliverable: "A role scorecard comparing responsibilities, prerequisites, tools, schedule, and realistic entry routes.", proof: "You can explain the work you want to do without relying on a job title." },
    checks: ["I can describe my target role’s normal week.", "I understand its foundational—not merely product-specific—skills.", "I know one realistic feeder role and the tradeoffs involved.", "I have validated my choice against real job descriptions."],
    resources: [["CyberSeek Pathway", "https://www.cyberseek.org/pathway.html"], ["NIST NICE Framework", "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center"]]
  },
  learning: {
    kicker: "Build the dependencies first", title: "Follow a roadmap that explains why.", duration: "3–6 months", outcome: "You can explain and troubleshoot the foundations",
    summary: "Tools change. The systems underneath them do not change nearly as quickly. Build a durable base in networking, operating systems, identity, enterprise infrastructure, and security fundamentals.",
    questions: ["What prerequisite makes this topic easier to understand?", "Where does this technology sit in an enterprise architecture?", "What normal behavior does it produce before something goes wrong?", "How would I configure, verify, and troubleshoot it?", "Can I explain why the organization needs it?"],
    trap: ["Collecting definitions without building mental models", "Recognition is not understanding. If you cannot trace what happens during a login, connection, alert, or policy change, revisit the underlying system."],
    plan: [["01", "Systems", "Learn hardware, virtualization, Windows and Linux administration, files, processes, services, and permissions."], ["02", "Networks", "Understand IP addressing, DNS, routing, ports, protocols, firewalls, and how traffic moves."], ["03", "Identity & enterprise", "Study authentication, authorization, directories, Group Policy, PKI, patching, and centralized management."], ["04", "Security operations", "Connect vulnerabilities, logs, SIEM, endpoint protection, incident response, risk, and controls."], ["05", "Choose a specialty layer", "Add the tools and deeper skills associated with your target role after the common foundation is stable."]],
    practice: { label: "Concept-to-system exercise", title: "Trace one failed domain login", scenario: "A user cannot sign in to a workstation. Trace the request through network connectivity, DNS, the domain controller, authentication, authorization, and event logging.", deliverable: "An annotated flow diagram plus a troubleshooting checklist with the evidence you would collect at each step.", proof: "You can connect networking, DNS, Active Directory, policy, and logs as one system." },
    checks: ["I can explain what happens when a device communicates across a network.", "I can administer basic Windows and Linux services from the command line.", "I understand authentication, authorization, DNS, and centralized identity.", "I can read basic logs and connect events into a timeline."],
    resources: [["Cisco Skills for All", "https://skillsforall.com/"], ["Microsoft Learn", "https://learn.microsoft.com/training/"], ["Red Hat Learning", "https://www.redhat.com/en/services/training-and-certification"]]
  },
  experience: {
    kicker: "Experience without employment", title: "Practice the full lifecycle of real work.", duration: "6–10 weeks", outcome: "You have evidence, not just completion badges",
    summary: "Real experience includes decisions, failed attempts, communication, and evidence. Configure something, break it, troubleshoot it, secure it, monitor it, and document the outcome.",
    questions: ["What business problem or ticket started this work?", "What does success look like before I touch the system?", "What could break and how would I roll back?", "What evidence proves the change worked?", "How would I communicate the result to technical and nontechnical stakeholders?"],
    trap: ["Following a lab guide without making decisions", "A copied walkthrough proves that you can follow instructions. Add constraints, troubleshoot failures, and explain your reasoning to demonstrate job-ready ability."],
    plan: [["01", "Build a small enterprise", "Create identity, DNS, endpoints, a server workload, and a segmented management path."], ["02", "Make normal activity visible", "Centralize logs, establish a baseline, scan for vulnerabilities, and document assets."], ["03", "Introduce a problem", "Simulate a vulnerable service, failed authentication pattern, policy mistake, or missing control."], ["04", "Work the lifecycle", "Validate, prioritize, change, verify, communicate, and preserve evidence."], ["05", "Package the result", "Publish a sanitized diagram, decision log, screenshots, report, and lessons learned."]],
    practice: { label: "Work simulation", title: "Close a critical vulnerability correctly", scenario: "A scanner reports a critical finding on APP01. Validate the result, determine exposure and ownership, coordinate remediation, rescan, and close the issue.", deliverable: "A ticket timeline, risk explanation, remediation evidence, before-and-after scan result, and executive summary.", proof: "You can describe the complete vulnerability-management lifecycle—not merely how to launch a scan." },
    checks: ["My project begins with a realistic requirement or problem.", "I documented decisions, failures, and troubleshooting—not only the final state.", "I created evidence another person could verify.", "I can explain the organizational value and security outcome."],
    resources: [["MITRE ATT&CK", "https://attack.mitre.org/"], ["OWASP", "https://owasp.org/"], ["CISA Resources", "https://www.cisa.gov/resources-tools"]]
  },
  applying: {
    kicker: "Translate learning into evidence", title: "Show employers what you can already do.", duration: "4–8 weeks", outcome: "Your evidence aligns with a real target role",
    summary: "Hiring teams need a believable connection between your learning and their problems. Build that bridge with focused evidence, clear writing, and stories that show how you think.",
    questions: ["What must this employer trust me to do?", "Which artifact demonstrates each important skill?", "Can I explain the outcome without hiding behind product names?", "Which requirements are mandatory, preferred, or teachable?", "What story shows how I handled uncertainty, failure, or disagreement?"],
    trap: ["Using the same résumé for every cybersecurity role", "A broad list of tools does not communicate fit. Select evidence and accomplishments that answer the specific problems in the job description."],
    plan: [["01", "Choose the target", "Collect 10–15 similar postings and build a shared skills-and-responsibilities matrix."], ["02", "Audit your evidence", "Match projects, work experience, certifications, and stories to the employer’s recurring needs."], ["03", "Close the visible gaps", "Build one focused project or artifact for the most important unmet responsibility."], ["04", "Package and practice", "Tailor your résumé, organize your portfolio, rehearse technical explanations, and refine behavioral stories."], ["05", "Apply deliberately", "Track applications, questions, feedback, and weak spots so every interview improves the next one."]],
    practice: { label: "Hiring simulation", title: "Turn a job posting into an evidence plan", scenario: "A Security Analyst posting requests SIEM, vulnerability management, incident response, Active Directory, and communication. Decide what proof would make each claim credible.", deliverable: "A requirement-to-evidence matrix, tailored résumé bullets, one portfolio case study, and five interview stories.", proof: "You can connect every important résumé claim to a specific action, artifact, and measurable outcome." },
    checks: ["I am targeting a defined role rather than ‘anything in cyber.’", "My résumé describes outcomes and decisions, not only tools and courses.", "My portfolio contains two or three complete, well-explained projects.", "I can explain fundamentals and walk through my work without a script."],
    resources: [["CyberSeek", "https://www.cyberseek.org/"], ["NICE Workforce Framework", "https://niccs.cisa.gov/workforce-development/nice-framework"]]
  },
  newjob: {
    kicker: "Your first 90 days", title: "Learn the environment before trying to change it.", duration: "90 days", outcome: "You are trusted, useful, and increasingly independent",
    summary: "Your first job is not the end of the roadmap. Learn the people, systems, risks, documentation, and operating rhythms around you—then earn trust through reliable work.",
    questions: ["Who owns each system, risk, and decision?", "How does work enter the team and how is it prioritized?", "Where do procedures, evidence, known issues, and architecture live?", "Which mistakes are expensive or difficult to reverse?", "What does my manager consider success at 30, 60, and 90 days?"],
    trap: ["Trying to prove yourself by changing things immediately", "Early credibility comes from listening, documenting accurately, communicating well, and completing small commitments—not from criticizing the existing environment."],
    plan: [["DAYS 1–30", "Learn and map", "Meet stakeholders, inventory responsibilities, read procedures, observe workflows, and learn how the environment is supposed to work."], ["DAYS 31–60", "Contribute with support", "Own small tasks, shadow incidents and changes, improve documentation, and ask for feedback before assumptions harden."], ["DAYS 61–90", "Operate independently", "Own recurring work, propose one evidence-backed improvement, and agree on the next six months of development."], ["ONGOING", "Build trust", "Communicate early, preserve evidence, respect change control, admit what you do not know, and close the loop."]],
    practice: { label: "Onboarding simulation", title: "Handle your first unexpected alert", scenario: "A privileged account generates repeated failures during a maintenance window. You know neither the environment nor the people involved. Decide what to verify, who to contact, and how to document uncertainty.", deliverable: "An investigation timeline, stakeholder map, escalation note, and after-action list of knowledge gaps to close.", proof: "You can move an issue forward safely without pretending to know more than you do." },
    checks: ["I know my responsibilities, escalation paths, and decision boundaries.", "I can find the authoritative procedures, diagrams, and evidence repositories.", "I have working relationships with the teams my work depends on.", "My manager and I agree on what successful progress looks like."],
    resources: [["NIST NICE Resources", "https://www.nist.gov/itl/applied-cybersecurity/nice/resources"], ["CISA Workforce Training", "https://www.cisa.gov/cybersecurity-training-exercises"]]
  }
};

const $ = (selector) => document.querySelector(selector);
const tabs = [...document.querySelectorAll(".stage")];
const depthTabs = [...document.querySelectorAll(".depth-tab")];
let currentStage = "exploring";
let currentView = "focus";

function list(items, className = "") {
  const ul = document.createElement("ul"); ul.className = className;
  items.forEach((item) => { const li = document.createElement("li"); li.textContent = item; ul.append(li); });
  return ul;
}

function renderDepth() {
  const stage = stages[currentStage];
  const view = $("#depth-view");
  depthTabs.forEach((tab) => { const selected = tab.dataset.view === currentView; tab.classList.toggle("active", selected); tab.setAttribute("aria-selected", String(selected)); });
  if (currentView === "focus") {
    view.innerHTML = '<div class="questions-view"><div><span class="mini-label">Questions worth answering</span><div id="focus-questions"></div></div><aside class="watchout-card"><span class="mini-label">Common trap</span><h4></h4><p></p></aside></div>';
    $("#focus-questions").append(list(stage.questions, "question-list"));
    view.querySelector(".watchout-card h4").textContent = stage.trap[0];
    view.querySelector(".watchout-card p").textContent = stage.trap[1];
  } else if (currentView === "plan") {
    view.innerHTML = '<div class="plan-header"><div><span class="mini-label">A practical sequence</span><h4>Move forward without trying to learn everything at once.</h4></div><span>' + stage.plan.length + ' milestones</span></div><ol class="action-plan" id="action-plan"></ol>';
    const plan = $("#action-plan");
    stage.plan.forEach(([number, title, copy]) => { const li = document.createElement("li"); li.innerHTML = `<span>${number}</span><div><b>${title}</b><p>${copy}</p></div>`; plan.append(li); });
  } else if (currentView === "practice") {
    const p = stage.practice;
    view.innerHTML = '<div class="practice-view"><div class="scenario"><span class="mini-label"></span><h4></h4><p></p></div><div class="evidence-grid"><div><span>DELIVERABLE</span><p></p></div><div><span>WHAT THIS PROVES</span><p></p></div></div></div>';
    view.querySelector(".scenario .mini-label").textContent = p.label; view.querySelector(".scenario h4").textContent = p.title; view.querySelector(".scenario p").textContent = p.scenario;
    const evidence = view.querySelectorAll(".evidence-grid p"); evidence[0].textContent = p.deliverable; evidence[1].textContent = p.proof;
  } else {
    view.innerHTML = '<div class="ready-view"><div class="readiness-head"><div><span class="mini-label">Self-check</span><h4>Check each statement you can support with an example.</h4></div><div class="readiness-score"><strong id="ready-count">0</strong><span>of ' + stage.checks.length + ' ready</span></div></div><div class="check-list" id="check-list"></div><p class="readiness-note" id="readiness-note">Be honest—unchecked items become your next learning goals.</p></div>';
    const checks = $("#check-list");
    stage.checks.forEach((copy, index) => { const label = document.createElement("label"); label.innerHTML = `<input type="checkbox" value="${index}"><span>${copy}</span>`; checks.append(label); });
    checks.addEventListener("change", () => { const count = checks.querySelectorAll("input:checked").length; $("#ready-count").textContent = count; $("#readiness-note").textContent = count === stage.checks.length ? "You have enough evidence to move forward. Keep strengthening it as you go." : "Be honest—unchecked items become your next learning goals."; });
  }
}

function renderStage(key, focusPanel = false) {
  const stage = stages[key]; if (!stage) return; currentStage = key; currentView = "focus";
  tabs.forEach((tab) => { const selected = tab.dataset.stage === key; tab.classList.toggle("active", selected); tab.setAttribute("aria-selected", String(selected)); });
  $("#panel-kicker").textContent = stage.kicker; $("#panel-title").textContent = stage.title; $("#panel-summary").textContent = stage.summary; $("#panel-duration").textContent = stage.duration; $("#panel-outcome").textContent = stage.outcome;
  $("#panel-resources").replaceChildren(...stage.resources.map(([label, href]) => { const a = document.createElement("a"); a.textContent = label; a.href = href; a.target = "_blank"; a.rel = "noreferrer"; return a; }));
  renderDepth();
  if (focusPanel && window.matchMedia("(max-width: 980px)").matches) $("#stage-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => renderStage(tab.dataset.stage, true));
  tab.addEventListener("keydown", (event) => { if (!["ArrowDown", "ArrowUp"].includes(event.key)) return; event.preventDefault(); const next = event.key === "ArrowDown" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length; tabs[next].focus(); tabs[next].click(); });
});
depthTabs.forEach((tab) => tab.addEventListener("click", () => { currentView = tab.dataset.view; renderDepth(); }));
renderStage("exploring");
