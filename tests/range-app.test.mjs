import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

// Owner direction, 26 October 2026: the Cyber Range is published, open to everyone. 30 October 2026: it is one battle
// against the computer, and nothing else.
test('the Cyber Range section is removed for now; its taster stays on the homepage and the app page keeps working',()=>{
 // Owner's request, 31 October 2026: no /cyber-range page (it redirects home), no menu item, no sitemap entry, no shell link.
 assert.ok(!fs.existsSync('app/cyber-range/page.tsx')&&!fs.existsSync('app/cyber-range/range-mount.tsx'));
 assert.match(read('server/index.js'),/if\(path==='\/cyber-range'\|\|path==='\/cyber-range\/'\)return new URL\('\/',url\)/);
 assert.ok(!JSON.parse(read('content/navigation.json')).some(([path])=>path==='/cyber-range'));
 assert.doesNotMatch(read('public/sitemap.xml'),/cyber-range/);
 for(const name of ['careers','career-records','resource-preferences','community-contributions'])assert.doesNotMatch(read(`server/career-pages/${name}.html`),/href="\/cyber-range"/,name);
 assert.match(read('app/cyber-range/range.css'),/\.cr-page \{ background: #071521/);
 // /range-app/ stays so app builds from before the change keep working.
 for(const file of ['index.html','range.css','battle.css','range-core.js','avatars.js'])assert.ok(fs.existsSync('public/range-app/'+file),file);
 assert.match(read('public/range-app/index.html'),/<script type="module" src="\/range-app\/start\.js"><\/script>/);
 assert.doesNotMatch(read('public/range-app/index.html'),/<script(?![^>]*\bsrc=)[^>]*>/,'no inline script on /range-app/');
 assert.match(read('public/_headers'),/\/range-app\/\*\n  Content-Security-Policy: default-src 'self'; script-src 'self' https:\/\/static\.cloudflareinsights\.com;/);
 // The taster has nowhere to send people now: it ends with Try another round.
 assert.doesNotMatch(read('app/cyber-range/range-core.js'),/siteLink\('\/cyber-range'/);
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
 for(const word of ['Try one round.','Try another round'])assert.ok(app.includes(word),word);
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
 for(const file of ['app/cyber-range/range-core.js','content/range/systems.json','content/range/residents.json']){
  const text=read(file);
  assert.doesNotMatch(text.replace(/^\s*\/\/.*$/gm,''),/portfolio|training progress/i,file);
  assert.doesNotMatch(text,/complete the course|finish the course|requires? course/i,file);
  assert.doesNotMatch(text,/Cisco|Juniper|Catalyst|Dell|Lenovo/i,file);
 }
 const residents=JSON.parse(read('content/range/residents.json')).residents;
 assert.deepEqual(residents.map(r=>r.id),['fsmo','ttl_zero','root_ca','pcap','baseline','signoff']);
});
