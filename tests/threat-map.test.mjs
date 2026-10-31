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

test('the Threat Map has its own page again, in the sitemap, and the homepage links to it', () => {
  // Owner's request (15 October 2026): the Threat Map moved onto the homepage. 31 October 2026: it moved back to its own
  // page at /threat-map, and the Cyber Range taster took its homepage place, with a card linking to the map.
  const links = JSON.parse(read('content/navigation.json'));
  assert.ok(!links.some(([href]) => href === '/threat-map'), 'not in the menu');
  assert.match(read('app/threat-map/page.tsx'), /<ThreatMapSection \/>/);
  assert.match(read('app/threat-map/page.tsx'), /import '\.\/threat-map\.css'/);
  assert.match(read('app/threat-map/threat-map-section.tsx'), /<h1 id="threat-map-title"/);
  assert.doesNotMatch(read('server/index.js'), /path==='\/threat-map'/, 'no redirect to the homepage');
  assert.match(read('public/sitemap.xml'), /securebydesigninc\.com\/threat-map</);
  assert.match(read('scripts/prepare-sitemap.mjs'), /'\/threat-map'/);
  assert.match(read('app/home-threat-map-card.tsx'), /href="\/threat-map"/);
  assert.doesNotMatch(read('app/home-threat-map-card.tsx') + read('app/template-home.tsx'), /ThreatMapFrame|radware\.com/i, 'nothing from Radware loads on the homepage');
});

