import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// The course guides' 3D lesson network (scripts/course-guide/scene.js), as a module the expanded
// catalog tiles can drive from React (owner request, 18 October 2026: every tile shows its course's
// systems the way the course 1.1 tile does). Same floor, lights, server and workstation models,
// labels, selection rings, cables and animated flows; the spec is each guide's scene.json
// (scripts/prepare-course-guides.mjs). Keep the drawing in step with scene.js.

export type GuideSceneNode = {
  id: string;
  name: string;
  sub: string;
  kind: 'server' | 'offline' | 'workstation' | 'fleet' | 'viewpoint';
  row?: 'back' | 'front';
  from?: number;
  existing?: boolean;
  focus?: number[];
  button?: string;
  title: string;
  description: string;
};
export type GuideSceneFlow = {
  from: string;
  to: string;
  lessons: number[];
  label?: string;
  twoWay?: boolean;
  offline?: boolean;
  denied?: boolean;
  final?: boolean;
};
export type GuideSceneSpec = {
  tag: string;
  label: string;
  finalOnly?: boolean;
  zoom?: number;
  camera?: [number, number, number];
  completeStatus: string;
  completeCaption: string;
  nodes: GuideSceneNode[];
  flows?: GuideSceneFlow[];
};
export type GuideSceneState = {
  /** The lesson (or lessons) in view, as indexes into the course's lessons. */
  stages: number[];
  selected: string;
  motion: boolean;
  complete: boolean;
};
export type GuideScene = {
  update: (state: GuideSceneState) => void;
  reset: () => void;
  dispose: () => void;
};

export function nodeActive(node: GuideSceneNode, state: GuideSceneState) {
  if (Array.isArray(node.focus)) return state.complete || node.focus.some(index => state.stages.includes(index));
  return !!node.existing || (Number.isInteger(node.from) && state.stages.some(stage => stage >= (node.from as number)));
}

