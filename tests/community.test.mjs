import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {contributionsApi,notify,contributionConsent} from '../server/contributions.js';
import worker from '../dist/server/index.js';
import {combineCommunityPage} from '../server/community-page.js';
import {addOwnerSession,ownerCookie,forgedOwnerHeaders} from './owner-session.mjs';
const communitySource=()=>combineCommunityPage(fs.readFileSync('server/career-pages/careers.html','utf8'),fs.readFileSync('server/career-pages/career-explorer.html','utf8'));
function database(){const raw=new DatabaseSync(':memory:');raw.exec('PRAGMA foreign_keys=ON');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(fs.readFileSync('drizzle/'+f,'utf8'));const prepare=sql=>{let values=[];return{bind(...v){values=v;return this},async first(){return raw.prepare(sql).get(...values)||null},async all(){return{results:raw.prepare(sql).all(...values)}},async run(){return{meta:{changes:Number(raw.prepare(sql).run(...values).changes)}}}}};return{raw,prepare,async batch(statements){raw.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}};}
const origin='https://securebydesigninc.com',owner='owner@example.invalid';
const req=(path,method='GET',data,authorized=false,extra={})=>new Request(origin+path,{method,headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.5',...(authorized?ownerCookie:{}),...extra},body:data===undefined?undefined:JSON.stringify(data)});
const setup=()=>{const env={DB:database(),OWNER_EMAIL:owner,RESEND_API_KEY:'test-placeholder',NOTIFICATION_FROM:'sender@example.invalid',SITE_ORIGIN:origin};addOwnerSession(env.DB.raw,owner);return env;};

const fixture=()=>({submissionId:crypto.randomUUID(),name:'Contributor',email:'reader@example.com',kind:'resource',resourceUrl:'https://example.org/guide',message:'A practical guide for learning security monitoring.',consent:true,website:''});
function context(){const pending=[];return{waitUntil(p){pending.push(p)},async drain(){await Promise.all(pending)}};}
async function mocked(callback){const before=globalThis.fetch,mails=[];globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');mails.push(JSON.parse(options.body));return Response.json({id:'mock-receipt'});};try{return await callback(mails);}finally{globalThis.fetch=before;}}
const count=(env,table)=>env.DB.raw.prepare('SELECT count(*) AS n FROM '+table).get().n;

test('Community pages are offline; the combined page source keeps participation first and its explorer tools for relaunch',async()=>{
 const env=setup(),ctx=context();
 for(const path of ['/careers','/career-explorer?from=bookmark','/career-explorer/roles','/career-explorer/roles/511'])assert.equal((await worker.fetch(req(path),env,ctx)).status,404,path);
 const page=communitySource();
 for(const id of ['community','career-explorer','direction','market','stage-panel','role-detail','state-select','occupation-select','resource-form','contribution-form'])assert.ok(page.includes('id="'+id+'"'),id);
 assert.ok(page.indexOf('id="contribution-form"')<page.indexOf('id="career-explorer"'));
 assert.equal([...page.matchAll(/<main\b/g)].length,1);assert.equal([...page.matchAll(/<h1\b/g)].length,1);
 const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate IDs would break controls');
 const nav=page.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)[1];assert.ok(!nav.includes('href="/careers"'));assert.ok(!nav.includes('href="/career-explorer"'));
});
test('contributions save separately, notify only the owner, and deduplicate retries',()=>mocked(async mails=>{
 const env=setup(),ctx=context(),data=fixture();let response=await contributionsApi(req('/api/community-contributions','POST',data),env,ctx);assert.equal(response.status,201);await ctx.drain();
 assert.equal(count(env,'community_contributions'),1);assert.equal(count(env,'career_records'),0);assert.equal(count(env,'resource_subscribers'),0);assert.equal(mails.length,1);assert.deepEqual(mails[0].to,['support@securebydesigninc.com']);assert.ok(!mails[0].text.includes(data.message));
 const row=env.DB.raw.prepare('SELECT * FROM community_contributions').get();assert.equal(row.consent_text,contributionConsent);assert.equal(row.status,'new');
 assert.equal((await contributionsApi(req('/api/community-contributions','POST',data),env,ctx)).status,200);assert.equal(mails.length,1);
 assert.equal((await contributionsApi(req('/api/community-contributions','POST',{...data,message:'changed'}),env,ctx)).status,409);
}));
test('invalid links, consent, oversized input and foreign origins are rejected',()=>mocked(async mails=>{
 const env=setup(),ctx=context();for(const patch of [{resourceUrl:'javascript:alert(1)'},{resourceUrl:'https://user:pass@example.org/'},{resourceUrl:''},{consent:false},{name:''},{message:''},{email:'bad'},{kind:'publish'},{website:'bot'},{extra:true}])assert.equal((await contributionsApi(req('/api/community-contributions','POST',{...fixture(),...patch}),env,ctx)).status,400);
 assert.equal((await contributionsApi(req('/api/community-contributions','POST',fixture(),false,{origin:'https://elsewhere.example'}),env,ctx)).status,403);
 assert.equal((await contributionsApi(req('/api/community-contributions','POST',{...fixture(),message:'x'.repeat(17000)}),env,ctx)).status,413);
 assert.equal(count(env,'community_contributions'),0);assert.equal(mails.length,0);
}));
test('owner-only review and status changes never publish or email the contributor',()=>mocked(async mails=>{
 const env=setup(),ctx=context(),data={...fixture(),kind:'article',resourceUrl:''};await contributionsApi(req('/api/community-contributions','POST',data),env,ctx);await ctx.drain();
 for(const [path,method,body] of [['','GET'],['/status','PUT',{id:data.submissionId,status:'closed'}],['/notify','POST',{id:data.submissionId}]])assert.equal((await contributionsApi(req('/api/community-contributions'+path,method,body),env,ctx)).status,403);
 const response=await contributionsApi(req('/api/community-contributions','GET',undefined,true),env,ctx);assert.equal((await response.json()).total,1);
 assert.equal((await contributionsApi(req('/api/community-contributions/status','PUT',{id:data.submissionId,status:'reviewing'},true),env,ctx)).status,200);
 assert.equal((await contributionsApi(req('/api/community-contributions/status','PUT',{id:data.submissionId,status:'published'},true),env,ctx)).status,400);
 assert.equal(env.DB.raw.prepare('SELECT status FROM community_contributions').get().status,'reviewing');assert.equal(mails.length,1);
}));
test('notification failure preserves the record and retry expiration prevents duplicate delivery',async()=>{
 const env=setup(),ctx=context(),data=fixture(),before=globalThis.fetch;globalThis.fetch=async()=>Response.json({},{status:400});try{assert.equal((await contributionsApi(req('/api/community-contributions','POST',data),env,ctx)).status,201);await ctx.drain();assert.equal(count(env,'community_contributions'),1);assert.equal(env.DB.raw.prepare('SELECT state FROM community_notifications').get().state,'failed');env.DB.raw.prepare('UPDATE community_notifications SET first_attempt_at=?').run('2000-01-01T00:00:00Z');assert.equal((await notify(env,data.submissionId)).state,'needs_review');}finally{globalThis.fetch=before;}
});
test('daily source limit and missing configuration preserve usable records',async()=>{
 const env=setup(),ctx=context();delete env.RESEND_API_KEY;for(let i=0;i<5;i++)assert.equal((await contributionsApi(req('/api/community-contributions','POST',fixture()),env,ctx)).status,201);await ctx.drain();assert.equal((await contributionsApi(req('/api/community-contributions','POST',fixture()),env,ctx)).status,429);assert.equal(count(env,'community_contributions'),5);assert.equal(env.DB.raw.prepare('SELECT state FROM community_notifications').get().state,'pending');
});
test('Community source retains all forms; private review routes ignore client-supplied identity headers',()=>mocked(async mails=>{
 const env=setup(),ctx=context();const page=communitySource();for(const id of ['career-goals-link','resource-form','contribution-form','resource-link','contribute-link'])assert.ok(page.includes('id="'+id+'"'));assert.equal((await worker.fetch(req('/community-contributions'),env,ctx)).status,302);assert.equal((await worker.fetch(req('/community-contributions','GET',undefined,false,forgedOwnerHeaders(owner)),env,ctx)).status,302);assert.equal((await worker.fetch(req('/api/community-contributions','GET',undefined,false,forgedOwnerHeaders(owner)),env,ctx)).status,403);assert.equal((await worker.fetch(req('/community-contributions','GET',undefined,true),env,ctx)).status,200);assert.equal((await worker.fetch(req('/community-contributions.html'),env,ctx)).status,404);assert.equal((await worker.fetch(req('/api/community-contributions'),env,ctx)).status,403);assert.equal((await worker.fetch(req('/api/community-contributions','POST',fixture()),env,ctx)).status,410,'the retired contribution form is closed');await ctx.drain();assert.equal(mails.length,0);
}));
