import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inventory} from '../public/inside-network-model/inventory.js';
import {vlans,buildArchitectureNodes,additionalControls,facilities} from '../public/inside-network-model/architecture.js';
import {scenarios,whatIfs,sequences} from '../public/inside-network-model/technical.js';
import {stepPolicy,serviceFor} from '../public/inside-network-model/flow-policy.js';
import {packetProfiles,describePacket} from '../public/inside-network-model/packets.js';
import {courses,systemCourses,processCourses} from '../public/inside-network-model/courses.js';
import {knowledgeChecks} from '../public/inside-network-model/knowledge-checks.js';
import {placements,hosts,racks,rooms,roomBounds,facilityPositions,offlinePosition,trayNodes,trayEdges,walkExits,tileOffset,tileWidth,tileGap,adminDesks,adminTray} from '../public/inside-network-model/data-center-layout.js';
import {securityPractices,adminMatrix,trafficRules,policyServices,evaluateFlow,singleInstances,windowsMembers,linuxMembers,domainMembers} from '../public/inside-network-model/security.js';

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
assert.equal(byId.get('workstations').address,'10.0.80.100–199');
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
assert.equal(outcome('signin'),'traffic,traffic,traffic,traffic','The DHCP relay (F04) and the settled directory profile (F03) are permitted');
assert.equal(outcome('license'),'traffic','Licensing uses the registered vendor port (F12)');
assert.equal(outcome('logs'),'traffic,traffic,traffic,traffic','Every log hop is a registered path: WEF, syslog TLS, forwarder, archive');
assert.equal(outcome('web'),'traffic,traffic,traffic,traffic','Revocation checking has a path (F18)');
// The attack drill replays the design's acceptance tests: every attempt is stopped by the rule that test names.
const drill=sequences.find(s=>s.id==='drill');
assert(drill?.drill&&drill.whatIf,'Attack drill is listed with the what-ifs');
assert.equal(outcome('drill'),'deny,deny,deny,deny,deny,deny','Every drill attempt is stopped');
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
assert.equal(evaluateFlow('web','sql','SQL').status,'deny','SBD-WEB01 has no database dependency (F14)');
assert.equal(evaluateFlow('web','apps','Application API').status,'permit','SBD-WEB01 calls the application API (F21)');
assert.equal(evaluateFlow('apps','sql','SQL').status,'permit','SBD-APPS01 is the only registered SQL consumer (F22)');
assert.equal(evaluateFlow('workstations','apps','Licensing').status,'permit');
// Windows Time follows the domain hierarchy: the PDC emulator (SBD-DC01) is the reliable source, serving its own clock, and every other member syncs from the DCs.
for(const id of domainMembers.filter(id=>id!=='dc1'))assert.equal(evaluateFlow(id,'dc1','Time').status,'permit',`${id} syncs time from the DCs`);
assert(!byId.has('time'),'There is no separate time server; SBD-DC01 is the time source');
assert(trafficRules.filter(r=>r.service==='Time').every(r=>r.to.every(id=>['dc1','dc2'].includes(id))),'Time rules point only at the domain controllers');
assert.equal(evaluateFlow('jump2','dc1','Management').status,'deny');
assert.equal(evaluateFlow('jump','workstations','Management').status,'deny');
assert.equal(evaluateFlow('jump1','dc1','Management').status,'deny');
assert(!adminMatrix.find(r=>r.id==='servers').targets.includes('audit'));
// Every domain member reaches the domain controllers and revocation data; every Windows system patches and forwards events;
// the domain-joined Linux servers patch from the repository and send syslog over TLS.
for(const id of domainMembers){for(const service of ['DNS','Kerberos','Directory'])assert.equal(evaluateFlow(id,'dc1',service).status,'permit',`${id} → DC ${service}`);assert.equal(evaluateFlow(id,'templates','PKI publication').status,'permit',`${id} checks revocation`);}
for(const id of windowsMembers){if(id!=='wsus')assert.equal(evaluateFlow(id,'wsus','WSUS').status,'permit',`${id} patches`);if(id!=='syslog')assert.equal(evaluateFlow(id,'syslog','Event forwarding').status,'permit',`${id} forwards events`);}
for(const id of linuxMembers){assert.equal(evaluateFlow(id,'repo','Linux packages').status,'permit',`${id} patches from the repository`);assert.equal(evaluateFlow(id,'syslog','Syslog TLS').status,'permit',`${id} sends syslog`);}
assert.deepEqual(linuxMembers,['splunk','nessus','web'],'Splunk, Nessus, and the Apache web server are the domain-joined Linux servers');
assert(!windowsMembers.includes('web'),'SBD-WEB01 gets no WSUS or event-forwarding rules');
// Tier 0 covers the tools that control the DCs; audit custody stays a separate role.
for(const id of ['wsus','epo','nessus','splunk'])assert(adminMatrix.find(r=>r.id==='identity').targets.includes(id),`Tier 0 administers the DC-facing scope of ${id}`);
assert.equal(evaluateFlow('repo','dc1','Kerberos').status,'deny','The Linux repository is not a domain member');
assert.equal(nodes.length,22,'21 named systems plus the workstation group (SBD-TIME01 was removed in October 2026; SBD-DC01 is the time source)');
assert.equal(evaluateFlow('workstations','dhcp','Network access').status,'permit','802.1X admission through the NPS role on SBD-DHCP01');
assert(windowsMembers.includes('audit'),'SBD-AUDIT01 is domain-joined Windows');
for(const node of nodes)for(const service of policyServices){assert.equal(evaluateFlow(node.id,'root',service).status,'deny');assert.equal(evaluateFlow('root',node.id,service).status,'deny');}
console.log('Security policy checks passed: default deny, the three-tier SQL path, the domain time hierarchy, cross-tier separation, single instances, and no root network path.');

