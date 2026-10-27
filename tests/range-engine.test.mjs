import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../lib/range/engine.mjs';

const content=JSON.parse(fs.readFileSync('content/range/systems.json','utf8'));
const residents=JSON.parse(fs.readFileSync('content/range/residents.json','utf8')).residents;
const questions=JSON.parse(fs.readFileSync('content/range/questions.json','utf8')).questions;
const E=createEngine(content);
const seq=(...values)=>{let i=0;return()=>values[i++%values.length];};
const duel=(a=['sbd-dc01','sbd-pki-mgmt01','splunk'],b=['l3-router','nessus','epo'])=>E.createBattle({a:{stack:a},b:{stack:b}});

test('the seven systems are the System Hub\'s, with four moves each and real weaknesses',()=>{
 assert.deepEqual(content.systems.map(s=>s.id),['sbd-dc01','sbd-dc02','l3-router','sbd-pki-mgmt01','splunk','nessus','epo']);
 for(const s of content.systems){
  assert.equal(s.moves.length,4,s.id);
  for(const kind of ['light','heavy','repair'])assert.ok(s.moves.some(m=>m.kind===kind),s.id+' needs a '+kind+' move');
  assert.ok(s.moves[3].kind==='status'||s.moves[3].kind==='light',s.id+' fourth move');
  for(const m of s.moves)assert.ok(content.types[m.type],m.id);
  assert.ok(E.weakTo(s.id).length>=1,s.id+' needs a weakness');
 }
 // The dependency map: AD needs DNS and time; PKI needs DNS and the router; the router is exposed by visibility.
 assert.equal(E.effectiveness('Resolution','sbd-dc01'),1.5);
 assert.equal(E.effectiveness('Trust','sbd-dc01'),1.5);
 assert.equal(E.effectiveness('Visibility','l3-router'),1.5);
 assert.equal(E.effectiveness('Network','sbd-pki-mgmt01'),1.5);
 assert.equal(E.effectiveness('Identity','l3-router'),1);
});

test('levels add integrity, open the fourth move and come from deck reviews',()=>{
 assert.equal(E.maxIntegrity('sbd-dc01',1),90);
 assert.equal(E.maxIntegrity('sbd-dc01',4),105);
 assert.equal(E.movesFor('sbd-dc01',3).length,3);
 assert.equal(E.movesFor('sbd-dc01',4).length,4);
 assert.equal(E.levelFor(0),1);assert.equal(E.levelFor(19),1);assert.equal(E.levelFor(20),2);assert.equal(E.levelFor(79),4);assert.equal(E.levelFor(500),5);
 assert.equal(E.cardsToNext(9),11);assert.equal(E.cardsToNext(80),0);
 assert.throws(()=>E.stack(['sbd-dc01','sbd-dc01','epo']));
 assert.throws(()=>E.stack(['sbd-dc01','nope','epo']));
});

test('a light hit lands on a miss; a correct answer resists it and counters, 20 when fast',()=>{
 const s=duel();
 const q=E.questionsFor(s,{a:{move:'fsmo-check'},b:{move:'dhcp-relay'}});
 assert.equal(q.a.move.id,'dhcp-relay');assert.equal(q.b.move.id,'fsmo-check');
 E.resolveTurn(s,{a:{move:'fsmo-check'},b:{move:'dhcp-relay'}},{a:{correct:false,ms:9000},b:{correct:true,ms:4000}});
 assert.equal(s.sides.a.stack[0].integrity,90-20-20,'a missed the DHCP question (20) and b resisted fast (20 counter)');
 assert.equal(s.sides.b.stack[0].integrity,80);
 assert.equal(s.turn,2);
});

test('super effective multiplies, a resisted heavy move backfires, a repair heals only when answered right',()=>{
 // Splunk's Index search (Visibility, light) into the router (weak to Visibility): 20 x 1.5 = 30.
 const t=duel(['splunk','sbd-dc01','epo'],['l3-router','nessus','epo']);
 E.resolveTurn(t,{a:{move:'index-search'},b:{move:'dhcp-relay'}},{a:{correct:true,ms:7000},b:{correct:false}});
 assert.equal(t.sides.a.stack[0].integrity,70,'a resisted, so a takes nothing');
 assert.equal(t.sides.b.stack[0].integrity,80-30-10,'b missed (30) and was countered (10)');
 // Heavy resisted: the mover takes the counter plus 15 backfire.
 const u=duel();
 E.resolveTurn(u,{a:{move:'replication-storm'},b:{move:'route-table'}},{a:{correct:false},b:{correct:true,ms:8000}});
 assert.equal(u.sides.a.stack[0].integrity,90-10-15);
 assert.equal(u.sides.b.stack[0].integrity,80,'a wrong repair answer heals nothing');
 u.sides.b.stack[0].integrity=50;
 E.resolveTurn(u,{a:{move:'fsmo-check'},b:{move:'route-table'}},{a:{correct:false},b:{correct:true}});
 assert.equal(u.sides.b.stack[0].integrity,75,'repair restores 25 on a right answer');
});

