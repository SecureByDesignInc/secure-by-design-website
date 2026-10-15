import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {digest} from '../server/reader-auth.js';
import {nativeProgressApi} from '../server/native-progress.js';
import {readerProgressApi} from '../server/reader-progress.js';
const origin='https://securebydesigninc.com',id='training:dc01-dc02:prepare';
async function setup(){
 const raw=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(readFileSync('drizzle/'+file,'utf8'));
 const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return raw.prepare(sql).get(...args)||null},async all(){return {results:raw.prepare(sql).all(...args)}},async run(){return raw.prepare(sql).run(...args)}}},async batch(statements){raw.exec('BEGIN');try{for(const statement of statements)await statement.run();raw.exec('COMMIT')}catch(error){raw.exec('ROLLBACK');throw error}}};
 for(const [user,native,browser] of [['alice','a','c'],['bob','b','d']]){
  raw.prepare('INSERT INTO reader_accounts(id,email,created_at,password_hash) VALUES (?,?,?,?)').run(user,user+'@example.invalid',new Date().toISOString(),'test-only');
  for(const [token,kind] of [[native,'native'],[browser,'browser']])raw.prepare('INSERT INTO reader_sessions(token_hash,account_id,expires_at,client_kind) VALUES (?,?,?,?)').run(await digest(token.repeat(64)),user,new Date(Date.now()+600000).toISOString(),kind);
 }return {raw,DB};
}
const native=(data={records:[],bookmarks:[]},token='a',headers={})=>new Request(origin+'/api/native-progress',{method:'POST',headers:{'x-sbd-client':'native-v1','content-type':'application/json',authorization:'Bearer '+token.repeat(64),...headers},body:JSON.stringify(data)});
const web=(method='GET',path='',data,token='c')=>new Request(origin+'/api/reader-progress'+path,{method,headers:{origin,'content-type':'application/json',cookie:'__Host-sbd_reader='+token.repeat(64)},...(data?{body:JSON.stringify(data)}:{})});

test('native and browser share course progress and bookmarks, isolated by account',async()=>{
 const env=await setup();const result=await nativeProgressApi(native({records:[{id,status:'completed'},{id:'native:ad-1',status:'completed'}],bookmarks:[{id:'dc-pdf',saved:true}]}),env);assert.equal(result.status,200);assert.equal((await result.json()).accountId,'alice');
 const browser=await(await readerProgressApi(web(),env)).json();assert.equal(browser.records.find(r=>r.id===id).status,'completed');assert.equal(browser.bookmarks[0].saved,true);
 assert.deepEqual((await(await nativeProgressApi(native(undefined,'b'),env)).json()).records,[]);
 await readerProgressApi(web('PUT','/'+encodeURIComponent('training:rmf-boe-ato:01'),{status:'completed'}),env);
 await readerProgressApi(web('PUT','/bookmarks/dc-pdf',{saved:false}),env);
 const next=await(await nativeProgressApi(native(),env)).json();assert.equal(next.records.find(r=>r.id==='training:rmf-boe-ato:01').status,'completed');assert.equal(next.bookmarks[0].saved,false);
 await readerProgressApi(web('DELETE'),env);assert.deepEqual((await(await nativeProgressApi(native(),env)).json()).records,[]);
});
test('completion resists a delayed start update; removed bookmarks stay removed',async()=>{
 const env=await setup();await nativeProgressApi(native({records:[{id,status:'completed'}],bookmarks:[{id:'dc-guide',saved:true}]}),env);
 const result=await(await nativeProgressApi(native({records:[{id,status:'in_progress'}],bookmarks:[{id:'dc-guide',saved:false}]}),env)).json();assert.equal(result.records[0].status,'completed');assert.equal(result.bookmarks[0].saved,false);
});
test('native sync rejects browser credentials, spoofed owners, invalid IDs and partial batches',async()=>{
 const env=await setup();assert.equal((await nativeProgressApi(native(undefined,'c'),env)).status,401);
 for(const headers of [{origin},{'sec-fetch-site':'same-origin'},{'x-sbd-client':''}])assert.equal((await nativeProgressApi(native(undefined,'a',headers),env)).status,403);
 for(const body of [
  {records:[],bookmarks:[],accountId:'bob'},
  {records:[{id,status:'completed',userId:'bob'}],bookmarks:[]},
  {records:[{id,status:'completed'},{id:'unknown',status:'completed'}],bookmarks:[]},
  {records:[{id,status:'completed'},{id,status:'in_progress'}],bookmarks:[]},
  {records:[],bookmarks:[{id:'dc-pdf',saved:'true'}]},
  {records:[],bookmarks:[{id:'unknown',saved:true}]}
 ])assert.equal((await nativeProgressApi(native(body),env)).status,400);
 assert.equal(env.raw.prepare('SELECT count(*) n FROM reader_progress').get().n,0);
 env.raw.exec("UPDATE reader_sessions SET expires_at='2000-01-01'");assert.equal((await nativeProgressApi(native(),env)).status,401);
});
test('sync leaves archived reading and bookmark records intact',async()=>{
 const env=await setup();env.raw.prepare('INSERT INTO reader_progress VALUES (?,?,?,?)').run('alice','article:what-is-active-directory','completed','2026-01-01');
 await nativeProgressApi(native({records:[],bookmarks:[{id:'journal',saved:true}]}),env);
 assert.equal(env.raw.prepare('SELECT status FROM reader_progress WHERE item_id=?').get('article:what-is-active-directory').status,'completed');
 const data=await(await readerProgressApi(web(),env)).json();assert.deepEqual(data.bookmarks,[]);assert.equal(env.raw.prepare('SELECT saved FROM reader_bookmarks WHERE item_id=?').get('journal').saved,1);
});
test('lessons that moved to another course keep their saved progress (October 2026 restructure)',async()=>{
 // Older app builds still send a moved lesson's old identifier: it is translated and merged with the new one.
 const env=await setup();
 const result=await nativeProgressApi(native({records:[{id:'training:harden-baseline:staging',status:'completed'},{id:'training:stig-scap:staging',status:'in_progress'},{id:'training:patch-protect:epo',status:'completed'}],bookmarks:[]}),env);
 assert.equal(result.status,200);
 assert.deepEqual((await result.json()).records.map(r=>[r.id,r.status]),[['training:stig-scap:staging','completed']]);
 // The migration carries records saved under the old identifiers; a completed record wins.
 env.raw.prepare('INSERT INTO reader_progress (user_id,item_id,status,updated_at) VALUES (?,?,?,?)').run('bob','training:dns-configuration:time','completed','2026-10-01T00:00:00.000Z');
 env.raw.prepare('INSERT INTO reader_progress (user_id,item_id,status,updated_at) VALUES (?,?,?,?)').run('bob','training:domain-time:time','in_progress','2026-10-02T00:00:00.000Z');
 env.raw.exec(readFileSync('drizzle/0013_course_split.sql','utf8'));
 assert.deepEqual(env.raw.prepare("SELECT item_id, status FROM reader_progress WHERE user_id='bob' ORDER BY item_id").all().map(r=>[r.item_id,r.status]),[['training:domain-time:time','completed']]);
});
