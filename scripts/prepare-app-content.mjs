// The native app's training catalog, published by the website so course changes reach the app without a new
// App Store or Google Play build. One transformation, two users:
//   * the build (scripts/prepare-content.mjs) writes public/app-content/v1/catalog.json and manifest.json, which
//     the app downloads, verifies by SHA-256, and uses from its next launch;
//   * the app repository's tool/import_site_training.mjs calls buildAppCatalog() to generate the catalog it ships
//     inside each build, so a fresh install works offline before it has downloaded anything.
// The catalog is content only — text, quizzes, links and video IDs. It never carries code (App Review Guideline 2.5.2).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const APP_CONTENT_SCHEMA = 1;
const base = 'https://securebydesigninc.com';

export function buildAppCatalog(site) {
  const read = p => JSON.parse(fs.readFileSync(path.join(site, p), 'utf8'));
  const fail = message => { throw new Error(`App content: ${message}`); };
  const catalog = read('content/videos.json');
  const configurations = read('content/configuration-courses.json');
  const siteProgress = read('content/training-progress.json');
  const siteResources = read('content/training-resources.json');
  const context = {window: {}};
  for (const p of ['catalog-data.js', 'learning-data.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(site, 'public/grc-rmf-training/rmf', p), 'utf8'), context);
  }
  const {CATALOG, CATALOG_PARTS, LEARNING} = context.window;
  const guideFile = id => path.join(site, 'content/course-guides', `${id}.json`);
  const guideOf = id => fs.existsSync(guideFile(id)) ? JSON.parse(fs.readFileSync(guideFile(id), 'utf8')) : null;

  const section = (heading, body) => ({heading, body});
  const quiz = (question, answers, correct, explanation) => {
    if (!Array.isArray(answers) || !(correct >= 0 && correct < answers.length)) fail(`Invalid quiz: ${question}`);
    return {question, answers, correct, explanation};
  };
  const knownResources = new Set(siteResources.filter(r => !r.retired).map(r => r.id));
  const resource = (id, title, url, description) => ({
    id, title, url: url.startsWith('http') ? url : base + url, description, category: 'Training materials',
    publisher: 'Secure By Design', icon: 'directory', syncable: knownResources.has(id),
  });
  // Reuse the Site's bookmark ID for a destination it already catalogs.
  const siteIdFor = (url, fallback) => siteResources.find(r => r.url === base + url)?.id ?? fallback;
  const published = catalog.courses.filter(c => c.kind !== 'coming-soon');
  const entry = id => published.find(e => e.id === id) ?? fail(`catalog entry ${id} is missing from content/videos.json`);
  if (catalog.episodes.length) fail('the Site publishes episodes again: add them to the app catalog.');

  // Network Authorization: lesson IDs stay training:rmf-boe-ato:<module> so saved progress survives.
  const rmfParts = published.filter(c => c.categoryId === 'network-authorization').sort((a, b) => a.categoryOrder - b.categoryOrder);
  if (rmfParts[0]?.id !== 'rmf-boe-ato') fail('the first Network Authorization course must keep the rmf-boe-ato ID.');
  const moduleIdsOf = part => part.moduleIds ?? (rmfParts.length === 1 ? CATALOG.map(m => m.id) : fail(`${part.id} lists no modules`));
  if (rmfParts.flatMap(moduleIdsOf).join() !== CATALOG.map(m => m.id).join()) fail('RMF courses must cover every module once, in order.');
  const siteResource = url => {
    const r = siteResources.find(x => x.url === base + url && !x.retired) ?? fail(`the Site has no training resource for ${url}`);
    return resource(r.id, r.title, url, r.description);
  };
  const taskLines = tasks => tasks.map(([id, name]) => `${id} · ${name}`).join('\n');
  const rmfStep = m => {
    const r = m.rmf;
    return [
      section(m.phase === 'Foundations' ? 'Before the RMF steps' : `The RMF step · ${r.step}`, r.roles),
      ...(r.nist.length ? [section('NIST SP 800-37 Rev. 2 tasks', taskLines(r.nist))] : []),
      ...(r.jsig.length ? [section('JSIG (11 April 2016) tasks', taskLines(r.jsig))] : m.phase === 'Prepare' ? [section('JSIG (11 April 2016) tasks', 'The 2016 JSIG has no Prepare step.')] : []),
      section('What this module produces', r.outputs.map(o => `• ${o}`).join('\n') + (r.jsigOutputs.length ? `\n\nJSIG step outputs: ${r.jsigOutputs.join('; ')}` : '')),
      ...(r.difference ? [section('Where the JSIG and NIST differ', r.difference)] : []),
    ];
  };
  const course = (c, extra) => ({
    id: c.id, number: c.number, title: c.title, subtitle: c.subtitle ?? '', categoryId: c.categoryId,
    description: c.description, trailerYoutubeId: c.trailerYoutubeId ?? '', published: true, ...extra,
  });
  const rmfCourses = rmfParts.map(part => {
    const layout = CATALOG_PARTS.find(p => p.id === part.id) ?? fail(`${part.id} is missing from CATALOG_PARTS`);
    const page = `/grc-rmf-training/${layout.folder}/index.html`;
    const modules = CATALOG.filter(m => moduleIdsOf(part).includes(m.id));
    const topics = modules.reduce((n, m) => n + m.lessons.length, 0);
    const hours = modules.reduce((n, m) => n + Number(m.hours), 0) + (part.capstoneHours ?? 0);
    if (topics !== part.lessonCount || hours !== part.estimatedHours) fail(`${part.id} counts differ from the module catalog`);
    return course(part, {
      category: 'Network authorization', icon: 'risk',
      studyTime: `${modules.length} modules · ${topics} topics · ${hours} study hours`, topics,
      materials: [siteResource(page), siteResource(part.training.word), ...part.training.relatedResources.filter(r => siteResources.some(x => x.url === base + r.href && !x.retired)).map(r => siteResource(r.href))],
      lessons: modules.map(m => {
        const l = LEARNING[CATALOG.indexOf(m)];
        return {
          id: `training:rmf-boe-ato:${m.id}`, title: `${m.id} · ${m.title}`, minutes: Math.round(Number(m.hours) * 60), summary: m.outcome,
          objectives: [], recap: [], next: '', youtubeId: '',
          sections: [...rmfStep(m), ...l.learn.map(a => section(a[0], a.slice(1).join('\n\n'))), section(l.example[0], l.example[1].map(a => a.join(': ')).join('\n\n')), section('Build', m.build), section('Prove', m.prove)],
          quizzes: [quiz(...l.quiz)], source: base + page + '#catalog/' + m.id, guide: null,
        };
      }),
    });
  });

  // 1.1–1.12 · Configuration courses, each with its interactive guide's checklist and step titles.
  const configCourses = configurations.map(config => {
    const c = entry(config.id), t = c.training;
    const guide = guideOf(c.id);
    const materials = [
      resource(siteIdFor(t.guide, `${c.id}-guide`), `${c.title} · Interactive guide`, t.guide, c.subtitle),
      resource(`${c.id}-package`, `${c.title} · Workbook (Word)`, t.word ?? fail(`${c.id} has no Word workbook`), `${t.pages}-page companion workbook.`),
    ];
    return course(c, {
      category: 'Network build', icon: c.id === 'logging-pipeline' ? 'monitoring' : 'directory',
      studyTime: `${config.lessons.length} guided lessons · Self-paced`, topics: config.lessons.length, materials,
      lessons: config.lessons.map(l => {
        if (!Array.isArray(l.quizzes) || !l.quizzes.length) fail(`${config.id}/${l.id} has no knowledge checks`);
        const g = guide?.lessons?.[l.id];
        return {
          id: `training:${c.id}:${l.id}`, title: l.title, minutes: l.minutes, summary: l.summary,
          objectives: l.objectives ?? [], recap: l.recap ?? [], next: l.next ?? '', youtubeId: l.youtubeId ?? '',
          sections: [
            section('Before you start', config.prerequisites.join('\n\n')), section('The lab plan', config.labNote),
            ...l.steps.map((s, i) => section(`Step ${i + 1}`, s)),
            // Owner direction, 22 October 2026: the console (GUI) check leads where one exists; the command stays as an optional
            // route (the app's lab mode reads 'Inspect your configuration' for its copy-per-line commands page).
            ...(l.console ? [section('Check it in the console', l.console.map(c => [c.name, ...c.steps.map((st, i) => `${i + 1}. ${st}`)].join('\n')).join('\n\n') + (l.consoleNote ? `\n\nStays a command: ${l.consoleNote}` : ''))] : []),
            section('Inspect your configuration', l.command), ...(!l.console && l.consoleNote ? [section('Why this stays a command', l.consoleNote)] : []), section('What success looks like', l.check), section('Keep your evidence', l.evidence),
            section('Source documentation', config.sources.filter(s => l.sources.includes(s.id)).map(s => `${s.title}\n${s.url}`).join('\n\n')),
          ],
          quizzes: l.quizzes.map(x => quiz(x.question, x.answers, x.correct, x.explanation)),
          source: base + t.guide + '#' + l.id,
          // The website guide keys checks as <chapter>-<index> and notes by chapter (scripts/course-guide/renderer.js).
          guide: g ? {id: `sbd-${c.id}`, chapter: l.id, checklist: g.checklist ?? [], stepTitles: g.stepTitles ?? []} : null,
        };
      }),
    });
  });

  const categoryIndex = c => catalog.categories.findIndex(x => x.id === c.categoryId);
  const courses = [...rmfCourses, ...configCourses].sort((a, b) =>
    categoryIndex(a) - categoryIndex(b) || (entry(a.id).categoryOrder ?? 0) - (entry(b.id).categoryOrder ?? 0));
  if (courses.length !== published.length) fail(`built ${courses.length} courses, but the Site publishes ${published.length}.`);

  // Every lesson must already be known to the Site's sync endpoints, or account sync would reject the batch.
  const lessonIds = courses.flatMap(c => c.lessons.map(l => l.id));
  if (new Set(lessonIds).size !== lessonIds.length) fail('duplicate lesson IDs');
  const knownLessons = new Set(siteProgress.map(p => p.id));
  const unknown = lessonIds.filter(id => !knownLessons.has(id));
  const materials = new Map();
  for (const r of courses.flatMap(c => c.materials)) {
    const existing = materials.get(r.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(r)) fail(`material ID ${r.id} is used for different destinations`);
    materials.set(r.id, r);
  }

  // Coming-soon tiles: shown in the catalog, labeled "Coming soon", with no lessons to open.
  const comingSoon = catalog.courses.filter(c => c.kind === 'coming-soon')
    .map(c => ({id: c.id, number: c.number, title: c.title, subtitle: c.subtitle ?? '', description: c.description, categoryId: c.categoryId}));
  const used = new Set([...courses, ...comingSoon].map(c => c.categoryId));
  const categories = catalog.categories.filter(c => used.has(c.id)).map(({id, title, description}) => ({id, title, description}));
  return {schema: APP_CONTENT_SCHEMA, categories, courses, comingSoon, unknownLessons: unknown, materials: [...materials.values()]};
}

// The published files: catalog.json is what the app parses; manifest.json is the small file it polls. The app's
// importer uses the same body and version for the catalog it ships, so a fresh install knows it is current.
export function appContent(site) {
  const {unknownLessons, materials, ...content} = buildAppCatalog(site);
  if (unknownLessons.length) throw new Error(`App content: lessons missing from content/training-progress.json: ${unknownLessons.join(', ')}`);
  const body = JSON.stringify(content);
  const sha256 = createHash('sha256').update(body).digest('hex');
  const lessons = content.courses.reduce((n, c) => n + c.lessons.length, 0);
  const manifest = {schema: APP_CONTENT_SCHEMA, version: sha256.slice(0, 16), sha256, bytes: Buffer.byteLength(body), courses: content.courses.length, lessons, url: '/app-content/v1/catalog.json'};
  return {content, materials, body, manifest};
}

export function writeAppContent(site, out = path.join(site, 'public/app-content/v1')) {
  const {body, manifest} = appContent(site);
  fs.mkdirSync(out, {recursive: true});
  fs.writeFileSync(path.join(out, 'catalog.json'), body);
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const m = writeAppContent(site);
  console.log(`App content ${m.version}: ${m.courses} courses, ${m.lessons} lessons, ${m.bytes} bytes.`);
}
