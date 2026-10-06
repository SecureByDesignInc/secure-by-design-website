import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {api as careersApi} from '../server/careers.js';
import {contributionsApi} from '../server/contributions.js';
import {resourcesApi} from '../server/resources.js';
import {readerAuthApi} from '../server/reader-auth.js';
import {nativeAuthApi} from '../server/native-auth.js';
import {readerProgressApi} from '../server/reader-progress.js';

const origin='https://securebydesigninc.com',email='member@example.invalid';
const password='a community membership test passphrase';
function setup(){
 const raw=new DatabaseSync(':memory:');raw.exec('PRAGMA foreign_keys=ON');
 for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(readFileSync('drizzle/'+file,'utf8'));
 const DB={prepare(sql){let args=[];return{bind(...values){args=values;return this},async first(){return raw.prepare(sql).get(...args)||null},async all(){return{results:raw.prepare(sql).all(...args)}},async run(){return{meta:{changes:Number(raw.prepare(sql).run(...args).changes)}}}}},async batch(statements){raw.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());raw.exec('COMMIT');return result}catch(error){raw.exec('ROLLBACK');throw error}}};
 const pending=[],ctx={waitUntil(promise){pending.push(promise)}};
 return{raw,env:{DB},ctx,async drain(){await Promise.all(pending)}};
}
function request(path,body,headers={},method='POST'){
 return new Request(origin+path,{method,headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.30',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
function nativeRequest(path,body,token,method='POST'){
 const req=request(path,body,{'x-sbd-client':'native-v1',...(token?{authorization:'Bearer '+token}:{})},method);req.headers.delete('origin');return req;
}
const career=(address=email)=>({submissionId:crypto.randomUUID(),name:'Learner',email:address,aspirations:'Learn security engineering',storageAcknowledged:true});
const contribution=(address=email)=>({submissionId:crypto.randomUUID(),name:'Learner',email:address,kind:'other',message:'A contribution for review.',consent:true});
const resource=(address=email)=>({email:address,consent:true});
const membership=s=>s.raw.prepare('SELECT * FROM community_memberships WHERE email=?').get(email);
const count=(s,table)=>s.raw.prepare('SELECT count(*) AS n FROM '+table).get().n;
async function withEmail(s,callback){
 s.env.RESEND_API_KEY='test-placeholder';s.env.NOTIFICATION_FROM='test@example.invalid';
 const old=globalThis.fetch,mails=[];globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');mails.push(JSON.parse(options.body));return Response.json({id:'test-receipt'})};
 try{return await callback(mails)}finally{await s.drain();globalThis.fetch=old;}
}

test('all submitted email flows share one membership and link only after account verification',async()=>{
 const s=setup(),data=career(' MEMBER@EXAMPLE.INVALID ');
 const first=await careersApi(request('/api/career-submissions',data),s.env,s.ctx);assert.equal(first.status,201);await s.drain();
 assert.deepEqual((await first.json()).membership,{plan:'community',status:'active'});
 const joined=membership(s).joined_at;assert.equal(membership(s).account_id,null);assert.equal(membership(s).verified_at,null);
 assert.equal(count(s,'reader_accounts'),0);assert.equal(count(s,'resource_subscribers'),0);assert.equal(count(s,'app_email_enrollments'),0);
 assert.equal((await careersApi(request('/api/career-submissions',data),s.env,s.ctx)).status,200);
 assert.equal((await contributionsApi(request('/api/community-contributions',contribution('Member@Example.Invalid')),s.env,s.ctx)).status,201);await s.drain();
 await withEmail(s,async mails=>{
  assert.equal((await resourcesApi(request('/api/resource-signups',resource()),s.env)).status,202);
  assert.equal(s.raw.prepare('SELECT status FROM resource_subscribers').get().status,'pending');assert.equal(membership(s).verified_at,null);
  const response=await readerAuthApi(request('/api/reader-auth/request',{email,consent:true,purpose:'create'}),s.env);assert.equal(response.status,202);
  assert.equal(count(s,'reader_accounts'),0,'a submitted email is not a signed-in account');
  const code=mails.find(mail=>mail.subject.includes('verification code')).text.match(/\b\d{8}\b/)[0],cookie=response.headers.get('set-cookie').split(';')[0];
  const verified=await readerAuthApi(request('/api/reader-auth/verify',{code,password,confirmPassword:password},{cookie}),s.env);assert.equal(verified.status,200);
  const session=verified.headers.get('set-cookie').split(';')[0];assert.ok(membership(s).account_id);assert.ok(membership(s).verified_at);
  const profile=await(await readerProgressApi(request('/api/reader-progress',undefined,{cookie:session},'GET'),s.env)).json();
  assert.equal(profile.membership.status,'active');assert.equal(profile.membership.joinedAt,joined);
  const signedIn=await nativeAuthApi(nativeRequest('/api/native-auth/signin',{email:' MEMBER@example.invalid ',password}),s.env);assert.equal(signedIn.status,200);
  const app=await signedIn.json();assert.deepEqual(app.membership,{plan:'community',status:'active'});
  assert.equal((await(await nativeAuthApi(nativeRequest('/api/native-auth/session',undefined,app.token,'GET'),s.env)).json()).membership.joinedAt,joined);
  assert.equal(count(s,'community_memberships'),1);assert.equal(membership(s).source,'career');assert.equal(count(s,'app_email_enrollments'),0);
  const token=mails.find(mail=>mail.subject.includes('resource emails')).text.match(/#confirm\/([a-f0-9]{64})/)[1];
  assert.equal((await resourcesApi(request('/api/resource-preferences',{action:'confirm',token}),s.env)).status,200);
  const unsubscribe=s.raw.prepare('SELECT unsubscribe_token FROM resource_subscribers').get().unsubscribe_token;
  assert.equal((await resourcesApi(request('/api/resource-preferences',{action:'unsubscribe',token:unsubscribe}),s.env)).status,200);
  assert.equal(count(s,'community_memberships'),1);assert.equal(s.raw.prepare('SELECT status FROM resource_subscribers').get().status,'unsubscribed');
  assert.equal((await readerAuthApi(request('/api/reader-auth/signin',{email,password}),s.env)).status,200);
  assert.equal(s.raw.prepare('SELECT status FROM resource_subscribers').get().status,'unsubscribed','membership does not resubscribe email');
 });
});

test('a resource signup enrolls immediately but email confirmation does not create account access',async()=>{
 const s=setup();await withEmail(s,async mails=>{
  await resourcesApi(request('/api/resource-signups',resource()),s.env);assert.equal(membership(s).source,'resources');assert.equal(membership(s).account_id,null);
  const token=mails[0].text.match(/#confirm\/([a-f0-9]{64})/)[1];await resourcesApi(request('/api/resource-preferences',{action:'confirm',token}),s.env);
  assert.ok(membership(s).verified_at);assert.equal(membership(s).account_id,null);assert.equal(count(s,'reader_accounts'),0);
  assert.equal((await(await readerProgressApi(request('/api/reader-progress',undefined,{},'GET'),s.env)).json()).user,null);
 });
});

test('invalid forms, failed authentication, and failed account email delivery never enroll',async()=>{
 const s=setup();
 assert.equal((await careersApi(request('/api/career-submissions',career('invalid')),s.env,s.ctx)).status,400);
 assert.equal((await contributionsApi(request('/api/community-contributions',{...contribution(),consent:false}),s.env,s.ctx)).status,400);
 assert.equal((await resourcesApi(request('/api/resource-signups',{...resource(),website:'bot'}),s.env)).status,400);
 assert.equal((await readerAuthApi(request('/api/reader-auth/signin',{email,password}),s.env)).status,401);
 assert.equal((await nativeAuthApi(nativeRequest('/api/native-auth/signin',{email,password}),s.env)).status,401);
 assert.equal((await readerAuthApi(request('/api/reader-auth/request',{email,consent:true},{origin:'https://other.invalid'}),s.env)).status,403);
 await withEmail(s,async()=>{globalThis.fetch=async()=>new Response('{}',{status:503});assert.equal((await readerAuthApi(request('/api/reader-auth/request',{email,consent:true}),s.env)).status,502)});
 assert.equal(count(s,'community_memberships'),0);assert.equal(count(s,'reader_sessions'),0);
});

test('rate-limited submissions never create memberships',async()=>{
 const s=setup();for(let i=0;i<5;i++)assert.equal((await careersApi(request('/api/career-submissions',career(`career${i}@example.invalid`)),s.env,s.ctx)).status,201);
 assert.equal((await careersApi(request('/api/career-submissions',career()),s.env,s.ctx)).status,429);assert.equal(membership(s),undefined);
 for(let i=0;i<5;i++)assert.equal((await contributionsApi(request('/api/community-contributions',contribution(`contributor${i}@example.invalid`)),s.env,s.ctx)).status,201);
 assert.equal((await contributionsApi(request('/api/community-contributions',contribution()),s.env,s.ctx)).status,429);assert.equal(membership(s),undefined);await s.drain();
 await withEmail(s,async()=>{for(let i=0;i<10;i++)assert.equal((await resourcesApi(request('/api/resource-signups',resource(`resource${i}@example.invalid`)),s.env)).status,202);
  assert.equal((await resourcesApi(request('/api/resource-signups',resource()),s.env)).status,429);assert.equal(membership(s),undefined);});
});

test('membership storage failure rolls back contact submissions and their notifications',async()=>{
 const s=setup();s.raw.exec("CREATE TRIGGER reject_membership BEFORE INSERT ON community_memberships BEGIN SELECT RAISE(ABORT, 'test storage failure'); END;");
 assert.equal((await careersApi(request('/api/career-submissions',career()),s.env,s.ctx)).status,503);
 assert.equal((await contributionsApi(request('/api/community-contributions',contribution()),s.env,s.ctx)).status,503);
 for(const table of ['career_records','career_notifications','community_contributions','community_notifications','community_memberships'])assert.equal(count(s,table),0);
});
