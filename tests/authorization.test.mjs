import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {authorizationApi} from '../server/authorization.js';
import {deleteAccount} from '../server/account-deletion.js';
import {PRACTICE_CONTROLS,objectivesFor,issmReview,aoDecision,controlIndex,monitoring,authorizationStatus,phases,daysUntil} from '../lib/authorization/model.mjs';

const origin='https://securebydesigninc.com';
const token=user=>(user==='alice'?'a':'b').repeat(64);
function setup(){
 const raw=new DatabaseSync(':memory:');
 for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(fs.readFileSync('drizzle/'+file,'utf8'));
 const DB={prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){return raw.prepare(sql).get(...args)||null},async all(){return{results:raw.prepare(sql).all(...args)}},async run(){return raw.prepare(sql).run(...args)}}},async batch(statements){raw.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());raw.exec('COMMIT');return out}catch(e){raw.exec('ROLLBACK');throw e}}};
 for(const user of ['alice','bob']){
  raw.prepare('INSERT INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run(user,user+'@example.invalid',new Date().toISOString());
  raw.prepare('INSERT INTO reader_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').run(createHash('sha256').update(token(user)).digest('hex'),user,new Date(Date.now()+86400000).toISOString());
 }
 return {DB,raw};
}
const call=async(env,user,method,path='',body,headers={})=>{
 const response=await authorizationApi(new Request(origin+'/api/authorization'+path,{method,headers:{origin,'content-type':'application/json',...(user?{cookie:'__Host-sbd_reader='+token(user)}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)}),env);
 return {status:response.status,data:await response.json(),headers:response.headers};
};
const ok=async(promise,status=200)=>{const r=await promise;assert.equal(r.status,status,JSON.stringify(r.data));return r.data;};
const today=()=>new Date().toISOString().slice(0,10);
const later=days=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);

const profile={roles:{owner:'Dana Owner',ao:'Avery Official',issm:'Morgan Manager',isso:'Sam Officer',sca:'Riley Assessor'},
 description:'A small Windows Server and Linux enclave providing directory, file, database, web and monitoring services to its users.',
 boundary:'Every server, workstation, switch and hypervisor host on VLANs 10 to 80 of the air-gapped Secure By Design network.',
 infoTypes:[{name:'Directory and authentication records',c:'moderate',i:'low',a:'low'}],categorization:{c:'moderate',i:'low',a:'low'},
 categorizationRationale:'Disclosure of directory records would have a serious effect; changes or outages are limited and recoverable.',
 selectionRationale:'The capstone practice scope: account management, logging, configuration, vulnerability, flaw and backup controls.'};

