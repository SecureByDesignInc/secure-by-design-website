import * as THREE from 'three';
import {OrbitControls} from 'three/orbit';
import {vlans,facilities} from './architecture.js';
import {createEquipment} from './equipment.js';
import {roomBounds,rooms,coldAisle,racks,hosts,appliances,tileOffset,faceZ,deskScale,officeDesks,activeDesk,peerDesk,seatedDesks,adminDesks,idfPosition,facilityPositions,offlinePosition,trayHeight,trayNodes,trayEdges,rackTray,deskRowTray,adminTray,hubPoint as hubAt,walkExits,walkPoints,placements as systemPlacements,zoneLabels} from './data-center-layout.js';

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
 const scene=new THREE.Scene();scene.background=new THREE.Color('#081522');scene.fog=new THREE.FogExp2('#081522',.004);
 const camera=new THREE.PerspectiveCamera(39,1,.1,900);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=container.clientWidth>=720;renderer.shadowMap.type=THREE.PCFShadowMap;
 // The equipment never moves, so shadows are drawn once and again only when the room's visibility changes.
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 let dirty=true;const refreshShadows=()=>{renderer.shadowMap.needsUpdate=true;dirty=true;};
 container.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','3D building with a locked server room, an administration room, an office of workstations, and a media room with an offline vault, with the network topology floating above. Drag to orbit, scroll to zoom, or select a system. Arrow keys rotate; Home shows the full network.');
 const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=!reduced;orbit.dampingFactor=.075;orbit.minDistance=10;orbit.maxDistance=500;orbit.maxPolarAngle=Math.PI*.47;orbit.minPolarAngle=.09;orbit.enablePan=true;
 // Any drag or zoom hands the camera to the viewer for the rest of the step.
 orbit.addEventListener('start',()=>{transition=null;drift=null;if(guide)guide.user=true;onInteract();});
 orbit.addEventListener('change',()=>{dirty=true;});
 const hemi=new THREE.HemisphereLight('#c8e8ff','#26323c',3.1);scene.add(hemi);
 const key=new THREE.DirectionalLight('#ecfbff',3.5);key.position.set(-10,52,38);key.target.position.set(8,0,9);scene.add(key.target);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-58,right:58,top:58,bottom:-58,near:1,far:150});key.shadow.normalBias=.15;scene.add(key);
 const rim=new THREE.DirectionalLight('#9dc1df',1.7);rim.position.set(25,22,-25);scene.add(rim);
 const fill=new THREE.PointLight('#51d7ef',70,65,1.4);fill.position.set(-7,13,-10);scene.add(fill);
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
 const labels=[];let reserved=[],labelsSettling=true;
 const makeText=(width,height,draw,grow=1)=>({width,height,aspect:height/width,draw,texture:null,texW:0,grow});
 const measure=document.createElement('canvas').getContext('2d');
 function labelTexture(title,sub,color,width=400,{framed=false}={}){
  // Widen the label to fit its text instead of squeezing the letters. screenLabel scales the on-screen
  // size by the same factor, so every label keeps one type size.
  const base=width,titleFont='600 35px Inter,Segoe UI,Arial',subFont='500 26px Inter,Segoe UI,Arial',bar=framed?0:9;
  measure.font=titleFont;let need=measure.measureText(title).width;
  if(sub){measure.font=subFont;need=Math.max(need,measure.measureText(sub).width);}
  width=Math.max(width,Math.ceil(need+44+bar));
  const height=sub?104:62;
  return makeText(width,height,ctx=>{
   // Quiet cards: a dark glass panel with a thin colour bar. Policy and transfer badges keep a full outline.
   ctx.fillStyle='rgba(6,16,27,.84)';ctx.beginPath();ctx.roundRect(2,2,width-4,height-4,10);ctx.fill();
   if(framed){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();}
   else{ctx.strokeStyle='rgba(160,200,225,.16)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(2,2,bar,height-4,[10,0,0,10]);ctx.fill();}
   ctx.textAlign='center';ctx.textBaseline='middle';const cx=(width+bar)/2;
   ctx.fillStyle='#eef6fc';ctx.font=titleFont;ctx.fillText(title,cx,sub?36:32,width-34-bar);
   if(sub){ctx.font=subFont;ctx.fillStyle=framed?color:'#a9c3d4';ctx.fillText(sub,cx,76,width-34-bar);}
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
  const onLayer=!physicalKinds.has(e.kind);
  if(onLayer&&layerAmount*layerNear<.5)return -1;
  // During a traffic step, only the step's own systems, their segments, and the core keep labels
  // (others appear on hover), so the two or three things that matter stand out. "All labels" turns this off.
  // Phones also quiet the room around a selected system, since rack names would cover most of a small stage.
  const narrow=!output&&!exportSize&&viewSize().w<600,quiet=labelMode==='focus'&&(stepMode||narrow&&(!!selection||activeIds.length>0)),hoverZone=hoverId&&(view==='logical'?objects.get(hoverId)?.vlan:objects.get(hoverId)?.zone);
  const zoneActive=e.zone&&activeZones.has(e.zone);
  if(e.kind==='island')return zoneActive||hoverVlan===e.zone?86:quiet||activeIds.length||selection?-1:54;
  if(e.kind==='zone')return zoneActive?82:quiet&&e.zone!==hoverZone?-1:layerAmount*layerNear>.5&&!selection&&!activeIds.length?30:50;
  if(e.kind==='lnode')return hoverId===e.id?92:-1;
  if(e.kind==='lfacility'){if(e.id==='topology')return quiet?-1:40;if(e.id==='offline')return activeZones.has('offline')||activeZones.has('vault')?80:quiet?-1:36;return isActive(e.id)||e.id==='core'&&routedActive?70:-1;}
  if(e.kind==='facility'||e.kind==='lfacility'){
   if(isActive(e.id)||quiet&&e.id==='core'&&routedActive)return 84;
   if(layerAmount*layerNear>.5&&!selection&&!activeIds.length&&hoverId!==e.id)return 28;
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
  activeZones.clear();for(const id of [...activeIds,selection]){const o=objects.get(id);if(o){activeZones.add(o.zone);activeZones.add(o.vlan);}}
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
  const rate=moving&&dt>0?Math.min(1,dt*9):1;labelsSettling=false;
  for(const e of labels){
   e.alpha+=((e.show?1:0)-e.alpha)*rate;if(!e.show&&e.alpha<.02)e.alpha=0;if(e.show&&e.alpha>.98)e.alpha=1;if(e.alpha>0&&e.alpha<1)labelsSettling=true;
   e.sprite.visible=e.alpha>.02;e.leader.visible=e.sprite.visible&&e.lift>0;
   if(!e.sprite.visible)continue;
   const map=textureFor(e.text,e.target||e.px);if(e.sprite.material.map!==map){e.sprite.material.map=map;e.sprite.material.needsUpdate=true;}
   // Inactive labels dim rather than turn see-through, so their text stays readable.
   const dim=e.kind==='badge'||e.kind==='connection'||!activeIds.length&&!selection||e.priority>=80?1:.74;
   e.sprite.position.copy(e.position);e.sprite.scale.set(e.scale,e.scale*e.text.aspect,1);e.sprite.center.set(.5-e.shift/e.sw,-e.lift/e.sh);e.sprite.material.opacity=e.alpha;e.sprite.material.color.setScalar(dim);
   if(e.leader.visible){e.leader.position.copy(e.position);e.leader.scale.set(1.5*e.unit,Math.hypot(e.lift,e.shift)*e.unit,1);e.leader.material.rotation=-Math.atan2(e.shift,e.lift);e.leader.material.opacity=e.alpha*.7*dim;}
  }
 }
 // ---- Physical building: server room, administration, office, media room and vault off one corridor ----
 const equipment=createEquipment(lights);
 equipment.building(physical,{rooms,coldAisle});
 const hitMaterial=new THREE.MeshBasicMaterial({visible:false}),zoneOutlines=[],where=systemPlacements(),H=trayHeight;
 const vlanOf=id=>vlans.find(v=>v.ids.includes(id));
 const shortName=name=>name.replace(/^SBD-/,'').replace(/^ADMIN-/,'ADM-');
 // Room names are painted on the floor, at world scale.
 for(const r of rooms)if(r.name){const text=floorText(r.name,'#93a9ba',Math.min(13,r.name.length*1.05));text.material.opacity=.75;text.position.set(r.sign[0],.03,r.sign[1]);physical.add(text);}
 const aisleText=floorText('COLD AISLE','#8fc6db',8);aisleText.material.opacity=.6;aisleText.position.set(-7,.03,-10);physical.add(aisleText);
 function addObject(id,{group,dimensions,anchor,center=new THREE.Vector3(),fadeKey,zone,color,fitBox,labelOffset,title,sub,px=160}){
  const node=nodes.find(n=>n.id===id),vlan=vlanOf(id)?.id||node?.zone;
  const hit=new THREE.Mesh(new THREE.BoxGeometry(...dimensions),hitMaterial);hit.position.copy(center);hit.userData.id=id;group.add(hit);pickables.physical.push(hit);
  const text=labelTexture(title||node.name,sub??node.address,color);
  const o={node,group,dimensions,anchor,center,fadeKey,zone,vlan,color,text,fitBox,label:screenLabel(text,{kind:'node',id,zone,px,position:group.position.clone().add(labelOffset)})};
  objects.set(id,o);return o;
 }
 // Racks: row A faces the cold aisle; row B is turned around so both rows take supply air from the same aisle.
 const rackGroups=new Map();
 for(const r of racks){
  const g=new THREE.Group();g.position.set(r.x,0,r.z);if(r.row==='B')g.rotation.y=Math.PI;g.userData.fadeKey='rack-'+r.id;physical.add(g);rackGroups.set(r.id,g);
  if(r.kind==='compute'){equipment.rack(g,{code:r.code,name:r.name,color:'#8fb8cc',switching:false});equipment.patchPanel(g,10.95);equipment.blanking(g,[3.6,9.6,1.95].filter(y=>!hosts.some(h=>h.rack===r.id&&Math.abs(h.y-y)<1)));}
  else if(r.kind==='reserved'){equipment.rack(g,{code:r.code,name:r.name,color:'#6c7f8c',switching:false});equipment.blanking(g,[2.1,3.1,4.1,5.1,6.1,7.1,8.1,9.1,10.1,11.1]);}
  else if(r.kind!=='network')equipment.cabinet(g,r.kind);
  equipment.contact(r.x,r.z,8.4,7.6);
  if(r.kind==='compute'||r.kind==='network')for(let i=0;i<3;i++)equipment.cable(physical,[[r.x-1.2+i*.6,12.3,r.z+1.2],[r.x-1.2+i*.6,12.9,r.z+1.4],[r.x-1.2+i*.6,H-.1,-15.5]],'#3f5c70',.05);
 }
 // Hypervisor hosts, each carrying its virtual machines as labelled tiles on the faceplate.
 for(const host of hosts){
  const r=racks.find(k=>k.id===host.rack),g=new THREE.Group();g.position.set(r.x,host.y,r.z);g.userData.fadeKey='rack-'+r.id;physical.add(g);
  const tiles=host.vms.map((id,i)=>{const n=nodes.find(x=>x.id===id),v=vlanOf(id);return {id,name:shortName(n.name),color:v.color,vlan:v.number,x:tileOffset(host,i)};});
  equipment.hypervisor(g,{name:host.name,tiles});
  for(const t of tiles){
   const tile=new THREE.Group();tile.position.set(r.x+t.x,host.y-.15,r.z+faceZ);tile.userData.fadeKey='rack-'+r.id;physical.add(tile);
   addObject(t.id,{group:tile,dimensions:[1.3,1.05,.6],anchor:new THREE.Vector3(0,0,.35),fadeKey:'rack-'+r.id,zone:r.id,color:t.color,
    fitBox:new THREE.Box3(new THREE.Vector3(r.x-9,0,r.z-4),new THREE.Vector3(r.x+9,13,r.z+13)),labelOffset:new THREE.Vector3(0,.55,.7)});
  }
 }
 // Network core rack: two core switches, patch panels, and the reference clock appliance.
 const timeNode=nodes.find(n=>n.id==='time'),timeRack=racks.find(r=>r.id==='r01');
 {const g=new THREE.Group();g.position.set(timeRack.x,appliances[0].y,timeRack.z);g.userData.fadeKey='facility-core';physical.add(g);equipment.server(g,timeNode,vlanOf('time').color);
  addObject('time',{group:g,dimensions:[5.8,1,5],anchor:new THREE.Vector3(0,.2,2.75),fadeKey:'facility-core',zone:'r01',color:vlanOf('time').color,
   fitBox:new THREE.Box3(new THREE.Vector3(timeRack.x-9,0,timeRack.z-4),new THREE.Vector3(timeRack.x+9,13,timeRack.z+13)),labelOffset:new THREE.Vector3(0,.5,3.1)});}
 // Administration: three dedicated seats, the Tier 0 seat behind its own glass screen.
 const adminSeats=new Map();
 for(const [id,[x,z]] of Object.entries(adminDesks)){
  const g=new THREE.Group();g.position.set(x,0,z);g.userData.fadeKey='desk-'+id;physical.add(g);
  const desk=equipment.workstation(g,0,0,deskScale,'#3f6a86');adminSeats.set(id,equipment.seated(desk,id.length));equipment.contact(x,z+1.2,7.4,6.4);
  addObject(id,{group:g,dimensions:[6.8,6,7.4],center:new THREE.Vector3(0,3,1.4),anchor:new THREE.Vector3(0,4.55,-.7),fadeKey:'desk-'+id,zone:'admin',color:vlanOf(id).color,
   fitBox:new THREE.Box3(new THREE.Vector3(x-6,0,z-3),new THREE.Vector3(x+6,7,z+8)),labelOffset:new THREE.Vector3(0,6.4,.4)});
 }
 {const screen=new THREE.Group();screen.userData.fadeKey='desk-jump';physical.add(screen);equipment.box(screen,.1,5.4,9,31,2.7,-16.5,new THREE.MeshStandardMaterial({color:'#7fb2c4',transparent:true,opacity:.16,depthWrite:false}));equipment.plate(screen,'TIER 0',2.4,31.08,5,-16.5,{height:.4,color:'#f7c477'}).rotation.y=Math.PI/2;}
 // Office: twelve representative desks for fifty users, an access-switch closet (IDF), and people at work.
 const officeCenter=new THREE.Vector3(-7,0,30.8),officeColor=vlanOf('workstations').color,officeDesks3D=[];
 {const g=new THREE.Group();g.position.copy(officeCenter);g.userData.fadeKey='office';physical.add(g);
  officeDesks.forEach(([x,z],i)=>{const desk=equipment.workstation(g,x-officeCenter.x,z-officeCenter.z,deskScale,i===activeDesk?officeColor:'#3f6a86');
   const person=seatedDesks.includes(i)?equipment.seated(desk,i):null;let screen=null;desk.traverse(o=>{if(o.isMesh&&o.material.emissive&&o.material.emissiveIntensity===.25)screen=o;});
   officeDesks3D.push({desk,person,screen,x,z});equipment.contact(x,z+1.2,7.4,6.4);});
  const [ax,az]=officeDesks[activeDesk];
  addObject('workstations',{group:g,dimensions:[37,6,25],center:new THREE.Vector3(0,3,0),anchor:new THREE.Vector3(ax-officeCenter.x,4.55,az-officeCenter.z-.7),fadeKey:'office',zone:'office',color:officeColor,
   fitBox:new THREE.Box3(new THREE.Vector3(-27,0,16),new THREE.Vector3(13,7,44)),labelOffset:new THREE.Vector3(ax-officeCenter.x,6.8,az-officeCenter.z),title:'50 WINDOWS 11 PCs'});
 }
 {const g=new THREE.Group();g.position.set(idfPosition[0],0,idfPosition[1]);g.userData.fadeKey='idf';physical.add(g);equipment.idf(g);equipment.contact(idfPosition[0],idfPosition[1],5.6,5);
  equipment.cable(physical,[[idfPosition[0],9.05,idfPosition[1]],[idfPosition[0],11,idfPosition[1]],[idfPosition[0],H-.1,idfPosition[1]]],'#3f5c70',.07);}
 // Overhead trays: the routes traffic follows. Office rows feed the access-switch closet.
 for(const [a,b] of trayEdges)equipment.trayRun(physical,trayNodes[a],trayNodes[b],H);
 for(const z of Object.keys(deskRowTray).map(Number))equipment.trayRun(physical,[-24,z],[trayNodes.o1[0],z],H);
 // Offline vault: the root CA in a locked cabinet, never cabled.
 const rootNode=nodes.find(n=>n.id==='root'),rootBase=new THREE.Group();rootBase.position.set(offlinePosition[0],0,offlinePosition[1]);rootBase.userData.fadeKey='offline-root';physical.add(rootBase);
 equipment.mediaCabinet(rootBase,{label:'OFFLINE ROOT CA',color:colors.offline});equipment.contact(offlinePosition[0],offlinePosition[1],6.6,4.4);
 const rootDevice=new THREE.Group();rootDevice.position.set(offlinePosition[0],7.25,offlinePosition[1]);rootDevice.userData.fadeKey='offline-root';physical.add(rootDevice);equipment.server(rootDevice,rootNode,colors.offline,{offline:true});
 addObject('root',{group:rootDevice,dimensions:[6,2,5],anchor:new THREE.Vector3(0,0,2.7),fadeKey:'offline-root',zone:'vault',color:colors.offline,
  fitBox:new THREE.Box3(new THREE.Vector3(offlinePosition[0]-6,0,offlinePosition[1]-4),new THREE.Vector3(offlinePosition[0]+6,10,offlinePosition[1]+6)),labelOffset:new THREE.Vector3(0,.4,3.2),sub:'OFFLINE · NO LIVE LINK'});
 screenLabel(labelTexture('OFFLINE ROOT','Local access · no network cable',colors.offline),{kind:'facility',id:'root',px:175,position:new THREE.Vector3(offlinePosition[0],10.9,offlinePosition[1])});
 function facility(id,height,sub,dimensions,fitPad){
  const f=facilities.find(f=>f.id===id),position=facilityPositions[id],g=new THREE.Group();g.position.set(position[0],0,position[1]);g.userData.fadeKey='facility-'+id;physical.add(g);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(...dimensions),hitMaterial);hit.position.y=height/2;hit.userData.id=id;g.add(hit);pickables.physical.push(hit);
  // Short room labels; the inspector keeps the full names.
  const text=labelTexture(({media:'MEDIA HANDLING',backup:'OFFLINE BACKUP',core:'CORE SWITCH STACK'})[id]||f.name.toUpperCase(),sub,f.color);
  const [px,pz]=position;
  objects.set(id,{node:{id,zone:id,name:f.name},group:g,dimensions,anchor:new THREE.Vector3(0,id==='core'?9.3:height/2,id==='core'?3.9:2.8),center:new THREE.Vector3(0,dimensions[1]/2,0),fadeKey:'facility-'+id,zone:id,vlan:id,color:f.color,facility:true,text,
   fitBox:new THREE.Box3(new THREE.Vector3(px-fitPad[0],0,pz-fitPad[1]),new THREE.Vector3(px+fitPad[0],height+2,pz+fitPad[2])),
   label:screenLabel(text,{kind:'facility',id,zone:id,px:175,position:new THREE.Vector3(px,height+1.4,pz)})});
  return g;
 }
 const core=facility('core',12.6,'R01 · routing · default deny',[7,12.6,6.4],[6,4,9]);equipment.rack(core,{code:'R01',name:'NETWORK CORE',color:'#8cc9d8',switching:false});equipment.patchPanel(core,10.95);equipment.patchPanel(core,10.45);
 equipment.networkSwitch(core,9.3,{label:'CORE SWITCH 01'});equipment.networkSwitch(core,7.1,{label:'CORE SWITCH 02'});equipment.blanking(core,[2.2,3.2,6]);
 for(let i=0;i<6;i++)equipment.cable(core,[[-2.1+i*.5,9.25,2.3],[-2.1+i*.5,8.4,3.1],[-2.1+i*.5,7.15,2.3]],i%2?'#557b99':'#669397',.04);
 const media=facility('media',4.6,'Approved media · carried by hand',[15,5,8],[10,4,8]);
 for(const [s,label] of [[-1,'IMPORT'],[1,'EXPORT']]){equipment.workstation(media,s*3.6,0,deskScale,'#a49271');equipment.plate(media,label,2.6,s*3.6,6.2,-.8,{color:'#e5c58e',height:.5});equipment.contact(facilityPositions.media[0]+s*3.6,facilityPositions.media[1]+1.2,7.4,6.4);}
 const backup=facility('backup',7,'Protected offline copies',[7,7,6],[6,4,6]);equipment.mediaCabinet(backup,{label:'PROTECTED OFFLINE BACKUPS'});equipment.contact(facilityPositions.backup[0],facilityPositions.backup[1],6.6,4.4);
 // Rack and room names: compact labels that step up on a leader line when crowded.
 for(const z of zoneLabels)screenLabel(labelTexture(z.title,z.sub,'#9fd3e6',320),{kind:'zone',zone:z.id,px:126,color:'#9fd3e6',position:new THREE.Vector3(...z.position)});
 // Floor outlines mark each rack and room area; the ones in use brighten.
 const zoneFootprints={admin:[34.5,-15.5,20,9],office:[-7,30.8,39,26]};for(const r of racks)if(r.label)zoneFootprints[r.id]=[r.x,r.z,7.6,7];
 for(const [id,[x,z,w,d]] of Object.entries(zoneFootprints)){
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,.015,d)),new THREE.LineBasicMaterial({color:'#8fd3e6',transparent:true,opacity:.2}));
  outline.position.set(x,.03,z);physical.add(outline);zoneOutlines.push({zone:{id,ids:[...objects].filter(([,o])=>o.zone===id).map(([k])=>k)},outline});
 }
 equipment.contact(18,-24,2.6,2.6);
 const shadowPads=equipment.contactShadows(physical);
 const registry=equipment.batch(physical);
 // Fades: x-ray per equipment group, combined with the physical/logical morph.
 const batchedMeshes=new Set(registry.meshes.map(m=>m.mesh)),roomDecor=[],floorMeshes=[];
 const keyed=o=>{for(let p=o;p&&p!==physical;p=p.parent)if(p.userData?.fadeKey)return true;return false;};
 physical.traverse(o=>{if(o===physical||batchedMeshes.has(o)||!(o.isMesh||o.isLine||o.isSprite)||keyed(o))return;if(o.userData.floor)floorMeshes.push(o);else roomDecor.push(o);});
 const fadeKeys=[...new Set([...registry.bounds.keys(),...registry.groups.keys()])],xray=new Map(fadeKeys.map(k=>[k,{value:1,target:1,applied:1}]));
 let physicalAmount=1,fading=false;
 const dimState=new Map(fadeKeys.map(k=>[k,{value:1,target:1,applied:1}]));
 function applyFades(force=false){
  let changed=false;
  for(const [k,state] of xray){const value=k==='room'?physicalAmount:state.value*physicalAmount;if(force||Math.abs(value-state.applied)>.004){equipment.setFade(registry,k,value);state.applied=value;changed=true;}}
  if(changed)refreshShadows();
  for(const floorMesh of floorMeshes){const m=floorMesh.material,base=m.userData.baseOpacity??(m.userData.baseOpacity=m.opacity),keep=m.userData.keepTransparent??(m.userData.keepTransparent=m.transparent),transparent=keep||physicalAmount<.999;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=base*physicalAmount;if(!keep)m.depthWrite=physicalAmount>.5;floorMesh.visible=physicalAmount>.01;}
  for(const o of roomDecor)o.visible=physicalAmount>.5;
  physical.visible=physicalAmount>.001;
 }
 // Fade whatever stands between the camera and the active equipment (racks, cabinets, walls).
 const sight=new THREE.Ray(),hitPoint=new THREE.Vector3();
 let sightKey='',protectedKeys=new Set(),sightPoints=[],aside=new Set();
 function refreshSight(){
  const shown=[...new Set(activeIds.concat(selection?[selection]:[]))].filter(id=>objects.has(id)),key=`${view}|${!!morph}|${routedActive}|${shown.join()}`;
  if(key===sightKey)return;sightKey=key;
  protectedKeys=new Set(shown.map(id=>objects.get(id).fadeKey));if(routedActive)protectedKeys.add('facility-core');
  aside=new Set(view==='physical'&&(routedActive||shown.some(id=>where.get(id)?.room==='server'||id==='core'))?[...racks.filter(r=>r.row==='B').map(r=>'rack-'+r.id),'containment']:[]);
  sightPoints=view==='physical'&&!morph?shown.flatMap(id=>{const a=anchorOf(id);return [a,a.clone().add(new THREE.Vector3(0,-3.5,1)),a.clone().add(new THREE.Vector3(-2.5,-1.5,1)),a.clone().add(new THREE.Vector3(2.5,-1.5,1))];}):[];if(routedActive&&sightPoints.length)sightPoints.push(hubPoint);
 }
 function updateXray(dt){
  refreshSight();const points=sightPoints;
  for(const [k,state] of xray){
   state.target=1;
   if(k==='room'||protectedKeys.has(k)||!registry.bounds.has(k))continue;
   if(aside.has(k)){state.target=.18;continue;}
   for(const p of points){sight.origin.copy(camera.position);sight.direction.subVectors(p,camera.position);const distance=sight.direction.length();sight.direction.normalize();
    if(sight.intersectBox(registry.bounds.get(k),hitPoint)&&hitPoint.distanceTo(camera.position)<distance-1.5){state.target=.22;break;}}
  }
  const rate=moving&&dt>0?Math.min(1,dt*5):1;
  for(const state of xray.values())state.value+=(state.target-state.value)*rate;
  applyFades();
  // Equipment outside the current step steps back (darker, still solid) so the step's systems stand out.
  const quiet=stepMode&&view==='physical'&&!morph;
  fading=[...xray.values(),...dimState.values()].some(state=>Math.abs(state.target-state.value)>.004);
  for(const [k,state] of dimState){
   state.target=quiet&&k!=='room'&&!protectedKeys.has(k)?.42:1;
   state.value+=(state.target-state.value)*rate;
   if(Math.abs(state.value-state.applied)>.004){equipment.setDim(registry,k,state.value);state.applied=state.value;}
  }
 }

 // ---- Network topology: a glass layer floating over the building ----
 // Each VLAN is a platform around the core switch stack, with its systems on it; spokes are the only way out of a segment.
 // Dashed tethers drop from a system's glyph to where it physically sits. The offline area floats apart with no uplink.
 // The layer leans toward the viewer like a glass panel, so its segments read from the room's usual camera angle.
 const LS=.92,LO=new THREE.Vector3(8,38,0);logical.position.copy(LO);logical.scale.setScalar(LS);logical.rotation.x=.6;logical.updateMatrixWorld(true);
 const toWorld=v=>logical.localToWorld(v.clone());
 const islandOrder=['v10','v20','v30','v40','v60','v80','v70','v50'],islandAngles=[202.5,247.5,292.5,337.5,22.5,67.5,112.5,157.5];
 const islands=new Map(),hubLogical=new THREE.Vector3(0,1.9,0),logicalFade=[];
 const fadeMaterial=(material,base)=>{material.userData.base=base??material.opacity;material.userData.depthWrite=material.depthWrite;material.transparent=true;logicalFade.push(material);return material;};
 const plateShape=new THREE.Shape();{const w=39,d=34,r=4,cz=3.8;plateShape.moveTo(-w+r,cz-d);plateShape.lineTo(w-r,cz-d);plateShape.quadraticCurveTo(w,cz-d,w,cz-d+r);plateShape.lineTo(w,cz+d-r);plateShape.quadraticCurveTo(w,cz+d,w-r,cz+d);plateShape.lineTo(-w+r,cz+d);plateShape.quadraticCurveTo(-w,cz+d,-w,cz+d-r);plateShape.lineTo(-w,cz-d+r);plateShape.quadraticCurveTo(-w,cz-d,-w+r,cz-d);}
 const gridCanvas=document.createElement('canvas');gridCanvas.width=gridCanvas.height=128;{const ctx=gridCanvas.getContext('2d');ctx.fillStyle='#0b2234';ctx.fillRect(0,0,128,128);ctx.fillStyle='#16384f';ctx.fillRect(0,0,128,2);ctx.fillRect(0,0,2,128);}
 const gridTexture=new THREE.CanvasTexture(gridCanvas);gridTexture.wrapS=gridTexture.wrapT=THREE.RepeatWrapping;gridTexture.repeat.set(1/6,1/6);gridTexture.colorSpace=THREE.SRGBColorSpace;
 const ground=new THREE.Mesh(new THREE.ShapeGeometry(plateShape).rotateX(Math.PI/2),fadeMaterial(new THREE.MeshBasicMaterial({map:gridTexture,color:'#ffffff',transparent:true,opacity:.62,depthWrite:false,side:THREE.DoubleSide}),.62));ground.position.y=-.05;ground.renderOrder=2;logical.add(ground);
 const plateEdge=new THREE.Line(new THREE.BufferGeometry().setFromPoints(plateShape.getPoints(12).map(p=>new THREE.Vector3(p.x,0,-p.y))),fadeMaterial(new THREE.LineBasicMaterial({color:'#6fd4ea',transparent:true,opacity:.55}),.55));logical.add(plateEdge);
 const coreHex=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,1.5,6),fadeMaterial(new THREE.MeshStandardMaterial({color:'#18485a',emissive:'#1d6578',emissiveIntensity:.6,metalness:.4,roughness:.45}),1));coreHex.position.set(0,.75,0);logical.add(coreHex);
 const coreHit=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,2,6),hitMaterial);coreHit.position.copy(coreHex.position);coreHit.userData.id='core';logical.add(coreHit);pickables.logical.push(coreHit);
 const coreRim=new THREE.Mesh(new THREE.TorusGeometry(3.45,.09,8,6),fadeMaterial(basic(colors.core,.9),.9));coreRim.rotation.x=Math.PI/2;coreRim.rotation.z=Math.PI/6;coreRim.position.y=1.52;logical.add(coreRim);
 islandOrder.forEach((zid,i)=>{
  const zone=vlans.find(v=>v.id===zid),a=THREE.MathUtils.degToRad(islandAngles[i]),center=new THREE.Vector3(31*Math.cos(a),0,21*Math.sin(a)),n=zone.ids.length,radius=n===1?3.6:3.2+n;
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.3,64),fadeMaterial(new THREE.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.14,depthWrite:false}),.14));disc.position.copy(center).setY(.12);logical.add(disc);
  const ring=new THREE.Mesh(new THREE.RingGeometry(radius-.14,radius,72),fadeMaterial(new THREE.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}),.7));ring.rotation.x=-Math.PI/2;ring.position.copy(center).setY(.3);logical.add(ring);
  const islandHit=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1.6,24),hitMaterial);islandHit.position.copy(center).setY(.6);islandHit.userData.id='vlan:'+zid;logical.add(islandHit);pickables.logical.push(islandHit);
  // The VLAN's uplink to the core: the only way traffic leaves the segment.
  const from=center.clone().add(center.clone().negate().setLength(radius)).setY(.3),to=center.clone().setLength(3.5).setY(.3);
  const spoke=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(from,to),8,.11,6,false),fadeMaterial(new THREE.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.5,depthWrite:false}),.5));logical.add(spoke);
  islands.set(zid,{zone,center,radius,ring,disc,spoke});
  screenLabel(labelTexture(`VLAN ${zone.number} · ${zone.name}`,zone.subnet,zone.color,420),{kind:'island',zone:zid,px:150,color:zone.color,position:toWorld(center.clone().add(new THREE.Vector3(0,.4,radius+.6)))});
  zone.ids.forEach((id,j)=>{const angle=-Math.PI/2+j*Math.PI*2/n+(n===2?Math.PI/2:0),r=n===1?0:n===2?2.3:2.9;objects.get(id).logical={position:center.clone().add(new THREE.Vector3(Math.cos(angle)*r,1.5,Math.sin(angle)*r))};});
 });
 // Offline area: no spoke, no uplink. People carry approved media in and out.
 const offlinePlaces={root:new THREE.Vector3(-7,1.5,31.5),media:new THREE.Vector3(0,1.5,31.5),backup:new THREE.Vector3(7,1.5,31.5)};
 for(const [id,position] of Object.entries(offlinePlaces))objects.get(id).logical={position};
 objects.get('core').logical={position:hubLogical.clone()};
 let offlineBoundary;
 {
  const pts=[[-11,27.5],[11,27.5],[11,35.5],[-11,35.5],[-11,27.5]].map(([x,z])=>new THREE.Vector3(x,.06,z));offlineBoundary=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),fadeMaterial(new THREE.LineDashedMaterial({color:colors.offline,dashSize:.8,gapSize:.6,transparent:true,opacity:.85}),.85));
  offlineBoundary.computeLineDistances();logical.add(offlineBoundary);
  screenLabel(labelTexture('OFFLINE AREA','No network link · media by hand',colors.offline),{kind:'lfacility',id:'offline',px:160,color:colors.offline,position:toWorld(new THREE.Vector3(0,.4,36.4))});
  screenLabel(labelTexture('CORE SWITCH STACK','Every VLAN uplinks here',colors.core),{kind:'lfacility',id:'core',zone:'core',px:150,color:colors.core,position:toWorld(new THREE.Vector3(0,2.4,0))});
  screenLabel(labelTexture('NETWORK TOPOLOGY','8 VLANs · default deny between them','#7fd8ec'),{kind:'lfacility',id:'topology',px:160,color:'#7fd8ec',position:toWorld(new THREE.Vector3(-30,.4,-30.2))});
 }
 // One glyph per system, carrying the same role icon as its faceplate, and a tether down to its place in the building.
 const tetherGroup=new THREE.Group();scene.add(tetherGroup);
 for(const [id,o] of objects){
  if(!o.logical||id==='core')continue;
  const color=o.color,sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:equipment.iconTexture(equipment.roleOf(id)||'gear',color),transparent:true,opacity:0,depthWrite:false}));
  sprite.scale.setScalar(id==='workstations'?3.1:2.5);sprite.renderOrder=12;sprite.position.copy(o.logical.position);logical.add(sprite);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.4,.22,24),fadeMaterial(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5}),.5));pad.position.copy(o.logical.position).setY(.32);logical.add(pad);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(3,3.2,3),hitMaterial);hit.position.copy(o.logical.position);hit.userData.id=id;logical.add(hit);pickables.logical.push(hit);
  o.logical.glyph=sprite;o.logical.world=toWorld(o.logical.position);
  const top=o.logical.world.clone().add(new THREE.Vector3(0,-1.2,0)),bottom=o.group.position.clone().add(o.anchor);
  const tether=new THREE.Line(new THREE.BufferGeometry().setFromPoints([top,bottom]),new THREE.LineDashedMaterial({color,dashSize:.7,gapSize:.5,transparent:true,opacity:0,depthWrite:false,depthTest:false}));
  tether.computeLineDistances();tether.renderOrder=18;tether.visible=false;tetherGroup.add(tether);o.logical.tether=tether;
  o.logical.label=screenLabel(o.text,{kind:o.facility?'lfacility':'lnode',id,zone:o.vlan,px:150,position:o.logical.world.clone().add(new THREE.Vector3(0,1.6,0))});
 }
 // The layer fades in and out as one piece; it never hides the room.
 let layerOn=true,layerAmount=1,layerTarget=1,logicalAmount=0,hoverVlan='';
 // Up close the layer steps back, so its glyphs never fill the screen while the camera works in a room.
 let layerNear=1;const layerBox=new THREE.Box3();for(const x of [-39,39])for(const z of [-30.2,37.8])for(const y of [-1,4])layerBox.expandByPoint(toWorld(new THREE.Vector3(x,y,z)));
 function applyLayer(amount){
  layerAmount=amount;const shown=amount*layerNear;logical.visible=shown>.01;
  for(const m of logicalFade){m.opacity=m.userData.base*shown;m.depthWrite=false;}
  for(const o of objects.values())if(o.logical?.glyph)o.logical.glyph.material.opacity=shown*(o.logical.dim??1);
  updateTethers();
 }
 function updateTethers(){
  const shown=new Set([...activeIds,selection,hoverId].filter(Boolean));
  for(const [id,o] of objects){const t=o.logical?.tether;if(!t)continue;const on=layerAmount>.05&&(shown.has(id)||!!hoverVlan&&o.vlan===hoverVlan);t.visible=on;t.material.opacity=on?.75*layerAmount:0;}
 }
 // Kept for the morphing code paths, which the floating layer no longer uses.
 function applyLogical(amount){logicalAmount=amount;applyLayer(layerAmount);}
 // ---- Camera framing ----
 // Phone overlays cover the top and bottom of the stage; insets keep the framed equipment in the clear band.
 let insets={top:0,bottom:0},output=null,frameHook=null,onScreen=true,forceActive=false,running=false;
 const viewSize=()=>exportSize||(output?{w:output.w,h:output.h}:{w:container.clientWidth,h:container.clientHeight});
 function applyInsets(){const {w,h}=viewSize(),shift=insets.bottom-insets.top;if(w&&h&&Math.abs(shift)>.001)camera.setViewOffset(w,h,0,shift*h/2,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();}
 function resize(){refreshShadows();if(output)return;const {clientWidth:w,clientHeight:h}=container;if(!w||!h)return;camera.aspect=w/h;applyInsets();renderer.setSize(w,h);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(w,h);}}
 function move(position,target,animate=true){if(!moving||!animate){camera.position.copy(position);orbit.target.copy(target);transition=null;orbit.update();}else transition={a:camera.position.clone(),b:position,c:orbit.target.clone(),d:target,t:0};drift=stepMode?null:{target:target.clone(),offset:position.clone().sub(target),start:time+2.2,until:performance.now()+22000};dirty=true;}
 let framedExtra=null;
 function fit(ids=null,animate=true,extra){
  // Refits (resize, insets) keep the extra points of the current framing, such as segments on the layer.
  if(extra===undefined)extra=ids===framedIds?framedExtra:null;framedIds=ids;framedExtra=extra;
  const bounds=new THREE.Box3(),logicalView=view==='logical';
  if(!ids){
   if(logicalView){bounds.expandByPoint(new THREE.Vector3(-38,0,-27));bounds.expandByPoint(new THREE.Vector3(38,3,37));}
   else{bounds.expandByPoint(new THREE.Vector3(...roomBounds.min));bounds.expandByPoint(new THREE.Vector3(...roomBounds.max));if(layerOn)for(const x of [-39,39])for(const z of [-30.2,37.8])bounds.expandByPoint(toWorld(new THREE.Vector3(x,2,z)));}
  }
  else for(const id of ids){const o=objects.get(id);if(!o)continue;
   if(logicalView){const p=o.logical?.position;if(!p)continue;const pad=id==='workstations'?6.5:5.5;bounds.expandByPoint(p.clone().add(new THREE.Vector3(-pad,-1.5,-pad)));bounds.expandByPoint(p.clone().add(new THREE.Vector3(pad,4,pad)));}
   else if(o.fitBox)bounds.union(o.fitBox);}
  if(extra)for(const p of extra)bounds.expandByPoint(p);
  if(bounds.isEmpty())return;const target=bounds.getCenter(new THREE.Vector3());
  // Portrait screens look down more steeply, so the room fills the narrow frame. Landscape clips use a lower, cinematic angle.
  // The logical view looks down on the islands like a diagram.
  const stacked=!ids&&!logicalView&&layerOn,portrait=camera.aspect<.8,direction=(stacked?(portrait?new THREE.Vector3(.16,.95,1):new THREE.Vector3(.48,.58,1)):logicalView?(portrait?new THREE.Vector3(.08,1.9,1):new THREE.Vector3(.16,1.25,1)):portrait?new THREE.Vector3(.2,1.2,1):output&&camera.aspect>1.5?new THREE.Vector3(.5,.42,1):new THREE.Vector3(.46,.66,1)).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(19.5)),tanV=tan*Math.max(.35,1-insets.top-insets.bottom);let distance=24;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tanV+p.dot(direction));}
  const padding=output?1:portrait?1.08:camera.aspect<1?1.18:1.10,position=target.clone().addScaledVector(direction,Math.min(distance*padding,480));move(position,target,animate);
  return {position:position.clone(),target:target.clone()};
 }

 // ---- Traffic routes: up into the overhead trays, along them to the core, a rule check, and back out ----
 // Requests ride the lower lane of the tray and the onward leg the upper lane, so the two never overlap.
 const hubPoint=new THREE.Vector3(...hubAt),laneIn=H-.2,laneOut=H+.4,V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const anchorOf=id=>{const o=objects.get(id);return view==='logical'&&o.logical?o.logical.position.clone():o.group.position.clone().add(o.anchor);};
 // Shortest tray path between two tray nodes (Dijkstra over a few nodes).
 const trayGraph=new Map(Object.keys(trayNodes).map(k=>[k,[]]));
 for(const [a,b] of trayEdges){const d=Math.hypot(trayNodes[a][0]-trayNodes[b][0],trayNodes[a][1]-trayNodes[b][1]);trayGraph.get(a).push([b,d]);trayGraph.get(b).push([a,d]);}
 function trayPath(from,to){
  const dist=new Map([[from,0]]),prev=new Map(),open=new Set([from]);
  while(open.size){let u=null;for(const k of open)if(u===null||dist.get(k)<dist.get(u))u=k;open.delete(u);if(u===to)break;
   for(const [v,d] of trayGraph.get(u)){const nd=dist.get(u)+d;if(nd<(dist.get(v)??Infinity)){dist.set(v,nd);prev.set(v,u);open.add(v);}}}
  const path=[to];while(path[0]!==from)path.unshift(prev.get(path[0]));return path;
 }
 const office=()=>objects.get('workstations');
 const deskAnchor=i=>{const [x,z]=officeDesks[i];return V(x,4.55,z-.7);};
 // From a system's port up to its tray: a VM leaves its host, rises in front of the rack, and joins the row tray.
 function drop(id,y,desk=activeDesk){
  const where_=where.get(id);
  if(id==='workstations'){const [x,z]=officeDesks[desk],a=deskAnchor(desk);return {node:deskRowTray[z],points:[a,V(x,y,z-.7),V(x,y,z),V(trayNodes.o1[0],y,z)]};}
  if(where_?.kind==='desk'){const a=anchorOf(id);return {node:adminTray[id],points:[a,V(a.x,y,a.z),V(a.x,y,trayNodes.adm[1])]};}
  if(where_?.kind==='vm'||where_?.kind==='appliance'){const a=anchorOf(id),r=where_.rack,front=r.z+3.75;return {node:rackTray[r.id],points:[a,V(a.x,a.y,front),V(a.x,y,front),V(a.x,y,trayNodes.a1[1]),V(r.x,y,trayNodes.a1[1])]};}
  return null;
 }
 const nodePoint=(k,y)=>V(trayNodes[k][0],y,trayNodes[k][1]);
 // The office access switches sit in the closet under the spine: traffic dips into it on the way past.
 function trayPoints(nodesOnPath,y){
  const out=[];
  for(const k of nodesOnPath){out.push(nodePoint(k,y));if(k==='spine'&&nodesOnPath.length>1){const [x,z]=idfPosition;out.push(V(x-.35,y,z),V(x-.35,9.6,z),V(x+.35,9.6,z),V(x+.35,y,z));}}
  return out;
 }
 function coreDip(check){const x=hubPoint.x,z=hubPoint.z;return [V(x-.6,laneIn,z),V(x-.6,hubPoint.y,z),...(check?[hubPoint.clone()]:[]),V(x+.6,hubPoint.y,z),V(x+.6,laneOut,z)];}
 function physicalPath(step){
  const from=objects.get(step.from),to=objects.get(step.to),pa=where.get(step.from),pb=where.get(step.to);
  // A workstation to another workstation: through the office access switches, never the core. The target's host firewall decides.
  if(step.from===step.to&&step.from==='workstations'){
   const a=drop('workstations',laneIn),b=drop('workstations',laneOut,peerDesk);
   const points=[...a.points,...trayPoints(trayPath(a.node,'spine'),laneIn),...trayPoints(trayPath('spine',b.node),laneOut).slice(1),...b.points.slice().reverse()];
   const route=new Route(rounded(points,.8));return {route,hubT:null,gateT:1-Math.min(.06,2.5/route.total)};
  }
  if(step.from===step.to){const g=from.group.position,a=g.clone().add(V(-5.5,1.6,-2)),b=g.clone().add(V(5.5,1.6,2)),mid=a.clone().lerp(b,.5);mid.y+=4.5;return {route:sampled(new THREE.QuadraticBezierCurve3(a,mid,b)),hubT:null,gateT:.84};}
  // Two virtual machines on one host: the host's virtual switch carries it, so it never leaves the box. The target's firewall decides.
  if(pa?.kind==='vm'&&pb?.kind==='vm'&&pa.host===pb.host){
   const a=anchorOf(step.from),b=anchorOf(step.to),out=.9,points=[a,a.clone().add(V(0,.35,out)),b.clone().add(V(0,.35,out)),b];
   const route=new Route(rounded(points,.3));return {route,hubT:null,gateT:route.nearest(points[2])};
  }
  const a=drop(step.from,laneIn),b=drop(step.to,laneOut);
  if(!a||!b){const pa3=anchorOf(step.from),pb3=anchorOf(step.to),mid=pa3.clone().lerp(pb3,.5);mid.y+=6;return {route:sampled(new THREE.QuadraticBezierCurve3(pa3,mid,pb3)),hubT:null,gateT:.84};}
  // Same VLAN on different hosts: switched through the core at layer 2 with no rule check; the target host's firewall decides.
  const routed=from.vlan!==to.vlan;
  const inbound=trayPoints(trayPath(a.node,'a1'),laneIn),outbound=trayPoints(trayPath('a1',b.node),laneOut);
  const points=[...a.points,...inbound,...coreDip(routed),...outbound,...b.points.slice().reverse()];
  const route=new Route(rounded(points,.9));
  if(!routed)return {route,hubT:null,gateT:1-Math.min(.06,2.5/route.total)};
  const hubT=route.nearest(hubPoint);return {route,hubT,gateT:hubT,facing:true};
 }
 function logicalPath(step){
  const a=anchorOf(step.from),b=anchorOf(step.to),from=objects.get(step.from),to=objects.get(step.to);
  if(step.from===step.to)return {route:sampled(new THREE.CubicBezierCurve3(a.clone().add(new THREE.Vector3(-1.4,0,.4)),a.clone().add(new THREE.Vector3(-4.5,5.5,1.5)),a.clone().add(new THREE.Vector3(4.5,5.5,1.5)),a.clone().add(new THREE.Vector3(1.4,0,.4)))),hubT:null,gateT:.84};
  const ca=islands.get(from.vlan).center.clone().setY(1.2);
  if(from.vlan===to.vlan){const mid=ca.clone().setY(3.4);return {route:sampled(new THREE.QuadraticBezierCurve3(a,mid,b)),hubT:null,gateT:.84};}
  const cb=islands.get(to.vlan).center.clone().setY(1.2),hub=hubLogical.clone();
  const route=new Route([...rounded([a,ca,hub],2.6,10),...rounded([hub,cb,b],2.6,10).slice(1)]);const hubT=route.nearest(hub);return {route,hubT,gateT:hubT,facing:true};
 }
 const flowPath=step=>view==='logical'?logicalPath(step):physicalPath(step);
 // The same step drawn on the topology layer: segment, core, segment.
 function layerRoute(step){
  const from=objects.get(step.from),to=objects.get(step.to),a=from.logical.world.clone(),b=to.logical.world.clone();
  if(step.from===step.to)return {route:sampled(new THREE.CubicBezierCurve3(a.clone().add(V(-1.4,0,.4)),a.clone().add(V(-4.5,5.5,1.5)),a.clone().add(V(4.5,5.5,1.5)),a.clone().add(V(1.4,0,.4)))),hubT:null};
  const ca=toWorld(islands.get(from.vlan).center).setY(LO.y+1.2);
  if(from.vlan===to.vlan){const mid=ca.clone().setY(LO.y+3.4);return {route:sampled(new THREE.QuadraticBezierCurve3(a,mid,b)),hubT:null};}
  const cb=toWorld(islands.get(to.vlan).center).setY(LO.y+1.2),hub=toWorld(hubLogical);
  const route=new Route([...rounded([a,ca,hub],2.6,10),...rounded([hub,cb,b],2.6,10).slice(1)]);return {route,hubT:route.nearest(hub)};
 }
 function subRoute(route,t0,t1){const points=[route.getPoint(t0)];route.points.forEach((p,i)=>{const t=route.lengths[i]/route.total;if(t>t0&&t<t1)points.push(p.clone());});points.push(route.getPoint(t1));return new Route(points.filter((p,i,a)=>i===0||p.distanceToSquared(a[i-1])>1e-8));}

 // ---- Looks: standard (default) and cinematic ----
 const looks={
  standard:{bg:'#081522',fog:.0032,hemi:3.1,key:4.2,rim:2.2,fill:90,exposure:1.22,led:1,packet:1,glow:1,ground:'#0c2236'},
  cinematic:{bg:'#03070d',fog:.0055,hemi:1.05,key:1.6,rim:1.3,fill:130,exposure:1.2,led:2.6,packet:2.6,glow:1.25,ground:'#06111c'}
 };
 let look=looks.standard,composer=null,bloomPass=null,composerLoading=null;
 const tinted=new Set();
 function tint(material,color){material.userData.tint=new THREE.Color(color);material.color.copy(material.userData.tint).multiplyScalar(look.packet);tinted.add(material);return material;}

 // ---- Traffic animation ----
 const ringCanvas=document.createElement('canvas');ringCanvas.width=ringCanvas.height=128;{const ctx=ringCanvas.getContext('2d');ctx.strokeStyle='#ffffff';ctx.lineWidth=9;ctx.beginPath();ctx.arc(64,64,52,0,Math.PI*2);ctx.stroke();}
 const ringTexture=new THREE.CanvasTexture(ringCanvas);
 const effects={},transient=[];
 let flow=null,walker=null,frozen=null;
 const disposeObject=o=>{if(o.isInstancedMesh)o.dispose();if(!o.isSprite)o.geometry?.dispose();if(o.material){tinted.delete(o.material);if(o.userData.ownMap)o.material.map?.dispose();o.material.dispose();}};
 let typing=[];
 function setUsers(ids,step){
  for(const d of officeDesks3D)if(d.screen)d.screen.material.emissiveIntensity=.25;for(const t of typing)t.arms.position.y=0;typing=[];
  if(!ids.includes('workstations'))return;
  for(const i of step&&step.from==='workstations'&&step.to==='workstations'?[activeDesk,peerDesk]:[activeDesk]){const d=officeDesks3D[i];if(d.screen)d.screen.material.emissiveIntensity=.95;if(d.person)typing.push(d.person);}
 }
 function clearFlow(){
  flow=null;walker=null;setUsers([]);transient.length=0;for(const k of Object.keys(effects))delete effects[k];
  for(const e of labels.filter(e=>e.kind==='badge'))removeLabel(e);
  while(flowGroup.children.length){const c=flowGroup.children[0];flowGroup.remove(c);c.traverse(disposeObject);}
  screenLines.clear();guide=null;
  pickRing.visible=false;
 }
 // Policy and transfer labels keep a constant, readable size on screen, anchored above their 3D point.
 function badge(title,sub,color,position,px=220){return screenLabel(labelTexture(title,sub,color,512,{framed:true}),{kind:'badge',px,position,own:true});}
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
  // A packet swells briefly as it leaves, so the eye catches the start of each trip.
  const launch=mode==='travel'&&s<f.v*.22?1+.45*Math.sin(s/(f.v*.22)*Math.PI):1;
  p.head.scale.setScalar(grow*(.3+.7*fade)*launch*(mode==='hold'?1+.25*Math.sin(time*18):1));p.shine.material.opacity=(p.reply?.5:.75)*fade*look.glow;p.shine.scale.setScalar(Math.max(p.reply?1.5:2.2,(p.reply?18:26)*px));
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
     if(mode==='gone'&&p.mode==='travel'&&!f.blocked&&f.policy.kind!=='unreachable')ripple(f.path.route.getPoint(1),f.color);
     if(mode==='travel'&&p.mode==='gone')ripple(f.path.route.getPoint(0),f.color);
     if(mode==='gone'&&p.mode==='hold'){burst(f.gate,effects.gate?.color||'#ee9294');if(effects.gate)effects.gate.flash=1;}
    }
    p.mode=mode;p.s=s;placePacket(f,p,mode,s);
   }
   if(f.twin){const p=f.packets[0],tw=f.twin,show=p.mode!=='gone';tw.head.visible=tw.shine.visible=show;
    if(show){const s=p.s;let t=f.blocked?Math.min(1,s/f.sGate)*tw.gateL:f.routed&&tw.hubT!==null?(s<=f.sHub?s/f.sHub*tw.hubT:tw.hubT+(s-f.sHub)/Math.max(1e-6,f.L-f.sHub)*(1-tw.hubT)):s/f.L;
     tw.route.getPoint(THREE.MathUtils.clamp(t,0,1),tw.head.position);tw.shine.position.copy(tw.head.position);const px=pixelAt(tw.head.position)*pixelScale();tw.head.scale.setScalar(Math.max(1,4*px/.32));tw.shine.scale.setScalar(Math.max(2.4,22*px));}}
   for(const p of f.replies){const lt=((f.clock+p.offset)%f.replyCycle+f.replyCycle)%f.replyCycle,s=f.L-lt*f.v,mode=s>=0?'travel':'gone';p.mode=mode;p.s=Math.max(0,s);placePacket(f,p,mode,p.s);}
   const decay=Math.exp(-dt*3.2);
   if(effects.hub){effects.hub.flash*=decay;effects.hub.shine.material.opacity=(.15+.7*effects.hub.flash)*look.glow;effects.hub.shine.scale.setScalar(4+3*effects.hub.flash);}
   if(effects.gate){const g=effects.gate;g.flash*=decay;g.ring.scale.setScalar(1+.28*g.flash);g.shine.material.opacity=.35+.55*g.flash;}
   if(effects.endpoint)effects.endpoint.shine.material.opacity=.35+.25*Math.sin(time*3);
   if(effects.ends){const {h}=viewSize(),unit=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(h,1),k=pixelScale();for(const e of effects.ends){const beat=moving?(Math.sin(time*2.4+e.phase*Math.PI)+1)/2:.5;e.sprite.scale.setScalar((30+12*beat)*k*unit);e.sprite.material.opacity=.55+.4*(1-beat);}}
  }
  for(const t of typing)t.arms.position.y=moving?Math.abs(Math.sin(time*13))*.035:0;
  if(walker){if(!frozen)walker.u=(walker.u+dt*walker.speed)%1;const position=walker.path.getPoint(walker.u),stride=walker.u*walker.length*.9;
   walker.carrier.position.set(position.x,walker.person?Math.abs(Math.sin(stride))*.18:Math.abs(Math.sin(stride*1.8))*.12,position.z);
   if(walker.person){walker.path.getTangent(walker.u,tangent);walker.carrier.rotation.y=Math.atan2(tangent.x,tangent.z);walker.person.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(stride+(i?Math.PI:0))*.45;});}
   walker.tag.position.copy(walker.carrier.position).setY(walker.person?9.6:2.3);}
  for(let i=transient.length-1;i>=0;i--){const fx=transient[i];fx.age+=dt;const k=Math.min(1,fx.age/fx.life);fx.update(k,dt);if(k>=1){transient.splice(i,1);fx.object.removeFromParent();fx.object.traverse(disposeObject);}}
  if(frozen){pickRing.position.copy(frozen.packet.head.position);pickRing.scale.setScalar(1.6+.25*Math.sin(time*5));}
 }
 // Walking routes for carried media: from the equipment, out through each room's door, along the corridor, and in again.
 const roomParent={server:'corridor',admin:'corridor',office:'corridor',media:'corridor',vault:'media',corridor:null};
 const roomOf=id=>id==='media'?'media':id==='backup'?'vault':where.get(id)?.room;
 function walkStart(id){
  if(walkPoints[id])return [walkPoints[id]];
  const p=where.get(id);if(p?.rack){const a=anchorOf(id);return [[a.x,p.rack.z+3.9],[a.x,-10]];}
  const a=anchorOf(id);return [[a.x,a.z+2]];
 }
 function walkRoute(from,to){
  const chain=id=>{const rooms_=[];for(let r=roomOf(id);r;r=roomParent[r])rooms_.push(r);return rooms_;};
  const ra=chain(from),rb=chain(to),common=ra.find(r=>rb.includes(r));
  const leg=(id,list)=>{const pts=[...walkStart(id)];for(const r of list){if(r===common)break;pts.push(...walkExits[r].points,walkExits[r].out);}return pts;};
  return [...leg(from,ra),...leg(to,rb).reverse()];
 }
 function custodyWalk([from,to]){
  let points;
  if(view==='logical'){const a=objects.get(from)?.logical?.position,b=objects.get(to)?.logical?.position;if(!a||!b)return;points=[a.clone().setY(.07),b.clone().setY(.07)];}
  else{if(!roomOf(from)||!roomOf(to))return;points=rounded(walkRoute(from,to).map(([x,z])=>new THREE.Vector3(x,.07,z)),1.2);}
  const path=new Route(points),length=path.total,count=Math.floor(length/.9),amber='#e6bc82';
  const dashes=new THREE.InstancedMesh(new THREE.BoxGeometry(.55,.03,.22),new THREE.MeshBasicMaterial({color:amber,transparent:true,opacity:.85}),count);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),xAxis=new THREE.Vector3(1,0,0),scale=new THREE.Vector3(1,1,1);
  for(let i=0;i<count;i++){const u=(i+.5)/count;rotation.setFromUnitVectors(xAxis,path.getTangent(u));matrix.compose(path.getPoint(u),rotation,scale);dashes.setMatrixAt(i,matrix);}
  flowGroup.add(dashes);
  for(const u of [0,1]){const end=new THREE.Mesh(new THREE.RingGeometry(.7,.85,32),new THREE.MeshBasicMaterial({color:amber,side:THREE.DoubleSide,transparent:true,opacity:.9}));end.rotation.x=-Math.PI/2;end.position.copy(path.getPoint(u));end.position.y=.08;flowGroup.add(end);}
  // A person carries the sealed media case: a physical transfer, never a network connection.
  const carrier=new THREE.Group();flowGroup.add(carrier);
  const person=view==='logical'?null:equipment.standing(carrier,3);
  const box=new THREE.Mesh(new THREE.BoxGeometry(1.2,.8,1.6),basic(amber));box.position.set(view==='logical'?0:1.55,view==='logical'?1.3:3.9,view==='logical'?0:.3);carrier.add(box);glow(carrier,box.position.x,box.position.y,box.position.z,amber,3,.6);
  const tag=badge('APPROVED MEDIA','Carried by hand · no network link',amber,new THREE.Vector3(),210);
  walker={path,carrier,length,u:.42,speed:3.2/length,tag,person,box};
 }
 // ---- What the scene is showing: a traffic step, a selected system, or a highlighted group ----
 const ringGeometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1));
 const selectionRing=new THREE.LineSegments(ringGeometry,new THREE.LineBasicMaterial({color:'#8eeefa',transparent:true,opacity:.8}));selectionRing.visible=false;scene.add(selectionRing);
 const hoverRing=new THREE.LineSegments(ringGeometry,new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.6,depthTest:false}));hoverRing.renderOrder=20;hoverRing.visible=false;scene.add(hoverRing);
 function placeRing(ring,id){
  const o=objects.get(id);if(!o)return false;
  if(view==='logical'&&o.logical){ring.position.copy(o.logical.position);ring.scale.set(3.2,3.4,3.2);return true;}
  ring.position.copy(o.group.position).add(o.center||new THREE.Vector3());
  ring.scale.set(...o.dimensions).multiplyScalar(1.04);return true;
 }
 function updateOutlines(){
  const any=activeIds.length>0||!!selection,on=id=>activeIds.includes(id)||selection===id;
  for(const {zone,outline} of zoneOutlines){const active=zone.ids.some(on);outline.material.opacity=!any?.5:active?.92:.18;}
  for(const island of islands.values()){const active=island.zone.ids.some(on);island.ring.material.userData.base=!any?.7:active?1:.25;island.disc.material.userData.base=!any?.14:active?.3:.05;island.spoke.material.userData.base=!any?.5:active?.95:.15;}
  for(const o of objects.values())if(o.logical?.glyph)o.logical.dim=!any||on(o.node?.id)||o.facility&&on(o.node.id)?1:.35;
  offlineBoundary.material.userData.base=['root','media','backup'].some(on)?1:any?.4:.85;
  applyLayer(layerAmount);
 }
 const followTarget=new THREE.Vector3();let followSnap=true;
 function showStep(step,color,allIds,policy={kind:step.manual?'manual':'traffic',rule:null},gate=null){
  lastCall={fn:'showStep',args:[step,color,allIds,policy,gate]};
  clearFlow();clearConnections();connectionState=null;releasePacket();followSnap=true;
  selection='';selectionRing.visible=false;stepMode=true;
  const ids=[...new Set([step.from,step.to,...(step.manual?step.walk||[]:[])].filter(id=>id&&objects.has(id)))];
  activeIds=ids;routedActive=false;updateOutlines();setUsers(ids,step);
  if(policy.kind==='manual'){if(step.walk)custodyWalk(step.walk);fit(ids,true);updateFlow(0);return;}
  if(step.from==='root'||step.to==='root')throw new Error('Offline root cannot have a live flow');
  const from_=st=>objects.get(st.from)?.logical?.world;
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
  // The packet's twin travels the topology layer in step with it, so the segments and the core rule line up with the room.
  if(layerOn&&from_(step)&&objects.get(step.to)?.logical?.world){
   const tw=layerRoute(step),gateL=blocked?(tw.hubT??.9):1,shownL=blocked?subRoute(tw.route,0,gateL):tw.route;
   screenLine(shownL,{color,width:9,opacity:.18,additive:true,through:true});screenLine(shownL,{color,width:2.5,opacity:.95,through:true});
   if(blocked)screenLine(subRoute(tw.route,gateL,1),{color,width:1.6,opacity:.5,dash:.8,gap:.6,through:true});
   const head=new THREE.Mesh(new THREE.SphereGeometry(.32,12,8),tint(new THREE.MeshBasicMaterial({depthTest:false,transparent:true}),'#eaffff'));head.renderOrder=21;flowGroup.add(head);
   const shine=glow(flowGroup,0,0,0,color,2.4,.8);shine.material.depthTest=false;shine.renderOrder=20;
   f.twin={route:tw.route,hubT:tw.hubT,gateL,head,shine};
  }
  // Shot plan: an establishing shot of the whole step, then the camera eases in to follow the packet,
  // and returns to the establishing shot after the first trip.
  const shot=fit(routed?[...ids,'core']:ids,true,layerOn&&!!f.twin?[f.twin.route.getPoint(0),f.twin.route.getPoint(1),f.twin.route.getPoint(f.twin.hubT??.5)]:null);
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
  // A highlighted group also frames its segments on the topology layer.
  fit(activeIds.length?activeIds:null,true,null);
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
  const all=kind==='reply'?flow.replies:flow.packets;if(!all.length)return false;
  let list=all.filter(p=>p.mode!=='gone');
  // Nothing on the wire right now: move the timeline so the first one is partway along its route, then inspect it.
  if(!list.length){const p=all[0],f=flow;
   if(p.reply)f.clock=f.L/f.v*.5-p.offset;else f.clock=Math.min(f.travel*.45,f.sGate/f.v*.8)-p.offset;
   updateFlow(0);list=all.filter(q=>q.mode!=='gone');if(!list.length)return false;}
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
 // The topology layer turns on and off; the room always stays. ('logical' means the layer is shown.)
 function setView(next){
  const on=next==='logical';if(on===layerOn)return;
  layerOn=on;layerTarget=on?1:0;if(!moving)applyLayer(layerTarget);
  hooks.onView?.(on?'logical':'physical',true);
  if(lastCall.fn==='highlight'&&!lastCall.args[0]?.length)fit(null,true);else if(lastCall.fn==='showStep')replay(connectionState);
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
  if(!moving||theme!=='cinematic')for(const l of lights)l.material.emissiveIntensity=.6*look.led;
  refreshShadows();
  return theme==='cinematic'?ensureComposer():Promise.resolve();
 }
 // ---- Follow-the-packet camera for clips ----
 function followPoint(){
  if(walker)return walker.carrier.position.clone().setY(walker.person?4:1.3);
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
 function pickSystem(e){const label=labelAt(e);if(label)return label;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(layerAmount*layerNear>.5?[...pickables.logical,...pickables.physical]:pickables.physical).find(hit=>hit.object.visible)?.object.userData.id;}
 function pickPacket(e){
  if(!flow||!flowGroup.visible)return null;
  // Fingers need a larger target than a mouse pointer.
  const r=renderer.domElement.getBoundingClientRect();let best=null,bestDistance=e.pointerType==='touch'?30:18;
  for(const p of [...flow.packets,...flow.replies]){if(!p.head.visible)continue;projected.copy(p.head.position).project(camera);const d=Math.hypot((projected.x+1)/2*r.width+r.left-e.clientX,(1-projected.y)/2*r.height+r.top-e.clientY);if(d<bestDistance){bestDistance=d;best=p;}}
  return best;
 }
 function setHover(id,packet=null,e=null){
  dirty=true;
  const changed=(id||'')!==hoverId;hoverId=id||'';if(changed)updateTethers();
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
  const id=pickSystem(e);if(id?.startsWith('vlan:'))hooks.onVlan?.(id.slice(5));else if(id)onSelect(id);
 });
 renderer.domElement.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  if(e.buttons||output){setHover(null);return;}
  const packet=pickPacket(e),picked=packet?null:pickSystem(e),vlan=picked?.startsWith('vlan:')?picked.slice(5):'',id=vlan?null:picked;
  if(vlan!==hoverVlan){hoverVlan=vlan;updateTethers();dirty=true;}
  renderer.domElement.style.cursor=packet||picked?'pointer':'grab';setHover(id,packet,e);
 });
 renderer.domElement.addEventListener('pointerleave',()=>{hoverVlan='';setHover(null);});
 renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Escape'&&frozen){releasePacket();e.preventDefault();e.stopPropagation();return;}const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));if(e.key==='ArrowLeft')s.theta-=.12;else if(e.key==='ArrowRight')s.theta+=.12;else if(e.key==='ArrowUp')s.phi=Math.max(.1,s.phi-.1);else if(e.key==='ArrowDown')s.phi=Math.min(1.45,s.phi+.1);else if(e.key==='Home'){fit();e.preventDefault();return;}else return;e.preventDefault();drift=null;transition=null;camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(s));orbit.update();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.querySelector('#loading').hidden=false;container.querySelector('#loading').innerHTML='<strong>3D view paused</strong><span>Reload to restore graphics. Technical details remain available.</span>';});
 const observer=new ResizeObserver(()=>{resize();fit(framedIds,false);});observer.observe(container);
 resize();updateOutlines();fit(null,false);container.querySelector('#loading').hidden=true;
 // ---- Render loop ----
 let last=performance.now();
 function render(){if(useBloom())composer.render();else renderer.render(scene,camera);}
 function loop(now){
  const elapsed=Math.min((now-last)/1000,.25),dt=Math.min(elapsed,.06);last=now;
  // Render on demand: when nothing moves and nothing changed, skip the frame to save battery.
  const animating=forceActive||!!output||!!morph||!!frameHook||layerAmount!==layerTarget||(moving&&(!!flow||!!walker||!!transition||!!drift||transient.length>0||theme==='cinematic'));
  if(!animating&&!dirty&&!fading&&!labelsSettling){if(!orbit.update(dt))return;dirty=true;}
  if(moving){
   time+=dt;
   if(transition){transition.t+=elapsed;const p=Math.min(transition.t/2.2,1),t=smooth(p);camera.position.lerpVectors(transition.a,transition.b,t);orbit.target.lerpVectors(transition.c,transition.d,t);if(p===1)transition=null;}
   else if(drift&&now>drift.until){drift=null;dirty=true;}
   else if(drift){const s=new THREE.Spherical().setFromVector3(drift.offset);s.theta+=Math.sin((time-drift.start)*.19)*.06;s.phi+=Math.sin((time-drift.start)*.13)*.012;camera.position.copy(drift.target).add(new THREE.Vector3().setFromSpherical(s));orbit.target.copy(drift.target);}
   // Status lights blink only in the cinematic look; in the standard look they hold steady.
   if(theme==='cinematic')for(const l of lights)l.material.emissiveIntensity=(.35+1.1*Math.pow((Math.sin(time*1.6+l.phase)+1)/2,3))*look.led;
   updateFlow(Math.min(elapsed,.1));
  }
  {const near=output&&!stepMode?1:THREE.MathUtils.clamp((layerBox.distanceToPoint(camera.position)-(camera.aspect<.8?18:10))/(camera.aspect<.8?34:26),0,1);if(Math.abs(near-layerNear)>.01){layerNear=near;applyLayer(layerAmount);}}
  if(layerAmount!==layerTarget){const step=moving?elapsed/.6:1;applyLayer(layerTarget>layerAmount?Math.min(layerTarget,layerAmount+step):Math.max(layerTarget,layerAmount-step));}
  if(morph){morph.t=Math.min(1,morph.t+elapsed/morph.duration);const target=morph.to==='logical'?1:0;applyLogical(morph.from+(target-morph.from)*smooth(morph.t));if(morph.t>=1)finishMorph();}
  updateFollow(elapsed);updateGuided(elapsed);updateScreenLines();
  orbit.update(dt);
  scene.fog.density=look.fog*THREE.MathUtils.clamp(110/camera.position.distanceTo(orbit.target),.3,1);
  updateXray(moving?elapsed:0);updateLabels(moving?elapsed:0);
  dirty=false;render();frameHook?.(renderer.domElement);
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
 function setMotion(on){moving=on;orbit.enableDamping=on&&!reduced;if(!on){if(transition){camera.position.copy(transition.b);orbit.target.copy(transition.d);}transition=null;drift=null;finishMorph();applyLayer(layerTarget);for(const l of lights)l.material.emissiveIntensity=.6*look.led;}dirty=true;}
 function dispose(){
  observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',updateLoop);orbit.dispose();renderer.setAnimationLoop(null);composer?.dispose?.();
  const geometries=new Set(),materials=new Set(),textures=new Set();
  scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}});
  for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();renderer.dispose();renderer.domElement.remove();
 }
 const baseDescription=renderer.domElement.getAttribute('aria-label');
 const api={setDescription(text){renderer.domElement.setAttribute('aria-label',text?`${text} ${baseDescription}`:baseDescription);},showStep,select,highlight,exportImage,setInsets,setOutput,resize,dispose,setMotion,canvas:renderer.domElement,
  setFrameHook(fn){frameHook=fn;},setForceActive(on){forceActive=on;updateLoop();},overview:()=>highlight(),frame:ids=>fit(ids),setLabels(on){labelMode=on?'focus':'off';},setLabelMode(mode){labelMode=['focus','all','off'].includes(mode)?mode:'focus';},getLabelMode:()=>labelMode,
  setView,getView:()=>layerOn?'logical':'physical',setTheme,getTheme:()=>theme,setCameraMode(mode){cameraMode=['follow','guided'].includes(mode)?mode:'wide';followSnap=true;if(guide){guide.user=false;guide.t=Math.max(guide.t,1.2);}if(cameraMode==='wide')fit(framedIds,false);},getCameraMode:()=>cameraMode,
  setStepSeconds(seconds){stepSeconds=seconds;},showConnections,inspectPacket,releasePacket,
  setReserved(rects){reserved=rects||[];},
  debugProject(id){const o=objects.get(id);if(!o)return null;projected.copy(anchorOf(id)).project(camera);const r=renderer.domElement.getBoundingClientRect();return {x:(projected.x+1)/2*r.width+r.left,y:(1-projected.y)/2*r.height+r.top};},
  debugState(){return {flow:!!flow,walker:!!walker,transition:!!transition,drift:!!drift,morph:!!morph,fading,labelsSettling,dirty,theme,transient:transient.length,forceActive,output:!!output};},
  debugLabels(){return labels.map(e=>({kind:e.kind,id:e.id,zone:e.zone,priority:e.priority,show:e.show,rect:e.rect?.map(Math.round)}));},
  // Test hook: screen positions of visible packets, used by the browser checks.
  debugPackets(){if(!flow)return [];const r=renderer.domElement.getBoundingClientRect();return [...flow.packets,...flow.replies].filter(p=>p.head.visible).map(p=>{projected.copy(p.head.position).project(camera);return {kind:p.kind,x:(projected.x+1)/2*r.width+r.left,y:(1-projected.y)/2*r.height+r.top};});}};
 // Any call that changes what the scene shows also schedules a frame (rendering is on demand).
 for(const [name,fn] of Object.entries(api))if(typeof fn==='function'&&!name.startsWith('get')&&!name.startsWith('debug'))api[name]=(...args)=>{dirty=true;return fn(...args);};
 return api;
}
