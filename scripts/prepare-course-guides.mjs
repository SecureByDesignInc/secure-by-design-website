// Builds the interactive guide for each configuration course (1.2–1.10) at public/training/<id>/index.html,
// in the course 1.1 guide's design: its stylesheet (scripts/course-guide/style.css, copied from the 1.1
// guide), markup, renderer and 3D lesson network. Lesson content comes from content/configuration-courses.json;
// guide-only content (step headings, security reasoning, checklists, the network scene) from
// content/course-guides/<id>.json. Run by prepare-content.mjs; the generated pages are committed too.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
// SBD_COURSES, SBD_CATALOG, SBD_GUIDES and SBD_OUT point the script at draft copies (absolute paths), so new
// course content can be validated without touching the shared files. The default is the repository itself.
const draft = { 'content/configuration-courses.json': process.env.SBD_COURSES, 'content/videos.json': process.env.SBD_CATALOG };
const read = path => readFileSync(draft[path] ? pathToFileURL(draft[path]) : new URL(path, root), 'utf8');
const guidesDir = process.env.SBD_GUIDES ? pathToFileURL(process.env.SBD_GUIDES.replace(/\/?$/, '/')) : new URL('content/course-guides/', root);
const outDir = process.env.SBD_OUT ? pathToFileURL(process.env.SBD_OUT.replace(/\/?$/, '/')) : new URL('public/training/', root);
const json = path => JSON.parse(read(path));
const library = json('content/videos.json');
const configurations = json('content/configuration-courses.json');
const resources = json('content/training-resources.json');
const style = read('scripts/course-guide/style.css');
const renderer = read('scripts/course-guide/renderer.js');
const sceneModule = read('scripts/course-guide/scene.js');

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const Count = n => { const w = words[n] ?? String(n); return w[0].toUpperCase() + w.slice(1); };
const sharedSources = [
  { id: 'rmf', title: 'NIST · Risk Management Framework SP 800-37 Rev. 2', url: 'https://csrc.nist.gov/pubs/sp/800/37/r2/final' },
  { id: 'controls', title: 'NIST · Security controls SP 800-53 Rev. 5', url: 'https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final' },
];
const kinds = new Set(['server', 'offline', 'workstation', 'fleet', 'viewpoint']);
const extraStyle = '.callout ul{margin:0;padding-left:18px;font-size:12px;line-height:1.6}.callout li+li{margin-top:4px}.callout.recap p{font-size:12px;margin:10px 0 0}.content .help{margin-top:8px}.info ul{font-size:12px;line-height:1.6;padding-left:18px;margin:10px 0}';

function fail(id, message) { throw new Error(`Course guide ${id}: ${message}`); }
function text(id, where, value, max = 2000) {
  if (typeof value !== 'string' || !value.trim()) fail(id, `${where} must be non-empty text`);
  if (value.length > max) fail(id, `${where} is longer than ${max} characters`);
  return value;
}