async function register(env,user='alice'){return ok(call(env,user,'POST','/systems',{template:'sbd-enclave'}),201);}
// Takes every control to Implemented, with accepted evidence and package documents, and assesses it.
async function buildPackage(env,id,{fail=[]}={}){
 const base=`/systems/${id}`;
 await ok(call(env,'alice','PATCH',base,profile));
 let state=await ok(call(env,'alice','GET',base));
 for(const c of state.controls)await ok(call(env,'alice','PATCH',`${base}/controls/${c.controlId}`,{implementationStatus:'implemented',narrative:`${c.controlId} is implemented on every system in the boundary through domain Group Policy and documented procedures.`,responsible:'ISSO and system administrators'}));
 const evidence={title:'Configuration and log review records',kind:'configuration',description:'Exported Group Policy settings and a sample of reviewed audit events.',content:'Excerpt of the exported settings.',artifactDate:today(),controls:state.controls.map(c=>c.controlId)};
 for(const doc of [evidence,{title:'Boundary diagram',kind:'diagram',packageRole:'boundary_diagram',description:'The authorization boundary with every VLAN and system.',location:'Package folder, item 2',artifactDate:today(),controls:[]},{title:'Hardware and software inventory',kind:'inventory',packageRole:'inventory',description:'Every component in the boundary with its owner and version.',location:'Package folder, item 3',artifactDate:today(),controls:[]},{title:'Ports, protocols, and services',kind:'report',packageRole:'pps',description:'The approved flows F01 to F24 and management protocols.',location:'Package folder, item 4',artifactDate:today(),controls:[]}]){
  state=await ok(call(env,'alice','POST',`${base}/artifacts`,doc),201);
  const a=state.artifacts.at(-1);
  await ok(call(env,'alice','POST',`${base}/artifacts/${a.id}/submit`,{}));
  await ok(call(env,'alice','POST',`${base}/artifacts/${a.id}/review`,{decision:'accept',note:''}));
 }
 for(const c of state.controls){
  await ok(call(env,'alice','POST',`${base}/controls/${c.controlId}/submit`,{}));
  const results=Object.fromEntries(objectivesFor(c.controlId).map((o,i)=>[o,fail.includes(c.controlId)&&i===0?{result:'other_than_satisfied',note:'Reviews are not recorded every week as the plan says.'}:{result:'satisfied',note:''}]));
  await ok(call(env,'alice','PUT',`${base}/controls/${c.controlId}/results`,{results,assessorNotes:'Examined settings and records; tested a sample.'}));
  state=await ok(call(env,'alice','POST',`${base}/controls/${c.controlId}/validate`,{}));
 }
 await ok(call(env,'alice','PUT',`${base}/package`,{type:'assess_authorize',executiveSummary:'The enclave supports directory, file and monitoring services. All nine practice controls were assessed; the results and open actions are below.',assessorSummary:'Each control was examined, interviewed and tested against its SP 800-53A objectives. Significant results and their effect on risk are summarized here.'}));
 return state;
}
const poam=(controlId,severity,extra={})=>({controlId,weakness:'Weekly audit record reviews are not consistently recorded.',source:'assessment',severity,residualRisk:'moderate',resources:'Four analyst hours a week',poc:'Sam Officer',scheduledCompletion:later(60),milestones:[{text:'Publish the review checklist',due:later(14)},{text:'Four weeks of recorded reviews',due:later(45)}],...extra});

test('the control catalog comes from NIST SP 800-53 Rev. 5 with SP 800-53A objectives',()=>{
 assert.ok(Object.keys(controlIndex).length>1000);
 for(const id of PRACTICE_CONTROLS)assert.ok(objectivesFor(id).length>0,id);
 assert.equal(controlIndex['AC-2'][0],'Account Management');
 assert.ok(controlIndex['AC-2'][2].includes('M'));
 const full=JSON.parse(fs.readFileSync('public/grc-rmf-training/workspace/controls-rev5.json','utf8'));
 const ac2=full.controls.find(c=>c.id==='AC-2');
 assert.match(ac2.statement.find(s=>s[1]==='j.')[2],/\[Assignment: organization-defined frequency\]/);
 assert.ok(!JSON.stringify(full).includes('{{ insert'));
});

test('signed-out visitors see no systems and cannot write',async()=>{
 const env=setup();
 assert.deepEqual((await call(env,null,'GET')).data,{user:null,systems:[]});
 assert.equal((await call(env,null,'POST','/systems',{template:'sbd-enclave'})).status,401);
});

test('systems belong to one account; writes need this site as their origin',async()=>{
 const env=setup();const state=await register(env);
 assert.equal(state.controls.length,PRACTICE_CONTROLS.length);
 assert.equal((await call(env,'bob','GET',`/systems/${state.system.id}`)).status,404);
 assert.equal((await call(env,'bob','PATCH',`/systems/${state.system.id}`,{name:'Taken'})).status,404);
 assert.equal((await call(env,'alice','PATCH',`/systems/${state.system.id}`,{name:'Mine'},{origin:'https://evil.invalid'})).status,403);
 assert.equal((await call(env,'alice','PATCH',`/systems/${state.system.id}`,{owner:'bob'})).status,400);
 const list=await ok(call(env,'alice','GET'));assert.equal(list.systems.length,1);
 assert.equal((await ok(call(env,'bob','GET'))).systems.length,0);
 for(let i=1;i<5;i++)await ok(call(env,'alice','POST','/systems',{template:'blank',name:`Practice system ${i}`}),201);
 const full=await call(env,'alice','POST','/systems',{template:'blank',name:'One too many'});
 assert.equal(full.status,409);assert.match(full.data.error,/up to 5 systems/);
});