test('the map loads automatically, sandboxed, over a placeholder, with a direct link', () => {
  const frame = read('app/threat-map/threat-map-frame.tsx');
  assert.match(frame, /\{mounted && <iframe/, 'the frame is added by itself, with no button to press');
  assert.match(frame, /new IntersectionObserver[\s\S]*rootMargin: '600px 0px'/, 'it loads as the map nears the screen');
  assert.doesNotMatch(frame, /Load the live map/);
  assert.match(frame, /onLoad=\{\(\) => setReady\(true\)\}/, 'the placeholder stays until Radware has loaded');
  assert.match(frame, /Loading the live map/);
  assert.match(frame, /sandbox="allow-scripts allow-same-origin"/);
  assert.doesNotMatch(frame, /allow-top-navigation|allow-popups|allow-forms/);
  assert.match(frame, /referrerPolicy="no-referrer"/);
  assert.match(frame, /href=\{threatMapUrl\} target="_blank" rel="noopener noreferrer"/);
  assert.match(frame, /const threatMapUrl = 'https:\/\/livethreatmap\.radware\.com\/'/);
});

test('the homepage credits Radware without implying a partnership, and privacy discloses it', () => {
  // The credit sits just under "Live · Radware" in the map's toolbar (owner's request, 15 October 2026).
  const section = read('app/threat-map/threat-map-frame.tsx');
  assert.match(section, /<div className="tm-source">\s*<span className="tm-live">[\s\S]*?Live · Radware<\/span>\s*<p className="tm-credit">The live map is provided by Radware\. Secure By Design is not affiliated with Radware\.<\/p>/);
  assert.doesNotMatch(read('app/threat-map/threat-map-section.tsx'), /tm-credit/);
  const privacy = read('app/privacy/page.tsx');
  assert.match(privacy, /<strong>Radware<\/strong>/);
  assert.match(privacy, /loads from Radware when you open the Live Threat Map page/);
  assert.doesNotMatch(privacy, /live threat window/);
  assert.doesNotMatch(privacy + section, /Check Point/);
});

test('the browser check ignores only Radware’s own frame, not this site’s errors', () => {
  const check = read('scripts/browser-check.mjs');
  assert.match(check, /const thirdPartyFrame = frame =>/);
  assert.match(check, /livethreatmap\\.radware\\.com/);
});

test('the homepage: hero, the Cyber Range taster, the Threat Map card, then the community panel and nothing else', () => {
  // Owner's request (15 October 2026): the Threat Map replaced "A note from Secure By Design" and "Start building
  // your network"; the live threat window was removed so the map shows once.
  // Owner's request (17 October 2026): the community panel is the only section after the map; "More ways to
  // figure it out", "Choose your next step" and "There's always more to understand" were removed.
  const home = read('app/template-home.tsx');
  // Owner's request (31 October 2026): the Cyber Range's one-round taster takes the map's place, then a card to /threat-map.
  const order = ['sbd-hero-title', '<HomeRangeTaster/>', '<HomeThreatMapCard/>', '<HomeCommunityPanel/>'].map(marker => home.indexOf(marker));
  assert.ok(order.every(index => index >= 0), 'every homepage section is present');
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.doesNotMatch(home, /HomeThreatWindow|sbd-creator-note|sbd-start|Start building/);
  assert.doesNotMatch(home, /sbd-future|sbd-next-step|sbd-about/);
  assert.ok(home.indexOf('<HomeCommunityPanel/>') > home.lastIndexOf('</section>'), 'the panel is the last homepage section');
  const panel = read('app/home-community-panel.tsx');
  assert.match(panel, /useState<'once' \| 'monthly'>\('once'\)/, 'Just once is the default');
  assert.ok(panel.indexOf('>Just once<') < panel.indexOf('>Monthly<'), 'Just once comes before Monthly');
  assert.match(read('app/page.tsx'), /'\.\/home-community-panel\.css'/);
  assert.throws(() => read('app/home-threat-window.tsx'));
  assert.doesNotMatch(read('app/template-home.css'), /sbd-monitor|sbd-watch|sbd-creator|sbd-start/);
  assert.match(read('app/home-range-taster.tsx'), /mountRange\(root\.current, \{ taster: true \}\)/);
  const section = read('app/threat-map/threat-map-section.tsx');
  assert.match(section, /id="threat-map"/);
  assert.match(section, /<ThreatMapFrame \/>/);
  assert.match(section, /HOW TO READ IT/);
  // On its own page the map's title is the page's main heading; on the homepage the hero keeps the only one.
  assert.match(section, /<h1 id="threat-map-title"/);
  assert.equal((home.match(/<h1/g) || []).length, 1, 'the hero keeps the homepage’s only main heading');
  assert.doesNotMatch(read('app/home-threat-map-card.tsx'), /<h1/);
  // The Range's styles load after the homepage's so the taster keeps its own type.
  const page = read('app/page.tsx');
  assert.ok(page.indexOf("'./template-home.css'") < page.indexOf("'./cyber-range/range.css'"));
  assert.doesNotMatch(page, /threat-map\.css/, 'the map’s styles load on its own page only');
});



test('Radware’s “Contact sales” button is blurred', () => {
  const cover = read('app/radware-sales-cover.tsx');
  assert.match(cover, /export const RADWARE_W = 1240;/);
  assert.match(cover, /export const RADWARE_H = 800;/);
  assert.match(cover, /export const SALES_BOX = \{ left: \d+, top: \d+, width: \d+, height: \d+ \};/);
  const frame = read('app/threat-map/threat-map-frame.tsx');
  assert.match(frame, /<div className="tm-canvas"[\s\S]*<iframe[\s\S]*<RadwareSalesCover show=\{ready\} \/>[\s\S]*<\/div>/, 'the cover sits in the same scaled box as the map');
  assert.match(frame, /Math\.min\(width \/ RADWARE_W, height \/ visibleH\)/);
  assert.match(read('app/threat-map/threat-map.css'), /\.tm-canvas \{[\s\S]*width: 1240px;[\s\S]*height: 800px;/);
  const css = read('app/template-shared.css');
  assert.match(css, /\.sbd-sales-cover\{[^}]*backdrop-filter:blur\(/);
  assert.match(css, /\.sbd-sales-cover\.is-shown\{[^}]*pointer-events:auto/, 'the cover catches clicks meant for the button');
  // Owner's request (15 October 2026): the page doesn't mention the blur or call the map unchanged.
  assert.doesNotMatch(read('app/threat-map/threat-map-section.tsx') + read('app/threat-map/threat-map-frame.tsx'), /blurred|unchanged/i);
});

test('Radware’s cookie notice never shows: the map is cut off above it', () => {
  // Owner's request (17 October 2026). The notice is a bar across the bottom of Radware's 1240 × 800 page.
  const cover = read('app/radware-sales-cover.tsx');
  const visible = Number((cover.match(/export const RADWARE_VISIBLE_H = (\d+);/) || [])[1]);
  assert.ok(visible > 600 && visible <= 652, 'the visible map stops above the notice, which starts near y = 656');
  // 27 October 2026: on an iPhone, text autosizing made the notice taller; it started near y = 552.
  const touch = Number((cover.match(/export const RADWARE_VISIBLE_H_TOUCH = (\d+);/) || [])[1]);
  assert.ok(touch >= 480 && touch <= 530, 'touch screens stop well above the taller notice');
  assert.match(cover, /export const TOUCH_QUERY = '\(pointer: coarse\)';/);
  const frame = read('app/threat-map/threat-map-frame.tsx');
  assert.match(frame, /clipPath: `inset\(0 0 \$\{RADWARE_H - visibleH\}px 0\)`/, 'nothing below the line can be seen or clicked');
  assert.match(frame, /setVisibleH\(touch\.matches \? RADWARE_VISIBLE_H_TOUCH : RADWARE_VISIBLE_H\)/);
  assert.match(frame, /useState\(RADWARE_VISIBLE_H\)/);
  assert.ok(frame.indexOf('window.matchMedia?.(TOUCH_QUERY)') < frame.indexOf('new IntersectionObserver'), 'the cut-off is chosen before the frame is added');
  const css = read('app/threat-map/threat-map.css');
  assert.match(css, new RegExp(`\\.tm-stage \\{[\\s\\S]*aspect-ratio: 1240 \\/ ${visible};`));
  assert.match(css, new RegExp(`@media \\(pointer: coarse\\) \\{\\s*\\.tm-stage \\{\\s*aspect-ratio: 1240 \\/ ${touch};`), 'the stage matches the touch cut-off');
});
