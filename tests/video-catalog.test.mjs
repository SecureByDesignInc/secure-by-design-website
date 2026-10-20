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
  assert.deepEqual(catalog.map(entry => entry.id), ['dc01-dc02', 'dns-configuration', 'domain-time', 'stig-scap', 'harden-baseline', 'two-tier-pki', 'dhcp', 'tiered-admin', 'linux-repository', 'logging-pipeline', 'audit-repository', 'splunk-analysis', 'workstation-fleet', 'patch-protect', 'management-server', 'endpoint-protection', 'vulnerability-scanning', 'business-services', 'prove-recovery', 'rmf-boe-ato', 'ato-templates', 'design-active-directory', 'design-dns', 'design-time', 'design-pki', 'design-dhcp', 'design-disa-stigs']);
  assert.equal(course.id, 'rmf-boe-ato');
  assert.equal(isTrainingCourse(course), true);
  assert.equal(isTrainingCourse(catalog[windowsIndex]), false);
  // The Training Hub searches the ATO Template Library tile too (owner direction, 19 October 2026).
  assert.deepEqual(filterEpisodes(catalog, 'rmf evidence', '').map(entry => entry.id), ['rmf-boe-ato', 'ato-templates']);
  assert.deepEqual(filterEpisodes(catalog, 'poa&m', '').map(entry => entry.id), ['rmf-boe-ato', 'ato-templates']);
  assert.deepEqual(filterEpisodes(catalog, '', 'Authorization to Operate').map(entry => entry.id), ['rmf-boe-ato']);
  for (const part of catalog.filter(entry => entry.kind === 'authorization')) {
    for (const resource of Object.values(part.training).filter(value => typeof value === 'string' && value.startsWith('/'))) {
      assert.ok(existsSync(new URL('.' + resource.replace(/#.*$/, ''), new URL('../public/', import.meta.url))), resource);
    }
    const page = readFileSync(new URL('../public' + part.training.guide.replace(/#.*$/, ''), import.meta.url), 'utf8');
    assert.doesNotMatch(page, /PRIVATE REVIEW|noindex/);
    assert.match(page, /Back to the Training Hub/);
  }
});

test('category groups preserve course identity and omit groups with no matches', () => {
  const catalog = getCatalogEntries(library);
  const groups = groupCatalogEntries(catalog, library);
  assert.deepEqual(groups.map(group => [group.id, group.entries.length]), [['network-build', 19], ['network-authorization', 1], ['templates-references', 1], ['design-references', 6]]);
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
    if (['/grc-rmf-training', '/grc-rmf-training/workspace', '/grc-rmf-training/templates'].includes(url.pathname)) continue;
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
    // Owner request, 18 October 2026: the Word workbook is the tile's one download.
    assert.equal(course.training.word, `/training/${configuration.id}/SecureByDesign-${configuration.id}-Workbook.docx`);
    assert.ok(existsSync(new URL('../public' + course.training.word, import.meta.url)), `${configuration.id} Word workbook exists`);
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
    for (const key of ['guide', 'word', 'cover']) {
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
    '../app/videos/training-hub.tsx',
    '../app/videos/episode-tile.tsx',
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
// official publisher, each linked to the publisher's own copy. Owner direction the same day: course 2.1's step pages show each
// step's sources; the full page stays at /grc-rmf-training/templates. Owner direction, 19 October 2026: the library is a tile
// in the Training Hub again, under Templates & References.
test('the ATO Template Library lists only verified public sources and is a Training Hub tile', () => {
  const templates = JSON.parse(readFileSync(new URL('../content/ato-templates.json', import.meta.url), 'utf8'));
  const reference = library.references[0];
  assert.deepEqual(library.references.filter(item => item.kind === 'library').map(item => [item.id, item.kind, item.categoryId, item.training.guide]), [['ato-templates', 'library', 'templates-references', '/grc-rmf-training/templates']]);
  assert.equal(library.categories.find(item => item.id === 'templates-references')?.kind, 'reference');
  assert.ok(existsSync(new URL('../public' + library.references[0].training.cover, import.meta.url)), 'library cover');
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
  assert.deepEqual(filterEpisodes(getCatalogEntries(library), 'template library', '').map(entry => entry.id), ['rmf-boe-ato', 'ato-templates']);
});

// Owner direction, 19 October 2026: the Configuration Hub and the Compliance Hub's training became one Training Hub library,
// with a sidebar of the catalog's groups and the Build the Network topic groups under it, and a short topic on every tile.
test('the Training Hub groups every course, in course order, under its learning path', async () => {
  const { getHubGroups, getArtFamily, getRecentlyUpdated, catalogDate } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
  const groups = getHubGroups(library);
  assert.deepEqual(groups.map(group => [group.id, group.parent ?? null, group.entries.length]), [
    ['network-build', null, 19], ['identity', 'network-build', 5], ['harden', 'network-build', 3], ['logging', 'network-build', 3],
    ['endpoint', 'network-build', 4], ['ops', 'network-build', 4], ['network-authorization', null, 1], ['templates-references', null, 1],
    ['design-references', null, 6],
  ]);
  const build = groups[0].entries.map(entry => entry.id);
  const topics = groups.filter(group => group.parent === 'network-build');
  // Every Build the Network course sits in exactly one topic group, and each group keeps course order.
  assert.deepEqual(topics.flatMap(group => group.entries.map(entry => entry.id)).sort(), [...build].sort());
  for (const group of topics) {
    const order = group.entries.map(entry => build.indexOf(entry.id));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), `${group.id} in course order`);
    assert.ok(group.title && group.description, group.id);
  }
  for (const entry of getCatalogEntries(library)) {
    assert.ok(entry.topic && entry.topic.length <= 20, `${entry.id} has a short topic`);
    assert.ok(['identity', 'harden', 'logging', 'endpoint', 'ops', 'authorize', 'reference'].includes(getArtFamily(entry, library)), entry.id);
  }
  assert.equal(catalogDate('14 October 2026'), Date.UTC(2026, 9, 14));
  assert.equal(catalogDate(''), 0);
  const recent = getRecentlyUpdated(library, 4);
  assert.equal(recent.length, 4);
  for (let i = 1; i < recent.length; i++) assert.ok(catalogDate(recent[i - 1].training.updated) >= catalogDate(recent[i].training.updated));
  assert.ok(recent.every(entry => entry.kind !== 'coming-soon' && entry.kind !== 'library' && entry.kind !== 'design-reference'));
});

test('the Training Hub and the ATO Package Builder Hub pages', () => {
  const hub = readFileSync(new URL('../app/videos/training-hub.tsx', import.meta.url), 'utf8');
  for (const piece of ['Continue where you left off', 'Recently updated', 'The network build, in order', 'Authorize the network', 'Coming soon', 'data-hub-entries', 'data-hub-tile', '<EpisodeTile', 'Saved materials', 'Create a free Community account']) assert.ok(hub.includes(piece), piece);
  assert.match(readFileSync(new URL('../app/technical-training/page.tsx', import.meta.url), 'utf8'), /title: 'Training Hub'/);
  const builder = readFileSync(new URL('../app/grc-rmf-training/package-builder-hub.tsx', import.meta.url), 'utf8');
  assert.match(builder, /ATO PACKAGE BUILDER HUB · PRACTICE TOOL/);
  assert.match(builder, /Learn it in the Training Hub/);
  // Owner direction, 19 October 2026: the only statement at the bottom of the hub.
  assert.ok(builder.includes('<p className="bh-note">The reviews and the decision are automated practice rules and carry no authority. Enter practice data only.</p>'));
  assert.equal(existsSync(new URL('../app/videos/video-hub.tsx', import.meta.url)), false);
});

// Owner direction, 20 October 2026: the builder names no specific authorization product; it is an original practice tool.
test('the ATO Package Builder describes itself as an original practice tool', () => {
  const view = readFileSync(new URL('../app/grc-rmf-training/workspace/system-view.tsx', import.meta.url), 'utf8');
  assert.ok(view.includes('How this workspace follows a real authorization'));
  assert.ok(view.includes('This is an original Secure By Design practice tool, not an official system of record.'));
  assert.match(readFileSync(new URL('../app/grc-rmf-training/workspace/workspace.tsx', import.meta.url), 'utf8'), /the way authorization teams do it: register/);
});

// Owner direction, 19 October 2026: one US design reference tile per infrastructure service, built from the owner's
// compendium (docs/design-references/, parsed by scripts/prepare-design-references.py into content/design-references.json).
test('each US design reference tile matches its compendium content', () => {
  const refs = JSON.parse(readFileSync(new URL('../content/design-references.json', import.meta.url), 'utf8'));
  const tiles = library.references.filter(item => item.kind === 'design-reference');
  assert.deepEqual(tiles.map(item => item.id), ['design-active-directory', 'design-dns', 'design-time', 'design-pki', 'design-dhcp', 'design-disa-stigs']);
  assert.equal(library.categories.find(item => item.id === 'design-references')?.kind, 'reference');
  const courseIds = new Set([...library.episodes, ...library.courses].map(item => item.id));
  for (const tile of tiles) {
    const entry = refs.services.find(item => `design-${item.id}` === tile.id);
    assert.ok(entry, `${tile.id} has compendium content`);
    assert.equal(tile.training.guide, `/training/design/${entry.id}`);
    assert.ok(existsSync(new URL('../public' + tile.training.cover, import.meta.url)), `${tile.id} cover`);
    assert.deepEqual(tile.stats, entry.stats);
    assert.ok(tile.areas.length > 0 && tile.stats.sources > 0, `${tile.id} areas and sources`);
    const ids = new Set([...(entry.design?.blocks ?? []), ...entry.catalog.blocks].filter(block => block.id).map(block => block.id));
    for (const area of tile.areas) assert.ok(ids.has(area.anchor), `${tile.id}: ${area.title} anchor`);
    if (entry.design) assert.equal(tile.areas.length, entry.design.areas.length);
    assert.ok(tile.topic && tile.outcomeSummary && tile.outcomes.length === 4 && tile.artLabels.length === 3, `${tile.id} tile text`);
    for (const resource of tile.training.relatedResources) {
      const course = /#course\/([a-z0-9-]+)$/.exec(resource.href)?.[1];
      assert.ok(course && courseIds.has(course), `${tile.id} links course ${course}`);
    }
    // The compendium is US-source only (owner direction, 18 October 2026): no non-US government sources.
    const text = JSON.stringify(entry);
    for (const banned of ['ANSSI', 'BSI (Germany)', 'NCSC UK', 'ASD/ACSC', 'CCCS']) {
      // The scope notes name what was removed; the design areas and catalogs must not cite them.
      assert.ok(!entry.catalog.blocks.some(block => block.type === 'table' && JSON.stringify(block.rows).includes(banned)), `${tile.id} catalog table cites ${banned}`);
    }
    assert.ok(text.length > 20000, `${tile.id} has substantive content`);
  }
  assert.ok(existsSync(new URL('../docs/design-references/SBD-US-Infrastructure-Design-Reference-Compendium.pdf', import.meta.url)));
});