export function createGuideScene(
  host: HTMLElement,
  spec: GuideSceneSpec,
  lastStage: number,
  onSelect: (nodeId: string) => void,
  onFallback: () => void,
): GuideScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#091b2b');
  const rows = { back: spec.nodes.filter(n => n.row !== 'front'), front: spec.nodes.filter(n => n.row === 'front') };
  const widest = Math.max(rows.back.length, rows.front.length);
  const spacing = widest > 3 ? Math.min(5.6, 22 / (widest - 1)) : widest === 3 ? 6.8 : widest === 2 ? 10 : 0;
  const span = Math.max(10, spacing * (widest - 1));
  const zoom = spec.zoom || Math.max(1, (span + 9) / 19);
  const home = (spec.camera || [17, 17, 24]).map(v => v * zoom) as [number, number, number];
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 150 * zoom);
  camera.position.set(...home);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', `${spec.label} System buttons provide equivalent selection.`);
  host.appendChild(renderer.domElement);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 1.2, 0);
  orbit.minDistance = 18;
  orbit.maxDistance = 48 * zoom;
  orbit.maxPolarAngle = Math.PI * 0.47;
  orbit.minPolarAngle = 0.25;
  orbit.enablePan = false;
  orbit.enableDamping = false;

  scene.add(new THREE.HemisphereLight('#d7f4ff', '#10213c', 2.6));
  const key = new THREE.DirectionalLight('#b3deff', 4);
  key.position.set(6, 16, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#21a8f0', 3);
  rim.position.set(-9, 6, -6);
  scene.add(rim);

  const disposables: { dispose: () => void }[] = [];
  const mat = (c: string, emissive = false) => {
    const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.5, emissive: emissive ? c : '#000000', emissiveIntensity: emissive ? 0.6 : 0 });
    disposables.push(m);
    return m;
  };
  function box(g: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, c: string) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    disposables.push(geometry);
    const m = new THREE.Mesh(geometry, mat(c));
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  const floorW = Math.max(38, span + 18);
  const floorGeometry = new THREE.PlaneGeometry(floorW, 32);
  disposables.push(floorGeometry);
  const floor = new THREE.Mesh(floorGeometry, mat('#0a2033'));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.14;
  scene.add(floor);
  const grid = new THREE.GridHelper(Math.round(floorW - 2), Math.round(floorW - 2), '#1e4961', '#143247');
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.55;
  scene.add(grid);
  disposables.push(grid.geometry, grid.material as THREE.Material);

  const labelWidth = widest > 2 ? Math.min(6.4, spacing * 0.94) : 6.4;
  function label(t: string, sub: string) {
    const cv = document.createElement('canvas');
    cv.width = 720;
    cv.height = 170;
    const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
    ctx.fillStyle = 'rgba(6,22,37,.94)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 712, 162, 15);
    ctx.fill();
    ctx.strokeStyle = '#396a86';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = 'center';
    let size = 48;
    ctx.font = `bold ${size}px Arial`;
    while (ctx.measureText(t).width > 680 && size > 28) {
      size -= 2;
      ctx.font = `bold ${size}px Arial`;
    }
    ctx.fillStyle = '#e1f8ff';
    ctx.fillText(t, 360, 68);
    ctx.font = '32px Arial';
    ctx.fillStyle = '#88c3df';
    ctx.fillText(sub, 360, 123);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    disposables.push(tex, material);
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(labelWidth, labelWidth * 0.236, 1);
    sprite.renderOrder = 20;
    return sprite;
  }

  const nodes: Record<string, { group: THREE.Group; label: THREE.Sprite; ring: THREE.Mesh | null; spec: GuideSceneNode }> = {};
  const pick: THREE.Object3D[] = [];
  const positions: Record<string, [number, number]> = {};
  function ringFor(g: THREE.Object3D, offline: boolean) {
    const geometry = new THREE.TorusGeometry(2.7, 0.025, 8, 100);
    const material = new THREE.MeshBasicMaterial({ color: offline ? '#f0b45c' : '#67d6e8', transparent: true, opacity: 0.65 });
    disposables.push(geometry, material);
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.22;
    g.add(ring);
    return ring;
  }
  function server(n: GuideSceneNode, g: THREE.Object3D) {
    box(g, 4.2, 0.2, 3.9, 0, 0.1, 0, '#1b405b');
    box(g, 2.15, 3.8, 2, 0, 2.1, 0, '#314d68');
    box(g, 1.84, 3.48, 0.09, 0, 2.12, 1.05, '#0a1d32');
    for (let i = 0; i < 5; i++) {
      box(g, 1.55, 0.38, 0.12, 0, 0.85 + i * 0.53, 1.12, '#213e58');
      const geometry = new THREE.SphereGeometry(0.065, 10, 8);
      disposables.push(geometry);
      const led = new THREE.Mesh(geometry, mat(n.kind === 'offline' ? '#f0b45c' : '#68e3e9', true));
      led.position.set(0.57, 0.85 + i * 0.53, 1.21);
      g.add(led);
    }
    const strip = box(g, 0.09, 3.24, 0.1, -0.8, 2.13, 1.17, '#62d7eb');
    strip.material = mat(n.kind === 'offline' ? '#e0a24a' : '#51c9e6', true);
    return 5.23;
  }
  function workstation(n: GuideSceneNode, g: THREE.Object3D) {
    const offsets: [number, number][] = n.kind === 'fleet' ? [[-1.5, -0.9], [1.5, -0.9], [0, 0.7]] : [[0, 0]];
    for (const [ox, oz] of offsets) {
      box(g, 2.6, 1.7, 0.2, ox, 1.9, oz, '#436981');
      box(g, 2.3, 1.38, 0.08, ox, 1.94, oz + 0.14, '#216084');
      box(g, 0.3, 0.9, 0.3, ox, 0.6, oz, '#38546b');
      box(g, 1.6, 0.15, 1, ox, 0.18, oz, '#38546b');
    }
    return 3.7;
  }
  function place(list: GuideSceneNode[], z: number) {
    list.forEach((n, i) => {
      const x = list.length === 1 ? 0 : -spacing * (list.length - 1) / 2 + i * spacing;
      positions[n.id] = [x, z];
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      scene.add(g);
      const top = n.kind === 'server' || n.kind === 'offline' ? server(n, g) : workstation(n, g);
      const ring = n.kind === 'viewpoint' ? null : ringFor(g, n.kind === 'offline');
      const text = label(n.name, n.sub);
      text.position.set(0, top, 0);
      g.add(text);
      g.traverse(o => {
        if ((o as THREE.Mesh).isMesh) {
          o.userData.node = n.id;
          pick.push(o);
        }
      });
      nodes[n.id] = { group: g, label: text, ring, spec: n };
    });
  }
  place(rows.back, -3.4);
  place(rows.front, 7);
  const sw = new THREE.Group();
  sw.position.set(0, 0, 0.9);
  scene.add(sw);
  box(sw, 3, 0.45, 1.9, 0, 0.45, 0, '#245777');
  for (let i = 0; i < 8; i++) box(sw, 0.19, 0.11, 0.1, -1.09 + i * 0.3, 0.5, 1, '#63d3e9');

  const lines: THREE.Line[] = [];
  function curve(points: [number, number, number][], color: string, dashed = false) {
    const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const geometry = new THREE.BufferGeometry().setFromPoints(c.getPoints(70));
    const material = dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.75 })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 });
    disposables.push(geometry, material);
    const l = new THREE.Line(geometry, material);
    if (dashed) l.computeLineDistances();
    scene.add(l);
    lines.push(l);
    return c;
  }
  // Cables to the core switch. The offline root never connects.
  for (const n of spec.nodes) {
    if (n.kind === 'offline') continue;
    const [x, z] = positions[n.id];
    curve(x === 0 ? [[0, 0.24, z], [0, 0.25, 0.9]] : [[x, 0.24, z], [x, 0.25, 0.9], [0, 0.25, 0.9]], '#245d7d');
  }
  // Flows: an arc between two systems, or a dashed hand-carry path for offline media.
  // "core" is the learner-built core router, drawn as the switch in the middle.
  positions.core = [0, 0.9];
  const rise = (id: string) => (id === 'core' ? 0.75 : 2.6);
  const flows = (spec.flows || []).map((f, i) => {
    const [ax, az] = positions[f.from];
    const [bx, bz] = positions[f.to];
    const lift = 4 + (i % 3) * 0.5;
    const pts: [number, number, number][] = f.offline
      ? [[ax, 2.4, az], [(ax + bx) / 2, 1.2, (az + bz) / 2 + 1.4], [bx, 2.4, bz]]
      : [[ax, rise(f.from), az], [ax + (bx - ax) * 0.3, lift, az + (bz - az) * 0.3 - 0.8], [ax + (bx - ax) * 0.7, lift, az + (bz - az) * 0.7 - 0.8], [bx, rise(f.to), bz]];
    const path = curve(pts, f.offline ? '#f0b45c' : f.denied ? '#f07a7a' : i % 2 ? '#5cafff' : '#73e6ef', true);
    const line = lines[lines.length - 1];
    const dots = [0, 1, 2].map(j => {
      const geometry = new THREE.SphereGeometry(0.09, 12, 8);
      const material = new THREE.MeshBasicMaterial({ color: f.offline ? '#ffd08a' : f.denied ? '#ffb4b4' : j % 2 ? '#80bfff' : '#a9f5f5' });
      disposables.push(geometry, material);
      const p = new THREE.Mesh(geometry, material);
      scene.add(p);
      return p;
    });
    return { spec: f, path, line, dots };
  });

  let state: GuideSceneState = { stages: [0], selected: spec.nodes[0]?.id ?? '', motion: true, complete: false };
  let time = 0;
  let last = performance.now();
  function update(s: GuideSceneState) {
    state = s;
    for (const id in nodes) {
      const n = nodes[id].spec;
      const focus = Array.isArray(n.focus);
      const active = nodeActive(n, s);
      nodes[id].group.traverse(o => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          const material = mesh.material as THREE.Material;
          material.transparent = true;
          material.opacity = active ? 1 : focus ? 0.3 : 0.19;
        }
      });
      nodes[id].label.material.opacity = active ? 1 : 0.55;
      const ring = nodes[id].ring;
      if (ring) {
        const material = ring.material as THREE.MeshBasicMaterial;
        material.opacity = id === s.selected ? 0.9 : active ? 0.38 : 0.1;
        material.color.set(id === s.selected ? '#b4f9ff' : n.kind === 'offline' ? '#c08a3a' : '#3599bf');
      }
    }
    for (const f of flows) {
      const on = s.complete
        ? f.spec.final === true || (!spec.finalOnly && f.spec.lessons.includes(lastStage))
        : f.spec.lessons.some(index => s.stages.includes(index));
      f.line.visible = on;
      f.dots.forEach(d => (d.visible = on));
    }
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let down: [number, number] | undefined;
  const onDown = (e: PointerEvent) => (down = [e.clientX, e.clientY]);
  const onUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(pick)[0];
    if (hit) onSelect(hit.object.userData.node as string);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  orbit.update();
  update(state);
  // A frame's timestamp can be a little earlier than the moment the loop starts, so elapsed time is clamped at
  // zero and the path position wraps into 0–1: a negative position makes three.js read a point that doesn't exist.
  renderer.setAnimationLoop(stamp => {
    const now = Number.isFinite(stamp) ? stamp : performance.now();
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.06));
    last = now;
    if (state.motion) time += dt;
    for (const f of flows) {
      if (!f.line.visible) continue;
      f.dots.forEach((d, j) => {
        const t = (((time * 0.15 + j / 3) % 1) + 1) % 1;
        d.position.copy(f.path.getPoint(f.spec.denied ? t * 0.55 : f.spec.twoWay && j % 2 ? 1 - t : t));
      });
    }
    renderer.render(scene, camera);
  });
  const onLost = (e: Event) => {
    e.preventDefault();
    onFallback();
  };
  renderer.domElement.addEventListener('webglcontextlost', onLost);

  return {
    update,
    reset() {
      camera.position.set(...home);
      orbit.target.set(0, 1.2, 0);
      orbit.update();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      orbit.dispose();
      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