// Owner report, 15 October 2026: clicking the enclave again after registering it created a duplicate.
test('an account keeps one Secure By Design enclave and no two systems share a name',async()=>{
 const env=setup();const first=await register(env);
 const again=await call(env,'alice','POST','/systems',{template:'sbd-enclave'});
 assert.equal(again.status,409);assert.match(again.data.error,/already have the Secure By Design enclave/);
 assert.equal((await call(env,'alice','POST','/systems',{template:'sbd-enclave',name:'Another enclave'})).status,409,'renaming does not get around the rule');
 assert.equal((await ok(call(env,'alice','GET'))).systems.length,1);
 // The database refuses a second enclave even if two requests pass the check at the same moment.
 assert.throws(()=>env.raw.prepare("INSERT INTO auth_systems (id,account_id,profile,created_at,updated_at,registration_key) VALUES ('x','alice','{}','t','t','sbd-enclave')").run(),/UNIQUE/);
 // Blank systems: any number, but not the same name twice (a repeated click), whatever the case or spacing.
 await ok(call(env,'alice','POST','/systems',{template:'blank',name:'Lab Network'}),201);
 const dup=await call(env,'alice','POST','/systems',{template:'blank',name:'  lab   network '});
 assert.equal(dup.status,409);assert.match(dup.data.error,/already have a system named/);
 await ok(call(env,'alice','POST','/systems',{template:'blank',name:'Lab Network 2'}),201);
 // Another account has its own enclave; deleting yours lets you register it again.
 await register(env,'bob');
 await ok(call(env,'alice','DELETE',`/systems/${first.system.id}`));
 await register(env);
 assert.equal((await call(env,'alice','POST','/systems',{template:'__proto__'})).status,400);
});

// Course 2.1 "RMF to ATO" and My Progress read where the learner's enclave stands on each RMF step.
test('step progress reports the enclave\'s phases and nothing for signed-out visitors',async()=>{
 const env=setup();
 assert.deepEqual((await call(env,null,'GET','/progress')).data,{user:null,system:null,steps:[]});
 assert.deepEqual((await ok(call(env,'alice','GET','/progress'))).system,null,'no enclave yet');
 await ok(call(env,'alice','POST','/systems',{template:'blank',name:'Other system'}),201);
 assert.equal((await ok(call(env,'alice','GET','/progress'))).system,null,'only the Secure By Design enclave counts');
 const {system}=await register(env);
 let p=await ok(call(env,'alice','GET','/progress'));
 assert.equal(p.system.id,system.id);
 assert.deepEqual(p.steps.map(s=>s.id),['prepare','categorize','select','implement','assess','authorize','monitor']);
 assert.equal(p.steps.find(s=>s.id==='prepare').done,false);
 await ok(call(env,'alice','PATCH',`/systems/${system.id}`,profile));
 p=await ok(call(env,'alice','GET','/progress'));
 assert.deepEqual(p.steps.filter(s=>s.done).map(s=>s.id),['prepare','categorize','select']);
 assert.equal((await ok(call(env,'bob','GET','/progress'))).system,null,'each account sees only its own enclave');
 assert.equal((await call(env,'alice','POST','/progress',{})).status,405);
});

