import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {rangeApi} from '../server/range.js';
import {deleteAccount} from '../server/account-deletion.js';
import {createEngine} from '../lib/range/engine.mjs';

const origin='https://securebydesigninc.com';
const token=user=>(user==='alice'?'a':'b').repeat(64);
const content=JSON.parse(fs.readFileSync('content/range/systems.json','utf8'));
const questions=JSON.parse(fs.readFileSync('content/range/questions.json','utf8')).questions;
const E=createEngine(content);
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
const operator={callsign:'ghost_ou',base:'visor',glow:'cyan',mark:'trace'};

test('visitors get the catalog, questions without answers, the answer check and the daily encounter',async()=>{
 const env=setup();
 const catalog=await ok(call(env,null,'GET','/catalog'));
 assert.equal(catalog.systems.length,7);assert.equal(catalog.residents.length,6);assert.ok(catalog.rules.maxTurns);
 assert.ok(!JSON.stringify(catalog).includes('"answer"'));
 const q=await ok(call(env,null,'GET','/question?system=sbd-dc01&move=fsmo-check'));
 assert.equal(q.move,'fsmo-check');assert.equal(q.options.length,4);assert.equal(q.answer,undefined);assert.equal(q.explanation,undefined);
 const full=questions.find(x=>x.id===q.id);
 const wrong=await ok(call(env,null,'POST','/answer',{id:q.id,choice:'ABCD'.replace(full.answer,'')[0]}));
 assert.equal(wrong.correct,false);assert.equal(wrong.answer,full.answer);assert.ok(wrong.explanation);
 const right=await ok(call(env,null,'POST','/answer',{id:q.id,choice:full.answer}));
 assert.equal(right.correct,true);
 const rmf=await ok(call(env,null,'GET','/question?system=sbd-dc01&move=fsmo-check&pool=rmf'));
 assert.equal(rmf.system,'rmf');
 const daily=await ok(call(env,null,'GET','/daily'));
 assert.equal(daily.question.id,E.dailyQuestion(questions).id);assert.equal(daily.answered,undefined);
 const me=await ok(call(env,null,'GET','/me'));
 assert.deepEqual(me,{reader:false});
 const cards=await ok(call(env,null,'GET','/cards?system=splunk'));
 assert.equal(cards.cards.length,10);assert.ok(cards.cards[0].answer);
 assert.equal((await call(env,null,'PUT','/operator',operator)).status,401);
 assert.equal((await call(env,null,'POST','/result',{mode:'sparring',won:true})).status,401);
 assert.equal((await call(env,null,'POST','/answer',{id:q.id,choice:'A'},{origin:'https://evil.example'})).status,403,'mutations need this origin');
});

test('an operator has a unique callsign, a stack of three lab systems, and the callsign changes once a week',async()=>{
 const env=setup();
 const me=await ok(call(env,'alice','PUT','/operator',operator));
 assert.equal(me.operator.callsign,'ghost_ou');assert.equal(me.tier,'Recruit');assert.equal(me.rank,'I');assert.equal(me.weekPoints,0);
 assert.equal((await call(env,'alice','PUT','/operator',{...operator,callsign:'no spaces'})).status,400);
 assert.equal((await call(env,'alice','PUT','/operator',{...operator,base:'crown'})).status,400);
 assert.equal((await call(env,'bob','PUT','/operator',{...operator,callsign:'GHOST_OU'})).status,409,'callsigns are unique regardless of case');
 await ok(call(env,'alice','PUT','/operator',{...operator,glow:'ice'}));
 const renamed=await ok(call(env,'alice','PUT','/operator',{...operator,callsign:'ghost_ou2'}));
 assert.equal(renamed.operator.callsign,'ghost_ou2');
 assert.equal((await call(env,'alice','PUT','/operator',{...operator,callsign:'ghost_ou3'})).status,429,'a second rename inside seven days waits');
 await ok(call(env,'alice','PUT','/operator',{...operator,callsign:'ghost_ou2',glow:'blue'}),200);
 assert.equal((await call(env,'alice','PUT','/stack',{systems:['sbd-dc01','sbd-dc01','epo']})).status,400);
 assert.equal((await call(env,'alice','PUT','/stack',{systems:['sbd-dc01','laptop','epo']})).status,400);
 const stacked=await ok(call(env,'alice','PUT','/stack',{systems:['sbd-dc01','sbd-pki-mgmt01','splunk']}));
 assert.deepEqual(stacked.operator.stack,['sbd-dc01','sbd-pki-mgmt01','splunk']);
 assert.equal((await call(env,'bob','PUT','/stack',{systems:['sbd-dc01','sbd-pki-mgmt01','splunk']})).status,409,'the operator comes first');
});

