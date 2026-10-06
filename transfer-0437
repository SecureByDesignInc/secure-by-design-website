import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';
import {realpathSync} from 'node:fs';
const require=createRequire(realpathSync(new URL('../node_modules/wrangler/package.json',import.meta.url)));
const {Miniflare}=require('miniflare');
const {build}=require('esbuild');
const bundle=await build({stdin:{contents:`import {readerAuthApi} from './server/reader-auth.js';import {readerProgressApi} from './server/reader-progress.js';import {nativeAuthApi} from './server/native-auth.js';export default {fetch(request,env){const path=new URL(request.url).pathname;return path.startsWith('/api/native-auth/')?nativeAuthApi(request,env):path.startsWith('/api/reader-auth/')?readerAuthApi(request,env):readerProgressApi(request,env)}}`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'neutral',external:['node:*']});
let code;
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{RESEND_API_KEY:'test-only',NOTIFICATION_FROM:'test@example.invalid'},outboundService:async request=>{assert.equal(new URL(request.url).hostname,'api.resend.com');const mail=await request.json();assert.deepEqual(mail.to,['worker-test@example.invalid']);code=mail.text.match(/\b\d{8}\b/)[0];return Response.json({id:'simulated-email'})}});
const origin='https://securebydesigninc.com',password='a workers runtime test password';
async function call(path,body,cookie='',method='POST'){return mf.dispatchFetch(origin+path,{method,headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.77',cookie},...(body?{body:JSON.stringify(body)}:{})});}
try{
 const db=await mf.getD1Database('DB');
 for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.exec(sql.replace(/\r?\n/g,' '));
 const requested=await call('/api/reader-auth/request',{email:'worker-test@example.invalid',consent:true,purpose:'create'});assert.equal(requested.status,202,await requested.text());assert.ok(code);
 const challenge=requested.headers.get('set-cookie').split(';')[0];
 const verified=await call('/api/reader-auth/verify',{code,password,confirmPassword:password},challenge);assert.equal(verified.status,200,await verified.text());
 const cookie=verified.headers.get('set-cookie').split(';')[0];
 assert.equal((await call('/api/reader-progress/rmf:prepare',{status:'completed'},cookie,'PUT')).status,200);
 const signed=await call('/api/reader-auth/signin',{email:'worker-test@example.invalid',password});assert.equal(signed.status,200,await signed.text());
 const restored=await (await call('/api/reader-progress',null,signed.headers.get('set-cookie').split(';')[0],'GET')).json();assert.equal(restored.records[0].status,'completed');assert.equal(restored.user.needsPassword,false);
 assert.equal((await call('/api/reader-auth/signin',{email:'worker-test@example.invalid',password:'wrong password'})).status,401);
 const native=await mf.dispatchFetch(origin+'/api/native-auth/signin',{method:'POST',headers:{'x-sbd-client':'native-v1','content-type':'application/json','cf-connecting-ip':'192.0.2.77'},body:JSON.stringify({email:'worker-test@example.invalid',password})});assert.equal(native.status,200,await native.clone().text());
 const session=await native.json();assert.match(session.token,/^[a-f0-9]{64}$/);
 const headers={'x-sbd-client':'native-v1',authorization:'Bearer '+session.token};
 assert.equal((await mf.dispatchFetch(origin+'/api/native-auth/session',{headers})).status,200);
 const denied=await (await call('/api/reader-progress',null,'__Host-sbd_reader='+session.token,'GET')).json();assert.equal(denied.user,null);
 assert.equal((await mf.dispatchFetch(origin+'/api/native-auth/signout',{method:'POST',headers})).status,200);
 assert.equal((await mf.dispatchFetch(origin+'/api/native-auth/session',{headers})).status,401);
 console.log('Workers runtime: verified signup, web/native scrypt sign-in, isolated bearer sessions, logout, wrong-password rejection, and cross-session progress restoration passed. Email was simulated.');
}finally{await mf.dispose();}
