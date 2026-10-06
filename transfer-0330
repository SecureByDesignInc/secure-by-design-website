import * as THREE from 'three';
import {OrbitControls} from 'three/orbit';
import {vlans,facilities} from './architecture.js';
import {createEquipment} from './equipment.js';
import {dataCenterLayout,equipmentPosition,roomBounds,facilityPositions,offlinePosition} from './data-center-layout.js';

export function createNetworkScene(container,nodes,onSelect,onInteract=()=>{}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let moving=!reduced,labelsVisible=true,selection='',activeIds=[],transition=null,drift=null,time=0,framedIds=null;
 const objects=new Map(),pickables=[],lights=[],flows=[],labels=[],zones=[];
 const colors={...Object.fromEntries(vlans.map(v=>[v.id,v.color])),users:'#6ebde9',offline:'#e7bd7f',core:'#7bddf0',media:'#eeb978',backup:'#86c4f1'};
 const layout=dataCenterLayout(vlans);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#081522');scene.fog=new THREE.FogExp2('#081522',.004);
 const camera=new THREE.PerspectiveCamera(39,1,.1,900);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=container.clientWidth>=720;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 container.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','3D data center with server racks, network switches, workstations, and offline equipment. Drag to orbit, scroll to zoom, or select a system. Arrow keys rotate; Home shows the full network.');
 const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=!reduced;orbit.dampingFactor=.075;orbit.minDistance=10;orbit.maxDistance=500;orbit.maxPolarAngle=Math.PI*.47;orbit.minPolarAngle=.09;orbit.enablePan=true;
 orbit.addEventListener('start',()=>{transition=null;drift=null;onInteract();});
 scene.add(new THREE.HemisphereLight('#c8e8ff','#26323c',2.5));
 const key=new THREE.DirectionalLight('#ecfbff',3.5);key.position.set(-18,40,25);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-45,right:45,top:50,bottom:-45,near:1,far:110});key.shadow.normalBias=.15;scene.add(key);
 const rim=new THREE.DirectionalLight('#9dc1df',1.7);rim.position.set(25,22,-25);scene.add(rim);
 const fill=new THREE.PointLight('#51d7ef',70,65,1.4);fill.position.set(0,13,7);scene.add(fill);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.16,'#ffffff88');gradient.addColorStop(.45,'#ffffff22');gradient.addColorStop(1,'#ffffff00');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(glowCanvas);
 const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
 function glow(parent,x,y,z,color,size=2,opacity=.55){const o=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));o.position.set(x,y,z);o.scale.setScalar(size);parent.add(o);return o;}
 function textTexture(text,sub,color,plane=false,width=7){
  const c=document.createElement('canvas');c.width=768;c.height=sub?190:110;const ctx=c.getContext('2d');
  if(!plane){ctx.fillStyle='rgba(5,17,30,.91)';ctx.beginPath();ctx.roundRect(1,1,766,c.height-2,14);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}
  ctx.fillStyle=plane?color:'#e4f5ff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 63px Segoe UI,Arial';ctx.fillText(text,384,sub?64:55,710);
  if(sub){ctx.font='38px Segoe UI,Arial';ctx.fillStyle=color;ctx.fillText(sub,384,139,710);}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;
  const o=plane?new THREE.Mesh(new THREE.PlaneGeometry(width,width*c.height/768),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide})):new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false}));
  if(plane)o.rotation.x=-Math.PI/2;else{o.scale.set(width,width*c.height/768,1);o.renderOrder=20;}
  return o;
 }
 const equipment=createEquipment(lights);
 equipment.room(scene);
 function callout(group,node,color,index=0){
  const title=node.id==='workstations'?'50 WINDOWS 11 PCs':node.name;
  const sub=node.id==='root'?'OFFLINE / NO LIVE LINK':node.address;
  const label=textTexture(title,sub,color,false,node.id==='workstations'?8:6.7);
  label.position.set(node.id==='workstations'?0:index%2?5.1:-5.1,node.id==='workstations'?4.6:1.5,node.id==='workstations'?0:3.6);
  label.visible=false;label.userData.id=node.id;group.add(label);pickables.push(label);return label;
 }
 for(const zone of layout){
  const color=colors[zone.id],rack=new THREE.Group();rack.position.set(zone.x,0,zone.z);scene.add(rack);
  if(zone.kind==='rack')equipment.rack(rack,{code:zone.rack,color,name:`VLAN ${zone.number}`});
  const title=textTexture(`${zone.rack} / ${zone.name.toUpperCase()}`,`VLAN ${zone.number} · ${zone.subnet}`,color,false,zone.kind==='rack'?8:11);
  title.position.set(zone.x,zone.kind==='rack'?13.3:6.7,zone.z);scene.add(title);labels.push(title);
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(zone.w,.015,zone.d)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.26}));
  outline.position.set(zone.x,.015,zone.z);scene.add(outline);zones.push({zone,outline,halo:null});
  for(const [i,id]of zone.ids.entries()){
   const node=nodes.find(n=>n.id===id),g=new THREE.Group();g.position.set(...equipmentPosition(zone,i));scene.add(g);
   if(id==='workstations'){
    for(let j=0;j<50;j++)equipment.workstation(g,(j%10-4.5)*1.82,(Math.floor(j/10)-2)*2.08,.5,'#5a849c');
   }else if(zone.kind==='desks')equipment.workstation(g,0,0,1.1,'#799ba9');
   else equipment.server(g,node,color);
   const label=callout(g,node,color,i);
   const dimensions=id==='workstations'?[19,2.5,11]:zone.kind==='desks'?[3.7,3.6,3.7]:[5.8,1.55,5];
   const hit=new THREE.Mesh(new THREE.BoxGeometry(...dimensions),basic('#ffffff',0));hit.position.y=zone.kind==='rack'?0:1.4;hit.userData.id=id;g.add(hit);pickables.push(hit);
   objects.set(id,{node,group:g,label,dimensions,anchor:new THREE.Vector3(0,zone.kind==='rack'?.3:2,zone.kind==='rack'?2.7:0)});
  }
 }
 const root=nodes.find(n=>n.id==='root'),rootBase=new THREE.Group();rootBase.position.set(offlinePosition[0],0,offlinePosition[1]);scene.add(rootBase);
 equipment.mediaCabinet(rootBase,{label:'OFFLINE ROOT CA',color:'#e5c58e'});
 const rootDevice=new THREE.Group();rootDevice.position.set(offlinePosition[0],7.25,offlinePosition[1]);scene.add(rootDevice);equipment.server(rootDevice,root,'#e5c58e',{offline:true});
 const rootLabel=callout(rootDevice,root,'#e5c58e');
 const rootHit=new THREE.Mesh(new THREE.BoxGeometry(6,2,5),basic('#ffffff',0));rootHit.userData.id='root';rootDevice.add(rootHit);pickables.push(rootHit);
 objects.set('root',{node:root,group:rootDevice,label:rootLabel,dimensions:[6,2,5],anchor:new THREE.Vector3(0,0,2.7)});
 const offlineTitle=textTexture('OFFLINE ROOT','Local access · no network cable','#e5c58e',false,9);offlineTitle.position.set(offlinePosition[0],10.7,offlinePosition[1]);scene.add(offlineTitle);labels.push(offlineTitle);
 function facility(id,height){
  const f=facilities.find(f=>f.id===id),position=facilityPositions[id],g=new THREE.Group();g.position.set(position[0],0,position[1]);scene.add(g);
  const label=textTexture(f.name.toUpperCase(),null,f.color,false,id==='media'?12:8);label.position.set(0,height+1.2,0);label.userData.id=id;g.add(label);pickables.push(label);labels.push(label);
  const dimensions=id==='media'?[15,4,8]:[7,height,6];
  const hit=new THREE.Mesh(new THREE.BoxGeometry(...dimensions),basic('#ffffff',0));hit.position.y=height/2;hit.userData.id=id;g.add(hit);pickables.push(hit);
  objects.set(id,{node:{id,zone:id},group:g,label,dimensions,anchor:new THREE.Vector3(0,id==='core'?9:height/2,2.8)});return g;
 }
 const core=facility('core',12.6);equipment.rack(core,{code:'R07',name:'NETWORK CORE',color:'#8cc9d8',switching:false});
 equipment.networkSwitch(core,9.3,{label:'CORE SWITCH 01'});equipment.networkSwitch(core,7.1,{label:'CORE SWITCH 02'});
 equipment.plate(core,'INTERNAL ROUTING / ACCESS CONTROL',5.5,0,4.4,2.7,{height:.35,color:'#9cc9d8'});
 for(let i=0;i<6;i++)equipment.cable(core,[[-2.1+i*.5,9.25,2.3],[-2.1+i*.5,8.4,3.1],[-2.1+i*.5,7.15,2.3]],i%2?'#557b99':'#669397',.04);
 const media=facility('media',4.3);equipment.workstation(media,-3.7,0,1.35,'#a49271');equipment.workstation(media,3.7,0,1.35,'#a49271');
 equipment.plate(media,'IMPORT',3.3,-3.7,2.2,1.55,{color:'#e5c58e'});equipment.plate(media,'EXPORT',3.3,3.7,2.2,1.55,{color:'#e5c58e'});
 const backup=facility('backup',7);equipment.mediaCabinet(backup,{label:'PROTECTED OFFLINE BACKUPS'});
 // Internal cable routes stop inside the room. Offline root and media never have uplinks.
 const topology=new THREE.Group();scene.add(topology);
 for(const zone of layout){
  const y=zone.kind==='rack'?12.5:3.1;
  equipment.cable(topology,[[zone.x,y,zone.z-2.9],[zone.x,13,zone.z<0?-19:1],[1,13,zone.z<0?-19:1],[1,12.5,5.1]],'#446074',.045);
 }
 const aisle=textTexture('SERVER AISLE',null,'#dde5e9',true,12);aisle.position.set(-6,.025,-1.8);scene.add(aisle);
 const operations=textTexture('OPERATIONS / WORKSTATIONS',null,'#b7c9d6',true,15);operations.position.set(-15,.025,38.6);scene.add(operations);
 equipment.batch(scene);
 const flowGroup=new THREE.Group();scene.add(flowGroup);
 const selectionRing=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:'#8eeefa',transparent:true,opacity:.8}));selectionRing.visible=false;scene.add(selectionRing);
 function resize(){const {clientWidth:w,clientHeight:h}=container;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
 function move(position,target,animate=true){if(!moving||!animate){camera.position.copy(position);orbit.target.copy(target);transition=null;orbit.update();}else transition={a:camera.position.clone(),b:position,c:orbit.target.clone(),d:target,t:0};drift={target:target.clone(),offset:position.clone().sub(target),start:time+2.2};}
 function fit(ids=null,animate=true){
  framedIds=ids;
  const bounds=new THREE.Box3();
  if(!ids){bounds.expandByPoint(new THREE.Vector3(...roomBounds.min));bounds.expandByPoint(new THREE.Vector3(...roomBounds.max));}
  else for(const id of ids){const o=objects.get(id);if(o){const p=o.group.position,pad=id==='workstations'?11:8;bounds.expandByPoint(p.clone().add(new THREE.Vector3(-pad,-1,-4)));bounds.expandByPoint(p.clone().add(new THREE.Vector3(pad,facilities.some(f=>f.id===id)?o.dimensions[1]+2:4,7)));}}
  if(bounds.isEmpty())return;const target=bounds.getCenter(new THREE.Vector3());
  const direction=new THREE.Vector3(.46,.66,1).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(19.5));let distance=24;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tan+p.dot(direction));}
  const padding=camera.aspect<1?1.18:1.10;move(target.clone().addScaledVector(direction,Math.min(distance*padding,480)),target,animate);
 }
 function clearFlow(){flows.length=0;while(flowGroup.children.length){const c=flowGroup.children[0];flowGroup.remove(c);c.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}}
 function showStep(step,color,allIds){
  clearFlow();activeIds=[step.from,step.to].filter(Boolean);selection='';selectionRing.visible=false;
  for(const [id,o] of objects){const active=activeIds.includes(id);o.label.material.opacity=active?1:allIds.includes(id)?.55:.19;o.label.visible=labelsVisible&&(active||facilities.some(f=>f.id===id));}
  for(const {zone,outline,halo} of zones){const active=zone.ids.some(id=>activeIds.includes(id));outline.material.opacity=active?.95:.2;if(halo)halo.material.opacity=active?.12:.045;}
  if(!step.manual&&step.from&&step.to){
   if(step.from==='root'||step.to==='root')throw new Error('Offline root cannot have a live flow');
   const from=objects.get(step.from),to=objects.get(step.to);const a=from.group.position.clone().add(from.anchor),b=to.group.position.clone().add(to.anchor);const mid=a.clone().lerp(b,.5);mid.y+=Math.min(10,a.distanceTo(b)*.28);
   // Routed flows pass through the illustrative core; no trace crosses the air gap.
   const sameSegment=objects.get(step.from).node.zone===objects.get(step.to).node.zone;
   const hub=objects.get('core').group.position.clone().add(objects.get('core').anchor);
   if(sameSegment)mid.z+=6;
   const curve=sameSegment?new THREE.QuadraticBezierCurve3(a,mid,b):new THREE.CatmullRomCurve3([a,a.clone().lerp(hub,.5).add(new THREE.Vector3(0,5,3)),hub,b.clone().lerp(hub,.5).add(new THREE.Vector3(0,5,3)),b],false,'centripetal');
   const line=new THREE.Mesh(new THREE.TubeGeometry(curve,80,.055,8,false),basic(color,.85));flowGroup.add(line);
   const sheath=new THREE.Mesh(new THREE.TubeGeometry(curve,80,.19,8,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.11,depthWrite:false,blending:THREE.AdditiveBlending}));flowGroup.add(sheath);
   for(let i=0;i<4;i++){
    const cone=new THREE.Mesh(new THREE.ConeGeometry(.17,.64,9),basic('#eaffff'));flowGroup.add(cone);const shine=glow(flowGroup,0,0,0,color,2,.75),tails=[];
    for(let j=0;j<5;j++){const tail=new THREE.Mesh(new THREE.SphereGeometry(.14-j*.019,6,5),basic(color,.5-j*.08));flowGroup.add(tail);tails.push(tail);}
    flows.push({curve,t:i/4,cone,shine,tails,speed:Math.min(.18,6/curve.getLength())});
   }
  }
  fit(!step.manual&&step.from&&step.to&&objects.get(step.from).node.zone!==objects.get(step.to).node.zone?[...activeIds,'core']:activeIds,true);updateFlow(0);
 }
 function updateFlow(dt){
  const up=new THREE.Vector3(0,1,0);
  for(const p of flows){p.t=(p.t+dt*p.speed)%1;p.cone.position.copy(p.curve.getPointAt(p.t));p.cone.quaternion.setFromUnitVectors(up,p.curve.getTangentAt(p.t).normalize());p.shine.position.copy(p.cone.position);p.tails.forEach((tail,i)=>{const t=p.t-(i+1)*.012;tail.visible=t>=0;if(t>=0)tail.position.copy(p.curve.getPointAt(t));});}
 }
 function select(id,focus=true){clearFlow();selection=id;activeIds=[id];const o=objects.get(id);if(!o)return;selectionRing.position.copy(o.group.position);if(id==='workstations'||id.startsWith('jump'))selectionRing.position.y+=1.4;selectionRing.scale.set(...o.dimensions).multiplyScalar(1.04);selectionRing.material.color.set(colors[o.node.zone]);selectionRing.visible=true;for(const [key,p]of objects){p.label.material.opacity=key===id?1:focus?.25:.75;p.label.visible=labelsVisible&&(key===id||facilities.some(f=>f.id===key));}if(focus)fit([id]);else fit(null,false);}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(pickables).find(hit=>hit.object.visible)?.object.userData.id;}
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY,performance.now()];});
 renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6&&performance.now()-down[2]<700){const id=pick(e);if(id)onSelect(id);}down=null;});
 renderer.domElement.addEventListener('pointermove',e=>{renderer.domElement.style.cursor=pick(e)?'pointer':'grab';});
 renderer.domElement.addEventListener('keydown',e=>{const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));if(e.key==='ArrowLeft')s.theta-=.12;else if(e.key==='ArrowRight')s.theta+=.12;else if(e.key==='ArrowUp')s.phi=Math.max(.1,s.phi-.1);else if(e.key==='ArrowDown')s.phi=Math.min(1.45,s.phi+.1);else if(e.key==='Home'){fit();e.preventDefault();return;}else return;e.preventDefault();drift=null;transition=null;camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(s));orbit.update();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.querySelector('#loading').hidden=false;container.querySelector('#loading').innerHTML='<strong>3D view paused</strong><span>Reload to restore graphics. Technical details remain available.</span>';});
 const observer=new ResizeObserver(()=>{resize();fit(framedIds,false);});observer.observe(container);resize();fit(null,false);container.querySelector('#loading').hidden=true;
 let last=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.06);last=now;
  if(moving){time+=dt;if(transition){transition.t+=dt;const p=Math.min(transition.t/2.2,1),t=p*p*(3-2*p);camera.position.lerpVectors(transition.a,transition.b,t);orbit.target.lerpVectors(transition.c,transition.d,t);if(p===1)transition=null;}else if(drift){const s=new THREE.Spherical().setFromVector3(drift.offset);s.theta+=Math.sin((time-drift.start)*.19)*.06;s.phi+=Math.sin((time-drift.start)*.13)*.012;camera.position.copy(drift.target).add(new THREE.Vector3().setFromSpherical(s));orbit.target.copy(drift.target);}for(const l of lights)l.material.emissiveIntensity=.35+1.1*Math.pow((Math.sin(time*1.6+l.phase)+1)/2,3);updateFlow(dt);if(selectionRing.visible&&selection!=='root')selectionRing.material.opacity=.6+.23*Math.sin(time*1.6);}
  orbit.update(dt);renderer.render(scene,camera);
 });
 function exportImage(){
  const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;
  try{
   renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=16/9;camera.updateProjectionMatrix();renderer.render(scene,camera);
   const link=document.createElement('a');link.download='inside-the-network-4k.png';link.href=renderer.domElement.toDataURL('image/png');link.click();
  }finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();renderer.render(scene,camera);}
 }
 function highlight(ids=[]){clearFlow();activeIds=ids;selection='';selectionRing.visible=false;for(const [id,o]of objects){o.label.material.opacity=!ids.length||ids.includes(id)?1:.2;o.label.visible=labelsVisible&&(ids.includes(id)||facilities.some(f=>f.id===id));}for(const {zone,outline,halo}of zones){const active=!ids.length||zone.ids.some(id=>ids.includes(id));outline.material.opacity=active?.8:.18;if(halo)halo.material.opacity=active?.1:.025;}fit(ids.length?ids:null);}
 return {showStep,select,highlight,exportImage,overview:()=>highlight(),frame:(ids)=>fit(ids),setLabels(on){labelsVisible=on;for(const label of labels)label.visible=on;for(const [id,o] of objects)o.label.visible=on&&(activeIds.includes(id)||selection===id||facilities.some(f=>f.id===id));},setMotion(on){moving=on;orbit.enableDamping=on&&!reduced;if(!on){if(transition){camera.position.copy(transition.b);orbit.target.copy(transition.d);}transition=null;drift=null;}},resize,dispose(){observer.disconnect();orbit.dispose();renderer.setAnimationLoop(null);const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}});for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();renderer.dispose();renderer.domElement.remove();}};
}
