import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { contentSecurityPolicy } from '../server/security-headers.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const frameSrc = contentSecurityPolicy.split('; ').find(part => part.startsWith('frame-src '));

test('only Radware’s map host is added to the frames the site may load', () => {
  assert.equal(frameSrc, "frame-src 'self' https://www.youtube-nocookie.com https://livethreatmap.radware.com");
  assert.doesNotMatch(contentSecurityPolicy, /\*\.radware\.com|checkpoint\.com/);
  // The map loads in a frame here; nobody else may frame this site.
  assert.match(contentSecurityPolicy, /frame-ancestors 'self'/);
});

test('the Threat Map page is in the navigation and the sitemap', () => {
  const links = JSON.parse(read('content/navigation.json'));
  assert.deepEqual(links.find(([href]) => href === '/threat-map'), ['/threat-map', 'Threat Map']);
  assert.ok(links.findIndex(([href]) => href === '/threat-map') > links.findIndex(([href]) => href === '/training'));
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/securebydesigninc\.com\/threat-map<\/loc>/);
  assert.match(read('scripts/prepare-sitemap.mjs'), /'\/threat-map'/);
});

test('the map loads from Radware only after the visitor asks, sandboxed, with a direct link', () => {
  const frame = read('app/threat-map/threat-map-frame.tsx');
  assert.match(frame, /useState\(false\)/, 'starts unloaded');
  assert.match(frame, /\{loaded\s*\n?\s*\? <iframe/, 'the iframe renders only once loaded');
  assert.match(frame, /sandbox="allow-scripts allow-same-origin"/);
  assert.doesNotMatch(frame, /allow-top-navigation|allow-popups|allow-forms/);
  assert.match(frame, /referrerPolicy="no-referrer"/);
  assert.match(frame, /href=\{threatMapUrl\} target="_blank" rel="noopener noreferrer"/);
  assert.match(frame, /const threatMapUrl = 'https:\/\/livethreatmap\.radware\.com\/'/);
});

test('the page credits Radware without implying a partnership, and privacy discloses it', () => {
  const page = read('app/threat-map/page.tsx');
  assert.match(page, /provided by Radware/);
  assert.match(page, /not affiliated with Radware/);
  const privacy = read('app/privacy/page.tsx');
  assert.match(privacy, /<strong>Radware<\/strong>/);
  assert.match(privacy, /only when you choose to open it/);
  assert.doesNotMatch(privacy + page, /Check Point/);
});
