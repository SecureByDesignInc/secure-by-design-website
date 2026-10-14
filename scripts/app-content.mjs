// Builds the native app's training content from this Site: the published Training Library
// courses (lessons, knowledge checks, materials) and the Inside the Network reference.
//
// The result is published at /app/content/v1.json (see scripts/prepare-app-content.mjs).
// The app downloads it on launch and on resume, so every website deploy reaches installed
// apps without an App Store release, and it bundles the same file as its offline fallback.
// See docs/native-app-content.md.
//
// Ported from the native repository's former tool/import_site_training.mjs; lesson and
// material IDs are unchanged so saved progress and bookmarks keep working.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {pathToFileURL, fileURLToPath} from 'node:url';

/** Bump only for a breaking change to the shape; installed apps ignore other schemas. */
export const APP_CONTENT_SCHEMA = 1;
export const APP_CONTENT_PATH = 'public/app/content/v1.json';
const base = 'https://securebydesigninc.com';
const defaultSite = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} [site] Site checkout (defaults to this repository).
 * @param {{writeSite?: boolean}} [options] writeSite: allow lessons/materials the Site's
 *   progress and bookmark catalogs don't list yet (used with --write-site only).
 */
export async function buildAppContent(site = defaultSite, {writeSite = false} = {}) {
  const read = p => JSON.parse(fs.readFileSync(path.join(site, p), 'utf8'));
  const fail = message => { throw new Error(`App content: ${message}`); };

  const catalog = read('content/videos.json');
  const configurations = read('content/configuration-courses.json');
  const dc = read('public/training/dc01-dc02/lesson.json');
  const siteProgress = read('content/training-progress.json');
  const siteResources = read('content/training-resources.json');
  const context = {window: {}};
  for (const p of ['catalog-data.js', 'learning-data.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(site, 'public/training/rmf', p), 'utf8'), context);
  }
  const {CATALOG, LEARNING} = context.window;

  const section = (heading, body) => ({heading, body});
  const quiz = (question, answers, correct, explanation) => {
    if (!Array.isArray(answers) || !(correct >= 0 && correct < answers.length)) fail(`Invalid quiz: ${question}`);
    return {question, answers, correct, explanation};
  };
  const resource = (id, title, url, description) =>
    ({id, title, url: url.startsWith('http') ? url : base + url, description, category: 'Training materials', publisher: 'Secure By Design', icon: 'directory'});
  // Reuse the Site's bookmark ID for a destination it already catalogs.
  const siteIdFor = (url, fallback) => siteResources.find(r => r.url === base + url)?.id ?? fallback;
  const entries = [...catalog.episodes, ...catalog.courses];
  const entry = id => entries.find(e => e.id === id) ?? fail(`Catalog entry ${id} is missing from content/videos.json`);

  // 1.1 · Promote Primary & Secondary Domain Controller (DC01/DC02 episode)
  const dcEntry = entry('dc01-dc02');
  const dcCourse = {
    ...dcEntry, category: 'Network build', icon: 'directory', studyTime: `${dc.chapters.length} guided chapters`, topics: dc.chapters.length,
    materials: [
      // One download per course (owner request, 9 October 2026): the guide plus its ZIP.
      resource('dc-guide', 'Interactive build guide', dcEntry.training.guide, 'Explore the build and keep your evidence record.'),
      resource('dc-package', 'Training materials · ZIP', dcEntry.training.package, 'Offline guide, workbook (PDF and Word), and verification commands.'),
    ],
    lessons: dc.chapters.map(c => ({
      id: `training:dc01-dc02:${c.id}`, title: c.title, minutes: 10, summary: c.outcome,
      sections: [
        section('Understand the why', c.intro),
        ...(c.foundationIds || []).flatMap(id => {
          const f = dc.foundations.find(x => x.id === id) ?? fail(`Unknown foundation ${id}`);
          return [section(f.title, f.summary), ...f.blocks.map(s => section(...s)), section('Remember', f.takeaway)];
        }),
        ...c.steps.map(s => section(...s)),
        section(c.commandLabel, c.command), section('What to look for', c.expected),
        section('Avoid this mistake', c.mistake), section('Keep your evidence', c.evidencePrompt),
      ],
      quizzes: [quiz(c.quiz.prompt, c.quiz.answers, c.quiz.correct, c.quiz.feedback)],
      source: base + dcEntry.training.guide + '#' + c.id,
    })),
  };

  // 2.1–2.3 · The RMF course, shown as three parts over one set of modules.
  // Lesson IDs stay training:rmf-boe-ato:<module> so saved progress survives.
  const rmfParts = catalog.courses.filter(c => c.categoryId === 'network-authorization').sort((a, b) => a.categoryOrder - b.categoryOrder);
  if (rmfParts[0]?.id !== 'rmf-boe-ato') fail('The first Network Authorization part must keep the rmf-boe-ato ID.');
  if (rmfParts.flatMap(p => p.moduleIds).join() !== CATALOG.map(m => m.id).join()) fail('RMF parts must cover every module once, in order.');
  const rmfShared = [
    resource('rmf-guide', 'Interactive authorization course', '/training/rmf/index.html', 'Lessons, evidence examples, and the capstone.'),
    resource('rmf-word', 'Full training catalog · Word', rmfParts[0].training.word, `Edition ${rmfParts[0].training.materialsEdition} · ${CATALOG.length} modules`),
  ];
  const rmfExtras = {
    '#evidence': resource('rmf-evidence', 'Body of Evidence examples and starters', '/training/rmf/index.html#evidence', 'Ten examples with editable Markdown and CSV starters.'),
    '#capstone': resource('rmf-capstone', 'Authorization package capstone', '/training/rmf/index.html#capstone', 'Assemble, defend, and maintain the practice package.'),
  };
  const rmfCourses = rmfParts.map(part => {
    const modules = CATALOG.filter(m => part.moduleIds.includes(m.id));
    const topics = modules.reduce((n, m) => n + m.lessons.length, 0);
    const hours = modules.reduce((n, m) => n + Number(m.hours), 0) + (part.capstoneHours ?? 0);
    if (topics !== part.lessonCount || hours !== part.estimatedHours) fail(`${part.id} counts differ from the module catalog`);
    const extras = part.training.relatedResources.map(r => {
      const hash = new URL(r.href, base).hash;
      const title = r.title.replace(/^Open the /, '').replace(/^./, c => c.toUpperCase());
      return rmfExtras[hash] ?? resource(`rmf-${hash.replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`, title, r.href, r.detail);
    });
    return {
      ...part, category: 'Network authorization', icon: 'risk',
      studyTime: `${modules.length} modules · ${topics} topics · ${hours} study hours`,
      topics, materials: [...rmfShared, ...extras],
      lessons: modules.map(m => {
        const l = LEARNING[CATALOG.indexOf(m)];
        return {
          id: `training:rmf-boe-ato:${m.id}`, title: `${m.id} · ${m.title}`, minutes: Math.round(Number(m.hours) * 60), summary: m.outcome,
          sections: [...l.learn.map(a => section(a[0], a.slice(1).join('\n\n'))), section(l.example[0], l.example[1].map(a => a.join(': ')).join('\n\n')), section('Build', m.build), section('Prove', m.prove)],
          quizzes: [quiz(...l.quiz)],
          source: base + '/training/rmf/index.html#catalog/' + m.id,
        };
      }),
    };
  });

  // 1.2–1.10 · Configuration courses
  const configCourses = configurations.map(config => {
    const course = entry(config.id), t = course.training;
    const materials = [
      resource(siteIdFor(t.guide, `${course.id}-guide`), `${course.title} · Interactive guide`, t.guide, course.subtitle),
      resource(siteIdFor(t.package ?? fail(`${course.id} has no training package`), `${course.id}-package`), `${course.title} · Training materials (ZIP)`, t.package,
        'Workbook (PDF and Word), checklist, and verification commands.'),
    ];
    return {
      ...course, category: 'Network build', icon: course.id.includes('pki') ? 'risk' : course.id === 'logging-pipeline' ? 'monitoring' : 'directory',
      studyTime: `${config.lessons.length} guided lessons · Self-paced`, topics: config.lessons.length, materials,
      lessons: config.lessons.map(l => {
        if (!Array.isArray(l.quizzes) || !l.quizzes.length) fail(`${config.id}/${l.id} has no knowledge checks`);
        return {
          id: `training:${course.id}:${l.id}`, title: l.title, minutes: l.minutes, summary: l.summary,
          objectives: l.objectives ?? [], recap: l.recap ?? [], next: l.next ?? '',
          sections: [
            section('Before you start', config.prerequisites.join('\n\n')), section('The lab plan', config.labNote),
            ...l.steps.map((s, i) => section(`Step ${i + 1}`, s)),
            section('Inspect your configuration', l.command), section('What success looks like', l.check), section('Keep your evidence', l.evidence),
            section('Source documentation', config.sources.filter(s => l.sources.includes(s.id)).map(s => `${s.title}\n${s.url}`).join('\n\n')),
          ],
          quizzes: l.quizzes.map(x => quiz(x.question, x.answers, x.correct, x.explanation)),
          source: base + t.guide + '#' + l.id,
        };
      }),
    };
  });

  const courses = [dcCourse, ...rmfCourses, ...configCourses];
  const categoryIndex = c => catalog.categories.findIndex(x => x.id === c.categoryId);
  courses.sort((a, b) => categoryIndex(a) - categoryIndex(b) || (a.categoryOrder ?? 0) - (b.categoryOrder ?? 0));
  if (courses.length !== entries.length) fail(`Built ${courses.length} courses, but the Site publishes ${entries.length} catalog entries.`);

  // IDs must already be known to the Site's sync endpoints, or account sync would reject the batch.
  const lessons = courses.flatMap(c => c.lessons);
  const lessonIds = lessons.map(l => l.id);
  if (new Set(lessonIds).size !== lessonIds.length) fail('Duplicate lesson IDs');
  const knownLessons = new Set(siteProgress.map(p => p.id));
  const unknownLessons = lessonIds.filter(id => !knownLessons.has(id));
  if (unknownLessons.length && !writeSite) fail(`Lessons missing from content/training-progress.json: ${unknownLessons.join(', ')}`);
  const materialsById = new Map();
  for (const r of courses.flatMap(c => c.materials)) {
    const existing = materialsById.get(r.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(r)) fail(`Material ID ${r.id} is used for different destinations`);
    materialsById.set(r.id, r);
  }
  const knownResources = new Set(siteResources.map(r => r.id));
  const syncable = id => writeSite || knownResources.has(id);

  // The app's model fields, in a stable order.
  const material = r => ({id: r.id, title: r.title, publisher: r.publisher, description: r.description, url: r.url, category: r.category, icon: r.icon, syncable: syncable(r.id)});
  const lesson = l => ({
    id: l.id, title: l.title, minutes: l.minutes, summary: l.summary, objectives: l.objectives ?? [],
    sections: l.sections, quizzes: l.quizzes, recap: l.recap ?? [], next: l.next ?? '',
    sourceUrl: l.source, sourceLabel: 'Open the complete guide',
  });
  const course = c => ({
    id: c.id, number: c.number, title: c.title, subtitle: c.subtitle, category: c.category, description: c.description, icon: c.icon,
    studyTime: c.studyTime, topics: c.topics, materials: c.materials.map(material), lessons: c.lessons.map(lesson),
  });

  // Inside the Network: the same modules the Site's 3D model and text view use.
  const model = p => import(pathToFileURL(path.join(site, 'public/inside-network-model', p)).href);
  const {inventory} = await model('inventory.js');
  const architecture = await model('architecture.js');
  const {scenarios, whatIfs = [], technical} = await model('technical.js');
  const {trafficRules = [], policyStatus = {}} = await model('security.js');
  const {stepPolicy} = await model('flow-policy.js');
  const nodes = architecture.buildArchitectureNodes(inventory.nodes);
  const withPolicy = sequence => ({
    ...sequence,
    steps: sequence.steps.map(step => {
      const policy = stepPolicy(step);
      return {...step, policy: {kind: policy.kind, rule: policy.rule?.id ?? null, label: policy.label}};
    }),
  });
  const policy = trafficRules.map(({id, from, to, service, transport, purpose, owner, status}) =>
    ({id, from, to, service, transport, purpose, owner, status, statusLabel: policyStatus[status] ?? status}));
  const network = {
    nodes, vlans: architecture.vlans, facilities: architecture.facilities,
    scenarios: scenarios.map(withPolicy), whatIfs: whatIfs.map(withPolicy), policy, technical,
  };

  const payload = {courses: courses.map(course), network};
  // Deterministic: the same Site content always produces the same version and bytes.
  const version = createHash('sha256').update(JSON.stringify({schema: APP_CONTENT_SCHEMA, ...payload})).digest('hex').slice(0, 16);
  const content = {schema: APP_CONTENT_SCHEMA, version, ...payload};
  const summary = `${courses.length} courses, ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.quizzes.length, 0)} knowledge checks, ` +
    `${materialsById.size} materials, ${scenarios.length} traffic processes, ${whatIfs.length} what-ifs, ${policy.length} policy rules, and ${nodes.length} systems`;
  return {
    content, summary,
    localOnlyMaterials: [...materialsById.keys()].filter(id => !syncable(id)),
    siteCatalogs: {
      progress: courses.flatMap(c => c.lessons.map(l => ({id: l.id, title: l.title, href: l.source.replace(base, ''), group: c.category}))),
      resources: [...materialsById.values()],
    },
  };
}

export const serializeAppContent = content => JSON.stringify(content) + '\n';
