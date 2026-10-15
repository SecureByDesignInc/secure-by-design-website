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

test('the map loads automatically, sandboxed, over a placeholder, with a direct link', () => {
  const frame = read('app/threat-map/threat-map-frame.tsx');
  assert.match(frame, /\{mounted && <iframe/, 'the frame is added as soon as the page runs, with no button to press');
  assert.doesNotMatch(frame, /Load the live map/);
  assert.match(frame, /onLoad=\{\(\) => setReady\(true\)\}/, 'the placeholder stays until Radware has loaded');
  assert.match(frame, /Loading the live map/);
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
  assert.match(privacy, /loads from Radware when you open the Threat Map page/);
  assert.doesNotMatch(privacy + page, /Check Point/);
});

test('the browser check ignores only Radware’s own frame, not this site’s errors', () => {
  const check = read('scripts/browser-check.mjs');
  assert.match(check, /const thirdPartyFrame = frame =>/);
  assert.match(check, /livethreatmap\\.radware\\.com/);
});

test('the homepage live window loads Radware only near view, on larger screens, as a non-interactive preview', () => {
  const window = read('app/home-threat-window.tsx');
  assert.match(window, /const mapUrl = 'https:\/\/livethreatmap\.radware\.com\/'/);
  assert.match(window, /\{live && near && scale > 0 && <iframe/, 'the frame waits until the monitor is near the viewport');
  assert.match(window, /prefers-reduced-motion: reduce/);
  assert.match(window, /max-width: 700px/);
  assert.match(window, /saveData/);
  assert.match(window, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(window, /referrerPolicy="no-referrer"/);
  assert.match(window, /\binert\b/, 'the preview takes no focus or clicks');
  assert.match(window, /href="\/threat-map"/);
  assert.match(window, /not affiliated with Radware/);
  const home = read('app/template-home.tsx');
  assert.ok(home.indexOf('sbd-creator-note') < home.indexOf('<HomeThreatWindow/>'), 'the note keeps its place right after Start building your network');
  assert.ok(home.indexOf('<HomeThreatWindow/>') < home.indexOf('sbd-future'), 'the window comes before More ways to figure it out');
  assert.match(read('app/privacy/page.tsx'), /live threat window on the homepage/);
});
