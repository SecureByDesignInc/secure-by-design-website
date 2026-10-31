import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { contentSecurityPolicy } from '../server/security-headers.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the homepage: hero, the Cyber Range taster, then the community panel and nothing else', () => {
  // Owner's requests: 17 October 2026, the community panel is the only section after the one before it; 31 October 2026,
  // the Cyber Range's one-round taster follows the hero and the Live Threat Map is gone.
  const home = read('app/template-home.tsx');
  const order = ['sbd-hero-title', '<HomeRangeTaster/>', '<HomeCommunityPanel/>'].map(marker => home.indexOf(marker));
  assert.ok(order.every(index => index >= 0), 'every homepage section is present');
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(home.indexOf('<HomeCommunityPanel/>') > home.lastIndexOf('</section>'), 'the panel is the last homepage section');
  assert.equal((home.match(/<h1/g) || []).length, 1, 'the hero keeps the homepage’s only main heading');
  assert.match(read('app/home-range-taster.tsx'), /mountRange\(root\.current, \{ taster: true \}\)/);
  const page = read('app/page.tsx');
  assert.ok(page.indexOf("'./template-home.css'") < page.indexOf("'./cyber-range/range.css'"), 'the Range’s styles load after the homepage’s');
  assert.match(page, /'\.\/home-community-panel\.css'/);
});

test('the Live Threat Map is gone from the site: no page, card, Radware frame or privacy entry', () => {
  // Owner's request, 31 October 2026: remove the Threat Map entirely.
  for (const file of ['app/threat-map/page.tsx', 'app/threat-map/threat-map-frame.tsx', 'app/home-threat-map-card.tsx', 'app/radware-sales-cover.tsx']) assert.ok(!existsSync(new URL(`../${file}`, import.meta.url)), file);
  const frameSrc = contentSecurityPolicy.split('; ').find(part => part.startsWith('frame-src '));
  assert.equal(frameSrc, "frame-src 'self' https://www.youtube-nocookie.com");
  for (const file of ['app/template-home.tsx', 'app/page.tsx', 'app/privacy/page.tsx', 'app/template-shared.css', 'public/career-shell.css', 'public/sitemap.xml', 'scripts/prepare-sitemap.mjs', 'scripts/browser-check.mjs', 'content/navigation.json'])
    assert.doesNotMatch(read(file), /radware|threat-map|ThreatMap|sbd-sales-cover/i, file);
  // Old links land on the homepage.
  assert.match(read('server/index.js'), /if\(path==='\/threat-map'\|\|path==='\/threat-map\/'\)return new URL\('\/',url\)/);
});
