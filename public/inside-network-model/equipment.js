import * as THREE from 'three';

// Locally modeled, unbranded equipment. No remote models or texture requests.
export function createEquipment(lights) {
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const metal = new THREE.MeshStandardMaterial({color:'#55606b',metalness:.7,roughness:.38});
  const black = new THREE.MeshStandardMaterial({color:'#1d252d',metalness:.45,roughness:.5});
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
  const roles={dc1:'directory',dc2:'directory',dhcp:'address',syslog:'logs',wsus:'updates',subca:'certificate',templates:'certificate',fs:'folder',sql:'database',apps:'key',web:'web',splunk:'search',nessus:'scan',epo:'shield',audit:'archive',management:'gear',repo:'package',root:'key',workstations:'desktop',jump:'admin',jump1:'admin',jump2:'admin',core:'router',media:'media',backup:'archive'};
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
  // ---- Building: rooms off one corridor, cut away like an architectural model ----
  // Back exterior walls (north, west) stand full height; every other wall is cut at knee height with a light cap,
  // so the rooms read clearly from above while nothing hides the equipment.
  const wall=new THREE.MeshStandardMaterial({color:'#2f3c48',roughness:.85,metalness:.05});
  const cap=new THREE.MeshStandardMaterial({color:'#c3ced6',roughness:.7,metalness:.05});
  const trim=new THREE.MeshStandardMaterial({color:'#56636e',roughness:.6,metalness:.4});
  const door=new THREE.MeshStandardMaterial({color:'#4a5966',roughness:.55,metalness:.35});
  const steel=new THREE.MeshStandardMaterial({color:'#5d5a52',roughness:.45,metalness:.6});
  const glass=new THREE.MeshStandardMaterial({color:'#7fb2c4',transparent:true,opacity:.14,roughness:.15,metalness:.05,depthWrite:false});
  const strip=new THREE.MeshBasicMaterial({color:'#dfedff'});
  const floorTextures={};
  function floorTexture(kind){
    if(floorTextures[kind])return floorTextures[kind];
    const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
    const paint={raised:['#202a33','#33414d',4],carpet:['#1b2530','#212d39',1],concrete:['#262e35','#2e3840',2],vault:['#24262a','#33363b',2],perforated:['#26313b','#3a4855',4]}[kind];
    ctx.fillStyle=paint[0];ctx.fillRect(0,0,256,256);
    if(kind==='carpet'){for(let i=0;i<1600;i++){ctx.fillStyle=i%2?'#1f2a35':'#18212b';ctx.fillRect(Math.random()*256,Math.random()*256,2,2);}ctx.fillStyle=paint[1];ctx.fillRect(0,0,256,2);ctx.fillRect(0,0,2,256);}
    else if(kind==='perforated'){ctx.fillStyle='#141b22';for(let y=18;y<240;y+=14)for(let x=18;x<240;x+=14){ctx.beginPath();ctx.arc(x,y,3.2,0,Math.PI*2);ctx.fill();}ctx.fillStyle=paint[1];ctx.fillRect(0,0,256,paint[2]);ctx.fillRect(0,0,paint[2],256);}
    else{ctx.fillStyle=paint[1];ctx.fillRect(0,0,256,paint[2]);ctx.fillRect(0,0,paint[2],256);}
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
    return floorTextures[kind]=texture;
  }
  const floorMaterials={};
  function floorMaterial(kind,w,d){
    const tile={raised:3,carpet:5,concrete:8,vault:4,perforated:3}[kind];
    const texture=floorTexture(kind).clone();texture.needsUpdate=true;texture.repeat.set(w/tile,d/tile);
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:kind==='carpet'?.95:.7,metalness:kind==='concrete'?.05:.12});
    (floorMaterials[kind]||(floorMaterials[kind]=[])).push(material);return material;
  }
  function floorSlab(scene,x0,x1,z0,z1,kind,y=-.33){
    const w=x1-x0,d=z1-z0,mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.65,d),floorMaterial(kind,w,d));
    mesh.position.set((x0+x1)/2,y,(z0+z1)/2);mesh.receiveShadow=true;mesh.userData.floor=true;scene.add(mesh);return mesh;
  }
  const CUT=4.6,FULL=14;
  // A wall run along x (axis 'x') or z, with door openings [from,to] cut out of it.
  function wallRun(group,axis,fixed,from,to,{height=CUT,openings=[]}={}){
    const spans=[];let cursor=from;
    for(const [a,b] of [...openings].sort((p,q)=>p[0]-q[0])){if(a>cursor)spans.push([cursor,a]);cursor=b;}
    if(cursor<to)spans.push([cursor,to]);
    for(const [a,b] of spans){
      const len=b-a,mid=(a+b)/2,t=.32;
      if(axis==='x'){box(group,len,height,t,mid,height/2,fixed,wall);if(height<FULL)box(group,len+.02,.14,t+.08,mid,height+.07,fixed,cap);}
      else{box(group,t,height,len,fixed,height/2,mid,wall);if(height<FULL)box(group,t+.08,.14,len+.02,fixed,height+.07,mid,cap);}
    }
  }
  // A door leaf standing open, a frame, and (for secured rooms) a badge reader on the corridor side.
  function doorway(group,axis,fixed,at,{badge=false,vault=false,side=1}={}){
    const half=2,leaf=vault?steel:door;
    if(axis==='x'){
      for(const s of [-1,1])box(group,.24,CUT+.25,.5,at+s*half,(CUT+.25)/2,fixed,trim);
      const pivot=new THREE.Group();pivot.position.set(at-half,0,fixed);pivot.rotation.y=side*-1.15;group.add(pivot);
      box(pivot,3.8,CUT-.2,vault?.36:.14,1.9,(CUT-.2)/2+.05,0,leaf);
      if(vault)box(pivot,.14,1.2,.5,3.2,2.2,side*.25,trim);
      if(badge){box(group,.36,.62,.16,at+half+.75,3.05,fixed+side*.3,black);box(group,.12,.12,.04,at+half+.75,3.22,fixed+side*.4,led('#6fd08d'));}
      box(group,4,.04,.7,at,.02,fixed,trim);
    }else{
      for(const s of [-1,1])box(group,.5,CUT+.25,.24,fixed,(CUT+.25)/2,at+s*half,trim);
      box(group,.7,.04,4,fixed,.02,at,trim);
    }
  }
  function building(scene,{rooms,coldAisle}){
    for(const r of rooms)floorSlab(scene,r.x0,r.x1,r.z0,r.z1,r.floor);
    // Perforated supply tiles down the contained cold aisle.
    const perforated=new THREE.Mesh(new THREE.PlaneGeometry(coldAisle.x1-coldAisle.x0-.4,coldAisle.z1-coldAisle.z0-.6),floorMaterial('perforated',coldAisle.x1-coldAisle.x0,coldAisle.z1-coldAisle.z0));
    perforated.rotation.x=-Math.PI/2;perforated.position.set((coldAisle.x0+coldAisle.x1)/2,.006,(coldAisle.z0+coldAisle.z1)/2);perforated.userData.floor=true;scene.add(perforated);
    const named=id=>rooms.find(r=>r.id===id),server=named('server'),admin=named('admin'),office=named('office'),media=named('media'),vault=named('vault');
    const gap=(r)=>[r.door.at-2,r.door.at+2];
    // Exterior: full-height back walls, cut-away front walls.
    const north=new THREE.Group();north.userData.fadeKey='wall-north';scene.add(north);
    wallRun(north,'x',-26.16,-30.3,46.3,{height:FULL});
    for(let x=-26;x<46;x+=6)box(north,.06,13,.05,x,6.8,-25.98,trim);
    plate(north,'SECURE BY DESIGN  /  SERVER ROOM',22,-6,12.2,-25.96,{height:.9,color:'#dceaf2',background:'#2b3946'});
    const west=new THREE.Group();west.userData.fadeKey='wall-west';scene.add(west);
    wallRun(west,'z',-30.16,-26,44.3,{height:FULL});
    const south=new THREE.Group();south.userData.fadeKey='wall-south';scene.add(south);wallRun(south,'x',44.16,-30.3,46.3,{height:3.2});
    const east=new THREE.Group();east.userData.fadeKey='wall-east';scene.add(east);wallRun(east,'z',46.16,-26,44.3,{height:3.2});
    // Interior: the corridor walls with their doors, and the walls between rooms.
    const inner=new THREE.Group();inner.userData.fadeKey='walls-inner';scene.add(inner);
    wallRun(inner,'x',4,-30,46,{openings:[gap(server),gap(admin)]});
    wallRun(inner,'x',12,-30,46,{openings:[gap(office),gap(media)]});
    wallRun(inner,'z',20,-26,4);wallRun(inner,'z',20,12,44);
    wallRun(inner,'x',24,20,46,{openings:[gap(vault)]});
    doorway(inner,'x',4,server.door.at,{badge:true,side:1});
    doorway(inner,'x',4,admin.door.at,{badge:true,side:1});
    doorway(inner,'x',12,office.door.at,{side:-1});
    doorway(inner,'x',12,media.door.at,{badge:true,side:-1});
    doorway(inner,'x',24,vault.door.at,{badge:true,vault:true,side:-1});
    // Cold-aisle containment: glass end doors keep supply air in front of the equipment.
    const containment=new THREE.Group();containment.userData.fadeKey='containment';scene.add(containment);
    for(const x of [coldAisle.x0,coldAisle.x1]){
      const depth=coldAisle.z1-coldAisle.z0,mid=(coldAisle.z0+coldAisle.z1)/2;
      box(containment,.08,11.6,depth-.2,x,6.1,mid,glass);
      box(containment,.16,.3,depth,x,12.05,mid,trim);for(const z of [coldAisle.z0,coldAisle.z1,mid])box(containment,.16,11.9,.16,x,5.95,z,trim);
    }
    plate(containment,'COLD AISLE',3.6,coldAisle.x1+.12,10.6,(coldAisle.z0+coldAisle.z1)/2,{height:.5,color:'#9fd8ee'}).rotation.y=Math.PI/2;
    // Environmental fit-out: fire suppression and a monitoring panel in the server room's open corner.
    const corner=new THREE.Group();corner.userData.fadeKey='server-corner';scene.add(corner);
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,6.4,18),new THREE.MeshStandardMaterial({color:'#7d4646',roughness:.5,metalness:.4}));tank.position.set(18,3.2,-24);tank.castShadow=true;corner.add(tank);
    box(corner,2.4,3,.3,15,6,-25.7,black);box(corner,2,1.1,.04,15,6.5,-25.54,new THREE.MeshStandardMaterial({color:'#2a6a7a',emissive:'#2a6a7a',emissiveIntensity:.35}));
    plate(corner,'ENVIRONMENT',2.2,15,5.15,-25.53,{height:.3});
    // Ceiling light strips over the working areas (the ceiling itself is cut away).
    for(const [x,z,len] of [[-7,-10,30],[-7,24,40],[-7,36,40],[33,-10,20]]){box(scene,len,.2,.7,x,15.4,z,black);box(scene,len-1.4,.06,.48,x,15.26,z,strip);}
  }
  // Overhead ladder tray between two points at the same height, with hangers.
  function trayRun(scene,[x1,z1],[x2,z2],y){
    const along=x1!==x2,len=Math.abs(along?x2-x1:z2-z1),mx=(x1+x2)/2,mz=(z1+z2)/2;if(len<.01)return;
    for(const s of [-.7,.7]){if(along)box(scene,len+1.4,.16,.08,mx,y,mz+s,metal);else box(scene,.08,.16,len+1.4,mx+s,y,mz,metal);}
    const rungs=[];for(let t=0;t<=len;t+=1.2){const p=along?[Math.min(x1,x2)+t,y-.04,mz]:[mx,y-.04,Math.min(z1,z2)+t];rungs.push(p);}
    repeated(scene,rungs,along?[.08,.08,1.4]:[1.4,.08,.08],metal);
    for(let i=0;i<2;i++){if(along)box(scene,len,.06,.08,mx,y+.06,mz-.22+i*.38,rubber);else box(scene,.08,.06,len,mx-.22+i*.38,y+.06,mz,rubber);}
    for(let t=2;t<len;t+=8){const px=along?Math.min(x1,x2)+t:mx,pz=along?mz:Math.min(z1,z2)+t;for(const s of [-.7,.7])box(scene,.06,2.2,.06,along?px:px+s,y+1.15,along?pz+s:pz,metal);}
  }
  // ---- Server room furniture ----
  function patchPanel(parent,y,width=5.6){box(parent,width,.36,.6,0,y,2.3,black);repeated(parent,Array.from({length:24},(_,i)=>[-(width-.9)/2+i*(width-.9)/23,y,2.61]),[.14,.16,.03],recess);}
  function blanking(parent,ys){for(const y of ys)box(parent,5.85,.9,.08,0,y,2.5,black);}
  function hypervisor(parent,{name,tiles}){
    const h=1.55;
    box(parent,5.7,h,4.6,0,0,0,metal);box(parent,5.55,h-.09,.1,0,0,2.35,black);
    for(const x of [-2.83,2.83]){box(parent,.16,h-.1,.12,x,0,2.44,silver);box(parent,.055,.5,.16,x,0,2.55,black);}
    const status=led('#70c888');lights.push({material:status,phase:lights.length*.71});box(parent,.11,.11,.035,2.62,.6,2.44,status);
    plate(parent,name+'  ·  HYPERVISOR',3.4,-.7,.6,2.51,{height:.22,color:'#c7d6e2',background:'#131d26'});
    for(const t of tiles){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.24,.98),new THREE.MeshBasicMaterial({map:tileTexture(t)}));mesh.position.set(t.x,-.15,2.515);parent.add(mesh);}
    cable(parent,[[2.65,-.3,-2.35],[3,-.5,-2.7],[3,-1.2,-2.7]],'#52788e');
  }
  // A seat virtual machine: a second screen on its host seat's desk, showing the VM's own tile. World scale;
  // the parent group sits on the desk and turns toward the chair.
  function vmScreen(parent,tile){
    box(parent,1.62,1.24,.1,0,4.3,0,black);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.12),new THREE.MeshBasicMaterial({map:tileTexture(tile)}));mesh.position.set(0,4.3,.056);parent.add(mesh);
    box(parent,.12,.62,.12,0,3.42,-.05,metal);box(parent,.7,.06,.44,0,3.15,-.05,black);
    plate(parent,'VIRTUAL MACHINE',1.2,0,5.03,.06,{height:.16,color:'#c7d6e2',background:'#131d26'});
  }
  const tileTextures=new Map();
  function tileTexture({id,name,color,vlan}){
    const key=id+color;if(tileTextures.has(key))return tileTextures.get(key);
    const c=document.createElement('canvas');c.width=256;c.height=202;const ctx=c.getContext('2d');
    ctx.fillStyle='#0c1621';ctx.fillRect(0,0,256,202);ctx.fillStyle=color;ctx.fillRect(0,0,256,18);
    ctx.strokeStyle='#26384a';ctx.lineWidth=4;ctx.strokeRect(2,2,252,198);
    ctx.save();ctx.translate(12,44);ctx.scale(.62,.62);drawIcon(ctx,roleOf(id)||'gear',color);ctx.restore();
    ctx.fillStyle='#eef8ff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='700 46px Segoe UI,Arial';ctx.fillText(name,98,92,150);
    ctx.fillStyle=color;ctx.font='600 26px Segoe UI,Arial';ctx.fillText(`VLAN ${vlan}`,98,140,150);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;tileTextures.set(key,texture);return texture;
  }
  // A full-height cabinet front with a label: cooling, UPS, or power distribution.
  function cabinet(parent,kind){
    const body=kind==='cooling'?white:black;
    box(parent,6.9,12.1,6.2,0,6.15,0,body);box(parent,6.6,11.6,.1,0,6.15,3.1,kind==='cooling'?metal:black);
    if(kind==='cooling'){repeated(parent,Array.from({length:34},(_,i)=>[0,1.2+i*.3,3.17]),[5.6,.1,.06],black);plate(parent,'IN-ROW COOLING',4.6,0,11.55,3.2,{height:.42,color:'#bfe3f2'});}
    else{
      box(parent,2,1.1,.06,0,9.6,3.18,new THREE.MeshStandardMaterial({color:'#24606e',emissive:'#24606e',emissiveIntensity:.35}));
      const modules=[];for(let i=0;i<6;i++)modules.push([0,1.4+i*1.1,3.18]);repeated(parent,modules,[5.6,.9,.06],metal);
      plate(parent,kind==='ups'?'UPS':'POWER DISTRIBUTION',4.6,0,11.55,3.2,{height:.42,color:'#e2c690'});
    }
  }
  function idf(parent){
    box(parent,4.6,9,4,0,4.5,0,black);for(const x of [-2.15,2.15])box(parent,.16,8.6,.16,x,4.5,2,silver);
    networkSwitch(parent,7.2,{width:3.8,label:'ACCESS 01',ports:24});networkSwitch(parent,6.2,{width:3.8,label:'ACCESS 02',ports:24});
    patchPanel(parent,8.2,3.8);plate(parent,'IDF · OFFICE ACCESS',3.9,0,8.85,2.25,{height:.3,color:'#9fd0e8'});
  }
  // ---- People: simple, faceless figures ----
  const skin=new THREE.MeshStandardMaterial({color:'#b5aea4',roughness:.8});
  const clothing=['#4f6476','#5c6a63','#6b6255','#45566b','#5b5e70','#617383'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.85}));
  const headGeometry=new THREE.SphereGeometry(1,18,14),torsoGeometry=new THREE.CapsuleGeometry(1,1,4,12);
  // Seated at a desk, in the desk's own coordinates (the desk group's scale applies).
  function seated(desk,index=0){
    const g=new THREE.Group();g.position.set(0,0,1.62);desk.add(g);const cloth=clothing[index%clothing.length];
    const torso=new THREE.Mesh(torsoGeometry,cloth);torso.scale.set(.3,.36,.2);torso.position.set(0,1.62,.08);torso.castShadow=true;g.add(torso);
    const head=new THREE.Mesh(headGeometry,skin);head.scale.setScalar(.2);head.position.set(0,2.32,-.02);head.castShadow=true;g.add(head);
    for(const s of [-1,1]){box(g,.2,.18,.62,s*.15,1.0,-.24,cloth);box(g,.17,.82,.18,s*.15,.55,-.56,rubber);}
    const arms=new THREE.Group();g.add(arms);for(const s of [-1,1])box(arms,.13,.13,.66,s*.3,1.6,-.42,cloth);
    return {group:g,arms,head};
  }
  // Standing, in world units, for people carrying media between rooms.
  function standing(parent,index=0){
    const g=new THREE.Group();parent.add(g);const cloth=clothing[(index+2)%clothing.length];
    const torso=new THREE.Mesh(torsoGeometry,cloth);torso.scale.set(.95,1.05,.62);torso.position.y=5.6;torso.castShadow=true;g.add(torso);
    const head=new THREE.Mesh(headGeometry,skin);head.scale.setScalar(.62);head.position.y=7.75;head.castShadow=true;g.add(head);
    const legs=[-1,1].map(s=>{const pivot=new THREE.Group();pivot.position.set(s*.42,3.7,0);g.add(pivot);const leg=new THREE.Mesh(unit,rubber);leg.scale.set(.48,3.6,.52);leg.position.y=-1.8;leg.castShadow=true;pivot.add(leg);return pivot;});
    for(const s of [-1,1]){const arm=new THREE.Mesh(unit,cloth);arm.scale.set(.32,2.6,.34);arm.position.set(s*1.22,5.4,0);g.add(arm);}
    return {group:g,legs};
  }
  // ---- Contact shadows: soft dark pads under equipment and furniture, drawn in one instanced batch ----
  const aoCanvas=document.createElement('canvas');aoCanvas.width=aoCanvas.height=128;
  {const ctx=aoCanvas.getContext('2d');for(let i=0;i<24;i++){const k=i/24;ctx.fillStyle=`rgba(0,0,0,${.06})`;const m=6+k*44;ctx.beginPath();ctx.roundRect(m,m,128-2*m,128-2*m,26-k*14);ctx.fill();}}
  const aoTexture=new THREE.CanvasTexture(aoCanvas),aoPads=[];
  function contact(x,z,w,d){aoPads.push([x,z,w,d]);}
  function contactShadows(scene){
    if(!aoPads.length)return null;
    const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:aoTexture,color:'#000000',transparent:true,opacity:.85,depthWrite:false}),aoPads.length);
    const m=new THREE.Matrix4();aoPads.forEach(([x,z,w,d],i)=>{m.makeScale(w,1,d).setPosition(x,.012,z);mesh.setMatrixAt(i,m);});mesh.renderOrder=1;mesh.userData.floor=true;scene.add(mesh);return mesh;
  }
  // Batched materials get a per-instance fade. Faded instances use screen-door transparency (ordered dither),
  // so racks in front of the active systems become see-through without breaking depth sorting.
  const fadeClones=new Map();
  function fadeMaterial(material){
    if(fadeClones.has(material))return fadeClones.get(material);
    const clone=material.clone();
    clone.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aFade;\nattribute float aDim;\nvarying float vSbdFade;\nvarying float vSbdDim;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSbdFade=aFade;vSbdDim=aDim;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSbdFade;\nvarying float vSbdDim;\nfloat sbdBayer(vec2 p){ivec2 q=ivec2(mod(p,4.0));int i=q.x+q.y*4;float m[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);return (m[i]+.5)/16.;}').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vSbdFade<.999&&sbdBayer(gl_FragCoord.xy)>=vSbdFade)discard;').replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.rgb*=vSbdDim;');
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
      const dim=new Float32Array(meshes.length).fill(1);
      geometry.setAttribute('aFade',new THREE.InstancedBufferAttribute(fade,1));
      geometry.setAttribute('aDim',new THREE.InstancedBufferAttribute(dim,1));
      const instances=new THREE.InstancedMesh(geometry,fadeMaterial(material),meshes.length);
      meshes.forEach((mesh,index)=>{
        instances.setMatrixAt(index,mesh.matrixWorld);
        const key=fadeKeyOf(mesh);if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(index);
        if(!registry.bounds.has(key))registry.bounds.set(key,new THREE.Box3());
        registry.bounds.get(key).union(corner.clone().applyMatrix4(mesh.matrixWorld));
      });
      instances.castShadow=meshes.some(mesh=>mesh.castShadow);instances.receiveShadow=true;
      for(const mesh of meshes)mesh.removeFromParent();
      scene.add(instances);registry.meshes.push({mesh:instances,fade,dim,byKey});
    }
    return registry;
  }
  // Fade one equipment group: batched metalwork dithers; remaining decor (plates, ports, cables) hides when mostly faded.
  function setFade(registry,key,value){
    for(const {mesh,fade,byKey} of registry.meshes){const indices=byKey.get(key);if(!indices)continue;for(const i of indices)fade[i]=value;mesh.geometry.attributes.aFade.needsUpdate=true;}
    for(const group of registry.groups.get(key)||[])group.traverse(o=>{if(o!==group&&!o.userData.keepVisible&&(o.isMesh||o.isLine))o.visible=value>.55;});
  }
  // Dim one equipment group without making it see-through: the parts of a step stay bright, the rest of the room steps back.
  function setDim(registry,key,value){
    for(const {mesh,dim,byKey} of registry.meshes){const indices=byKey.get(key);if(!indices)continue;for(const i of indices)dim[i]=value;mesh.geometry.attributes.aDim.needsUpdate=true;}
  }
  // Standard keeps the established look; cinematic darkens the room so traffic and status lights carry the scene.
  const themed={metal,black,silver,rubber,white,recess,wall,cap,trim,door,glass,strip};
  const themes={
    standard:{floor:'#ffffff',wall:'#2f3c48',cap:'#c3ced6',trim:'#56636e',door:'#4a5966',strip:'#dfedff',glass:'#7fb2c4',white:'#a9b4bd',metal:'#55606b',black:'#1d252d',silver:'#b8bec5',rubber:'#242b30',recess:'#05090d'},
    cinematic:{floor:'#b9c3cb',wall:'#1d2833',cap:'#7d8a95',trim:'#2f3a44',door:'#26313b',strip:'#7fdcf0',glass:'#2f5866',white:'#33424e',metal:'#2b343d',black:'#090d12',silver:'#6d7a86',rubber:'#141a1f',recess:'#020406'}
  };
  function setTheme(name){
    const colors=themes[name]||themes.standard;
    for(const [key,material] of Object.entries(themed)){if(!colors[key])continue;material.color.set(colors[key]);fadeClones.get(material)?.color.set(colors[key]);}
    for(const list of Object.values(floorMaterials))for(const material of list)material.color.set(colors.floor);
  }
  return {box,plate,cable,rack,server,networkSwitch,workstation,mediaCabinet,building,trayRun,patchPanel,blanking,hypervisor,vmScreen,cabinet,idf,seated,standing,contact,contactShadows,batch,setFade,setDim,setTheme,iconTexture,roleOf,materials:{metal,black,silver,rubber}};
}
