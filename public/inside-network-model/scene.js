import * as THREE from 'three';
import {OrbitControls} from 'three/orbit';
import {vlans,facilities} from './architecture.js';
import {createEquipment} from './equipment.js';
import {dataCenterLayout,equipmentPosition,roomBounds,facilityPositions,offlinePosition} from './data-center-layout.js';

// A polyline with exact arc-length parameters. Traffic routes follow the overhead cable trays.
class Route extends THREE.Curve{
 constructor(points){super();this.points=points;this.lengths=[0];for(let i=1;i<points.length;i++)this.lengths.push(this.lengths[i-1]+points[i].distanceTo(points[i-1]));this.total=Math.max(this.lengths[this.lengths.length-1],1e-6);}
 locate(t){const d=THREE.MathUtils.clamp(t,0,1)*this.total;let lo=0,hi=this.lengths.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(this.lengths[mid]<=d)lo=mid;else hi=mid;}return [lo,d];}
 getPoint(t,target=new THREE.Vector3()){const [i,d]=this.locate(t),span=this.lengths[i+1]-this.lengths[i];return target.lerpVectors(this.points[i],this.points[i+1],span>0?(d-this.lengths[i])/span:0);}
 getPointAt(u,target){return this.getPoint(u,target);}
 getTangent(t,target=new THREE.Vector3()){const [i]=this.locate(t);return target.subVectors(this.points[i+1],this.points[i]).normalize();}
 getTangentAt(u,target){return this.getTangent(u,target);}
 getLength(){return this.total;}
 nearest(point){let best=0,distance=Infinity;this.points.forEach((p,i)=>{const d=p.distanceToSquared(point);if(d<distance){distance=d;best=i;}});return this.lengths[best]/this.total;}
}
// Round each corner of a path with a short bend, the way a cable is dressed in a tray.
function rounded(points,radius=.9,steps=6){
 const out=[points[0].clone()];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1],r=Math.min(radius,a.distanceTo(b)/2,c.distanceTo(b)/2);
  if(r<1e-3){out.push(b.clone());continue;}
  const bend=new THREE.QuadraticBezierCurve3(b.clone().add(a.clone().sub(b).setLength(r)),b.clone(),b.clone().add(c.clone().sub(b).setLength(r)));
  for(let s=0;s<=steps;s++)out.push(bend.getPoint(s/steps));
 }
 out.push(points[points.length-1].clone());
 return out.filter((p,i)=>i===0||p.distanceToSquared(out[i-1])>1e-6);
}
const sampled=(curve,n=48)=>new Route(Array.from({length:n+1},(_,i)=>curve.getPoint(i/n)));
const smooth=t=>t*t*(3-2*t);

