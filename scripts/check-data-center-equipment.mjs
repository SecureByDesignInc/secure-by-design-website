import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createEquipment} from '../public/inside-network-model/equipment.js';
import {inventory} from '../public/inside-network-model/inventory.js';
import {vlans,buildArchitectureNodes} from '../public/inside-network-model/architecture.js';
import {dataCenterLayout,equipmentPosition} from '../public/inside-network-model/data-center-layout.js';

// Geometry-only validation; this does not validate texture pixels or WebGL rendering.
// A minimal canvas surface lets CanvasTexture objects exist without a renderer.
globalThis.document={createElement(name){
 assert.equal(name,'canvas');
 // Any 2D drawing call (labels, role icons) is a no-op here.
 return {width:0,height:0,getContext(){return new Proxy({},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});}};
}};
const scene=new THREE.Scene(),lights=[],kit=createEquipment(lights);
kit.room(scene);
const nodes=buildArchitectureNodes(inventory.nodes);
for(const zone of dataCenterLayout(vlans)){
 const rack=new THREE.Group();rack.position.set(zone.x,0,zone.z);scene.add(rack);
 if(zone.kind==='rack')kit.rack(rack,{code:zone.rack,color:zone.color});
 for(const [i,id]of zone.ids.entries()){
  const device=new THREE.Group();device.position.set(...equipmentPosition(zone,i));scene.add(device);
  if(zone.kind==='rack')kit.server(device,nodes.find(n=>n.id===id),zone.color);
  else if(zone.kind==='desks')kit.workstation(device);
  else for(let j=0;j<50;j++)kit.workstation(device,(j%10-4.5)*1.82,(Math.floor(j/10)-2)*2.08,.5);
 }
}
const offline=new THREE.Group();offline.position.set(24,7.25,8);scene.add(offline);
const ledCount=lights.length;kit.server(offline,nodes.find(n=>n.id==='root'),'#e5c58e',{offline:true});
assert.equal(lights.length,ledCount,'Offline root has no animated network lights');
const stats=()=>{let draws=0,triangles=0;scene.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});return {draws,triangles};};
scene.updateMatrixWorld(true);
const before=stats(),boundsBefore=new THREE.Box3().setFromObject(scene);
kit.batch(scene);scene.updateMatrixWorld(true);
const after=stats(),boundsAfter=new THREE.Box3().setFromObject(scene);
assert.equal(after.triangles,before.triangles,'Batching preserves every visible equipment part');
assert(boundsBefore.min.distanceTo(boundsAfter.min)<.0001&&boundsBefore.max.distanceTo(boundsAfter.max)<.0001,'Batching preserves world placement and bounds');
assert(after.draws<before.draws*.4,'Repeated equipment is batched for mobile rendering');
scene.traverse(o=>{assert(o.matrixWorld.elements.every(Number.isFinite),'All equipment transforms are finite');});
console.log(`Equipment geometry checks passed: ${before.draws} mesh draws reduced to ${after.draws}; ${after.triangles.toLocaleString()} triangles retained; positions and offline indicators preserved.`);
