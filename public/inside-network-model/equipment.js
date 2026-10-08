import * as THREE from 'three';

// Locally modeled, unbranded equipment. No remote models or texture requests.
export function createEquipment(lights) {
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const metal = new THREE.MeshStandardMaterial({color:'#46505b',metalness:.75,roughness:.38});
  const black = new THREE.MeshStandardMaterial({color:'#141a20',metalness:.5,roughness:.5});
  const silver = new THREE.MeshStandardMaterial({color:'#b8bec5',metalness:.8,roughness:.32});
  const recess = new THREE.MeshStandardMaterial({color:'#05090d',roughness:.9});
  const rubber = new THREE.MeshStandardMaterial({color:'#242b30',roughness:.95});
  const white = new THREE.MeshStandardMaterial({color:'#b5c0c8',metalness:.15,roughness:.65});
  const led = color => new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.6});

  function box(parent,w,h,d,x,y,z,material=metal) {
    const mesh = new THREE.Mesh(unit,material);
    mesh.scale.set(w,h,d); mesh.position.set(x,y,z);
    mesh.castShadow = w*h*d > .08; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function repeated(parent, positions, size, material) {
    const mesh = new THREE.InstancedMesh(unit,material,positions.length);
    const matrix = new THREE.Matrix4(),scale = new THREE.Vector3(...size);
    positions.forEach((p,i)=>{matrix.compose(new THREE.Vector3(...p),new THREE.Quaternion(),scale);mesh.setMatrixAt(i,matrix);});
    parent.add(mesh); return mesh;
  }
  function plate(parent,title,width,x,y,z,{color='#dce6ed',background='#17212b',height=.45}={}) {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,768,96);
    ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 48px Segoe UI,Arial';ctx.fillText(title,384,49,730);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture}));
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  // Simple role icons for server faceplates, drawn locally (no image requests).
  const iconTextures=new Map();
  const roles={dc1:'directory',dc2:'directory',dhcp:'address',syslog:'logs',wsus:'updates',time:'clock',subca:'certificate',templates:'certificate',fs:'folder',sql:'database',apps:'key',web:'web',splunk:'search',nessus:'scan',epo:'shield',audit:'archive',management:'gear',repo:'package',root:'key',workstations:'desktop',jump:'admin',jump1:'admin',jump2:'admin',core:'router',media:'media',backup:'archive'};
  function drawIcon(ctx,role,color){
    ctx.strokeStyle='#e8f6ff';ctx.fillStyle='#e8f6ff';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';
    const line=(...p)=>{ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i],p[i+1]);ctx.stroke();};
    const rect=(x,y,w,h,r=6)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.stroke();};
    const circle=(x,y,r,fill=false)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);fill?ctx.fill():ctx.stroke();};
    switch(role){
      case 'directory':rect(46,22,36,24);rect(18,82,32,22);rect(78,82,32,22);line(64,46,64,64,34,64,34,82);line(64,64,94,64,94,82);break;
      case 'address':ctx.beginPath();ctx.moveTo(20,40);ctx.lineTo(78,40);ctx.lineTo(108,64);ctx.lineTo(78,88);ctx.lineTo(20,88);ctx.closePath();ctx.stroke();ctx.font='700 30px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('IP',54,65);break;
      case 'logs':rect(28,18,72,92);for(const y of [42,62,82]){circle(44,y,4,true);line(56,y,86,y);}break;
      case 'updates':line(64,18,64,78);line(42,56,64,78,86,56);line(22,84,22,106,106,106,106,84);break;
      case 'clock':circle(64,64,42);line(64,64,64,36);line(64,64,86,76);break;
      case 'certificate':circle(64,52,30);circle(64,52,14);line(48,78,40,112,56,102,64,112);line(80,78,88,112,72,102,64,112);break;
      case 'folder':ctx.beginPath();ctx.moveTo(18,36);ctx.lineTo(52,36);ctx.lineTo(60,46);ctx.lineTo(110,46);ctx.lineTo(110,100);ctx.lineTo(18,100);ctx.closePath();ctx.stroke();break;
      case 'database':ctx.beginPath();ctx.ellipse(64,32,38,12,0,0,Math.PI*2);ctx.stroke();line(26,32,26,96);line(102,32,102,96);ctx.beginPath();ctx.ellipse(64,96,38,12,0,0,Math.PI);ctx.stroke();ctx.beginPath();ctx.ellipse(64,64,38,12,0,0,Math.PI);ctx.stroke();break;
      case 'key':circle(40,64,20);line(60,64,108,64);line(92,64,92,82);line(104,64,104,78);break;
      case 'web':rect(18,24,92,80,8);line(18,44,110,44);circle(32,34,3,true);circle(44,34,3,true);circle(64,74,18);line(46,74,82,74);break;
      case 'search':circle(54,54,30);line(76,76,106,106);break;
      case 'scan':ctx.beginPath();ctx.arc(64,92,62,Math.PI*1.18,Math.PI*1.82);ctx.stroke();ctx.beginPath();ctx.arc(64,92,38,Math.PI*1.2,Math.PI*1.8);ctx.stroke();circle(64,92,8,true);line(64,92,96,46);break;
      case 'shield':ctx.beginPath();ctx.moveTo(64,16);ctx.lineTo(104,30);ctx.lineTo(98,76);ctx.lineTo(64,110);ctx.lineTo(30,76);ctx.lineTo(24,30);ctx.closePath();ctx.stroke();line(48,62,60,76,82,48);break;
      case 'archive':rect(20,26,88,22,4);ctx.beginPath();ctx.moveTo(26,48);ctx.lineTo(26,104);ctx.lineTo(102,104);ctx.lineTo(102,48);ctx.stroke();line(52,66,76,66);break;
      case 'gear':circle(64,64,18);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(64+Math.cos(a)*30,64+Math.sin(a)*30,64+Math.cos(a)*44,64+Math.sin(a)*44);}circle(64,64,31);break;
      case 'desktop':rect(18,24,92,62,6);line(64,86,64,100);line(40,104,88,104);break;
      case 'admin':circle(64,40,18);ctx.beginPath();ctx.moveTo(26,106);ctx.quadraticCurveTo(28,66,64,66);ctx.quadraticCurveTo(100,66,102,106);ctx.stroke();line(84,90,94,100,110,80);break;
      case 'router':circle(64,64,40);line(36,64,92,64);line(80,52,92,64,80,76);line(64,36,64,92);line(52,48,64,36,76,48);break;
      case 'media':rect(40,18,48,92,8);rect(52,30,24,14,3);line(54,92,74,92);break;
      case 'package':ctx.beginPath();ctx.moveTo(64,16);ctx.lineTo(106,38);ctx.lineTo(106,88);ctx.lineTo(64,110);ctx.lineTo(22,88);ctx.lineTo(22,38);ctx.closePath();ctx.stroke();line(22,38,64,60,106,38);line(64,60,64,110);break;
    }
  }
  function iconTexture(role,color){
    const key=role+color;if(iconTextures.has(key))return iconTextures.get(key);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#0f1b26';ctx.beginPath();ctx.roundRect(2,2,124,124,18);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.stroke();
    drawIcon(ctx,role,color);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;iconTextures.set(key,texture);return texture;
  }
  const roleOf=id=>roles[id]||null;
  function cable(parent,points,color='#3c718c',radius=.035) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,16,radius,5,false),new THREE.MeshStandardMaterial({color,roughness:.8}));
    parent.add(mesh);return mesh;
  }
  function networkSwitch(parent,y,{width=5.6,label='ACCESS SWITCH',ports=24}={}) {
    box(parent,width,.55,4.2,0,y,0,metal);
    box(parent,width-.15,.43,.08,0,y,2.14,black);
    const positions=[];
    for(let i=0;i<ports;i++)positions.push([-(width-.8)/2+(i%12)*(width-.8)/11,y+(i<12?.11:-.11),2.20]);
    repeated(parent,positions,[.27,.14,.045],recess);
    const status=led('#65bc77');
    repeated(parent,positions.filter((_,i)=>i%3===0).map(([x,yy,z])=>[x+.1,yy+.064,z+.03]),[.055,.035,.018],status);
    lights.push({material:status,phase:lights.length*.71});
    plate(parent,label,width-.7,0,y+.47,2.24,{height:.22,color:'#bfd0de'});
  }
  function rack(parent,{code,color='#78a8c3',name='SERVER RACK',switching=true}={}) {
    box(parent,6.9,.3,6.2,0,.22,0,black);
    for(const x of [-3.22,3.22])for(const z of [-2.72,2.72])box(parent,.24,11.75,.24,x,6.23,z,black);
    for(const x of [-3.4,3.4])box(parent,.12,11.8,5.7,x,6.22,0,black);
    box(parent,6.85,.25,6.05,0,12.18,0,black);
    box(parent,6.7,11.7,.1,0,6.2,-2.82,black);
    for(const x of [-2.99,2.99])box(parent,.18,11.1,.16,x,6.2,2.58,silver);
    const holes=[];
    for(const x of [-2.99,2.99])for(let i=0;i<36;i++)holes.push([x,.95+i*.295,2.675]);
    repeated(parent,holes,[.075,.09,.025],recess);
    for(const y of [2,4.2,6.3,8.35,11.65])box(parent,5.85,.44,.11,0,y,2.55,black);
    box(parent,5.85,.65,4.5,0,1.13,0,metal);
    repeated(parent,Array.from({length:15},(_,i)=>[-2.2+i*.315,1.13,2.3]),[.11,.37,.025],recess);
    plate(parent,code+'  /  '+name,6.15,0,12.18,3.07,{height:.4,color});
    box(parent,.045,11.2,.06,-3.27,6.25,2.85,new THREE.MeshStandardMaterial({color,metalness:.5,roughness:.5}));
    if(switching)networkSwitch(parent,10.95);
    // Rear power distribution and a bundled vertical cable run.
    box(parent,.3,10.7,.22,2.87,6.0,-2.55,rubber);
    for(let i=0;i<3;i++)cable(parent,[[2.72-i*.09,11.5,-2.9],[2.72-i*.09,7,-3.05],[2.72-i*.09,1.2,-2.9]],'#313d49',.045);
  }
  function server(parent,node,color,{offline=false}={}) {
    const storage=['fs','sql','audit'].includes(node.id),h=storage?1.04:.8;
    box(parent,5.7,h,4.6,0,0,0,metal);
    box(parent,5.55,h-.09,.1,0,0,2.35,black);
    for(const x of [-2.83,2.83]){
      box(parent,.16,h-.1,.12,x,0,2.44,silver);
      box(parent,.055,.36,.16,x,0,2.55,black);
      for(const y of [-h*.31,h*.31])box(parent,.07,.07,.025,x,y,2.51,recess);
    }
    if(storage){
      const bays=[];for(let i=0;i<12;i++)bays.push([-2.32+(i%6)*.7,i<6?.23:-.23,2.43]);
      repeated(parent,bays,[.62,.34,.08],metal);
      repeated(parent,bays.map(([x,y,z])=>[x-.23,y,z+.055]),[.07,.23,.02],black);
    }else{
      const vents=[];for(let row=0;row<4;row++)for(let i=0;i<22;i++)vents.push([-2.4+i*.18,-.22+row*.14,2.42]);
      repeated(parent,vents,[.075,.06,.025],recess);
    }
    const status=led(offline?'#343b39':'#70c888');
    if(offline)status.emissiveIntensity=0;
    else lights.push({material:status,phase:lights.length*.71});
    box(parent,.11,.11,.035,2.37,.14,2.44,status);
    box(parent,.15,.06,.035,2.37,-.12,2.44,recess);
    plate(parent,node.name,3.3,-.38,.04,2.51,{height:.27,color,background:'#131d26'});
    const role=roleOf(node.id);
    if(role){const icon=new THREE.Mesh(new THREE.PlaneGeometry(.46,.46),new THREE.MeshBasicMaterial({map:iconTexture(role,color)}));icon.position.set(1.74,.04,2.515);parent.add(icon);}
    if(!offline)cable(parent,[[2.65,-.24,-2.35],[3,-.4,-2.7],[3,-1.0,-2.7]],'#52788e');
  }
  function workstation(parent,x=0,z=0,scale=1,color='#6d9dbb') {
    const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
    box(g,3.25,.12,1.65,0,1.5,.12,white);
    for(const xx of [-1.37,1.37])for(const zz of [-.5,.75])box(g,.09,1.47,.09,xx,.72,zz,metal);
    box(g,1.68,1.02,.12,0,2.28,-.35,black);
    box(g,1.5,.82,.024,0,2.28,-.278,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.25,roughness:.4}));
    box(g,.09,.35,.1,0,1.7,-.35,metal);box(g,.6,.045,.32,0,1.59,-.23,black);
    box(g,1.1,.05,.36,-.1,1.6,.43,black);box(g,.17,.06,.24,.76,1.6,.43,rubber);
    box(g,.42,1.06,.92,1.07,.67,0,black);
    const chair=new THREE.Group();chair.position.set(0,0,1.64);g.add(chair);
    box(chair,1,.12,.83,0,.86,0,rubber);box(chair,.96,.9,.12,0,1.29,.35,rubber);
    box(chair,.1,.65,.1,0,.43,0,metal);box(chair,1,.08,.12,0,.1,0,black);
    return g;
  }
  function mediaCabinet(parent,{label='OFFLINE MEDIA',color='#a7c7de'}={}) {
    box(parent,5.4,6.5,3,0,3.55,0,white);
    box(parent,5.1,6.14,.1,0,3.58,1.57,metal);
    for(let i=0;i<5;i++){
      box(parent,4.7,.9,.09,0,1.13+i*1.05,1.65,black);
      box(parent,1.1,.07,.12,0,1.13+i*1.05,1.75,silver);
    }
    plate(parent,label,4.8,0,6.13,1.7,{height:.38,color});
    box(parent,.14,.2,.11,2.15,5.86,1.7,black);
  }
  function room(scene) {
    const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=256;
    const ctx=floorCanvas.getContext('2d');ctx.fillStyle='#73838e';ctx.fillRect(0,0,256,256);
    ctx.fillStyle='#44535f';ctx.fillRect(0,0,256,3);ctx.fillRect(0,0,3,256);
    ctx.fillStyle='#82909a';ctx.fillRect(4,4,248,2);ctx.fillRect(4,4,2,248);
    const texture=new THREE.CanvasTexture(floorCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(25,26);texture.anisotropy=4;
    const floor=new THREE.MeshStandardMaterial({map:texture,roughness:.62,metalness:.15});themed.floor=floor;
    box(scene,64,.65,66,3,-.4,8,floor).userData.floor=true;
    const wall=new THREE.MeshStandardMaterial({color:'#708392',roughness:.75,metalness:.1});themed.wall=wall;
    // Each wall fades as one piece when it stands between the camera and the active equipment.
    const backWall=new THREE.Group();backWall.userData.fadeKey='wall-back';scene.add(backWall);
    box(backWall,64,14,.3,3,6.45,-24.5,wall);
    for(let i=0;i<13;i++)box(backWall,.045,12,.04,-27+i*4.9,6.6,-24.31,metal);
    plate(backWall,'SECURE BY DESIGN  /  DATA CENTER',28,-5,11.5,-24.25,{height:1.02,color:'#dceaf2',background:'#334551'});
    const leftWall=new THREE.Group();leftWall.userData.fadeKey='wall-left';scene.add(leftWall);
    box(leftWall,.3,6.2,65,-29.1,2.6,8,wall);
    // A cutaway ceiling keeps all devices accessible to the orbit camera.
    const strip=new THREE.MeshBasicMaterial({color:'#dfedff'});themed.strip=strip;
    for(const z of [-14,7]){
      box(scene,43,.22,.9,-3,15.5,z,black);
      box(scene,41.5,.06,.62,-3,15.35,z,strip);
      for(const x of [-23,17])box(scene,.06,2.4,.06,x,16.55,z,metal);
    }
    for(const z of [-19,1]){
      for(const x of [-24,15])box(scene,.11,.75,.12,x,13.7,z,metal);
      box(scene,40,.12,.1,-4.5,13.4,z-.65,metal);box(scene,40,.12,.1,-4.5,13.4,z+.65,metal);
      repeated(scene,Array.from({length:32},(_,i)=>[-24+i*1.25,13.38,z]),[.08,.1,1.4],metal);
      for(let i=0;i<3;i++)box(scene,39,.05,.07,-4.5,13.53,z-.3+i*.2,rubber);
    }
    // Cooling cabinet and vented floor tiles are environmental furnishings.
    box(scene,3.1,9,4,-24.2,4.35,-4.3,white);
    repeated(scene,Array.from({length:26},(_,i)=>[-24.2,.45+i*.3,-2.23]),[2.6,.09,.09],black);
    plate(scene,'COOLING',2.6,-24.2,8.16,-2.2,{height:.35});
    const vents=[];for(const x of [-17,-8,1,10])for(let i=0;i<12;i++)vents.push([x,-.045,-6.4+i*.19]);
    repeated(scene,vents,[2.1,.012,.065],black);
    // Low partitions separate the operations/workstation area from rack aisles.
    const glass=new THREE.MeshStandardMaterial({color:'#6c9bab',transparent:true,opacity:.15,roughness:.18,metalness:.05,depthWrite:false});themed.glass=glass;
    for(const x of [-23,-15,-7]){box(scene,7.5,4.4,.065,x,2.08,21,glass);box(scene,.1,4.55,.1,x-3.8,2.13,21,metal);}
    box(scene,24,.08,.1,-15,4.38,21,metal);
    // Offline bay is visually separated and has no network cable tray.
    box(scene,10,.07,.11,24,.02,18,metal);
    plate(scene,'OFFLINE OPERATIONS',10,24,6.8,39.02,{height:.6,color:'#e0c494'});
  }
  // Batched materials get a per-instance fade. Faded instances use screen-door transparency (ordered dither),
  // so racks in front of the active systems become see-through without breaking depth sorting.
  const fadeClones=new Map();
  function fadeMaterial(material){
    if(fadeClones.has(material))return fadeClones.get(material);
    const clone=material.clone();
    clone.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aFade;\nvarying float vSbdFade;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSbdFade=aFade;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSbdFade;\nfloat sbdBayer(vec2 p){ivec2 q=ivec2(mod(p,4.0));int i=q.x+q.y*4;float m[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);return (m[i]+.5)/16.;}').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vSbdFade<.999&&sbdBayer(gl_FragCoord.xy)>=vSbdFade)discard;');
    };
    clone.customProgramCacheKey=()=>'sbd-fade-'+material.uuid;
    fadeClones.set(material,clone);return clone;
  }
  const fadeKeyOf=object=>{for(let o=object;o;o=o.parent)if(o.userData?.fadeKey)return o.userData.fadeKey;return 'room';};
  function batch(scene) {
    // The equipment stays still; batch its repeated metalwork to keep orbiting smooth.
    scene.updateMatrixWorld(true);
    const buckets=new Map(),registry={meshes:[],bounds:new Map(),groups:new Map()};
    scene.traverse(object=>{
      if(object.userData?.fadeKey&&!object.isMesh){if(!registry.groups.has(object.userData.fadeKey))registry.groups.set(object.userData.fadeKey,[]);registry.groups.get(object.userData.fadeKey).push(object);}
      if(!object.isMesh||object.isInstancedMesh||object.geometry!==unit)return;
      if(!buckets.has(object.material))buckets.set(object.material,[]);
      buckets.get(object.material).push(object);
    });
    const corner=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5));
    for(const [material,meshes]of buckets){
      if(meshes.length<2)continue;
      const geometry=unit.clone(),fade=new Float32Array(meshes.length).fill(1),byKey=new Map();
      geometry.setAttribute('aFade',new THREE.InstancedBufferAttribute(fade,1));
      const instances=new THREE.InstancedMesh(geometry,fadeMaterial(material),meshes.length);
      meshes.forEach((mesh,index)=>{
        instances.setMatrixAt(index,mesh.matrixWorld);
        const key=fadeKeyOf(mesh);if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(index);
        if(!registry.bounds.has(key))registry.bounds.set(key,new THREE.Box3());
        registry.bounds.get(key).union(corner.clone().applyMatrix4(mesh.matrixWorld));
      });
      instances.castShadow=meshes.some(mesh=>mesh.castShadow);instances.receiveShadow=true;
      for(const mesh of meshes)mesh.removeFromParent();
      scene.add(instances);registry.meshes.push({mesh:instances,fade,byKey});
    }
    return registry;
  }
  // Fade one equipment group: batched metalwork dithers; remaining decor (plates, ports, cables) hides when mostly faded.
  function setFade(registry,key,value){
    for(const {mesh,fade,byKey} of registry.meshes){const indices=byKey.get(key);if(!indices)continue;for(const i of indices)fade[i]=value;mesh.geometry.attributes.aFade.needsUpdate=true;}
    for(const group of registry.groups.get(key)||[])group.traverse(o=>{if(o!==group&&!o.userData.keepVisible&&(o.isMesh||o.isLine))o.visible=value>.55;});
  }
  // Standard keeps the established look; cinematic darkens the room so traffic and status lights carry the scene.
  const themed={metal,black,silver,rubber,white,recess};
  const themes={
    standard:{floor:'#ffffff',wall:'#708392',strip:'#dfedff',glass:'#6c9bab',white:'#b5c0c8',metal:'#46505b',black:'#141a20',silver:'#b8bec5',rubber:'#242b30',recess:'#05090d'},
    cinematic:{floor:'#3a4954',wall:'#16212b',strip:'#7fdcf0',glass:'#2f5866',white:'#33424e',metal:'#2b343d',black:'#090d12',silver:'#6d7a86',rubber:'#141a1f',recess:'#020406'}
  };
  function setTheme(name){
    const colors=themes[name]||themes.standard;
    for(const [key,material] of Object.entries(themed)){if(!colors[key])continue;material.color.set(colors[key]);fadeClones.get(material)?.color.set(colors[key]);}
  }
  return {box,plate,cable,rack,server,networkSwitch,workstation,mediaCabinet,room,batch,setFade,setTheme,iconTexture,roleOf,materials:{metal,black,silver,rubber}};
}
