(() => {
  'use strict';
  // Network Authorization: courses 2.1, 2.2 and 2.3, each on its own page (/training/rmf/,
  // /training/rmf-body-of-evidence/, /training/rmf-authorization-to-operate/) built by scripts/prepare-rmf-courses.mjs
  // in the Build the Network guide design. <body data-course="2.2"> names the page's course. Modules follow the RMF
  // steps of NIST SP 800-37 Rev. 2 with the April 2016 JSIG mapped in: each module card opens on its step, tasks and
  // outputs, then Learn / See / Build / Prove, with the 3D authorization view beside it. Routes are hashes
  // (#catalog/05, #evidence/ssp, #steps, #capstone, #sources); a link to another course's module or artifact moves to
  // that course's page, so older links to /training/rmf/ keep working.
  const modules = window.CATALOG;
  const parts = window.CATALOG_PARTS;
  const lessons = window.LEARNING;
  const artifacts = window.ARTIFACTS;
  const capstone = window.CAPSTONE;
  const sources = window.RMF_SOURCES;
  const net = window.RMF_NETWORK;
  const course = parts.find(part => part.number === document.body.dataset.course) || parts[0];
  const $ = id => document.getElementById(id);
  const main = $('main');
  const card = $('lesson');
  const status = $('status');
  const state = { lesson: {}, step: {}, answers: {}, mode: 'example', selected: net.scene.nodes[0].id, boundary: false,
    motion: !matchMedia('(prefers-reduced-motion: reduce)').matches };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Prose: escaped, with task, control, record and document IDs (P-11, 5-1, AU-6, SBD-ADMIN-PC01, 800-53A) kept on one line.
  const text = value => esc(value).replace(/\b(?:[A-Z][A-Z0-9]{0,8}(?:-[A-Z0-9]{1,8})+(?:\(\d+\))?|[1-6]-[1-7]|\d{3}-\d{2,3}[A-Z]?)(?![\w-])/g, id => `<span class="nb">${id}</span>`);
  // Sample milestone dates are written as {+N}: N days after today, so the examples never go stale.
  const dateFormat = new Intl.DateTimeFormat('en-US', {month:'long', day:'numeric', year:'numeric'});
  const sampleDates = value => String(value).replace(/\{\+(\d+)\}/g, (_, days) => { const date = new Date(); date.setDate(date.getDate() + Number(days)); return dateFormat.format(date); });
  const hours = h => `${h} ${Number(h) === 1 ? 'hour' : 'hours'}`;
  const tabs = [['step', 'RMF step'], ['learn', 'Learn'], ['see', 'See'], ['build', 'Build'], ['prove', 'Prove']];
  const indexOf = id => modules.findIndex(m => m.id === id);
  const partOf = id => parts.find(part => part.modules.includes(id));
  const pageOf = part => `/training/${part.folder}/`;
  // The practice artifacts a course's modules start or update, in module order.
  const artifactsOf = part => {
    const ids = [];
    for (const id of part.modules) for (const artifact of lessons[indexOf(id)].artifacts) if (!ids.includes(artifact)) ids.push(artifact);
    return ids.map(id => artifacts.find(a => a.id === id));
  };
  const ours = artifactsOf(course);
  const isOurs = id => ours.some(a => a.id === id);
  const artifactHref = id => isOurs(id) ? `#evidence/${id}` : `${pageOf(partOf(artifacts.find(a => a.id === id).module))}#evidence/${id}`;
  const moduleHref = id => course.modules.includes(id) ? `#catalog/${id}` : `${pageOf(partOf(id))}#catalog/${id}`;

  // The 3D scene (public/training/guide/scene.js, loaded as a module after this script) reads these. Module
  // indexes are the same on every course page, so each module's focus and flows stay put.
  window.SBD_LESSON = { scene: net.scene, chapters: modules };

  function route() {
    const [view, id] = location.hash.slice(1).split('/');
    if (view === 'evidence') {
      if (!id || isOurs(id)) return { view: 'evidence', id: id || ours[0].id };
      const artifact = artifacts.find(a => a.id === id);
      return artifact ? { moved: artifactHref(id) } : { view: 'evidence', id: ours[0].id };
    }
    if (view === 'capstone') return course.capstone ? { view: 'capstone' } : { moved: `${pageOf(parts.find(part => part.capstone))}#capstone` };
    if (view === 'sources' || view === 'steps') return { view };
    if (view === 'catalog' && indexOf(id) >= 0) return course.modules.includes(id) ? { view: 'catalog', id } : { moved: moduleHref(id) };
    return { view: 'catalog', id: course.modules[0] };
  }

  // Learning path: this course's modules (and its capstone), its workspace, then the three courses.
  function chapter(href, num, title, note, current, word = false) {
    return `<a class="chapter" href="${href}"${current ? ' aria-current="page"' : ''}><span class="num${word ? ' word' : ''}">${num}</span><span><b>${esc(title)}</b><small>${esc(note)}</small></span></a>`;
  }
  function pathMarkup(r) {
    const here = (view, id) => r.view === view && (id === undefined || r.id === id);
    return `<div class="path-course">Course ${course.number} · ${esc(course.title)}</div>${course.modules.map(id => {
      const m = modules[indexOf(id)];
      return chapter(`#catalog/${id}`, id, m.title, here('catalog', id) ? `Current module · ${m.phase}` : `${m.phase} · ${hours(m.hours)}`, here('catalog', id));
    }).join('')}${course.capstone ? chapter('#capstone', 'ATO', 'Authorization to Operate capstone', '4 hours · guided exercise', here('capstone'), true) : ''}
      <div class="path-course">Course workspace</div>${chapter('#steps', 'RMF', 'RMF step map', 'Steps, tasks, and outputs', here('steps'), true)}${chapter('#evidence', 'BoE', 'Evidence workspace', `${ours.length} practice artifacts`, here('evidence'), true)}${chapter('#sources', 'Ref', 'Source documents', 'NIST, JSIG, and DoD references', here('sources'), true)}
      <div class="path-course">Network Authorization</div>${parts.map(part => part === course
        ? chapter(`#catalog/${part.modules[0]}`, part.number, part.title, 'This course', false, true)
        : chapter(`${pageOf(part)}#catalog/${part.modules[0]}`, part.number, part.title, `Modules ${part.modules[0]}–${part.modules.at(-1)}${part.capstone ? ' and the capstone' : ''}`, false, true)).join('')}`;
  }
  function renderPath(r) {
    $('module-list').innerHTML = pathMarkup(r);
    $('module-list-mobile').innerHTML = pathMarkup(r);
    $('mobile-summary').textContent = r.view === 'catalog' ? `Module ${r.id} · Browse course ${course.number}` : `${viewLabel(r)} · Browse course ${course.number}`;
    main.querySelector('.mobile-path').open = false;
  }

  function lessonBody(index, pick) {
    const content = lessons[index].learn[pick];
    return `<h3 class="panel-title">${esc(content[0])}</h3>${content.slice(1).map(p => `<p>${text(p)}</p>`).join('')}`;
  }
  function quiz(index) {
    const [question, answers, correct, explanation] = lessons[index].quiz, answered = state.answers[index];
    return `<section class="quiz" aria-labelledby="quiz-title"><div class="eyebrow ink">Check your understanding</div><h3 id="quiz-title">${esc(question)}</h3>${answers.map((answer, i) => `<button type="button" class="answer${answered === i ? ' selected' : ''}" aria-pressed="${answered === i}" data-answer="${i}">${String.fromCharCode(65 + i)}. ${esc(answer)}</button>`).join('')}${answered === undefined ? '' : `<p class="feedback${answered === correct ? '' : ' wrong'}" role="status"><strong>${answered === correct ? 'Correct.' : 'Review the reasoning.'}</strong> ${text(explanation)}</p>`}</section>`;
  }
  const nextStep = (tab, label) => `<div class="step-next"><button type="button" class="btn" data-next="${tab}">Continue to ${label} →</button></div>`;
  const taskList = (list, empty) => list.length
    ? `<ul class="task-list">${list.map(([id, name]) => `<li><b>${esc(id)}</b><span>${text(name)}</span></li>`).join('')}</ul>`
    : `<p class="help">${esc(empty)}</p>`;

  // The RMF step: tasks in both documents, who does them, what comes out, and where the documents differ.
  function stepPanel(m) {
    const r = m.rmf, foundations = m.phase === 'Foundations';
    return `<div class="controlcard step-card"><small>${foundations ? 'Before the steps' : 'RMF step'} / NIST SP 800-37 Rev. 2 with the JSIG mapped in</small><span class="controlid">${esc(r.step)}</span><h3>Who does the work</h3><p>${text(r.roles)}</p></div>
      <div class="task-grid"><section><h3 class="panel-title">NIST SP 800-37 Rev. 2 tasks</h3>${taskList(r.nist, foundations ? 'This module introduces the roles and documents every step relies on.' : 'No NIST task in this module.')}</section><section><h3 class="panel-title">JSIG (11 April 2016) tasks</h3>${taskList(r.jsig, m.phase === 'Prepare' ? 'The 2016 JSIG has no Prepare step.' : foundations ? 'This module introduces the JSIG and its edition.' : 'No JSIG task in this module.')}</section></div>
      <h3 class="panel-title">What this module produces</h3><ul class="outputs">${r.outputs.map(o => `<li>${text(o)}</li>`).join('')}</ul>
      ${r.jsigOutputs.length ? `<p class="jsig-outputs"><b>JSIG step outputs</b>${r.jsigOutputs.map(o => `<span>${esc(o)}</span>`).join('')}</p>` : ''}
      ${r.difference ? `<div class="callout warm"><b>Where the JSIG and NIST differ</b><p>${text(r.difference)}</p></div>` : ''}
      ${nextStep('learn', 'the lessons')}`;
  }
  function artifactList(ids) {
    return `<aside class="model-link artifact-links"><b>Practice artifacts</b><ul>${ids.map(id => {
      const a = artifacts.find(item => item.id === id), home = partOf(a.module);
      return `<li><a href="${artifactHref(id)}">${esc(a.title)} →</a>${isOurs(id) ? '' : ` <span class="elsewhere">course ${home.number}</span>`}<span class="purpose">${text(a.purpose)}</span></li>`;
    }).join('')}</ul></aside>`;
  }

  function renderModule(id) {
    const index = indexOf(id), m = modules[index], l = lessons[index];
    const tab = state.step[id] || 'step', pick = state.lesson[id] || 0;
    const previous = modules[index - 1], next = modules[index + 1];
    const panel = (name, body) => `<section class="content" role="tabpanel" id="${name}-panel" aria-labelledby="${name}-tab"${name === tab ? '' : ' hidden'}>${body}</section>`;
    const prevLink = !previous ? '<span></span>' : course.modules.includes(previous.id)
      ? `<a class="btn" href="#catalog/${previous.id}">← Previous module</a>`
      : `<a class="btn" href="${moduleHref(previous.id)}">← Course ${partOf(previous.id).number}</a>`;
    const nextLink = !next ? (course.capstone ? '<a class="btn primary" href="#capstone">Open the capstone →</a>' : '<span></span>')
      : course.modules.includes(next.id) ? `<a class="btn primary" href="#catalog/${next.id}">Next module →</a>`
      : `<a class="btn primary" href="${moduleHref(next.id)}">Course ${partOf(next.id).number}: ${esc(partOf(next.id).title)} →</a>`;
    card.className = 'lesson';
    card.innerHTML = `<header class="lesson-head"><div class="eyebrow">Course ${course.number} / Module ${m.id} · ${esc(m.phase)}</div><h2 id="view-title">${esc(m.title)}</h2><p>${text(m.outcome)}</p><p class="module-facts"><span>${hours(m.hours)}</span>${m.rmf.nist.length ? `<span>NIST ${esc(m.rmf.nist[0][0])}${m.rmf.nist.length > 1 ? `–${esc(m.rmf.nist.at(-1)[0])}` : ''}</span>` : ''}${m.rmf.jsig.length ? `<span>JSIG ${esc(m.rmf.jsig[0][0])}${m.rmf.jsig.length > 1 ? `–${esc(m.rmf.jsig.at(-1)[0])}` : ''}</span>` : ''}<span>Sources ${esc(m.sources)}</span></p></header>
      <div class="tabs" role="tablist" aria-label="Module ${m.id}">${tabs.map(([key, label]) => `<button type="button" role="tab" id="${key}-tab" data-step="${key}" aria-controls="${key}-panel" aria-selected="${key === tab}" tabindex="${key === tab ? 0 : -1}">${label}</button>`).join('')}</div>
      ${panel('step', stepPanel(m))}
      ${panel('learn', `<div class="lesson-picks" role="tablist" aria-label="Module ${m.id} lessons">${m.lessons.map((label, i) => `<button type="button" role="tab" id="pick-${i}" data-lesson="${i}" aria-selected="${i === pick}" aria-controls="lesson-panel" tabindex="${i === pick ? 0 : -1}"><small>Lesson ${esc(label.split(' ')[0])}</small>${esc(label.slice(label.indexOf(' ') + 1))}</button>`).join('')}</div><div class="lesson-body" role="tabpanel" id="lesson-panel" aria-labelledby="pick-${pick}" tabindex="0">${lessonBody(index, pick)}</div><p class="help">Source references ${esc(m.sources)} · <a class="text-link" href="#sources">View the source documents</a></p>${nextStep('see', 'the worked example')}`)}
      ${panel('see', `<div class="eyebrow ink">Worked example</div><h3 class="panel-title">${esc(l.example[0])}</h3>${l.example[1].map(([label, body], i) => `<section class="step"><span class="stepnum">${i + 1}</span><h3>${esc(label)}</h3><p>${text(body)}</p></section>`).join('')}${nextStep('build', 'Build')}`)}
      ${panel('build', `<div class="callout"><b>Create the practice output</b><p>${text(m.build)}</p></div>${artifactList(l.artifacts)}${m.model ? `<aside class="model-link"><b>See it inside the network · ${esc(m.model.title)}</b><p>${text(m.model.text)}</p><a href="${esc(m.model.href)}">${esc(m.model.label)} →</a></aside>` : ''}${nextStep('prove', 'Prove')}`)}
      ${panel('prove', `<div class="callout warm"><b>Explain and defend your work</b><p>${text(m.prove)}</p></div><p class="help">Use your outputs and evidence references to support your answer.</p>${quiz(index)}`)}
      <footer class="lesson-foot">${prevLink}${nextLink}</footer>`;
    syncNetwork();
  }

  function renderTable(columns, rows) {
    return `<div class="table-wrap"><table><thead><tr>${columns.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${text(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const wideHead = (eyebrow, title, lead) => `<header class="lesson-head"><div class="eyebrow">${eyebrow}</div><h2 id="view-title">${title}</h2><p>${lead}</p></header>`;

  function renderSteps() {
    card.className = 'lesson wide';
    const rows = course.modules.map(id => {
      const m = modules[indexOf(id)], r = m.rmf, list = tasks => tasks.length ? tasks.map(t => `<span class="nb">${esc(t[0])}</span>`).join(', ') : '—';
      return `<tr><td><a class="text-link" href="#catalog/${id}">${id} ${esc(m.title)}</a></td><td>${esc(r.step)}</td><td>${list(r.nist)}</td><td>${list(r.jsig)}</td><td>${r.jsigOutputs.length ? r.jsigOutputs.map(esc).join('; ') : '—'}</td></tr>`;
    }).join('');
    card.innerHTML = `${wideHead(`Course ${course.number} / RMF step map`, 'Steps, tasks, and outputs', 'Each module follows one Risk Management Framework (RMF) step in NIST SP 800-37 Revision 2 order, with the matching tasks and outputs of the Joint Special Access Program Implementation Guide (JSIG), 11 April 2016. Open a module for its roles, its outputs, and where the two documents differ.')}
      <div class="content"><div class="table-wrap"><table class="step-map"><thead><tr><th scope="col">Module</th><th scope="col">RMF step</th><th scope="col">NIST tasks</th><th scope="col">JSIG tasks</th><th scope="col">JSIG step outputs</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="callout"><b>Two documents, one sequence</b><p>NIST SP 800-37 Revision 2 has seven steps, starting with Prepare. The 2016 JSIG follows Revision 1's six steps, from Categorize to Monitor, with SP 800-53 Revision 4 and CNSSI 1253 (March 2014). Confirm whether your program directs the JSIG, its successor, or other guidance.</p></div></div>`;
  }

  function renderEvidence(id) {
    const a = artifacts.find(item => item.id === id), example = state.mode === 'example';
    const preview = a.fields ? `<div class="fields">${a.fields.map(f => `<div class="field"><strong>${esc(f[0])}</strong><p>${text(sampleDates(f[example ? 2 : 1]))}</p></div>`).join('')}</div>` : renderTable(a.columns, example ? a.rows : [a.template]);
    card.className = 'lesson wide';
    card.innerHTML = `${wideHead(`Course ${course.number} / Evidence workspace · ${ours.length} practice artifacts`, 'Evidence workspace', esc(course.workspace))}
      <div class="content"><div class="evidence-layout"><nav class="artifact-menu" aria-label="Practice artifacts">${ours.map(item => `<button type="button" data-artifact="${item.id}" aria-pressed="${item.id === id}"><span>${esc(item.short)}</span>${esc(item.title)}</button>`).join('')}</nav>
      <article class="artifact-sheet" aria-labelledby="artifact-title"><div class="artifact-sheet-head"><div><div class="eyebrow ink">${esc(a.kind)}</div><h3 id="artifact-title">${esc(a.title)}</h3><p>Owner: ${esc(a.owner)}</p></div><div class="toggle" role="group" aria-label="Artifact view"><button type="button" data-mode="example" aria-pressed="${example}">Example</button><button type="button" data-mode="template" aria-pressed="${!example}">Blank starter</button></div></div>
      <div class="artifact-actions"><button type="button" class="btn primary" data-download="md">↓ ${example ? 'Example' : 'Starter'} · Markdown</button>${a.columns ? '<button type="button" class="btn" data-download="csv">↓ CSV</button>' : ''}<a class="btn" href="${moduleHref(a.module)}">Starts in module ${a.module}${course.modules.includes(a.module) ? '' : ` · course ${partOf(a.module).number}`}</a></div>
      <div class="artifact-preview"><h4>${example ? 'Fictional exercise excerpt' : 'Your starting structure'}</h4><p>${text(a.purpose)}</p>${preview}</div><div class="artifact-note">${text(a.note)}</div></article></div>
      <p class="help workspace-note">These starters are editable text documents; the course's training materials download includes every one as Markdown (and CSV for tables). The exercise records describe technical evidence to collect; those exports are not included.</p></div>`;
  }

  function renderCapstone() {
    const c = capstone;
    card.className = 'lesson wide';
    card.innerHTML = `${wideHead(`Course ${course.number} / Capstone · 4 hours · guided exercise`, 'Authorization to Operate package capstone', 'Assemble and defend the fictional enclave’s authorization package. Show where the evidence supports a conclusion, where it does not, and what happens next.')}
      <div class="content"><div class="capstone-intro"><section class="card-panel"><h3>Your submission</h3><ol class="deliverables">${c.deliverables.map(item => `<li>${text(item)}</li>`).join('')}</ol></section><section class="card-panel"><div class="eyebrow ink">Practice scope</div><h3>${esc(c.scopeTitle)}</h3><p class="control-ids">${esc(c.scopeControls)}</p>${c.scopeText.map(p => `<p>${text(p)}</p>`).join('')}<a class="text-link" href="#evidence/manifest">Start with the package manifest →</a></section></div>
      <section class="card-panel"><h3>Course scoring rubric</h3><div class="score-total"><strong>100</strong><span>available points</span></div>${renderTable(['Criterion', 'Points', 'What the reviewer looks for'], c.rubric)}<p class="help">${text(c.rubricNote)}</p></section>
      <h3 class="panel-title">The review sequence</h3><div class="review-chain">${c.sequence.map(([label, title, body]) => `<div><small>${esc(label)}</small><h3>${esc(title)}</h3><p>${text(body)}</p></div>`).join('')}</div>
      <h3 class="panel-title">Reviewer challenges</h3><p class="help">Try each question before opening its review guidance.</p>${c.challenges.map(([q, a]) => `<details class="challenge"><summary>${text(q)}</summary><div>${text(a)}</div></details>`).join('')}</div>
      <footer class="lesson-foot"><a class="btn" href="#catalog/${course.modules.at(-1)}">← Module ${course.modules.at(-1)}</a><a class="btn primary" href="#evidence/manifest">Open the package manifest →</a></footer>`;
  }

  function renderSources() {
    card.className = 'lesson wide';
    card.innerHTML = `${wideHead(`Course ${course.number} / Governing context &amp; references`, 'Source documents', 'Choose the applicable authority and record the adopted versions before using a template. The module reference numbers correspond to the documents below.')}
      <div class="content"><div class="sources-grid"><section class="card-panel"><h3>Official references</h3><ol class="reference-list">${sources.map(([title, description, url], i) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">[${i + 1}] ${esc(title)} ↗</a><p>${esc(description)}</p></li>`).join('')}</ol></section><section class="card-panel"><h3>Distinctions the course teaches</h3>${[
      ['Steps and outputs','The modules follow NIST SP 800-37 Revision 2’s seven steps and map the 2016 JSIG’s six steps, tasks, and outputs into each one. Where the documents differ, such as where the system is registered or when the POA&M starts, the module says so.'],
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

  // Tabs: the module's five and, inside Learn, its three lessons. Arrow keys, Home and End move between them.
  function selectStep(tab, focus = false) {
    const r = route();
    if (r.view !== 'catalog' || !tabs.some(([key]) => key === tab)) return;
    state.step[r.id] = tab;
    for (const [key] of tabs) {
      const button = $(`${key}-tab`), selected = key === tab;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      $(`${key}-panel`).hidden = !selected;
    }
    if (focus) $(`${tab}-tab`).focus();
  }
  function selectLesson(pick, focus = false) {
    const r = route(), index = indexOf(r.id);
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

  // The authorization view: which parts of the network this module works with, its caption, and the chosen part.
  function syncNetwork() {
    const r = route();
    if (r.view !== 'catalog') return;
    const index = indexOf(r.id), m = modules[index], scene = net.scene, boundary = state.boundary;
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
    return r.view === 'catalog' ? modules[indexOf(r.id)].title : ({evidence:'Evidence workspace', capstone:'Authorization to Operate capstone', sources:'Source documents', steps:'RMF step map'}[r.view]);
  }
  function render(shouldFocus = false) {
    const r = route();
    if (r.moved) { location.replace(r.moved); return; }
    renderPath(r);
    $('network').hidden = r.view !== 'catalog';
    if (r.view === 'catalog') renderModule(r.id);
    else if (r.view === 'evidence') renderEvidence(r.id);
    else if (r.view === 'capstone') renderCapstone();
    else if (r.view === 'steps') renderSteps();
    else renderSources();
    document.title = `${viewLabel(r)} | Course ${course.number} · ${course.title} | Secure By Design`;
    document.documentElement.classList.remove('guide-pending');
    if (shouldFocus) { card.setAttribute('tabindex', '-1'); card.focus({preventScroll:true}); card.scrollIntoView({block:'start'}); }
  }

  card.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.step) selectStep(button.dataset.step);
    else if (button.dataset.next) { selectStep(button.dataset.next, true); card.scrollIntoView({block:'start', behavior: state.motion ? 'smooth' : 'auto'}); }
    else if (button.dataset.lesson !== undefined) selectLesson(Number(button.dataset.lesson));
    else if (button.dataset.answer !== undefined) {
      const index = indexOf(route().id);
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
    if (tab.dataset.step) selectStep(tabs[move(tabs.findIndex(([key]) => key === tab.dataset.step), tabs.length)][0], true);
    else selectLesson(move(Number(tab.dataset.lesson), 3), true);
  });
  window.addEventListener('hashchange', () => { if (location.hash !== '#main') render(true); });
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault(); main.focus({preventScroll:true}); main.scrollIntoView({block:'start'});
  });
  render();
})();
