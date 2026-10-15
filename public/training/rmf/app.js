(() => {
  'use strict';
  // Network Authorization (courses 2.1–2.3) in the Build the Network guide design: the learning path, a
  // module card with Learn / See / Build / Prove tabs, and the 3D authorization view beside it. The Body of
  // Evidence, the capstone and the source documents open in a wide card. Routes are hashes (#catalog/05,
  // #evidence/ssp, #capstone, #sources); Training Library tiles and saved progress link to them.
  const modules = window.CATALOG;
  const parts = window.CATALOG_PARTS;
  const lessons = window.LEARNING;
  const artifacts = window.ARTIFACTS;
  const net = window.RMF_NETWORK;
  const $ = id => document.getElementById(id);
  const main = $('main');
  const card = $('lesson');
  const status = $('status');
  const state = { lesson: {}, step: {}, answers: {}, mode: 'example', selected: net.scene.nodes[0].id, boundary: false,
    motion: !matchMedia('(prefers-reduced-motion: reduce)').matches };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Sample milestone dates are written as {+N}: N days after today, so the examples never go stale.
  const dateFormat = new Intl.DateTimeFormat('en-US', {month:'long', day:'numeric', year:'numeric'});
  const sampleDates = value => String(value).replace(/\{\+(\d+)\}/g, (_, days) => { const date = new Date(); date.setDate(date.getDate() + Number(days)); return dateFormat.format(date); });
  const hours = h => `${h} ${Number(h) === 1 ? 'hour' : 'hours'}`;
  const steps = [['learn', 'Learn'], ['see', 'See'], ['build', 'Build'], ['prove', 'Prove']];
  const partOf = id => parts.find(part => part.modules.includes(id));
  const sources = [
    ['NIST SP 800-37 Revision 2','RMF lifecycle, authorization package, roles, and monitoring. See Authorize Task R-1 and Appendix F.','https://csrc.nist.gov/pubs/sp/800/37/r2/final'],
    ['NIST SP 800-53 Revision 5','Security and privacy control catalog. Record the release adopted by the governing authority.','https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final'],
    ['NIST SP 800-53A Revision 5','Control assessment procedures and examine, interview, and test methods.','https://csrc.nist.gov/pubs/sp/800/53/a/r5/final'],
    ['NIST SP 800-53B','Control baselines, tailoring, and overlays. Apply the appropriate system context.','https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final'],
    ['DoDI 8510.01','Risk Management Framework for DoD Systems, July 19, 2022.','https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/851001p.pdf'],
    ['DoDM 5205.07','Special Access Program Security Manual, January 17, 2025.','https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/520507m1.PDF'],
    ['DCSA Voice of Industry · September 2025','DCSA newsletter for cleared industry on the DAAG transition. Confirm the current guide, version, and effective date with DCSA.','https://www.dcsa.mil/Portals/128/Documents/CTP/tools/250930%20VOI%20Newsletter.pdf']
  ];

  // The 3D scene (public/training/guide/scene.js, loaded as a module after this script) reads these.
  window.SBD_LESSON = { scene: net.scene, chapters: modules };

  function route() {
    const bits = location.hash.slice(1).split('/');
    if (bits[0] === 'evidence') return { view: 'evidence', id: artifacts.some(a => a.id === bits[1]) ? bits[1] : artifacts[0].id };
    if (['sources', 'capstone'].includes(bits[0])) return { view: bits[0] };
    return { view: 'catalog', id: modules.some(m => m.id === bits[1]) ? bits[1] : '01' };
  }

  // Learning path: the three courses and their modules, the capstone, then the course workspace.
  function chapter(href, num, title, note, current, word = false) {
    return `<a class="chapter" href="${href}"${current ? ' aria-current="page"' : ''}><span class="num${word ? ' word' : ''}">${num}</span><span><b>${esc(title)}</b><small>${esc(note)}</small></span></a>`;
  }
  function pathMarkup(r) {
    return parts.map(part => `<div class="path-course">Course ${part.number} · ${esc(part.title)}</div>${part.modules.map(id => {
      const m = modules.find(item => item.id === id), here = r.view === 'catalog' && r.id === id;
      return chapter(`#catalog/${id}`, id, m.title, here ? 'Current module' : hours(m.hours), here);
    }).join('')}${part.capstone ? chapter('#capstone', 'ATO', 'Authorization to Operate capstone', '4 hours · guided exercise', r.view === 'capstone', true) : ''}`).join('')
      + `<div class="path-course">Course workspace</div>${chapter('#evidence', 'BoE', 'Body of Evidence', '10 practice artifacts', r.view === 'evidence', true)}${chapter('#sources', 'Ref', 'Source documents', 'Official references', r.view === 'sources', true)}`;
  }
  function renderPath(r) {
    $('module-list').innerHTML = pathMarkup(r);
    $('module-list-mobile').innerHTML = pathMarkup(r);
    $('mobile-summary').textContent = r.view === 'catalog' ? `Module ${r.id} of 12 · Browse the learning path` : `${viewLabel(r)} · Browse the learning path`;
    main.querySelector('.mobile-path').open = false;
  }

  function lessonBody(index, pick) {
    const content = lessons[index].learn[pick];
    return `<h3 class="panel-title">${esc(content[0])}</h3>${content.slice(1).map(p => `<p>${esc(p)}</p>`).join('')}`;
  }
  function quiz(index) {
    const [question, answers, correct, explanation] = lessons[index].quiz, answered = state.answers[index];
    return `<section class="quiz" aria-labelledby="quiz-title"><div class="eyebrow ink">Check your understanding</div><h3 id="quiz-title">${esc(question)}</h3>${answers.map((answer, i) => `<button type="button" class="answer${answered === i ? ' selected' : ''}" aria-pressed="${answered === i}" data-answer="${i}">${String.fromCharCode(65 + i)}. ${esc(answer)}</button>`).join('')}${answered === undefined ? '' : `<p class="feedback${answered === correct ? '' : ' wrong'}" role="status"><strong>${answered === correct ? 'Correct.' : 'Review the reasoning.'}</strong> ${esc(explanation)}</p>`}</section>`;
  }
  const nextStep = (step, label) => `<div class="step-next"><button type="button" class="btn" data-next="${step}">Continue to ${label} →</button></div>`;

  function renderModule(id) {
    const index = modules.findIndex(m => m.id === id), m = modules[index], l = lessons[index], part = partOf(id);
    const step = state.step[id] || 'learn', pick = state.lesson[id] || 0;
    const artifact = artifacts.find(a => a.id === l.artifact);
    const previous = modules[index - 1], next = modules[index + 1];
    const panel = (name, body) => `<section class="content" role="tabpanel" id="${name}-panel" aria-labelledby="${name}-tab"${name === step ? '' : ' hidden'}>${body}</section>`;
    card.className = 'lesson';
    card.innerHTML = `<header class="lesson-head"><div class="eyebrow">Course ${part.number} / Module ${m.id} of 12 · ${esc(m.phase)}</div><h2 id="view-title">${esc(m.title)}</h2><p>${esc(m.outcome)}</p><p class="module-facts"><span>${hours(m.hours)}</span><span>Three lessons</span><span>Source references ${esc(m.sources)}</span></p></header>
      <div class="tabs" role="tablist" aria-label="Module ${m.id} steps">${steps.map(([key, label], i) => `<button type="button" role="tab" id="${key}-tab" data-step="${key}" aria-controls="${key}-panel" aria-selected="${key === step}" tabindex="${key === step ? 0 : -1}">${i + 1} · ${label}</button>`).join('')}</div>
      ${panel('learn', `<div class="callout"><b>Learn · three lessons</b><p>Read the concept primers, then work through the example and the practice task.</p></div><div class="lesson-picks" role="tablist" aria-label="Module ${m.id} lessons">${m.lessons.map((label, i) => `<button type="button" role="tab" id="pick-${i}" data-lesson="${i}" aria-selected="${i === pick}" aria-controls="lesson-panel" tabindex="${i === pick ? 0 : -1}"><small>Lesson ${esc(label.split(' ')[0])}</small>${esc(label.slice(label.indexOf(' ') + 1))}</button>`).join('')}</div><div class="lesson-body" role="tabpanel" id="lesson-panel" aria-labelledby="pick-${pick}" tabindex="0">${lessonBody(index, pick)}</div><p class="help">Source references ${esc(m.sources)} · <a class="text-link" href="#sources">View the source documents</a></p>${nextStep('see', 'the worked example')}`)}
      ${panel('see', `<div class="eyebrow ink">Worked example</div><h3 class="panel-title">${esc(l.example[0])}</h3>${l.example[1].map(([label, text], i) => `<section class="step"><span class="stepnum">${i + 1}</span><h3>${esc(label)}</h3><p>${esc(text)}</p></section>`).join('')}${nextStep('build', 'Build')}`)}
      ${panel('build', `<div class="callout"><b>Create the practice artifact</b><p>${esc(m.build)}</p></div><aside class="model-link"><b>Body of Evidence</b><p>Compare a completed excerpt of the ${esc(artifact.title)} with its blank starter, then download either one to work from.</p><a href="#evidence/${artifact.id}">Open the ${esc(artifact.title)} →</a></aside>${m.model ? `<aside class="model-link"><b>See it inside the network · ${esc(m.model.title)}</b><p>${esc(m.model.text)}</p><a href="${esc(m.model.href)}">${esc(m.model.label)} →</a></aside>` : ''}${nextStep('prove', 'Prove')}`)}
      ${panel('prove', `<div class="callout warm"><b>Explain and defend your work</b><p>${esc(m.prove)}</p></div><p class="help">Use your artifact and evidence references to support your answer.</p>${quiz(index)}`)}
      <footer class="lesson-foot">${previous ? `<a class="btn" href="#catalog/${previous.id}">← Previous module</a>` : '<span></span>'}${next ? `<a class="btn primary" href="#catalog/${next.id}">Next module →</a>` : '<a class="btn primary" href="#capstone">Open the capstone →</a>'}</footer>`;
    syncNetwork();
  }

  function renderTable(columns, rows) {
    return `<div class="table-wrap"><table><thead><tr>${columns.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const wideHead = (eyebrow, title, lead) => `<header class="lesson-head"><div class="eyebrow">${eyebrow}</div><h2 id="view-title">${title}</h2><p>${lead}</p></header>`;

  function renderEvidence(id) {
    const a = artifacts.find(item => item.id === id), example = state.mode === 'example';
    const preview = a.fields ? `<div class="fields">${a.fields.map(f => `<div class="field"><strong>${esc(f[0])}</strong><p>${esc(sampleDates(f[example ? 2 : 1]))}</p></div>`).join('')}</div>` : renderTable(a.columns, example ? a.rows : [a.template]);
    card.className = 'lesson wide';
    card.innerHTML = `${wideHead('Course workspace / Body of Evidence · 10 practice artifacts', 'Body of Evidence', 'Follow the same logging example from implementation to evidence, finding, corrective action, and decision support. Compare a completed excerpt with its blank starter.')}
      <div class="content"><div class="evidence-layout"><nav class="artifact-menu" aria-label="Practice artifacts">${artifacts.map(item => `<button type="button" data-artifact="${item.id}" aria-pressed="${item.id === id}"><span>${esc(item.short)}</span>${esc(item.title)}</button>`).join('')}</nav>
      <article class="artifact-sheet" aria-labelledby="artifact-title"><div class="artifact-sheet-head"><div><div class="eyebrow ink">${esc(a.kind)}</div><h3 id="artifact-title">${esc(a.title)}</h3><p>Owner: ${esc(a.owner)}</p></div><div class="toggle" role="group" aria-label="Artifact view"><button type="button" data-mode="example" aria-pressed="${example}">Example</button><button type="button" data-mode="template" aria-pressed="${!example}">Blank starter</button></div></div>
      <div class="artifact-actions"><button type="button" class="btn primary" data-download="md">↓ ${example ? 'Example' : 'Starter'} · Markdown</button>${a.columns ? '<button type="button" class="btn" data-download="csv">↓ CSV</button>' : ''}<a class="btn" href="#catalog/${a.module}">Related module ${a.module}</a></div>
      <div class="artifact-preview"><h4>${example ? 'Fictional exercise excerpt' : 'Your starting structure'}</h4><p>${esc(a.purpose)}</p>${preview}</div><div class="artifact-note">${esc(a.note)}</div></article></div>
      <p class="help workspace-note">These downloadable starters are editable text documents. Use the Word catalog for the complete course outline. The exercise index describes technical records to collect; those exports are not included.</p></div>`;
  }

  function renderCapstone() {
    card.className = 'lesson wide';
    card.innerHTML = `${wideHead('Course 2.3 / Capstone · 4 hours · guided exercise', 'Authorization to Operate package capstone', 'Assemble and defend the fictional enclave’s authorization package. Show where the evidence supports a conclusion, where it does not, and what happens next.')}
      <div class="content"><div class="capstone-intro"><section class="card-panel"><h3>Your submission</h3><ol class="deliverables"><li>Package manifest, scope statement, inventory, architecture, and categorization rationale.</li><li>SSP excerpt and control traceability matrix covering the selected practice objectives.</li><li>Evidence index, assessment plan, and SAR excerpt with supported conclusions.</li><li>At least two justified findings, risk analysis, POA&amp;M entries, and one remediation retest record, with any risk response (RA-7) presented for the AO’s acceptance decision (CA-6).</li><li>Executive summary, five minute risk briefing, decision exercise record, and monitoring/change-impact update.</li></ol></section><section class="card-panel"><div class="eyebrow ink">Practice scope</div><h3>Nine controls, one coherent story</h3><p class="control-ids">AC-2 · AU-2 · AU-3 · AU-6 · AU-12<br>CM-6 · RA-5 · SI-2 · CP-9</p><p>Record the exact adopted requirements, parameters, and assessment objectives. This selection is a teaching subset; the actual system baseline follows its governing authority.</p><p>Use the logging trail in the evidence workspace as the model. Add a second finding and the remaining evidence needed for your selected objectives. Rules still pending in the Inside the Network policy register (F04, F09, F12, F15, F16, and the A01–A04 management protocols) are a good source: F15, for example, leaves Nessus without an approved scan scope for RA-5. Web to SQL is not one of them: SBD-APPS01 is the only SQL consumer, so web to SQL is denied, and the attack drill tests that denial. Only the AO can accept risk (CA-6).</p><a class="text-link" href="#evidence/manifest">Start with the package manifest →</a></section></div>
      <section class="card-panel"><h3>Course scoring rubric</h3><div class="score-total"><strong>100</strong><span>available points · completion threshold: 80</span></div>${renderTable(['Criterion','Points','What the reviewer looks for'],[
      ['System and authority','20','Scope, dependencies, categorization, and governing requirements agree.'],
      ['Traceability','25','Each selected objective links to implementation, evidence, and a conclusion or explicit gap.'],
      ['Assessment quality','20','Methods and observations support conclusions; limitations remain visible.'],
      ['Risk and remediation','20','Risk relates to mission impact; actions have owners, dates, and verification criteria.'],
      ['Review and sustainment','15','The package is consistent, the briefing is clear, and changes update the right artifacts.']])}<p class="help">Revisions are required for unsupported successful assessment claims, inconsistent boundaries, or a claim that the learner granted a real ATO. Course completion is a training outcome; the AO makes the authorization decision.</p></section>
      <h3 class="panel-title">The review sequence</h3><div class="review-chain"><div><small>01 / ASSEMBLE</small><h3>Reconcile the package</h3><p>Check identifiers, scope, dates, versions, findings, and open actions.</p></div><div><small>02 / DEFEND</small><h3>Brief the risk</h3><p>Explain mission need, significant results, limitations, and proposed responses.</p></div><div><small>03 / RESPOND</small><h3>Handle the challenge</h3><p>Identify the evidence and decision owner needed to resolve a reviewer’s question.</p></div><div><small>04 / MAINTAIN</small><h3>Process the change</h3><p>Update affected records and follow the required reassessment and review process.</p></div></div>
      <h3 class="panel-title">Reviewer challenges</h3><p class="help">Try each question before opening its review guidance.</p>${[
      ['An inherited-control reference has expired. What changes?','Identify the provider, affected objectives, validity period, and available current assurance. Request updated evidence, assess the effect of the gap, and update the inheritance, traceability, assessment, and risk records as needed. Do not silently keep the old reference as current.'],
      ['A scan reports no findings, but credentials failed. Can the finding close?','Confirm which checks actually ran and which assets were affected. Record the coverage limitation, correct access, repeat the intended checks, and have the designated reviewer verify the result before closure. Preserve the original record.'],
      ['A new service crosses the documented boundary. What must be reviewed?','Identify the new information flow, system owner, data, dependencies, and protection requirements. Revisit the boundary and categorization assumptions, determine affected controls, and update architecture, SSP, evidence, assessment, and risk records. Follow the authority’s change-review and notification process.']
      ].map(([q, a]) => `<details class="challenge"><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('')}</div>
      <footer class="lesson-foot"><a class="btn" href="#catalog/12">← Module 12</a><a class="btn primary" href="#evidence/manifest">Open the package manifest →</a></footer>`;
  }

  function renderSources() {
    card.className = 'lesson wide';
    card.innerHTML = `${wideHead('Course workspace / Governing context &amp; references', 'Source documents', 'Choose the applicable authority and record the adopted versions before using a template. The module reference numbers correspond to the documents below.')}
      <div class="content"><div class="sources-grid"><section class="card-panel"><h3>Official references</h3><ol class="reference-list">${sources.map(([title, description, url], i) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">[${i + 1}] ${esc(title)} ↗</a><p>${esc(description)}</p></li>`).join('')}</ol></section><section class="card-panel"><h3>Distinctions the course teaches</h3>${[
      ['RMF lifecycle','NIST SP 800-37 Revision 2 makes Prepare explicit before Categorize, Select, Implement, Assess, Authorize, and Monitor. When using historical JSIG material, keep its lifecycle and revision context clear.'],
      ['Federal and national security contexts','SP 800-53B baselines do not by themselves resolve national security system or SAP control selection. Apply the relevant CNSS direction, overlays, program requirements, and authorized tailoring.'],
      ['DoD and SAP guidance','Apply DoDI 8510.01 and Component/AO direction. DoDM 5205.07 (January 17, 2025) refers to JSIG or its successor. Confirm the program-approved guidance; do not treat the public 2016 JSIG as a current Revision 5 control catalog.'],
      ['DCSA transition','DCSA has announced the DCSA Assessment and Authorization Guide (DAAG) as the successor to the DAAPM. Confirm the version and effective date that apply to your system, and obtain the guide and supporting instructions through authorized DCSA channels.'],
      ['Control and procedure versions','The official NIST 800-53, 800-53A, and 800-53B pages identify Release 5.2.0 dated August 27, 2025. Record the version adopted by the responsible authority and map revisions explicitly.'],
      ['Fictional lab context','The optional lab is isolated, with manual, human-controlled transfers using approved removable media. Its Moderate/Low/Low planning input is a teaching assumption. General RMF lessons apply across system architectures.']
      ].map(([title, body]) => `<div class="guidance-item"><h4>${esc(title)}</h4><p>${esc(body)}</p></div>`).join('')}</section></div></div>`;
  }

  function artifactText(a, format) {
    const example = state.mode === 'example', rows = a.columns ? (example ? a.rows : [a.template]) : [];
    if (format === 'csv') return '﻿' + [a.columns, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const pipe = value => String(value).replace(/\|/g,'\\|').replace(/\n/g,' ');
    const body = a.fields ? a.fields.map(f => `## ${f[0]}\n\n${sampleDates(f[example ? 2 : 1])}`).join('\n\n') : [a.columns, a.columns.map(()=>'---'), ...rows].map(row => `| ${row.map(pipe).join(' | ')} |`).join('\n');
    return `# ${a.title}\n\nSecure By Design — ${example ? 'fictional training example' : 'blank training starter'}\n\n${a.purpose}\n\nOwner: ${a.owner}\n\n${body}\n\n---\n\n${a.note}\n`;
  }

  function downloadArtifact(format) {
    const a = artifacts.find(item => item.id === route().id);
    if (!a || !['md','csv'].includes(format) || (format === 'csv' && !a.columns)) return;
    const url = URL.createObjectURL(new Blob([artifactText(a, format)], {type:format === 'csv' ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = `SBD_${a.id}_${state.mode}.${format}`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = `${a.title} ${state.mode} downloaded.`;
  }

  // Tabs: the module's four steps and, inside Learn, its three lessons. Arrow keys, Home and End move between them.
  function selectStep(step, focus = false) {
    const r = route();
    if (r.view !== 'catalog' || !steps.some(([key]) => key === step)) return;
    state.step[r.id] = step;
    for (const [key] of steps) {
      const tab = $(`${key}-tab`), selected = key === step;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      $(`${key}-panel`).hidden = !selected;
    }
    if (focus) $(`${step}-tab`).focus();
  }
  function selectLesson(pick, focus = false) {
    const r = route(), index = modules.findIndex(m => m.id === r.id);
    if (r.view !== 'catalog' || !Number.isInteger(pick) || pick < 0 || pick > 2) return;
    state.lesson[r.id] = pick;
    card.querySelectorAll('[data-lesson]').forEach(button => {
      const selected = Number(button.dataset.lesson) === pick;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    const panel = $('lesson-panel');
    panel.innerHTML = lessonBody(index, pick); panel.setAttribute('aria-labelledby', `pick-${pick}`);
  }

  // The authorization view: which parts this module works with, its caption, and the selected part's details.
  function syncNetwork() {
    const r = route();
    if (r.view !== 'catalog') return;
    const index = modules.findIndex(m => m.id === r.id), m = modules[index], scene = net.scene, boundary = state.boundary;
    const node = scene.nodes.find(n => n.id === state.selected) || scene.nodes[0];
    $('module-view').setAttribute('aria-pressed', String(!boundary));
    $('boundary-view').setAttribute('aria-pressed', String(boundary));
    $('stage-status').textContent = boundary ? scene.completeStatus : net.modules[index].status;
    $('network-label').textContent = boundary ? 'THE WHOLE BOUNDARY' : `MODULE ${m.id} · ${m.phase.toUpperCase()}`;
    $('network-caption').textContent = boundary ? scene.completeCaption : net.modules[index].caption;
    $('motion').textContent = state.motion ? 'Pause motion' : 'Play motion';
    $('motion').setAttribute('aria-pressed', String(state.motion));
    $('system-buttons').querySelectorAll('[data-node]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.node === node.id)));
    const offline = node.kind === 'offline' ? 'OFFLINE · ' : '';
    $('node-state').textContent = boundary ? `${offline}INSIDE THE AUTHORIZATION BOUNDARY` : node.focus.includes(index) ? `${offline}IN THIS MODULE’S FOCUS` : `${offline}ELSEWHERE IN THE BOUNDARY`;
    $('node-title').textContent = node.title;
    $('node-description').textContent = node.description;
    const detail = { stage: index, selected: node.id, motion: state.motion, complete: boundary };
    window.SBD_NETWORK_STATE = detail;
    window.dispatchEvent(new CustomEvent('sbd-network-state', { detail }));
  }
  $('system-buttons').innerHTML = net.scene.nodes.map(n => `<button type="button" data-node="${n.id}" aria-pressed="false">${esc(n.button)}</button>`).join('');
  $('system-buttons').addEventListener('click', event => { const b = event.target.closest('[data-node]'); if (b) { state.selected = b.dataset.node; syncNetwork(); } });
  window.addEventListener('sbd-select-node', event => { state.selected = event.detail; syncNetwork(); });
  $('module-view').addEventListener('click', () => { state.boundary = false; syncNetwork(); });
  $('boundary-view').addEventListener('click', () => { state.boundary = true; syncNetwork(); });
  $('motion').addEventListener('click', () => { state.motion = !state.motion; syncNetwork(); });
  $('reset-view').addEventListener('click', () => window.dispatchEvent(new Event('sbd-reset-camera')));

  function viewLabel(r) {
    return r.view === 'catalog' ? modules.find(m => m.id === r.id).title : ({evidence:'Body of Evidence', capstone:'Authorization to Operate capstone', sources:'Source documents'}[r.view]);
  }
  function render(shouldFocus = false) {
    const r = route();
    renderPath(r);
    $('network').hidden = r.view !== 'catalog';
    if (r.view === 'catalog') renderModule(r.id);
    else if (r.view === 'evidence') renderEvidence(r.id);
    else if (r.view === 'capstone') renderCapstone();
    else renderSources();
    document.title = `${viewLabel(r)} | Secure By Design Training`;
    document.documentElement.classList.remove('guide-pending');
    if (shouldFocus) { card.setAttribute('tabindex', '-1'); card.focus({preventScroll:true}); card.scrollIntoView({block:'start'}); }
  }

  card.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.step) selectStep(button.dataset.step);
    else if (button.dataset.next) { selectStep(button.dataset.next, true); $('lesson').scrollIntoView({block:'start', behavior: state.motion ? 'smooth' : 'auto'}); }
    else if (button.dataset.lesson !== undefined) selectLesson(Number(button.dataset.lesson));
    else if (button.dataset.answer !== undefined) {
      const r = route(), index = modules.findIndex(m => m.id === r.id);
      state.answers[index] = Number(button.dataset.answer);
      card.querySelector('.quiz').outerHTML = quiz(index);
      card.querySelector(`[data-answer="${state.answers[index]}"]`).focus();
    }
    else if (button.dataset.artifact) location.hash = `evidence/${button.dataset.artifact}`;
    else if (button.dataset.mode) {
      state.mode = button.dataset.mode;
      renderEvidence(route().id);
      card.querySelector(`[data-mode="${state.mode}"]`).focus({preventScroll:true});
    } else if (button.dataset.download) downloadArtifact(button.dataset.download);
  });
  card.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const tab = event.target.closest('[data-step], [data-lesson]');
    if (!tab || tab.getAttribute('role') !== 'tab') return;
    event.preventDefault();
    const move = (current, count) => event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (current + (event.key === 'ArrowRight' ? 1 : count - 1)) % count;
    if (tab.dataset.step) {
      const current = steps.findIndex(([key]) => key === tab.dataset.step);
      selectStep(steps[move(current, steps.length)][0], true);
    } else selectLesson(move(Number(tab.dataset.lesson), 3), true);
  });
  window.addEventListener('hashchange', () => { if (location.hash !== '#main') render(true); });
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault(); main.focus({preventScroll:true}); main.scrollIntoView({block:'start'});
  });
  render();
})();
