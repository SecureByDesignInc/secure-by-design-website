import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {nativeAuthApi,getNativeReader} from '../server/native-auth.js';
import {nativeOnboardingApi} from '../server/native-onboarding.js';
import {readerAuthApi,getReader,digest} from '../server/reader-auth.js';
import {hashPassword} from '../server/reader-password.js';
const origin='https://securebydesigninc.com',password='native account testing passphrase';
const passwordHash=await hashPassword(password);
function setup(){
 const raw=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(readFileSync('drizzle/'+f,'utf8'));
 const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this},async first(){return raw.prepare(sql).get(...values)||null},async run(){return raw.prepare(sql).run(...values)}}},async batch(statements){raw.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};
 raw.prepare('INSERT INTO reader_accounts(id,email,created_at,password_hash) VALUES (?,?,?,?)').run('reader','reader@example.invalid',new Date().toISOString(),passwordHash);
 return {raw,DB};
}
function req(path,body,token,method='POST',headers={}){return new Request(origin+path,{method,headers:{'x-sbd-client':'native-v1','content-type':'application/json','cf-connecting-ip':'192.0.2.10',...(token?{authorization:'Bearer '+token}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})})}
async function signin(env){const r=await nativeAuthApi(req('/api/native-auth/signin',{email:'reader@example.invalid',password}),env);assert.equal(r.status,200);return r.json()}

test('native sign-in issues only a hashed, time-limited bearer session',async()=>{
 const env=setup();const response=await nativeAuthApi(req('/api/native-auth/signin',{email:' READER@example.invalid ',password}),env);assert.equal(response.status,200);assert.equal(response.headers.get('set-cookie'),null);assert.match(response.headers.get('cache-control'),/no-store/);
 const body=await response.json();assert.match(body.token,/^[a-f0-9]{64}$/);assert.deepEqual(body.user,{id:'reader',email:'reader@example.invalid'});assert.ok(Date.parse(body.expiresAt)-Date.now()<=12*3600000);
 const session=env.raw.prepare('SELECT * FROM reader_sessions').get();assert.equal(session.token_hash,await digest(body.token));assert.equal(session.client_kind,'native');assert.notEqual(session.token_hash,body.token);
 assert.equal((await getNativeReader(req('/api/native-auth/session',null,body.token,'GET'),env)).id,'reader');
 assert.equal((await nativeAuthApi(req('/api/native-auth/session',null,body.token,'GET'),env)).status,200);
});
test('unknown, incorrect and legacy accounts cannot create native sessions',async()=>{
 const env=setup();for(const values of [{email:'nobody@example.invalid',password},{email:'reader@example.invalid',password:'incorrect'}])assert.equal((await nativeAuthApi(req('/api/native-auth/signin',values),env)).status,401);
 env.raw.exec('UPDATE reader_accounts SET password_hash=NULL');assert.equal((await nativeAuthApi(req('/api/native-auth/signin',{email:'reader@example.invalid',password}),env)).status,401);assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_sessions').get().n,0);
});
test('browser and native session credentials are not interchangeable',async()=>{
 const env=setup(),native=await signin(env);
 const nativeCookie=new Request(origin+'/api/reader-progress',{headers:{cookie:'__Host-sbd_reader='+native.token}});assert.equal(await getReader(nativeCookie,env),null);
 const web=await readerAuthApi(new Request(origin+'/api/reader-auth/signin',{method:'POST',headers:{origin,'cf-connecting-ip':'192.0.2.10','content-type':'application/json'},body:JSON.stringify({email:'reader@example.invalid',password})}),env);assert.equal(web.status,200);
 const cookie=web.headers.get('set-cookie').split(';')[0];assert.ok(await getReader(new Request(origin,{headers:{cookie}}),env));
 assert.equal(await getNativeReader(req('/api/native-auth/session',null,cookie.split('=')[1],'GET'),env),null);
 assert.equal(await getNativeReader(req('/api/native-auth/session',null,null,'GET',{cookie}),env),null);
});
test('native routes reject browser origins and unversioned requests',async()=>{
 const env=setup();for(const headers of [{origin},{origin:'https://evil.invalid'},{'sec-fetch-site':'same-origin'},{'x-sbd-client':''}])assert.equal((await nativeAuthApi(req('/api/native-auth/signin',{email:'reader@example.invalid',password},null,'POST',headers),env)).status,403);
 assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_sessions').get().n,0);
});
test('sign-out and session expiration revoke native access',async()=>{
 const env=setup(),one=await signin(env);assert.equal((await nativeAuthApi(req('/api/native-auth/signout',null,one.token),env)).status,200);assert.equal(await getNativeReader(req('/api/native-auth/session',null,one.token),env),null);
 const two=await signin(env);env.raw.exec("UPDATE reader_sessions SET expires_at='2000-01-01'");assert.equal((await nativeAuthApi(req('/api/native-auth/session',null,two.token,'GET'),env)).status,401);
});
test('password reset through the existing website revokes native sessions',async()=>{
 const env=setup(),session=await signin(env),challenge='a'.repeat(64),code='12345678';
 env.raw.prepare('INSERT INTO reader_challenges(id,email,code_hash,attempts,expires_at,purpose) VALUES (?,?,?,0,?,?)').run(challenge,'reader@example.invalid',await digest(challenge+':'+code),new Date(Date.now()+600000).toISOString(),'reset');
 const next='a different recovery passphrase';const result=await readerAuthApi(new Request(origin+'/api/reader-auth/verify',{method:'POST',headers:{origin,'content-type':'application/json',cookie:'__Host-sbd_challenge='+challenge},body:JSON.stringify({code,password:next,confirmPassword:next})}),env);assert.equal(result.status,200);
 assert.equal(await getNativeReader(req('/api/native-auth/session',null,session.token),env),null);
});
test('native and browser sign-ins share the same brute-force limit',async()=>{
 const env=setup();for(let i=0;i<10;i++)assert.equal((await nativeAuthApi(req('/api/native-auth/signin',{email:'reader@example.invalid',password:'wrong'}),env)).status,401);
 const response=await readerAuthApi(new Request(origin+'/api/reader-auth/signin',{method:'POST',headers:{origin,'cf-connecting-ip':'192.0.2.10','content-type':'application/json'},body:JSON.stringify({email:'reader@example.invalid',password})}),env);assert.equal(response.status,429);
});
test('native email enrollment is disabled by default and only uses verified bearer identity',async()=>{
 const env=setup(),session=await signin(env);const request=()=>req('/api/native-onboarding',{consent:true,consentVersion:'app-onboarding-v1'},session.token);
 assert.equal((await nativeOnboardingApi(request(),env)).status,503);
 env.APP_ONBOARDING_EMAIL_ENABLED='true';env.RESEND_API_KEY='existing-signin-key';
 assert.equal((await nativeOnboardingApi(request(),env)).status,503);
 env.RESEND_AUTOMATIONS_API_KEY='test-only';let calls=0;const old=globalThis.fetch;
 try{globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,'https://api.resend.com/events/send');const body=JSON.parse(init.body);assert.equal(body.email,'reader@example.invalid');assert.ok(!('password' in body));return new Response('',{status:202})};
 assert.equal((await nativeOnboardingApi(req('/api/native-onboarding',{consent:true,consentVersion:'app-onboarding-v1'}),env)).status,401);
 assert.equal((await nativeOnboardingApi(request(),env)).status,202);assert.equal((await nativeOnboardingApi(request(),env)).status,200);assert.equal(calls,1);
 }finally{globalThis.fetch=old}
});