function buildLesson(course, configuration, guide) {
  const id = course.id;
  const nodeIds = new Set();
  for (const node of guide.scene.nodes) {
    if (nodeIds.has(node.id) || node.id === 'core') fail(id, `duplicate or reserved node id ${node.id}`);
    nodeIds.add(node.id);
    if (!kinds.has(node.kind)) fail(id, `node ${node.id} has unknown kind ${node.kind}`);
    if (!['back', 'front'].includes(node.row ?? 'back')) fail(id, `node ${node.id} row must be back or front`);
    if (!node.existing && !Number.isInteger(node.from)) fail(id, `node ${node.id} needs existing:true or a from lesson index`);
    if (Number.isInteger(node.from) && (node.from < 0 || node.from >= configuration.lessons.length)) fail(id, `node ${node.id} from is out of range`);
    for (const key of ['name', 'sub', 'title', 'description']) text(id, `node ${node.id} ${key}`, node[key], key === 'description' ? 600 : 80);
  }
  if (guide.scene.nodes.filter(n => (n.row ?? 'back') === 'back').length > 5 || guide.scene.nodes.filter(n => n.row === 'front').length > 5) fail(id, 'at most five nodes per row');
  for (const flow of guide.scene.flows ?? []) {
    // "core" names the core router (the switch drawn in the middle of every scene).
    const known = name => nodeIds.has(name) || name === 'core';
    if (!known(flow.from) || !known(flow.to) || flow.from === flow.to) fail(id, `flow ${flow.from}→${flow.to} must join two different nodes (or a node and "core")`);
    if (!Array.isArray(flow.lessons) || !flow.lessons.every(i => Number.isInteger(i) && i >= 0 && i < configuration.lessons.length)) fail(id, `flow ${flow.from}→${flow.to} lessons must be lesson indexes`);
  }
  const sourceIds = new Set(configuration.sources.map(s => s.id));
  const chapters = configuration.lessons.map((item, index) => {
    const extra = guide.lessons[item.id];
    if (!extra) fail(id, `missing guide content for lesson ${item.id}`);
    if (!Array.isArray(extra.stepTitles) || extra.stepTitles.length !== item.steps.length) fail(id, `lesson ${item.id} needs ${item.steps.length} step titles`);
    extra.stepTitles.forEach((t, i) => text(id, `lesson ${item.id} step title ${i + 1}`, t, 70));
    if (!Array.isArray(extra.checklist) || extra.checklist.length !== 3) fail(id, `lesson ${item.id} needs three checklist items`);
    extra.checklist.forEach((t, i) => text(id, `lesson ${item.id} checklist ${i + 1}`, t, 240));
    for (const key of ['short', 'tag', 'status', 'mistake', 'network']) text(id, `lesson ${item.id} ${key}`, extra[key], key === 'short' ? 28 : key === 'tag' || key === 'status' ? 40 : 700);
    for (const key of ['id', 'name', 'phase', 'body', 'question']) text(id, `lesson ${item.id} control ${key}`, extra.control?.[key], 700);
    if (!/^[A-Z]{2}-\d+(\(\d+\))?$/.test(extra.control.id)) fail(id, `lesson ${item.id} control id ${extra.control.id} is not a NIST control identifier`);
    for (const s of item.sources) if (!sourceIds.has(s)) fail(id, `lesson ${item.id} cites unknown source ${s}`);
    return {
      id: item.id,
      short: extra.short,
      title: item.title,
      tag: extra.tag,
      status: extra.status,
      outcome: item.summary,
      minutes: item.minutes,
      objectives: item.objectives,
      steps: item.steps.map((step, i) => [extra.stepTitles[i], step]),
      commandLabel: 'Inspect your configuration',
      commandNote: 'Run the relevant checks in an elevated PowerShell session — or a shell, on the Linux servers — on the host identified in the lesson. Adapt the example names and paths to your lab.',
      command: item.command,
      expected: item.check,
      mistake: extra.mistake,
      network: extra.network,
      control: extra.control,
      evidencePrompt: item.evidence,
      checklist: extra.checklist,
      quizzes: item.quizzes.map(q => ({ prompt: q.question, answers: q.answers, correct: q.correct, feedback: q.explanation })),
      recap: item.recap,
      next: item.next,
      sources: item.sources,
      ...(item.model ? { model: item.model } : {}),
      index,
    };
  });
  return {
    id: `sbd-${id}`,
    courseId: id,
    number: course.number,
    title: course.title,
    version: course.training.materialsEdition,
    // Saved browser records survive content edits within a course; bump only if lesson IDs change.
    recordVersion: '1',
    storageKey: `sbd-${id}-guide-v1`,
    scope: configuration.labNote,
    prerequisites: configuration.prerequisites,
    sample: guide.sample ?? [],
    sources: [...configuration.sources, ...sharedSources.filter(s => !sourceIds.has(s.id))],
    chapters,
    scene: guide.scene,
  };
}

function page(course, configuration, guide, lesson) {
  const id = course.id;
  const n = configuration.lessons.length;
  const t = course.training;
  const bookmark = resources.find(r => r.url === `https://securebydesigninc.com/training/${id}` && /-guide$/.test(r.id))?.id;
  if (!bookmark && !process.env.SBD_OUT) fail(id, 'no guide entry in content/training-resources.json');
  const data = JSON.stringify(lesson).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(course.title)} | Secure By Design</title>
