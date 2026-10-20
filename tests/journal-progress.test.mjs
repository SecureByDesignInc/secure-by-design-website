import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as catalog from '../content/progress-catalog.js';
import {bookmarkCatalog} from '../content/bookmark-catalog.js';
import training from '../content/training-progress.json' with {type:'json'};
import articleProgress from '../content/article-progress.json' with { type: 'json' };
import { readerProgressApi } from '../server/reader-progress.js';
import * as authorizationModel from '../lib/authorization/model.mjs';
import { bookingLink } from '../lib/booking.mjs';

const expectedIds = [
  'rmf:prepare', 'rmf:categorize', 'rmf:select', 'rmf:implement', 'rmf:assess', 'rmf:authorize', 'rmf:monitor',
  'article:what-is-active-directory', 'article:active-directory-certificate-services', 'article:domains-forests-ous-and-trusts',
  'article:users-groups-and-permissions', 'article:understanding-group-policy', 'article:replication-and-fsmo-roles', 'article:securing-active-directory',
  'path:orientation', 'path:domain', 'path:linux-discovery', 'path:monitoring', 'path:rmf',
];

test('the complete recognized progress catalog retains every original ID and its order', () => {
  assert.deepEqual(catalog.progressCatalog.filter(item=>!item.id.startsWith('training:')).map(item => item.id), expectedIds);
  // Journal (rmf:*, article:*) and Cyber Range (path:*) entries are offline; only the Training Hub counts.
  assert.deepEqual(catalog.activeProgressCatalog.map(item => item.id), training.map(item=>item.id));
  // Technical courses live under /training/; the RMF to ATO course under /grc-rmf-training (15 October 2026), shown in the Training Hub (19 October 2026).
  assert.ok(catalog.activeProgressCatalog.every(item => /^\/(training|grc-rmf-training)\//.test(item.href)));
});

test('the shared progress catalog imports only minimal article metadata rather than article prose', () => {
  const posts = JSON.parse(readFileSync(new URL('../content/articles.json', import.meta.url), 'utf8'));
  assert.deepEqual(articleProgress, posts.map(({ slug, title }) => ({ slug, title })));
  assert.ok(articleProgress.every(post => Object.keys(post).sort().join(',') === 'slug,title'));
  const source = readFileSync(new URL('../content/progress-catalog.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from ['"]\.\/articles\.json['"]/);
  assert.match(source, /from ['"]\.\/article-progress\.json['"]/);
});

test('dashboard filtering preserves stored objects while excluding offline Journal and Cyber Range records', () => {
  const records = [
    { id: 'article:what-is-active-directory', status: 'in_progress', updatedAt: '2026-10-04T12:00:00Z' },
    { id: 'rmf:prepare', status: 'completed', updatedAt: '2026-10-04T11:00:00Z' },
    { id: 'path:domain', status: 'in_progress', updatedAt: '2026-10-04T10:00:00Z' },
    { id: 'path:orientation', status: 'completed', updatedAt: '2026-10-04T09:00:00Z' },
  ];
  const snapshot = JSON.stringify(records);
  const withTraining = [...records, { id: 'training:dns-configuration:zones', status: 'completed', updatedAt: '2026-10-08T09:00:00Z' }];
  assert.deepEqual(catalog.filterActiveProgressRecords(records), []);
  assert.equal(catalog.filterActiveProgressRecords(withTraining)[0], withTraining[4]);
  assert.equal(catalog.filterActiveProgressRecords(withTraining).length, 1);
  assert.equal(JSON.stringify(records), snapshot);
});

const require = createRequire(import.meta.url);
const dashboardSource = readFileSync(new URL('../app/my-progress/progress-dashboard.tsx', import.meta.url), 'utf8');
const dashboardCode = ts.transpileModule(dashboardSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2017 },
}).outputText;

function renderDashboard(records) {
  const exports = {};
  runInNewContext(dashboardCode, {
    exports,
    require(specifier) {
      if (specifier === '../../content/bookmark-catalog') return {bookmarkCatalog};
      if (specifier === '../../content/progress-catalog') return catalog;
      if (specifier === '../reader-progress') return { useReaderProgress: () => ({ data: { user: { email: 'reader@example.invalid', needsPassword: false }, records }, error: '', busy: false }) };
      if (specifier === '../account/sign-in') return { default: () => null };
      if (specifier === './sign-in-methods') return { default: () => null, DeleteAccount: () => null, ReauthNotice: () => null };
      if (specifier === '../account/safe-return') return { safeReturnPath: () => null };
      if (specifier === '../../lib/authorization/model.mjs') return authorizationModel;
      if (specifier === '../../content/booking.json') return { default: { url: '', label: 'Book a call' } };
      if (specifier === '../../lib/booking.mjs') return { bookingLink };
      // The Book a call pill (owner direction, 20 October 2026); nothing renders without a booking address.
      if (specifier === '../booking-link') return { default: () => null };
      if (specifier === 'next/link') return { default: props => React.createElement('a', props) };
      return require(specifier);
    },
  });
  return renderToStaticMarkup(React.createElement(exports.default));
}

test('rendered dashboard counts only active training; offline Journal and Cyber Range records stay stored but hidden', () => {
  const html = renderDashboard([
    { id: 'article:what-is-active-directory', status: 'in_progress' },
    { id: 'rmf:prepare', status: 'completed' },
    { id: 'path:domain', status: 'in_progress' },
    { id: 'path:orientation', status: 'completed' },
    { id: 'training:dns-configuration:zones', status: 'completed' },
  ]);
  assert.match(html, /<span>Completed<\/span><strong>1<\/strong>/);
  assert.match(html, /<span>In progress<\/span><strong>0<\/strong>/);
  assert.match(html, /<h2 id="resume-title">Find something to explore\.<\/h2><a href="\/technical-training">Explore the Training Hub/);
  assert.doesNotMatch(html, /Learning path|cyber-range|Security Journal|Technical articles|<h2>RMF lifecycle|href="\/(?:blogs?|rmf-series)/);
  assert.ok(catalog.progressCatalog.some(item => item.id === 'path:domain'), 'Cyber Range IDs remain recognized for saved progress');
});

test('journal-only accounts get zero active counts and Training Hub discovery without journal resume links', () => {
  const html = renderDashboard([{ id: 'article:what-is-active-directory', status: 'in_progress' }, { id: 'rmf:prepare', status: 'completed' }]);
  assert.match(html, /<span>Completed<\/span><strong>0<\/strong>/);
  assert.match(html, /<span>In progress<\/span><strong>0<\/strong>/);
  assert.match(html, /<h2 id="resume-title">Find something to explore\.<\/h2><a href="\/technical-training">Explore the Training Hub/);
  assert.doesNotMatch(html, /Continue reading|Security Journal|href="\/(?:blogs?|rmf-series)/);
});

test('new configuration progress resumes its exact lesson and counts in Network build', () => {
  const html = renderDashboard([
    { id: 'training:dns-configuration:zones', status: 'completed' },
    { id: 'training:two-tier-pki:sign', status: 'in_progress' },
  ]);
  assert.match(html, /href="\/training\/two-tier-pki#sign">Continue/);
  const total = group => catalog.activeProgressCatalog.filter(item => item.group === group).length;
  assert.match(html, new RegExp(`Network build: 1 of ${total('Network build')} complete`));
  assert.match(html, new RegExp(`Network authorization: 0 of ${total('Network authorization')} complete`));
});

test('backend still accepts all legacy journal IDs and reads preserve saved account records', async t => {
  const raw = new DatabaseSync(':memory:');
  t.after(() => raw.close());
  const migrationRoot = new URL('../drizzle/', import.meta.url);
  for (const file of readdirSync(migrationRoot).filter(file => file.endsWith('.sql')).sort()) raw.exec(readFileSync(new URL(file, migrationRoot), 'utf8'));
  const token = 'a'.repeat(64);
  raw.prepare('INSERT INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run('reader', 'reader@example.invalid', new Date().toISOString());
  raw.prepare('INSERT INTO reader_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').run(createHash('sha256').update(token).digest('hex'), 'reader', new Date(Date.now() + 86400000).toISOString());
  const env = { DB: { prepare(sql) { let args = []; return { bind(...values) { args = values; return this; }, async first() { return raw.prepare(sql).get(...args) || null; }, async all() { return { results: raw.prepare(sql).all(...args) }; }, async run() { return raw.prepare(sql).run(...args); } }; } } };
  const origin = 'https://securebydesigninc.com';
  function request(id) {
    return new Request(origin + '/api/reader-progress' + (id ? '/' + encodeURIComponent(id) : ''), {
      method: id ? 'PUT' : 'GET',
      headers: { origin, cookie: '__Host-sbd_reader=' + token, 'content-type': 'application/json' },
      ...(id ? { body: JSON.stringify({ status: 'completed' }) } : {}),
    });
  }
  for (const id of expectedIds) assert.equal((await readerProgressApi(request(id), env)).status, 200, id);
  const before = raw.prepare('SELECT * FROM reader_progress ORDER BY item_id').all();
  const body = await (await readerProgressApi(request(), env)).json();
  assert.equal(body.records.length, expectedIds.length);
  assert.equal(catalog.filterActiveProgressRecords(body.records).length, 0);
  assert.deepEqual(raw.prepare('SELECT * FROM reader_progress ORDER BY item_id').all(), before);
});
