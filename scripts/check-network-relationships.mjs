import assert from 'node:assert/strict';
import {inventory} from '../public/inside-network-model/inventory.js';
import {vlans,facilities,families,additionalControls,buildArchitectureNodes} from '../public/inside-network-model/architecture.js';
import {scenarios,whatIfs} from '../public/inside-network-model/technical.js';
import {securityPractices,policyServices,evaluateFlow} from '../public/inside-network-model/security.js';
import {relationshipModel,relatedControlIds} from '../public/inside-network-model/relationship-model.js';

const systems=buildArchitectureNodes(inventory.nodes),controls={...inventory.controls,...additionalControls};
const targets={system:systems,vlan:vlans,facility:facilities,practice:securityPractices};
let checked=0;
function validate(context){
 const model=relationshipModel(context),keys=model.nodes.map(n=>n.key);
 assert(model.title&&model.caption&&model.legend);
 assert.equal(new Set(keys).size,keys.length,'No duplicate equipment or mapping nodes');
 assert(keys.length<=13,'Keep companion scenes bounded and readable');
 for(const n of model.nodes){assert(n.label&&n.short&&n.type&&n.color);if(n.action)assert(targets[n.action.type].some(t=>t.id===n.action.id),'Every interactive object resolves to existing content');}
 for(const e of model.edges){
  assert(keys.includes(e.from)&&keys.includes(e.to),'Every edge has visible endpoints');
  assert(['association','manual','traffic','pending','deny','failed'].includes(e.kind));
  if(e.from==='root'||e.to==='root')assert(['association','manual','deny'].includes(e.kind),'Offline root never receives network traffic');
 }
 checked++;return model;
}
validate({type:'overview'});validate({type:'security'});
for(const [type,entries] of Object.entries(targets))for(const {id} of entries)validate({type,id});
for(const {id,ids} of vlans){const m=validate({type:'vlan',id});assert.deepEqual(new Set(m.nodes.slice(1).map(n=>n.key)),new Set(ids));assert(m.edges.every(e=>e.kind==='association'));}
for(const id of Object.keys(controls))validate({type:'control',id});
for(const [id] of families){validate({type:'family',id});const expected=new Set(Object.keys(controls).filter(c=>c.startsWith(id+'-')).flatMap(c=>relatedControlIds(c)));assert.deepEqual(new Set(relatedControlIds(id,{family:true})),expected);}
for(const [scenario,s] of scenarios.entries())for(const [step,t] of s.steps.entries()){
 const m=validate({type:'flow',scenario,step});
 if(t.manual)assert.equal(m.edges[0].kind,'manual');
 if(t.unverified)assert.equal(m.edges[0].kind,'pending');
}
assert.equal(validate({type:'flow',scenario:0,step:0}).edges[0].kind,'pending','Proposed DHCP relay remains blocked');
assert.equal(validate({type:'flow',scenario:0,step:1}).edges[0].kind,'traffic','Permitted DNS has service motion');
assert.equal(validate({type:'flow',scenario:0,step:2}).edges[0].kind,'traffic','Permitted Kerberos has service motion');
assert.equal(validate({type:'flow',scenario:0,step:3}).edges[0].kind,'traffic','The settled directory profile (F03) has service motion');
for(const [offset,s] of whatIfs.entries())for(const step of s.steps.keys()){const m=validate({type:'flow',scenario:scenarios.length+offset,step});assert(['traffic','deny','failed','pending'].includes(m.edges[0].kind),'What-ifs and the attack drill show permitted, failed, denied, or pending traffic');}
const web=scenarios.findIndex(s=>s.id==='web');
for(const step of [0,1,2,3])assert.equal(validate({type:'flow',scenario:web,step}).edges[0].kind,'traffic','Web app sequence uses permitted DNS (F01), HTTPS (F13), and revocation (F18)');
for(const {id:from} of systems)for(const {id:to} of systems)for(const service of policyServices){
 const m=validate({type:'policy',from,to,service}),r=evaluateFlow(from,to,service);
 assert.equal(m.edges[0].kind,r.status==='permit'?'traffic':r.status,'Visual motion follows the actual policy register');
}
for(const id of ['media','backup'])assert(validate({type:'facility',id}).edges.every(e=>e.kind==='manual'));
console.log(`Relationship checks passed: ${checked} views, all controls/VLANs/practices, every policy combination, and manual/offline isolation.`);
