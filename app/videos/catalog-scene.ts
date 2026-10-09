import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type CatalogScene = {
  update: (chapter: number, moving: boolean, target: 'dc1' | 'dc2') => void;
  reset: () => void;
  dispose: () => void;
};

export function createCatalogScene(
  host: HTMLElement,
  select: (chapter: number) => void,
  lost: () => void,
): CatalogScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#081724');
  scene.fog = new THREE.FogExp2('#081724', 0.017);
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 160);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive 3D build: DC01, DC02, health-check console, and evidence record. Drag to orbit, scroll to zoom. Arrow keys rotate and Home resets. Use the chapter buttons for the same selections.',
  );
  host.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 19;
  controls.maxDistance = 45;
  controls.minPolarAngle = 0.27;
  controls.maxPolarAngle = 1.42;
  const reset = () => {
    camera.position.set(17, 17, 25);
    controls.target.set(0, 1.2, 0);
    controls.update();
  };
  reset();
  scene.add(new THREE.HemisphereLight('#dff6ff', '#0b2034', 2.9));
  const key = new THREE.DirectionalLight('#b9e6ff', 4.3);
  key.position.set(-7, 15, 12);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#338efe', 4);
  rim.position.set(8, 6, -9);
  scene.add(rim);
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const pickables: THREE.Object3D[] = [];
  const material = (color: string, glow = 0) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.34,
      metalness: 0.58,
      emissive: color,
      emissiveIntensity: glow,
      transparent: true,
    });
    materials.push(m);
    return m;
  };
  function box(
    parent: THREE.Object3D,
    dimensions: number[],
    position: number[],
    color: string,
    glow = 0,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...(dimensions as [number, number, number])),
      material(color, glow),
    );
    mesh.position.set(...(position as [number, number, number]));
    parent.add(mesh);
    return mesh;
  }
  function label(title: string, subtitle: string, width = 4.6) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#081b2ded';
    ctx.beginPath();
    ctx.roundRect(2, 2, 636, 146, 16);
    ctx.fill();
    ctx.strokeStyle = '#37617a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e4f8ff';
    ctx.font = 'bold 44px Arial';
    ctx.fillText(title, 320, 61);
    ctx.fillStyle = '#81ccdf';
    ctx.font = '28px Arial';
    ctx.fillText(subtitle, 320, 109);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const m = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
    });
    materials.push(m);
    const sprite = new THREE.Sprite(m);
    sprite.scale.set(width, (width * 150) / 640, 1);
    sprite.renderOrder = 10;
    return sprite;
  }
  function selectable(group: THREE.Group, chapter: number) {
    group.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
        object.userData.chapter = chapter;
        pickables.push(object);
      }
    });
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    material('#081a2a'),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.6;
  scene.add(floor);
  const grid = new THREE.GridHelper(70, 70, '#285169', '#142e43');
  grid.position.y = -0.58;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.55;
  scene.add(grid);
  const deck = new THREE.Group();
  scene.add(deck);
  box(deck, [20, 0.38, 15], [0, -0.25, 0], '#132e45');
  const deckEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(20, 0.38, 15)),
    new THREE.LineBasicMaterial({
      color: '#459bbf',
      transparent: true,
      opacity: 0.5,
    }),
  );
  deckEdges.position.y = -0.25;
  scene.add(deckEdges);
  const rings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
  const nodeMaterials: Array<{ materials: THREE.Material[]; chapter: number }> =
    [];
  function server(x: number, name: string, address: string, chapter: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, -2.3);
    scene.add(group);
    const first = materials.length;
    box(group, [4, 0.18, 3.7], [0, 0.08, 0], '#1f4c6a');
    box(group, [1.85, 3.55, 1.65], [0, 1.92, 0], '#3b5d78');
    box(group, [1.63, 3.3, 0.12], [0, 1.93, 0.88], '#0b1f33');
    box(group, [0.06, 3.5, 0.07], [-0.86, 1.95, 0.98], '#73e5f6', 0.7);
    for (let i = 0; i < 5; i++) {
      box(group, [1.4, 0.39, 0.1], [0, 0.67 + i * 0.53, 0.98], '#234660');
      box(
        group,
        [0.83, 0.034, 0.025],
        [-0.16, 0.68 + i * 0.53, 1.04],
        '#557e94',
      );
      box(
        group,
        [0.095, 0.095, 0.05],
        [0.53, 0.67 + i * 0.53, 1.06],
        '#87f3ed',
        1.1,
      );
    }
    box(group, [1.89, 0.1, 1.69], [0, 3.75, 0], '#54c7e1', 0.4);
    const text = label(name, address);
    text.position.set(0, 4.65, 0);
    group.add(text);
    nodeMaterials.push({ materials: materials.slice(first), chapter });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.38, 0.025, 8, 96),
      new THREE.MeshBasicMaterial({
        color: '#76e2f3',
        transparent: true,
        opacity: 0.45,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    group.add(ring);
    rings.push(ring);
    selectable(group, chapter);
  }
  server(-4.5, 'SBD-DC01', 'AD DS · 10.0.10.10', 1);
  server(4.5, 'SBD-DC02', 'AD DS · 10.0.10.11', 2);
  const core = new THREE.Group();
  core.position.set(0, 0, 1.4);
  scene.add(core);
  box(core, [2.6, 0.38, 1.65], [0, 0.27, 0], '#326484');
  for (let i = 0; i < 8; i++)
    box(
      core,
      [0.16, 0.1, 0.06],
      [-0.98 + i * 0.28, 0.28, 0.85],
      '#8ee4f1',
      0.7,
    );
  const client = new THREE.Group();
  client.position.set(-2, 0, 5);
  scene.add(client);
  const clientStart = materials.length;
  box(client, [2.1, 1.32, 0.15], [0, 1.6, 0], '#618397');
  box(client, [1.89, 1.09, 0.06], [0, 1.6, 0.1], '#3685a6', 0.25);
  box(client, [0.18, 0.73, 0.2], [0, 0.66, 0], '#56748a');
  box(client, [1.2, 0.1, 0.75], [0, 0.26, 0], '#385e78');
  const clientLabel = label('HEALTH CHECKS', 'Select to test a controller', 3.8);
  clientLabel.position.set(0, 2.7, 0);
  client.add(clientLabel);
  nodeMaterials.push({ materials: materials.slice(clientStart), chapter: 3 });
  selectable(client, 3);
  const record = new THREE.Group();
  record.position.set(4.5, 0, 4.9);
  record.rotation.y = -0.25;
  scene.add(record);
  const recordStart = materials.length;
  box(record, [1.6, 0.2, 2.05], [0, 0.35, 0], '#cfedf3');
  box(record, [0.13, 0.25, 2.1], [-0.75, 0.37, 0], '#3689b3');
  for (let i = 0; i < 4; i++)
    box(record, [0.93, 0.018, 0.045], [0.05, 0.46, -0.5 + i * 0.26], '#52809b');
  const recordLabel = label('BUILD RECORD', 'Decisions + evidence', 3.6);
  recordLabel.position.set(0, 1.6, 0);
  record.add(recordLabel);
  nodeMaterials.push({ materials: materials.slice(recordStart), chapter: 4 });
  selectable(record, 4);
  const curves: THREE.CatmullRomCurve3[] = [];
  const lines: THREE.Line[] = [];
  function connection(points: number[][], color: string, opacity = 0.55) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    );
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    scene.add(line);
    curves.push(curve);
    lines.push(line);
    return curve;
  }
  connection(
    [
      [-4.5, 0.15, -2.3],
      [-4.5, 0.15, 1.4],
      [0, 0.15, 1.4],
    ],
    '#3d8aad',
    0.35,
  );
  connection(
    [
      [4.5, 0.15, -2.3],
      [4.5, 0.15, 1.4],
      [0, 0.15, 1.4],
    ],
    '#3d8aad',
    0.35,
  );
  connection(
    [
      [-2, 0.15, 5],
      [-2, 0.15, 1.4],
      [0, 0.15, 1.4],
    ],
    '#3d8aad',
    0.35,
  );
  const replication = connection(
      [
        [-4.5, 2.7, -2.3],
        [-2.2, 4.1, -3.3],
        [2.2, 4.1, -3.3],
        [4.5, 2.7, -2.3],
      ],
      '#79e8f5',
      0.85,
    ),
    repLine = lines.at(-1)!;
  const checkA = connection(
      [
        [-2, 1.5, 5],
        [0, 0.7, 1.4],
        [-2.2, 1, -0.3],
        [-4.5, 2.2, -2.3],
      ],
      '#58adff',
      0.7,
    ),
    checkLineA = lines.at(-1)!;
  const checkB = connection(
      [
        [-2, 1.5, 5],
        [0, 0.7, 1.4],
        [2.2, 1, -0.3],
        [4.5, 2.2, -2.3],
      ],
      '#58adff',
      0.7,
    ),
    checkLineB = lines.at(-1)!;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(i < 6 ? 0.075 : 0.085, 10, 8),
      new THREE.MeshBasicMaterial({ color: i < 6 ? '#c2fbff' : '#88c3ff' }),
    );
    scene.add(particle);
    return particle;
  });
  let stage = 2,
    moving = false,
    target = 'dc1',
    elapsed = 0,
    previous = performance.now(),
    visible = true,
    disposed = false;
  function update(chapter: number, animate: boolean, next: 'dc1' | 'dc2') {
    stage = chapter;
    moving = animate;
    target = next;
    for (const node of nodeMaterials)
      for (const m of node.materials)
        m.opacity = stage >= node.chapter ? 1 : 0.25;
    rings.forEach((ring, i) => {
      ring.material.opacity =
        stage === i + 1 ? 0.95 : stage >= i + 1 ? 0.44 : 0.12;
    });
    repLine.visible = stage >= 2;
    checkLineA.visible = stage >= 3 && next === 'dc1';
    checkLineB.visible = stage >= 3 && next === 'dc2';
    particles.forEach((particle, i) => {
      particle.visible = i < 6 ? stage >= 2 : stage >= 3;
    });
  }
  update(2, false, 'dc1');
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  intersection.observe(host);
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down: [number, number] | null = null;
  const hit = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickables)[0];
  };
  const pointerDown = (event: PointerEvent) => {
    down = [event.clientX, event.clientY];
  };
  const pointerUp = (event: PointerEvent) => {
    if (!down) return;
    const drag = Math.hypot(event.clientX - down[0], event.clientY - down[1]);
    down = null;
    if (drag > 5) return;
    const picked = hit(event);
    if (picked) select(picked.object.userData.chapter);
  };
  const pointerMove = (event: PointerEvent) => {
    renderer.domElement.style.cursor = hit(event) ? 'pointer' : 'grab';
  };
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === 'Home') {
      event.preventDefault();
      reset();
      return;
    }
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return;
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta +=
      event.key === 'ArrowLeft' ? 0.12 : event.key === 'ArrowRight' ? -0.12 : 0;
    spherical.phi = THREE.MathUtils.clamp(
      spherical.phi +
        (event.key === 'ArrowUp' ? -0.1 : event.key === 'ArrowDown' ? 0.1 : 0),
      0.27,
      1.42,
    );
    camera.position
      .copy(controls.target)
      .add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    lost();
  };
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  renderer.domElement.addEventListener('pointermove', pointerMove);
  renderer.domElement.addEventListener('keydown', keyDown);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.setAnimationLoop((now) => {
    const delta = Math.min((now - previous) / 1000, 0.06);
    previous = now;
    if (!visible || document.hidden || disposed) return;
    if (moving) elapsed += delta;
    particles.forEach((particle, i) => {
      const t = (elapsed * 0.18 + (i % 6) / 6) % 1;
      particle.position.copy(
        (i < 6 ? replication : target === 'dc1' ? checkA : checkB).getPoint(
          i % 2 ? t : 1 - t,
        ),
      );
    });
    renderer.render(scene, camera);
  });
  return {
    update,
    reset,
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      intersection.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('keydown', keyDown);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      const allMaterials = new Set<THREE.Material>(materials);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((m) => allMaterials.add(m));
        }
      });
      allMaterials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
