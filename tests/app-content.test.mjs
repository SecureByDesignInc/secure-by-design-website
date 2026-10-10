// The native app downloads /app/content/v1.json on launch and resume. These checks keep the feed
// in the shape installed apps parse (lib/data/site_content.dart in the native repository).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {APP_CONTENT_SCHEMA, buildAppContent} from '../scripts/app-content.mjs';

const {content} = await buildAppContent();
const catalog = JSON.parse(readFileSync(new URL('../content/videos.json', import.meta.url), 'utf8'));
const progress = JSON.parse(readFileSync(new URL('../content/training-progress.json', import.meta.url), 'utf8'));

test('the feed carries the schema installed apps accept and a content version', () => {
  assert.equal(content.schema, APP_CONTENT_SCHEMA);
  assert.equal(content.schema, 1, 'Changing the schema strands every installed app on its bundled content.');
  assert.match(content.version, /^[0-9a-f]{16}$/);
});

test('the feed is deterministic, so unchanged content never triggers an app build', async () => {
  const again = await buildAppContent();
  assert.equal(again.content.version, content.version);
  assert.equal(JSON.stringify(again.content), JSON.stringify(content));
});

test('every published Training Library entry reaches the app, in catalog order', () => {
  assert.equal(content.courses.length, catalog.episodes.length + catalog.courses.length);
  for (const course of content.courses) {
    for (const key of ['id', 'number', 'title', 'subtitle', 'category', 'description', 'icon', 'studyTime']) {
      assert.equal(typeof course[key], 'string', `${course.id}.${key}`);
    }
    assert.ok(Number.isInteger(course.topics), `${course.id}.topics`);
    assert.ok(course.lessons.length > 0, `${course.id} has lessons`);
    assert.ok(course.materials.length > 0, `${course.id} has materials`);
  }
});

test('lessons have the fields and knowledge checks the app requires', () => {
  const ids = content.courses.flatMap(c => c.lessons.map(l => l.id));
  assert.equal(new Set(ids).size, ids.length, 'lesson IDs are unique');
  for (const lesson of content.courses.flatMap(c => c.lessons)) {
    assert.ok(lesson.id && lesson.title && lesson.sourceUrl.startsWith('https://securebydesigninc.com/'), lesson.id);
    assert.ok(Number.isInteger(lesson.minutes) && lesson.minutes > 0, `${lesson.id}.minutes`);
    assert.ok(lesson.sections.length > 0 && lesson.sections.every(s => typeof s.heading === 'string' && typeof s.body === 'string'), `${lesson.id}.sections`);
    assert.ok(lesson.quizzes.length > 0, `${lesson.id} has a knowledge check`);
    for (const quiz of lesson.quizzes) {
      assert.ok(quiz.correct >= 0 && quiz.correct < quiz.answers.length, `${lesson.id}: ${quiz.question}`);
    }
  }
});

test('account sync accepts every lesson the app shows', () => {
  const known = new Set(progress.map(p => p.id));
  const missing = content.courses.flatMap(c => c.lessons).map(l => l.id).filter(id => !known.has(id));
  assert.deepEqual(missing, [], 'add these lessons to content/training-progress.json');
});

test('the Inside the Network reference is included', () => {
  for (const key of ['nodes', 'vlans', 'facilities', 'scenarios', 'whatIfs', 'policy', 'technical']) {
    assert.ok(key in content.network, `network.${key}`);
  }
  assert.ok(content.network.nodes.length > 0 && content.network.scenarios.length > 0);
});
