import * as THREE from 'three';
import { OrbitControls } from 'three/orbit';
const {nodes,chapters,controls:controlNotes,colors,flowColors}=JSON.parse(document.getElementById('networkData').textContent);
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let chapter=-1,selected='',motion=!reduced,touring=false,tourElapsed=0,transition=null,topView=false;
let demo=true,demoIndex=0,demoElapsed=0,effectTime=0,introTime=0,cameraDrift=null;
let renderer,scene,camera,orbit,model,flowGroup,selectionRing,glowTexture;
const objects=new Map(),pickables=[],allLabels=[],particles=[],zoneGroups=[],deviceLights=[],screenLights=[],platformEffects=[],endpointRings=[];
const demoChapters=[0,2,4,5,6];
const forward=new THREE.Vector3(0,1,0);
const layout=[
 {id:'identity',name:'IDENTITY + ISSUING PKI',x:-18,z:-10,w:15.5,d:14,ids:['dc1','dc2','subca']},
 {id:'services',name:'BUSINESS SERVICES',x:0,z:-10,w:15.5,d:14,ids:['dhcp','fs','apps','sql']},
 {id:'operations',name:'SECURITY OPERATIONS',x:18,z:-10,w:15.5,d:14,ids:['syslog','audit','splunk','epo']},
 {id:'users',name:'USER WORKSTATIONS',x:-21,z:10,w:12,d:12,ids:['workstations']},
 {id:'admin',name:'PRIVILEGED ADMIN',x:-7,z:10,w:10,d:12,ids:['jump']},
 {id:'maintenance',name:'UPDATES + SCANNING',x:8,z:10,w:16,d:14,ids:['wsus','repo','nessus']},
 {id:'offline',name:'OFFLINE / NO LIVE LINK',x:27,z:14,w:12,d:12,ids:['root']}
];
const shortTitles=['Identity & addressing','Offline root & issuing CA','Business services','Privileged administration','Updates & repositories','Protection & scanning','Logging & detection','Backup & recovery'];
for(const [i,c] of chapters.entries())$('chapter').add(new Option(`${String(i+1).padStart(2,'0')} · ${shortTitles[i]}`,c.id));
for(const node of nodes)$('system').add(new Option(node.name,node.id));
const toast=msg=>{$('toast').textContent=msg;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').textContent='',3500);};

function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.53,metalness:.35,...extra});}
function box(parent,w,h,d,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function glowMaterial(color,opacity=.5){return new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});}
function makeGlowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.55)');g.addColorStop(.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
function glowSprite(color,size){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.scale.setScalar(size);return sprite;}
function activeChapter(){return chapter>=0?chapters[chapter]:demo?chapters[demoChapters[demoIndex]]:null;}
function setActivityText(){
 const c=activeChapter(),index=chapter>=0?chapter:demoChapters[demoIndex];
 $('activityTitle').textContent=c?shortTitles[index]:'Ambient device lighting';
 $('activityState').textContent=motion?'ILLUSTRATIVE ANIMATION · NOT LIVE TELEMETRY':'PAUSED · ILLUSTRATIVE ANIMATION';
 $('activityDetail').textContent=c?.edges.length?`${c.edges.length} proposed relationships · light trails show logical direction`:c?'No live paths assumed in this chapter':'Decorative lights only · no connectivity implied';
 $('demo').setAttribute('aria-pressed',String(demo));
 $('demo').disabled=chapter>=0;
 $('demo').title=chapter>=0?'Choose Full inventory to toggle the demo cycle.':'Cycle through illustrative relationships in the full inventory.';
}
function stopCameraDrift(){cameraDrift=null;}
function updateEffects(dt){
 effectTime+=dt;introTime+=dt;
 const active=activeChapter()?.nodes;
 for(const [i,o] of [...objects.values()].entries()){
  if(o.node.id==='root')continue;
  const p=THREE.MathUtils.clamp((introTime-i*.035)/1.3,0,1),s=1-Math.pow(1-p,3);
  o.group.scale.set(.92+.08*s,.04+.96*s,.92+.08*s);
 }
 for(const item of deviceLights){const bright=.25+.75*Math.pow((Math.sin(effectTime*1.8+item.phase)+1)/2,3);item.material.emissiveIntensity=.3+bright*1.8;}
 for(const item of screenLights){const level=.55+.45*(.5+.5*Math.sin(effectTime*.8+item.phase));item.material.color.copy(item.base).multiplyScalar(level);}
 for(const effect of platformEffects){
  const included=!active||effect.zone.ids.some(id=>active.includes(id));
  effect.halo.material.opacity=(included?.29:.1)+.04*Math.sin(effectTime*.85+effect.phase);
  for(const [i,light] of effect.lights.entries()){
   const perimeter=2*(effect.zone.w+effect.zone.d),p=((effectTime*(included?2.3:1.1)+i*perimeter/3+effect.phase*4)%perimeter);
   let x,z;if(p<effect.zone.w){x=-effect.zone.w/2+p;z=-effect.zone.d/2;}else if(p<effect.zone.w+effect.zone.d){x=effect.zone.w/2;z=-effect.zone.d/2+p-effect.zone.w;}else if(p<2*effect.zone.w+effect.zone.d){x=effect.zone.w/2-(p-effect.zone.w-effect.zone.d);z=effect.zone.d/2;}else{x=-effect.zone.w/2;z=effect.zone.d/2-(p-2*effect.zone.w-effect.zone.d);}
   light.position.set(effect.zone.x+x,.58,effect.zone.z+z);light.material.opacity=included?.75:.22;
  }
 }
 for(const p of particles){
  p.t=(p.t+dt*p.speed)%1;const strength=p.t<.06?p.t/.06:p.t>.94?(1-p.t)/.06:1;
  p.mesh.position.copy(p.curve.getPointAt(p.t));p.mesh.quaternion.setFromUnitVectors(forward,p.curve.getTangentAt(p.t).normalize());p.mesh.material.opacity=strength;
  p.glow.position.copy(p.mesh.position);p.glow.material.opacity=.85*strength;
  for(const [i,tail] of p.trail.entries()){const t=p.t-(i+1)*.014;tail.visible=t>=0;if(t>=0)tail.position.copy(p.curve.getPointAt(t));tail.material.opacity=(.5-i*.065)*strength;}
 }
 for(const ring of endpointRings){const phase=(effectTime*.34+ring.phase)%1;ring.mesh.scale.setScalar(.4+phase*1.8);ring.mesh.material.opacity=(1-phase)*.55;}
 if(selectionRing.visible&&selected!=='root'){selectionRing.material.opacity=.62+.28*Math.sin(effectTime*1.4);}
}
function label(text,sub,color,width=7.1){
 const cv=document.createElement('canvas');cv.width=768;cv.height=sub?210:130;const cx=cv.getContext('2d');
 cx.fillStyle='rgba(8,16,31,.92)';cx.beginPath();cx.roundRect(2,2,764,cv.height-4,16);cx.fill();cx.strokeStyle=color;cx.lineWidth=2;cx.stroke();
 cx.textAlign='center';cx.textBaseline='middle';cx.font='600 93px Segoe UI,Arial';cx.fillStyle='#e7f0ff';cx.fillText(text,384,sub?73:65,722);
 if(sub){cx.font='49px Segoe UI,Arial';cx.fillStyle=color;cx.fillText(sub,384,161,718);}
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false}));sprite.scale.set(width,width*cv.height/768,1);sprite.renderOrder=30;allLabels.push(sprite);return sprite;
}
function floorLabel(text,color,width){
 const cv=document.createElement('canvas');cv.width=1024;cv.height=96;const ctx=cv.getContext('2d');ctx.font='600 70px Segoe UI,Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,48,995);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width*96/1024),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;return mesh;
}
function server(parent,color,type){
 const body=material('#26364f'),face=material('#142238'),trim=material(color,{emissive:color,emissiveIntensity:.3});
 const h=type==='root'?3.4:3.05;
 box(parent,2.45,.3,2.35,0,.24,0,material('#172237'));
 box(parent,1.85,h,1.75,0,.55+h/2,0,body);
 box(parent,1.57,h-.3,.1,0,.55+h/2,.91,face);
 for(let i=0;i<4;i++){
  box(parent,1.28,.36,.08,0,1.05+i*.5,.98,material('#304660'));
  const led=material(type==='root'?'#746342':color,{emissive:type==='root'?'#000000':color,emissiveIntensity:.8});led.userData.animatedLight=true;
  box(parent,.17,.12,.03,.43,1.05+i*.5,1.03,led);
  if(type!=='root'){deviceLights.push({material:led,phase:deviceLights.length*.61});if(i===0)box(parent,.07,h-.35,.03,-.67,.5+h/2,1.03,led);}
 }
 box(parent,1.88,.12,1.79,0,.6+h,0,trim);
 if(type==='root'||type==='subca'){
  const seal=new THREE.Mesh(new THREE.TorusGeometry(.3,.07,8,28),trim);seal.position.set(0,3.35,1.02);parent.add(seal);
 }
}
function laptop(parent,x,z,color,scale=1){
 const group=new THREE.Group();group.position.set(x,.65,z);group.scale.setScalar(scale);parent.add(group);
 box(group,1.13,.1,.77,0,0,.16,material('#506783'));
 const monitor=box(group,1.15,.78,.075,0,.4,-.17,material('#283950'));monitor.rotation.x=-.08;
 const screen=box(group,.99,.62,.025,0,.41,-.12,new THREE.MeshBasicMaterial({color}));screen.rotation.x=-.08;
 screenLights.push({material:screen.material,base:new THREE.Color(color),phase:screenLights.length*.22});
 box(group,.6,.025,.25,0,.064,.3,material('#253851'));
}
function addSystem(node,zone,index){
 const g=new THREE.Group();const spacing=zone.id==='maintenance'?4.3:3.8;let x=0,z=0;
 if(zone.ids.length>1){x=index%2?spacing:-spacing;z=index<2?-2.6:3.4;}
 if(zone.ids.length===3&&index===2)x=0;
 g.position.set(zone.x+x,.65,zone.z+z);model.add(g);
 if(node.id==='workstations'){
  for(let i=0;i<50;i++)laptop(g,(i%10-4.5)*.96,(Math.floor(i/10)-2)*1.14,colors.users,.72);
 }else if(node.id==='jump'){
  box(g,4,.3,3.2,0,.3,0,material('#26364b'));laptop(g,0,0,colors.admin,2.2);
 }else server(g,colors[node.zone],node.id);
 const subtitle=node.id==='root'?'OFFLINE · NON-DOMAIN JOINED':node.id==='workstations'?'50 devices · one selectable group':node.role;
 const name=label(node.name,subtitle,colors[node.zone],node.id==='workstations'?10:7.3);
 name.position.set(0,node.id==='workstations'?3.2:5.05,0);g.add(name);name.userData.id=node.id;pickables.push(name);
 const hit=new THREE.Mesh(new THREE.BoxGeometry(node.id==='workstations'?10.6:3.4,node.id==='workstations'?2:4.3,node.id==='workstations'?7:3),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.y=2;hit.userData.id=node.id;g.add(hit);pickables.push(hit);
 objects.set(node.id,{node,group:g,label:name});
}
function createScene(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#090f1c');
 glowTexture=makeGlowTexture();
 camera=new THREE.PerspectiveCamera(42,1,.1,500);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive 3D network. Drag to orbit, scroll to zoom, click a system. Arrow keys rotate; Home resets.');renderer.domElement.setAttribute('role','img');$('viewport').prepend(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').innerHTML='<strong>3D graphics paused</strong><p>The browser lost its graphics context. Reload this page to restore the scene. The system selector and security notes remain available.</p>';});
 orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=!reduced;orbit.dampingFactor=.08;orbit.minDistance=11;orbit.maxDistance=220;orbit.maxPolarAngle=Math.PI*.475;orbit.minPolarAngle=.06;orbit.autoRotateSpeed=.45;
 orbit.addEventListener('start',()=>{transition=null;stopTour();stopCameraDrift();$('spin').setAttribute('aria-pressed','false');});
 scene.add(new THREE.HemisphereLight('#c8deff','#162137',2.2));
 const light=new THREE.DirectionalLight('#e5efff',3.3);light.position.set(-25,50,25);scene.add(light);
 const rim=new THREE.DirectionalLight('#7197ff',2.1);rim.position.set(25,15,-30);scene.add(rim);
 model=new THREE.Group();scene.add(model);
 const grid=new THREE.GridHelper(160,80,'#253955','#17263b');grid.position.y=-.16;grid.material.transparent=true;grid.material.opacity=.65;scene.add(grid);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(500,500),material('#091322',{roughness:.95,metalness:.05}));floor.rotation.x=-Math.PI/2;floor.position.y=-.25;scene.add(floor);
 for(const zone of layout){
  const group=new THREE.Group();model.add(group);zoneGroups.push({zone,group});
  const platform=box(group,zone.w,.6,zone.d,zone.x,.15,zone.z,material('#16263d'));
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(platform.geometry),new THREE.LineBasicMaterial({color:colors[zone.id],transparent:true,opacity:.65}));edge.position.copy(platform.position);group.add(edge);
  const band=box(group,zone.w,.04,.07,zone.x,.48,zone.z+zone.d/2-.15,new THREE.MeshBasicMaterial({color:colors[zone.id]}));
  const title=floorLabel(zone.name,colors[zone.id],zone.w-1);title.position.set(zone.x,.49,zone.z+zone.d/2-1.1);group.add(title);
  if(zone.id!=='offline'){
   const halo=new THREE.Mesh(new THREE.PlaneGeometry(zone.w+10,zone.d+10),new THREE.MeshBasicMaterial({map:glowTexture,color:colors[zone.id],transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending}));halo.rotation.x=-Math.PI/2;halo.position.set(zone.x,-.08,zone.z);scene.add(halo);
   const lights=[];for(let i=0;i<3;i++){const light=glowSprite(colors[zone.id],2);group.add(light);lights.push(light);}
   platformEffects.push({zone,halo,lights,phase:platformEffects.length*.8});
  }
  for(const [i,id] of zone.ids.entries())addSystem(nodes.find(n=>n.id===id),zone,i);
  if(zone.id==='offline'){
   const path=[new THREE.Vector3(zone.x-zone.w/2-1,.55,zone.z-zone.d/2-1),new THREE.Vector3(zone.x+zone.w/2+1,.55,zone.z-zone.d/2-1),new THREE.Vector3(zone.x+zone.w/2+1,.55,zone.z+zone.d/2+1),new THREE.Vector3(zone.x-zone.w/2-1,.55,zone.z+zone.d/2+1),new THREE.Vector3(zone.x-zone.w/2-1,.55,zone.z-zone.d/2-1)];
   const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),new THREE.LineDashedMaterial({color:colors.offline,dashSize:.35,gapSize:.35,transparent:true,opacity:.7}));outline.computeLineDistances();group.add(outline);
  }
 }
 flowGroup=new THREE.Group();scene.add(flowGroup);
 selectionRing=new THREE.Mesh(new THREE.RingGeometry(1.7,1.82,64),new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide,transparent:true,opacity:.95}));selectionRing.rotation.x=-Math.PI/2;selectionRing.visible=false;scene.add(selectionRing);
 resize();home(false);bindScene();$('loading').hidden=true;showFlows();updateHighlights();setActivityText();
 if(reduced){introTime=5;}else{updateEffects(0);}
 new ResizeObserver(resize).observe($('viewport'));
 let previous=performance.now();renderer.setAnimationLoop(now=>{
  const dt=Math.min((now-previous)/1000,.1);previous=now;
  if(transition){transition.elapsed+=dt;const t=Math.min(transition.elapsed/transition.duration,1),s=t*t*(3-2*t);camera.position.lerpVectors(transition.start,transition.end,s);orbit.target.lerpVectors(transition.from,transition.to,s);if(t===1)transition=null;}
  orbit.autoRotate=$('spin').getAttribute('aria-pressed')==='true'&&motion&&!transition;
  if(cameraDrift&&motion&&!transition&&!orbit.autoRotate){const sphere=new THREE.Spherical().setFromVector3(cameraDrift.offset);sphere.theta+=Math.sin((effectTime-cameraDrift.time)*.22)*.035;sphere.phi+=Math.sin((effectTime-cameraDrift.time)*.16)*.012;camera.position.copy(cameraDrift.target).add(new THREE.Vector3().setFromSpherical(sphere));orbit.target.copy(cameraDrift.target);}
  orbit.update(dt);
  if(motion){updateEffects(dt);if(chapter<0&&demo&&!touring){demoElapsed+=dt;if(demoElapsed>=9){demoElapsed=0;demoIndex=(demoIndex+1)%demoChapters.length;showFlows();updateHighlights();setActivityText();}}}
  if(touring&&motion){tourElapsed+=dt;if(tourElapsed>=12){tourElapsed=0;setChapter((chapter+1)%chapters.length,true);}}
  const progress=touring?tourElapsed/12:chapter<0&&demo?demoElapsed/9:1;
  $('activityProgress').style.transform=`scaleX(${progress})`;
  renderer.render(scene,camera);
 });
}
function resize(){if(!renderer)return;const el=$('viewport');const width=el.clientWidth,height=el.clientHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);}
function moveCamera(position,target,animate=true,duration=1.8,drift=false){
 if(!renderer)return;
 cameraDrift=drift?{offset:position.clone().sub(target),target:target.clone(),time:effectTime+(animate&&motion?duration:0)}:null;
 if(!animate||!motion){camera.position.copy(position);orbit.target.copy(target);orbit.update();transition=null;return;}
 transition={start:camera.position.clone(),end:position.clone(),from:orbit.target.clone(),to:target.clone(),elapsed:0,duration};
}
function home(animate=true){
 if(!renderer)return;topView=false;$('top').setAttribute('aria-pressed','false');
 const target=new THREE.Vector3(2,1.5,2),direction=new THREE.Vector3(.13,.86,1).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(21));let distance=50;
 for(const zone of layout)for(const x of [zone.x-zone.w/2-1,zone.x+zone.w/2+1])for(const y of [0,7])for(const z of [zone.z-zone.d/2-1,zone.z+zone.d/2+1]){const p=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tan+p.dot(direction));}
 moveCamera(target.clone().addScaledVector(direction,Math.min(distance*1.055,210)),target,animate,2,chapter<0&&demo);
}
function chapterCamera(c,animate=true){
 if(!renderer||!c){home(animate);return;}
 topView=false;$('top').setAttribute('aria-pressed','false');
 const bounds=new THREE.Box3();for(const id of c.nodes){const p=objects.get(id).group.position;bounds.expandByPoint(new THREE.Vector3(p.x-6,0,p.z-4));bounds.expandByPoint(new THREE.Vector3(p.x+6,8,p.z+5));}
 const target=bounds.getCenter(new THREE.Vector3()),directions=[.11,-.18,.22,-.2,.15,-.16,.28,.1];
 const direction=new THREE.Vector3(directions[chapter]||.13,.88,1).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
 const tan=Math.tan(THREE.MathUtils.degToRad(21));let distance=24;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,Math.abs(p.dot(right))/(tan*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tan+p.dot(direction));}
 moveCamera(target.clone().addScaledVector(direction,Math.min(distance*1.12,210)),target,animate,2.8,true);
}
function focus(id,animate=true){if(!renderer)return;const o=objects.get(id);if(!o)return;const target=o.group.position.clone().add(new THREE.Vector3(0,1.5,0));const distance=Math.max(id==='workstations'?22:17,12/camera.aspect);const direction=camera.position.clone().sub(orbit.target).normalize();direction.y=Math.max(.45,direction.y);direction.normalize();moveCamera(target.clone().addScaledVector(direction,distance),target,animate);}
function bindScene(){
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 const pick=(event)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables,false).find(hit=>hit.object.visible)?.object.userData.id;};
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
 renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6&&performance.now()-down.time<700){const id=pick(e);if(id)selectSystem(id); }down=null;});
 renderer.domElement.addEventListener('pointermove',e=>{renderer.domElement.style.cursor=pick(e)?'pointer':'grab';});
 renderer.domElement.addEventListener('keydown',e=>{
  const offset=camera.position.clone().sub(orbit.target),sphere=new THREE.Spherical().setFromVector3(offset);
  if(e.key==='ArrowLeft')sphere.theta-=.12;else if(e.key==='ArrowRight')sphere.theta+=.12;else if(e.key==='ArrowUp')sphere.phi=Math.max(.08,sphere.phi-.1);else if(e.key==='ArrowDown')sphere.phi=Math.min(Math.PI*.47,sphere.phi+.1);else if(e.key==='+'||e.key==='=')sphere.radius=Math.max(11,sphere.radius*.87);else if(e.key==='-')sphere.radius=Math.min(220,sphere.radius*1.15);else if(e.key==='Home'){home();e.preventDefault();return;}else return;
  e.preventDefault();stopTour();stopCameraDrift();transition=null;camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(sphere));orbit.update();
 });
}
function clearFlows(){
 particles.length=0;endpointRings.length=0;if(!flowGroup)return;
 while(flowGroup.children.length){const item=flowGroup.children[0];flowGroup.remove(item);item.traverse(o=>{o.geometry?.dispose();if(o.material){if(o.material.map!==glowTexture)o.material.map?.dispose();o.material.dispose();}});}
}
function showFlows(){
 clearFlows();const c=activeChapter();if(!c||!flowGroup)return;
 const color=flowColors[c.kind];
 for(const [index,[a,b,title]] of c.edges.entries()){
  if(a==='root'||b==='root')throw new Error('Offline root cannot have live edges');
  const from=objects.get(a).group.position.clone().add(new THREE.Vector3(0,2.5,0)),to=objects.get(b).group.position.clone().add(new THREE.Vector3(0,2.5,0));
  const middle=from.clone().lerp(to,.5);middle.y+=Math.min(7,from.distanceTo(to)*.2)+index*.35;
  const curve=new THREE.QuadraticBezierCurve3(from,middle,to);
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.07,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.88}));tube.userData={source:a,target:b,label:title};flowGroup.add(tube);
  const sheath=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.2,6,false),glowMaterial(color,.14));flowGroup.add(sheath);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.21,.62,8),new THREE.MeshBasicMaterial({color}));arrow.position.copy(curve.getPoint(.83));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(.83).normalize());flowGroup.add(arrow);
  for(let i=0;i<3;i++){
   const pulse=new THREE.Mesh(new THREE.ConeGeometry(.16,.48,8),new THREE.MeshBasicMaterial({color:'#eaf8ff',transparent:true}));flowGroup.add(pulse);
   const glow=glowSprite(color,1.7);flowGroup.add(glow);const trail=[];
   for(let j=0;j<6;j++){const tail=new THREE.Mesh(new THREE.SphereGeometry(.14-j*.012,6,5),glowMaterial(color,.5-j*.065));trail.push(tail);flowGroup.add(tail);}
   const particle={mesh:pulse,curve,t:i/3,glow,trail,speed:Math.min(.2,5/curve.getLength())};particles.push(particle);pulse.position.copy(curve.getPointAt(i/3));glow.position.copy(pulse.position);
  }
  for(const [j,id] of [a,b].entries()){const point=objects.get(id).group.position;const ring=new THREE.Mesh(new THREE.RingGeometry(.8,.9,48),glowMaterial(color,.35));ring.rotation.x=-Math.PI/2;ring.position.set(point.x,.72,point.z);flowGroup.add(ring);endpointRings.push({mesh:ring,phase:index*.2+j*.5});}
 }
 updateEffects(0);
}
function updateHighlights(){
 if(!renderer)return;const active=chapter>=0?chapters[chapter]?.nodes:null;
 for(const [id,o] of objects){const included=!active||active.includes(id)||id===selected;const color=colors[o.node.zone];o.group.traverse(child=>{
  if(child.material&&child!==o.label&&child.material.opacity!==0&&!child.material.userData.animatedLight){if(child.material.isMeshStandardMaterial){child.material.emissive.set(included?color:'#000000');child.material.emissiveIntensity=id===selected?.16:included?.025:0;}}
 });o.label.material.opacity=included?1:.25;}
 for(const {zone,group} of zoneGroups)group.children.forEach(c=>{if(c.material?.isLineBasicMaterial)c.material.opacity=!active||zone.ids.some(id=>active.includes(id))?.75:.2;});
 if(selected){const p=objects.get(selected).group.position;selectionRing.position.set(p.x,.71,p.z);selectionRing.scale.setScalar(selected==='workstations'?3.4:1.35);selectionRing.material.color.set(colors[objects.get(selected).node.zone]);selectionRing.visible=true;}else selectionRing.visible=false;
}
function renderDetails(){
 const target=$('sidebar'),node=nodes.find(n=>n.id===selected);
 if(!node){target.innerHTML=`<div class="eyebrow">Supplied inventory</div><h2>Explore the environment</h2><p>Choose a system in the scene or below. Use the chapters to explore proposed relationships.</p><div class="counts"><div><strong>16</strong><span>named systems</span></div><div><strong>50</strong><span>Windows 11 workstations</span></div></div><div class="node-list">${nodes.map(n=>`<button data-select="${n.id}" style="--color:${colors[n.zone]}">${esc(n.name)}</button>`).join('')}</div><p class="scope-note">Educational model · NIST baseline unselected. Platforms are proposed functional groupings; connectivity and enforcement are not verified.</p>`;target.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>selectSystem(b.dataset.select));return;}
 target.innerHTML=`<div class="eyebrow">Selected system</div><h2>${esc(node.name)}</h2><div class="role">${esc(node.role)}</div><span class="status ${node.id==='root'?'offline':''}">${node.id==='root'?'OFFLINE · NO LIVE NETWORK CONNECTION':'ROLE SUPPLIED · CONFIGURATION UNVERIFIED'}</span><p>${esc(node.known)}</p><button class="focus" id="focusSystem">Focus this system</button><h3>Recommended practices</h3><ul>${node.design.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><h3>Illustrative NIST mappings</h3>${node.controls.map(id=>`<details class="control"><summary><b>${id}</b> · ${esc(controlNotes[id][0])}</summary><p>${esc(controlNotes[id][1])}</p></details>`).join('')}<h3>Evidence to collect</h3><ul>${node.evidence.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p class="scope-note">Control applicability depends on a selected and tailored baseline. This visualization does not establish implementation or compliance.</p>`;
 $('focusSystem').onclick=()=>{stopTour();focus(node.id);if(innerWidth<=780)$('viewport').scrollIntoView({behavior:motion?'smooth':'instant',block:'start'});};
}
function selectSystem(id){selected=id;$('system').value=id;renderDetails();updateHighlights();$('announce').textContent=id?`Selected ${nodes.find(n=>n.id===id).name}. Security details updated.`:'All systems shown.';}
function setChapter(index,fromTour=false){
 chapter=index;$('chapter').value=index<0?'overview':chapters[index].id;
 const c=chapters[index];
 if(!fromTour)stopTour();
 $('chapterNumber').textContent=index<0?'00 / INVENTORY':`${String(index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')} CHAPTERS`;
 $('chapterTitle').textContent=c?.title||'Your network, in three dimensions';
 $('chapterText').textContent=c?.text||'The demo cycles through proposed relationships. Glowing trails show logical direction; device lights and platform effects are decorative. Choose a chapter for a closer look. Platforms are functional groupings, not verified VLANs.';
 $('chapterTags').textContent=c?`${c.tags} · ${c.edges.length} illustrative relationship${c.edges.length===1?'':'s'} · ${c.edges.length?'Logical direction shown; confirm protocols and initiation.':'No live paths assumed.'}`:'Select a device to explore its security practices and NIST mappings.';
 $('sceneTitle').textContent=c?`SBD / ${shortTitles[index].toUpperCase()}`:'SBD / INSIDE THE NETWORK';
 $('sceneSubtitle').textContent=c?'Illustrative relationships · implementation unverified':'66 assets · proposed functional groupings';
 showFlows();selectSystem(c?.selected||'');if(c)chapterCamera(c);else home();setActivityText();
 $('announce').textContent=c?`${c.title}. ${c.edges.length} illustrative relationships.`:'Full network inventory.';
}
function stopTour(){touring=false;tourElapsed=0;$('tour').setAttribute('aria-pressed','false');$('tour').textContent='Play tour';}
function setMotion(on){motion=on;$('motion').setAttribute('aria-pressed',String(on));$('motion').textContent=on?'Motion on':'Motion off';if(orbit)orbit.enableDamping=on&&!reduced;if(!on){stopTour();transition=null;introTime=5;if(renderer&&selectionRing)updateEffects(0);}setActivityText();}
function presentation(on){document.body.classList.toggle('video-mode',on);requestAnimationFrame(()=>{resize();if(chapter>=0)chapterCamera(chapters[chapter],false);else home(false);});if(on)toast('Presentation view · Esc to exit');}
function exportFrame(){
 if(!renderer){toast('3D graphics are unavailable in this browser.');return;}
 $('export').disabled=true;
 try{
  const w=3840,h=2160,oldRatio=renderer.getPixelRatio(),oldAspect=camera.aspect,size=renderer.getSize(new THREE.Vector2());
  renderer.setPixelRatio(1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');ctx.drawImage(renderer.domElement,0,0);
  renderer.setPixelRatio(oldRatio);renderer.setSize(size.x,size.y,false);camera.aspect=oldAspect;camera.updateProjectionMatrix();renderer.render(scene,camera);
  const gradient=ctx.createLinearGradient(0,0,0,300);gradient.addColorStop(0,'rgba(7,13,25,.98)');gradient.addColorStop(1,'rgba(7,13,25,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,300);
  ctx.fillStyle='#eaf1ff';ctx.font='600 56px Segoe UI,Arial';ctx.fillText($('sceneTitle').textContent,100,112,3600);ctx.fillStyle='#a8b9d4';ctx.font='31px Segoe UI,Arial';ctx.fillText(`16 named systems + 50 Windows 11 workstations  |  ${activeChapter()?$('activityTitle').textContent+' · illustrative flows':'Educational example'}`,100,170);
  ctx.fillStyle='rgba(7,13,25,.9)';ctx.fillRect(0,h-155,w,155);ctx.fillStyle='#b7c7df';ctx.font='29px Segoe UI,Arial';ctx.fillText('Proposed groupings and logical relationships. NIST mappings are illustrative; no compliance determination.',100,h-90);
  ctx.fillStyle='#f0c684';ctx.fillText('Offline root CA: no live network connection. Geometry is illustrative, not a physical floor plan.',100,h-43);
  const url=cv.toDataURL('image/png');$('download').href=url;$('exportImage').src=url;$('exportDialog').showModal();
 }catch(error){toast('Export could not complete. Try a browser with WebGL 2 support.');console.error(error);resize();}
 finally{$('export').disabled=false;}
}
$('chapter').onchange=e=>setChapter(chapters.findIndex(c=>c.id===e.target.value));
$('system').onchange=e=>{stopTour();selectSystem(e.target.value);};
$('prev').onclick=()=>setChapter(chapter<=-1?chapters.length-1:chapter-1);
$('next').onclick=()=>setChapter(chapter>=chapters.length-1?-1:chapter+1);
$('reset').onclick=()=>{stopTour();home();};
$('zoomIn').onclick=()=>{if(!renderer)return;stopTour();stopCameraDrift();transition=null;camera.position.sub(orbit.target).multiplyScalar(.85).clampLength(11,220).add(orbit.target);orbit.update();};
$('zoomOut').onclick=()=>{if(!renderer)return;stopTour();stopCameraDrift();transition=null;camera.position.sub(orbit.target).multiplyScalar(1.18).clampLength(11,220).add(orbit.target);orbit.update();};
$('top').onclick=()=>{if(!renderer)return;stopTour();topView=!topView;$('top').setAttribute('aria-pressed',String(topView));if(!topView){home();return;}const target=new THREE.Vector3(1.5,0,1.5);const d=Math.max(66,35/(camera.aspect*Math.tan(THREE.MathUtils.degToRad(21))));moveCamera(target.clone().add(new THREE.Vector3(0,Math.min(d,200),.6)),target);};
$('spin').onclick=()=>{const active=$('spin').getAttribute('aria-pressed')!=='true';$('spin').setAttribute('aria-pressed',String(active));stopCameraDrift();if(active)setMotion(true);};
$('demo').onclick=()=>{demo=!demo;demoElapsed=0;showFlows();updateHighlights();setActivityText();if(chapter<0)home();};
$('motion').onclick=()=>setMotion(!motion);
$('tour').onclick=()=>{if(touring){stopTour();stopCameraDrift();return;}setMotion(true);touring=true;tourElapsed=0;$('tour').setAttribute('aria-pressed','true');$('tour').textContent='Pause tour';if(chapter<0)setChapter(0,true);else chapterCamera(chapters[chapter]);};
$('presentation').onclick=()=>{presentation(true);document.documentElement.requestFullscreen?.().catch(()=>{});};
$('exitPresentation').onclick=()=>{presentation(false);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)presentation(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('video-mode'))presentation(false);});
$('scope').onclick=()=>$('scopeDialog').showModal();$('closeScope').onclick=()=>$('scopeDialog').close();
$('export').onclick=exportFrame;$('closeExport').onclick=()=>$('exportDialog').close();
setMotion(!reduced);renderDetails();
try{createScene();}catch(error){console.error(error);$('loading').innerHTML='<strong>3D graphics unavailable</strong><p>This model requires a browser with WebGL 2 and hardware acceleration. You can still select every system and read its security notes below or in the side panel.</p>';['demo','tour','spin','motion','export','zoomIn','zoomOut','reset','top','presentation'].forEach(id=>$(id).disabled=true);}

// Let the website fit the stacked mobile layout without nested scrolling.
let heightFrame;
const reportHeight=()=>{cancelAnimationFrame(heightFrame);heightFrame=requestAnimationFrame(()=>{
 if(window.parent!==window)window.parent.postMessage({type:'sbd-network-height',height:Math.ceil(document.body.getBoundingClientRect().height),mobile:matchMedia('(max-width:780px)').matches},window.location.origin);
});};
new ResizeObserver(reportHeight).observe(document.body);
window.addEventListener('resize',reportHeight);
reportHeight();
