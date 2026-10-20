// Owner request, 13 October 2026: every configuration course guide (1.2–1.10) matches the course 1.1 guide's
// design. scripts/prepare-course-guides.mjs builds them from content/configuration-courses.json and
// content/course-guides/<id>.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const configurations = JSON.parse(read('content/configuration-courses.json'));
const lessonData = html => JSON.parse(/window\.SBD_LESSON=(\{[\s\S]*?\});<\/script>/.exec(html)[1]);

test('the course guides share the course 1.1 guide stylesheet', () => {
  assert.ok(read('public/training/dc01-dc02/index.html').includes(read('scripts/course-guide/style.css')));
});

// Owner request, 18 October 2026: every expanded catalog tile draws its course's 3D lesson network, like the course 1.1
// tile. The data comes from each guide's scene.json; app/videos/course-experience.tsx loads it and app/videos/guide-scene.ts
// draws it, so the tile and the guide show the same systems, flows and lesson states.
test('every configuration course publishes the scene its catalog tile draws', () => {
  for (const course of configurations) {
    const file = new URL(`../public/training/${course.id}/scene.json`, import.meta.url);
    assert.ok(existsSync(file), `${course.id} scene.json`);
    const data = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(data.chapters.map(chapter => chapter.id), course.lessons.map(lesson => lesson.id), `${course.id} scene chapters match its lessons`);
    for (const chapter of data.chapters) assert.ok(chapter.tag && chapter.status && chapter.network, `${course.id} ${chapter.id} names its tag, status and network state`);
    assert.ok(Array.isArray(data.scene.nodes) && data.scene.nodes.length > 0 && data.scene.nodes.every(node => node.id && node.name && node.title && node.description), `${course.id} scene nodes`);
    assert.deepEqual(data.scene, lessonData(read(`public/training/${course.id}/index.html`)).scene, `${course.id} tile and guide draw the same scene`);
  }
  // One explorer for every tile: courses 1.2–1.19 and course 1.1 both render build-explorer.tsx.
  const explorer = read('app/videos/build-explorer.tsx');
  for (const piece of ["import('./guide-scene')", 'vc-system-buttons', 'Reset view', 'Pause motion', 'Play the build story']) assert.ok(explorer.includes(piece), `build explorer has ${piece}`);
  for (const tile of ['app/videos/course-experience.tsx', 'app/videos/episode-experience.tsx']) {
    const source = read(tile);
    assert.ok(source.includes("from './build-explorer'") && source.includes('<BuildExplorer') && source.includes('/scene.json`'), `${tile} uses the shared explorer`);
    assert.ok(!source.includes('catalog-scene'), `${tile} has no bespoke scene`);
  }
  assert.equal(existsSync(new URL('../app/videos/catalog-scene.ts', import.meta.url)), false);
  // Course 1.1's scene is hand-kept beside its hand-kept guide; its chapters are the episode's chapters.
  const identity = JSON.parse(readFileSync(new URL('../public/training/dc01-dc02/scene.json', import.meta.url), 'utf8'));
  const episode = JSON.parse(read('content/videos.json')).episodes.find(item => item.id === 'dc01-dc02');
  assert.deepEqual(identity.chapters.map(chapter => chapter.id), episode.chapters.map(chapter => chapter.id));
  assert.deepEqual(identity.scene.nodes.map(node => node.name), ['SBD-DC01', 'SBD-DC02']);
  for (const chapter of identity.chapters) assert.ok(chapter.tag && chapter.status && chapter.network, `1.1 ${chapter.id} names its tag, status and network state`);
});

test('every configuration course has a guide in the 1.1 design that carries its lessons unchanged', () => {
  const style = read('scripts/course-guide/style.css');
  const headers = read('public/_headers');
  for (const course of configurations) {
    assert.ok(existsSync(new URL(`../content/course-guides/${course.id}.json`, import.meta.url)), `${course.id} guide content`);
    const html = read(`public/training/${course.id}/index.html`);
    assert.ok(html.includes(style), `${course.id} uses the 1.1 stylesheet`);
    for (const part of ['class="chapters"', 'id="chapter-list"', 'data-tab="guide"', 'data-tab="security"', 'data-tab="evidence"', 'id="stage"', 'class="kitcard"', 'class="media-card"', `data-course="${course.id}"`, '/training/account-progress.js'])
      assert.ok(html.includes(part), `${course.id} has ${part}`);
    const data = lessonData(html);
    assert.deepEqual(data.chapters.map(chapter => chapter.id), course.lessons.map(lesson => lesson.id), `${course.id} lesson IDs (and their progress IDs) are unchanged`);
    data.chapters.forEach((chapter, index) => {
      const lesson = course.lessons[index];
      assert.equal(chapter.title, lesson.title);
      assert.deepEqual(chapter.steps.map(step => step[1]), lesson.steps, `${course.id}/${lesson.id} steps`);
      assert.equal(chapter.command, lesson.command);
      assert.equal(chapter.expected, lesson.check);
      assert.equal(chapter.evidencePrompt, lesson.evidence);
      assert.deepEqual(chapter.quizzes.map(quiz => [quiz.prompt, quiz.correct]), lesson.quizzes.map(quiz => [quiz.question, quiz.correct]));
      assert.equal(chapter.checklist.length, 3);
      assert.match(chapter.control.id, /^[A-Z]{2}-\d+(\(\d+\))?$/);
    });
    assert.match(headers, new RegExp(`^/training/${course.id}/\\*\\n  Content-Security-Policy: `, 'm'), `${course.id} has a content security policy`);
  }
  for (const file of ['three.core.js', 'three.module.js', 'orbit-controls.js', 'brand.png', 'THREE-LICENSE.txt'])
    assert.ok(existsSync(new URL(`../public/training/guide/${file}`, import.meta.url)), file);
});

