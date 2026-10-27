import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

// Owner direction, 26 October 2026: the Cyber Range returns as the stack-duel arena, open to everyone.
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
 for(const file of ['index.html','range.css','range-core.js','avatars.js','engine.mjs'])assert.ok(fs.existsSync('public/range-app/'+file),file);
 assert.match(read('public/range-app/index.html'),/mountRange\(document\.getElementById\('range'\), \{ standalone: true \}\)/);
 assert.match(read('public/_headers'),/\/range-app\/\*\n  Content-Security-Policy: default-src 'self'; script-src 'self' https:\/\/static\.cloudflareinsights\.com;/);
});

test('the page runs the same engine the API scores by, and never bundles answers',()=>{
 for(const [copy,source] of [['public/range-app/engine.mjs','lib/range/engine.mjs'],['app/cyber-range/engine.mjs','lib/range/engine.mjs'],['public/range-app/range-core.js','app/cyber-range/range-core.js'],['public/range-app/avatars.js','app/cyber-range/avatars.js'],['public/range-app/range.css','app/cyber-range/range.css']])assert.equal(read(copy),read(source),copy+': run node scripts/prepare-range.mjs');
 const app=read('app/cyber-range/range-core.js');
 assert.doesNotMatch(app,/questions\.json/,'the page asks the API for questions');
 assert.match(app,/\/answer/);
 assert.match(app,/sessionStorage/,'a visitor\'s operator lasts for the visit');
 assert.doesNotMatch(app,/localStorage/);
 assert.match(read('server/index.js'),/\/api\\\/range/);
 assert.match(read('server/account-deletion.js'),/range_operators/);
 assert.match(read('scripts/prepare-content.mjs'),/prepare-range\.mjs/);
});

test('no portfolio, training gate or vendor model reaches the Range copy',()=>{
 for(const file of ['app/cyber-range/range-core.js','app/cyber-range/page.tsx','content/range/systems.json','content/range/residents.json']){
  const text=read(file);
  // The route's intro says it once, to say the Range stays out of it; nothing else may mention one.
  if(file==='app/cyber-range/page.tsx')assert.match(text,/nothing here touches your training progress or goes into a portfolio/);
  else assert.doesNotMatch(text,/portfolio/i,file);
  assert.doesNotMatch(text,/complete the course|finish the course|requires? course/i,file);
  assert.doesNotMatch(text,/Cisco|Juniper|Catalyst|Dell|Lenovo/i,file);
 }
 const residents=JSON.parse(read('content/range/residents.json')).residents;
 assert.deepEqual(residents.map(r=>r.id),['fsmo','ttl_zero','root_ca','pcap','baseline','signoff']);
});
