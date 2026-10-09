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
  assert.deepEqual(catalog.map(entry => entry.id), ['dc01-dc02', 'dns-configuration', 'harden-baseline', 'two-tier-pki', 'tiered-admin', 'logging-pipeline', 'workstation-fleet', 'patch-protect', 'business-services', 'prove-recovery', 'rmf-boe-ato', 'rmf-body-of-evidence', 'rmf-authorization-to-operate']);
  assert.equal(course.id, 'rmf-boe-ato');
  assert.equal(isTrainingCourse(course), true);
  assert.equal(isTrainingCourse(catalog[windowsIndex]), false);
  assert.deepEqual(filterEpisodes(catalog, 'rmf evidence', ''), [course]);
  assert.deepEqual(filterEpisodes(catalog, '', 'Authorization to Operate').map(entry => entry.id), ['rmf-authorization-to-operate']);
  for (const resource of Object.values(course.training).filter(value => typeof value === 'string' && value.startsWith('/'))) {
    assert.ok(existsSync(new URL('.' + resource, new URL('../public/', import.meta.url))), resource);
  }
  const page = readFileSync(new URL('../public/training/rmf/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /PRIVATE REVIEW|noindex/);
  assert.match(page, /Back to the Training Library/);
});

test('category groups preserve course identity and omit groups with no matches', () => {
  const catalog = getCatalogEntries(library);
  const groups = groupCatalogEntries(catalog, library);
  assert.deepEqual(groups.map(group => [group.id, group.entries.length]), [['network-build', 10], ['network-authorization', 3]]);
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
    assert.equal(part.training.guide, `/training/rmf/index.html#catalog/${selected[0].id}`);
    for (const [index, module] of selected.entries()) {
      assert.equal(part.stages[index].href, `/training/rmf/index.html#catalog/${module.id}`);
      assert(progress.some(entry => entry.id === `training:rmf-boe-ato:${module.id}` && entry.href === part.stages[index].href));
    }
    for (const resource of part.training.relatedResources) {
      const url = new URL(resource.href, 'https://securebydesigninc.com');
      assert.equal(url.pathname, '/training/rmf/index.html');
      assert(['#evidence', '#evidence/manifest', '#capstone'].includes(url.hash));
    }
  }
});

test('configuration lessons have complete guides, checklists, quizzes and shared progress identifiers', () => {
  const configurations = JSON.parse(readFileSync(new URL('../content/configuration-courses.json', import.meta.url), 'utf8'));
  const progress = JSON.parse(readFileSync(new URL('../content/training-progress.json', import.meta.url), 'utf8'));
  const resources = JSON.parse(readFileSync(new URL('../content/training-resources.json', import.meta.url), 'utf8'));
  assert.equal(new Set(progress.map(item => item.id)).size, progress.length);
  assert.equal(new Set(resources.map(item => item.id)).size, resources.length);
  assert.deepEqual(configurations.map(course => course.lessons.length), [6, 10, 6, 6, 6, 7, 6, 5, 6]);
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
      assert.ok(lesson.sources.every(id => configuration.sources.some(source => source.id === id && ['https://learn.microsoft.com/', 'https://www.cyber.mil/', 'https://public.cyber.mil/', 'https://csrc.nist.gov/', 'https://docs.splunk.com/', 'https://docs.tenable.com/', 'https://docs.trellix.com/', 'https://docs.redhat.com/'].some(origin => source.url.startsWith(origin)))));
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
    tags: ['Windows Server 2025', 'DNS'],
    systems: ['DC01', 'DC02'],
  },
  {
    id: 'monitoring',
    title: 'Observe the network',
    subtitle: 'Telemetry and events',
    description: 'Investigate a failed service.',
    tags: ['Monitoring', 'Windows Server 2025'],
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
    'server 2025',
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
    'Windows Server 2025',
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
