import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createEquipment} from '../public/inside-network-model/equipment.js';
import {inventory} from '../public/inside-network-model/inventory.js';
import {vlans,buildArchitectureNodes} from '../public/inside-network-model/architecture.js';
import {rooms,coldAisle,racks,hosts,tileOffset,officeDesks,deskScale,offlinePosition,trayNodes,trayEdges,trayHeight} from '../public/inside-network-model/data-center-layout.js';

// Geometry-only validation; this does not validate texture pixels or WebGL rendering.
// A minimal canvas surface lets CanvasTexture objects exist without a renderer.
globalThis.document={createElement(name){
 assert.equal(name,'canvas');
 // Any 2D drawing call (labels, role icons) is a no-op here.
 return {width:0,height:0,getContext(){return new Proxy({},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});}};
}};
const scene=new THREE.Scene(),lights=[],kit=createEquipment(lights);
kit.building(scene,{rooms,coldAisle});
const nodes=buildArchitectureNodes(inventory.nodes),color=id=>vlans.find(v=>v.ids.includes(id))?.color||'#8fb8cc';
for(const r of racks){
 const g=new THREE.Group();g.position.set(r.x,0,r.z);if(r.row==='B')g.rotation.y=Math.PI;scene.add(g);
 if(r.kind==='compute'||r.kind==='reserved'||r.kind==='network'){kit.rack(g,{code:r.code,color:'#8fb8cc',switching:false});kit.patchPanel(g,10.95);}else kit.cabinet(g,r.kind);
}
for(const host of hosts){const r=racks.find(k=>k.id===host.rack),g=new THREE.Group();g.position.set(r.x,host.y,r.z);scene.add(g);kit.hypervisor(g,{name:host.name,tiles:host.vms.map((id,i)=>({id,name:id.toUpperCase(),color:color(id),vlan:10,x:tileOffset(host,i)}))});}
const office=new THREE.Group();scene.add(office);for(const [x,z] of officeDesks){const desk=kit.workstation(office,x,z,deskScale);kit.seated(desk,0);}
for(const [a,b] of trayEdges)kit.trayRun(scene,trayNodes[a],trayNodes[b],trayHeight);
const idf=new THREE.Group();scene.add(idf);kit.idf(idf);
const offline=new THREE.Group();offline.position.set(offlinePosition[0],7.25,offlinePosition[1]);scene.add(offline);
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