const where=placements(),inRoom=(id,x,z)=>{const r=rooms.find(r=>r.id===id);return x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1;};
assert.deepEqual(new Set([...where.keys()].filter(id=>id!=='root')),new Set(memberships),'Every networked system has a place in the building');
assert.equal(where.get('root').room,'vault','The offline root sits in the vault');
for(const host of hosts){
 const rack=racks.find(r=>r.id===host.rack);assert.equal(rack.kind,'compute',`${host.name} is in a compute rack`);
 const span=host.vms.length*tileWidth+(host.vms.length-1)*tileGap;assert(span<=5.5,`${host.name}'s virtual machines fit its faceplate`);
 assert(host.vms.every((id,i)=>Number.isFinite(tileOffset(host,i))),`${host.name} tiles are placed`);
}
const hostOf=id=>hosts.find(h=>h.vms.includes(id));
assert.notEqual(hostOf('dc1'),hostOf('dc2'),'The two domain controllers run on different hosts');
for(const dc of ['dc1','dc2'])assert.deepEqual(hostOf(dc).vms,[dc],`${dc} has its hypervisor host to itself`);
assert(!['dc1','dc2'].some(dc=>hostOf(dc)===hostOf('subca')),'The issuing CA never shares a host with a domain controller');
for(const id of ['dc1','dc2','subca','templates'])assert(hostOf(id).vms.every(v=>['dc1','dc2','subca','templates'].includes(v)),`${id} shares a host only with identity and PKI servers`);
for(const v of vlans)if(v.ids.length>1&&v.ids.every(id=>hostOf(id))){const vmHosts=new Set(v.ids.map(id=>hostOf(id)?.id));if(v.id!=='v10'&&v.id!=='v30')assert.equal(vmHosts.size,1,`VLAN ${v.number} servers share a host, so same-VLAN traffic stays on its virtual switch`);}
for(const [id,p] of where){if(p.kind==='desk')assert(inRoom('admin',adminDeskX(id),adminDeskZ(id)),`${id} sits in the administration room`);}
function adminDeskX(id){return where.get(id).x;}function adminDeskZ(id){return where.get(id).z;}
// Seat virtual machines (13 October 2026): two physical admin seats. The Tier 2 seat, SBD-ADMIN-PC01, runs as a VM on the
// Tier 1 seat (the DISA Windows PAW STIG exception for sites short on workstations) and keeps its own address; the Tier 0 seat hosts nothing.
const seatTier={jump:0,jump1:1,jump2:2};
assert.deepEqual(Object.keys(adminDesks).sort(),['jump','jump1'],'Two physical admin seats');
for(const [id,p] of where)if(p.kind==='seatvm'){
 assert(p.host in adminDesks,`${id} runs on a physical admin seat`);
 assert.notEqual(p.host,'jump',`${id} is not hosted on the Tier 0 seat`);
 assert(seatTier[p.host]<seatTier[id],`${id} runs on a higher-tier seat`);
 assert(inRoom('admin',p.x,p.z),`${id} sits in the administration room`);
 assert(adminTray[id]&&trayNodes[adminTray[id]],`${id} has a cable route`);
}
assert.equal(where.get('jump2').kind,'seatvm','SBD-ADMIN-PC01 runs as a virtual machine');
assert.equal(where.get('jump2').host,'jump1','SBD-ADMIN-PC01 runs on the SBD-ADMIN-SRV01 seat');
assert.equal(byId.get('jump2').address,'10.0.60.30','The Tier 2 VM keeps its own address, so rule A03 still names it alone');
assert.equal(evaluateFlow('jump2','jump1','Management').status,'deny','The Tier 2 VM cannot manage its host seat');
assert(inRoom('vault',...offlinePosition),'Offline root stays in the vault');
assert(inRoom('media',...facilityPositions.media)&&inRoom('vault',...facilityPositions.backup)&&inRoom('server',...facilityPositions.core),'Media handling, backups, and the core sit in their rooms');
for(const [k,[x,z]] of Object.entries(trayNodes))assert(!inRoom('vault',x,z)&&!inRoom('media',x,z),`Cable tray node ${k} stays out of the media room and vault`);
for(const [a,b] of trayEdges)assert(trayNodes[a][0]===trayNodes[b][0]||trayNodes[a][1]===trayNodes[b][1],`Tray ${a}-${b} runs straight`);
for(const p of [[...roomBounds.min],[...roomBounds.max]])assert(p.every(Number.isFinite));
assert.equal(walkExits.vault.parent,'media','The vault opens only into the media room');
console.log('Building checks passed: every system placed, domain controllers on their own hosts, the CA apart from them, same-VLAN servers sharing a host, and no cable trays in the media room or vault.');
