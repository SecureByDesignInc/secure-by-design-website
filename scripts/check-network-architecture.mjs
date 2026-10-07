import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inventory} from '../public/inside-network-model/inventory.js';
import {vlans,buildArchitectureNodes,additionalControls,facilities} from '../public/inside-network-model/architecture.js';
import {scenarios,whatIfs,sequences} from '../public/inside-network-model/technical.js';
import {stepPolicy,serviceFor} from '../public/inside-network-model/flow-policy.js';
import {packetProfiles,describePacket} from '../public/inside-network-model/packets.js';
import {courses,systemCourses,processCourses} from '../public/inside-network-model/courses.js';
import {knowledgeChecks} from '../public/inside-network-model/knowledge-checks.js';
import {dataCenterLayout,equipmentPosition,roomBounds,facilityPositions,offlinePosition} from '../public/inside-network-model/data-center-layout.js';
import {securityPractices,adminMatrix,trafficRules,policyServices,evaluateFlow,singleInstances} from '../public/inside-network-model/security.js';

const nodes=buildArchitectureNodes(inventory.nodes),byId=new Map(nodes.map(n=>[n.id,n]));
const controls={...inventory.controls,...additionalControls};
assert.equal(byId.size,nodes.length,'System IDs must be unique');
assert.equal(vlans.length,8);
const memberships=vlans.flatMap(v=>v.ids);
assert.equal(new Set(memberships).size,memberships.length,'Each system has one VLAN');
const addresses=new Set();
for(const v of vlans)for(const id of v.ids){
 const n=byId.get(id);assert(n,`Unknown system ${id}`);
 assert.equal(n.zone,v.id);assert(n.address.startsWith(`10.0.${v.number}.`));
 assert(!addresses.has(n.address),'Duplicate address');addresses.add(n.address);
}
assert(!memberships.includes('root'),'Offline root cannot belong to a routed VLAN');
assert.equal(byId.get('root').address,null);
assert.equal(byId.get('workstations').zone,'v80');
assert.equal(byId.get('workstations').address,'10.0.80.100–149');
for(const item of [...nodes,...vlans,...facilities])for(const id of item.controls)assert(controls[id],`Unknown control ${id}`);
assert.equal(new Set(sequences.map(s=>s.id)).size,sequences.length,'Unique process and what-if IDs for shareable links');
const walkEnds=new Set(['media','wsus','subca','root']);
for(const scenario of sequences){
 for(const id of scenario.dependencies)assert(byId.has(id));
 for(const step of scenario.steps){
  assert(byId.has(step.to));if(step.from)assert(byId.has(step.from));
  if(step.to==='root'||step.from==='root')assert(step.manual,'No packets to the offline root');
  if(step.manual){if(step.walk)for(const id of step.walk)assert(walkEnds.has(id),`Custody walk endpoint ${id} needs a floor route`);continue;}
  assert(['udp','tcp','either'].includes(step.stream),`${scenario.id}: transport style`);
  assert(['tls','signed','none'].includes(step.protection),`${scenario.id}: wire protection`);
  assert(step.wire,`${scenario.id}: on-the-wire description`);
  if(step.protection==='tls')assert(/TLS|HTTPS/.test(step.protocol+step.transport),'TLS marker only on TLS sessions');
 }
}
for(const w of whatIfs)assert(w.whatIf&&w.steps.length);
// Each what-if shows its intended outcome through the real policy register.
const outcome=id=>sequences.find(s=>s.id===id).steps.map(step=>stepPolicy(step).kind).join(',');
assert.equal(outcome('dc-down'),'unreachable,traffic,traffic');
assert.equal(outcome('cert-expired'),'traffic,rejected');
assert.equal(outcome('pc-to-sql'),'deny');
assert.equal(outcome('peer-rdp'),'deny');
assert.equal(stepPolicy(sequences.find(s=>s.id==='peer-rdp').steps[0]).rule.id,'D02');
assert.equal(outcome('signin'),'pending,traffic,traffic,pending','Pending DHCP relay and directory profile stay blocked in the motion');
// The attack drill replays the design's acceptance tests: every attempt is stopped by the rule that test names.
const drill=sequences.find(s=>s.id==='drill');
assert(drill?.drill&&drill.whatIf,'Attack drill is listed with the what-ifs');
assert.equal(outcome('drill'),'deny,deny,deny,deny,pending,deny','Every drill attempt is stopped');
assert.deepEqual(drill.steps.map(step=>stepPolicy(step).rule.id),['DEFAULT-DENY','DEFAULT-DENY','D01','D02','F14','DEFAULT-DENY']);
assert.equal(serviceFor(drill.steps[5]),'Management');
for(const step of drill.steps)assert(securityPractices.some(p=>p.tests.includes(step.test)),`Drill step "${step.short}" replays a documented acceptance test`);
// Packet inspection covers every networked step, for requests and replies.
for(const scenario of sequences)scenario.steps.forEach((step,index)=>{
 if(step.manual)return;
 assert(packetProfiles[`${scenario.id}:${index}`],`${scenario.id} step ${index+1}: packet profile`);
 for(const kind of ['request','reply']){
  const card=describePacket({sequence:scenario,stepIndex:index,step,policy:stepPolicy(step),info:{kind,where:'core'},name:id=>byId.get(id).name,address:id=>byId.get(id).address,sameVlan:step.from===step.to});
  assert(card.layers.length===3&&card.readable&&card.protectedText&&card.decision,`${scenario.id} step ${index+1}: packet card`);
 }
});
assert.equal(Object.keys(packetProfiles).length,sequences.flatMap(s=>s.steps.filter(step=>!step.manual)).length,'No stale packet profiles');
for(const [id,keys] of Object.entries({...systemCourses,...processCourses}))for(const key of keys)assert(courses[key]&&(byId.has(id)||sequences.some(s=>s.id===id)),`Course link ${id} → ${key}`);
for(const course of Object.values(courses))assert(/^\/training\//.test(course.href),'Course links stay on this site');
for(const scenario of [...scenarios,drill]){
 const checks=knowledgeChecks[scenario.id];assert(checks?.length>=2,`${scenario.id}: knowledge check`);
 for(const q of checks){assert(q.question&&q.explanation&&q.answers.length>=3);assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.answers.length);assert.equal(new Set(q.answers).size,q.answers.length);}
}
const html=readFileSync(new URL('../public/inside-network-model/model.html',import.meta.url),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Unique UI targets');
console.log(`Architecture checks passed: ${nodes.length-1} named systems, eight VLANs, unique addresses, ${scenarios.length} valid sequences plus ${whatIfs.length} what-ifs (including the attack drill), policy-matched motion, packet inspection, course links, knowledge checks, and offline-root isolation.`);
const designIds=new Set([...byId.keys(),...facilities.map(f=>f.id)]);
for(const p of securityPractices){for(const id of p.ids)assert(designIds.has(id));for(const c of p.controls)assert(controls[c],`Unknown security control ${c}`);assert(p.tests.length&&p.evidence.length);}
for(const r of trafficRules)for(const id of [...r.from,...r.to])assert(byId.has(id),`Unknown policy endpoint ${id}`);
assert.equal(new Set(trafficRules.map(r=>r.id)).size,trafficRules.length);
for(const id of singleInstances)assert.equal(nodes.filter(n=>n.id===id).length,1);
assert.equal(evaluateFlow('workstations','fs','SMB').status,'permit');
assert.equal(evaluateFlow('workstations','workstations','SMB').status,'deny');
assert.equal(evaluateFlow('workstations','workstations','RDP').status,'deny');
assert.equal(evaluateFlow('workstations','sql','SQL').status,'deny');
assert.equal(evaluateFlow('web','sql','SQL').status,'pending');
assert.equal(evaluateFlow('jump2','dc1','Management').status,'deny');
assert.equal(evaluateFlow('jump','workstations','Management').status,'deny');
assert.equal(evaluateFlow('jump1','dc1','Management').status,'deny');
assert(!adminMatrix.find(r=>r.id==='servers').targets.includes('audit'));
for(const node of nodes)for(const service of policyServices){assert.equal(evaluateFlow(node.id,'root',service).status,'deny');assert.equal(evaluateFlow('root',node.id,service).status,'deny');}
console.log('Security policy checks passed: default deny, unresolved flows blocked, cross-tier separation, single instances, and no root network path.');

const room=dataCenterLayout(vlans),positions=new Set();
assert.deepEqual(new Set(room.flatMap(zone=>zone.ids)),new Set(memberships),'Every networked system appears in the data center');
for(const zone of room){
 assert(zone.ids.length<=(zone.kind==='rack'?4:50),'Equipment fits its cabinet');
 for(const [index,id]of zone.ids.entries()){
  const point=equipmentPosition(zone,index);
  assert(point.every(Number.isFinite),`Valid equipment position for ${id}`);
  assert(point.every((value,axis)=>value>=roomBounds.min[axis]&&value<=roomBounds.max[axis]),`${id} stays inside the room`);
  assert(!positions.has(point.join(',')),`No overlapping equipment for ${id}`);positions.add(point.join(','));
 }
}
assert(!room.some(zone=>zone.ids.includes('root')),'Offline root is outside the cabled rack layout');
assert(offlinePosition[0]>Math.max(...room.filter(zone=>zone.kind==='rack').map(zone=>zone.x+zone.w/2)),'Offline root stays separate from the server racks');
for(const id of ['core','media','backup'])assert(facilityPositions[id]?.every(Number.isFinite));
console.log('Data-center checks passed: all systems represented, distinct equipment positions, valid room bounds, and a separate offline bay.');
