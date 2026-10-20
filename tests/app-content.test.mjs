import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildAppCatalog, APP_CONTENT_SCHEMA} from '../scripts/prepare-app-content.mjs';
import {guideIds} from '../server/reader-progress.js';

const site = fileURLToPath(new URL('..', import.meta.url));
const published = JSON.parse(readFileSync(new URL('../public/app-content/v1/catalog.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../public/app-content/v1/manifest.json', import.meta.url), 'utf8'));
const library = JSON.parse(readFileSync(new URL('../content/videos.json', import.meta.url), 'utf8'));

test('the published app catalog is current: rebuild it with node scripts/prepare-app-content.mjs', () => {
  const {unknownLessons, materials, ...built} = buildAppCatalog(site);
  assert.deepEqual(unknownLessons, []);
  assert.deepEqual(published, JSON.parse(JSON.stringify(built)));
  const body = readFileSync(new URL('../public/app-content/v1/catalog.json', import.meta.url));
  assert.equal(manifest.sha256, createHash('sha256').update(body).digest('hex'));
  assert.equal(manifest.version, manifest.sha256.slice(0, 16));
  assert.equal(manifest.bytes, body.length);
  assert.equal(manifest.schema, APP_CONTENT_SCHEMA);
});

test('the app catalog matches the Training Hub: same courses, coming-soon tiles and categories', () => {
  const live = library.courses.filter(c => c.kind !== 'coming-soon').map(c => c.id).sort();
  assert.deepEqual(published.courses.map(c => c.id).sort(), live);
  assert.deepEqual(published.comingSoon.map(c => c.number), library.courses.filter(c => c.kind === 'coming-soon').map(c => c.number));
  for (const c of published.comingSoon) assert.ok(published.categories.some(x => x.id === c.categoryId));
  for (const c of published.courses) {
    assert.ok(published.categories.some(x => x.id === c.categoryId), c.id);
    assert.ok(c.lessons.length > 0, c.id);
    for (const l of c.lessons) {
      assert.ok(l.quizzes.length > 0, l.id);
      for (const q of l.quizzes) assert.ok(q.correct >= 0 && q.correct < q.answers.length, l.id);
      // Lab mode saves into the website guide's own rows, so every guide ID must be one the API accepts.
      if (l.guide) assert.ok(guideIds.has(l.guide.id), l.guide.id);
    }
  }
});
