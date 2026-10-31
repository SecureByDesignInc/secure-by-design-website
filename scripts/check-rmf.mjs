import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stages } from '../content/rmf.ts';
import { evidenceGuidePath, evidencePhases, retiredEvidenceAnchors } from '../content/rmf-evidence.ts';
import { progressCatalog } from '../content/progress-catalog.js';

const origin = process.env.RMF_TEST_ORIGIN || 'https://securebydesigninc.com';
const worker = process.env.RMF_TEST_ORIGIN ? null : (await import('../dist/server/index.js')).default;
const request = path => worker
  ? worker.fetch(new Request(origin + path), {}, {waitUntil(){}})
  : fetch(origin + path, {redirect:'manual', signal:AbortSignal.timeout(20000)});
const mainContent = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
const links = html => [...html.matchAll(/href="([^"\s]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
const plain = html => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const phaseSlugs = ['prepare','categorize','select','implement','assess','authorize','monitor'];
assert.deepEqual(stages.map(s=>s.slug), phaseSlugs);
assert.deepEqual(evidencePhases.map(s=>s.slug), phaseSlugs);
assert.equal(evidenceGuidePath, '/rmf-series');
assert.equal(evidencePhases[0].step, null);
assert.deepEqual(evidencePhases.slice(1).map(s=>s.step), [1,2,3,4,5,6]);
const articles = JSON.parse(readFileSync(new URL('../content/articles.json', import.meta.url), 'utf8'));
const technical = ['/blog', ...articles.map(a=>'/blog/'+a.slug)];
const paths = [...new Set(['/', '/blogs', '/videos', '/rmf-series', '/rmf-series/concepts/dns', ...technical])];
const pages = new Map();
for (const path of paths) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  const main = mainContent(await response.text());
  assert(main.includes('<h1'), path+': page content missing');
  assert(!main.includes('Find the source documents in'), path+': removed copy returned');
  assert(!links(main).some(h=>/^\/rmf-series\/(prepare|categorize|select|implement|assess|authorize|monitor|other-approaches|phases-and-evidence)(?:[\/#]|$)/.test(h)), path+': split resource link returned');
  if (technical.includes(path)) {
    assert(!links(main).some(h=>h.startsWith('/rmf-series')), path+': independent Technical Blog links into RMF');
    assert(!/Risk Management Framework|\bRMF\b/.test(main), path+': RMF teaching in Technical Blog');
  }
  pages.set(path, main);
}
const guide = pages.get('/rmf-series');
const ids = [...guide.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate guide IDs break section navigation');
assert.equal([...guide.matchAll(/<h1\b/g)].length, 1);
assert(!guide.includes('aria-label="RMF section"'), 'Separate RMF tabs returned');
assert(guide.includes('aria-label="Guide contents"'));
for (const id of ['lifecycle','compliance',...phaseSlugs,'authorization-package','maintaining-evidence','other-approaches']) assert(ids.includes(id), 'Missing section '+id);
const noAssumptions = /SBD Enterprise|150 staff|air.gapped|manual transfers|\bMLL\b|F-001|24-hour|72 hours|SBD-DC|\bVLAN\b|Active Directory|Group Policy|31 December 2026/i;
let preservedParagraphs=0;
for (const [index, stage] of stages.entries()) {
  const end = index < stages.length-1 ? guide.indexOf('id="'+stages[index+1].slug+'"') : guide.indexOf('id="authorization-package"');
  const section = guide.slice(guide.indexOf('id="'+stage.slug+'"'), end);
  const text = plain(section);
  const paragraphs = stage.sections.flatMap(s=>[s.heading,...s.paragraphs]);
  for (const content of [stage.question,stage.summary,stage.intro,stage.nist,...paragraphs,...stage.discussion,stage.handoff,...(stage.jsig?[stage.jsig.text]:[])]) assert(text.includes(content), stage.slug+': lost chapter content: '+content.slice(0,65));
  preservedParagraphs += stage.sections.reduce((count, s)=>count+s.paragraphs.length,0);
  const phase = evidencePhases[index];
  for (const content of [phase.purpose,...phase.outputs,phase.responsibility,phase.maintain,phase.application,phase.reference]) assert(text.includes(content), stage.slug+': lost evidence content: '+content.slice(0,65));
  for (const suffix of ['explanation','evidence','sap-application','talk-it-through','carry-forward','visual-title']) assert(ids.includes(stage.slug+'-'+suffix), stage.slug+': missing subsection '+suffix);
  const explanation = section.slice(section.indexOf('id="'+stage.slug+'-explanation"'), section.indexOf('id="'+stage.slug+'-evidence"'));
  assert(!noAssumptions.test(explanation), stage.slug+': example-network assumptions in general guidance');
  assert(section.includes('aria-label="'+stage.name+' reading progress"'), stage.slug+': progress control missing');
  const record=progressCatalog.find(item=>item.id==='rmf:'+stage.slug);
  assert.equal(record.href,'/rmf-series#'+stage.slug,'Existing progress ID/destination changed');
}
assert.equal([...guide.matchAll(/class="rmf-phase-visual /g)].length,7,'Phase diagram lost');
const sources=guide.match(/<section[^>]*id="compliance"[^>]*>([\s\S]*?)<\/section>/)?.[1] || '';
const approaches=guide.match(/<section[^>]*id="other-approaches"[^>]*>([\s\S]*?)<\/section>/)?.[1] || '';
assert.equal(links(sources).filter(h=>h.startsWith('http')).length,4);
assert.equal(links(approaches).filter(h=>h.startsWith('http')).length,9);
assert(!links(guide.replace(sources,'').replace(approaches,'')).some(h=>h.startsWith('http')), 'External sources outside the centralized reference sections');
for (const phrase of ['System Security Plan (SSP)','Security Assessment Report (SAR)','Plan of Action and Milestones (POA&M)','Security Controls Traceability Matrix','Risk Assessment Report','Security Assessment Plan','Make the record traceable.','Update related records together.','Preserve the history.','NIST SP 800-37 Revision 2','2016 JSIG','Revision 5']) assert(plain(guide).includes(phrase),'Lost guide content: '+phrase);
assert(!pages.get('/blogs').includes('Seven steps. Read in order'), 'Duplicate chapter reading path remains in the hub');
assert(pages.get('/blogs').includes('RMF Guide &amp; Evidence'));
assert(pages.get('/').includes('class="sbd-evidence-preview"'));
let checkedLinks=0;
for (const [path, main] of pages) {
  for (const href of links(main).filter(h=>h.startsWith('/rmf-series') || (path==='/rmf-series' && h.startsWith('#')))) {
    const target=new URL(href,origin+path);
    const destination=pages.get(target.pathname);
    assert(destination,path+': missing destination '+href);
    if(target.hash) assert(destination.includes('id="'+target.hash.slice(1)+'"'),path+': missing anchor '+href);
    checkedLinks++;
  }
}
const retiredRoutes=[
 ['/about','/#about'], ['/rmf-series/system','/rmf-series'], ['/rmf-series/phases-and-evidence','/rmf-series'],
 ['/rmf-series/artifacts','/rmf-series'], ['/rmf-series/controls','/rmf-series#select'],
 ['/rmf-series/other-approaches','/rmf-series#other-approaches'],
 ...phaseSlugs.map(slug=>['/rmf-series/'+slug,'/rmf-series#'+slug]),
 ...Object.entries(retiredEvidenceAnchors).map(([slug,phase])=>['/rmf-series/artifacts/'+slug,'/rmf-series#'+phase]),
];
for(const [path,target] of retiredRoutes){const response=await request(path);assert.equal(response.status,308,path);const location=new URL(response.headers.get('location'),origin);assert.equal(location.pathname+location.hash,target,path);}
for(const path of ['/rmf-series/unknown-step','/rmf-series/artifacts/unknown-artifact','/rmf-series/artifacts/__proto__']) assert.equal((await request(path)).status,404,path);
console.log(`Verified ${pages.size} active pages, ${retiredRoutes.length} redirects, ${checkedLinks} guide links, all ${preservedParagraphs} chapter paragraphs, seven phase diagrams/progress IDs, and 13 source/framework references.`);