test('statuses attach to the operator: Isolated blocks a swap, Noisy telegraphs, Drift shrinks the window',()=>{
 const s=duel(['l3-router','sbd-dc01','epo'],['sbd-dc02','nessus','epo']);
 s.sides.a.stack[0].level=4;s.sides.a.stack[0].max=E.maxIntegrity('l3-router',4);s.sides.a.stack[0].integrity=s.sides.a.stack[0].max;
 E.resolveTurn(s,{a:{move:'isolate'},b:{move:'site-link'}},{a:{correct:true,ms:6000},b:{correct:false}});
 assert.equal(s.sides.b.status.name,'Isolated');
 assert.equal(E.canSwap(s.sides.b),false);
 const events=E.resolveTurn(s,{a:{move:'dhcp-relay'},b:{swap:1}},{a:{correct:true}});
 assert.ok(events.some(e=>e.who==='b'&&e.kind==='wasted'&&e.reason==='Isolated'),'the swap is wasted while Isolated');
 assert.equal(s.sides.b.status,null,'Isolated lasts one turn');
 const n=duel();
 E.resolveTurn(n,{a:{move:'fsmo-check'},b:{move:'dhcp-relay'}},{a:{correct:true},b:{correct:true}});
 n.sides.a.stack[0].level=4;
 E.resolveTurn(n,{a:{move:'event-trail'},b:{move:'dhcp-relay'}},{a:{correct:true},b:{correct:false}});
 assert.equal(n.sides.b.status.name,'Noisy');assert.equal(n.sides.b.telegraph,true);
 assert.equal(E.answerWindow({status:{name:'Drift'}},1),12000);
 assert.equal(E.answerWindow({status:null},5),22000);
});

test('a swapping side makes no move and the incoming move lands on the system swapped in',()=>{
 const s=duel();
 const q=E.questionsFor(s,{a:{swap:1},b:{move:'inter-vlan-rule'}});
 assert.equal(q.a,null,'a answers nothing this turn');
 assert.equal(q.b,null,'b\'s move needs no answer from b');
 E.resolveTurn(s,{a:{swap:1},b:{move:'inter-vlan-rule'}},{});
 assert.equal(s.sides.a.active,1);
 assert.equal(s.sides.a.stack[1].integrity,0,'Network into Trust is super effective: 50 x 1.5 on the 70-integrity PKI server');
 assert.equal(s.sides.a.stack[1].down,true);
 assert.equal(E.mustSwap(s.sides.a),true);
 assert.deepEqual(E.availableMoves(s.sides.a),[]);
});

test('the duel ends when a stack is down, or on turn 12 by integrity left',()=>{
 const s=duel();
 for(const side of ['a','b'])for(const sys of s.sides[side].stack)sys.integrity=1;
 E.resolveTurn(s,{a:{move:'fsmo-check'},b:{move:'dhcp-relay'}},{a:{correct:true},b:{correct:false}});
 assert.equal(s.sides.b.stack[0].down,true);
 assert.equal(s.over,null,'two systems still stand');
 const t=E.createBattle({a:{stack:['sbd-dc01','sbd-dc02','epo']},b:{stack:['l3-router','nessus','splunk']},maxTurns:1});
 E.resolveTurn(t,{a:{move:'fsmo-check'},b:{move:'dhcp-relay'}},{a:{correct:true},b:{correct:true}});
 assert.deepEqual(t.over,{winner:'a',reason:'turns',integrity:{a:240,b:210}});
 assert.throws(()=>E.resolveTurn(t,{a:{move:'fsmo-check'},b:{move:'dhcp-relay'}},{}));
});

test('the bot swaps when down, leans on super effective moves and resists by difficulty',()=>{
 const s=duel(['splunk','sbd-dc01','epo'],['l3-router','nessus','epo']);
 const picks=new Set();for(let i=0;i<40;i++)picks.add(E.botPick(s,'a',seq(0.01,0.5,0.99)).move);
 assert.ok(picks.has('index-search'),'Index search is super effective here');
 s.sides.b.stack[0].down=true;s.sides.b.stack[0].integrity=0;
 assert.deepEqual(E.botPick(s,'b'),{swap:1});
 assert.equal(E.botAnswer('easy',seq(0.69,0.5)).correct,true);
 assert.equal(E.botAnswer('hard',seq(0.41,0.5)).correct,false);
});

