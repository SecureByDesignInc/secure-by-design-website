import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {resourcesApi,resourceConsent} from '../server/resources.js';
import worker from '../dist/server/index.js';
function database(){const raw=new DatabaseSync(':memory:');raw.exec('PRAGMA foreign_keys=ON');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(fs.readFileSync('drizzle/'+f,'utf8'));const prepare=sql=>{let values=[];return{bind(...v){values=v;return this},async first(){return raw.prepare(sql).get(...values)||null},async all(){return{results:raw.prepare(sql).all(...values)}},async run(){return{meta:{changes:Number(raw.prepare(sql).run(...values).changes)}}}}};return{raw,prepare,async batch(statements){raw.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}};}
const origin='https://securebydesigninc.com',owner='owner@example.invalid';
const req=(path,method='GET',data,authorized=false,extra={})=>new Request(origin+path,{method,headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.5',...(authorized?{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':owner}:{}),...extra},body:data===undefined?undefined:JSON.stringify(data)});
const setup=()=>({DB:database(),OWNER_EMAIL:owner,RESEND_API_KEY:'test-placeholder',NOTIFICATION_FROM:'sender@example.invalid',SITE_ORIGIN:origin});
const fixture=()=>({email:'reader@example.com',name:'Reader',consent:true,website:''});
async function mocked(callback){const before=globalThis.fetch,mails=[];globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');mails.push(JSON.parse(options.body));return Response.json({id:'mock-receipt'});};try{return await callback(mails);}finally{globalThis.fetch=before;}}
const row=env=>env.DB.raw.prepare('SELECT * FROM resource_subscribers').get();
test('signup stays pending until the recipient confirms; unsubscribe is separate from career records',()=>mocked(async mails=>{
 const env=setup();let response=await resourcesApi(req('/api/resource-signups','POST',{...fixture(),email:'Reader@Example.com'}),env);assert.equal(response.status,202);
 assert.equal(row(env).status,'pending');assert.equal(row(env).consent_text,resourceConsent);assert.equal(row(env).email,'reader@example.com');assert.equal(env.DB.raw.prepare('SELECT count(*) n FROM career_records').get().n,0);
 const confirm=mails[0].text.match(/#confirm\/([a-f0-9]{64})/)[1];assert.notEqual(row(env).confirmation_hash,confirm);
 const csvBefore=await resourcesApi(req('/api/resource-subscribers/export','GET',undefined,true),env);assert.ok(!(await csvBefore.text()).includes('reader@example.com'));
 response=await resourcesApi(req('/api/resource-preferences','POST',{action:'confirm',token:confirm}),env);assert.equal(response.status,200);assert.equal(row(env).status,'active');
 assert.equal((await resourcesApi(req('/api/resource-preferences','POST',{action:'confirm',token:confirm}),env)).status,200);
 response=await resourcesApi(req('/api/resource-subscribers/export','GET',undefined,true),env);const csv=await response.text();assert.match(csv,/reader@example.com/);assert.match(csv,/#unsubscribe\/[a-f0-9]{64}/);
 const unsubscribe=row(env).unsubscribe_token;assert.equal((await resourcesApi(req('/api/resource-preferences','POST',{action:'unsubscribe',token:unsubscribe}),env)).status,200);assert.equal(row(env).status,'unsubscribed');
 assert.equal((await resourcesApi(req('/api/resource-preferences','POST',{action:'confirm',token:confirm}),env)).status,400);
 assert.ok(!(await(await resourcesApi(req('/api/resource-subscribers/export','GET',undefined,true),env)).text()).includes('reader@example.com'));
}));
test('signup validation and origin checks prevent accidental enrollment and unsafe private access',()=>mocked(async mails=>{
 const env=setup();for(const patch of [{consent:false},{email:'bad'},{website:'bot'},{name:'x'.repeat(121)},{extra:true}])assert.equal((await resourcesApi(req('/api/resource-signups','POST',{...fixture(),...patch}),env)).status,400);
 assert.equal((await resourcesApi(req('/api/resource-signups','POST',fixture(),false,{origin:'https://other.example'}),env)).status,403);
 assert.equal((await resourcesApi(req('/api/resource-signups','POST',{...fixture(),name:'x'.repeat(5000)}),env)).status,413);
 for(const path of ['/api/resource-subscribers','/api/resource-subscribers/export'])assert.equal((await resourcesApi(req(path),env)).status,403);
 assert.equal((await resourcesApi(req('/api/resource-subscribers/unsubscribe','POST',{email:'reader@example.com'}),env)).status,403);
 assert.equal(mails.length,0);assert.equal(row(env),undefined);
}));
test('duplicates do not spam or reset active subscribers and per-address retry limits persist',()=>mocked(async mails=>{
 const env=setup();const signup=()=>resourcesApi(req('/api/resource-signups','POST',fixture()),env);
 assert.equal((await signup()).status,202);assert.equal((await signup()).status,202);assert.equal(mails.length,1);
 for(let i=0;i<3;i++){env.DB.raw.prepare('UPDATE resource_subscribers SET last_requested_at=?').run(new Date(Date.now()-120000).toISOString());await signup();}
 assert.equal(mails.length,3);
 const confirm=mails[2].text.match(/#confirm\/([a-f0-9]{64})/)[1];await resourcesApi(req('/api/resource-preferences','POST',{action:'confirm',token:confirm}),env);await signup();assert.equal(row(env).status,'active');assert.equal(mails.length,3);
}));
test('expired tokens and unverified attempts never become active, including when delivery fails',async()=>{
 const env=setup();await mocked(async mails=>{await resourcesApi(req('/api/resource-signups','POST',fixture()),env);const confirm=mails[0].text.match(/#confirm\/([a-f0-9]{64})/)[1];env.DB.raw.prepare('UPDATE resource_subscribers SET confirmation_expires_at=?').run('2000-01-01T00:00:00.000Z');assert.equal((await resourcesApi(req('/api/resource-preferences','POST',{action:'confirm',token:confirm}),env)).status,400);});
 const before=globalThis.fetch;globalThis.fetch=async()=>Response.json({}, {status:500});try{const response=await resourcesApi(req('/api/resource-signups','POST',{...fixture(),email:'other@example.com'}),env);assert.equal(response.status,502);const r=env.DB.raw.prepare('SELECT * FROM resource_subscribers WHERE email=?').get('other@example.com');assert.equal(r.status,'pending');assert.equal(r.email_state,'failed');}finally{globalThis.fetch=before;}
});
test('per-source submission limits and CSV formula protection work',()=>mocked(async mails=>{
 const env=setup();for(let i=0;i<10;i++)assert.equal((await resourcesApi(req('/api/resource-signups','POST',{...fixture(),email:`reader${i}@example.com`,name:'=SUM(1,2)'}),env)).status,202);
 assert.equal((await resourcesApi(req('/api/resource-signups','POST',{...fixture(),email:'last@example.com'}),env)).status,429);assert.equal(mails.length,10);
 const confirm=mails[0].text.match(/#confirm\/([a-f0-9]{64})/)[1];await resourcesApi(req('/api/resource-preferences','POST',{action:'confirm',token:confirm}),env);const csv=await(await resourcesApi(req('/api/resource-subscribers/export','GET',undefined,true),env)).text();assert.ok(csv.includes("'=SUM(1,2)"));
}));
test('the built site serves both choices, protects subscriber management, and never mutates on email-link GET',()=>mocked(async mails=>{
 const env=setup(),ctx={waitUntil:()=>{}};const page=await(await worker.fetch(req('/careers'),env,ctx)).text();for(const id of ['career-goals-link','resource-form','resource-link'])assert.ok(page.includes('id="'+id+'"'));
 assert.equal((await worker.fetch(req('/resource-subscribers'),env,ctx)).status,302);
 assert.equal((await worker.fetch(req('/resource-subscribers','GET',undefined,true),env,ctx)).status,200);
 assert.equal((await worker.fetch(req('/resource-subscribers.html'),env,ctx)).status,404);
 assert.equal((await worker.fetch(req('/api/resource-signups','POST',fixture()),env,ctx)).status,202);
 assert.equal((await worker.fetch(req('/resource-preferences'),env,ctx)).status,200);assert.equal(row(env).status,'pending');
}));
