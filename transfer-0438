import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readerProgressApi} from '../server/reader-progress.js';
const origin='https://securebydesigninc.com';
const password='a unique test passphrase';
const passwordFields={password,confirmPassword:password};
function setup(){const raw=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(fs.readFileSync('drizzle/'+file,'utf8'));const DB={prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){return raw.prepare(sql).get(...args)||null},async all(){return{results:raw.prepare(sql).all(...args)}},async run(){return raw.prepare(sql).run(...args)}}},async batch(statements){raw.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());raw.exec('COMMIT');return out}catch(e){raw.exec('ROLLBACK');throw e}}};for(const user of ['alice','bob']){raw.prepare('INSERT INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run(user,user+'@example.invalid',new Date().toISOString());raw.prepare('INSERT INTO reader_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').run(createHash('sha256').update(user==='alice'?'a'.repeat(64):'b'.repeat(64)).digest('hex'),user,new Date(Date.now()+86400000).toISOString())}return{DB,raw};}
function req(user,method='GET',path='',body,extra={}){return new Request(origin+'/api/reader-progress'+path,{method,headers:{origin,'content-type':'application/json',...(user?{cookie:'__Host-sbd_reader='+(user==='alice'?'a'.repeat(64):'b'.repeat(64))}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)})}
const profile={experience:'new',goal:'rmf',pace:'short'};
test('anonymous readers see no account and cannot save',async()=>{const env=setup();assert.equal((await(await readerProgressApi(req(null),env)).json()).user,null);assert.equal((await readerProgressApi(req(null,'PUT','/rmf:prepare',{status:'completed'}),env)).status,401);});
test('progress and profile persist and are isolated by authenticated identity',async()=>{const env=setup();assert.equal((await readerProgressApi(req('alice','PUT','/rmf:prepare',{status:'completed'}),env)).status,200);await readerProgressApi(req('alice','PUT','/profile',profile),env);await readerProgressApi(req('bob','PUT','/rmf:prepare',{status:'in_progress'}),env);const alice=await(await readerProgressApi(req('alice'),env)).json();assert.equal(alice.records[0].status,'completed');assert.deepEqual(alice.profile,profile);const bob=await(await readerProgressApi(req('bob'),env)).json();assert.equal(bob.records[0].status,'in_progress');assert.equal(bob.profile,null);await readerProgressApi(req('alice','PUT','/rmf:prepare',{status:'completed'}),env);assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_progress').get().n,2);const response=await readerProgressApi(req('alice'),env);assert.match(response.headers.get('cache-control'),/no-store/);});
test('rejects cross-origin writes, unrecognized items, statuses and client-supplied ownership',async()=>{const env=setup();for(const [path,body] of [['/unknown',{status:'completed'}],['/rmf:prepare',{status:'other'}],['/rmf:prepare',{status:'completed',userId:'bob'}],['/profile',{...profile,goal:'unknown'}]])assert.equal((await readerProgressApi(req('alice','PUT',path,body),env)).status,400);for(const origin of ['https://evil.invalid','null',''])assert.equal((await readerProgressApi(req('alice','PUT','/rmf:prepare',{status:'completed'},{origin}),env)).status,403);assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_progress').get().n,0);});
test('clearing progress deletes only the current reader and supports re-enrollment',async()=>{const env=setup();for(const user of ['alice','bob']){await readerProgressApi(req(user,'PUT','/rmf:prepare',{status:'completed'}),env);await readerProgressApi(req(user,'PUT','/profile',profile),env)}assert.equal((await readerProgressApi(req('alice','DELETE'),env)).status,200);const alice=await(await readerProgressApi(req('alice'),env)).json();assert.equal(alice.records.length,0);assert.equal(alice.profile,null);assert.equal((await(await readerProgressApi(req('bob'),env)).json()).records.length,1);assert.equal((await readerProgressApi(req('alice','PUT','/profile',profile),env)).status,200);});
test('storage failures report unavailable without claiming a save',async()=>{assert.equal((await readerProgressApi(req('alice'),{})).status,503);const env=setup();env.raw.exec('DROP TABLE reader_progress');assert.equal((await readerProgressApi(req('alice','PUT','/rmf:prepare',{status:'completed'}),env)).status,503);});
import {readerAuthApi,getReader} from '../server/reader-auth.js';
function authReq(path,data,cookie='',extra={}){return new Request(origin+'/api/reader-auth/'+path,{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.99',cookie,...extra},body:data===undefined?undefined:JSON.stringify(data)})}
async function challenge(env,purpose='create'){env.RESEND_API_KEY='test';env.NOTIFICATION_FROM='test@example.invalid';let code;const old=globalThis.fetch;try{globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');const mail=JSON.parse(options.body);assert.deepEqual(mail.to,['reader@example.invalid']);code=mail.text.match(/\b\d{8}\b/)[0];return Response.json({id:'test-receipt'})};const response=await readerAuthApi(authReq('request',{email:'reader@example.invalid',consent:true,purpose}),env);assert.equal(response.status,202);assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Lax; Max-Age=600; Secure/);return{code,cookie:response.headers.get('set-cookie').split(';')[0]}}finally{globalThis.fetch=old}}
test('email verification creates an account, uses one-time codes, and logout revokes the session',async()=>{const env=setup();const {code,cookie}=await challenge(env);assert.equal(env.raw.prepare("SELECT count(*) n FROM reader_accounts WHERE email='reader@example.invalid'").get().n,0);assert.equal((await readerAuthApi(authReq('verify',{code,...passwordFields}),env)).status,400);const signed=await readerAuthApi(authReq('verify',{code,...passwordFields},cookie),env);assert.equal(signed.status,200);const session=signed.headers.get('set-cookie').split(';')[0];assert.ok(session.startsWith('__Host-sbd_reader='));assert.match(signed.headers.get('set-cookie'),/HttpOnly/);assert.equal((await getReader(authReq('anything',{},session),env)).email,'reader@example.invalid');assert.equal((await readerAuthApi(authReq('verify',{code,...passwordFields},cookie),env)).status,400);assert.equal((await readerAuthApi(authReq('signout',{},session),env)).status,200);assert.equal(await getReader(authReq('anything',{},session),env),null);});
test('codes expire and lock after five wrong guesses; sign-in requests are rate limited',async()=>{const env=setup();const {code,cookie}=await challenge(env);const wrong=code==='00000000'?'11111111':'00000000';for(let i=0;i<5;i++)assert.equal((await readerAuthApi(authReq('verify',{code:wrong,...passwordFields},cookie),env)).status,400);assert.equal((await readerAuthApi(authReq('verify',{code,...passwordFields},cookie),env)).status,400);assert.equal((await readerAuthApi(authReq('request',{email:'reader@example.invalid',consent:true}),env)).status,429);const env2=setup(),second=await challenge(env2);env2.raw.prepare("UPDATE reader_challenges SET expires_at='2000-01-01'").run();assert.equal((await readerAuthApi(authReq('verify',{code:second.code,...passwordFields},second.cookie),env2)).status,400);});
test('email failure never creates an account; forged ChatGPT identity is not a reader session',async()=>{const env=setup();env.RESEND_API_KEY='test';env.NOTIFICATION_FROM='test@example.invalid';const old=globalThis.fetch;try{globalThis.fetch=async()=>new Response('{}',{status:503});assert.equal((await readerAuthApi(authReq('request',{email:'reader@example.invalid',consent:true}),env)).status,502);assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_challenges').get().n,0)}finally{globalThis.fetch=old}const forged=new Request(origin+'/api/reader-progress',{headers:{'oai-authenticated-user-id':'alice','oai-authenticated-user-email':'alice@example.invalid'}});assert.equal((await(await readerProgressApi(forged,env)).json()).user,null);assert.equal((await readerAuthApi(authReq('signout',{},'',{origin:'https://evil.invalid'}),env)).status,403);});


test('password is mandatory; mismatches and short passwords cannot create an account',async()=>{
 const env=setup(),{code,cookie}=await challenge(env);
 for(const value of [{code},{code,password:'short',confirmPassword:'short'},{code,password,confirmPassword:'a different test password'}])assert.equal((await readerAuthApi(authReq('verify',value,cookie),env)).status,400);
 assert.equal(env.raw.prepare("SELECT count(*) n FROM reader_accounts WHERE email='reader@example.invalid'").get().n,0);
 const signed=await readerAuthApi(authReq('verify',{code,...passwordFields},cookie),env);assert.equal(signed.status,200);
 const stored=env.raw.prepare("SELECT password_hash FROM reader_accounts WHERE email='reader@example.invalid'").get().password_hash;
 assert.match(stored,/^scrypt\$16384\$8\$5\$/);assert.ok(!stored.includes(password));
});

test('password sign-in restores progress in another session and rejects wrong or unknown credentials',async()=>{
 const env=setup(),{code,cookie}=await challenge(env);
 const signed=await readerAuthApi(authReq('verify',{code,...passwordFields},cookie),env);
 const session=signed.headers.get('set-cookie').split(';')[0];
 await readerProgressApi(new Request(origin+'/api/reader-progress/rmf:prepare',{method:'PUT',headers:{origin,cookie:session,'content-type':'application/json'},body:JSON.stringify({status:'completed'})}),env);
 for(const value of [{email:'reader@example.invalid',password:'wrong password'},{email:'unknown@example.invalid',password}])assert.equal((await readerAuthApi(authReq('signin',value),env)).status,401);
 const next=await readerAuthApi(authReq('signin',{email:' READER@example.invalid ',password}),env);assert.equal(next.status,200);
 const restored=await (await readerProgressApi(new Request(origin+'/api/reader-progress',{headers:{cookie:next.headers.get('set-cookie').split(';')[0]}}),env)).json();
 assert.equal(restored.records[0].status,'completed');assert.equal(restored.user.needsPassword,false);
 assert.equal((await readerAuthApi(authReq('signin',{email:'reader@example.invalid',password},'',{origin:'https://evil.invalid'}),env)).status,403);
});

test('legacy accounts retain their identity and progress when setting a password',async()=>{
 const env=setup();env.raw.prepare("UPDATE reader_accounts SET email='reader@example.invalid' WHERE id='alice'").run();
 await readerProgressApi(req('alice','PUT','/rmf:prepare',{status:'completed'}),env);
 assert.equal((await (await readerProgressApi(req('alice'),env)).json()).user.needsPassword,true);
 const {code,cookie}=await challenge(env,'reset');
 const signed=await readerAuthApi(authReq('verify',{code,...passwordFields},cookie),env);assert.equal(signed.status,200);
 assert.equal(env.raw.prepare("SELECT id FROM reader_accounts WHERE email='reader@example.invalid'").get().id,'alice');
 assert.equal(env.raw.prepare("SELECT status FROM reader_progress WHERE user_id='alice'").get().status,'completed');
 assert.equal(await getReader(req('alice'),env),null);
});

test('recovery changes the password, revokes older sessions and invalidates other codes',async()=>{
 const env=setup(),first=await challenge(env);const signed=await readerAuthApi(authReq('verify',{code:first.code,...passwordFields},first.cookie),env);
 env.raw.exec('DELETE FROM reader_auth_limits');const recovery=await challenge(env,'reset');
 const changed='a different long test passphrase';
 assert.equal((await readerAuthApi(authReq('verify',{code:recovery.code,password:changed,confirmPassword:changed},recovery.cookie),env)).status,200);
 assert.equal(await getReader(authReq('signout',{},signed.headers.get('set-cookie').split(';')[0]),env),null);
 assert.equal((await readerAuthApi(authReq('signin',{email:'reader@example.invalid',password}),env)).status,401);
 assert.equal((await readerAuthApi(authReq('signin',{email:'reader@example.invalid',password:changed}),env)).status,200);
 assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_challenges').get().n,0);
});

test('creating again cannot replace an existing password; recovery does not create unknown accounts',async()=>{
 const env=setup(),first=await challenge(env);await readerAuthApi(authReq('verify',{code:first.code,...passwordFields},first.cookie),env);
 const before=env.raw.prepare("SELECT password_hash FROM reader_accounts WHERE email='reader@example.invalid'").get().password_hash;
 env.raw.exec('DELETE FROM reader_auth_limits');const next=await challenge(env);
 assert.equal((await readerAuthApi(authReq('verify',{code:next.code,...passwordFields},next.cookie),env)).status,409);
 assert.equal(env.raw.prepare("SELECT password_hash FROM reader_accounts WHERE email='reader@example.invalid'").get().password_hash,before);
 const fresh=setup(),recovery=await challenge(fresh,'reset');
 assert.equal((await readerAuthApi(authReq('verify',{code:recovery.code,...passwordFields},recovery.cookie),fresh)).status,409);
});

test('password guesses are rate limited and password hashes never leave the API',async()=>{
 const env=setup();for(let i=0;i<10;i++)assert.equal((await readerAuthApi(authReq('signin',{email:'alice@example.invalid',password:'a wrong password'}),env)).status,401);
 assert.equal((await readerAuthApi(authReq('signin',{email:'alice@example.invalid',password:'a wrong password'}),env)).status,429);
 assert.ok(!(await (await readerProgressApi(req('alice'),env)).text()).includes('password_hash'));
});