test('questions are picked for the move, with fallbacks, and signoff draws from the RMF pool',()=>{
 const move=E.moveById('sbd-dc01','fsmo-check');
 const q=E.pickQuestion(questions,{system:'sbd-dc01',move,rng:()=>0});
 assert.equal(q.system,'sbd-dc01');assert.equal(q.move,'fsmo-check');
 const exclude=new Set(questions.filter(x=>x.move==='fsmo-check').map(x=>x.id));
 const fallback=E.pickQuestion(questions,{system:'sbd-dc01',move,exclude,rng:()=>0});
 assert.equal(fallback.type,'Identity');assert.equal(fallback.difficulty,'easy');
 const rmf=E.pickQuestion(questions,{system:'sbd-dc01',move,pool:'rmf',rng:()=>0});
 assert.equal(rmf.system,'rmf');
 const today=E.dailyQuestion(questions,new Date('2026-10-26T12:00:00Z'));
 assert.equal(today,E.dailyQuestion(questions,new Date('2026-10-26T23:00:00Z')));
 assert.equal(E.weekKey(new Date('2026-10-26T00:00:00Z')),'2026-W44');
 assert.equal(E.weekKey(new Date('2026-10-25T23:59:00Z')),'2026-W43','the ladder clears Sunday night');
});

test('points, tiers, ranks and spaced repetition follow the rules page',()=>{
 assert.equal(E.pointsFor('duel',{won:true}),40);assert.equal(E.pointsFor('duel',{won:false}),10);
 assert.equal(E.pointsFor('checkpoint',{won:true,first:true}),60);assert.equal(E.pointsFor('checkpoint',{won:true}),15);
 assert.equal(E.pointsFor('run',{cleared:3}),60);
 assert.equal(E.pointsFor('daily',{correct:true,streak:7}),10);assert.equal(E.pointsFor('daily',{correct:false}),0);
 assert.equal(E.pointsFor('deck',{cards:35}),6);assert.equal(E.pointsFor('deck',{cards:90}),10);
 assert.equal(E.tierFor(0),'Recruit');assert.equal(E.tierFor(1),'Operator');assert.equal(E.tierFor(3),'Defender');assert.equal(E.tierFor(5),'Hardened');assert.equal(E.tierFor(6),'Authorized');
 assert.equal(E.rankFor(0),'I');assert.equal(E.rankFor(300),'II');assert.equal(E.rankFor(800),'III');
 const now=new Date('2026-10-26T12:00:00Z');
 assert.equal(E.schedule('again',{},now).due,'2026-10-26T12:10:00.000Z');
 assert.equal(E.schedule('good',{},now).intervalDays,5);
 assert.equal(E.schedule('easy',{intervalDays:5},now).intervalDays,20);
 assert.equal(E.schedule('hard',{intervalDays:5},now).intervalDays,6);
});

test('the question bank: ten per system, twenty RMF, four options, one answer, explanations, no makes or models',()=>{
 const counts={};for(const q of questions)counts[q.system]=(counts[q.system]||0)+1;
 for(const s of content.systems)assert.equal(counts[s.id],10,s.id);
 assert.equal(counts.rmf,20);
 const ids=new Set();
 for(const q of questions){
  assert.ok(!ids.has(q.id),'duplicate '+q.id);ids.add(q.id);
  assert.equal(q.options.length,4,q.id);assert.equal(new Set(q.options).size,4,q.id);
  assert.match(q.answer,/^[ABCD]$/,q.id);
  assert.ok(['easy','medium','hard'].includes(q.difficulty),q.id);
  assert.ok(content.types[q.type],q.id);
  assert.ok(q.explanation.length>20&&q.explanation.split(/[.!?]\s/).length<=3,q.id+' explanation');
  assert.ok(q.prompt.split(/\s+/).length<=40,q.id+' prompt');
  assert.doesNotMatch(q.prompt+q.options.join(' ')+q.explanation,/Cisco|Juniper|Dell|HP |Lenovo|Catalyst|Nexus|eMASS|Xacta/i,q.id);
  if(q.system!=='rmf'){
   const system=content.systems.find(s=>s.id===q.system);
   assert.ok(system.moves.some(m=>m.id===q.move),q.id+' names a move of its system');
  }
 }
 // Every move has at least one question of its own, and signoff's pool covers both difficulties it draws.
 for(const s of content.systems)for(const m of s.moves)assert.ok(questions.some(q=>q.system===s.id&&q.move===m.id),m.id);
 assert.ok(questions.some(q=>q.system==='rmf'&&q.difficulty==='hard'));
 // Residents field real systems, three each, with the signoff pool present.
 for(const r of residents){assert.equal(r.stack.length,3,r.id);for(const e of r.stack)assert.ok(E.systemById(e.system),r.id);}
 assert.equal(residents.find(r=>r.id==='signoff').pool,'rmf');
 assert.equal(residents.length,6);
});
