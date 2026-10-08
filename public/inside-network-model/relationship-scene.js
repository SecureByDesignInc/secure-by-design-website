import * as THREE from 'three';
import {relationshipModel} from './relationship-model.js';

/** A deliberately small, fixed-camera scene: the room remains the main view. */
export function createRelationshipView(root,{onSelect,onMotion,motion=true}){
 const $=selector=>root.querySelector(selector),viewport=$('[data-relationship-viewport]');
 let renderer,model,content,frame=0,last=0,time=0,visible=true,disposed=false,lost=false;
 let pickables=[],halos=[],particles=[];
 const scene=new THREE.Scene();scene.background=new THREE.Color('#0a1b2b');
 const camera=new THREE.OrthographicCamera(-5,5,3.5,-3.5,.1,100);
 camera.position.set(0,9,13);camera.lookAt(0,.2,.5);
 scene.add(new THREE.HemisphereLight('#d7efff','#263646',2.6));
 const key=new THREE.DirectionalLight('#d7eaff',3);key.position.set(-4,8,7);scene.add(key);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const pause=$('[data-relationship-motion]');pause.onclick=()=>onMotion(!motion);
 const fallback=message=>{$('[data-relationship-fallback]').hidden=false;$('[data-relationship-fallback]').textContent=message;viewport.classList.add('is-unavailable');};
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor('#0a1b2b');
  renderer.domElement.setAttribute('aria-hidden','true');
  viewport.prepend(renderer.domElement);
 }catch{fallback('Explore the relationships below. 3D requires WebGL 2.');}
 const material=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.68,metalness:.24,...options});
 function box(parent,w,h,d,x,y,z,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function label(parent,text,color){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=64;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#0a1b2bee';ctx.fillRect(0,0,320,64);ctx.font='600 25px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,160,33,304);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.position.y=1.5;sprite.scale.set(2,.4,1);sprite.renderOrder=2;parent.add(sprite);
 }
 function equipment(n,index,position){
  const group=new THREE.Group();group.position.copy(position);group.userData.action=n.action;content.add(group);
  box(group,1.2,.09,.9,0,.04,0,'#273e50');
  const c=n.color;
  if(n.type==='server'||n.type==='offline'){
   box(group,.72,1.03,.6,0,.59,0,'#33485c');box(group,.61,.89,.035,0,.61,.318,'#172938');
   for(let row=0;row<4;row++){box(group,.47,.09,.04,0,.3+row*.18,.35,'#456075');box(group,.05,.035,.02,.17,.3+row*.18,.38,c);}
   if(n.type==='offline')box(group,.76,.06,.65,0,1.12,0,c);
  }else if(n.type==='desktop'){
   box(group,.91,.57,.12,0,.8,0,'#40576b');box(group,.8,.44,.025,0,.81,.074,c);box(group,.09,.3,.1,0,.4,0,'#7895aa');box(group,.46,.04,.34,0,.24,0,'#40576b');box(group,.69,.045,.24,0,.16,.29,'#7c94a4');
  }else if(n.type==='switch'||n.type==='segment'){
   for(let row=0;row<2;row++){box(group,1,.22,.61,0,.24+row*.31,0,'#3f586b');for(let port=0;port<6;port++)box(group,.095,.075,.04,-.37+port*.145,.24+row*.31,.33,c);}
  }else if(n.type==='media'){
   box(group,.51,.68,.3,0,.47,0,c);box(group,.34,.23,.21,0,.91,0,'#b7c4cb');box(group,.25,.05,.025,0,.54,.16,'#344b60');
  }else if(n.type==='operator'){
   const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),material(c));head.position.y=.96;group.add(head);
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.18,.31,.53,12),material('#61788b'));body.position.y=.49;group.add(body);
  }else if(n.type==='shield'){
   const shape=new THREE.Shape();shape.moveTo(-.45,.42);shape.lineTo(0,.57);shape.lineTo(.45,.42);shape.lineTo(.38,-.13);shape.lineTo(0,-.44);shape.lineTo(-.38,-.13);shape.closePath();
   const shield=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.025}),material(c));shield.position.set(0,.63,0);group.add(shield);
  }else{
   box(group,.6,.84,.15,0,.54,0,c);for(let row=0;row<3;row++)box(group,.36,.025,.02,0,.43+row*.15,.09,'#345365');
  }
  const halo=new THREE.Mesh(new THREE.RingGeometry(.65,.7,40),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.11;group.add(halo);halos.push(halo);
  label(group,`${index+1} · ${n.short}`,c);
  if(n.action)group.traverse(object=>{if(object.isMesh){object.userData.action=n.action;pickables.push(object);}});
  return group.position;
 }
 function positions(){
  const count=model.nodes.length;
  if(model.layout==='flow'||model.layout==='process')return model.nodes.map((_,i)=>new THREE.Vector3((i-(count-1)/2)*2.1,0,.7));
  const members=count-1,cols=Math.min(members,4),rows=Math.ceil(members/Math.max(1,cols));
  return model.nodes.map((_,i)=>i===0?new THREE.Vector3(0,0,-2):new THREE.Vector3(((i-1)%cols-(Math.min(cols,members-Math.floor((i-1)/cols)*cols)-1)/2)*2.15,0,.3+Math.floor((i-1)/cols)*2.15-(rows>2?.2:0)));
 }
 function drawEdge(e,from,to){
  let a=from.clone().add(new THREE.Vector3(0,.26,0)),b=to.clone().add(new THREE.Vector3(0,.26,0));
  const self=e.from===e.to,mid=a.clone().lerp(b,.5);mid.y=self?1.8:.6;if(self){a.x-=.55;b.x+=.55;}
  const curve=new THREE.QuadraticBezierCurve3(a,mid,b),blocked=e.kind==='deny'||e.kind==='pending';
  const points=Array.from({length:49},(_,i)=>curve.getPoint(i/48*(blocked?.46:1)));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:e.color,dashSize:e.kind==='traffic'?1:.11,gapSize:e.kind==='traffic'?0:.09,transparent:true,opacity:.62}));line.computeLineDistances();content.add(line);
  if(blocked){
   const gate=new THREE.Group();gate.position.copy(curve.getPoint(.5));content.add(gate);box(gate,.085,.66,.12,0,.13,0,e.color);box(gate,.52,.085,.12,0,.13,0,e.color);
  }
  if(e.kind==='traffic'){
   const dot=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:e.color}));dot.position.copy(curve.getPoint(.25));content.add(dot);particles.push({dot,curve});
  }
 }
 function disposeContent(){
  if(!content)return;const geometries=new Set(),materials=new Set(),textures=new Set();
  content.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const m of Array.isArray(object.material)?object.material:object.material?[object.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}});
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());scene.remove(content);content=null;pickables=[];halos=[];particles=[];
 }
 function draw(){if(renderer&&!lost&&viewport.clientWidth>0)renderer.render(scene,camera);}
 function animate(now){
  frame=0;if(disposed||!motion||!visible||document.hidden||lost)return;
  time+=last?Math.min((now-last)/1000,.05):0;last=now;
  if(document.querySelector('dialog[open]')){frame=requestAnimationFrame(animate);return;}
  // With no traffic to show, hold the halos steady and stop drawing until something changes (saves battery).
  if(!particles.length&&!model?.edges.some(e=>e.kind==='manual')){halos.forEach(halo=>{halo.material.opacity=.24;});draw();return;}
  particles.forEach(({dot,curve},i)=>dot.position.copy(curve.getPoint((time*.22+i*.3)%1)));
  const manual=model?.edges.some(e=>e.kind==='manual');
  halos.forEach((halo,i)=>{halo.material.opacity=manual?(.18+(Math.floor(time/1.8)%halos.length===i?.28:0)):.24+Math.sin(time*1.4-i*.6)*.055;});
  draw();frame=requestAnimationFrame(animate);
 }
 function wake(){last=0;if(!frame&&renderer&&motion&&visible&&!document.hidden&&!lost&&!disposed)frame=requestAnimationFrame(animate);}
 function resize(){
  if(!renderer||disposed)return;const width=viewport.clientWidth,height=viewport.clientHeight;if(!width||!height)return;
  renderer.setSize(width,height,false);const aspect=width/height,half=Math.max(3.6,4.6/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();draw();wake();
 }
 function setMotion(on){motion=on;pause.textContent=on?'Pause':'Play';pause.setAttribute('aria-label',on?'Pause network motion':'Play network motion');pause.setAttribute('aria-pressed',String(on));if(!on){cancelAnimationFrame(frame);frame=0;}else wake();draw();}
 function show(context){
  model=relationshipModel(context);time=0;
  $('[data-relationship-title]').textContent=model.title;$('[data-relationship-caption]').textContent=model.caption;$('[data-relationship-legend]').textContent=model.legend;
  const links=$('[data-relationship-links]');links.replaceChildren();
  model.nodes.forEach((n,i)=>{
   const el=document.createElement(n.action?'button':'span');el.className='relationship-node';el.style.setProperty('--node-color',n.color);
   const number=document.createElement('b');number.textContent=String(i+1);const text=document.createElement('span');text.textContent=n.label;el.append(number,text);
   if(n.action){el.type='button';el.onclick=()=>{onSelect(n.action);$('[data-relationship-title]').focus({preventScroll:true});};}
   links.append(el);
  });
  const description=$('[data-relationship-description]');description.textContent=model.edges.map(e=>`${model.nodes.find(n=>n.key===e.from).label} to ${model.nodes.find(n=>n.key===e.to).label}: ${e.label}; ${e.kind==='association'?'association':e.kind==='traffic'?'permitted service request':e.kind==='manual'?'manual process':e.kind==='pending'?'blocked pending validation':e.kind==='failed'?'permitted, but the connection fails':'denied'}.`).join(' ');
  if(!renderer)return;
  disposeContent();content=new THREE.Group();scene.add(content);
  const grid=new THREE.GridHelper(11,16,'#254457','#163244');grid.position.y=-.02;content.add(grid);
  const locations=positions(),lookup=new Map(model.nodes.map((n,i)=>[n.key,equipment(n,i,locations[i])]));
  model.edges.forEach(e=>drawEdge(e,lookup.get(e.from),lookup.get(e.to)));resize();
 }
 function hit(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables,false)[0]?.object.userData.action;}
 function select(event){const action=hit(event);if(action)onSelect(action);}
 function hover(event){renderer.domElement.style.cursor=hit(event)?'pointer':'default';}
 function contextLost(event){event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;fallback('The 3D view is paused. All relationships remain available below.');}
 function contextRestored(){lost=false;viewport.classList.remove('is-unavailable');$('[data-relationship-fallback]').hidden=true;resize();}
 renderer?.domElement.addEventListener('click',select);renderer?.domElement.addEventListener('pointermove',hover);
 renderer?.domElement.addEventListener('webglcontextlost',contextLost);renderer?.domElement.addEventListener('webglcontextrestored',contextRestored);
 const observer=new ResizeObserver(resize);observer.observe(viewport);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(viewport);
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();};document.addEventListener('visibilitychange',visibility);
 function dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);disposeContent();renderer?.dispose();renderer?.domElement.remove();}
 setMotion(motion);
 return {show,setMotion,resize,dispose};
}
