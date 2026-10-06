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
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=container.clientWidth>=720;renderer.shadowMap.type=THREE.PCFShadowMap;
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
  if(sub){ctx.font='600 44px Segoe UI,Arial';ctx.fillStyle=color;ctx.fillText(sub,384,139,710);}
  // Mipmaps and anisotropic filtering keep small, distant labels smooth instead of shimmering.
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
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
 // Phone overlays cover the top and bottom of the stage; insets keep the framed equipment in the clear band.
 let insets={top:0,bottom:0},output=null,frameHook=null,onScreen=true,forceActive=false,running=false;
 const viewSize=()=>output?{w:output.w,h:output.h}:{w:container.clientWidth,h:container.clientHeight};
 function applyInsets(){const {w,h}=viewSize(),shift=insets.bottom-insets.top;if(w&&h&&Math.abs(shift)>.001)camera.setViewOffset(w,h,0,shift*h/2,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();}
 function resize(){if(output)return;const {clientWidth:w,clientHeight:h}=container;if(!w||!h)return;camera.aspect=w/h;applyInsets();renderer.setSize(w,h);}
 function move(position,target,animate=true){if(!moving||!animate){camera.position.copy(position);orbit.target.copy(target);transition=null;orbit.update();}else transition={a:camera.position.clone(),b:position,c:orbit.target.clone(),d:target,t:0};drift={target:target.clone(),offset:position.clone().sub(target),start:time+2.2};}
 function fit(ids=null,animate=true){
  framedIds=ids;
  const bounds=new THREE.Box3();
  if(!ids){bounds.expandByPoint(new THREE.Vector3(...roomBounds.min));bounds.expandByPoint(new THREE.Vector3(...roomBounds.max));}
  else for(const id of ids){const o=objects.get(id);if(o){const p=o.group.position,pad=id==='workstations'?11:8;bounds.expandByPoint(p.clone().add(new THREE.Vector3(-pad,-1,-4)));bounds.expandByPoint(p.clone().add(new THREE.Vector3(pad,facilities.some(f=>f.id===id)?o.dimensions[1]+2:4,7)));}}
  if(bounds.isEmpty())return;const target=bounds.getCenter(new THREE.Vector3());
  // Portrait screens look down more steeply, so the square room fills the narrow frame.
  // Landscape clips use a lower, more cinematic angle so the room fills the wide frame.
  const portrait=camera.aspect<.8,direction=(portrait?new THREE.Vector3(.2,1.2,1):output&&camera.aspect>1.5?new THREE.Vector3(.5,.42,1):new THREE.Vector3(.46,.66,1)).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(19.5)),tanV=tan*Math.max(.35,1-insets.top-insets.bottom);let distance=24;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tanV+p.dot(direction));}
  const padding=output?1:portrait?1.08:camera.aspect<1?1.18:1.10;move(target.clone().addScaledVector(direction,Math.min(distance*padding,480)),target,animate);
 }
 // ---- Traffic, policy, and custody animation ----
 const effects={},walks={'media>wsus':[[3,25],[13,22],[13,-2.5],[-8,-2.5],[-8,-7.4]],'subca>media':[[1,-7.4],[1,-2.5],[13,-2.5],[13,22],[3,25]],'media>root':[[3,25],[13,22],[13,14.5],[24,14.5],[24,12.6]],'root>subca':[[24,12.6],[24,14.5],[13,14.5],[13,-2.5],[1,-2.5],[1,-7.4]]};
 let walker=null;
 const disposeObject=o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();if(o.material){if(o.userData.ownMap)o.material.map?.dispose();o.material.dispose();}};
 function clearFlow(){flows.length=0;walker=null;for(const key of Object.keys(effects))delete effects[key];while(flowGroup.children.length){const c=flowGroup.children[0];flowGroup.remove(c);c.traverse(disposeObject);}}
 const anchorOf=id=>{const o=objects.get(id);return o.group.position.clone().add(o.anchor);};
 // Policy and transfer labels keep a constant, readable size on screen, anchored above their 3D point.
 function badge(title,sub,color,screenWidth=.17){const o=textTexture(title,sub,color,false,1);o.material.sizeAttenuation=false;o.scale.set(screenWidth,screenWidth*(sub?190:110)/768,1);o.center.set(.5,0);o.renderOrder=30;o.userData.ownMap=true;return o;}
 function lockBadge(color,sub){
  const c=document.createElement('canvas');c.width=512;c.height=150;const ctx=c.getContext('2d');
  ctx.fillStyle='rgba(5,17,30,.92)';ctx.beginPath();ctx.roundRect(1,1,510,148,16);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle=color;ctx.lineWidth=9;ctx.beginPath();ctx.arc(76,62,22,Math.PI,0);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(44,60,64,52,8);ctx.fill();ctx.fillStyle='rgba(5,17,30,.92)';ctx.beginPath();ctx.arc(76,82,7,0,Math.PI*2);ctx.fill();ctx.fillRect(73,84,6,14);
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#e4f5ff';ctx.font='700 50px Segoe UI,Arial';ctx.fillText('TLS',138,56,350);ctx.font='600 32px Segoe UI,Arial';ctx.fillStyle=color;ctx.fillText(sub,138,108,360);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
  const o=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,sizeAttenuation:false}));o.scale.set(.12,.12*150/512,1);o.center.set(.5,0);o.renderOrder=30;o.userData.ownMap=true;return o;
 }
 function flowPath(step){
  const from=objects.get(step.from),to=objects.get(step.to);
  if(step.from===step.to){const g=from.group.position,a=g.clone().add(new THREE.Vector3(-5.5,1.6,-2)),b=g.clone().add(new THREE.Vector3(5.5,1.6,2)),mid=a.clone().lerp(b,.5);mid.y+=4.5;return {curve:new THREE.QuadraticBezierCurve3(a,mid,b),hubT:null,gateT:.84,a,b};}
  const a=anchorOf(step.from),b=anchorOf(step.to);
  if(from.node.zone===to.node.zone){const mid=a.clone().lerp(b,.5);mid.y+=Math.min(10,a.distanceTo(b)*.28);mid.z+=6;return {curve:new THREE.QuadraticBezierCurve3(a,mid,b),hubT:null,gateT:.5,a,b};}
  // Routed flows pass through the core switch stack, where the policy decision is made.
  const hub=anchorOf('core'),curve=new THREE.CatmullRomCurve3([a,a.clone().lerp(hub,.5).add(new THREE.Vector3(0,5,3)),hub,b.clone().lerp(hub,.5).add(new THREE.Vector3(0,5,3)),b],false,'centripetal');
  let hubT=.5,best=Infinity;for(let i=0;i<=240;i++){const d=curve.getPointAt(i/240).distanceToSquared(hub);if(d<best){best=d;hubT=i/240;}}
  return {curve,hubT,gateT:hubT,a,b};
 }
 function part(curve,t0,t1,n=64){const points=[];for(let i=0;i<=n;i++)points.push(curve.getPointAt(t0+(t1-t0)*i/n));return new THREE.CatmullRomCurve3(points);}
 function tube(curve,radius,material){const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,80,radius,8,false),material);flowGroup.add(mesh);return mesh;}
 function dashed(curve,t0,t1,color){const points=[];for(let i=0;i<=90;i++)points.push(curve.getPointAt(t0+(t1-t0)*i/90));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color,dashSize:.45,gapSize:.4,transparent:true,opacity:.55}));line.computeLineDistances();flowGroup.add(line);return line;}
 function packet({curve,color,style,dir=1,t0=0,t1=1,phase=0,speed,size=1,fadeEnd=false,reply=false}){
  const head=new THREE.Mesh(style==='tcp'?new THREE.ConeGeometry(.17*size,.64*size,9):new THREE.SphereGeometry(.21*size,12,9),basic(reply?color:'#eaffff'));flowGroup.add(head);
  const shine=glow(flowGroup,0,0,0,color,reply?1.4:2,reply?.5:.75),tails=[];
  for(let j=0;j<(style==='tcp'?5:style==='either'?2:0);j++){const tail=new THREE.Mesh(new THREE.SphereGeometry((.14-j*.019)*size,6,5),basic(color,.5-j*.08));flowGroup.add(tail);tails.push(tail);}
  flows.push({curve,color,style,dir,t0,t1,u:phase,speed,fadeEnd,reply,head,shine,tails});
 }
 function gateAt(position,tangent,color,[title,sub]){
  const group=new THREE.Group();group.position.copy(position);flowGroup.add(group);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.15,12,48),basic(color));ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),tangent.clone().normalize());group.add(ring);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(2.6,.26,.26),basic(color));bar.quaternion.copy(ring.quaternion);bar.rotateZ(Math.PI/4);group.add(bar);
  const shine=glow(group,0,0,0,color,6,.4),label=badge(title,sub,color,.2);label.position.set(0,2,0);group.add(label);
  return {group,ring,shine,flash:0};
 }
 function endpointBadge(position,color,text,lift=3.4){const group=new THREE.Group();group.position.copy(position);flowGroup.add(group);const shine=glow(group,0,0,0,color,6,.5),label=badge(...text,color,.21);label.position.set(0,lift,0);group.add(label);return {group,shine};}
 function custodyWalk([from,to]){
  const route=walks[`${from}>${to}`];if(!route)return;
  const path=new THREE.CurvePath();for(let i=1;i<route.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(route[i-1][0],.07,route[i-1][1]),new THREE.Vector3(route[i][0],.07,route[i][1])));
  const length=path.getLength(),count=Math.floor(length/.9),amber='#e6bc82';
  const dashes=new THREE.InstancedMesh(new THREE.BoxGeometry(.55,.03,.22),new THREE.MeshBasicMaterial({color:amber,transparent:true,opacity:.85}),count);
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),xAxis=new THREE.Vector3(1,0,0),scale=new THREE.Vector3(1,1,1);
  for(let i=0;i<count;i++){const u=(i+.5)/count;rotation.setFromUnitVectors(xAxis,path.getTangentAt(u).normalize());matrix.compose(path.getPointAt(u),rotation,scale);dashes.setMatrixAt(i,matrix);}
  flowGroup.add(dashes);
  for(const u of [0,1]){const end=new THREE.Mesh(new THREE.RingGeometry(.7,.85,32),new THREE.MeshBasicMaterial({color:amber,side:THREE.DoubleSide,transparent:true,opacity:.9}));end.rotation.x=-Math.PI/2;end.position.copy(path.getPointAt(u));end.position.y=.08;flowGroup.add(end);}
  // A sealed media case carried by a person: a physical transfer, never a network connection.
  const carrier=new THREE.Group(),media=new THREE.Mesh(new THREE.BoxGeometry(.9,.55,1.2),basic(amber));media.position.y=1.3;carrier.add(media);glow(carrier,0,1.3,0,amber,3,.6);
  const tag=badge('APPROVED MEDIA','Carried by hand · no network link',amber,.19);tag.position.y=2.1;carrier.add(tag);flowGroup.add(carrier);
  walker={path,carrier,length,u:.42,speed:3.4/length};
 }
 function showStep(step,color,allIds,policy={kind:step.manual?'manual':'traffic',rule:null},gate=null){
  clearFlow();selection='';selectionRing.visible=false;
  activeIds=[...new Set([step.from,step.to,...(step.manual?step.walk||[]:[])].filter(id=>id&&objects.has(id)))];
  for(const [id,o] of objects){const active=activeIds.includes(id);o.label.material.opacity=active?1:allIds.includes(id)?.55:.19;o.label.visible=labelsVisible&&(active||facilities.some(f=>f.id===id));}
  for(const {zone,outline,halo} of zones){const active=zone.ids.some(id=>activeIds.includes(id));outline.material.opacity=active?.95:.2;if(halo)halo.material.opacity=active?.12:.045;}
  if(policy.kind==='manual'){if(step.walk)custodyWalk(step.walk);fit(activeIds,true);updateFlow(0);return;}
  if(step.from==='root'||step.to==='root')throw new Error('Offline root cannot have a live flow');
  const path=flowPath(step),{curve}=path,style=step.stream||'tcp',blocked=policy.kind==='pending'||policy.kind==='deny',end=blocked?path.gateT:1,tls=step.protection==='tls'&&policy.kind==='traffic';
  const speed=Math.min(.18,6/curve.getLength())*(style==='tcp'?1:1.35),shown=blocked?part(curve,0,end):curve;
  tube(shown,.055,basic(color,.85));
  tube(shown,tls?.27:.19,new THREE.MeshBasicMaterial({color,transparent:true,opacity:tls?.24:.11,depthWrite:false,blending:THREE.AdditiveBlending}));
  if(blocked)dashed(curve,end,1,color);
  for(const phase of style==='tcp'?[0,.25,.5,.75]:[0,.29,.63])packet({curve,color,style,t1:end,phase,speed:speed/Math.max(end,.2),fadeEnd:blocked||policy.kind==='unreachable'});
  if((policy.kind==='traffic'||policy.kind==='rejected')&&step.reply!==false){const reply=new THREE.Color(color).lerp(new THREE.Color('#ffffff'),.45);for(const phase of [.14,.64])packet({curve,color:reply,style,dir:-1,phase,speed,size:.72,reply:true});}
  const enforcement=curve.getPointAt(end),tangent=curve.getTangentAt(end);
  if(blocked)effects.gate=gateAt(enforcement,tangent,policy.kind==='pending'?'#e6bc82':'#ee9294',gate||['BLOCKED','']);
  else if(path.hubT!==null&&gate){const label=badge(gate[0],gate[1],'#7fe0b7',.17);label.position.copy(enforcement).add(new THREE.Vector3(0,2,0));flowGroup.add(label);effects.hub={shine:glow(flowGroup,enforcement.x,enforcement.y,enforcement.z,'#7fe0b7',4,.15),t:path.hubT,flash:0};}
  if(policy.kind==='unreachable')effects.endpoint=endpointBadge(path.b,'#ee9294',['NO RESPONSE',`${objects.get(step.to).node.name} is offline`]);
  if(policy.kind==='rejected')effects.endpoint=endpointBadge(path.a,'#ee9294',['CERTIFICATE REJECTED','The browser stops the connection'],7.5);
  if(tls){const lock=lockBadge(color,'Encrypted session');lock.position.copy(curve.getPointAt(path.hubT!==null?path.hubT*.55:.3)).add(new THREE.Vector3(0,1.6,0));flowGroup.add(lock);}
  if(step.protection==='signed'&&!blocked){const seal=badge('SIGNED · NOT ENCRYPTED','Signatures protect the payload',color,.19);seal.position.copy(curve.getPointAt(path.hubT!==null?path.hubT*.55:.3)).add(new THREE.Vector3(0,1.6,0));flowGroup.add(seal);}
  fit(path.hubT!==null?[...activeIds,'core']:activeIds,true);updateFlow(0);
 }
 function updateFlow(dt){
  const up=new THREE.Vector3(0,1,0);
  for(const p of flows){
   p.u=(p.u+dt*p.speed)%1;const span=p.t1-p.t0,at=u=>p.dir>0?p.t0+span*u:p.t1-span*u,t=at(p.u),position=p.curve.getPointAt(t);
   p.head.position.copy(position);p.shine.position.copy(position);
   if(p.style==='tcp'){const tangent=p.curve.getTangentAt(t).normalize();if(p.dir<0)tangent.negate();p.head.quaternion.setFromUnitVectors(up,tangent);}
   const fade=p.fadeEnd&&p.u>.8?Math.max(0,1-(p.u-.8)/.2):1;p.head.scale.setScalar(.3+.7*fade);p.shine.material.opacity=(p.reply?.5:.75)*fade;
   p.tails.forEach((tail,i)=>{const u=p.u-(i+1)*.012/Math.max(span,.05);tail.visible=u>=0&&fade>.2;if(u>=0)tail.position.copy(p.curve.getPointAt(at(u)));});
   if(effects.hub&&p.dir>0&&Math.abs(t-effects.hub.t)<.012)effects.hub.flash=1;
   if(effects.gate&&p.fadeEnd&&p.u>.93)effects.gate.flash=1;
  }
  const decay=Math.exp(-dt*3.2);
  if(effects.hub){effects.hub.flash*=decay;effects.hub.shine.material.opacity=.15+.7*effects.hub.flash;effects.hub.shine.scale.setScalar(4+3*effects.hub.flash);}
  if(effects.gate){const g=effects.gate;g.flash*=decay;g.ring.scale.setScalar(1+.28*g.flash);g.shine.material.opacity=.35+.55*g.flash;}
  if(effects.endpoint)effects.endpoint.shine.material.opacity=.35+.25*Math.sin(time*3);
  if(walker){walker.u=(walker.u+dt*walker.speed)%1;const position=walker.path.getPointAt(walker.u);walker.carrier.position.set(position.x,Math.abs(Math.sin(walker.u*walker.length*1.6))*.12,position.z);}
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
 let last=performance.now();
 function loop(now){const dt=Math.min((now-last)/1000,.06);last=now;
  if(moving){time+=dt;if(transition){transition.t+=dt;const p=Math.min(transition.t/2.2,1),t=p*p*(3-2*p);camera.position.lerpVectors(transition.a,transition.b,t);orbit.target.lerpVectors(transition.c,transition.d,t);if(p===1)transition=null;}else if(drift){const s=new THREE.Spherical().setFromVector3(drift.offset);s.theta+=Math.sin((time-drift.start)*.19)*.06;s.phi+=Math.sin((time-drift.start)*.13)*.012;camera.position.copy(drift.target).add(new THREE.Vector3().setFromSpherical(s));orbit.target.copy(drift.target);}for(const l of lights)l.material.emissiveIntensity=.35+1.1*Math.pow((Math.sin(time*1.6+l.phase)+1)/2,3);updateFlow(dt);if(selectionRing.visible&&selection!=='root')selectionRing.material.opacity=.6+.23*Math.sin(time*1.6);}
  orbit.update(dt);renderer.render(scene,camera);frameHook?.(renderer.domElement);
 }
 // Render only while the stage is on screen (or while recording), to save battery and CPU.
 function updateLoop(){const run=forceActive||(onScreen&&!document.hidden);if(run===running)return;running=run;if(run)last=performance.now();renderer.setAnimationLoop(run?loop:null);}
 const visibility=new IntersectionObserver(entries=>{onScreen=entries[entries.length-1].isIntersecting;updateLoop();});visibility.observe(container);
 document.addEventListener('visibilitychange',updateLoop);updateLoop();
 function exportImage(){
  const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;let encoded;
  try{
   renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=16/9;camera.clearViewOffset();camera.updateProjectionMatrix();renderer.render(scene,camera);
   // toBlob copies the rendered frame immediately. A Blob URL avoids browser size limits on large data URLs.
   encoded=new Promise((resolve,reject)=>renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'));
  }finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;applyInsets();renderer.render(scene,camera);}
  return encoded.then(blob=>{const url=URL.createObjectURL(blob),link=document.createElement('a');link.download='inside-the-network-4k.png';link.href=url;link.hidden=true;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);});
 }
 function highlight(ids=[]){clearFlow();activeIds=ids;selection='';selectionRing.visible=false;for(const [id,o]of objects){o.label.material.opacity=!ids.length||ids.includes(id)?1:.2;o.label.visible=labelsVisible&&(ids.includes(id)||facilities.some(f=>f.id===id));}for(const {zone,outline,halo}of zones){const active=!ids.length||zone.ids.some(id=>ids.includes(id));outline.material.opacity=active?.8:.18;if(halo)halo.material.opacity=active?.1:.025;}fit(ids.length?ids:null);}
 function setInsets(next){if(output){output.insets=next;return;}if(Math.abs(next.top-insets.top)<.01&&Math.abs(next.bottom-insets.bottom)<.01)return;insets=next;applyInsets();fit(framedIds,true);}
 // Recording renders at a fixed output size; captions are composited by the caller through the frame hook.
 function setOutput(size){
  if(size){if(!output)output={ratio:renderer.getPixelRatio(),insets};output.w=size.w;output.h=size.h;insets=size.insets||{top:0,bottom:0};renderer.setPixelRatio(1);renderer.setSize(size.w,size.h,false);camera.aspect=size.w/size.h;applyInsets();fit(framedIds,false);}
  else if(output){const saved=output;output=null;insets=saved.insets;renderer.setPixelRatio(saved.ratio);resize();fit(framedIds,false);}
 }
 return {showStep,select,highlight,exportImage,setInsets,setOutput,canvas:renderer.domElement,setFrameHook(fn){frameHook=fn;},setForceActive(on){forceActive=on;updateLoop();},overview:()=>highlight(),frame:(ids)=>fit(ids),setLabels(on){labelsVisible=on;for(const label of labels)label.visible=on;for(const [id,o] of objects)o.label.visible=on&&(activeIds.includes(id)||selection===id||facilities.some(f=>f.id===id));},setMotion(on){moving=on;orbit.enableDamping=on&&!reduced;if(!on){if(transition){camera.position.copy(transition.b);orbit.target.copy(transition.d);}transition=null;drift=null;}},resize,dispose(){observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',updateLoop);orbit.dispose();renderer.setAnimationLoop(null);const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}});for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();renderer.dispose();renderer.domElement.remove();}};
}
