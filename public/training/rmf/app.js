(() => {
  'use strict';
  const modules = window.CATALOG;
  const lessons = window.LEARNING;
  const artifacts = window.ARTIFACTS;
  const main = document.getElementById('main');
  const status = document.getElementById('status');
  const state = { lesson: {}, answers: {}, submitted: {}, mode: 'example' };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stages = ['Understand the system', 'Document and demonstrate', 'Assess and manage risk', 'Authorize and sustain'];
  const sources = [
    ['NIST SP 800-37 Revision 2','RMF lifecycle, authorization package, roles, and monitoring. See Authorize Task R-1 and Appendix F.','https://csrc.nist.gov/pubs/sp/800/37/r2/final'],
    ['NIST SP 800-53 Revision 5','Security and privacy control catalog. Record the release adopted by the governing authority.','https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final'],
    ['NIST SP 800-53A Revision 5','Control assessment procedures and examine, interview, and test methods.','https://csrc.nist.gov/pubs/sp/800/53/a/r5/final'],
    ['NIST SP 800-53B','Control baselines, tailoring, and overlays. Apply the appropriate system context.','https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final'],
    ['DoDI 8510.01','Risk Management Framework for DoD Systems, July 19, 2022.','https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/851001p.pdf'],
    ['DoDM 5205.07','Special Access Program Security Manual, January 17, 2025.','https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/520507m1.PDF'],
    ['DCSA Voice of Industry · September 2025','Official announcement of the October 1, 2025 DAAG transition.','https://www.dcsa.mil/Portals/128/Documents/CTP/tools/250930%20VOI%20Newsletter.pdf']
  ];

  function route() {
    const parts = location.hash.slice(1).split('/');
    if (parts[0] === 'evidence') return { view: 'evidence', id: artifacts.some(a => a.id === parts[1]) ? parts[1] : artifacts[0].id };
    if (['sources', 'capstone'].includes(parts[0])) return { view: parts[0] };
    return { view: 'catalog', id: modules.some(m => m.id === parts[1]) ? parts[1] : '01' };
  }

  function moduleNavigation(selected) {
    return `<div class="nav-title">The learning path <span>20 guided hours</span></div>${stages.map((stage, i) => `<p class="stage-title">${i + 1}. ${stage}</p>${modules.slice(i * 3, i * 3 + 3).map(m => `<a class="module-link" href="#catalog/${m.id}"${m.id === selected ? ' aria-current="page"' : ''}><span>${m.id}</span><span>${esc(m.title)}</span></a>`).join('')}`).join('')}<p class="nav-note">For system owners, ISSMs, ISSOs, engineers, and aspiring assessors. Basic security and system administration knowledge is helpful. Use your Inside the Network build for the practice artifacts.</p>`;
  }

  function lessonBody(index, tab) {
    const content = lessons[index].learn[tab];
    return `<h4>${esc(content[0])}</h4>${content.slice(1).map(p => `<p>${esc(p)}</p>`).join('')}`;
  }

  function quizFeedback(index) {
    if (!state.submitted[index]) return '';
    const quiz = lessons[index].quiz;
    return `<strong>${state.answers[index] === quiz[2] ? 'Correct.' : 'Review the reasoning.'}</strong> ${esc(quiz[3])}`;
  }

  function renderCatalog(id) {
    const index = modules.findIndex(m => m.id === id);
    const m = modules[index], l = lessons[index], tab = state.lesson[id] || 0;
    const artifact = artifacts.find(a => a.id === l.artifact);
    const previous = modules[index - 1], next = modules[index + 1];
    main.innerHTML = `<div class="catalog-shell">
      <aside class="module-nav"><nav class="desktop-nav" aria-label="Modules">${moduleNavigation(id)}</nav><details class="mobile-nav"><summary>Module ${id} of 12 · Browse the learning path</summary><nav aria-label="Modules on mobile">${moduleNavigation(id)}</nav></details></aside>
      <article class="module-content" aria-labelledby="module-title">
        <div class="module-heading"><div><p class="module-meta">MODULE ${id} / 12 · ${esc(m.phase)}</p><h2 id="module-title">${esc(m.title)}</h2></div><span class="time-tag">${esc(m.hours)} ${Number(m.hours) === 1 ? 'hour' : 'hours'}</span></div>
        <p class="module-outcome">${esc(m.outcome)}</p>
        <div class="step-track" aria-label="Lesson sequence">${['Learn','See','Build','Prove'].map((s,i) => `<div><b>${i+1}</b>${s}</div>`).join('')}</div>
        <section class="panel" aria-labelledby="learn-heading"><p class="section-label"><span>1</span> Learn</p><h3 id="learn-heading">Three lessons</h3><p class="muted">Read the concept primers, then work through the example and practice task.</p>
          <div class="lesson-tabs" role="tablist" aria-label="Module ${id} lessons">${m.lessons.map((label,i) => `<button type="button" role="tab" id="lesson-${i}" data-lesson="${i}" aria-selected="${i === tab}" aria-controls="lesson-panel" tabindex="${i === tab ? '0' : '-1'}"><small>LESSON ${esc(label.split(' ')[0])}</small>${esc(label.slice(label.indexOf(' ') + 1))}</button>`).join('')}</div>
          <div class="lesson-body" role="tabpanel" id="lesson-panel" aria-labelledby="lesson-${tab}" tabindex="0">${lessonBody(index, tab)}</div><p class="source-note">Source references ${esc(m.sources)} · <a href="#sources">View source documents</a></p>
        </section>
        <section class="panel" aria-labelledby="example-heading"><div class="case-top"><p class="section-label"><span>2</span> See</p><span class="badge">Worked example</span></div><h3 class="example-title" id="example-heading">${esc(l.example[0])}</h3><ol class="trail">${l.example[1].map(([label,text]) => `<li><strong>${esc(label)}</strong><p>${esc(text)}</p></li>`).join('')}</ol></section>
        <div class="two-col"><section class="panel"><p class="section-label"><span>3</span> Build</p><h3>Create the practice artifact</h3><p class="task-body">${esc(m.build)}</p><a class="task-link" href="#evidence/${artifact.id}">Open ${esc(artifact.title)}</a></section><section class="panel"><p class="section-label"><span>4</span> Prove</p><h3>Explain and defend your work</h3><p class="task-body">${esc(m.prove)}</p><p class="muted">Use your artifact and evidence references to support your answer.</p></section></div>${m.model ? `<section class="panel model-panel"><p class="section-label">See it inside the network</p><h3>${esc(m.model.title)}</h3><p class="task-body">${esc(m.model.text)}</p><a class="task-link" href="${esc(m.model.href)}">${esc(m.model.label)} →</a></section>` : ''}
        <section class="panel"><h3>Check your understanding</h3><form class="check-form" data-quiz="${index}"><fieldset><legend>${esc(l.quiz[0])}</legend>${l.quiz[1].map((answer,i) => `<label class="answer"><input type="radio" name="answer" value="${i}" required${state.answers[index] === i ? ' checked' : ''}><span>${esc(answer)}</span></label>`).join('')}</fieldset><button type="submit" class="primary">Check answer</button><div class="feedback" id="quiz-feedback" role="status" aria-live="polite">${quizFeedback(index)}</div></form></section>
        <div class="module-footer">${previous ? `<a class="secondary" href="#catalog/${previous.id}">Previous · Module ${previous.id}</a>` : '<span></span>'}${next ? `<a class="primary" href="#catalog/${next.id}">Next · Module ${next.id}</a>` : '<a class="primary" href="#capstone">Open the Authorization to Operate capstone</a>'}</div>
      </article></div>`;
  }

  function renderTable(columns, rows) {
    return `<div class="table-wrap"><table><thead><tr>${columns.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderEvidence(id) {
    const a = artifacts.find(item => item.id === id), example = state.mode === 'example';
    const preview = a.fields ? `<div class="fields">${a.fields.map(f => `<div class="field"><strong>${esc(f[0])}</strong><p>${esc(f[example ? 2 : 1])}</p></div>`).join('')}</div>` : renderTable(a.columns, example ? a.rows : [a.template]);
    main.innerHTML = `<div class="page-heading"><div><p class="eyebrow">BODY OF EVIDENCE</p><h2>Body of Evidence</h2></div><span class="time-tag">10 practice artifacts</span></div><p class="page-lead">Follow the same logging example from implementation to evidence, finding, corrective action, and decision support. Compare a completed excerpt with its blank starter.</p>
      <div class="evidence-layout"><nav class="artifact-menu" aria-label="Practice artifacts">${artifacts.map(item => `<button type="button" data-artifact="${item.id}" aria-pressed="${item.id === id}"><span>${esc(item.short)}</span>${esc(item.title)}</button>`).join('')}</nav>
      <article class="artifact-sheet" aria-labelledby="artifact-title"><div class="artifact-sheet-head"><div><p class="eyebrow">${esc(a.kind)}</p><h3 id="artifact-title">${esc(a.title)}</h3><p>Owner: ${esc(a.owner)}</p></div><div class="toggle" aria-label="Artifact view"><button type="button" data-mode="example" aria-pressed="${example}">Example</button><button type="button" data-mode="template" aria-pressed="${!example}">Blank starter</button></div></div>
      <div class="artifact-actions"><button type="button" class="primary" data-download="md">Download ${example ? 'example' : 'starter'} · Markdown</button>${a.columns ? '<button type="button" class="secondary" data-download="csv">Download CSV</button>' : ''}<a class="secondary" href="#catalog/${a.module}">Related module ${a.module}</a></div>
      <div class="artifact-preview"><h4>${example ? 'Fictional exercise excerpt' : 'Your starting structure'}</h4><p>${esc(a.purpose)}</p>${preview}</div><div class="artifact-note">${esc(a.note)}</div></article></div><p class="workspace-note">These downloadable starters are editable text documents. Use the Word catalog for the complete course outline. The exercise index describes technical records to collect; those exports are not included.</p>`;
  }

  function renderCapstone() {
    main.innerHTML = `<div class="page-heading"><div><p class="eyebrow">PUT THE PACKAGE TOGETHER</p><h2>Authorization to Operate package capstone</h2></div><span class="time-tag">4 hours · guided exercise</span></div><p class="page-lead">Assemble and defend the fictional enclave’s authorization package. Show where the evidence supports a conclusion, where it does not, and what happens next.</p>
      <div class="capstone-intro"><section class="panel"><h3>Your submission</h3><ol class="deliverables"><li>Package manifest, scope statement, inventory, architecture, and categorization rationale.</li><li>SSP excerpt and control traceability matrix covering the selected practice objectives.</li><li>Evidence index, assessment plan, and SAR excerpt with supported conclusions.</li><li>At least two justified findings, risk analysis, POA&M entries, one remediation retest record, and the recorded single-instance risk acceptance.</li><li>Executive summary, five minute risk briefing, decision exercise record, and monitoring/change-impact update.</li></ol></section><section class="panel"><p class="section-label">Practice scope</p><h3>Nine controls, one coherent story</h3><p>AC-2 · AU-2 · AU-3 · AU-6 · AU-12<br>CM-6 · RA-5 · SI-2 · CP-9</p><p class="task-body">Record the exact adopted requirements, parameters, and assessment objectives. This selection is a teaching subset; the actual system baseline follows its governing authority.</p><p class="task-body">Use the logging trail in the evidence workspace as the model. Add a second finding and the remaining evidence needed for your selected objectives. Rules still pending in the Inside the Network policy register (F04, F08, F09, F12, F14, F15, F16, and the A01–A04 management protocols) are a good source: F15, for example, leaves Nessus without an approved scan scope for RA-5. Keep the single-instance Splunk, Nessus, and ePO risk acceptance (PL-2) separate from findings.</p><a class="task-link" href="#evidence/manifest">Start with the package manifest</a></section></div>
      <section class="panel"><h3>Course scoring rubric</h3><div class="score-total"><strong>100</strong><span>available points · proposed completion threshold: 80</span></div>${renderTable(['Criterion','Points','What the reviewer looks for'],[
      ['System and authority','20','Scope, dependencies, categorization, and governing requirements agree.'],
      ['Traceability','25','Each selected objective links to implementation, evidence, and a conclusion or explicit gap.'],
      ['Assessment quality','20','Methods and observations support conclusions; limitations remain visible.'],
      ['Risk and remediation','20','Risk relates to mission impact; actions have owners, dates, and verification criteria.'],
      ['Review and sustainment','15','The package is consistent, the briefing is clear, and changes update the right artifacts.']])}<p class="muted">Revisions are required for unsupported successful assessment claims, inconsistent boundaries, or a claim that the learner granted a real ATO. Course completion is a training outcome; the AO makes the authorization decision.</p></section>
      <h3>The review sequence</h3><div class="review-chain"><div><small>01 / ASSEMBLE</small><h3>Reconcile the package</h3><p>Check identifiers, scope, dates, versions, findings, and open actions.</p></div><div><small>02 / DEFEND</small><h3>Brief the risk</h3><p>Explain mission need, significant results, limitations, and proposed responses.</p></div><div><small>03 / RESPOND</small><h3>Handle the challenge</h3><p>Identify the evidence and decision owner needed to resolve a reviewer’s question.</p></div><div><small>04 / MAINTAIN</small><h3>Process the change</h3><p>Update affected records and follow the required reassessment and review process.</p></div></div>
      <h3>Reviewer challenges</h3><p class="muted">Try each question before opening its review guidance.</p>${[
      ['An inherited-control reference has expired. What changes?','Identify the provider, affected objectives, validity period, and available current assurance. Request updated evidence, assess the effect of the gap, and update the inheritance, traceability, assessment, and risk records as needed. Do not silently keep the old reference as current.'],
      ['A scan reports no findings, but credentials failed. Can the finding close?','Confirm which checks actually ran and which assets were affected. Record the coverage limitation, correct access, repeat the intended checks, and have the designated reviewer verify the result before closure. Preserve the original record.'],
      ['A new service crosses the documented boundary. What must be reviewed?','Identify the new information flow, system owner, data, dependencies, and protection requirements. Revisit the boundary and categorization assumptions, determine affected controls, and update architecture, SSP, evidence, assessment, and risk records. Follow the authority’s change-review and notification process.']
      ].map(([q,a])=>`<details class="challenge"><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('')}`;
  }

  function renderSources() {
    main.innerHTML = `<p class="eyebrow">GOVERNING CONTEXT &amp; REFERENCES</p><h2>Source documents</h2><p class="page-lead">Choose the applicable authority and record the adopted versions before using a template. The module reference numbers correspond to the documents below.</p><div class="sources-grid"><section class="panel"><h3>Official references</h3><ol class="source-list">${sources.map(([title,description,url],i) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">[${i+1}] ${esc(title)}</a><p>${esc(description)}</p></li>`).join('')}</ol></section><section class="panel"><h3>Distinctions the course teaches</h3>${[
      ['RMF lifecycle','NIST SP 800-37 Revision 2 makes Prepare explicit before Categorize, Select, Implement, Assess, Authorize, and Monitor. When using historical JSIG material, keep its lifecycle and revision context clear.'],
      ['Federal and national security contexts','SP 800-53B baselines do not by themselves resolve national security system or SAP control selection. Apply the relevant CNSS direction, overlays, program requirements, and authorized tailoring.'],
      ['DoD and SAP guidance','Apply DoDI 8510.01 and Component/AO direction. DoDM 5205.07 (January 17, 2025) refers to JSIG or its successor. Confirm the program-approved guidance; do not treat the public 2016 JSIG as a current Revision 5 control catalog.'],
      ['DCSA transition','DCSA announced the replacement of DAAPM by DAAG effective October 1, 2025. Obtain the applicable guide and supporting instructions through authorized DCSA channels.'],
      ['Control and procedure versions','The official NIST 800-53, 800-53A, and 800-53B pages identify Release 5.2.0 dated August 27, 2025. Record the version adopted by the responsible authority and map revisions explicitly.'],
      ['Fictional lab context','The optional lab is isolated, with manual, human-controlled transfers using approved removable media. Its Moderate/Low/Low planning input is a teaching assumption. General RMF lessons apply across system architectures.']
      ].map(([title,body])=>`<div class="guidance-item"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('')}</section></div>`;
  }

  function artifactText(a, format) {
    const example = state.mode === 'example', rows = a.columns ? (example ? a.rows : [a.template]) : [];
    if (format === 'csv') return '\uFEFF' + [a.columns, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const pipe = value => String(value).replace(/\|/g,'\\|').replace(/\n/g,' ');
    const body = a.fields ? a.fields.map(f => `## ${f[0]}\n\n${f[example ? 2 : 1]}`).join('\n\n') : [a.columns, a.columns.map(()=>'---'), ...rows].map(row => `| ${row.map(pipe).join(' | ')} |`).join('\n');
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

  function selectLesson(tab, focus = false) {
    const r = route(), index = modules.findIndex(m => m.id === r.id);
    if (r.view !== 'catalog' || !Number.isInteger(tab) || tab < 0 || tab > 2) return;
    state.lesson[r.id] = tab;
    main.querySelectorAll('[data-lesson]').forEach(button => {
      const selected = Number(button.dataset.lesson) === tab;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    const panel = document.getElementById('lesson-panel');
    panel.innerHTML = lessonBody(index, tab); panel.setAttribute('aria-labelledby', `lesson-${tab}`);
  }

  function render(shouldFocus = false) {
    const r = route();
    document.getElementById('learning-share-note').hidden = !(r.view === 'capstone' || (r.view === 'catalog' && ['04', '09', '12'].includes(r.id)));
    document.querySelectorAll('[data-view]').forEach(a => {
      if (a.dataset.view === r.view) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    if (r.view === 'catalog') renderCatalog(r.id);
    else if (r.view === 'evidence') renderEvidence(r.id);
    else if (r.view === 'capstone') renderCapstone();
    else renderSources();
    const label = r.view === 'catalog' ? modules.find(m=>m.id===r.id).title : ({evidence:'Body of Evidence', capstone:'Authorization to Operate capstone', sources:'Source documents'}[r.view]);
    document.title = `${label} | Secure By Design Training`;
    if (shouldFocus) { main.focus({preventScroll:true}); main.scrollIntoView({block:'start'}); }
  }

  main.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.lesson !== undefined) selectLesson(Number(button.dataset.lesson));
    else if (button.dataset.artifact) location.hash = `evidence/${button.dataset.artifact}`;
    else if (button.dataset.mode) {
      state.mode = button.dataset.mode;
      renderEvidence(route().id);
      main.querySelector(`[data-mode="${state.mode}"]`).focus({preventScroll:true});
    } else if (button.dataset.download) downloadArtifact(button.dataset.download);
  });
  main.addEventListener('keydown', event => {
    const button = event.target.closest('[data-lesson]');
    if (!button || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = Number(button.dataset.lesson);
    selectLesson(event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : 2)) % 3, true);
  });
  main.addEventListener('submit', event => {
    const form = event.target.closest('[data-quiz]');
    if (!form) return;
    event.preventDefault();
    const answer = form.querySelector('input[name="answer"]:checked');
    if (!answer) { form.reportValidity(); return; }
    const index = Number(form.dataset.quiz);
    state.answers[index] = Number(answer.value); state.submitted[index] = true;
    document.getElementById('quiz-feedback').innerHTML = quizFeedback(index);
  });
  main.addEventListener('change', event => {
    if (!event.target.matches('input[name="answer"]')) return;
    const index = Number(event.target.closest('[data-quiz]').dataset.quiz);
    state.answers[index] = Number(event.target.value); state.submitted[index] = false;
    document.getElementById('quiz-feedback').innerHTML = '';
  });
  window.addEventListener('hashchange', () => { if (location.hash !== '#main') render(true); });
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault(); main.focus({preventScroll:true}); main.scrollIntoView({block:'start'});
  });
  render();
})();
