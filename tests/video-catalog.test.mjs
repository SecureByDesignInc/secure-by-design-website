import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(
  new URL('../app/videos/video-utils.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2017,
  },
}).outputText;
const {
  getYouTubeEmbedUrl,
  getCatalogEntries,
  groupCatalogEntries,
  isTrainingCourse,
  filterEpisodes,
  getCatalogTopics,
  supportsIdentityScene,
} = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);
const library = JSON.parse(
  readFileSync(new URL('../content/videos.json', import.meta.url), 'utf8'),
);

test('related build courses stay together before authorization and materials remain available', () => {
  const catalog = getCatalogEntries(library);
  const windowsIndex = catalog.findIndex(entry => entry.id === 'dc01-dc02');
  const course = catalog.find(entry => entry.id === 'rmf-boe-ato');
  assert.deepEqual(catalog.map(entry => entry.id), ['dc01-dc02', 'dns-configuration', 'domain-time', 'stig-scap', 'harden-baseline', 'two-tier-pki', 'dhcp', 'tiered-admin', 'linux-repository', 'logging-pipeline', 'audit-repository', 'splunk-analysis', 'workstation-fleet', 'patch-protect', 'management-server', 'endpoint-protection', 'vulnerability-scanning', 'business-services', 'prove-recovery', 'rmf-boe-ato']);
  assert.equal(course.id, 'rmf-boe-ato');
  assert.equal(isTrainingCourse(course), true);
  assert.equal(isTrainingCourse(catalog[windowsIndex]), false);
  assert.deepEqual(filterEpisodes(catalog, 'rmf evidence', '').map(entry => entry.id), ['rmf-boe-ato']);
  assert.deepEqual(filterEpisodes(catalog, 'poa&m', '').map(entry => entry.id), ['rmf-boe-ato']);
  assert.deepEqual(filterEpisodes(catalog, '', 'Authorization to Operate').map(entry => entry.id), ['rmf-boe-ato']);
  for (const part of catalog.filter(entry => entry.kind === 'authorization')) {
    for (const resource of Object.values(part.training).filter(value => typeof value === 'string' && value.startsWith('/'))) {
      assert.ok(existsSync(new URL('.' + resource.replace(/#.*$/, ''), new URL('../public/', import.meta.url))), resource);
    }
    const page = readFileSync(new URL('../public' + part.training.guide.replace(/#.*$/, ''), import.meta.url), 'utf8');
    assert.doesNotMatch(page, /PRIVATE REVIEW|noindex/);
    assert.match(page, /Back to the Authorization Studio/);
  }
});

test('category groups preserve course identity and omit groups with no matches', () => {
  const catalog = getCatalogEntries(library);
  const groups = groupCatalogEntries(catalog, library);
  assert.deepEqual(groups.map(group => [group.id, group.entries.length]), [['network-build', 19], ['network-authorization', 1]]);
  assert.equal(groups[0].title, 'Build the Network');
  assert.equal(groups[0].entries[0], library.episodes[0]);
  const dns = groupCatalogEntries(filterEpisodes(catalog, 'dependable', 'DNS'), library);
  assert.equal(dns.length, 1);
  assert.deepEqual(dns[0].entries.map(entry => entry.id), ['dns-configuration']);
  const pki = filterEpisodes(catalog, 'root issuing', 'PKI');
  assert.deepEqual(pki.map(entry => entry.id), ['two-tier-pki']);
  assert.deepEqual(groupCatalogEntries([], library), []);
  const unknown = { ...catalog[0], id: 'future-course', categoryId: 'future' };
  assert.deepEqual(groupCatalogEntries([unknown], library)[0].entries, [unknown]);
});

// Owner direction, 15 October 2026: courses 2.1-2.3, the ATO Template Library and the ATO Package Builder became one
// course, 2.1 "RMF to ATO", organized by the seven RMF steps. Module and progress IDs are unchanged.
test('Network Authorization is one course of seven RMF steps that keeps every module and its progress', () => {
  const context = { window: {} };
  runInNewContext(readFileSync(new URL('../public/grc-rmf-training/rmf/catalog-data.js', import.meta.url), 'utf8'), context);
  const modules = JSON.parse(JSON.stringify(context.window.CATALOG));
  const steps = JSON.parse(JSON.stringify(context.window.RMF_STEPS));
  const parts = getCatalogEntries(library).filter(entry => entry.categoryId === 'network-authorization');
  const progress = JSON.parse(readFileSync(new URL('../content/training-progress.json', import.meta.url), 'utf8'));
  assert.deepEqual(parts.map(part => [part.id, part.number, part.title]), [['rmf-boe-ato', '2.1', 'RMF to ATO']]);
  const [part] = parts;
  assert.deepEqual(part.moduleIds, modules.map(module => module.id));
  assert.deepEqual(steps.map(step => step.id), ['prepare', 'categorize', 'select', 'implement', 'assess', 'authorize', 'monitor']);
  assert.deepEqual(steps.flatMap(step => step.modules), part.moduleIds, 'every module belongs to one step, in order');
  for (const step of steps) assert.ok(step.task && step.done && step.lead && step.tab, step.id);
  assert.equal(part.moduleCount, modules.length);
  assert.equal(part.lessonCount, 36);
  assert.equal(part.estimatedHours, 24);
  assert.equal(part.estimatedHours, modules.reduce((sum, module) => sum + Number(module.hours), 0) + part.capstoneHours);
  const page = '/grc-rmf-training/rmf/index.html';
  assert.equal(part.training.guide, `${page}#catalog/01`);
  for (const [index, module] of modules.entries()) {
    assert.equal(part.stages[index].href, `${page}#catalog/${module.id}`);
    assert.deepEqual(part.stages[index].lessons, module.lessons);
    assert.equal(part.stages[index].hours, module.hours);
    assert(progress.some(entry => entry.id === `training:rmf-boe-ato:${module.id}` && entry.href === part.stages[index].href));
  }
  for (const resource of part.training.relatedResources) {
    const url = new URL(resource.href, 'https://securebydesigninc.com');
    if (['/grc-rmf-training/workspace', '/grc-rmf-training/templates'].includes(url.pathname)) continue;
    assert.equal(url.pathname, page);
    assert(['#evidence', '#evidence/manifest', '#capstone'].includes(url.hash));
  }
  // The workspace checks behind each step are the same seven, with the same IDs (lib/authorization/model.mjs).
  const model = readFileSync(new URL('../lib/authorization/model.mjs', import.meta.url), 'utf8');
  for (const step of steps) assert.match(model, new RegExp(`\\['${step.id}','${step.title}',`), step.id);
  const map = /COURSE_STEP_MODULES=(\{[^}]*\})/.exec(model)[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
  assert.deepEqual(JSON.parse(map), Object.fromEntries(steps.map(step => [step.id, step.modules])), 'My Progress uses the same step map');
  // The old 2.2 and 2.3 pages are gone (server/index.js redirects them here).
  for (const folder of ['rmf-body-of-evidence', 'rmf-authorization-to-operate']) assert.ok(!existsSync(new URL(`../public/training/${folder}/`, import.meta.url)), folder);
  const templates = readFileSync(new URL('../public/grc-rmf-training/rmf/templates-data.js', import.meta.url), 'utf8');
  assert.ok(templates.includes(JSON.parse(readFileSync(new URL('../content/ato-templates.json', import.meta.url), 'utf8')).templates[0].title), 'templates-data.js is current; run scripts/prepare-rmf-courses.mjs');
});

test('the Network Authorization page matches the catalog course and shows its edition', () => {
  const context = { window: {} };
  runInNewContext(readFileSync(new URL('../public/grc-rmf-training/rmf/catalog-data.js', import.meta.url), 'utf8'), context);
  const parts = getCatalogEntries(library).filter(entry => entry.categoryId === 'network-authorization');
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.CATALOG_PARTS)).map(part => [part.number, part.title, part.modules]), parts.map(part => [part.number, part.title, part.moduleIds]));
  for (const part of parts) {
    const page = readFileSync(new URL('../public' + part.training.guide.replace(/#.*$/, ''), import.meta.url), 'utf8');
    const shown = [...page.matchAll(/[Ee]dition\s+([\d.]+)/g)].map(match => match[1]);
    assert.ok(shown.length >= 2);
    assert.deepEqual([...new Set(shown)], [part.training.materialsEdition], `course ${part.number} shows its edition everywhere`);
    assert.ok(page.includes(`Updated ${part.training.updated}`));
    assert.ok(page.includes(`<body data-course="${part.number}">`));
    assert.ok(page.includes('/grc-rmf-training/rmf/templates-data.js'));
  }
});

test('configuration lessons have complete guides, checklists, quizzes and shared progress identifiers', () => {
  const configurations = JSON.parse(readFileSync(new URL('../content/configuration-courses.json', import.meta.url), 'utf8'));
  const progress = JSON.parse(readFileSync(new URL('../content/training-progress.json', import.meta.url), 'utf8'));
  const resources = JSON.parse(readFileSync(new URL('../content/training-resources.json', import.meta.url), 'utf8'));
  assert.equal(new Set(progress.map(item => item.id)).size, progress.length);
  assert.equal(new Set(resources.map(item => item.id)).size, resources.length);
  assert.deepEqual(configurations.map(course => course.lessons.length), [5, 5, 5, 5, 10, 5, 5, 5, 5, 5, 6, 7, 5, 5, 5, 6]);
  // Every Build the Network tile is numbered in path order, 1.1 to 1.19; coming-soon tiles hold their place without material.
  assert.deepEqual(getCatalogEntries(library).filter(entry => entry.categoryId === 'network-build' || entry.id === 'dc01-dc02').map(entry => entry.number), Array.from({ length: 19 }, (_, i) => `1.${i + 1}`));
  assert.deepEqual(library.courses.filter(course => course.kind === 'coming-soon').map(course => course.id), ['endpoint-protection', 'vulnerability-scanning']);
  for (const configuration of configurations) {
    const course = library.courses.find(item => item.id === configuration.id);
    assert.equal(course.kind, 'configuration');
    assert.equal(course.lessonCount, configuration.lessons.length);
    assert.equal(course.training.guide, `/training/${configuration.id}`);
    const checklist = readFileSync(new URL('../public' + course.training.checklist, import.meta.url), 'utf8');
    for (const key of ['pdf', 'word']) {
      assert.match(course.training[key], new RegExp(`^/training/${configuration.id}/SecureByDesign-${configuration.id}-Workbook\\.(pdf|docx)$`));
      assert.ok(existsSync(new URL('../public' + course.training[key], import.meta.url)), `${configuration.id} ${key} workbook exists`);
    }
    assert.ok(Number.isInteger(course.training.pages) && course.training.pages > 0);
    assert.ok(resources.some(resource => resource.url === 'https://securebydesigninc.com' + course.training.guide));
    for (const lesson of configuration.lessons) {
      assert.ok(lesson.steps.length >= 3);
      assert.ok(lesson.check && lesson.evidence && lesson.command);
      assert.ok(Number.isInteger(lesson.minutes) && lesson.minutes > 0);
      assert.ok(lesson.objectives.length >= 3, `${lesson.id} states its learning objectives`);
      assert.ok(lesson.recap.length >= 2 && lesson.next, `${lesson.id} ends with a recap and a next step`);
      assert.ok(lesson.quizzes.length >= 3, `${lesson.id} has enough knowledge checks`);
      for (const quiz of lesson.quizzes) {
        assert.ok(quiz.correct >= 0 && quiz.correct < quiz.answers.length);
        assert.ok(quiz.explanation, `${lesson.id} explains each answer`);
      }
      assert.ok(new Set(lesson.quizzes.map(quiz => quiz.correct)).size > 1, `${lesson.id} varies the correct answer position`);
      assert.ok(lesson.sources.every(id => configuration.sources.some(source => source.id === id && ['https://learn.microsoft.com/', 'https://www.cyber.mil/', 'https://public.cyber.mil/', 'https://csrc.nist.gov/', 'https://docs.splunk.com/', 'https://help.splunk.com/', 'https://docs.tenable.com/', 'https://docs.trellix.com/', 'https://docs.redhat.com/', 'https://access.redhat.com/', 'https://dnf-plugins-core.readthedocs.io/', 'https://github.com/rpm-software-management/', 'https://manpages.debian.org/', 'https://httpd.apache.org/', 'https://man.openbsd.org/', 'https://chrony-project.org/', 'https://firewalld.org/', 'https://www.rfc-editor.org/'].some(origin => source.url.startsWith(origin)))));
      assert.ok(checklist.includes(lesson.title));
      const entry = progress.find(item => item.id === `training:${course.id}:${lesson.id}`);
      assert.equal(entry?.href, `${course.training.guide}#${lesson.id}`);
      assert.equal(entry?.group, 'Network build');
    }
  }
});

test('identity scene requires the supported model and its exact ordered chapter stages', () => {
  const chapters = ['prepare', 'dc01', 'dc02', 'verify', 'evidence'].map(
    (id) => ({ id }),
  );
  assert.equal(supportsIdentityScene({ scene: 'identity-dc', chapters }), true);
  assert.equal(supportsIdentityScene(library.episodes[0]), true);
  assert.equal(
    supportsIdentityScene({ scene: 'other-build', chapters }),
    false,
  );
  assert.equal(supportsIdentityScene({ chapters }), false);
  assert.equal(
    supportsIdentityScene({
      scene: 'identity-dc',
      chapters: chapters.slice(1),
    }),
    false,
  );
  assert.equal(
    supportsIdentityScene({
      scene: 'identity-dc',
      chapters: [chapters[0], chapters[2], chapters[1], ...chapters.slice(3)],
    }),
    false,
  );
  assert.equal(
    supportsIdentityScene({
      scene: 'identity-dc',
      chapters: [...chapters, { id: 'next-build' }],
    }),
    false,
  );
});

const searchEpisodes = [
  {
    id: 'identity',
    title: 'Build the identity foundation',
    subtitle: 'Directory services',
    description: 'Configure redundant authentication.',
    tags: ['Windows Server', 'DNS'],
    systems: ['DC01', 'DC02'],
  },
  {
    id: 'monitoring',
    title: 'Observe the network',
    subtitle: 'Telemetry and events',
    description: 'Investigate a failed service.',
    tags: ['Monitoring', 'Windows Server'],
    systems: ['LOG01'],
  },
  {
    id: 'dns-security',
    title: 'Secure name resolution',
    subtitle: 'DNS policy',
    description: 'Review records and permissions.',
    tags: ['DNS', 'Security'],
    systems: ['DNS01'],
  },
];

test('search covers every catalog field without case or surrounding whitespace sensitivity', () => {
  for (const query of [
    '  IDENTITY  ',
    'directory',
    'authentication',
    'windows server',
    'dc02',
  ]) {
    const results = filterEpisodes(searchEpisodes, query, '');
    assert.ok(results.includes(searchEpisodes[0]), query);
  }
  assert.deepEqual(
    filterEpisodes(searchEpisodes, '  DIRECTORY\tDc02\nredundant ', ''),
    [searchEpisodes[0]],
  );
  assert.deepEqual(filterEpisodes(searchEpisodes, 'directory LOG01', ''), []);
  assert.deepEqual(
    filterEpisodes(searchEpisodes, '   \t\n', ''),
    searchEpisodes,
  );
});

test('topic and query combine while topic matching remains exact', () => {
  assert.deepEqual(filterEpisodes(searchEpisodes, '', 'DNS'), [
    searchEpisodes[0],
    searchEpisodes[2],
  ]);
  assert.deepEqual(filterEpisodes(searchEpisodes, 'policy', 'DNS'), [
    searchEpisodes[2],
  ]);
  assert.deepEqual(filterEpisodes(searchEpisodes, 'policy', 'Monitoring'), []);
  assert.deepEqual(filterEpisodes(searchEpisodes, '', 'dns'), []);
  assert.deepEqual(filterEpisodes(searchEpisodes, '', 'Windows'), []);
  assert.deepEqual(filterEpisodes(searchEpisodes, 'missing-topic', ''), []);
  assert.deepEqual(filterEpisodes([], '', ''), []);
});

test('topics are unique, sorted, and derived only from available episodes', () => {
  assert.deepEqual(getCatalogTopics(searchEpisodes), [
    'DNS',
    'Monitoring',
    'Security',
    'Windows Server',
  ]);
  assert.deepEqual(getCatalogTopics([]), []);
});

test('a large catalog preserves editorial order and original episode objects', () => {
  const episodes = Array.from({ length: 240 }, (_, index) => ({
    id: `episode-${index}`,
    title: `Build ${240 - index}`,
    subtitle: 'Network series',
    description: index % 3 === 0 ? 'Keep evidence' : 'Explore a system',
    tags: index % 2 === 0 ? ['Identity'] : ['Monitoring'],
    systems: [`NODE${index}`],
  }));
  const originalOrder = episodes.slice();
  const results = filterEpisodes(episodes, 'network evidence', 'Identity');
  assert.equal(results.length, 40);
  results.forEach((episode, index) => {
    assert.equal(episode, episodes[index * 6]);
  });
  assert.deepEqual(episodes, originalOrder);
  assert.deepEqual(filterEpisodes(episodes, 'unavailable', ''), []);
});

test('unpublished or invalid video IDs do not produce an iframe URL', () => {
  for (const id of [
    null,
    '',
    'not ready',
    'https://youtube.com/watch?v=abcdefghijk',
    '../bad-input',
    'abcdefghij?',
  ])
    assert.equal(getYouTubeEmbedUrl(id), null);
});
test('published video IDs use the privacy-enhanced player and safe chapter offsets', () => {
  const url = new URL(getYouTubeEmbedUrl('abcdefghijk', 81.8));
  assert.equal(url.origin, 'https://www.youtube-nocookie.com');
  assert.equal(url.pathname, '/embed/abcdefghijk');
  assert.equal(url.searchParams.get('start'), '81');
  assert.equal(url.searchParams.has('autoplay'), false);
  for (const time of [-4, NaN, Infinity, null])
    assert.equal(
      new URL(getYouTubeEmbedUrl('abcdefghijk', time)).searchParams.has(
        'start',
      ),
      false,
    );
});
test('every advertised training resource is present and remains on this site', () => {
  assert.ok(library.episodes.length);
  assert.equal(
    new Set(library.episodes.map((e) => e.id)).size,
    library.episodes.length,
  );
  for (const episode of library.episodes) {
    for (const key of ['guide', 'pdf', 'word', 'package', 'cover']) {
      const path = episode.training[key];
      assert.match(path, /^\/training\/[a-z0-9-]+\/[A-Za-z0-9_.-]+$/);
      assert.ok(
        existsSync(new URL('.' + path, new URL('../public/', import.meta.url))),
        path,
      );
    }
    assert.ok(episode.chapters.length > 0, `${episode.id} has chapters`);
    assert.ok(
      episode.chapters.every(
        (chapter) =>
          typeof chapter.id === 'string' && chapter.id.trim().length > 0,
      ),
      `${episode.id} has nonempty chapter IDs`,
    );
    assert.equal(
      new Set(episode.chapters.map((chapter) => chapter.id)).size,
      episode.chapters.length,
      `${episode.id} has unique chapter IDs`,
    );
    assert.ok(
      Number.isInteger(episode.training.pages) && episode.training.pages > 0,
      `${episode.id} has a positive workbook page count`,
    );
  }
});
test('the first recording remains unpublished and the retired formats are removed', () => {
  assert.equal(library.episodes[0].youtubeId, null);
  for (const filename of [
    '../content/videos.json',
    '../app/videos/video-hub.tsx',
    '../app/blog-sidebar.tsx',
    '../README.md',
  ])
    assert.doesNotMatch(
      readFileSync(new URL(filename, import.meta.url), 'utf8'),
      /micro.?doses|FORMAT 0[12]|quick-clips/i,
    );
});

test('every course tile carries the companion details the expanded tile shows', () => {
  for (const course of library.courses) {
    assert.ok(course.outcomeSummary || course.kind === 'coming-soon', `${course.id} outcome summary`);
    if (course.kind === 'coming-soon') { assert.ok(course.networkLabel && course.artLabels?.length >= 2, course.id); continue; }
    assert.ok(course.training.cover && existsSync(new URL('../public' + course.training.cover, import.meta.url)), `${course.id} cover`);
    assert.ok(course.outcomeSummary, `${course.id} outcome summary`);
    assert.ok(course.networkLabel, `${course.id} network label`);
    assert.ok(course.artLabels?.length >= 2, `${course.id} outcome labels`);
  }
});


// Owner request, 15 October 2026: an ATO Template Library, listing only documents verified as publicly released by an
// official publisher, each linked to the publisher's own copy. Owner direction the same day: its catalog tile merged into
// course 2.1, whose step pages show each step's sources; the full page stays at /grc-rmf-training/templates.
test('the ATO Template Library lists only verified public sources and is part of course 2.1', () => {
  const templates = JSON.parse(readFileSync(new URL('../content/ato-templates.json', import.meta.url), 'utf8'));
  const reference = { training: { relatedResources: [] } };
  assert.deepEqual(library.references ?? [], [], 'no separate library tile');
  assert.ok(!library.categories.some(item => item.id === 'templates-references'));
  const course = library.courses.find(item => item.id === 'rmf-boe-ato');
  assert.ok(course.training.relatedResources.some(item => item.href === '/grc-rmf-training/templates'), 'the course links the library');
  assert.ok(existsSync(new URL('../app/grc-rmf-training/templates/page.tsx', import.meta.url)), 'library page');
  for (const sample of templates.samples) assert.ok(templates.groups.some(group => group.id === sample.group), `${sample.title} step`);
  // The verified set: add an entry only when its publisher posts it publicly (see AGENTS.md).
  assert.deepEqual(templates.groups.map(group => group.id), ['prepare', 'categorize', 'select', 'implement', 'assess', 'monitor']);
  assert.deepEqual(templates.templates.map(item => item.title), [
    'ISSM appointment letter template',
    'CNSSI 1253, Categorization and Control Selection for National Security Systems',
    'NIST SP 800-53 Rev. 5 controls and SP 800-53B baselines',
    'CNSS Privacy Overlay',
    'System Security Plan (SSP) outline example',
    'Integrated Inventory Workbook (format reference)',
    'NIST SP 800-128, Guide for Security-Focused Configuration Management',
    'Security Requirements Traceability Matrix (format reference)',
    'Risk Assessment Report (RAR) template',
    'POA&M job aid',
    'POA&M template (format reference)',
    'Continuous Monitoring Playbook',
  ]);
  // FedRAMP templates are cloud formats, so each is labeled a format reference in its title.
  for (const item of templates.templates.filter(entry => entry.framework === 'FedRAMP' && !entry.title.includes('Playbook'))) {
    assert.match(item.title, /\(format reference\)$/, `${item.title} is labeled a format reference`);
  }
  const groupIds = templates.groups.map(group => group.id);
  for (const group of templates.groups) assert.ok(templates.templates.some(item => item.group === group.id), `${group.id} has entries`);
  for (const item of templates.templates) {
    assert.ok(groupIds.includes(item.group), `${item.title} group`);
    assert.ok(['DoD', 'CNSS', 'NIST', 'FedRAMP'].includes(item.framework), `${item.title} publisher`);
    assert.equal(item.status, 'official', `${item.title} links to its publisher`);
    assert.ok(item.rmf && item.source && item.note, `${item.title} details`);
    assert.ok(item.links.length > 0, `${item.title} has a link`);
    for (const link of item.links) {
      assert.ok(link.label && link.format, `${item.title} link label`);
      assert.doesNotMatch(link.href, / /, `${item.title} link is encoded`);
      // Official government sites: .gov, .mil, and CDSE (DCSA's training center, cdse.edu).
      assert.match(link.href, /^https:\/\/(([a-z0-9-]+\.)+(gov|mil)|www\.cdse\.edu)\//, `${item.title} links to an official government site`);
    }
  }
  // Nothing is hosted: the owner's JSIG files, the adaptations, the README and the ZIP stay removed.
  assert.ok(!existsSync(new URL('../public/training/library/ato-templates/', import.meta.url)), 'no library files are posted');
  assert.equal(templates.download, undefined, 'no download-all ZIP');
  // Secure By Design training samples (owner direction, 15 October 2026): original practice templates written from
  // public guidance, hosted in their own folder, named SBD-Training-*, and labeled as not official forms.
  const sampleFiles = readdirSync(new URL('../public/training/library/training-samples/', import.meta.url)).sort();
  assert.deepEqual(templates.samples.map(item => item.href.split('/').pop()).sort(), sampleFiles, 'every sample file is listed, and only those');
  for (const item of templates.samples) {
    assert.match(item.href, /^\/training\/library\/training-samples\/SBD-Training-[A-Za-z0-9-]+\.(docx|xlsx)$/, `${item.title} file`);
    assert.ok(item.title && item.artifact && item.rmf && item.basis && item.note && item.format, `${item.title} details`);
  }
  for (const resource of reference.training.relatedResources) assert.match(resource.href, /^\//);
  assert.deepEqual(filterEpisodes(getCatalogEntries(library), 'template library', '').map(entry => entry.id), ['rmf-boe-ato']);
});
