// Owner request, 9 October 2026: one download per Training Library tile, no share controls in the
// training, and no specific Windows release numbers. The ZIPs are built by
// scripts/prepare-training-packages.py; these checks fail when one no longer matches its files.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { crc32 } from 'node:zlib';

const read = path => readFileSync(new URL('../' + path, import.meta.url));
const library = JSON.parse(read('content/videos.json'));
const publicFile = path => new URL('../public' + path, import.meta.url);

// Reads a ZIP's central directory: each member's name, CRC-32, and uncompressed size.
function zipEntries(buffer) {
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0, 'ZIP end-of-central-directory record');
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const entries = [];
  for (let index = 0; index < count; index++) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50, 'central directory entry');
    const nameLength = buffer.readUInt16LE(offset + 28);
    entries.push({
      crc: buffer.readUInt32LE(offset + 16),
      size: buffer.readUInt32LE(offset + 24),
      name: buffer.toString('utf8', offset + 46, offset + 46 + nameLength),
    });
    offset += 46 + nameLength + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
  return entries;
}

function assertMatchesFolder(zipPath, folder, names) {
  const entries = zipEntries(readFileSync(publicFile(zipPath)));
  assert.deepEqual(entries.map(entry => entry.name), names, `${zipPath} members`);
  for (const entry of entries) {
    const data = readFileSync(publicFile(`${folder}/${entry.name}`));
    assert.equal(entry.size, data.length, `${zipPath}: ${entry.name} size; run python3 scripts/prepare-training-packages.py`);
    assert.equal(entry.crc, crc32(data), `${zipPath}: ${entry.name} content; run python3 scripts/prepare-training-packages.py`);
  }
}

test('every Training Library tile has exactly one download', () => {
  for (const episode of library.episodes) {
    assert.match(episode.training.package, /\.zip$/);
    assert.ok(existsSync(publicFile(episode.training.package)), episode.training.package);
  }
  for (const course of library.courses) {
    if (course.kind === 'configuration') {
      assert.equal(course.training.package, `/training/${course.id}/SecureByDesign-${course.id}-Learning-Package.zip`);
      assert.ok(existsSync(publicFile(course.training.package)), course.training.package);
    } else {
      // The authorization tiles share one Word catalog; it is their only download.
      assert.equal(course.training.package, undefined, course.id);
      assert.ok(existsSync(publicFile(course.training.word)), course.training.word);
    }
  }
});

test('each configuration-course ZIP holds the current workbook, checklist, and command sheet', () => {
  for (const course of library.courses.filter(item => item.kind === 'configuration')) {
    const folder = `/training/${course.id}`;
    const names = ['START-HERE.txt', `SecureByDesign-${course.id}-Workbook.pdf`, `SecureByDesign-${course.id}-Workbook.docx`, 'configuration-checklist.md', 'Verification-Commands.txt'];
    assertMatchesFolder(course.training.package, folder, names);
    const start = readFileSync(publicFile(`${folder}/START-HERE.txt`), 'utf8');
    assert.match(start, new RegExp(`Materials edition ${course.training.materialsEdition.replace('.', '\\.')} \\| Updated ${course.training.updated}`));
    assert.match(start, new RegExp(`Companion workbook, ${course.training.pages} pages`));
  }
});

test('the course 1.1 learning package matches its manifest and edition', () => {
  const episode = library.episodes.find(item => item.id === 'dc01-dc02');
  const manifest = JSON.parse(readFileSync(publicFile('/training/dc01-dc02/package-manifest.json'), 'utf8'));
  assert.equal(manifest.materialsEdition, episode.training.materialsEdition);
  assert.equal(manifest.components.workbook.pages, episode.training.pages);
  for (const file of manifest.files) {
    const data = readFileSync(publicFile(`/training/dc01-dc02/${file.name}`));
    assert.equal(file.bytes, data.length, file.name);
    assert.equal(file.sha256, createHash('sha256').update(data).digest('hex'), file.name);
  }
  assertMatchesFolder(episode.training.package, '/training/dc01-dc02', [...manifest.files.map(file => file.name), 'package-manifest.json']);
});

test('the training has no share controls, and the 1.1 guide offers the same single download', () => {
  assert.equal(existsSync(new URL('../app/videos/training-share.tsx', import.meta.url)), false);
  for (const file of ['companion.tsx', 'video-hub.tsx', 'configuration-guide.tsx', 'course-experience.tsx', 'episode-experience.tsx']) {
    assert.doesNotMatch(read(`app/videos/${file}`).toString(), /TrainingShare|training-share|Share2/, file);
  }
  for (const path of ['/training/dc01-dc02/index.html', '/training/rmf/index.html']) {
    assert.doesNotMatch(readFileSync(publicFile(path), 'utf8'), /data-learning-share|guide-share|learning-share/, path);
  }
  const guide = readFileSync(publicFile('/training/dc01-dc02/index.html'), 'utf8');
  const downloads = [...guide.matchAll(/<a [^>]*href="([^"]+)"[^>]*\bdownload\b/g)].map(match => match[1]);
  const packageName = library.episodes[0].training.package.split('/').pop();
  assert.ok(downloads.length > 0);
  assert.deepEqual([...new Set(downloads)], [packageName]);
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
    'public/training/dc01-dc02/START-HERE.txt', 'public/training/dc01-dc02/notices.html',
    'public/training/rmf/learning-data.js', 'public/training/rmf/index.html',
    ...readdirSync(new URL('../public/inside-network-model/', import.meta.url)).filter(name => /\.(js|html|csv|md)$/.test(name)).map(name => `public/inside-network-model/${name}`),
  ];
  for (const file of files) assert.doesNotMatch(read(file).toString(), release, file);
  const guide = read('public/training/dc01-dc02/index.html').toString();
  assert.doesNotMatch(guide.slice(0, guide.indexOf('<script type="importmap">')), release, '1.1 guide');
});
