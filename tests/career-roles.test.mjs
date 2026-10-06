import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const catalog=read('public/career-roles/catalog.json');
const roles=catalog.map(r=>read(`public/career-roles/roles/${r.code}.json`));
test('all 58 indexed roles have unique codes, descriptions, and matching detail records',()=>{
 assert.equal(catalog.length,58);assert.equal(new Set(catalog.map(r=>r.code)).size,58);assert.equal(new Set(catalog.map(r=>r.category)).size,5);
 assert.ok(catalog.every(r=>!['data','software'].includes(r.category)));
 assert.deepEqual(readdirSync(new URL('public/career-roles/roles/',root)).sort(),catalog.map(r=>r.code+'.json').sort());
 for(let i=0;i<roles.length;i++){assert.equal(roles[i].title,catalog[i].title);assert.equal(roles[i].code,catalog[i].code);assert.ok(roles[i].description.length>20);}
});
test('pending roles never expose historical qualification mappings',()=>{
 assert.equal(roles.filter(r=>r.pending).length,21);
 for(const role of roles.filter(r=>r.pending)){assert.deepEqual(role.qualifications,{});assert.deepEqual(catalog.find(c=>c.code===role.code).certifications,[]);}
 assert.equal(roles.find(r=>r.code==='721').pending,true);
});
test('known mappings retain their correct proficiency and service scope',()=>{
 const r=roles.find(r=>r.code==='511').qualifications.N;
 assert.ok(r.Basic.certifications.some(c=>c.acronym==='CC'));
 assert.ok(r.Intermediate.certifications.some(c=>c.name==='CompTIA Security+'));
 assert.ok(!r.Basic.certifications.some(c=>c.name==='CompTIA Security+'));
 assert.ok(r.Advanced.certifications.some(c=>c.name.includes('CySA+')));
 const a=roles.find(r=>r.code==='612').qualifications.N;
 assert.equal(a.Basic.certifications.filter(c=>!c.retired).length,0);
 assert.ok(a.Intermediate.certifications.some(c=>c.acronym==='CGRC'));
});
test('each service and proficiency is deduplicated, with plain text only',()=>{
 for(const role of roles){for(const scope of Object.values(role.qualifications)){for(const level of Object.values(scope)){
  const keys=level.certifications.map(c=>c.name+'|'+c.retired);assert.equal(new Set(keys).size,keys.length);
  for(const rows of [level.education,level.training,level.workplace,level.environment])for(const text of rows)assert.doesNotMatch(text,/<\/?(?:script|a|p|br|div|li|ul)[\s>]/i);
 }}}
});
test('public role assets have no reference-site publicity or private provenance',()=>{
 const paths=['public/career-roles/catalog.json','public/career-roles/directory.js','server/career-role-pages.js',...roles.map(r=>`public/career-roles/roles/${r.code}.json`)];
 for(const path of paths){const text=readFileSync(new URL(path,root),'utf8');assert.doesNotMatch(text,/\b(?:DON|Navy|USMC)\s+COOL\b|cool\.osd\.mil|sourceURL|referenceId|\b(?:DCWF|CSWF|CWF)\b|Cyber Workforce Framework/i,path);}
 assert.ok(!readdirSync(new URL('public/career-roles/',root)).includes('provenance.json'));
});
