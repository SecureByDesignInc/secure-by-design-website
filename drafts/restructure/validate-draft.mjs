// Validate one draft course without touching the repository's shared files.
//   node validate-draft.mjs <course id>
// Reads <scratchpad>/newcourses/<id>/course.json (a content/configuration-courses.json entry),
// catalog.json (a content/videos.json "courses" entry) and <id>.json (a content/course-guides entry),
// merges them into temporary copies of the repository's content, checks the lesson schema, then runs
// scripts/prepare-course-guides.mjs against the copies (ONLY=<id>), writing the page to validate/<id>/out.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const repo = '/home/claude/secure-by-design-website';
const scratch = path.dirname(new URL(import.meta.url).pathname);
const id = process.argv[2];
if (!id) { console.error('usage: node validate-draft.mjs <course id>'); process.exit(2); }
const dir = path.join(scratch, 'newcourses', id);
const work = path.join(scratch, 'validate', id);
mkdirSync(path.join(work, 'out'), { recursive: true });
const load = p => JSON.parse(readFileSync(p, 'utf8'));
const problems = [];
const check = (ok, message) => { if (!ok) problems.push(message); };

const course = load(path.join(dir, 'course.json'));
const entry = load(path.join(dir, 'catalog.json'));
check(course.id === id && entry.id === id, 'course.json and catalog.json must both have id ' + id);
for (const key of ['prerequisites', 'labNote', 'sources', 'lessons']) check(course[key] !== undefined, 'course.json is missing ' + key);
const sourceIds = new Set();
for (const s of course.sources ?? []) {
  check(s.id && s.title && /^https:\/\//.test(s.url ?? ''), 'source needs id, title and an https url: ' + JSON.stringify(s));
  check(!sourceIds.has(s.id), 'duplicate source id ' + s.id); sourceIds.add(s.id);
}
const lessonIds = new Set();
let minutes = 0;
for (const [n, l] of (course.lessons ?? []).entries()) {
  const where = `lesson ${n + 1} (${l.id})`;
  for (const key of ['id', 'title', 'minutes', 'summary', 'steps', 'command', 'check', 'evidence', 'sources', 'objectives', 'quizzes', 'recap', 'next']) check(l[key] !== undefined, `${where} is missing ${key}`);
  check(/^[a-z0-9-]+$/.test(l.id ?? ''), `${where}: id must be lowercase letters, digits and hyphens`);
  check(!lessonIds.has(l.id), `${where}: duplicate lesson id`); lessonIds.add(l.id);
  check(Number.isFinite(l.minutes) && l.minutes >= 10 && l.minutes <= 45, `${where}: minutes should be 10–45`);
  minutes += l.minutes ?? 0;
  check(Array.isArray(l.steps) && l.steps.length >= 3 && l.steps.length <= 6, `${where}: 3–6 steps`);
  check(Array.isArray(l.objectives) && l.objectives.length >= 3 && l.objectives.length <= 4, `${where}: 3–4 objectives`);
  check(Array.isArray(l.recap) && l.recap.length >= 3 && l.recap.length <= 4, `${where}: 3–4 recap lines`);
  check(Array.isArray(l.quizzes) && l.quizzes.length >= 3, `${where}: at least 3 quiz questions`);
  for (const q of l.quizzes ?? []) {
    check(q.question && Array.isArray(q.answers) && q.answers.length === 3 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 3 && q.explanation, `${where}: quiz needs question, three answers, correct 0–2, explanation`);
  }
  for (const s of l.sources ?? []) check(sourceIds.has(s), `${where}: unknown source ${s}`);
  check(typeof l.command === 'string' && l.command.trim().length > 0, `${where}: command must be non-empty text`);
  if (l.model) check(/^\/inside-the-network#(system|process|facility)=/.test(l.model.href ?? '') && l.model.label && l.model.text, `${where}: model needs href (/inside-the-network#…), label, text`);
  check(!/Windows (Server )?20\d\d|Windows 1[01]\b|Win1[01]/.test(JSON.stringify(l)), `${where}: no Windows release numbers (say Windows Server / Windows client)`);
}
for (const key of ['categoryOrder', 'number', 'estimatedHours', 'title', 'subtitle', 'description', 'tags', 'platform', 'systems', 'artLabels', 'outcomes', 'stages', 'outcomeSummary', 'networkLabel']) check(entry[key] !== undefined, 'catalog.json is missing ' + key);
check((entry.stages ?? []).length === (course.lessons ?? []).length, 'catalog stages must match the lessons one for one');
(entry.stages ?? []).forEach((s, i) => check(s.title === course.lessons?.[i]?.title, `stage ${i + 1} title must equal lesson ${i + 1} title`));
check(Math.abs((entry.estimatedHours ?? 0) - Math.round(minutes / 6) / 10) < 0.051, `estimatedHours should be ${Math.round(minutes / 6) / 10} (total minutes / 60)`);
check(Array.isArray(entry.artLabels) && entry.artLabels.length === 3, 'artLabels: exactly three short labels');

// Merge into temporary copies and run the guide generator against them.
const courses = load(path.join(repo, 'content/configuration-courses.json'));
const library = load(path.join(repo, 'content/videos.json'));
const merged = [...courses.filter(c => c.id !== id), course];
const full = { ...entry, id, afterEpisode: 'dc01-dc02', categoryId: 'network-build', kind: 'configuration', moduleCount: course.lessons.length, lessonCount: course.lessons.length };
full.training = entry.training ?? {
  guide: `/training/${id}`, checklist: `/training/${id}/configuration-checklist.md`, materialsEdition: '1.0', updated: '13 October 2026',
  checklistPage: `/training/${id}/checklist`, pdf: `/training/${id}/SecureByDesign-${id}-Workbook.pdf`, word: `/training/${id}/SecureByDesign-${id}-Workbook.docx`,
  package: `/training/${id}/SecureByDesign-${id}-Learning-Package.zip`, pages: 16, cover: `/training/${id}/workbook-cover.webp`,
};
library.courses = [...library.courses.filter(c => c.id !== id), full];
writeFileSync(path.join(work, 'courses.json'), JSON.stringify(merged, null, 2));
writeFileSync(path.join(work, 'videos.json'), JSON.stringify(library, null, 2));
if (!existsSync(path.join(dir, id + '.json'))) problems.push(`missing guide content ${dir}/${id}.json`);
if (problems.length) { console.error(problems.map(p => '✗ ' + p).join('\n')); process.exit(1); }
try {
  const out = execFileSync('node', [path.join(repo, 'scripts/prepare-course-guides.mjs')], {
    env: { ...process.env, ONLY: id, SBD_COURSES: path.join(work, 'courses.json'), SBD_CATALOG: path.join(work, 'videos.json'), SBD_GUIDES: dir, SBD_OUT: path.join(work, 'out') },
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(out.trim());
} catch (error) {
  console.error('✗ guide generator: ' + String(error.stderr || error.message).split('\n').find(line => /Error|guide/.test(line)));
  process.exit(1);
}
console.log(`✓ ${id}: ${course.lessons.length} lessons, ${minutes} minutes; guide page at ${path.join(work, 'out', id, 'index.html')}`);
