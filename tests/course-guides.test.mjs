// Owner request, 13 October 2026: every configuration course guide (1.2–1.10) matches the course 1.1 guide's
// design. scripts/prepare-course-guides.mjs builds them from content/configuration-courses.json and
// content/course-guides/<id>.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

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