export function createNetworkScene(container,nodes,onSelect,onInteract=()=>{},hooks={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let moving=!reduced,labelMode='focus',stepMode=false,selection='',hoverId='',activeIds=[],routedActive=false,transition=null,drift=null,time=0,framedIds=null;
 let view='physical',morph=null,theme='standard',cameraMode='guided',guide=null,stepSeconds=10,lastCall={fn:'highlight',args:[[]]},connectionState=null,exportSize=null;
 const objects=new Map(),pickables={physical:[],logical:[]},lights=[];
 const colors={...Object.fromEntries(vlans.map(v=>[v.id,v.color])),core:'#7bddf0',media:'#eeb978',backup:'#86c4f1',offline:'#e5c58e'};
 const policyColors={permit:'#7fe0b7',traffic:'#7fe0b7',pending:'#e6bc82',deny:'#ee9294'};
 const layout=dataCenterLayout(vlans);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#081522');scene.fog=new THREE.FogExp2('#081522',.004);
 const camera=new THREE.PerspectiveCamera(39,1,.1,900);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=container.clientWidth>=720;renderer.shadowMap.type=THREE.PCFShadowMap;
 container.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','3D data center with server racks, network switches, workstations, and offline equipment. Drag to orbit, scroll to zoom, or select a system. Arrow keys rotate; Home shows the full network.');
 const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=!reduced;orbit.dampingFactor=.075;orbit.minDistance=10;orbit.maxDistance=500;orbit.maxPolarAngle=Math.PI*.47;orbit.minPolarAngle=.09;orbit.enablePan=true;
 // Any drag or zoom hands the camera to the viewer for the rest of the step.
 orbit.addEventListener('start',()=>{transition=null;drift=null;if(guide)guide.user=true;onInteract();});
 const hemi=new THREE.HemisphereLight('#c8e8ff','#26323c',2.5);scene.add(hemi);
 const key=new THREE.DirectionalLight('#ecfbff',3.5);key.position.set(-18,40,25);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-45,right:45,top:50,bottom:-45,near:1,far:110});key.shadow.normalBias=.15;scene.add(key);
 const rim=new THREE.DirectionalLight('#9dc1df',1.7);rim.position.set(25,22,-25);scene.add(rim);
 const fill=new THREE.PointLight('#51d7ef',70,65,1.4);fill.position.set(0,13,7);scene.add(fill);
 const physical=new THREE.Group(),logical=new THREE.Group(),labelLayer=new THREE.Group(),flowGroup=new THREE.Group(),connectionGroup=new THREE.Group();
 logical.visible=false;scene.add(physical,logical,labelLayer,flowGroup,connectionGroup);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.16,'#ffffff88');gradient.addColorStop(.45,'#ffffff22');gradient.addColorStop(1,'#ffffff00');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(glowCanvas);
 const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
 function glow(parent,x,y,z,color,size=2,opacity=.55){const o=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));o.position.set(x,y,z);o.scale.setScalar(size);parent.add(o);return o;}
 const finishTexture=(canvas,mips=true)=>{const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;if(mips){texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();}return texture;};
 // Floor markings stay in the room at world scale.
 function floorText(text,color,width){
  const c=document.createElement('canvas');c.width=768;c.height=110;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 63px Segoe UI,Arial';ctx.fillText(text,384,55,710);
  const o=new THREE.Mesh(new THREE.PlaneGeometry(width,width*110/768),new THREE.MeshBasicMaterial({map:finishTexture(c),transparent:true,depthWrite:false,side:THREE.DoubleSide}));o.rotation.x=-Math.PI/2;return o;
 }

 // ---- Screen-space labels: constant on-screen size, decluttered by priority every frame ----
 // Text is drawn at the size it appears on screen (and redrawn for 4K export and recording), so it stays sharp.
 const labels=[];let reserved=[];
 const makeText=(width,height,draw,grow=1)=>({width,height,aspect:height/width,draw,texture:null,texW:0,grow});
 const measure=document.createElement('canvas').getContext('2d');
 function labelTexture(title,sub,color,width=400){
  // Widen the label to fit its text instead of squeezing the letters. screenLabel scales the on-screen
  // size by the same factor, so every label keeps one type size.
  const base=width,titleFont='650 36px Inter,Segoe UI,Arial',subFont='600 27px Inter,Segoe UI,Arial';
  measure.font=titleFont;let need=measure.measureText(title).width;
  if(sub){measure.font=subFont;need=Math.max(need,measure.measureText(sub).width);}
  width=Math.max(width,Math.ceil(need+40));
  const height=sub?108:64;
  return makeText(width,height,ctx=>{
   ctx.fillStyle='rgba(5,17,30,.93)';ctx.beginPath();ctx.roundRect(2,2,width-4,height-4,12);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#eef8ff';ctx.font=titleFont;ctx.fillText(title,width/2,sub?37:33,width-30);
   if(sub){ctx.font=subFont;ctx.fillStyle=color;ctx.fillText(sub,width/2,79,width-30);}
  },width/base);
 }
 function textureFor(text,target){
  target=THREE.MathUtils.clamp(Math.round(target),48,2048);
  if(text.texture&&Math.abs(text.texW-target)<=Math.max(6,target*.12))return text.texture;
  const c=document.createElement('canvas');c.width=target;c.height=Math.max(1,Math.round(target*text.aspect));const ctx=c.getContext('2d');ctx.scale(target/text.width,c.height/text.height);text.draw(ctx);
  text.texture?.dispose();const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
  text.texture=texture;text.texW=target;return texture;
 }
 // kind: zone | facility | node (physical) · island | lfacility | lnode (logical) · badge | connection (temporary)
 const leaderMaterial=new THREE.SpriteMaterial({color:'#bfe3f2',transparent:true,depthWrite:false,depthTest:false,sizeAttenuation:false,fog:false});
 function screenLabel(text,{kind,id=null,zone=null,px=170,position,own=false,color='#bfe3f2'}){
  px*=text.grow||1;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:textureFor(text,px),transparent:true,depthWrite:false,depthTest:false,sizeAttenuation:false,opacity:0,fog:false}));
  sprite.center.set(.5,0);sprite.renderOrder=kind==='badge'?32:24;sprite.visible=false;labelLayer.add(sprite);
  // A thin leader connects a label that had to move up to its anchor.
  const leader=new THREE.Sprite(leaderMaterial.clone());leader.material.color.set(color);leader.center.set(.5,0);leader.renderOrder=23;leader.visible=false;labelLayer.add(leader);
  const entry={sprite,leader,text,kind,id,zone,px,position,own,alpha:0,show:false,scale:0,step:0};labels.push(entry);return entry;
 }
 function removeLabel(entry){const i=labels.indexOf(entry);if(i>=0)labels.splice(i,1);entry.sprite.removeFromParent();entry.leader.removeFromParent();entry.leader.material.dispose();if(entry.own)entry.text.texture?.dispose();entry.sprite.material.dispose();}
 const physicalKinds=new Set(['zone','facility','node']);
 const isActive=id=>activeIds.includes(id)||selection===id;
 function labelPriority(e,camDistance){
  if(e.kind==='badge')return flowGroup.visible?1000:-1;
  if(e.kind==='connection')return connectionGroup.visible?34:-1;
  if(labelMode==='off')return -1;
  const target=physicalKinds.has(e.kind)?'physical':'logical';
  if(view!==target||morph&&morph.t<.75)return -1;
  // During a traffic step, only the step's own systems, their segments, and the core keep labels
  // (others appear on hover), so the two or three things that matter stand out. "All labels" turns this off.
  const quiet=stepMode&&labelMode==='focus',hoverZone=hoverId&&objects.get(hoverId)?.zone;
  const zoneActive=e.zone&&activeZones.has(e.zone);
  if(e.kind==='zone'||e.kind==='island')return zoneActive?82:quiet&&e.zone!==hoverZone?-1:50;
  if(e.kind==='facility'||e.kind==='lfacility'){
   if(isActive(e.id)||quiet&&e.id==='core'&&routedActive)return 84;
   if(quiet&&hoverId!==e.id)return -1;
   return e.id==='core'?46:38;
  }
  // Server-level labels appear for active, selected, or hovered systems, and when the camera is close.
  if(isActive(e.id))return 100;if(hoverId===e.id)return 96;
  return !quiet&&camDistance(e)<(view==='logical'?42:34)?60:-1;
 }
 const projected=new THREE.Vector3(),placements=[[0,0],[1,0],[2,0],[1,-1],[1,1],[2,-1],[2,1],[3,0],[3,-1],[3,1],[2,-2],[2,2],[4,0],[4,-1],[4,1],[3,-2],[3,2],[5,0],[5,-1],[5,1]];
 // Each label tries its previous placement first; these orders are built once.
 const placementOrders=placements.map((_,first)=>[first,...placements.keys()].filter((index,i)=>i===0||index!==first));
 let activeZones=new Set();const ranked=[];
 function labelScale(){const {w,h}=viewSize();if(exportSize)return h/800;if(output)return Math.min(h/800,w/700)*1.15;return THREE.MathUtils.clamp(Math.min(h/800,w/620),.8,1.2);}
 function updateLabels(dt){
  const {w,h}=viewSize();if(!w||!h)return;
  // HTML overlays on the stage (heading, tools, caption) reserve their space, so labels avoid them.
  const k=labelScale(),tanHalf=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),placed=output||exportSize?[]:reserved.map(r=>[r.x,r.y,r.x+r.w,r.y+r.h]),density=output||exportSize?1:renderer.getPixelRatio();
  const camDistance=e=>camera.position.distanceTo(e.position);
  activeZones.clear();for(const id of activeIds)activeZones.add(objects.get(id)?.zone);if(selection)activeZones.add(objects.get(selection)?.zone);
  for(const e of labels){e.priority=labelPriority(e,camDistance);e.show=false;}
  const free=(x0,y0,x1,y1)=>{if(x0<-2||x1>w+2||y0<-2||y1>h+2)return false;for(const r of placed)if(r[0]<x1&&r[2]>x0&&r[1]<y1&&r[3]>y0)return false;return true;};
  ranked.length=0;for(const e of labels)if(e.priority>=0)ranked.push(e);ranked.sort((a,b)=>b.priority-a.priority);
  for(const e of ranked){
   projected.copy(e.position).project(camera);
   if(projected.z>1||projected.z<-1||Math.abs(projected.x)>1.1||Math.abs(projected.y)>1.1)continue;
   const sw=e.px*k,sh=sw*e.text.aspect,x=(projected.x+1)/2*w,y=(1-projected.y)/2*h,half=(sh+9)/2;
   // Crowded labels move up (and slightly sideways) on a leader line, so neighbouring racks can all be named.
   // The previous placement is tried first, which keeps labels steady while the camera moves.
   const order=placementOrders[e.step];let chosen=-1;
   for(const index of order){const [up,side]=placements[index],dy=up*half,dx=side*sw*.42;if(free(x+dx-sw/2-3,y-sh-3-dy,x+dx+sw/2+3,y+3-dy)){chosen=index;break;}}
   // Policy badges always show: when every spot is covered, they take their own spot anyway.
   if(chosen<0&&e.kind==='badge')chosen=0;
   if(chosen<0)continue;
   const [up,side]=placements[chosen],dy=up*half,dx=side*sw*.42,rect=[x+dx-sw/2-3,y-sh-3-dy,x+dx+sw/2+3,y+3-dy];
   placed.push(rect);e.rect=rect;e.step=chosen;e.lift=up*half;e.shift=side*sw*.42;e.show=true;e.unit=2*tanHalf/h;e.scale=sw*e.unit;e.target=sw*density;e.sh=sh;e.sw=sw;
  }
  const rate=moving&&dt>0?Math.min(1,dt*9):1;
  for(const e of labels){
   e.alpha+=((e.show?1:0)-e.alpha)*rate;if(!e.show&&e.alpha<.02)e.alpha=0;
   e.sprite.visible=e.alpha>.02;e.leader.visible=e.sprite.visible&&e.lift>0;
   if(!e.sprite.visible)continue;
   const map=textureFor(e.text,e.target||e.px);if(e.sprite.material.map!==map){e.sprite.material.map=map;e.sprite.material.needsUpdate=true;}
   // Inactive labels dim rather than turn see-through, so their text stays readable.
   const dim=e.kind==='badge'||e.kind==='connection'||!activeIds.length&&!selection||e.priority>=80?1:.74;
   e.sprite.position.copy(e.position);e.sprite.scale.set(e.scale,e.scale*e.text.aspect,1);e.sprite.center.set(.5-e.shift/e.sw,-e.lift/e.sh);e.sprite.material.opacity=e.alpha;e.sprite.material.color.setScalar(dim);
   if(e.leader.visible){e.leader.position.copy(e.position);e.leader.scale.set(1.5*e.unit,Math.hypot(e.lift,e.shift)*e.unit,1);e.leader.material.rotation=-Math.atan2(e.shift,e.lift);e.leader.material.opacity=e.alpha*.7*dim;}
  }
 }
 // ---- Physical room ----
 const equipment=createEquipment(lights);
 equipment.room(physical);
 const hitMaterial=new THREE.MeshBasicMaterial({visible:false}),zoneOutlines=[];
 for(const zone of layout){
  const color=colors[zone.id],fadeKey='zone-'+zone.id;
  if(zone.kind==='rack'){const rack=new THREE.Group();rack.position.set(zone.x,0,zone.z);rack.userData.fadeKey=fadeKey;physical.add(rack);equipment.rack(rack,{code:zone.rack,color,name:`VLAN ${zone.number}`});}
  // Rack names stay readable in the full-room view: compact labels that step up on a leader line when crowded.
  screenLabel(labelTexture(`VLAN ${zone.number}${zone.kind==='rack'?' · '+zone.rack:''}`,zone.name,color,320),{kind:'zone',zone:zone.id,px:126,color,position:new THREE.Vector3(zone.x,zone.kind==='rack'?12.9:5.6,zone.z)});
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(zone.w,.015,zone.d)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.26}));
  outline.position.set(zone.x,.015,zone.z);physical.add(outline);zoneOutlines.push({zone,outline});
  for(const [i,id]of zone.ids.entries()){
   const node=nodes.find(n=>n.id===id),g=new THREE.Group();g.position.set(...equipmentPosition(zone,i));g.userData.fadeKey=fadeKey;physical.add(g);
   if(id==='workstations')for(let j=0;j<50;j++)equipment.workstation(g,(j%10-4.5)*1.82,(Math.floor(j/10)-2)*2.08,.5,'#5a849c');
   else if(zone.kind==='desks')equipment.workstation(g,0,0,1.1,'#799ba9');
   else equipment.server(g,node,color);
   const dimensions=id==='workstations'?[19,2.5,11]:zone.kind==='desks'?[3.7,3.6,3.7]:[5.8,1.55,5];
   const hit=new THREE.Mesh(new THREE.BoxGeometry(...dimensions),hitMaterial);hit.position.y=zone.kind==='rack'?0:1.4;hit.userData.id=id;g.add(hit);pickables.physical.push(hit);
   const offset=id==='workstations'?[0,4.4,0]:zone.kind==='desks'?[0,4.1,0]:[i%2?3.7:-3.7,.15,2.9];
   const text=labelTexture(id==='workstations'?'50 WINDOWS 11 PCs':node.name,node.address,color);
   objects.set(id,{node,group:g,dimensions,anchor:new THREE.Vector3(0,zone.kind==='rack'?.3:2,zone.kind==='rack'?2.7:0),fadeKey,zone:zone.id,color,text,
    label:screenLabel(text,{kind:'node',id,zone:zone.id,px:160,position:g.position.clone().add(new THREE.Vector3(...offset))})});
  }
 }
 const rootNode=nodes.find(n=>n.id==='root'),rootBase=new THREE.Group();rootBase.position.set(offlinePosition[0],0,offlinePosition[1]);rootBase.userData.fadeKey='offline-root';physical.add(rootBase);
 equipment.mediaCabinet(rootBase,{label:'OFFLINE ROOT CA',color:colors.offline});
 const rootDevice=new THREE.Group();rootDevice.position.set(offlinePosition[0],7.25,offlinePosition[1]);rootDevice.userData.fadeKey='offline-root';physical.add(rootDevice);equipment.server(rootDevice,rootNode,colors.offline,{offline:true});
 const rootHit=new THREE.Mesh(new THREE.BoxGeometry(6,2,5),hitMaterial);rootHit.userData.id='root';rootDevice.add(rootHit);pickables.physical.push(rootHit);
 const rootText=labelTexture(rootNode.name,'OFFLINE · NO LIVE LINK',colors.offline);
 objects.set('root',{node:rootNode,group:rootDevice,dimensions:[6,2,5],anchor:new THREE.Vector3(0,0,2.7),fadeKey:'offline-root',zone:'offline',color:colors.offline,text:rootText,label:screenLabel(rootText,{kind:'node',id:'root',zone:'offline',px:160,position:rootDevice.position.clone().add(new THREE.Vector3(-3.7,.15,2.9))})});
 screenLabel(labelTexture('OFFLINE ROOT','Local access · no network cable',colors.offline),{kind:'facility',id:'root',px:175,position:new THREE.Vector3(offlinePosition[0],10.9,offlinePosition[1])});
 function facility(id,height,sub){
  const f=facilities.find(f=>f.id===id),position=facilityPositions[id],g=new THREE.Group();g.position.set(position[0],0,position[1]);g.userData.fadeKey='facility-'+id;physical.add(g);
  const dimensions=id==='media'?[15,4,8]:[7,height,6];
  const hit=new THREE.Mesh(new THREE.BoxGeometry(...dimensions),hitMaterial);hit.position.y=height/2;hit.userData.id=id;g.add(hit);pickables.physical.push(hit);
  // Short room labels; the inspector keeps the full names.
  const text=labelTexture(({media:'MEDIA HANDLING',backup:'OFFLINE BACKUP'})[id]||f.name.toUpperCase(),sub,f.color);
  objects.set(id,{node:{id,zone:id,name:f.name},group:g,dimensions,anchor:new THREE.Vector3(0,id==='core'?9:height/2,2.8),fadeKey:'facility-'+id,zone:id,color:f.color,facility:true,text,label:screenLabel(text,{kind:'facility',id,zone:id,px:175,position:new THREE.Vector3(position[0],height+1.4,position[1])})});
  return g;
 }
 const core=facility('core',12.6,'Routing · default deny');equipment.rack(core,{code:'R07',name:'NETWORK CORE',color:'#8cc9d8',switching:false});
 equipment.networkSwitch(core,9.3,{label:'CORE SWITCH 01'});equipment.networkSwitch(core,7.1,{label:'CORE SWITCH 02'});
 equipment.plate(core,'INTERNAL ROUTING / ACCESS CONTROL',5.5,0,4.4,2.7,{height:.35,color:'#9cc9d8'});
 for(let i=0;i<6;i++)equipment.cable(core,[[-2.1+i*.5,9.25,2.3],[-2.1+i*.5,8.4,3.1],[-2.1+i*.5,7.15,2.3]],i%2?'#557b99':'#669397',.04);
 const media=facility('media',4.3,'Approved media · carried by hand');equipment.workstation(media,-3.7,0,1.35,'#a49271');equipment.workstation(media,3.7,0,1.35,'#a49271');
 equipment.plate(media,'IMPORT',3.3,-3.7,2.2,1.55,{color:'#e5c58e'});equipment.plate(media,'EXPORT',3.3,3.7,2.2,1.55,{color:'#e5c58e'});
 const backup=facility('backup',7,'Protected offline copies');equipment.mediaCabinet(backup,{label:'PROTECTED OFFLINE BACKUPS'});
 // Internal cable routes stop inside the room. The offline root and media handling never have uplinks.
 const trayZ=zone=>zone.z<0?-19:1;
 for(const zone of layout){const y=zone.kind==='rack'?12.5:3.1;equipment.cable(physical,[[zone.x,y,zone.z-2.9],[zone.x,13,trayZ(zone)],[1,13,trayZ(zone)],[1,12.5,5.1]],'#446074',.045);}
 const aisle=floorText('SERVER AISLE','#dde5e9',12);aisle.position.set(-6,.025,-1.8);physical.add(aisle);
 const operations=floorText('OPERATIONS / WORKSTATIONS','#b7c9d6',15);operations.position.set(-15,.025,38.6);physical.add(operations);
 const registry=equipment.batch(physical);
 // Fades: x-ray per equipment group, combined with the physical/logical morph.
 const batchedMeshes=new Set(registry.meshes.map(m=>m.mesh)),roomDecor=[];let floorMesh=null;
 const keyed=o=>{for(let p=o;p&&p!==physical;p=p.parent)if(p.userData?.fadeKey)return true;return false;};
 physical.traverse(o=>{if(o===physical||batchedMeshes.has(o)||!(o.isMesh||o.isLine||o.isSprite)||keyed(o))return;if(o.userData.floor)floorMesh=o;else roomDecor.push(o);});
 const fadeKeys=[...new Set([...registry.bounds.keys(),...registry.groups.keys()])],xray=new Map(fadeKeys.map(k=>[k,{value:1,target:1,applied:1}]));
 let physicalAmount=1;
 const dimState=new Map(fadeKeys.map(k=>[k,{value:1,target:1,applied:1}]));
 function applyFades(force=false){
  for(const [k,state] of xray){const value=k==='room'?physicalAmount:state.value*physicalAmount;if(force||Math.abs(value-state.applied)>.004){equipment.setFade(registry,k,value);state.applied=value;}}
  if(floorMesh){const transparent=physicalAmount<.999;if(floorMesh.material.transparent!==transparent){floorMesh.material.transparent=transparent;floorMesh.material.needsUpdate=true;}floorMesh.material.opacity=physicalAmount;floorMesh.material.depthWrite=physicalAmount>.5;floorMesh.visible=physicalAmount>.01;}
  for(const o of roomDecor)o.visible=physicalAmount>.5;
  physical.visible=physicalAmount>.001;
 }
 // Fade whatever stands between the camera and the active equipment (racks, cabinets, walls).
 const sight=new THREE.Ray(),hitPoint=new THREE.Vector3();
 let sightKey='',protectedKeys=new Set(),sightPoints=[];
 function refreshSight(){
  const shown=[...new Set(activeIds.concat(selection?[selection]:[]))].filter(id=>objects.has(id)),key=`${view}|${!!morph}|${routedActive}|${shown.join()}`;
  if(key===sightKey)return;sightKey=key;
  protectedKeys=new Set(shown.map(id=>objects.get(id).fadeKey));if(routedActive)protectedKeys.add('facility-core');
  sightPoints=view==='physical'&&!morph?shown.map(anchorOf):[];if(routedActive&&sightPoints.length)sightPoints.push(hubPoint);
 }
 function updateXray(dt){
  refreshSight();const points=sightPoints;
  for(const [k,state] of xray){
   state.target=1;
   if(k==='room'||protectedKeys.has(k)||!registry.bounds.has(k))continue;
   for(const p of points){sight.origin.copy(camera.position);sight.direction.subVectors(p,camera.position);const distance=sight.direction.length();sight.direction.normalize();
    if(sight.intersectBox(registry.bounds.get(k),hitPoint)&&hitPoint.distanceTo(camera.position)<distance-1.5){state.target=.22;break;}}
  }
  const rate=moving&&dt>0?Math.min(1,dt*5):1;
  for(const state of xray.values())state.value+=(state.target-state.value)*rate;
  applyFades();
  // Equipment outside the current step steps back (darker, still solid) so the step's systems stand out.
  const quiet=stepMode&&view==='physical'&&!morph;
  for(const [k,state] of dimState){
   state.target=quiet&&k!=='room'&&!protectedKeys.has(k)?.42:1;
   state.value+=(state.target-state.value)*rate;
   if(Math.abs(state.value-state.applied)>.004){equipment.setDim(registry,k,state.value);state.applied=state.value;}
  }
 }

 // ---- Logical view: VLAN islands around the core, with the offline area kept apart ----
 const islandOrder=['v10','v20','v30','v40','v60','v80','v70','v50'],islandAngles=[202.5,247.5,292.5,337.5,22.5,67.5,112.5,157.5];
 const islands=new Map(),hubLogical=new THREE.Vector3(0,1.9,0),logicalFade=[];
 const fadeMaterial=(material,base)=>{material.userData.base=base??material.opacity;material.userData.depthWrite=material.depthWrite;material.transparent=true;logicalFade.push(material);return material;};
 const ground=new THREE.Mesh(new THREE.CircleGeometry(62,96),fadeMaterial(new THREE.MeshBasicMaterial({color:'#0c2236',transparent:true,opacity:.55,depthWrite:false}),.55));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.05,6);logical.add(ground);
 const coreHex=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,1.5,6),fadeMaterial(new THREE.MeshStandardMaterial({color:'#18485a',emissive:'#1d6578',emissiveIntensity:.5,metalness:.4,roughness:.45}),1));coreHex.position.set(0,.75,0);logical.add(coreHex);
 const coreHit=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,2,6),hitMaterial);coreHit.position.copy(coreHex.position);coreHit.userData.id='core';logical.add(coreHit);pickables.logical.push(coreHit);
 const coreRim=new THREE.Mesh(new THREE.TorusGeometry(3.45,.09,8,6),fadeMaterial(basic(colors.core,.9),.9));coreRim.rotation.x=Math.PI/2;coreRim.rotation.z=Math.PI/6;coreRim.position.y=1.52;logical.add(coreRim);
 islandOrder.forEach((zid,i)=>{
  const zone=vlans.find(v=>v.id===zid),a=THREE.MathUtils.degToRad(islandAngles[i]),center=new THREE.Vector3(31*Math.cos(a),0,21*Math.sin(a)),n=zone.ids.length,radius=n===1?3.6:3.2+n;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(radius,64),fadeMaterial(new THREE.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.1,depthWrite:false}),.1));disc.rotation.x=-Math.PI/2;disc.position.copy(center).setY(.02);logical.add(disc);
  const ring=new THREE.Mesh(new THREE.RingGeometry(radius-.12,radius,72),fadeMaterial(new THREE.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide}),.55));ring.rotation.x=-Math.PI/2;ring.position.copy(center).setY(.04);logical.add(ring);
  // The VLAN's uplink to the core: the only way traffic leaves the segment.
  const from=center.clone().add(center.clone().negate().setLength(radius)).setY(.25),to=center.clone().setLength(3.5).setY(.25);
  const spoke=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(from,to),8,.09,6,false),fadeMaterial(new THREE.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.42,depthWrite:false}),.42));logical.add(spoke);
  islands.set(zid,{zone,center,radius,ring,disc});
  screenLabel(labelTexture(`VLAN ${zone.number} · ${zone.subnet}`,zone.name,zone.color,460),{kind:'island',zone:zid,px:175,position:center.clone().add(new THREE.Vector3(0,2.6,-radius*.85))});
  zone.ids.forEach((id,j)=>{const angle=-Math.PI/2+j*Math.PI*2/n+(n===2?Math.PI/2:0),r=n===1?0:n===2?2.3:2.9;objects.get(id).logical={position:center.clone().add(new THREE.Vector3(Math.cos(angle)*r,1.5,Math.sin(angle)*r))};});
 });
 // Offline area: no spoke, no uplink. People carry approved media in and out.
 const offlinePlaces={root:new THREE.Vector3(-7,1.5,31.5),media:new THREE.Vector3(0,1.5,31.5),backup:new THREE.Vector3(7,1.5,31.5)};
 for(const [id,position] of Object.entries(offlinePlaces))objects.get(id).logical={position};
 objects.get('core').logical={position:hubLogical.clone()};
 {
  const pts=[[-11,27.5],[11,27.5],[11,35.5],[-11,35.5],[-11,27.5]].map(([x,z])=>new THREE.Vector3(x,.06,z)),boundary=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),fadeMaterial(new THREE.LineDashedMaterial({color:colors.offline,dashSize:.8,gapSize:.6,transparent:true,opacity:.85}),.85));
  boundary.computeLineDistances();logical.add(boundary);
  screenLabel(labelTexture('OFFLINE AREA','No network link · media by hand',colors.offline),{kind:'lfacility',id:'offline',px:180,position:new THREE.Vector3(0,1.2,27.1)});
  screenLabel(labelTexture('CORE SWITCH STACK','Routing · default deny',colors.core),{kind:'lfacility',id:'core',zone:'core',px:175,position:new THREE.Vector3(0,3.2,-2.4)});
 }
 // One glyph per system, carrying the same role icon as its faceplate.
 for(const [id,o] of objects){
  if(!o.logical||id==='core')continue;
  const color=o.color,sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:equipment.iconTexture(equipment.roleOf(id)||'gear',color),transparent:true,opacity:0,depthWrite:false}));
  sprite.scale.setScalar(id==='workstations'?3.1:2.5);sprite.renderOrder=12;logical.add(sprite);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.4,.22,24),fadeMaterial(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5}),.5));pad.position.copy(o.logical.position).setY(.12);logical.add(pad);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(3,3.2,3),hitMaterial);hit.position.copy(o.logical.position);hit.userData.id=id;logical.add(hit);pickables.logical.push(hit);
  o.logical.glyph=sprite;
  if(!o.facility)o.logical.label=screenLabel(o.text,{kind:'lnode',id,zone:o.zone,px:160,position:o.logical.position.clone().add(new THREE.Vector3(0,1.6,0))});
  else screenLabel(o.text,{kind:'lfacility',id,zone:id,px:170,position:o.logical.position.clone().add(new THREE.Vector3(0,1.6,0))});
 }
 // Morph: the room dissolves while each system's glyph travels from its rack to its island.
 let logicalAmount=0;
 const glyphFrom=new THREE.Vector3();
 function applyLogical(amount){
  logicalAmount=amount;logical.visible=amount>.001;
  // While fading, nothing writes depth, so half-faded pieces never punch holes in the room behind them.
  for(const m of logicalFade){m.opacity=m.userData.base*smooth(THREE.MathUtils.clamp((amount-.35)/.65,0,1));m.depthWrite=m.userData.depthWrite&&amount>.999;}
  for(const [id,o] of objects){
   if(!o.logical?.glyph)continue;
   glyphFrom.copy(o.group.position).add(o.anchor);if(id==='root')glyphFrom.y+=1;
   const travel=smooth(THREE.MathUtils.clamp((amount-.1)/.8,0,1));
   o.logical.glyph.position.lerpVectors(glyphFrom,o.logical.position,travel);o.logical.glyph.position.y+=Math.sin(travel*Math.PI)*4;
   o.logical.glyph.material.opacity=smooth(THREE.MathUtils.clamp(amount/.2,0,1));
  }
  physicalAmount=1-smooth(THREE.MathUtils.clamp(amount/.55,0,1));applyFades();
 }
 // ---- Camera framing ----
 // Phone overlays cover the top and bottom of the stage; insets keep the framed equipment in the clear band.
 let insets={top:0,bottom:0},output=null,frameHook=null,onScreen=true,forceActive=false,running=false;
 const viewSize=()=>exportSize||(output?{w:output.w,h:output.h}:{w:container.clientWidth,h:container.clientHeight});
 function applyInsets(){const {w,h}=viewSize(),shift=insets.bottom-insets.top;if(w&&h&&Math.abs(shift)>.001)camera.setViewOffset(w,h,0,shift*h/2,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();}
 function resize(){if(output)return;const {clientWidth:w,clientHeight:h}=container;if(!w||!h)return;camera.aspect=w/h;applyInsets();renderer.setSize(w,h);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(w,h);}}
 function move(position,target,animate=true){if(!moving||!animate){camera.position.copy(position);orbit.target.copy(target);transition=null;orbit.update();}else transition={a:camera.position.clone(),b:position,c:orbit.target.clone(),d:target,t:0};drift={target:target.clone(),offset:position.clone().sub(target),start:time+2.2};}
 function fit(ids=null,animate=true){
  framedIds=ids;
  const bounds=new THREE.Box3(),logicalView=view==='logical';
  if(!ids){
   if(logicalView){bounds.expandByPoint(new THREE.Vector3(-38,0,-27));bounds.expandByPoint(new THREE.Vector3(38,3,37));}
   else{bounds.expandByPoint(new THREE.Vector3(...roomBounds.min));bounds.expandByPoint(new THREE.Vector3(...roomBounds.max));}
  }
  else for(const id of ids){const o=objects.get(id);if(!o)continue;
   if(logicalView){const p=o.logical?.position;if(!p)continue;const pad=id==='workstations'?6.5:5.5;bounds.expandByPoint(p.clone().add(new THREE.Vector3(-pad,-1.5,-pad)));bounds.expandByPoint(p.clone().add(new THREE.Vector3(pad,4,pad)));}
   else{const p=o.group.position,pad=id==='workstations'?11:8;bounds.expandByPoint(p.clone().add(new THREE.Vector3(-pad,-1,-4)));bounds.expandByPoint(p.clone().add(new THREE.Vector3(pad,o.facility?o.dimensions[1]+2:4,7)));}}
  if(bounds.isEmpty())return;const target=bounds.getCenter(new THREE.Vector3());
  // Portrait screens look down more steeply, so the room fills the narrow frame. Landscape clips use a lower, cinematic angle.
  // The logical view looks down on the islands like a diagram.
  const portrait=camera.aspect<.8,direction=(logicalView?(portrait?new THREE.Vector3(.08,1.9,1):new THREE.Vector3(.16,1.25,1)):portrait?new THREE.Vector3(.2,1.2,1):output&&camera.aspect>1.5?new THREE.Vector3(.5,.42,1):new THREE.Vector3(.46,.66,1)).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(19.5)),tanV=tan*Math.max(.35,1-insets.top-insets.bottom);let distance=24;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tanV+p.dot(direction));}
  const padding=output?1:portrait?1.08:camera.aspect<1?1.18:1.10,position=target.clone().addScaledVector(direction,Math.min(distance*padding,480));move(position,target,animate);
  return {position:position.clone(),target:target.clone()};
 }

 // ---- Traffic routes: up into the cable trays, along them to the core, a rule check, and back out ----
 const hubPoint=new THREE.Vector3(1,9.3,10.9),laneIn=.1,laneOut=1.9,trayHeight=13.2;
 const anchorOf=id=>{const o=objects.get(id);return view==='logical'&&o.logical?o.logical.position.clone():o.group.position.clone().add(o.anchor);};
 const zoneOf=id=>layout.find(z=>z.id===objects.get(id)?.zone);
 function trayLeg(id){
  const zone=zoneOf(id),a=anchorOf(id),tz=trayZ(zone);
  if(zone.kind==='rack')return [a,new THREE.Vector3(a.x,trayHeight,a.z),new THREE.Vector3(a.x,trayHeight,tz)];
  return [a,new THREE.Vector3(zone.x,3.4,zone.z-2.9),new THREE.Vector3(zone.x,trayHeight,tz)];
 }
 function physicalPath(step){
  const from=objects.get(step.from),to=objects.get(step.to);
  if(step.from===step.to){const g=from.group.position,a=g.clone().add(new THREE.Vector3(-5.5,1.6,-2)),b=g.clone().add(new THREE.Vector3(5.5,1.6,2)),mid=a.clone().lerp(b,.5);mid.y+=4.5;return {route:sampled(new THREE.QuadraticBezierCurve3(a,mid,b)),hubT:null,gateT:.84};}
  if(from.zone===to.zone){
   // Same VLAN: switched through the rack's own switch; it never reaches the core, so the destination host enforces policy.
   const zone=zoneOf(step.from),a=anchorOf(step.from),b=anchorOf(step.to);
   if(zone.kind==='rack'){const z=zone.z+2.95,turn=new THREE.Vector3(zone.x+2.6,b.y,z),points=[a,new THREE.Vector3(zone.x-2.6,a.y,z),new THREE.Vector3(zone.x-2.6,10.95,z),new THREE.Vector3(zone.x+2.6,10.95,z),turn,b],route=new Route(rounded(points,.6));return {route,hubT:null,gateT:route.nearest(turn)};}
   const mid=a.clone().lerp(b,.5);mid.y+=4;return {route:sampled(new THREE.QuadraticBezierCurve3(a,mid,b)),hubT:null,gateT:.84};
  }
  const legA=trayLeg(step.from),legB=trayLeg(step.to).reverse(),tzA=legA[legA.length-1].z,tzB=legB[0].z;
  const points=[...legA,new THREE.Vector3(laneIn,trayHeight,tzA),new THREE.Vector3(laneIn,trayHeight,hubPoint.z),new THREE.Vector3(laneIn,hubPoint.y,hubPoint.z),hubPoint.clone(),new THREE.Vector3(laneOut,hubPoint.y,hubPoint.z),new THREE.Vector3(laneOut,trayHeight,hubPoint.z),new THREE.Vector3(laneOut,trayHeight,tzB),...legB];
  const route=new Route(rounded(points,1.1));const hubT=route.nearest(hubPoint);return {route,hubT,gateT:hubT,facing:true};
 }
 function logicalPath(step){
  const a=anchorOf(step.from),b=anchorOf(step.to),from=objects.get(step.from),to=objects.get(step.to);
  if(step.from===step.to)return {route:sampled(new THREE.CubicBezierCurve3(a.clone().add(new THREE.Vector3(-1.4,0,.4)),a.clone().add(new THREE.Vector3(-4.5,5.5,1.5)),a.clone().add(new THREE.Vector3(4.5,5.5,1.5)),a.clone().add(new THREE.Vector3(1.4,0,.4)))),hubT:null,gateT:.84};
  const ca=islands.get(from.zone).center.clone().setY(1.2);
  if(from.zone===to.zone){const mid=ca.clone().setY(3.4);return {route:sampled(new THREE.QuadraticBezierCurve3(a,mid,b)),hubT:null,gateT:.84};}
  const cb=islands.get(to.zone).center.clone().setY(1.2),hub=hubLogical.clone();
  const route=new Route([...rounded([a,ca,hub],2.6,10),...rounded([hub,cb,b],2.6,10).slice(1)]);const hubT=route.nearest(hub);return {route,hubT,gateT:hubT,facing:true};
 }
 const flowPath=step=>view==='logical'?logicalPath(step):physicalPath(step);
 function subRoute(route,t0,t1){const points=[route.getPoint(t0)];route.points.forEach((p,i)=>{const t=route.lengths[i]/route.total;if(t>t0&&t<t1)points.push(p.clone());});points.push(route.getPoint(t1));return new Route(points.filter((p,i,a)=>i===0||p.distanceToSquared(a[i-1])>1e-8));}

 // ---- Looks: standard (default) and cinematic ----
 const looks={
  standard:{bg:'#081522',fog:.004,hemi:2.5,key:3.5,rim:1.7,fill:70,exposure:1.08,led:1,packet:1,glow:1,ground:'#0c2236'},
  cinematic:{bg:'#03070d',fog:.0055,hemi:1.05,key:1.6,rim:1.3,fill:130,exposure:1.2,led:2.6,packet:2.6,glow:1.25,ground:'#06111c'}
 };
 let look=looks.standard,composer=null,bloomPass=null,composerLoading=null;
 const tinted=new Set();
 function tint(material,color){material.userData.tint=new THREE.Color(color);material.color.copy(material.userData.tint).multiplyScalar(look.packet);tinted.add(material);return material;}

 // ---- Traffic animation ----
 const ringCanvas=document.createElement('canvas');ringCanvas.width=ringCanvas.height=128;{const ctx=ringCanvas.getContext('2d');ctx.strokeStyle='#ffffff';ctx.lineWidth=9;ctx.beginPath();ctx.arc(64,64,52,0,Math.PI*2);ctx.stroke();}
 const ringTexture=new THREE.CanvasTexture(ringCanvas);
 const effects={},transient=[],walks={'media>wsus':[[3,25],[13,22],[13,-2.5],[-8,-2.5],[-8,-7.4]],'subca>media':[[1,-7.4],[1,-2.5],[13,-2.5],[13,22],[3,25]],'media>root':[[3,25],[13,22],[13,14.5],[24,14.5],[24,12.6]],'root>subca':[[24,12.6],[24,14.5],[13,14.5],[13,-2.5],[1,-2.5],[1,-7.4]]};
 let flow=null,walker=null,frozen=null;
 const disposeObject=o=>{if(o.isInstancedMesh)o.dispose();if(!o.isSprite)o.geometry?.dispose();if(o.material){tinted.delete(o.material);if(o.userData.ownMap)o.material.map?.dispose();o.material.dispose();}};
 function clearFlow(){
  flow=null;walker=null;transient.length=0;for(const k of Object.keys(effects))delete effects[k];
  for(const e of labels.filter(e=>e.kind==='badge'))removeLabel(e);
  while(flowGroup.children.length){const c=flowGroup.children[0];flowGroup.remove(c);c.traverse(disposeObject);}
  screenLines.clear();guide=null;
  pickRing.visible=false;
 }
 // Policy and transfer labels keep a constant, readable size on screen, anchored above their 3D point.
 function badge(title,sub,color,position,px=220){return screenLabel(labelTexture(title,sub,color,512),{kind:'badge',px,position,own:true});}
 function lockBadge(color,sub,position){
  const text=makeText(512,150,ctx=>{
   ctx.fillStyle='rgba(5,17,30,.92)';ctx.beginPath();ctx.roundRect(1,1,510,148,16);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();
   ctx.strokeStyle=color;ctx.lineWidth=9;ctx.beginPath();ctx.arc(76,62,22,Math.PI,0);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(44,60,64,52,8);ctx.fill();ctx.fillStyle='rgba(5,17,30,.92)';ctx.beginPath();ctx.arc(76,82,7,0,Math.PI*2);ctx.fill();ctx.fillRect(73,84,6,14);
   ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#e4f5ff';ctx.font='700 50px Segoe UI,Arial';ctx.fillText('TLS',138,56,350);ctx.font='600 32px Segoe UI,Arial';ctx.fillStyle=color;ctx.fillText(sub,138,108,360);
  });
  return screenLabel(text,{kind:'badge',px:165,position,own:true});
 }
 // Traffic lines keep a fixed width in pixels, so a path stays readable from the whole-room view to a close-up.
 const screenLineVertex=`uniform vec2 resolution;uniform float width;attribute vec3 prev;attribute vec3 next;attribute float side;attribute float dist;varying float vDist;
#include <common>
#include <fog_pars_vertex>
void main(){vDist=dist;mat4 m=projectionMatrix*modelViewMatrix;vec4 c=m*vec4(position,1.);vec4 p=m*vec4(prev,1.);vec4 n=m*vec4(next,1.);
vec2 cs=c.xy/c.w*resolution*.5,ps=p.xy/p.w*resolution*.5,ns=n.xy/n.w*resolution*.5;vec2 a=cs-ps,b=ns-cs;
a=length(a)<1e-4?b:a;b=length(b)<1e-4?a:b;a=normalize(a);b=normalize(b);vec2 t=normalize(a+b+1e-6);vec2 nrm=vec2(-t.y,t.x);
float miter=1./max(dot(nrm,vec2(-a.y,a.x)),.6);c.xy+=nrm*side*width*.5*miter/(resolution*.5)*c.w;gl_Position=c;
vec4 mvPosition=modelViewMatrix*vec4(position,1.);
#include <fog_vertex>
}`;
 const screenLineFragment=`uniform vec3 color;uniform float opacity;uniform float dash;uniform float gap;varying float vDist;
#include <common>
#include <fog_pars_fragment>
void main(){if(dash>0.&&mod(vDist,dash+gap)>dash)discard;gl_FragColor=vec4(color,opacity);
#include <colorspace_fragment>
#include <fog_fragment>
}`;
 const screenLines=new Set(),lineResolution=new THREE.Vector2(1,1);
 function screenLine(route,{color,width=3,opacity=.9,additive=false,dash=0,gap=0,through=false}){
  const pts=route.points,n=pts.length,pos=[],prev=[],next=[],side=[],dist=[],index=[];
  const before=i=>i>0?pts[i-1]:pts[0].clone().multiplyScalar(2).sub(pts[1]),after=i=>i<n-1?pts[i+1]:pts[n-1].clone().multiplyScalar(2).sub(pts[n-2]);
  for(let i=0;i<n;i++)for(const s of [-1,1]){const p=pts[i],a=before(i),b=after(i);pos.push(p.x,p.y,p.z);prev.push(a.x,a.y,a.z);next.push(b.x,b.y,b.z);side.push(s);dist.push(route.lengths[i]);}
  for(let i=0;i<n-1;i++){const k=i*2;index.push(k,k+1,k+2,k+1,k+3,k+2);}
  const geometry=new THREE.BufferGeometry();geometry.setIndex(index);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('prev',new THREE.Float32BufferAttribute(prev,3));geometry.setAttribute('next',new THREE.Float32BufferAttribute(next,3));
  geometry.setAttribute('side',new THREE.Float32BufferAttribute(side,1));geometry.setAttribute('dist',new THREE.Float32BufferAttribute(dist,1));
  const material=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{color:{value:new THREE.Color(color)},opacity:{value:opacity},resolution:{value:lineResolution},width:{value:width},dash:{value:dash},gap:{value:gap}}]),
   vertexShader:screenLineVertex,fragmentShader:screenLineFragment,transparent:true,depthWrite:false,depthTest:!through,fog:true,side:THREE.DoubleSide,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});
  material.uniforms.resolution.value=lineResolution;material.userData.baseWidth=width;
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=6;flowGroup.add(mesh);screenLines.add(material);
  return mesh;
 }
 // Pixel sizes follow the output: the same line looks the same on screen, in a recorded clip, and in a 4K export.
 const pixelScale=()=>{const {h}=viewSize();return exportSize||output?h/800:1;};
 function updateScreenLines(){const {w,h}=viewSize();lineResolution.set(w||1,h||1);const k=pixelScale();for(const m of screenLines)m.uniforms.width.value=m.userData.baseWidth*k;}
 // World units covered by one screen pixel at a point.
 const pixelAt=point=>{const {h}=viewSize();return camera.position.distanceTo(point)*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(h,1);};
 function dashedLine(route,color){return screenLine(route,{color,width:2,opacity:.6,dash:.9,gap:.7});}
 function gateAt(position,tangent,color,[title,sub],facing){
  const group=new THREE.Group();group.position.copy(position);flowGroup.add(group);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.15,12,48),basic(color));if(!facing)ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),tangent.clone().normalize());group.add(ring);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(2.6,.26,.26),basic(color));bar.quaternion.copy(ring.quaternion);bar.rotateZ(Math.PI/4);group.add(bar);
  if(!facing)group.scale.setScalar(.62);
  const shine=glow(group,0,0,0,color,6,.4),label=badge(title,sub,color,position.clone().add(new THREE.Vector3(0,facing?2.1:1.4,0)));
  return {group,ring,shine,label,flash:0,color};
 }
 function endpointBadge(position,color,text,lift){const group=new THREE.Group();group.position.copy(position);flowGroup.add(group);const shine=glow(group,0,0,0,color,6,.5);badge(...text,color,position.clone().add(new THREE.Vector3(0,lift,0)),230);return {group,shine};}
 function ripple(position,color){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:ringTexture,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.9}));sprite.position.copy(position);sprite.scale.setScalar(.8);flowGroup.add(sprite);transient.push({object:sprite,age:0,life:.7,update(k){sprite.scale.setScalar(.8+3.4*k);sprite.material.opacity=.9*(1-k);}});}
 // A dropped packet breaks apart at the enforcement point.
 function burst(position,color){
  const group=new THREE.Group();group.position.copy(position);flowGroup.add(group);
  const material=new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.95});
  const parts=Array.from({length:12},(_,i)=>{const s=new THREE.Sprite(material);s.scale.setScalar(.7);const a=i/12*Math.PI*2,e=(i%3-1)*.6;s.userData.v=new THREE.Vector3(Math.cos(a)*Math.cos(e),Math.sin(e)+.35,Math.sin(a)*Math.cos(e)).multiplyScalar(3.2+(i%4)*.7);group.add(s);return s;});
  const flash=glow(group,0,0,0,color,1,1);
  transient.push({object:group,age:0,life:.75,update(k,dt){for(const s of parts){s.position.addScaledVector(s.userData.v,dt);s.userData.v.y-=dt*4;}material.opacity=.95*(1-k);flash.scale.setScalar(1+7*Math.sin(Math.min(1,k*2.2)*Math.PI/2));flash.material.opacity=1-k;}});
 }
 const pickRing=new THREE.Sprite(new THREE.SpriteMaterial({map:ringTexture,color:'#fff4c8',transparent:true,depthWrite:false,depthTest:false,fog:false}));pickRing.renderOrder=28;pickRing.visible=false;scene.add(pickRing);
 function makePacket(f,{reply=false,offset=0}){
  const size=reply?.72:1,color=reply?f.replyColor:f.color;
  // Packets draw over the equipment so the learner never loses one behind a rack.
  const head=new THREE.Mesh(f.style==='tcp'?new THREE.ConeGeometry(.19*size,.7*size,10):new THREE.SphereGeometry(.23*size,14,10),tint(new THREE.MeshBasicMaterial({depthTest:false,transparent:true}),reply?f.replyColor:'#eaffff'));head.renderOrder=21;flowGroup.add(head);
  const shine=glow(flowGroup,0,0,0,color,reply?1.5:2.2,.75);shine.material.depthTest=false;shine.renderOrder=20;
  const tails=[];for(let j=0;j<(f.style==='tcp'?5:f.style==='either'?2:0);j++){const tail=new THREE.Mesh(new THREE.SphereGeometry((.15-j*.02)*size,8,6),basic(color,.55-j*.08));tail.material.depthTest=false;tail.renderOrder=20;flowGroup.add(tail);tails.push(tail);}
  return {head,shine,tails,offset,reply,kind:reply?'reply':'request',mode:'travel',s:0,lt:-1};
 }
 // Each packet follows a fixed timeline: travel, a rule check at the core, then onward (or a hold and a drop at a gate).
 const at={mode:'travel',s:0},set=(mode,s)=>{at.mode=mode;at.s=s;return at;};
 function forwardAt(f,lt){
  if(f.blocked){const tG=f.sGate/f.v;if(lt<tG)return set('travel',lt*f.v);if(lt<tG+f.hold)return set('hold',f.sGate);return set('gone',f.sGate);}
  if(f.dwell){const tH=f.sHub/f.v;if(lt<tH)return set('travel',lt*f.v);if(lt<tH+f.dwell)return set('dwell',f.sHub);const s=f.sHub+(lt-tH-f.dwell)*f.v;return s<=f.L?set('travel',s):set('gone',f.L);}
  const s=lt*f.v;return s<=f.L?set('travel',s):set('gone',f.L);
 }
 const up=new THREE.Vector3(0,1,0),tangent=new THREE.Vector3();
 function placePacket(f,p,mode,s){
  const visible=mode!=='gone';p.head.visible=visible;p.shine.visible=visible;
  if(!visible){for(const tail of p.tails)tail.visible=false;return;}
  const dir=p.reply?-1:1,t=s/f.L;f.path.route.getPoint(t,p.head.position);p.shine.position.copy(p.head.position);
  if(f.style==='tcp'){f.path.route.getTangent(Math.min(t,.9999),tangent);if(dir<0)tangent.negate();p.head.quaternion.setFromUnitVectors(up,tangent);}
  const fade=f.policy.kind==='unreachable'&&!p.reply&&s>f.L*.85?Math.max(0,1-(s-f.L*.85)/(f.L*.15)):1;
  // Packets never shrink below a few pixels, however far away the camera is.
  const px=pixelAt(p.head.position)*pixelScale(),grow=Math.max(1,(p.reply?3.5:5)*px/((p.reply?.72:1)*.23));
  p.head.scale.setScalar(grow*(.3+.7*fade)*(mode==='hold'?1+.25*Math.sin(time*18):1));p.shine.material.opacity=(p.reply?.5:.75)*fade*look.glow;p.shine.scale.setScalar(Math.max(p.reply?1.5:2.2,(p.reply?18:26)*px));
  for(const tail of p.tails)tail.scale.setScalar(grow);
  p.tails.forEach((tail,i)=>{const back=s-dir*(i+1)*.55;tail.visible=fade>.2&&back>=0&&back<=f.L&&mode==='travel';if(tail.visible)f.path.route.getPoint(back/f.L,tail.position);});
 }
 function updateFlow(dt){
  const f=flow;
  if(f){
   if(!frozen)f.clock+=dt;
   for(const p of f.packets){
    const lt=((f.clock+p.offset)%f.cycle+f.cycle)%f.cycle,{mode,s}=forwardAt(f,lt);
    if(mode!==p.mode&&dt>0){
     if(mode==='dwell'){ripple(f.hub,'#7fe0b7');if(effects.hub)effects.hub.flash=1;}
     if(mode==='hold'&&effects.gate)effects.gate.flash=1;
     if(mode==='gone'&&p.mode==='hold'){burst(f.gate,effects.gate?.color||'#ee9294');if(effects.gate)effects.gate.flash=1;}
    }
    p.mode=mode;p.s=s;placePacket(f,p,mode,s);
   }
   for(const p of f.replies){const lt=((f.clock+p.offset)%f.replyCycle+f.replyCycle)%f.replyCycle,s=f.L-lt*f.v,mode=s>=0?'travel':'gone';p.mode=mode;p.s=Math.max(0,s);placePacket(f,p,mode,p.s);}
   const decay=Math.exp(-dt*3.2);
   if(effects.hub){effects.hub.flash*=decay;effects.hub.shine.material.opacity=(.15+.7*effects.hub.flash)*look.glow;effects.hub.shine.scale.setScalar(4+3*effects.hub.flash);}
   if(effects.gate){const g=effects.gate;g.flash*=decay;g.ring.scale.setScalar(1+.28*g.flash);g.shine.material.opacity=.35+.55*g.flash;}
   if(effects.endpoint)effects.endpoint.shine.material.opacity=.35+.25*Math.sin(time*3);
   if(effects.ends){const {h}=viewSize(),unit=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(h,1),k=pixelScale();for(const e of effects.ends){const beat=moving?(Math.sin(time*2.4+e.phase*Math.PI)+1)/2:.5;e.sprite.scale.setScalar((30+12*beat)*k*unit);e.sprite.material.opacity=.55+.4*(1-beat);}}
  }
  if(walker){if(!frozen)walker.u=(walker.u+dt*walker.speed)%1;const position=walker.path.getPoint(walker.u);walker.carrier.position.set(position.x,Math.abs(Math.sin(walker.u*walker.length*1.6))*.12,position.z);walker.tag.position.copy(walker.carrier.position).setY(2.3);}
  for(let i=transient.length-1;i>=0;i--){const fx=transient[i];fx.age+=dt;const k=Math.min(1,fx.age/fx.life);fx.update(k,dt);if(k>=1){transient.splice(i,1);fx.object.removeFromParent();fx.object.traverse(disposeObject);}}
  if(frozen){pickRing.position.copy(frozen.packet.head.position);pickRing.scale.setScalar(1.6+.25*Math.sin(time*5));}
 }
 function custodyWalk([from,to]){
  let points;
  if(view==='logical'){const a=objects.get(from)?.logical?.position,b=objects.get(to)?.logical?.position;if(!a||!b)return;points=[a.clone().setY(.07),b.clone().setY(.07)];}
  else{const route=walks[`${from}>${to}`];if(!route)return;points=route.map(([x,z])=>new THREE.Vector3(x,.07,z));}
  const path=new Route(points),length=path.total,count=Math.floor(length/.9),amber='#e6bc82';
  const dashes=new THREE.InstancedMesh(new THREE.BoxGeometry(.55,.03,.22),new THREE.MeshBasicMaterial({color:amber,transparent:true,opacity:.85}),count);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),xAxis=new THREE.Vector3(1,0,0),scale=new THREE.Vector3(1,1,1);
  for(let i=0;i<count;i++){const u=(i+.5)/count;rotation.setFromUnitVectors(xAxis,path.getTangent(u));matrix.compose(path.getPoint(u),rotation,scale);dashes.setMatrixAt(i,matrix);}
  flowGroup.add(dashes);
  for(const u of [0,1]){const end=new THREE.Mesh(new THREE.RingGeometry(.7,.85,32),new THREE.MeshBasicMaterial({color:amber,side:THREE.DoubleSide,transparent:true,opacity:.9}));end.rotation.x=-Math.PI/2;end.position.copy(path.getPoint(u));end.position.y=.08;flowGroup.add(end);}
  // A sealed media case carried by a person: a physical transfer, never a network connection.
  const carrier=new THREE.Group(),box=new THREE.Mesh(new THREE.BoxGeometry(.9,.55,1.2),basic(amber));box.position.y=1.3;carrier.add(box);glow(carrier,0,1.3,0,amber,3,.6);flowGroup.add(carrier);
  const tag=badge('APPROVED MEDIA','Carried by hand · no network link',amber,new THREE.Vector3(),210);
  walker={path,carrier,length,u:.42,speed:3.4/length,tag};
 }
 // ---- What the scene is showing: a traffic step, a selected system, or a highlighted group ----
 const ringGeometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1));
 const selectionRing=new THREE.LineSegments(ringGeometry,new THREE.LineBasicMaterial({color:'#8eeefa',transparent:true,opacity:.8}));selectionRing.visible=false;scene.add(selectionRing);
 const hoverRing=new THREE.LineSegments(ringGeometry,new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.6,depthTest:false}));hoverRing.renderOrder=20;hoverRing.visible=false;scene.add(hoverRing);
 function placeRing(ring,id){
  const o=objects.get(id);if(!o)return false;
  if(view==='logical'&&o.logical){ring.position.copy(o.logical.position);ring.scale.set(3.2,3.4,3.2);return true;}
  ring.position.copy(o.group.position);if(id==='workstations'||id.startsWith('jump'))ring.position.y+=1.4;else if(o.facility)ring.position.y+=o.dimensions[1]/2;
  ring.scale.set(...o.dimensions).multiplyScalar(1.04);return true;
 }
 function updateOutlines(){
  const any=activeIds.length>0||!!selection,on=id=>activeIds.includes(id)||selection===id;
  for(const {zone,outline} of zoneOutlines){const active=zone.ids.some(on);outline.material.opacity=!any?.5:active?.92:.18;}
  for(const island of islands.values()){const active=island.zone.ids.some(on);island.ring.material.userData.base=!any?.55:active?.95:.28;island.disc.material.userData.base=!any?.1:active?.2:.05;}
  applyLogical(logicalAmount);
 }
 const followTarget=new THREE.Vector3();let followSnap=true;
 function showStep(step,color,allIds,policy={kind:step.manual?'manual':'traffic',rule:null},gate=null){
  lastCall={fn:'showStep',args:[step,color,allIds,policy,gate]};
  clearFlow();clearConnections();connectionState=null;releasePacket();followSnap=true;
  selection='';selectionRing.visible=false;stepMode=true;
  const ids=[...new Set([step.from,step.to,...(step.manual?step.walk||[]:[])].filter(id=>id&&objects.has(id)))];
  activeIds=ids;routedActive=false;updateOutlines();
  if(policy.kind==='manual'){if(step.walk)custodyWalk(step.walk);fit(ids,true);updateFlow(0);return;}
  if(step.from==='root'||step.to==='root')throw new Error('Offline root cannot have a live flow');
  const path=flowPath(step),route=path.route,blocked=policy.kind==='pending'||policy.kind==='deny',routed=path.hubT!==null,style=step.stream||'tcp';
  routedActive=routed;
  // Packet speed adapts so the first packet completes its trip within the step.
  const L=route.total,dwell=routed&&!blocked?.5:0,hold=.45,sGate=blocked?path.gateT*L:L,budget=Math.max(1.2,.72*stepSeconds-dwell-(blocked?hold:0));
  const v=Math.max(routed?13:6,sGate/budget)*(style==='udp'?1.2:1),travel=sGate/v+(blocked?hold:dwell);
  const f=flow={step,color,policy,path,blocked,L,routed,style,dwell,hold,sHub:routed?path.hubT*L:0,sGate,v,travel,cycle:travel+Math.max(.6,travel*.18),replyCycle:L/v+Math.max(.6,L/v*.25),clock:0,packets:[],replies:[],
   replyColor:'#'+new THREE.Color(color).lerp(new THREE.Color('#ffffff'),.45).getHexString(),hub:route.getPoint(path.hubT??.5),gate:route.getPoint(blocked?path.gateT:1)};
  const tls=step.protection==='tls'&&policy.kind==='traffic',shown=blocked?subRoute(route,0,path.gateT):route;
  screenLine(shown,{color,width:tls?16:11,opacity:tls?.26:.16,additive:true,through:true});
  screenLine(shown,{color,width:3.5,opacity:.95});
  // Rings mark where the step starts and where it is going, visible even through equipment.
  effects.ends=[[route.getPoint(0),color],[route.getPoint(1),blocked?'#9fb3c4':color]].map(([position,c],i)=>{const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:ringTexture,color:c,transparent:true,depthWrite:false,depthTest:false,sizeAttenuation:false,fog:false,opacity:.9}));sprite.position.copy(position);sprite.renderOrder=22;flowGroup.add(sprite);return {sprite,phase:i*.5};});
  if(blocked)dashedLine(subRoute(route,path.gateT,1),color);
  const count=style==='tcp'?4:3;for(let k=0;k<count;k++)f.packets.push(makePacket(f,{offset:k*f.cycle/count}));
  if((policy.kind==='traffic'||policy.kind==='rejected')&&step.reply!==false)for(const k of [0,1])f.replies.push(makePacket(f,{reply:true,offset:(k+.3)*f.replyCycle/2}));
  const at=blocked?path.gateT:path.hubT??.5,enforcement=route.getPoint(at);
  if(blocked)effects.gate=gateAt(enforcement,route.getTangent(Math.min(at,.999)),policy.kind==='pending'?'#e6bc82':'#ee9294',gate||['BLOCKED',''],path.facing);
  else if(routed&&gate){badge(gate[0],gate[1],'#7fe0b7',enforcement.clone().add(new THREE.Vector3(0,2.1,0)),200);effects.hub={shine:glow(flowGroup,enforcement.x,enforcement.y,enforcement.z,'#7fe0b7',4,.15),flash:0};}
  const logicalView=view==='logical';
  if(policy.kind==='unreachable')effects.endpoint=endpointBadge(route.getPoint(1),'#ee9294',['NO RESPONSE',`${objects.get(step.to).node.name} is offline`],logicalView?2.4:3.4);
  if(policy.kind==='rejected')effects.endpoint=endpointBadge(route.getPoint(0),'#ee9294',['CERTIFICATE REJECTED','The browser stops the connection'],logicalView?2.4:7.5);
  const sealAt=route.getPoint(routed?path.hubT*.55:.3).add(new THREE.Vector3(0,1.6,0));
  if(tls)lockBadge(color,'Encrypted session',sealAt);
  if(step.protection==='signed'&&!blocked)badge('SIGNED · NOT ENCRYPTED','Signatures protect the payload',color,sealAt,210);
  // Shot plan: an establishing shot of the whole step, then the camera eases in to follow the packet,
  // and returns to the establishing shot after the first trip.
  const shot=fit(routed?[...ids,'core']:ids,true);
  guide=shot?{wide:shot,t:0,w:0,user:false,target:null}:null;
  updateFlow(0);
 }
 function select(id,focus=true,animate=false){
  lastCall={fn:'select',args:[id,focus]};
  clearFlow();clearConnections();connectionState=null;releasePacket();
  selection=id;activeIds=[id];routedActive=false;stepMode=false;
  if(!objects.has(id))return;
  placeRing(selectionRing,id);selectionRing.material.color.set(objects.get(id).color||'#8eeefa');selectionRing.visible=true;updateOutlines();
  if(focus)fit([id]);else fit(null,animate);
 }
 function highlight(ids=[]){
  lastCall={fn:'highlight',args:[ids]};
  clearFlow();clearConnections();connectionState=null;releasePacket();stepMode=false;
  activeIds=ids.filter(id=>objects.has(id));selection='';selectionRing.visible=false;routedActive=false;updateOutlines();
  fit(activeIds.length?activeIds:null);
 }
 // ---- Connection map: every rule that names the selected system ----
 function clearConnections(){for(const e of labels.filter(e=>e.kind==='connection'))removeLabel(e);while(connectionGroup.children.length){const c=connectionGroup.children[0];connectionGroup.remove(c);c.traverse(disposeObject);}}
 function showConnections(id,pairs=[]){
  clearConnections();
  if(!id||!pairs.length){connectionState=null;if(selection)activeIds=[selection];updateOutlines();return;}
  connectionState={id,pairs};
  const seen=new Map(),scale=new THREE.Vector3(1,.7,1),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),logicalView=view==='logical';
  for(const pair of pairs){
   if(!objects.has(pair.from)||!objects.has(pair.to))continue;
   const color=policyColors[pair.status]||'#a8c7db',a=anchorOf(pair.from),b=anchorOf(pair.to),key=[pair.from,pair.to].sort().join('|'),n=seen.get(key)||0;seen.set(key,n+1);
   let curve;
   if(pair.from===pair.to){const lift=(logicalView?5:8)+n*2;curve=new THREE.CubicBezierCurve3(a.clone().add(new THREE.Vector3(-2.5,0,0)),a.clone().add(new THREE.Vector3(-6,lift,2)),a.clone().add(new THREE.Vector3(6,lift,2)),a.clone().add(new THREE.Vector3(2.5,0,0)));}
   else{const mid=a.clone().lerp(b,.5);mid.y+=(logicalView?3:6)+a.distanceTo(b)*.2+n*2.4;curve=new THREE.QuadraticBezierCurve3(a,mid,b);}
   const route=sampled(curve,64);
   if(pair.status==='permit'){
    connectionGroup.add(new THREE.Mesh(new THREE.TubeGeometry(route,96,.12,6,false),basic(color,.95)));
    connectionGroup.add(new THREE.Mesh(new THREE.TubeGeometry(route,96,.3,8,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.14,depthWrite:false,blending:THREE.AdditiveBlending})));
   }else{
    // Dashes: written but blocked (pending), or explicitly denied.
    const count=Math.max(4,Math.floor(route.total/1.25)),dashes=new THREE.InstancedMesh(new THREE.CylinderGeometry(.11,.11,1,6),basic(color,.95),count);
    for(let i=0;i<count;i++){const u=(i+.5)/count;q.setFromUnitVectors(up,route.getTangent(u));m4.compose(route.getPoint(u),q,scale);dashes.setMatrixAt(i,m4);}
    connectionGroup.add(dashes);
   }
   const arrow=new THREE.Mesh(new THREE.ConeGeometry(.32,.9,12),basic(color));arrow.position.copy(route.getPoint(.9));arrow.quaternion.setFromUnitVectors(up,route.getTangent(.9));connectionGroup.add(arrow);
   screenLabel(labelTexture(pair.rules.join(' · '),pair.status==='permit'?'Permitted':pair.status==='pending'?'Pending · blocked':'Denied',color),{kind:'connection',px:140,position:route.getPoint(.5).add(new THREE.Vector3(0,.4,0)),own:true});
  }
  const ids=[...new Set([id,...pairs.flatMap(p=>[p.from,p.to])])].filter(i=>objects.has(i));
  activeIds=ids;updateOutlines();fit(ids,true);
 }
 // ---- Packet inspection: freeze the motion on one packet ----
 function freezePacket(p){
  const f=flow;if(!f)return;
  frozen={packet:p};pickRing.visible=true;pickRing.material.color.set(p.reply?'#d9f6ff':'#fff4c8');pickRing.position.copy(p.head.position);pickRing.scale.setScalar(1.6);
  let where='path';
  if(p.mode==='dwell')where='core';else if(p.mode==='hold')where='gate';
  else if(f.routed)where=(p.reply?p.s>f.sHub:p.s<f.sHub)?'before-core':'after-core';
  projected.copy(p.head.position).project(camera);const r=renderer.domElement.getBoundingClientRect();
  hooks.onPacket?.({kind:p.kind,where,blocked:f.blocked,routed:f.routed,x:(projected.x+1)/2*r.width,y:(1-projected.y)/2*r.height,width:r.width});
 }
 function inspectPacket(kind='request'){
  if(!flow)return false;
  const list=(kind==='reply'?flow.replies:flow.packets).filter(p=>p.mode!=='gone');if(!list.length)return false;
  const target=flow.blocked?flow.sGate:flow.routed?flow.sHub:flow.L/2;
  freezePacket(list.reduce((a,b)=>Math.abs(b.s-target)<Math.abs(a.s-target)?b:a));return true;
 }
 function releasePacket(notify=true){if(!frozen)return;frozen=null;pickRing.visible=false;if(notify)hooks.onPacket?.(null);}
 // ---- Physical ↔ logical view ----
 function replay(connections){
  const call=lastCall;
  if(call.fn==='showStep')showStep(...call.args);
  else if(call.fn==='select'){select(call.args[0],call.args[1],true);if(connections?.id===call.args[0])showConnections(connections.id,connections.pairs);}
  else highlight(...call.args);
 }
 function finishMorph(){if(!morph)return;applyLogical(morph.to==='logical'?1:0);morph=null;flowGroup.visible=true;connectionGroup.visible=true;hooks.onView?.(view,false);}
 function setView(next){
  next=next==='logical'?'logical':'physical';
  if(next===view&&!morph)return;
  view=next;releasePacket();setHover(null);
  morph={from:logicalAmount,to:next,t:0,duration:moving?1.6:0};
  flowGroup.visible=false;connectionGroup.visible=false;
  replay(connectionState);
  hooks.onView?.(view,true);
  if(!morph.duration)finishMorph();
 }
 // ---- Cinematic look: darker room, brighter traffic, and bloom on large screens and in recordings ----
 function ensureComposer(){
  if(composer||composerLoading)return composerLoading||Promise.resolve();
  composerLoading=Promise.all(['EffectComposer','RenderPass','UnrealBloomPass','OutputPass'].map(name=>import(`./vendor/postprocessing/${name}.js`))).then(([{EffectComposer},{RenderPass},{UnrealBloomPass},{OutputPass}])=>{
   const size=renderer.getSize(new THREE.Vector2());
   composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
   bloomPass=new UnrealBloomPass(size.clone(),.85,.55,.92);composer.addPass(bloomPass);composer.addPass(new OutputPass());
   composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(size.x,size.y);
  }).catch(()=>{composer=null;composerLoading=null;});
  return composerLoading;
 }
 const useBloom=()=>theme==='cinematic'&&!!composer&&(!!output||!!exportSize||container.clientWidth>=900);
 function setTheme(name){
  theme=looks[name]?name:'standard';look=looks[theme];
  scene.background.set(look.bg);scene.fog.color.set(look.bg);scene.fog.density=look.fog;
  hemi.intensity=look.hemi;key.intensity=look.key;rim.intensity=look.rim;fill.intensity=look.fill;renderer.toneMappingExposure=look.exposure;
  equipment.setTheme(theme);ground.material.color.set(look.ground);
  for(const m of tinted)m.color.copy(m.userData.tint).multiplyScalar(look.packet);
  if(!moving)for(const l of lights)l.material.emissiveIntensity=.6*look.led;
  return theme==='cinematic'?ensureComposer():Promise.resolve();
 }
 // ---- Follow-the-packet camera for clips ----
 function followPoint(){
  if(walker)return walker.carrier.position.clone().setY(1.3);
  if(!flow?.packets.length)return null;
  if(flow.clock>=flow.travel)return (flow.blocked?flow.gate:flow.path.route.getPoint(1)).clone();
  return flow.packets[0].head.position.clone();
 }
 function updateFollow(dt){
  if(cameraMode!=='follow'||morph)return;
  const p=followPoint();if(!p)return;
  if(followSnap){followTarget.copy(p);followSnap=false;}else followTarget.lerp(p,1-Math.exp(-dt*4.5));
  const portrait=camera.aspect<.8,direction=(view==='logical'?new THREE.Vector3(.12,1.4,1):portrait?new THREE.Vector3(.25,.95,1):new THREE.Vector3(.55,.5,1)).normalize();
  camera.position.copy(followTarget).addScaledVector(direction,view==='logical'?34:portrait?30:23);orbit.target.copy(followTarget);transition=null;drift=null;
 }
 function updateGuided(dt){
  if(cameraMode!=='guided'||!guide||!flow||!moving||morph||frozen)return;
  if(guide.user){guide.w=0;return;}
  guide.t+=dt;
  const establish=smooth(THREE.MathUtils.clamp((guide.t-1.2)/1.6,0,1)),release=smooth(THREE.MathUtils.clamp((flow.clock-flow.travel-.9)/1.8,0,1));
  const w=establish*(1-release);guide.w=w;if(w<=0)return;
  const point=followPoint();if(!point)return;
  if(!guide.target)guide.target=point.clone();else guide.target.lerp(point,1-Math.exp(-dt*3.5));
  // While the establishing move is still running, blend from where it has the camera this frame.
  const base=transition?{position:camera.position.clone(),target:orbit.target.clone()}:guide.wide;
  const away=guide.wide.position.clone().sub(guide.wide.target),wideDistance=away.length(),portrait=camera.aspect<.8;
  const distance=Math.min(wideDistance,view==='logical'?(portrait?70:60):(portrait?66:56));
  const position=guide.target.clone().addScaledVector(away.normalize(),distance);
  drift=null;
  camera.position.lerpVectors(base.position,position,w);orbit.target.lerpVectors(base.target,guide.target,w);
 }
 // ---- Pointer: pick systems and packets; hover shows a highlight and a tooltip ----
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null,hoverPacket=false;
 const selectableLabels=new Set(['node','lnode','facility','lfacility']);
 function labelAt(e){
  const r=renderer.domElement.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null;
  for(const l of labels)if(l.id&&objects.has(l.id)&&l.sprite.visible&&l.rect&&selectableLabels.has(l.kind)&&x>=l.rect[0]&&x<=l.rect[2]&&y>=l.rect[1]&&y<=l.rect[3]&&(!best||l.priority>best.priority))best=l;
  return best?.id;
 }
 function pickSystem(e){const label=labelAt(e);if(label)return label;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(pickables[view]).find(hit=>hit.object.visible)?.object.userData.id;}
 function pickPacket(e){
  if(!flow||!flowGroup.visible)return null;
  // Fingers need a larger target than a mouse pointer.
  const r=renderer.domElement.getBoundingClientRect();let best=null,bestDistance=e.pointerType==='touch'?30:18;
  for(const p of [...flow.packets,...flow.replies]){if(!p.head.visible)continue;projected.copy(p.head.position).project(camera);const d=Math.hypot((projected.x+1)/2*r.width+r.left-e.clientX,(1-projected.y)/2*r.height+r.top-e.clientY);if(d<bestDistance){bestDistance=d;best=p;}}
  return best;
 }
 function setHover(id,packet=null,e=null){
  const changed=(id||'')!==hoverId;hoverId=id||'';
  if(changed)hoverRing.visible=!!id&&!morph&&placeRing(hoverRing,id);
  if(!hooks.onHover)return;
  if(!id&&!packet){if(changed||hoverPacket)hooks.onHover(null);hoverPacket=false;return;}
  const r=renderer.domElement.getBoundingClientRect();hoverPacket=!!packet;
  hooks.onHover({id:id||null,packet:packet?.kind||null,x:e.clientX-r.left,y:e.clientY-r.top});
 }
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY,performance.now()];});
 renderer.domElement.addEventListener('pointerup',e=>{
  const click=down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6&&performance.now()-down[2]<700;down=null;if(!click||output)return;
  const packet=pickPacket(e);if(packet){freezePacket(packet);return;}
  if(frozen)releasePacket();
  const id=pickSystem(e);if(id)onSelect(id);
 });
 renderer.domElement.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  if(e.buttons||output){setHover(null);return;}
  const packet=pickPacket(e),id=packet?null:pickSystem(e);
  renderer.domElement.style.cursor=packet||id?'pointer':'grab';setHover(id,packet,e);
 });
 renderer.domElement.addEventListener('pointerleave',()=>setHover(null));
 renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Escape'&&frozen){releasePacket();e.preventDefault();e.stopPropagation();return;}const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));if(e.key==='ArrowLeft')s.theta-=.12;else if(e.key==='ArrowRight')s.theta+=.12;else if(e.key==='ArrowUp')s.phi=Math.max(.1,s.phi-.1);else if(e.key==='ArrowDown')s.phi=Math.min(1.45,s.phi+.1);else if(e.key==='Home'){fit();e.preventDefault();return;}else return;e.preventDefault();drift=null;transition=null;camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(s));orbit.update();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.querySelector('#loading').hidden=false;container.querySelector('#loading').innerHTML='<strong>3D view paused</strong><span>Reload to restore graphics. Technical details remain available.</span>';});
 const observer=new ResizeObserver(()=>{resize();fit(framedIds,false);});observer.observe(container);
 resize();updateOutlines();fit(null,false);container.querySelector('#loading').hidden=true;
 // ---- Render loop ----
 let last=performance.now();
 function render(){if(useBloom())composer.render();else renderer.render(scene,camera);}
 function loop(now){
  const elapsed=Math.min((now-last)/1000,.25),dt=Math.min(elapsed,.06);last=now;
  if(moving){
   time+=dt;
   if(transition){transition.t+=elapsed;const p=Math.min(transition.t/2.2,1),t=smooth(p);camera.position.lerpVectors(transition.a,transition.b,t);orbit.target.lerpVectors(transition.c,transition.d,t);if(p===1)transition=null;}
   else if(drift){const s=new THREE.Spherical().setFromVector3(drift.offset);s.theta+=Math.sin((time-drift.start)*.19)*.06;s.phi+=Math.sin((time-drift.start)*.13)*.012;camera.position.copy(drift.target).add(new THREE.Vector3().setFromSpherical(s));orbit.target.copy(drift.target);}
   for(const l of lights)l.material.emissiveIntensity=(.35+1.1*Math.pow((Math.sin(time*1.6+l.phase)+1)/2,3))*look.led;
   updateFlow(Math.min(elapsed,.1));
   if(selectionRing.visible&&selection!=='root')selectionRing.material.opacity=.6+.23*Math.sin(time*1.6);
  }
  if(morph){morph.t=Math.min(1,morph.t+elapsed/morph.duration);const target=morph.to==='logical'?1:0;applyLogical(morph.from+(target-morph.from)*smooth(morph.t));if(morph.t>=1)finishMorph();}
  updateFollow(elapsed);updateGuided(elapsed);updateScreenLines();
  orbit.update(dt);
  scene.fog.density=look.fog*THREE.MathUtils.clamp(110/camera.position.distanceTo(orbit.target),.3,1);
  updateXray(moving?elapsed:0);updateLabels(moving?elapsed:0);
  render();frameHook?.(renderer.domElement);
 }
 // Render only while the stage is on screen (or while recording), to save battery and CPU.
 function updateLoop(){const run=forceActive||(onScreen&&!document.hidden);if(run===running)return;running=run;if(run)last=performance.now();renderer.setAnimationLoop(run?loop:null);}
 const visibility=new IntersectionObserver(entries=>{onScreen=entries[entries.length-1].isIntersecting;updateLoop();});visibility.observe(container);
 document.addEventListener('visibilitychange',updateLoop);updateLoop();
 function exportImage(){
  const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;let encoded;
  try{
   exportSize={w:3840,h:2160};renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=16/9;camera.clearViewOffset();camera.updateProjectionMatrix();
   if(composer){composer.setPixelRatio(1);composer.setSize(3840,2160);}
   updateLabels(0);render();
   // toBlob copies the rendered frame immediately. A Blob URL avoids browser size limits on large data URLs.
   encoded=new Promise((resolve,reject)=>renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'));
  }finally{exportSize=null;renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);if(composer){composer.setPixelRatio(ratio);composer.setSize(size.x,size.y);}camera.aspect=aspect;applyInsets();updateLabels(0);render();}
  return encoded.then(blob=>{const url=URL.createObjectURL(blob),link=document.createElement('a');link.download='inside-the-network-4k.png';link.href=url;link.hidden=true;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);});
 }
 function setInsets(next){if(output){output.insets=next;return;}if(Math.abs(next.top-insets.top)<.01&&Math.abs(next.bottom-insets.bottom)<.01)return;insets=next;applyInsets();fit(framedIds,true);}
 // Recording renders at a fixed output size; captions and cards are composited by the caller through the frame hook.
 function setOutput(size){
  if(size){if(!output)output={ratio:renderer.getPixelRatio(),insets};output.w=size.w;output.h=size.h;insets=size.insets||{top:0,bottom:0};renderer.setPixelRatio(1);renderer.setSize(size.w,size.h,false);if(composer){composer.setPixelRatio(1);composer.setSize(size.w,size.h);}camera.aspect=size.w/size.h;applyInsets();fit(framedIds,false);followSnap=true;}
  else if(output){const saved=output;output=null;insets=saved.insets;renderer.setPixelRatio(saved.ratio);resize();fit(framedIds,false);}
 }
 function setMotion(on){moving=on;orbit.enableDamping=on&&!reduced;if(!on){if(transition){camera.position.copy(transition.b);orbit.target.copy(transition.d);}transition=null;drift=null;finishMorph();for(const l of lights)l.material.emissiveIntensity=.6*look.led;}}
 function dispose(){
  observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',updateLoop);orbit.dispose();renderer.setAnimationLoop(null);composer?.dispose?.();
  const geometries=new Set(),materials=new Set(),textures=new Set();
  scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}});
  for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();renderer.dispose();renderer.domElement.remove();
 }
 return {showStep,select,highlight,exportImage,setInsets,setOutput,resize,dispose,setMotion,canvas:renderer.domElement,
  setFrameHook(fn){frameHook=fn;},setForceActive(on){forceActive=on;updateLoop();},overview:()=>highlight(),frame:ids=>fit(ids),setLabels(on){labelMode=on?'focus':'off';},setLabelMode(mode){labelMode=['focus','all','off'].includes(mode)?mode:'focus';},getLabelMode:()=>labelMode,
  setView,getView:()=>view,setTheme,getTheme:()=>theme,setCameraMode(mode){cameraMode=['follow','guided'].includes(mode)?mode:'wide';followSnap=true;if(guide){guide.user=false;guide.t=Math.max(guide.t,1.2);}if(cameraMode==='wide')fit(framedIds,false);},getCameraMode:()=>cameraMode,
  setStepSeconds(seconds){stepSeconds=seconds;},showConnections,inspectPacket,releasePacket,
  setReserved(rects){reserved=rects||[];},
  debugProject(id){const o=objects.get(id);if(!o)return null;projected.copy(anchorOf(id)).project(camera);const r=renderer.domElement.getBoundingClientRect();return {x:(projected.x+1)/2*r.width+r.left,y:(1-projected.y)/2*r.height+r.top};},
  debugLabels(){return labels.map(e=>({kind:e.kind,id:e.id,zone:e.zone,priority:e.priority,show:e.show,rect:e.rect?.map(Math.round)}));},
  // Test hook: screen positions of visible packets, used by the browser checks.
  debugPackets(){if(!flow)return [];const r=renderer.domElement.getBoundingClientRect();return [...flow.packets,...flow.replies].filter(p=>p.head.visible).map(p=>{projected.copy(p.head.position).project(camera);return {kind:p.kind,x:(projected.x+1)/2*r.width+r.left,y:(1-projected.y)/2*r.height+r.top};});}};
}
