// The System Hub's network diagram (19 October 2026). It replaced the 3D topology layer that floated over the building:
// every VLAN as a card, one uplink each to the core router inside its default-deny boundary, and the offline area apart
// with no link. Cards are HTML so they reflow; the uplinks are SVG measured from the cards after layout.
// Wide boards use the reviewed layout (VLANs 10, 20, 30 on top; 80 left; 40 right; 50, 60, 70 below).
// Narrow boards stack the cards under the core with one shared trunk.

const SVG = 'http://www.w3.org/2000/svg';
const WIDE_AREAS = { v10: 'top', v20: 'top', v30: 'top', v80: 'left', v40: 'right', v50: 'bottom', v60: 'bottom', v70: 'bottom' };
const NARROW_BELOW = 720;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function mountTopologyDiagram(root, { vlans, name, offline, onSystem, onVlan, onShow3d }) {
  const vlanOf = id => vlans.find(v => v.ids.includes(id));
  const offlineIds = new Set(offline);
  const chip = id => `<button type="button" class="nd-chip" data-diagram-system="${esc(id)}">${esc(name(id))}</button>`;

  root.innerHTML = `
    <div class="nd-head">
      <div>
        <span class="eyebrow">NETWORK DIAGRAM</span>
        <h2 id="networkDiagramHeading">How the network connects</h2>
        <p>Every VLAN has one uplink to the core router. Default deny blocks traffic between VLANs unless a documented exception allows it. The offline area has no network link.</p>
      </div>
      <button type="button" class="nd-show3d" hidden>Show in 3D</button>
    </div>
    <p class="nd-status"></p>
    <div class="nd-board">
      <svg class="nd-links" aria-hidden="true" focusable="false"></svg>
      <div class="nd-core-wrap">
        <span class="nd-deny">DEFAULT DENY</span>
        <button type="button" class="nd-core" data-diagram-system="core">
          <span class="nd-kicker">CORE</span>
          <strong>Core router</strong>
          <span class="nd-core-role">Learner-built virtual L3 router</span>
          <span class="nd-core-status" hidden></span>
        </button>
      </div>
      ${vlans.map(v => `
        <article class="nd-vlan" data-vlan="${v.id}" style="--vlan:${v.color};grid-area:${v.id}" aria-label="VLAN ${v.number}, ${esc(v.name)}">
          <button type="button" class="nd-vlan-head" data-diagram-vlan="${v.id}"><b>VLAN ${v.number}</b><code>${esc(v.subnet)}</code></button>
          <h3>${esc(v.name)}</h3>
          <div class="nd-chips">${v.ids.map(chip).join('')}</div>
        </article>`).join('')}
      <article class="nd-offline" aria-label="Offline area, no network link">
        <span class="nd-kicker">OFFLINE · NO NETWORK LINK</span>
        <div class="nd-chips">${offline.map(chip).join('')}</div>
        <p>People carry approved media in and out by hand.</p>
      </article>
    </div>`;

  const board = root.querySelector('.nd-board'), svg = root.querySelector('.nd-links');
  const status = root.querySelector('.nd-status'), coreStatus = root.querySelector('.nd-core-status'), show3d = root.querySelector('.nd-show3d');
  const ring = root.querySelector('.nd-core-wrap'), core = root.querySelector('.nd-core'), offlineCard = root.querySelector('.nd-offline');
  const cards = new Map([...root.querySelectorAll('.nd-vlan')].map(el => [el.dataset.vlan, el]));
  root.querySelectorAll('[data-diagram-system]').forEach(button => { button.onclick = () => onSystem(button.dataset.diagramSystem); });
  root.querySelectorAll('[data-diagram-vlan]').forEach(button => { button.onclick = () => onVlan(button.dataset.diagramVlan); });
  show3d.onclick = () => onShow3d?.();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let state = { kind: 'idle' }, motion = !reduced.matches, geometry = null;
  const idleText = 'Choose a system, a VLAN or a walkthrough step and it is traced here.';

  // ---- Geometry: one polyline per VLAN, from its card to the core, plus the point where it crosses the boundary ----
  function measure() {
    const narrow = root.clientWidth < NARROW_BELOW;
    root.classList.toggle('nd-narrow', narrow);
    const origin = board.getBoundingClientRect();
    const box = el => { const r = el.getBoundingClientRect(); return { left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top, cx: (r.left + r.right) / 2 - origin.left, cy: (r.top + r.bottom) / 2 - origin.top, width: r.width, height: r.height }; };
    const C = box(core), R = box(ring), paths = new Map();
    if (narrow) {
      const trunk = Math.max(10, R.left - 20);
      for (const v of vlans) {
        const K = box(cards.get(v.id)), y = K.top + Math.min(26, K.height / 2);
        paths.set(v.id, { points: [[K.left, y], [trunk, y], [trunk, C.cy], [C.left, C.cy]], gate: [R.left, C.cy], stub: [[K.left, y], [trunk, y]] });
      }
      const lowest = Math.max(...[...paths.values()].map(p => p.points[0][1]));
      return { narrow, width: origin.width, height: origin.height, paths, trunk: [[trunk, lowest], [trunk, C.cy], [C.left, C.cy]], gates: [[R.left, C.cy]] };
    }
    const row = side => vlans.filter(v => WIDE_AREAS[v.id] === side).map(v => ({ v, K: box(cards.get(v.id)) })).sort((a, b) => a.K.cx - b.K.cx);
    const top = row('top'), bottom = row('bottom');
    const topElbow = (Math.max(...top.map(t => t.K.bottom)) + R.top) / 2, bottomElbow = (R.bottom + Math.min(...bottom.map(b => b.K.top))) / 2;
    const entry = (i, n) => C.left + C.width * (n === 1 ? .5 : .22 + .56 * i / (n - 1));
    top.forEach(({ v, K }, i) => { const x = entry(i, top.length); paths.set(v.id, { points: [[K.cx, K.bottom], [K.cx, topElbow], [x, topElbow], [x, C.top]], gate: [x, R.top] }); });
    bottom.forEach(({ v, K }, i) => { const x = entry(i, bottom.length); paths.set(v.id, { points: [[K.cx, K.top], [K.cx, bottomElbow], [x, bottomElbow], [x, C.bottom]], gate: [x, R.bottom] }); });
    for (const side of ['left', 'right']) for (const { v, K } of row(side)) {
      const y = Math.min(Math.max(C.cy, K.top + 20), K.bottom - 20);
      paths.set(v.id, side === 'left' ? { points: [[K.right, y], [C.left, y]], gate: [R.left, y] } : { points: [[K.left, y], [C.right, y]], gate: [R.right, y] });
    }
    return { narrow, width: origin.width, height: origin.height, paths, gates: [...paths.values()].map(p => p.gate) };
  }

  // ---- Drawing ----
  const d = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const el = (tag, attrs) => { const node = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); return node; };
  // Cut a card-to-core polyline where it crosses the boundary (always on its last segment).
  const toGate = (points, gate) => [...points.slice(0, -1), gate];

  function draw() {
    geometry = measure();
    const g = geometry, involved = state.vlans || null, lit = state.kind === 'path';
    svg.setAttribute('viewBox', `0 0 ${g.width.toFixed(1)} ${g.height.toFixed(1)}`);
    svg.replaceChildren();
    const defs = el('defs', {});
    const marker = el('marker', { id: 'nd-arrow', viewBox: '0 0 10 10', refX: '7', refY: '5', markerWidth: '4', markerHeight: '4', orient: 'auto-start-reverse' });
    marker.append(el('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'context-stroke' }));
    defs.append(marker); svg.append(defs);
    const width = g.narrow ? 3 : 4.5;
    const faded = id => !!involved && !involved.has(id);
    if (g.narrow) svg.append(el('path', { d: d(g.trunk), class: 'nd-trunk', 'stroke-width': width }));
    for (const v of vlans) {
      const p = g.paths.get(v.id);
      svg.append(el('path', { d: d(g.narrow ? p.stub : p.points), class: 'nd-uplink' + (faded(v.id) || lit ? ' is-quiet' : ''), stroke: v.color, 'stroke-width': width }));
    }
    for (const [x, y] of g.gates) svg.append(el('rect', { x: (x - 6).toFixed(1), y: (y - 6).toFixed(1), width: 12, height: 12, rx: 3, class: 'nd-gate' }));
    if (lit) drawPath(g, width);
  }

  function drawPath(g, width) {
    const { from, to, blocked, color } = state;
    const out = g.paths.get(from), back = g.paths.get(to);
    const outPoints = blocked ? toGate(out.points, out.gate) : out.points, backPoints = [...back.points].reverse();
    const glowWidth = width * 3.2;
    const line = (points, cls, extra = {}) => el('path', { d: d(points), class: cls, stroke: color, ...extra });
    svg.append(line(outPoints, 'nd-lit-glow', { 'stroke-width': glowWidth }));
    svg.append(line(outPoints, 'nd-lit', { 'stroke-width': width + 1 }));
    if (blocked) svg.append(line(back.points, 'nd-lit is-unreached', { 'stroke-width': width }));
    else {
      svg.append(line(backPoints, 'nd-lit-glow', { 'stroke-width': glowWidth }));
      svg.append(line(backPoints, 'nd-lit', { 'stroke-width': width + 1, 'marker-end': 'url(#nd-arrow)' }));
      for (const gate of [out.gate, back.gate]) svg.append(el('rect', { x: (gate[0] - 8).toFixed(1), y: (gate[1] - 8).toFixed(1), width: 16, height: 16, rx: 4, class: 'nd-gate is-open' }));
      for (const gate of [out.gate, back.gate]) svg.append(el('path', { d: `M${gate[0] - 4} ${gate[1]} l3 3 l5 -6`, class: 'nd-check' }));
    }
    if (blocked) {
      const [x, y] = out.gate;
      svg.append(el('circle', { cx: x, cy: y, r: 11, class: 'nd-stop' }));
      svg.append(el('path', { d: `M${x - 4} ${y - 4} L${x + 4} ${y + 4} M${x + 4} ${y - 4} L${x - 4} ${y + 4}`, class: 'nd-stop-x' }));
    }
    // The packet: a dot that rides the path (and stops at the boundary when the step is denied).
    if (motion) {
      const travel = blocked ? outPoints : [...outPoints, ...backPoints.slice(1)];
      const dot = el('circle', { r: g.narrow ? 4 : 5, class: 'nd-packet' });
      const move = el('animateMotion', { dur: blocked ? '2.2s' : '3.2s', repeatCount: 'indefinite', path: d(travel), keyTimes: '0;1', calcMode: 'linear' });
      dot.append(move); svg.append(dot);
    }
  }

  // ---- State ----
  function paintCards() {
    const involved = state.vlans || null, chips = state.chips || new Set();
    for (const [id, card] of cards) {
      card.classList.toggle('is-dim', !!involved && !involved.has(id));
      card.classList.toggle('is-on', !!involved && involved.has(id));
    }
    offlineCard.classList.toggle('is-dim', !!involved && !state.offline);
    offlineCard.classList.toggle('is-on', !!state.offline);
    core.classList.toggle('is-on', !!state.core);
    root.querySelectorAll('[data-diagram-system]').forEach(button => {
      const id = button.dataset.diagramSystem;
      button.classList.toggle('is-on', chips.has(id));
      button.classList.toggle('is-source', state.source === id);
      button.classList.toggle('is-target', state.target === id);
    });
    coreStatus.hidden = !state.coreStatus;
    coreStatus.textContent = state.coreStatus || '';
    coreStatus.dataset.kind = state.policyKind || '';
    status.textContent = state.text || idleText;
    show3d.hidden = state.kind === 'idle';
  }
  function set(next) { state = next; paintCards(); draw(); }

  function focusOn(ids, text) {
    const list = ids.filter(Boolean);
    if (!list.length) { set({ kind: 'idle' }); return; }
    if (list.includes('core')) { set({ kind: 'focus', core: true, chips: new Set(list), text }); return; }
    const vlanIds = new Set(list.map(id => vlanOf(id)?.id).filter(Boolean));
    set({ kind: 'focus', vlans: vlanIds, offline: list.some(id => offlineIds.has(id)), chips: new Set(list), text });
  }

  const api = {
    idle() { set({ kind: 'idle' }); },
    // A VLAN, a room, a control family or the overview: light the cards that hold these systems.
    highlight(ids = [], label = '') { focusOn(ids, label ? `Showing: ${label}` : ''); },
    select(id) {
      const v = vlanOf(id);
      focusOn([id], `Selected: ${name(id)}${v ? ` · VLAN ${v.number} · ${v.name}` : offlineIds.has(id) ? ' · offline area' : ''}`);
    },
    // A walkthrough step: the source uplink, the core decision, then the destination uplink.
    step({ step, policy, color, label, index, count }) {
      const vf = vlanOf(step.from), vt = vlanOf(step.to);
      const text = `${label} · Step ${index + 1} of ${count} · ${step.title} · ${step.from ? name(step.from) : 'Authorized operator'} → ${name(step.to)} · ${step.protocol}`;
      const base = { chips: new Set([step.from, step.to].filter(Boolean)), source: step.from, target: step.to, text, policyKind: policy.kind, color };
      const vlansInvolved = new Set([vf?.id, vt?.id].filter(Boolean));
      const offlineInvolved = [step.from, step.to].some(id => offlineIds.has(id));
      if (policy.kind === 'manual' || !vf || !vt) { set({ ...base, kind: 'focus', vlans: vlansInvolved, offline: offlineInvolved || policy.kind === 'manual', coreStatus: policy.label }); return; }
      if (step.from === step.to) { set({ ...base, kind: 'focus', vlans: vlansInvolved, coreStatus: `On the host itself · ${policy.label}` }); return; }
      if (vf.id === vt.id) { set({ ...base, kind: 'focus', vlans: vlansInvolved, coreStatus: `Same VLAN, no core rule check · ${policy.label}` }); return; }
      set({ ...base, kind: 'path', vlans: vlansInvolved, core: true, from: vf.id, to: vt.id, blocked: policy.kind === 'deny' || policy.kind === 'pending', coreStatus: policy.label });
    },
    setMotion(on) { const next = !!on && !reduced.matches; if (next !== motion) { motion = next; draw(); } },
    redraw: draw,
  };

  reduced.addEventListener?.('change', event => { if (event.matches) api.setMotion(false); });
  let frame = 0;
  const redrawSoon = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); };
  new ResizeObserver(redrawSoon).observe(root);
  new ResizeObserver(redrawSoon).observe(board);
  document.fonts?.ready?.then(() => draw());
  paintCards(); draw();
  return api;
}
