import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

// Owner direction, 26 October 2026: the Cyber Range returns as the stack-duel arena, open to everyone.
test('the Range page is published: route, menu, sitemap, Community shells and the app behind it',()=>{
 assert.match(read('app/cyber-range/page.tsx'),/RangeFrame/);
 assert.doesNotMatch(read('app/cyber-range/page.tsx'),/notFound\(\)/);
 assert.match(read('app/cyber-range/range-frame.tsx'),/src=\{src\}/);
 const nav=JSON.parse(read('content/navigation.json'));
 const at=href=>nav.findIndex(([path])=>path===href);
 assert.deepEqual(nav[at('/cyber-range')],['/cyber-range','Cyber Range']);
 assert.equal(at('/cyber-range'),at('/my-progress')-1,'Cyber Range sits before My Account');
 assert.match(read('public/sitemap.xml'),/securebydesigninc\.com\/cyber-range</);
 for(const name of ['careers','career-records','resource-preferences','community-contributions'])assert.match(read(`server/career-pages/${name}.html`),/href="\/cyber-range"[^>]*>Cyber Range<\/a>/,name);
 for(const file of ['index.html','range.css','range.js','avatars.js','engine.mjs'])assert.ok(fs.existsSync('public/range-app/'+file),file);
 assert.match(read('public/_headers'),/\/range-app\/\*\n  Content-Security-Policy: default-src 'self'; script-src 'self' https:\/\/static\.cloudflareinsights\.com;/);
});

test('the page runs the same engine the API scores by, and never bundles answers',()=>{
 assert.equal(read('public/range-app/engine.mjs'),read('lib/range/engine.mjs'),'run node scripts/prepare-range.mjs');
 const app=read('public/range-app/range.js');
 assert.doesNotMatch(app,/questions\.json/,'the page asks the API for questions');
 assert.match(app,/\/answer/);
 assert.match(app,/sessionStorage/,'a visitor\'s operator lasts for the visit');
 assert.doesNotMatch(app,/localStorage/);
 assert.match(app,/target="_top"/,'sign-in links leave the frame');
 assert.match(read('server/index.js'),/\/api\\\/range/);
 assert.match(read('server/account-deletion.js'),/range_operators/);
 assert.match(read('scripts/prepare-content.mjs'),/prepare-range\.mjs/);
});

test('no portfolio, training gate or vendor model reaches the Range copy',()=>{
 for(const file of ['public/range-app/range.js','app/cyber-range/page.tsx','content/range/systems.json','content/range/residents.json']){
  const text=read(file);
  // The route's intro says it once, to say the Range stays out of it; nothing else may mention one.
  if(file==='app/cyber-range/page.tsx')assert.match(text,/nothing you do here touches your training progress or goes into a portfolio/);
  else assert.doesNotMatch(text,/portfolio/i,file);
  assert.doesNotMatch(text,/complete the course|finish the course|requires? course/i,file);
  assert.doesNotMatch(text,/Cisco|Juniper|Catalyst|Dell|Lenovo/i,file);
 }
 const residents=JSON.parse(read('content/range/residents.json')).residents;
 assert.deepEqual(residents.map(r=>r.id),['fsmo','ttl_zero','root_ca','pcap','baseline','signoff']);
});
