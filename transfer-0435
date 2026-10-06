import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {digest} from '../server/reader-auth.js';
import {nativeActivityApi} from '../server/native-activity.js';
const origin='https://securebydesigninc.com';
async function setup(){
 const raw=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(readFileSync('drizzle/'+file,'utf8'));
 const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return raw.prepare(sql).get(...args)||null},async all(){return {results:raw.prepare(sql).all(...args)}},async run(){return raw.prepare(sql).run(...args)}}},async batch(statements){raw.exec('BEGIN');try{for(const statement of statements)await statement.run();raw.exec('COMMIT')}catch(error){raw.exec('ROLLBACK');throw error}}};
 for(const [user,native,browser] of [['alice','a','c'],['bob','b','d']]){
  raw.prepare('INSERT INTO reader_accounts(id,email,created_at,password_hash) VALUES (?,?,?,?)').run(user,user+'@example.invalid',new Date().toISOString(),'test-only');
  for(const [token,kind] of [[native,'native'],[browser,'browser']])raw.prepare('INSERT INTO reader_sessions(token_hash,account_id,expires_at,client_kind) VALUES (?,?,?,?)').run(await digest(token.repeat(64)),user,new Date(Date.now()+600000).toISOString(),kind);
 }return {raw,DB};
}

const request=(activity=[],after='',token='a',extra={})=>new Request(origin+'/api/native-activity',{method:'POST',headers:{'x-sbd-client':'native-v1','content-type':'application/json',authorization:'Bearer '+token.repeat(64),...extra},body:JSON.stringify({activity,after})});
const event=(day='2026-10-05',lessonId='ad-1',review=false,perfect=false)=>({day,lessonId,review,perfect});

test('activity union is idempotent and isolated; browser credentials cannot write',async()=>{
 const env=await setup();
 for(let i=0;i<2;i++)assert.equal((await nativeActivityApi(request([event()]),env)).status,200);
 await nativeActivityApi(request([event('2026-10-05','ad-1',true,true)]),env);
 const data=await(await nativeActivityApi(request(),env)).json();
 assert.deepEqual(data.activity,[event('2026-10-05','ad-1',false,true)]);
 assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_learning_activity').get().n,1);
 assert.deepEqual((await(await nativeActivityApi(request([],'','b'),env)).json()).activity,[]);
 assert.equal((await nativeActivityApi(request([],'','c'),env)).status,401);
 assert.equal((await nativeActivityApi(request([],'','a',{origin}),env)).status,403);
 assert.equal((await nativeActivityApi(request([],'','a',{'sec-fetch-site':'same-origin'}),env)).status,403);
 env.raw.exec("UPDATE reader_sessions SET expires_at='2000-01-01'");
 assert.equal((await nativeActivityApi(request(),env)).status,401);
});

test('reject invalid dates, future rewards, spoofed ownership and partial invalid batches',async()=>{
 const env=await setup();
 for(const row of [event('2026-02-30'),event('2099-01-01'),event('2026-10-05','unknown'),{...event(),review:'false'},{...event(),userId:'bob'},{...event(),xp:9000}]){
  assert.equal((await nativeActivityApi(request([event('2026-10-04'),row]),env)).status,400);
 }
 assert.equal((await nativeActivityApi(request([event(),event()]),env)).status,400);
 assert.equal((await nativeActivityApi(request([],"2026-10-05|bad"),env)).status,400);
 assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_learning_activity').get().n,0);
});

test('history pages are bounded and preserve every day without overlaps',async()=>{
 const env=await setup();
 const rows=Array.from({length:80},(_,i)=>event(new Date(Date.UTC(2026,5,1+i)).toISOString().slice(0,10)));
 for(let i=0;i<rows.length;i+=12)assert.equal((await nativeActivityApi(request(rows.slice(i,i+12)),env)).status,200);
 const first=await(await nativeActivityApi(request(),env)).json();
 assert.equal(first.activity.length,64);assert.ok(first.nextCursor);
 const second=await(await nativeActivityApi(request([],first.nextCursor),env)).json();
 assert.equal(second.activity.length,16);assert.equal(second.nextCursor,null);
 assert.equal(new Set([...first.activity,...second.activity].map(r=>r.day)).size,80);
 assert.match(env.raw.prepare('EXPLAIN QUERY PLAN SELECT * FROM reader_learning_activity WHERE user_id=? AND activity_key>? ORDER BY activity_key LIMIT 65').all('alice','')[0].detail,/USING INDEX/);
});
