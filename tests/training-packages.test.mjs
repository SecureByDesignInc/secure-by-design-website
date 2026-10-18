// Owner request, 18 October 2026: every catalog tile's training-material download is its Word workbook only (no ZIP,
// PDF, offline guide, START-HERE, checklist file or command sheet). The guides have no record export, import or
// readable-notes controls, because a signed-in learner's notes, checks and answers save to the account; and the guide
// header links stay on the site in the same tab, without a Training materials button. Also kept from 9 October 2026:
// no share controls in the training and no specific Windows release numbers.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(new URL('../' + path, import.meta.url));
const library = JSON.parse(read('content/videos.json'));
const resources = JSON.parse(read('content/training-resources.json'));
const publicFile = path => new URL('../public' + path, import.meta.url);
const entries = [...library.episodes, ...library.courses];
const guidePage = entry => entry.training.guide.replace(/#.*$/, '').replace(/\/index\.html$/, '').replace(/\/$/, '') + '/index.html';

test('every tile with material offers exactly one download: its Word workbook', () => {
  for (const entry of entries) {
    const t = entry.training;
    for (const key of ['pdf', 'package', 'checklist']) assert.equal(t[key], undefined, `${entry.id} has no ${key}`);
    if (entry.kind === 'coming-soon') { assert.equal(t.word, undefined, entry.id); continue; }
    assert.match(t.word, /\/SecureByDesign-[A-Za-z0-9-]+-Workbook\.docx$/, entry.id);
    assert.ok(existsSync(publicFile(t.word)), t.word);
    assert.ok(Number.isInteger(t.pages) && t.pages > 0, entry.id);
  }
  // My Account and the app list each tile's download under its -package resource ID, now the Word workbook.
  for (const item of resources.filter(r => !r.retired && r.id.endsWith('-package'))) assert.match(item.url, /-Workbook\.docx$/, item.id);
});

test('no ZIPs, workbook PDFs or package extras are published with the training', () => {
  const retired = name => /\.zip$|-Workbook\.pdf$|^START-HERE\.txt$|^Verification-Commands\.txt$|^configuration-checklist\.md$|^package-manifest\.json$/.test(name);
  for (const root of ['training', 'grc-rmf-training']) {
    for (const folder of readdirSync(new URL(`../public/${root}/`, import.meta.url), { withFileTypes: true }).filter(d => d.isDirectory())) {
      for (const name of readdirSync(new URL(`../public/${root}/${folder.name}/`, import.meta.url))) assert.ok(!retired(name), `public/${root}/${folder.name}/${name}`);
    }
  }
});

test('guides keep notes in the account, with no export, import or readable-notes controls', () => {
  const pages = entries.filter(entry => entry.kind !== 'coming-soon').map(guidePage);
  for (const path of pages) {
    const page = readFileSync(publicFile(path), 'utf8');
    for (const control of ['export-json', 'export-text', 'import-record', 'import-file', 'export-side', 'Readable notes', 'Export my record', 'Import record', 'Training materials</a>', 'target="_blank" rel="noopener">Configuration Hub', 'evidence exports'])
      assert.ok(!page.includes(control), `${path} still has ${control}`);
    const downloads = [...page.matchAll(/<a [^>]*href="([^"]+)"[^>]*\bdownload\b/g)].map(match => match[1]);
    assert.ok(downloads.length > 0 && downloads.every(href => href.endsWith('-Workbook.docx')), `${path} offers only the Word workbook`);
    assert.ok(page.includes('/training/account-progress.js'), `${path} loads the account sync`);
    assert.match(page, /<nav class="topnav"[^>]*>.*<a class="btn" href="\/">Home<\/a><a class="btn" href="\/my-progress">My Account<\/a>/s, `${path} header links stay on the site`);
  }
  // The lesson guides hand their state to the account sync.
  for (const path of ['scripts/course-guide/renderer.js', 'public/training/dc01-dc02/index.html']) {
    const text = read(path).toString();
    assert.ok(text.includes('window.SBD_GUIDE={id:lesson.id') && text.includes("new Event('sbd-guide-saved')"), path);
  }
  const sync = read('public/training/account-progress.js').toString();
  for (const piece of ["'/api/reader-progress/guide/'", 'sbd-guide-saved', 'pagehide']) assert.ok(sync.includes(piece), piece);
});

test('the training has no share controls', () => {
  assert.equal(existsSync(new URL('../app/videos/training-share.tsx', import.meta.url)), false);
  for (const file of ['companion.tsx', 'video-hub.tsx', 'course-experience.tsx', 'episode-experience.tsx']) {
    assert.doesNotMatch(read(`app/videos/${file}`).toString(), /TrainingShare|training-share|Share2/, file);
  }
  for (const entry of entries.filter(item => item.kind !== 'coming-soon')) {
    assert.doesNotMatch(readFileSync(publicFile(guidePage(entry)), 'utf8'), /data-learning-share|guide-share|learning-share/, entry.id);
  }
});

test('training content names Windows releases without version numbers', () => {
  const release = /Windows Server 20\d\d|Server 20\d\d|Windows 1[01]\b|\b2[0-9]H[12]\b/i;
  // Microsoft's own page titles and addresses keep their wording.
  const strings = (value, key = '') => {
    if (key === 'url' || (key === 'title' && typeof value === 'string' && value.startsWith('Microsoft · '))) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(item => strings(item));
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([name, item]) => strings(item, name));
    return [];
  };
  const sources = {
    'content/configuration-courses.json': JSON.parse(read('content/configuration-courses.json')),
    'content/videos.json': library,
    'content/training-resources.json': JSON.parse(read('content/training-resources.json')).filter(item => !item.retired),
    'public/training/dc01-dc02/lesson.json': JSON.parse(read('public/training/dc01-dc02/lesson.json')),
  };
  for (const [name, data] of Object.entries(sources)) {
    for (const text of strings(data)) assert.doesNotMatch(text, release, `${name}: ${text.slice(0, 80)}`);
  }
  const files = [
    'public/training/dc01-dc02/notices.html',
    'public/grc-rmf-training/rmf/catalog-data.js', 'public/grc-rmf-training/rmf/learning-data.js', 'public/grc-rmf-training/rmf/network-data.js',
    'public/grc-rmf-training/rmf/index.html', 'public/grc-rmf-training/rmf/templates-data.js',
    ...readdirSync(new URL('../public/inside-network-model/', import.meta.url)).filter(name => /\.(js|html|csv|md)$/.test(name)).map(name => `public/inside-network-model/${name}`),
  ];
  for (const file of files) assert.doesNotMatch(read(file).toString(), release, file);
  const guide = read('public/training/dc01-dc02/index.html').toString();
  assert.doesNotMatch(guide.slice(0, guide.indexOf('<script type="importmap">')), release, '1.1 guide');
});