<meta name="description" content="${esc(course.description)}">
<link rel="canonical" href="https://securebydesigninc.com/training/${id}/"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>document.documentElement.classList.add('guide-pending')</script>
<link rel="expect" href="#guide-markup" blocking="render">
<style>${style}${extraStyle}</style>
</head><body>
<a class="skip" href="#lesson">Skip to lesson</a>
<header class="top"><a class="brand" href="https://securebydesigninc.com/" target="_blank" rel="noopener"><img src="/training/guide/brand.png" alt=""><div><b>Secure By Design</b><small>Educate. Empower. Secure the future.</small></div></a><nav class="topnav" aria-label="Site and course materials"><span class="pill">Course ${esc(course.number)} · Materials edition ${esc(t.materialsEdition)}</span><a class="btn" href="https://securebydesigninc.com/">Home</a><a class="btn" href="https://securebydesigninc.com/my-progress">My Account</a><a class="btn" href="https://securebydesigninc.com/training" target="_blank" rel="noopener">Training Library ↗</a><a class="btn" href="${esc(t.package)}" download>↓ Training materials</a></nav></header>
<section class="hero"><div><div class="eyebrow">THE NETWORK BUILD SERIES / COURSE ${esc(course.number)}</div><h1>${esc(guide.hero.title)} <span>${esc(guide.hero.accent)}</span></h1><p>${esc(guide.hero.text)}</p></div><div class="kitcard"><div class="book"><img src="/training/guide/brand.png" alt=""><span>${guide.book.map(esc).join('<br>')}</span></div><div><b>Your course companion</b><p>Interactive lesson · 3D network<br>Workbook · Personal evidence record</p><a href="${esc(t.package)}" download>Download the training materials →</a></div></div></section>
<section class="sbd-account-progress" aria-label="Account learning progress" data-course="${esc(id)}" data-guide="${esc(bookmark ?? `${id}-guide`)}" data-unit="${esc(configuration.lessons[0].id)}"><strong>Continue across the website and app</strong><p>Save learning progress and this guide to your account. Lab observations and evidence exports stay in this browser.</p><button type="button" disabled>Load account progress</button></section>
<main class="workspace"><aside class="chapters"><div class="eyebrow">YOUR LEARNING PATH</div><nav id="chapter-list" aria-label="Lesson chapters"></nav><div class="progressbox"><b id="progress-label">0 of ${n} lessons complete</b><progress id="progress" max="${n}" value="0" aria-label="Lesson completion"></progress><div class="local" id="storage-note">Progress stays in this browser. Export your record to take it with you.</div><button class="btn" id="export-side" style="margin-top:13px;font-size:10px;width:100%">↓ Export my record</button></div><div class="chapter-notice">One course. ${Count(n)} lessons.<br><br>Explore freely. Complete a lesson after recording your checks and answering its questions.</div><div class="mobile-tools" id="mobile-progress"></div></aside>
<article class="lesson" id="lesson"><header class="lesson-head"><div class="eyebrow" id="chapter-tag"></div><h2 id="chapter-title"></h2><p id="chapter-outcome"></p></header><div class="tabs" role="tablist" aria-label="Lesson content"><button role="tab" aria-selected="true" aria-controls="guide-panel" id="guide-tab" tabindex="0" data-tab="guide">Walkthrough</button><button role="tab" aria-selected="false" aria-controls="security-panel" id="security-tab" tabindex="-1" data-tab="security">Security reasoning</button><button role="tab" aria-selected="false" aria-controls="evidence-panel" id="evidence-tab" tabindex="-1" data-tab="evidence">My evidence</button></div><section class="content" role="tabpanel" aria-labelledby="guide-tab" id="guide-panel"></section><section class="content" role="tabpanel" aria-labelledby="security-tab" id="security-panel" hidden></section><section class="content" role="tabpanel" aria-labelledby="evidence-tab" id="evidence-panel" hidden></section><footer class="lesson-foot"><button class="btn" id="prev">← Previous</button><button class="btn primary" id="next">Next lesson →</button></footer></article>
<aside class="network"><section class="network-panel" aria-label="Interactive lesson network"><header class="network-head"><div><div class="eyebrow">INSIDE THE NETWORK / LESSON VIEW</div><h2>See your network take shape</h2></div><button id="reset-view" class="btn" aria-label="Reset view of the network camera">Reset view</button></header><div class="viewbar"><button aria-pressed="true" id="chapter-view">At this lesson</button><button aria-pressed="false" id="complete-view">Course complete</button></div><div class="stage" id="stage"><div class="stage-top"><span class="stage-tag">${esc(guide.scene.tag)}</span><span id="stage-status" class="stage-tag">${esc(lesson.chapters[0].status)}</span></div><div id="fallback" class="fallback" hidden>Interactive graphics are unavailable.<br>Use the system buttons and lesson descriptions below to explore the same lesson.</div><div class="stage-help">Drag to orbit · scroll to zoom · choose a system</div></div><div class="system-buttons" aria-label="Choose a system">${guide.scene.nodes.map((node, i) => `<button data-node="${esc(node.id)}" aria-pressed="${i === 0}">${esc(node.button ?? node.name)}</button>`).join('')}</div><div class="network-caption"><strong id="network-label"></strong><p id="network-caption"></p></div><div class="flow-controls"><button class="btn" id="motion" aria-pressed="true">Pause motion</button></div><div class="node-details" aria-live="polite"><small id="node-state">PLANNED SYSTEM</small><h3 id="node-title">${esc(guide.scene.nodes[0].title)}</h3><p id="node-description"></p></div></section><div class="media-card"><div class="media-icon" aria-hidden="true">▷</div><div><small>COURSE ${esc(course.number)} / VIDEO COMPANION</small><h3>Video coming soon</h3><p>The written lessons, 3D network, and workbook are ready now. A recorded walkthrough of this build is on its way.</p></div></div><a class="resource-link" href="https://securebydesigninc.com/inside-the-network" target="_blank" rel="noopener">Explore the complete Secure By Design network ↗</a></aside></main>
<footer class="statusbar"><span>© 2026 Secure By Design Team LLC<br>Course ${esc(course.number)} · Materials edition ${esc(t.materialsEdition)} · Updated ${esc(t.updated)}</span><span>Sample values · Learning model · Browser-local progress<br>${t.checklistPage ? `<a href="${esc(t.checklistPage)}" style="color:inherit;text-decoration:underline;text-underline-offset:3px;display:inline-block;padding:10px 0">Printable checklist</a>` : ''}</span></footer><div id="toast" class="toast" role="status" hidden></div><input type="file" id="import-file" accept=".json,application/json" hidden>
<span id="guide-markup" hidden></span>
<script>window.SBD_LESSON=${data};</script>
<script>${renderer}</script>
<script>document.documentElement.classList.remove('guide-pending')</script>
<script type="importmap">{"imports":{"three/core":"/training/guide/three.core.js","three":"/training/guide/three.module.js","three/orbit":"/training/guide/orbit-controls.js"}}</script>
<script type="module">${sceneModule}</script>
<script src="/training/account-progress.js" defer></script></body></html>
`;
}

// The Network Authorization page (public/training/rmf/) is hand-built, so it loads the same stylesheet and
// 3D scene as files instead of inlining them. tests/course-guides.test.mjs keeps the copies equal.
mkdirSync(new URL('guide/', outDir), { recursive: true });
writeFileSync(new URL('guide/course-guide.css', outDir), style + extraStyle);
writeFileSync(new URL('guide/scene.js', outDir), sceneModule);

let built = 0;
// ONLY=<course id> builds one guide (handy while writing its content).
for (const configuration of configurations.filter(c => !process.env.ONLY || c.id === process.env.ONLY)) {
  const course = library.courses.find(c => c.id === configuration.id);
  if (!course) throw new Error(`No Training Library entry for ${configuration.id}`);
  const file = new URL(`${course.id}.json`, guidesDir);
  if (!existsSync(file)) throw new Error(`Missing content/course-guides/${course.id}.json`);
  const guide = JSON.parse(readFileSync(file, 'utf8'));
  for (const key of ['title', 'accent', 'text']) text(course.id, `hero ${key}`, guide.hero?.[key], 400);
  const lesson = buildLesson(course, configuration, guide);
  const folder = new URL(`${course.id}/`, outDir);
  mkdirSync(folder, { recursive: true });
  writeFileSync(new URL('index.html', folder), page(course, configuration, guide, lesson));
  built += 1;
}
console.log(`Prepared ${built} course guides.`);
