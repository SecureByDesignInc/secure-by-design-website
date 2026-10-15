import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
  assert.deepEqual(catalog.map(entry => entry.id), ['dc01-dc02', 'dns-configuration', 'domain-time', 'stig-scap', 'harden-baseline', 'two-tier-pki', 'dhcp', 'tiered-admin', 'linux-repository', 'logging-pipeline', 'audit-repository', 'splunk-analysis', 'workstation-fleet', 'patch-protect', 'management-server', 'endpoint-protection', 'vulnerability-scanning', 'business-services', 'prove-recovery', 'rmf-boe-ato', 'rmf-body-of-evidence', 'rmf-authorization-to-operate', 'ato-templates']);
  assert.equal(course.id, 'rmf-boe-ato');
  assert.equal(isTrainingCourse(course), true);
  assert.equal(isTrainingCourse(catalog[windowsIndex]), false);
  assert.deepEqual(filterEpisodes(catalog, 'rmf evidence', '').map(entry => entry.id), ['rmf-boe-ato', 'rmf-body-of-evidence', 'rmf-authorization-to-operate', 'ato-templates']);
  assert.deepEqual(filterEpisodes(catalog, 'poa&m', '').map(entry => entry.id), ['rmf-body-of-evidence', 'ato-templates']);
  assert.deepEqual(filterEpisodes(catalog, '', 'Authorization to Operate').map(entry => entry.id), ['rmf-authorization-to-operate']);
  for (const part of catalog.filter(entry => entry.kind === 'authorization')) {
    for (const resource of Object.values(part.training).filter(value => typeof value === 'string' && value.startsWith('/'))) {
      assert.ok(existsSync(new URL('.' + resource.replace(/#.*$/, ''), new URL('../public/', import.meta.url))), resource);
    }
    const page = readFileSync(new URL('../public' + part.training.guide.replace(/#.*$/, ''), import.meta.url), 'utf8');
    assert.doesNotMatch(page, /PRIVATE REVIEW|noindex/);
    assert.match(page, /Back to the Training Library/);
  }
});

test('category groups preserve course identity and omit groups with no matches', () => {
  const catalog = getCatalogEntries(library);
  const groups = groupCatalogEntries(catalog, library);
  assert.deepEqual(groups.map(group => [group.id, group.entries.length]), [['network-build', 19], ['network-authorization', 3], ['templates-references', 1]]);
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

test('authorization parts cover the existing course once and preserve saved progress and resource destinations', () => {
  const context = { window: {} };
  runInNewContext(readFileSync(new URL('../public/training/rmf/catalog-data.js', import.meta.url), 'utf8'), context);
  const modules = JSON.parse(JSON.stringify(context.window.CATALOG));
  const parts = getCatalogEntries(library).filter(entry => entry.categoryId === 'network-authorization');
  const progress = JSON.parse(readFileSync(new URL('../content/training-progress.json', import.meta.url), 'utf8'));
  assert.deepEqual(parts.map(part => part.title), ['Risk Management Framework', 'Body of Evidence', 'Authorization to Operate']);
  assert.deepEqual(parts.flatMap(part => part.moduleIds), modules.map(module => module.id));
  assert.equal(parts.reduce((sum, part) => sum + part.estimatedHours, 0), 24);
  assert.equal(parts.reduce((sum, part) => sum + part.lessonCount, 0), 36);
  for (const part of parts) {
    const selected = modules.filter(module => part.moduleIds.includes(module.id));
    assert.equal(part.moduleCount, selected.length);
    assert.equal(part.lessonCount, selected.reduce((sum, module) => sum + module.lessons.length, 0));
    assert.equal(part.estimatedHours, selected.reduce((sum, module) => sum + Number(module.hours), 0) + (part.capstoneHours ?? 0));
    // Owner request, 15 October 2026: each course has its own page; progress IDs keep the original course's name.
    const page = `/training/${context.window.CATALOG_PARTS.find(item => item.id === part.id).folder}/index.html`;
    assert.equal(part.training.guide, `${page}#catalog/${selected[0].id}`);
    for (const [index, module] of selected.entries()) {
      assert.equal(part.stages[index].href, `${page}#catalog/${module.id}`);
      // The expanded tile's module explorer lists these; keep them equal to the module catalog.
      assert.deepEqual(part.stages[index].lessons, module.lessons);
      assert.equal(part.stages[index].hours, module.hours);
      assert(progress.some(entry => entry.id === `training:rmf-boe-ato:${module.id}` && entry.href === part.stages[index].href));
    }
    for (const resource of part.training.relatedResources) {
      const url = new URL(resource.href, 'https://securebydesigninc.com');
      // The Authorization Workspace (app/authorization-workspace) is where the capstone is run.
      if (url.pathname === '/authorization-workspace') continue;
      assert.equal(url.pathname, page);
      assert(['#evidence', '#evidence/manifest', '#capstone'].includes(url.hash));
    }
  }
});

test('the Network Authorization pages group their modules by the catalog courses and show their edition', () => {
  const context = { window: {} };
  runInNewContext(readFileSync(new URL('../public/training/rmf/catalog-data.js', import.meta.url), 'utf8'), context);
  const parts = getCatalogEntries(library).filter(entry => entry.categoryId === 'network-authorization');
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.CATALOG_PARTS)).map(part => [part.number, part.title, part.modules]), parts.map(part => [part.number, part.title, part.moduleIds]));
  for (const part of parts) {
    const page = readFileSync(new URL('../public' + part.training.guide.replace(/#.*$/, ''), import.meta.url), 'utf8');
    const shown = [...page.matchAll(/[Ee]dition\s+([\d.]+)/g)].map(match => match[1]);
    assert.ok(shown.length >= 2);
    assert.deepEqual([...new Set(shown)], [part.training.materialsEdition], `course ${part.number} shows its edition everywhere`);
    assert.ok(page.includes(`Updated ${part.training.updated}`));
    assert.ok(page.includes(`<body data-course="${part.number}">`));
  }
});

test('configuration lessons have complete guides, checklists, quizzes and shared progress identifiers', () => {
  const configurations = JSON.parse(readFileSync(new URL('../content/configuration-courses.json', import.meta.url), 'utf8'));
  const progress = JSON.parse(readFileSync(new URL('../content/training-progress.json', import.meta.url), 'utf8'));
  const resources = JSON.parse(readFileSync(new URL('../content/training-resources.json', import.meta.url), 'utf8'));
  assert.equal(new Set(progress.map(item => item.id)).size, progress.length);
  assert.equal(new Set(resources.map(item => item.id)).size, resources.length);
  assert.deepEqual(configurations.map(course => course.lessons.length), [5, 5, 5, 5, 10, 5, 5, 5, 5, 5, 5, 7, 5, 5, 5, 6]);
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


// Owner request, 15 October 2026: an ATO Template Library tile in its own Templates & References group.
test('the ATO Template Library tile is a reference entry with valid templates and a page', () => {
  const templates = JSON.parse(readFileSync(new URL('../content/ato-templates.json', import.meta.url), 'utf8'));
  const [reference] = library.references;
  const category = library.categories.find(item => item.id === reference.categoryId);
  assert.equal(reference.id, 'ato-templates');
  assert.equal(reference.kind, 'library');
  assert.equal(category.kind, 'reference');
  assert.equal(library.categories.at(-1).id, category.id, 'the reference group comes after the learning paths');
  assert.equal(isTrainingCourse(reference), false);
  assert.ok(existsSync(new URL('../public' + reference.training.cover, import.meta.url)), 'cover');
  assert.ok(existsSync(new URL('../app' + reference.training.guide + '/page.tsx', import.meta.url)), 'library page');
  assert.ok(reference.artLabels.length >= 2 && reference.outcomes.length && reference.outcomeSummary);
  const groupIds = templates.groups.map(group => group.id);
  assert.equal(new Set(groupIds).size, groupIds.length, 'unique artifact groups');
  assert.equal(new Set(templates.templates.map(item => item.title)).size, templates.templates.length, 'unique template titles');
  for (const group of templates.groups) assert.ok(templates.templates.some(item => item.group === group.id), `${group.id} has templates`);
  for (const item of templates.templates) {
    assert.ok(groupIds.includes(item.group), `${item.title} group`);
    assert.ok(['NIST', 'CNSS', 'DoD', 'SAP', 'FedRAMP', 'Other'].includes(item.framework), `${item.title} framework`);
    assert.ok(['current', 'legacy', 'superseded', 'restricted'].includes(item.status), `${item.title} status`);
    assert.ok(item.rmf && item.source && item.links.length > 0, `${item.title} details`);
    for (const link of item.links) {
      assert.match(link.href, /^https:\/\//, `${item.title} links to its publisher`);
      assert.doesNotMatch(link.href, / /, `${item.title} link is encoded`);
      assert.ok(link.label && link.format, `${item.title} link label`);
    }
  }
  for (const resource of reference.training.relatedResources) assert.match(resource.href, /^\//);
  // Owner direction: the templates serve a DoD SAP network under NIST Rev. 5 and the JSIG.
  assert.ok(templates.templates.filter(item => item.framework === 'SAP').length >= 10, 'SAP and JSIG templates');
  assert.ok(templates.templates.some(item => /CNSSI 1253E Attachment 5/.test(item.title)), 'classified system overlay');
  assert.deepEqual(filterEpisodes(getCatalogEntries(library), 'template library', '').map(entry => entry.id), ['ato-templates']);
});
