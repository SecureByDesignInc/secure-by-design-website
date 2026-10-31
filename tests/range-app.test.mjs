import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

// Owner direction, 26 October 2026: the Cyber Range is published, open to everyone. 30 October 2026: it is one battle
// against the computer, and nothing else.
test('the Range page is published: route, menu, sitemap, Community shells and the app behind it',()=>{
 // The Range mounts in the site shell with no frame (owner direction, 27 October 2026: the same design and layout as
 // the other hubs, readable on phones), and the app's standalone page is a copy of the same core.
 assert.match(read('app/cyber-range/page.tsx'),/RangeMount/);
 assert.doesNotMatch(read('app/cyber-range/page.tsx'),/iframe|notFound\(\)/);
 assert.match(read('app/cyber-range/range-mount.tsx'),/mountRange\(root\.current\)/);
 assert.match(read('app/cyber-range/range.css'),/\.cr-page \{ background: #071521/,'the Training Hub ground');
 assert.match(read('app/cyber-range/range.css'),/@media \(max-width: 600px\)/,'phone rules');
 assert.doesNotMatch(read('app/cyber-range/range.css'),/100vh|rg-scan|clip-path: var\(--chamfer/,'no arena backdrop or fixed heights');
 const nav=JSON.parse(read('content/navigation.json'));
 const at=href=>nav.findIndex(([path])=>path===href);
 assert.deepEqual(nav[at('/cyber-range')],['/cyber-range','Cyber Range']);
 assert.equal(at('/cyber-range'),nav.length-1,'Cyber Range is the last menu item, before the My Account button (27 October 2026)');
 assert.match(read('public/sitemap.xml'),/securebydesigninc\.com\/cyber-range</);
 for(const name of ['careers','career-records','resource-preferences','community-contributions'])assert.match(read(`server/career-pages/${name}.html`),/href="\/cyber-range"[^>]*>Cyber Range<\/a>/,name);
 for(const file of ['index.html','range.css','battle.css','range-core.js','avatars.js'])assert.ok(fs.existsSync('public/range-app/'+file),file);
 assert.match(read('public/range-app/index.html'),/\/range-app\/battle\.css/);
 assert.match(read('app/cyber-range/page.tsx'),/import '\.\/battle\.css'/);
 // The page's policy is script-src 'self', so the start script is a file: an inline one never runs (31 October 2026).
 assert.match(read('public/range-app/index.html'),/<script type="module" src="\/range-app\/start\.js"><\/script>/);
 assert.doesNotMatch(read('public/range-app/index.html'),/<script(?![^>]*\bsrc=)[^>]*>/,'no inline script on /range-app/');
 assert.match(read('public/range-app/start.js'),/mountRange\(document\.getElementById\('range'\), \{ standalone: true \}\)/);
 assert.match(read('public/_headers'),/\/range-app\/\*\n  Content-Security-Policy: default-src 'self'; script-src 'self' https:\/\/static\.cloudflareinsights\.com;/);
 // The app's WebView revalidates the Range's files, so an update is never stuck behind a cached copy.
 assert.match(read('public/_headers'),/\/range-app\/\*\n  Content-Security-Policy: [^\n]+\n  Cache-Control: no-cache\n/);
});

test('the page is the battle alone, a copy of one core, and never bundles answers',()=>{
 for(const name of ['range-core.js','avatars.js','range.css','battle.css'])assert.equal(read('public/range-app/'+name),read('app/cyber-range/'+name),name+': run node scripts/prepare-range.mjs');
 assert.ok(!fs.existsSync('lib/range/engine.mjs')&&!fs.existsSync('app/cyber-range/engine.mjs')&&!fs.existsSync('public/range-app/engine.mjs'),'the duel engine is gone');
 const app=read('app/cyber-range/range-core.js');
 assert.doesNotMatch(app,/questions\.json/,'the page asks the API for questions');
 assert.match(app,/\/battle/);assert.match(app,/\/answer/);assert.match(app,/\/me/);
 // One battle: no tabs, checkpoints, stacks, decks, ladder, daily encounter or operator picker.
 assert.doesNotMatch(app,/cr-tabs|data-view|checkpoint|sparring|ladder|deck|daily|data-act="(base|glow|mark)"|<input/i);
 for(const word of ['Round','Forfeit','Play again'])assert.ok(app.includes(word),word);
 // 31 October 2026: straight into a question, no setup screen or difficulty choice; the clock waits until it's in view.
 assert.doesNotMatch(app,/data-act="level"|Change difficulty|Start battle|Start the round|renderSetup/);
 assert.match(app,/start\(true\)/);assert.match(app,/new IntersectionObserver/);
 // The homepage taster (31 October 2026): one round from the same core, then the way to the full battle.
 assert.match(app,/taster = false/);assert.match(app,/qs = qs\.slice\(0, 1\)/);
 for(const word of ['Try one round.','Play the full battle','Try another round'])assert.ok(app.includes(word),word);
 // A visitor's random operator and callsign stay in this browser; a signed-in learner's come from the account.
 assert.match(app,/localStorage/);assert.doesNotMatch(app,/sessionStorage/);
 // BASES and MARKS are maps of drawing functions, not lists (a returning visitor's saved operator is checked against them).
 assert.doesNotMatch(app,/(BASES|MARKS)\.includes|pickOne\((BASES|MARKS)\)/);
 for(const sheet of ['idle','attack','hit','down','victory','command'])assert.ok(fs.existsSync(`public/range-app/sprites/ttl_zero/${sheet}.webp`),sheet);
 assert.match(read('server/index.js'),/\/api\\\/range/);
 assert.match(read('server/account-deletion.js'),/range_operators/);
 assert.match(read('scripts/prepare-content.mjs'),/prepare-range\.mjs/);
});

test('button text colors are not flattened by the Range reset',()=>{
 const css=read('app/cyber-range/range.css');
 assert.doesNotMatch(css,/\.cr-page button[^{]*\{[^}]*color:\s*inherit/);
 assert.match(css,/\.cr-page :where\(button, input\) \{ color: inherit; \}/);
});

test('no portfolio, training gate or vendor model reaches the Range copy',()=>{
 for(const file of ['app/cyber-range/range-core.js','app/cyber-range/page.tsx','content/range/systems.json','content/range/residents.json']){
  const text=read(file);
  assert.doesNotMatch(text.replace(/^\s*\/\/.*$/gm,''),/portfolio|training progress/i,file);
  assert.doesNotMatch(text,/complete the course|finish the course|requires? course/i,file);
  assert.doesNotMatch(text,/Cisco|Juniper|Catalyst|Dell|Lenovo/i,file);
 }
 const residents=JSON.parse(read('content/range/residents.json')).residents;
 assert.deepEqual(residents.map(r=>r.id),['fsmo','ttl_zero','root_ca','pcap','baseline','signoff']);
});