test('results pay by the rules: badges on a first checkpoint win, capped rematches, runs and sparring per day',async()=>{
 const env=setup();
 await ok(call(env,'alice','PUT','/operator',operator));
 let me=await ok(call(env,'alice','POST','/result',{mode:'checkpoint',resident:'fsmo',won:true}));
 assert.equal(me.awarded,60);assert.equal(me.badge,'fsmo');assert.equal(me.badges.length,1);assert.equal(me.tier,'Operator');assert.equal(me.weekPoints,60);
 me=await ok(call(env,'alice','POST','/result',{mode:'checkpoint',resident:'fsmo',won:true}));
 assert.equal(me.awarded,15,'a rematch win');assert.equal(me.badge,null);assert.equal(me.badges[0].wins,2);
 me=await ok(call(env,'alice','POST','/result',{mode:'checkpoint',resident:'fsmo',won:false}));
 assert.equal(me.awarded,0);
 assert.equal((await call(env,'alice','POST','/result',{mode:'checkpoint',resident:'nobody',won:true})).status,400);
 for(const id of ['ttl_zero','root_ca'])await ok(call(env,'alice','POST','/result',{mode:'checkpoint',resident:id,won:true}));
 me=await ok(call(env,'alice','GET','/me'));
 assert.equal(me.tier,'Defender');assert.equal(me.weekPoints,60+15+60+60);
 me=await ok(call(env,'alice','POST','/result',{mode:'run',cleared:3}));
 assert.equal(me.awarded,60);
 me=await ok(call(env,'alice','POST','/result',{mode:'sparring',won:true}));
 assert.equal(me.awarded,10);
 for(let i=0;i<9;i++)await ok(call(env,'alice','POST','/result',{mode:'sparring',won:true}));
 me=await ok(call(env,'alice','POST','/result',{mode:'sparring',won:true}));
 assert.equal(me.awarded,0,'ten sparring wins a day count');
 me=await ok(call(env,'alice','POST','/result',{mode:'sparring',won:false}));
 assert.equal(me.awarded,0);
 assert.equal(me.lifetimePoints,60+15+60+60+60+100);
 assert.equal(me.rank,'II');
});

test('the daily encounter is one try a day, with a streak, and only today\'s question',async()=>{
 const env=setup();
 await ok(call(env,'alice','PUT','/operator',operator));
 const today=E.dailyQuestion(questions);
 const other=questions.find(q=>q.id!==today.id);
 assert.equal((await call(env,'alice','POST','/result',{mode:'daily',questionId:other.id,choice:'A'})).status,400);
 const played=await ok(call(env,'alice','POST','/result',{mode:'daily',questionId:today.id,choice:today.answer}));
 assert.equal(played.correct,true);assert.equal(played.awarded,5);assert.equal(played.dailyStreak,1);assert.equal(played.dailyAnswered,'correct');
 assert.equal((await call(env,'alice','POST','/result',{mode:'daily',questionId:today.id,choice:today.answer})).status,409);
 const daily=await ok(call(env,'alice','GET','/daily'));
 assert.equal(daily.answered,'correct');assert.equal(daily.streak,1);
});

test('deck reviews schedule the card, level the system and pay two points per ten cards, ten a day',async()=>{
 const env=setup();
 await ok(call(env,'alice','PUT','/operator',operator));
 const splunk=questions.filter(q=>q.system==='splunk');
 assert.equal((await call(env,'alice','POST','/deck',{questionId:splunk[0].id,rating:'perfect'})).status,400);
 assert.equal((await call(env,'alice','POST','/deck',{questionId:'rmf-001',rating:'good'})).status,400,'RMF questions are not deck cards');
 let r=await ok(call(env,'alice','POST','/deck',{questionId:splunk[0].id,rating:'good'}));
 assert.equal(r.intervalDays,5);assert.equal(r.levels.splunk.cards,1);assert.equal(r.awarded,0);
 r=await ok(call(env,'alice','POST','/deck',{questionId:splunk[0].id,rating:'easy'}));
 assert.equal(r.intervalDays,20,'intervals grow on later reviews');
 for(let i=2;i<10;i++)r=await ok(call(env,'alice','POST','/deck',{questionId:splunk[i%10].id,rating:'good'}));
 assert.equal(r.awarded,2,'the tenth card of the day pays');assert.equal(r.weekPoints,2);
 const cards=await ok(call(env,'alice','GET','/cards?system=splunk'));
 assert.ok(cards.cards.find(c=>c.id===splunk[0].id).schedule.reviews===2);
 for(let i=10;i<20;i++)await ok(call(env,'alice','POST','/deck',{questionId:splunk[i%10].id,rating:'again'}));
 r=await ok(call(env,'alice','GET','/me'));
 assert.equal(r.levels.splunk.level,2,'twenty cards reviewed is level 2');
 assert.equal(r.cardsDue,0,'nothing is due yet: Again cards come back in ten minutes, the others in days');
 const again=(await ok(call(env,'alice','GET','/cards?system=splunk'))).cards.find(c=>c.schedule?.intervalDays===0);
 assert.ok(again&&Date.parse(again.schedule.due)-Date.now()<=11*60000);
});

test('the ladder lists the week by points with callsigns only, and deleting an account clears the Range',async()=>{
 const env=setup();
 await ok(call(env,'alice','PUT','/operator',operator));
 await ok(call(env,'bob','PUT','/operator',{...operator,callsign:'nullroute',base:'hood',glow:'magenta'}));
 await ok(call(env,'bob','POST','/result',{mode:'checkpoint',resident:'pcap',won:true}));
 await ok(call(env,'alice','POST','/result',{mode:'sparring',won:true}));
 const ladder=await ok(call(env,'alice','GET','/ladder'));
 assert.deepEqual(ladder.entries.map(e=>[e.place,e.callsign,e.points]),[[1,'nullroute',60],[2,'ghost_ou',10]]);
 assert.deepEqual(ladder.mine,{callsign:'ghost_ou',points:10,place:2});
 assert.ok(!JSON.stringify(ladder).includes('example.invalid'),'no email reaches the ladder');
 const anon=await ok(call(env,null,'GET','/ladder'));
 assert.equal(anon.mine,null);
 await deleteAccount(env,{id:'bob',email:'bob@example.invalid'},{fetcher:async()=>new Response('')});
 const after=await ok(call(env,null,'GET','/ladder'));
 assert.deepEqual(after.entries.map(e=>e.callsign),['ghost_ou']);
 assert.equal(env.raw.prepare('SELECT COUNT(*) AS n FROM range_operators').get().n,1);
});
