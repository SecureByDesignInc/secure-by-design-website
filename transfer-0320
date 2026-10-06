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
    const floor=new THREE.MeshStandardMaterial({map:texture,roughness:.62,metalness:.15});
    box(scene,64,.65,66,3,-.4,8,floor);
    const wall=new THREE.MeshStandardMaterial({color:'#708392',roughness:.75,metalness:.1});
    box(scene,64,14,.3,3,6.45,-24.5,wall);
    box(scene,.3,6.2,65,-29.1,2.6,8,wall);
    for(let i=0;i<13;i++)box(scene,.045,12,.04,-27+i*4.9,6.6,-24.31,metal);
    plate(scene,'SECURE BY DESIGN  /  DATA CENTER',28,-5,11.5,-24.25,{height:1.02,color:'#dceaf2',background:'#334551'});
    // A cutaway ceiling keeps all devices accessible to the orbit camera.
    const strip=new THREE.MeshBasicMaterial({color:'#dfedff'});
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
    const glass=new THREE.MeshStandardMaterial({color:'#6c9bab',transparent:true,opacity:.15,roughness:.18,metalness:.05,depthWrite:false});
    for(const x of [-23,-15,-7]){box(scene,7.5,4.4,.065,x,2.08,21,glass);box(scene,.1,4.55,.1,x-3.8,2.13,21,metal);}
    box(scene,24,.08,.1,-15,4.38,21,metal);
    // Offline bay is visually separated and has no network cable tray.
    box(scene,10,.07,.11,24,.02,18,metal);
    plate(scene,'OFFLINE OPERATIONS',10,24,6.8,39.02,{height:.6,color:'#e0c494'});
  }
  function batch(scene) {
    // The equipment stays still; batch its repeated metalwork to keep orbiting smooth.
    scene.updateMatrixWorld(true);
    const buckets=new Map();
    scene.traverse(object=>{
      if(!object.isMesh||object.isInstancedMesh||object.geometry!==unit)return;
      if(!buckets.has(object.material))buckets.set(object.material,[]);
      buckets.get(object.material).push(object);
    });
    for(const [material,meshes]of buckets){
      if(meshes.length<2)continue;
      const instances=new THREE.InstancedMesh(unit,material,meshes.length);
      meshes.forEach((mesh,index)=>instances.setMatrixAt(index,mesh.matrixWorld));
      instances.castShadow=meshes.some(mesh=>mesh.castShadow);instances.receiveShadow=true;
      for(const mesh of meshes)mesh.removeFromParent();
      scene.add(instances);
    }
  }
  return {box,plate,cable,rack,server,networkSwitch,workstation,mediaCabinet,room,batch,materials:{metal,black,silver,rubber}};
}
