import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {rangeApi} from '../server/range.js';
import {deleteAccount} from '../server/account-deletion.js';

const origin='https://securebydesigninc.com';
const token=user=>(user==='alice'?'a':'b').repeat(64);
const questions=JSON.parse(fs.readFileSync('content/range/questions.json','utf8')).questions;
function setup(){
 const raw=new DatabaseSync(':memory:');
 for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())raw.exec(fs.readFileSync('drizzle/'+file,'utf8'));
 const DB={prepare(sql){let args=[];return{bind(...v){args=v.map(x=>x===undefined?null:x);return this},async first(){return raw.prepare(sql).get(...args)||null},async all(){return{results:raw.prepare(sql).all(...args)}},async run(){return raw.prepare(sql).run(...args)}}},async batch(statements){raw.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());raw.exec('COMMIT');return out}catch(e){raw.exec('ROLLBACK');throw e}}};
 for(const user of ['alice','bob']){
  raw.prepare('INSERT INTO reader_accounts (id,email,created_at) VALUES (?,?,?)').run(user,user+'@example.invalid',new Date().toISOString());
  raw.prepare('INSERT INTO reader_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').run(createHash('sha256').update(token(user)).digest('hex'),user,new Date(Date.now()+86400000).toISOString());
 }
 return {DB,raw};
}
const call=async(env,user,method,path='',body,headers={})=>{
 const response=await rangeApi(new Request(origin+'/api/range'+path,{method,headers:{origin,'content-type':'application/json',...(user?{cookie:'__Host-sbd_reader='+token(user)}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)}),env);
 return {status:response.status,data:await response.json(),headers:response.headers};
};
const ok=async(promise,status=200)=>{const r=await promise;assert.equal(r.status,status,JSON.stringify(r.data));return r.data;};


// Owner direction, 30 October 2026: the Range is one battle against the computer; no picker, ladder or points.
test('visitors get the catalog and a battle of seven questions without answers, then check each choice',async()=>{
 const env=setup();
 const catalog=await ok(call(env,null,'GET','/catalog'));
 assert.equal(catalog.rounds,7);assert.equal(catalog.residents.length,6);
 assert.deepEqual(catalog.residents.map(r=>r.id),['fsmo','ttl_zero','root_ca','pcap','baseline','signoff']);
 assert.ok(!JSON.stringify(catalog).includes('"answer"'));
 const battle=await ok(call(env,null,'GET','/battle'));
 assert.equal(battle.questions.length,7);
 assert.equal(new Set(battle.questions.map(q=>q.id)).size,7,'seven different questions');
 for(const q of battle.questions){
  assert.equal(q.options.length,4);assert.equal(q.answer,undefined);assert.equal(q.explanation,undefined);assert.equal(q.lesson,undefined);
  assert.match(q.topic,/^(Identity|Network|Trust|Visibility|Endpoint|Authorization)$/);
 }
 const q=battle.questions[0],full=questions.find(x=>x.id===q.id);
 const right=await ok(call(env,null,'POST','/answer',{id:q.id,choice:full.answer}));
 assert.equal(right.correct,true);assert.equal(right.answer,full.answer);assert.ok(right.explanation);
 const wrong=await ok(call(env,null,'POST','/answer',{id:q.id,choice:'ABCD'.replace(full.answer,'')[0]}));
 assert.equal(wrong.correct,false);assert.equal(wrong.answer,full.answer);
 const timedOut=await ok(call(env,null,'POST','/answer',{id:q.id,choice:''}));
 assert.equal(timedOut.correct,false);
 await ok(call(env,null,'POST','/answer',{id:'nope',choice:'A'}),400);
 // Topics (31 October 2026): listed in the catalog, and a battle can be drawn from one.
 // 1 November 2026: no Network questions in the battle.
 assert.deepEqual(catalog.topics.map(t=>t.name),['Identity','Trust','Visibility','Endpoint','Authorization']);
 await ok(call(env,null,'GET','/battle?topic=Network'),400);
 for(let i=0;i<20;i++)assert.ok((await ok(call(env,null,'GET','/battle'))).questions.every(q=>q.topic!=='Network'));
 const network=questions.find(q=>q.system==='l3-router');
 await ok(call(env,null,'POST','/answer',{id:network.id,choice:network.answer}),400);
 for(const t of catalog.topics){
  assert.ok(t.questions>=7,t.name);
  const one=await ok(call(env,null,'GET','/battle?topic='+encodeURIComponent(t.name)));
  assert.equal(one.questions.length,7);assert.ok(one.questions.every(q=>q.topic===t.name),t.name);
 }
 await ok(call(env,null,'GET','/battle?topic=Nope'),400);
 assert.deepEqual(await ok(call(env,null,'GET','/me')),{reader:false});
});

test('a signed-in learner is assigned a random operator and callsign once, kept on the account',async()=>{
 const env=setup();
 const first=await ok(call(env,'alice','GET','/me'));
 assert.equal(first.reader,true);
 assert.match(first.operator.callsign,/^[a-z]+_[a-z]+\d{2,4}$/);
 assert.ok(['visor','hood','headset','goggles'].includes(first.operator.base));
 assert.ok(['cyan','ice','blue'].includes(first.operator.glow),'magenta is the computer\u2019s');
 assert.ok(['none','trace','node'].includes(first.operator.mark));
 const again=await ok(call(env,'alice','GET','/me'));
 assert.deepEqual(again.operator,first.operator,'the same operator every visit');
 const bob=await ok(call(env,'bob','GET','/me'));
 assert.notEqual(bob.operator.callsign,first.operator.callsign);
 assert.equal(env.raw.prepare('SELECT COUNT(*) AS n FROM range_operators').get().n,2);
 // Nothing lets a player choose: the picker, stacks, results, decks and the ladder are gone.
 for(const [method,path] of [['PUT','/operator'],['PUT','/stack'],['POST','/result'],['POST','/deck']])await ok(call(env,'alice',method,path,{}),404);
 for(const path of ['/ladder','/daily','/cards','/question'])await ok(call(env,null,'GET',path),404);
});

test('the answer check refuses cross-site posts, and deleting an account clears its operator',async()=>{
 const env=setup();
 const q=questions[0];
 const forged=await rangeApi(new Request(origin+'/api/range/answer',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:JSON.stringify({id:q.id,choice:'A'})}),env);
 assert.equal(forged.status,403);
 await ok(call(env,'alice','GET','/me'));await ok(call(env,'bob','GET','/me'));
 await deleteAccount(env,{id:'bob',email:'bob@example.invalid'},{fetcher:async()=>new Response('')});
 assert.equal(env.raw.prepare('SELECT COUNT(*) AS n FROM range_operators').get().n,1);
});
