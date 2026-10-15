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

// Owner request, 15 October 2026: the Network Authorization page (courses 2.1–2.3) follows the same design.
// It is hand-built, so it loads the guides' stylesheet and 3D scene from the shared copies the generator writes.
test('the Network Authorization page uses the course guide stylesheet and 3D scene', () => {
  assert.ok(read('public/training/guide/course-guide.css').startsWith(read('scripts/course-guide/style.css')));
  assert.equal(read('public/training/guide/scene.js'), read('scripts/course-guide/scene.js'));
  const page = read('public/training/rmf/index.html');
  for (const part of ['/training/guide/course-guide.css', 'src="/training/guide/scene.js"', '"three":"/training/guide/three.module.js"', 'class="top"', 'class="hero"', 'class="kitcard"', 'class="chapters"', 'id="module-list"', 'id="lesson"', 'id="stage"', 'id="fallback"', 'class="media-card"', 'class="statusbar"', 'Back to the Training Library'])
    assert.ok(page.includes(part), `the RMF page has ${part}`);
  // Its account panel names no course, so account-progress.js keeps reading the module from #catalog/NN.
  assert.match(page, /<section class="sbd-account-progress" aria-label="Account learning progress">/);
  assert.match(read('public/_headers'), /^\/training\/rmf\/\*\n  Content-Security-Policy: [^\n]*worker-src 'self' blob:/m);
});

test('the authorization view covers every module with real parts of the network', () => {
  const context = { window: {} };
  runInNewContext(read('public/training/rmf/catalog-data.js') + read('public/training/rmf/network-data.js'), context);
  const { CATALOG: modules, RMF_NETWORK: view } = context.window;
  const network = JSON.parse(read('content/inside-the-network.json'));
  assert.equal(view.modules.length, modules.length);
  const ids = new Set(view.scene.nodes.map(node => node.id));
  for (const node of view.scene.nodes) {
    for (const key of ['name', 'sub', 'title', 'description', 'button']) assert.ok(typeof node[key] === 'string' && node[key].trim(), `${node.id} ${key}`);
    assert.ok(node.focus.every(index => Number.isInteger(index) && index >= 0 && index < modules.length), `${node.id} focus`);
    const vlan = /^VLAN (\d+)$/.exec(node.name);
    if (vlan) assert.equal(network.segments.find(segment => segment.number === Number(vlan[1]))?.name, node.sub, `${node.name} is named as in Inside the Network`);
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
  for (const name of JSON.stringify(view).match(/SBD-[A-Z0-9-]*\d{2}|AdminJumpBox01/g)) assert.ok(systems.has(name), `${name} is in Inside the Network`);
});