// drizzle/0015 cleans up duplicates made before the fix: untouched copies go, worked-on systems stay.
test('the one-enclave migration removes untouched duplicates and keeps work',()=>{
 const raw=new DatabaseSync(':memory:');
 const files=fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort();
 const fix=files.indexOf('0015_auth_one_enclave.sql');assert.ok(fix>0);
 for(const file of files.slice(0,fix))raw.exec(fs.readFileSync('drizzle/'+file,'utf8'));
 const enclave=JSON.stringify({name:'Secure By Design Enclave',template:'sbd-enclave'});
 for(const user of ['alice','bob','carol'])raw.prepare('INSERT INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run(user,user+'@example.invalid','2026-10-01T00:00:00Z');
 const sys=(id,account,created,updated=created)=>{
  raw.prepare('INSERT INTO auth_systems (id,account_id,profile,created_at,updated_at) VALUES (?,?,?,?,?)').run(id,account,enclave,created,updated);
  raw.prepare('INSERT INTO auth_controls (system_id,control_id,updated_at) VALUES (?,?,?)').run(id,'AC-2',created);
  raw.prepare('INSERT INTO auth_history (system_id,at,role,action,subject,detail) VALUES (?,?,?,?,?,?)').run(id,created,'System','Registered the system','','');
 };
 sys('a1','alice','2026-10-15T10:00:00Z');sys('a2','alice','2026-10-15T10:00:05Z');   // alice: two untouched copies
 sys('b1','bob','2026-10-15T10:00:00Z');sys('b2','bob','2026-10-15T10:01:00Z','2026-10-15T11:00:00Z'); // bob worked in the second
 sys('c1','carol','2026-10-15T10:00:00Z','2026-10-15T12:00:00Z');sys('c2','carol','2026-10-15T10:02:00Z','2026-10-15T12:30:00Z'); // carol worked in both
 raw.exec(fs.readFileSync('drizzle/0015_auth_one_enclave.sql','utf8'));
 const rows=Object.fromEntries(raw.prepare('SELECT id,registration_key FROM auth_systems ORDER BY id').all().map(r=>[r.id,r.registration_key]));
 assert.deepEqual(Object.keys(rows),['a1','b2','c1','c2']);
 assert.equal(rows.a1,'sbd-enclave');assert.equal(rows.b2,'sbd-enclave');assert.equal(rows.c1,'sbd-enclave');assert.equal(rows.c2,null);
 assert.equal(raw.prepare("SELECT count(*) AS n FROM auth_controls WHERE system_id IN ('a2','b1')").get().n,0);
 assert.equal(raw.prepare("SELECT count(*) AS n FROM auth_history WHERE system_id IN ('a2','b1')").get().n,0);
 assert.equal(raw.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name IN ('_auth_enclaves','_auth_enclave_duplicates')").get().n,0,'helper tables are dropped');
});

test('the control approval chain needs a statement and evidence, and returns to the ISSO when changed',async()=>{
 const env=setup();const {system}=await register(env);const base=`/systems/${system.id}`;
 assert.equal((await call(env,'alice','POST',`${base}/controls/AC-2/submit`,{})).status,422);
 await ok(call(env,'alice','PATCH',`${base}/controls/AC-2`,{implementationStatus:'implemented',narrative:'Accounts are requested, approved, created, reviewed and removed through the documented account procedure.',responsible:'ISSO'}));
 const noEvidence=await call(env,'alice','POST',`${base}/controls/AC-2/submit`,{});
 assert.equal(noEvidence.status,422);assert.match(noEvidence.data.error,/evidence/);
 await ok(call(env,'alice','POST',`${base}/artifacts`,{title:'Account review',kind:'record',controls:['AC-2']}),400);
 let state=await ok(call(env,'alice','POST',`${base}/artifacts`,{title:'Account review',kind:'log',description:'Quarterly review of every account.',content:'Excerpt',artifactDate:today(),controls:['AC-2']}),201);
 assert.equal((await call(env,'alice','POST',`${base}/artifacts`,{title:'Out of scope',kind:'log',controls:['PE-3']})).status,400);
 state=await ok(call(env,'alice','POST',`${base}/controls/AC-2/submit`,{}));
 assert.equal(state.controls.find(c=>c.controlId==='AC-2').step,'submitted');
 assert.equal((await call(env,'alice','POST',`${base}/controls/AC-2/validate`,{})).status,422);
 assert.equal((await call(env,'alice','PUT',`${base}/controls/AC-2/results`,{results:{'AC-99':{result:'satisfied'}}})).status,400);
 state=await ok(call(env,'alice','POST',`${base}/controls/AC-2/return`,{comment:'Name the account manager and the review frequency.'}));
 assert.equal(state.controls.find(c=>c.controlId==='AC-2').step,'returned');
 await ok(call(env,'alice','POST',`${base}/controls/AC-2/submit`,{}));
 state=await ok(call(env,'alice','PATCH',`${base}/controls/AC-2`,{narrative:'Changed after submission: the account manager role is the ISSO, and reviews happen quarterly.'}));
 assert.equal(state.controls.find(c=>c.controlId==='AC-2').step,'draft');
 assert.ok(state.history.some(h=>h.action==='Changed a submitted control'));
});

test('a complete package with an open CAT II weakness gets an ATO with conditions',async()=>{
 const env=setup();const {system}=await register(env);const base=`/systems/${system.id}`;
 await buildPackage(env,system.id,{fail:['AU-6']});
 let state=await ok(call(env,'alice','POST',`${base}/package/submit`,{}));
 assert.equal(state.package.stage,'returned');assert.equal(state.package.review.stage,'sca');
 assert.ok(state.package.review.sca.find(c=>c.id==='weaknesses'&&!c.ok));
 assert.equal((await call(env,'alice','PATCH',`${base}`,{})).status,200);
 await ok(call(env,'alice','POST',`${base}/poam`,poam('AU-6','CAT II')),201);
 assert.equal((await call(env,'alice','POST',`${base}/poam`,poam('AU-6','CAT II',{status:'risk_accepted'}))).status,400);
 state=await ok(call(env,'alice','POST',`${base}/package/submit`,{}));
 assert.equal(state.package,null);
 assert.equal(state.system.authorization.decision,'ato_conditions');
 assert.equal(state.system.authorization.terminationDate,later(365));
 assert.match(state.system.authorization.conditions[0],/POA&M #1 \(AU-6\)/);
 assert.match(state.system.authorization.reasons[0],/The open weakness/);
 assert.equal(state.packages[0].stage,'decided');
 assert.ok(state.history.some(h=>h.role==='Authorizing Official'&&h.action==='Made the authorization decision'));
 // Monitoring: a change sends affected controls back to the assessor.
 state=await ok(call(env,'alice','POST',`${base}/changes`,{description:'Added a second log collector to VLAN 20.',controls:['AU-6','AU-12']}),201);
 assert.equal(state.controls.find(c=>c.controlId==='AU-12').step,'submitted');
 assert.match(state.controls.find(c=>c.controlId==='AU-12').reassessReason,/second log collector/);
 // A new package after a decision is a reauthorization.
 state=await ok(call(env,'alice','PUT',`${base}/package`,{}));
 assert.equal(state.package.type,'reauthorization');assert.match(state.package.executiveSummary,/enclave/);
});

test('the AO denies authorization for an open CAT I and decides risk acceptance requests',async()=>{
 const env=setup();const {system}=await register(env);const base=`/systems/${system.id}`;
 await buildPackage(env,system.id,{fail:['RA-5','AU-6']});
 await ok(call(env,'alice','POST',`${base}/poam`,poam('RA-5','CAT I',{weakness:'Nessus has no approved scan scope (rule F15), so the boundary is not scanned.'})),201);
 await ok(call(env,'alice','POST',`${base}/poam`,poam('AU-6','CAT III',{status:'risk_acceptance_requested',residualRisk:'low',mitigations:'Splunk alerts on the critical events every day, so a missed weekly review leaves little exposure.'})),201);
 let state=await ok(call(env,'alice','POST',`${base}/package/submit`,{}));
 assert.equal(state.system.authorization.decision,'dato');
 assert.match(state.system.authorization.reasons[0],/CAT I/);
 assert.equal(state.poam.find(p=>p.number===2).status,'risk_accepted');
 // Fix the CAT I, retest, and resubmit: the system is authorized.
 await ok(call(env,'alice','PATCH',`${base}/poam/${state.poam[0].id}`,{status:'completed'}));
 await ok(call(env,'alice','PUT',`${base}/controls/RA-5/results`,{results:Object.fromEntries(objectivesFor('RA-5').map(o=>[o,{result:'satisfied',note:''}])),assessorNotes:'Retested after the scan scope was approved.'}));
 await ok(call(env,'alice','POST',`${base}/controls/RA-5/validate`,{}));
 state=await ok(call(env,'alice','PUT',`${base}/package`,{}));assert.equal(state.package.type,'assess_authorize');
 state=await ok(call(env,'alice','POST',`${base}/package/submit`,{}));
 assert.equal(state.system.authorization.decision,'ato');assert.equal(state.system.authorization.terminationDate,later(1095));
 assert.equal((await call(env,'alice','DELETE',`${base}/poam/${state.poam[0].id}`)).status,409);
});

test('the ISSM checks independence, categorization and lapsed provider assurance',async()=>{
 const env=setup();let state=await register(env);const base=`/systems/${state.system.id}`;
 state=await ok(call(env,'alice','PATCH',base,{...profile,roles:{...profile.roles,sca:'Sam Officer'},categorization:{c:'low',i:'low',a:'low'}}));
 const review=issmReview({...state,package:null});
 assert.equal(review.find(c=>c.id==='independence').ok,false);
 assert.match(review.find(c=>c.id==='categorization').detail,/confidentiality/);
 state=await ok(call(env,'alice','POST',`${base}/controls`,{ids:['PS-3','PE-3']}),201);
 assert.equal((await call(env,'alice','PATCH',`${base}/controls/PE-3`,{implementationStatus:'inherited',provider:'sbd-personnel'})).status,400);
 await ok(call(env,'alice','PATCH',`${base}/controls/PS-3`,{implementationStatus:'inherited',provider:'sbd-personnel'}));
 state=await ok(call(env,'alice','POST',`${base}/controls/PS-3/submit`,{}));
 assert.equal(state.controls.find(c=>c.controlId==='PS-3').step,'assessed');
 assert.equal(issmReview(state).find(c=>c.id==='inheritance').ok,false);
 state=await ok(call(env,'alice','POST',`${base}/providers/sbd-personnel/renew`,{}));
 assert.equal(issmReview(state).find(c=>c.id==='inheritance').ok,true);
 assert.equal((await call(env,'alice','POST',`${base}/controls`,{ids:['XX-1']})).status,400);
});

test('practice decision rules',()=>{
 const base={package:{type:'assess_authorize'},poam:[]};
 assert.equal(aoDecision(base).decision,'ato');
 assert.equal(aoDecision({...base,package:{type:'iatt'}}).decision,'iatt');
 assert.equal(aoDecision({...base,poam:[{id:'1',number:1,status:'ongoing',severity:'CAT II',residualRisk:'very_high',weakness:'x',scheduledCompletion:later(9)}]}).decision,'dato');
 const denied=aoDecision({...base,poam:[{id:'1',number:1,status:'risk_acceptance_requested',severity:'CAT II',residualRisk:'high',mitigations:'Compensating monitoring in place every day.',weakness:'x',scheduledCompletion:later(9)}]});
 assert.equal(denied.riskDecisions[0].accepted,false);assert.equal(denied.decision,'ato_conditions');
});

test('monitoring flags expiry, the annual review, overdue POA&M items, lapsed providers and old evidence',()=>{
 const now=Date.parse('2027-06-01T12:00:00Z');
 const state={system:{createdAt:'2026-01-01T00:00:00Z',profile:{},authorization:{decision:'ato_conditions',decidedAt:'2026-03-01T00:00:00Z',terminationDate:'2027-03-01'}},
  controls:[{controlId:'PS-3',implementationStatus:'inherited',provider:'sbd-personnel',step:'assessed',frequency:'annual',lastAssessedAt:'2026-03-01T00:00:00Z',results:{}}],
  artifacts:[{title:'Old scan',reviewState:'accepted',artifactDate:'2026-01-02',controls:[]}],
  poam:[{number:1,status:'ongoing',severity:'CAT II',scheduledCompletion:'2027-01-01',milestones:[{text:'Fix the setting',due:'2026-12-01',done:false}]}]};
 const texts=monitoring(state,now).map(i=>i.text).join(' | ');
 for(const pattern of [/expired 92 days ago/,/annual security review/,/POA&M #1 passed/,/milestone overdue/,/provider assurance lapsed/,/older than a year/])assert.match(texts,pattern);
 assert.equal(monitoring(state,now)[0].level,'high');
 assert.equal(authorizationStatus(state.system,now),'expired');
 assert.equal(authorizationStatus(state.system,Date.parse('2027-03-01T20:00:00Z')),'ato_conditions');
 assert.equal(daysUntil('2027-03-01',Date.parse('2027-02-28T23:00:00Z')),1);
 assert.deepEqual(phases({...state,controls:[]},now).map(p=>p.done),[false,false,false,false,false,true,false]);
});

test('the Compliance Hub follows the Configuration Hub in the main menu, including the Community shells',()=>{
 const nav=JSON.parse(fs.readFileSync('content/navigation.json','utf8'));
 const at=href=>nav.findIndex(([path])=>path===href);
 assert.deepEqual(nav[at('/technical-training')],['/technical-training','Configuration Hub']);
 assert.deepEqual(nav[at('/grc-rmf-training')],['/grc-rmf-training','Compliance Hub']);
 assert.equal(at('/grc-rmf-training'),at('/technical-training')+1);
 assert.ok(!nav.some(([path])=>path==='/training'||path==='/authorization-workspace'));
 for(const name of ['careers','career-records','resource-preferences','community-contributions'])assert.match(fs.readFileSync(`server/career-pages/${name}.html`,'utf8'),/<nav aria-label="Main navigation">(?:(?!<\/nav>)[\s\S])*href="\/technical-training"[^>]*>Configuration Hub<\/a><a href="\/grc-rmf-training"[^>]*>Compliance Hub</,name);
});

test('deleting a system or the account removes every record',async()=>{
 const env=setup();const first=await register(env),second=await ok(call(env,'alice','POST','/systems',{template:'blank',name:'Second system'}),201);
 await ok(call(env,'alice','POST',`/systems/${first.system.id}/poam`,poam('AU-6','CAT II')),201);
 await ok(call(env,'alice','DELETE',`/systems/${first.system.id}`));
 assert.equal(env.raw.prepare('SELECT count(*) n FROM auth_poam').get().n,0);
 assert.equal(env.raw.prepare('SELECT count(*) n FROM auth_controls WHERE system_id=?').get(first.system.id).n,0);
 await register(env,'bob');
 await deleteAccount(env,{id:'alice',email:'alice@example.invalid'});
 for(const table of ['auth_systems','auth_controls','auth_history'])assert.equal(env.raw.prepare(`SELECT count(*) n FROM ${table} WHERE ${table==='auth_systems'?'account_id':'system_id'}=?`).get(table==='auth_systems'?'alice':second.system.id).n,0);
 assert.equal(env.raw.prepare("SELECT count(*) n FROM auth_systems WHERE account_id='bob'").get().n,1);
});