test('guide content names Windows releases without version numbers', () => {
  const release = /Windows Server 20\d\d|Server 20\d\d|Windows 1[01]\b|\b2[0-9]H[12]\b/i;
  for (const course of configurations) assert.doesNotMatch(read(`content/course-guides/${course.id}.json`), release, course.id);
});

// Owner requests, 15 October 2026: the Network Authorization courses (2.1–2.3) follow the same design, and each course
// has its own page and materials. scripts/prepare-rmf-courses.mjs builds the pages from content/videos.json and
// window.CATALOG_PARTS; they load the guides' stylesheet and 3D scene from the shared copies the guide generator writes.
test('the Network Authorization course has its page in the course guide design', () => {
  assert.ok(read('public/training/guide/course-guide.css').startsWith(read('scripts/course-guide/style.css')));
  assert.equal(read('public/training/guide/scene.js'), read('scripts/course-guide/scene.js'));
  const context = { window: {} };
  runInNewContext(read('public/grc-rmf-training/rmf/catalog-data.js'), context);
  const library = JSON.parse(read('content/videos.json'));
  const resources = JSON.parse(read('content/training-resources.json'));
  const headers = read('public/_headers');
  const parts = context.window.CATALOG_PARTS;
  // Owner direction, 15 October 2026: one Network Authorization course page, organized by the seven RMF steps.
  assert.deepEqual(Array.from(parts, part => part.folder), ['rmf']);
  for (const part of parts) {
    const course = library.courses.find(item => item.id === part.id);
    const page = read(`public/grc-rmf-training/${part.folder}/index.html`);
    for (const piece of ['/training/guide/course-guide.css', 'src="/training/guide/scene.js"', '"three":"/training/guide/three.module.js"', 'src="/grc-rmf-training/rmf/app.js"', 'class="top"', 'class="hero"', 'class="kitcard"', 'class="chapters"', 'id="module-list"', 'id="lesson"', 'id="stage"', 'id="fallback"', 'class="media-card"', 'class="statusbar"', 'Back to the Training Hub', '/training/account-progress.js',
      `<body data-course="${part.number}">`, `<link rel="canonical" href="https://securebydesigninc.com/grc-rmf-training/${part.folder}/">`, `Network Authorization / Course ${part.number}`, `href="${course.training.word}" download`])
      assert.ok(page.includes(piece), `course ${part.number} has ${piece}`);
    // The account panel names the guide it saves; account-progress.js reads the module from #catalog/NN.
    const guide = /<section class="sbd-account-progress" aria-label="Account learning progress" data-guide="([a-z0-9-]+)">/.exec(page)?.[1];
    assert.ok(resources.some(item => item.id === guide && !item.retired && item.url === `https://securebydesigninc.com/grc-rmf-training/${part.folder}/index.html`), `course ${part.number} saves ${guide}`);
    assert.match(headers, new RegExp(`^/grc-rmf-training/${part.folder}/\\*\\n  Content-Security-Policy: [^\\n]*worker-src 'self' blob:`, 'm'), `course ${part.number} has a content security policy`);
  }
  // Saved materials that point at these courses open a page or file that exists.
  for (const item of resources.filter(item => !item.retired && /^https:\/\/securebydesigninc\.com\/grc-rmf-training\/rmf/.test(item.url))) {
    const path = new URL(item.url).pathname;
    assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), `${item.id} → ${path}`);
  }
});

test('the authorization view covers every module with real parts of the network', () => {
  const context = { window: {} };
  runInNewContext(read('public/grc-rmf-training/rmf/catalog-data.js') + read('public/grc-rmf-training/rmf/network-data.js'), context);
  const { CATALOG: modules, RMF_NETWORK: view } = context.window;
  const network = JSON.parse(read('content/inside-the-network.json'));
  assert.equal(view.modules.length, modules.length);
  const ids = new Set(view.scene.nodes.map(node => node.id));
  for (const node of view.scene.nodes) {
    for (const key of ['name', 'sub', 'title', 'description', 'button']) assert.ok(typeof node[key] === 'string' && node[key].trim(), `${node.id} ${key}`);
    assert.ok(node.focus.every(index => Number.isInteger(index) && index >= 0 && index < modules.length), `${node.id} focus`);
    const vlan = /^VLAN (\d+)$/.exec(node.name);
    if (vlan) assert.equal(network.segments.find(segment => segment.number === Number(vlan[1]))?.name, node.sub, `${node.name} is named as in the System Hub`);
  }
  for (const flow of view.scene.flows) {
    assert.ok(ids.has(flow.from) && ids.has(flow.to) && flow.from !== flow.to, `${flow.from}→${flow.to}`);
    assert.ok(flow.lessons.length && flow.lessons.every(index => Number.isInteger(index) && index >= 0 && index < modules.length), `${flow.from}→${flow.to} modules`);
  }
  modules.forEach((module, index) => {
    assert.ok(view.modules[index].status && view.modules[index].caption, `module ${module.id} caption`);
    assert.ok(view.scene.nodes.some(node => node.focus.includes(index)), `module ${module.id} highlights part of the network`);
  });
  const systems = new Set(network.systems.map(system => system.name));
  for (const name of JSON.stringify(view).match(/SBD-[A-Z0-9-]*\d{2}|AdminJumpBox01/g)) assert.ok(systems.has(name), `${name} is in the System Hub`);
});
