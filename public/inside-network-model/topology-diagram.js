// Topology diagram mode: a flat network diagram the camera faces squarely, above the dimmed building.
// Units are diagram units (x right, y up). Everything here is pure layout and drawing, so it can be tested
// without WebGL; scene.js places the result in 3D.
//
// Desktop keeps fixed positions so nothing moves between selections: VLANs 10, 20, 30 on top, 80 on the left,
// 40 on the right, 50, 60, 70 on the bottom, the core router in the centre inside a dashed DEFAULT DENY ring.
// Uplinks run only horizontally or vertically. Phones stack the source VLAN, the core and the destination VLAN.

export const HEADER_TEXT = '#0a1622';
export const CORE_TITLE = 'Core router';
export const CORE_SUB = 'Learner-built virtual L3 router';
export const RING_LABEL = 'DEFAULT DENY';
export const DROP_LABEL = 'Dropped · no exception';

const COL = 31, ROW = 19.6, CARD_W = 26;
const DESK_SLOTS = {v10: [-COL, ROW, 'top'], v20: [0, ROW, 'top'], v30: [COL, ROW, 'top'], v80: [-COL, 0, 'left'], v40: [COL, 0, 'right'], v50: [-COL, -ROW, 'bottom'], v60: [0, -ROW, 'bottom'], v70: [COL, -ROW, 'bottom']};
export const DESK_ORDER = ['v10', 'v20', 'v30', 'v80', 'v40', 'v50', 'v60', 'v70'];

// ---- Colour contrast (WCAG 2) ----
const channel = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function luminance(hex) { const n = parseInt(hex.replace('#', ''), 16); return 0.2126 * channel(n >> 16 & 255) + 0.7152 * channel(n >> 8 & 255) + 0.0722 * channel(n & 255); }
export function contrast(a, b) { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

// ---- Card sizes ----
// Chips list the VLAN's systems by name, two to a row. Compact cards (phones showing many VLANs) carry only the header and name.
function cardSize(chips, {phone = false, compact = false} = {}) {
  if (compact) return {w: CARD_W, h: 6.4};
  // Desktop cards share one height so each row lines up; phone cards fit their own systems.
  const rows = phone ? Math.ceil(chips / 2) : Math.max(2, Math.ceil(chips / 2)), w = CARD_W;
  return {w, h: 3.4 + 0.5 + 2.1 + 0.5 + rows * 2.6 + Math.max(0, rows - 1) * 0.5 + 0.7};
}

// An orthogonal path: each point differs from the previous one in x or in y, never both.
export const isOrthogonal = points => points.every((p, i) => i === 0 || Math.abs(p.x - points[i - 1].x) < 1e-9 || Math.abs(p.y - points[i - 1].y) < 1e-9);
const P = (x, y) => ({x, y});

function ringAround(core, padX, padY) { return {x: core.x, y: core.y, w: core.w + 2 * padX, h: core.h + 2 * padY, r: 2.2}; }

// Desktop: every VLAN keeps its slot whether or not it is shown.
export function desktopLayout(vlans) {
  const core = {x: 0, y: 0, w: 21, h: 8.6}, ring = ringAround(core, 3.5, 2.2);
  const rl = ring.x - ring.w / 2, rr = ring.x + ring.w / 2, rt = ring.y + ring.h / 2, rb = ring.y - ring.h / 2;
  const cl = core.x - core.w / 2, cr = core.x + core.w / 2, ct = core.y + core.h / 2, cb = core.y - core.h / 2;
  const cards = new Map();
  for (const v of vlans) {
    const slot = DESK_SLOTS[v.id]; if (!slot) continue;
    const [x, y, side] = slot, size = cardSize(v.ids.length);
    const card = {id: v.id, x, y, ...size, side};
    const left = x - card.w / 2, right = x + card.w / 2, top = y + card.h / 2, bottom = y - card.h / 2;
    // Corner VLANs run down a channel between the side cards and the ring, then into the ring's side.
    const sideInner = COL - CARD_W / 2, channel = x < 0 ? (rl - sideInner) / 2 : (rr + sideInner) / 2, inner = x < 0 ? right : left;
    let points, gate;
    if (side === 'top' && x === 0) { gate = P(0, rt); points = [P(0, bottom), gate, P(0, ct)]; }
    else if (side === 'bottom' && x === 0) { gate = P(0, rb); points = [P(0, top), gate, P(0, cb)]; }
    else if (side === 'left' || side === 'right') { const gx = x < 0 ? rl : rr; gate = P(gx, y); points = [P(inner, y), gate, P(x < 0 ? cl : cr, y)]; }
    else {
      const gy = side === 'top' ? 3.5 : -3.5, gx = x < 0 ? rl : rr, sy = side === 'top' ? bottom + 1.6 : top - 1.6;
      gate = P(gx, gy); points = [P(inner, sy), P(channel, sy), P(channel, gy), gate, P(x < 0 ? cl : cr, gy)];
    }
    card.uplink = {points, gate, entry: points[points.length - 1]};
    cards.set(v.id, card);
  }
  // Below the diagram, toward the right: a wide stage keeps its step card at the bottom left.
  const offline = {x: 14, y: -33, w: 46, h: 7.2};
  return {kind: 'desktop', cards, core, ring, offline, ringLabel: {x: rl + 0.4, y: rt + 1.5, align: 'left'}};
}

// Phone: one vertical stack. With one or two VLANs: the source above the core, the destination below.
// With more, compact cards in two columns whose uplinks run down the outer edges into the ring's sides.
export function phoneLayout(vlans, shown, {source = null, destination = null} = {}) {
  const list = DESK_ORDER.filter(id => shown.includes(id)).map(id => vlans.find(v => v.id === id)).filter(Boolean);
  const cards = new Map();
  if (list.length <= 2) {
    const core = {x: 0, y: 0, w: 21, h: 7.6}, ring = ringAround(core, 2.5, 1.8);
    const rt = ring.y + ring.h / 2, rb = ring.y - ring.h / 2, ct = core.y + core.h / 2, cb = core.y - core.h / 2;
    let above = list[0], below = list[1];
    if (destination && source && destination !== source) { above = list.find(v => v.id === source) || above; below = list.find(v => v.id === destination) || below; }
    if (list.length === 1) { above = list[0]; below = null; }
    if (above) { const s = cardSize(above.ids.length, {phone: true}), y = rt + 3.6 + s.h / 2, bottom = y - s.h / 2; cards.set(above.id, {id: above.id, x: 0, y, ...s, side: 'top', uplink: {points: [P(0, bottom), P(0, rt), P(0, ct)], gate: P(0, rt), entry: P(0, ct)}}); }
    if (below) { const s = cardSize(below.ids.length, {phone: true}), y = rb - 3.6 - s.h / 2, top = y + s.h / 2; cards.set(below.id, {id: below.id, x: 0, y, ...s, side: 'bottom', uplink: {points: [P(0, top), P(0, rb), P(0, cb)], gate: P(0, rb), entry: P(0, cb)}}); }
    const lowest = Math.min(rb, ...[...cards.values()].map(c => c.y - c.h / 2));
    return {kind: 'phone', cards, core, ring, offline: {x: 0, y: lowest - 6, w: 30, h: 7.2}, ringLabel: {x: -1, y: rt + 1.4, align: 'right'}};
  }
  const core = {x: 0, y: 0, w: 21, h: 9}, ring = ringAround(core, 2.5, 1.8);
  const rl = ring.x - ring.w / 2, rr = ring.x + ring.w / 2, rt = ring.y + ring.h / 2, rb = ring.y - ring.h / 2;
  const cl = core.x - core.w / 2, cr = core.x + core.w / 2;
  const half = Math.ceil(list.length / 2), groups = [list.slice(0, half), list.slice(half)];
  const s = cardSize(0, {compact: true}), colX = [-(CARD_W / 2 + 1), CARD_W / 2 + 1], gap = 1.4;
  // Each side of the ring takes up to four gates, spread so no two uplinks share a line.
  const gates = {left: [], right: []};
  groups.forEach((group, g) => {
    const rows = Math.ceil(group.length / 2);
    group.forEach((v, i) => {
      const row = Math.floor(i / 2), col = i % 2, sign = g === 0 ? 1 : -1;
      const near = g === 0 ? rows - 1 - row : row; // 0 = the row next to the ring
      const y = sign * (rt + 3 + s.h / 2 + near * (s.h + gap)), x = colX[col];
      const side = col === 0 ? 'left' : 'right';
      cards.set(v.id, {id: v.id, x, y, ...s, side: g === 0 ? 'top' : 'bottom', compact: true, column: side, near, sign});
      gates[side].push(v.id);
    });
  });
  for (const side of ['left', 'right']) {
    // Gates from the top of the ring down: near-above, far-above, far-below, near-below. Far rows take the gates
    // nearer the middle and the outer channel, so no uplink crosses another.
    const rank = id => { const c = cards.get(id); return c.sign > 0 ? c.near : 10 - c.near; };
    const ids = gates[side].sort((a, b) => rank(a) - rank(b)), n = ids.length;
    ids.forEach((id, k) => {
      const card = cards.get(id), gy = n === 1 ? 0 : (core.h / 2 - 0.8) - k * (core.h - 1.6) / (n - 1);
      const gx = side === 'left' ? rl : rr, outer = side === 'left' ? card.x - card.w / 2 : card.x + card.w / 2;
      // Nearer rows use the inner channel so the paths never cross.
      const channel = side === 'left' ? outer - 1.1 - card.near * 1.1 : outer + 1.1 + card.near * 1.1;
      const gate = P(gx, gy), entry = P(side === 'left' ? cl : cr, gy);
      card.uplink = {points: [P(outer, card.y), P(channel, card.y), P(channel, gy), gate, entry], gate, entry};
    });
  }
  const lowest = Math.min(rb, ...[...cards.values()].map(c => c.y - c.h / 2));
  return {kind: 'phone', cards, core, ring, offline: {x: 0, y: lowest - 6, w: 30, h: 7.2}, ringLabel: {x: 0, y: rt + 1.4, align: 'center'}};
}

// Where each system sits on its card (diagram units), for highlights, tethers and the walkthrough route.
export function chipPlaces(card, ids) {
  const places = new Map();
  if (card.compact) { for (const id of ids) places.set(id, {x: card.x, y: card.y, w: card.w - 2, h: card.h - 2}); return places; }
  const left = card.x - card.w / 2 + 0.8, top = card.y + card.h / 2, w = (card.w - 1.6 - 0.6) / 2;
  ids.forEach((id, i) => { const row = Math.floor(i / 2), col = i % 2; places.set(id, {x: left + col * (w + 0.6) + w / 2, y: top - 3.4 - 0.5 - 2.1 - 0.5 - row * 3.1 - 1.3, w, h: 2.6}); });
  return places;
}

// ---- Drawing (canvas 2D). `k` is canvas pixels per diagram unit. ----
const FONT = 'Inter,Segoe UI,Arial,sans-serif';
function fitText(ctx, text, maxWidth, weight, size, min) {
  let s = size; ctx.font = `${weight} ${s}px ${FONT}`;
  while (s > min && ctx.measureText(text).width > maxWidth) { s -= 1; ctx.font = `${weight} ${s}px ${FONT}`; }
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text; while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}
function rounded(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// A VLAN card: a solid header band in the VLAN's colour with dark text, the name, then one chip per system.
export function drawCard(ctx, k, card, vlan, names, state = {}) {
  const W = card.w * k, H = card.h * k, band = (card.compact ? 3.1 : 3.4) * k, r = 0.9 * k;
  const dim = state.dim ? 0.5 : 1;
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  rounded(ctx, 1, 1, W - 2, H - 2, r); ctx.fillStyle = '#0c1d2d'; ctx.fill();
  ctx.lineWidth = Math.max(2, 0.14 * k); ctx.strokeStyle = state.active ? vlan.color : '#2b4a61'; ctx.stroke();
  ctx.save(); rounded(ctx, 1, 1, W - 2, H - 2, r); ctx.clip();
  ctx.fillStyle = vlan.color; ctx.fillRect(0, 0, W, band);
  ctx.textBaseline = 'middle'; ctx.fillStyle = HEADER_TEXT;
  const pad = 0.8 * k;
  ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(1.75 * k)}px ${FONT}`; ctx.fillText(`VLAN ${vlan.number}`, pad, band / 2);
  const vlanWidth = ctx.measureText(`VLAN ${vlan.number}`).width;
  ctx.textAlign = 'right'; ctx.fillText(fitText(ctx, vlan.subnet, W - 2 * pad - vlanWidth - 0.8 * k, 600, Math.round(1.45 * k), Math.round(1.1 * k)), W - pad, band / 2);
  ctx.textAlign = 'left'; ctx.fillStyle = '#e8f4fb';
  const nameY = band + (card.compact ? (H - band) / 2 : 0.5 * k + 1.05 * k);
  ctx.fillText(fitText(ctx, vlan.name, W - 2 * pad, 600, Math.round(1.6 * k), Math.round(1.15 * k)), pad, nameY);
  if (!card.compact) {
    const places = chipPlaces({...card, x: card.w / 2, y: card.h / 2}, vlan.ids);
    for (const id of vlan.ids) {
      const p = places.get(id), x = (p.x - p.w / 2) * k, y = (card.h - p.y - p.h / 2) * k, w = p.w * k, h = p.h * k;
      const on = state.highlight?.has(id);
      rounded(ctx, x, y, w, h, 0.5 * k); ctx.fillStyle = on ? vlan.color : '#132c40'; ctx.fill();
      ctx.lineWidth = Math.max(1.5, 0.1 * k); ctx.strokeStyle = on ? '#ffffff' : '#2f5068'; ctx.stroke();
      ctx.fillStyle = on ? HEADER_TEXT : '#cfe3ef'; ctx.textAlign = 'center';
      ctx.fillText(fitText(ctx, names.get(id) || id, w - 0.6 * k, 600, Math.round(1.35 * k), Math.round(1 * k)), x + w / 2, y + h / 2 + 0.04 * k);
    }
  }
  ctx.restore();
  if (dim < 1) { ctx.globalAlpha = 1 - dim; rounded(ctx, 1, 1, W - 2, H - 2, r); ctx.fillStyle = '#07111c'; ctx.fill(); ctx.globalAlpha = 1; }
}

// The core router. During a walkthrough step its bottom strip carries the rule check (for example "F13 · PERMIT · HTTPS"),
// with a lock when the session is encrypted, so the result sits where the rule is enforced.
export function drawCore(ctx, k, core, color, state = {}) {
  const W = core.w * k, H = core.h * k, r = 1 * k, strip = state.status ? 2.3 * k : 0;
  ctx.clearRect(0, 0, W, H);
  rounded(ctx, 1, 1, W - 2, H - 2, r); ctx.fillStyle = state.active ? '#123c4b' : '#0e2b39'; ctx.fill();
  ctx.lineWidth = Math.max(2, 0.16 * k); ctx.strokeStyle = color; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const mid = (H - strip) / 2;
  ctx.fillStyle = '#eefaff'; ctx.fillText(fitText(ctx, CORE_TITLE, W - 1.2 * k, 700, Math.round(2 * k), Math.round(1.4 * k)), W / 2, mid - 0.95 * k);
  ctx.fillStyle = '#a9dbe7'; ctx.fillText(fitText(ctx, CORE_SUB, W - 1.2 * k, 500, Math.round(1.3 * k), Math.round(1 * k)), W / 2, mid + 1.2 * k);
  if (state.status) {
    const {text, tone = '#7fe0b7', lock = false} = state.status, y = H - strip;
    ctx.save(); rounded(ctx, 1, 1, W - 2, H - 2, r); ctx.clip(); ctx.fillStyle = tone; ctx.fillRect(0, y, W, strip); ctx.restore();
    ctx.fillStyle = HEADER_TEXT; const lockW = lock ? 1.6 * k : 0, label = fitText(ctx, text, W - 1.6 * k - lockW, 700, Math.round(1.25 * k), Math.round(0.95 * k)), tw = ctx.measureText(label).width, x = W / 2 + lockW / 2;
    ctx.fillText(label, x, y + strip / 2);
    if (lock) { const lx = x - tw / 2 - 1.05 * k, ly = y + strip / 2; ctx.strokeStyle = HEADER_TEXT; ctx.lineWidth = 0.17 * k; ctx.beginPath(); ctx.arc(lx, ly - 0.2 * k, 0.32 * k, Math.PI, 0); ctx.stroke(); ctx.fillRect(lx - 0.48 * k, ly - 0.2 * k, 0.96 * k, 0.75 * k); }
  }
}

// "Dropped · no exception" sits beside the gate the traffic stopped at, clear of the cards and the ring label.
export function dropTagPlace(layout, gate) {
  const w = 17, h = 2.8, ring = layout.ring, top = ring.y + ring.h / 2, bottom = ring.y - ring.h / 2;
  if (Math.abs(gate.y - top) < 1e-6) return {x: gate.x + 1 + w / 2, y: top + 1.75, w, h};
  if (Math.abs(gate.y - bottom) < 1e-6) return {x: gate.x + 1 + w / 2, y: bottom - 1.75, w, h};
  const x = Math.max(ring.x - ring.w / 2 + w / 2 - 3, Math.min(ring.x + ring.w / 2 - w / 2 + 3, gate.x));
  return {x, y: bottom - 2, w, h};
}
// A step's result written on the diagram (a drop, a refused certificate, an encrypted session), sized to its text.
export function drawTag(ctx, k, box, text, color, {fill = '#2a0d12', ink = '#ffd9db'} = {}) {
  const W = box.w * k, H = box.h * k;
  ctx.clearRect(0, 0, W, H); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const label = fitText(ctx, text, W - 1.2 * k, 700, Math.round(1.6 * k), Math.round(1.1 * k)), tw = ctx.measureText(label).width + 1.6 * k;
  rounded(ctx, (W - tw) / 2, 2, tw, H - 4, 0.6 * k); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(2, 0.12 * k); ctx.strokeStyle = color; ctx.stroke();
  ctx.fillStyle = ink; ctx.fillText(label, W / 2, H / 2);
}

// Where a card's tag goes: on a phone, above the source card or below the destination card (outside the stack);
// on a wide stage, under the card, beside its uplink when the uplink leaves from the bottom.
export function cardTagPlace(layout, id) {
  const card = layout.cards.get(id); if (!card) return null;
  const h = 2.8, w = card.w;
  if (layout.kind === 'phone') return {x: card.x, y: card.side === 'top' ? card.y + card.h / 2 + 1.75 : card.y - card.h / 2 - 1.75, w, h};
  const centreLine = card.side === 'top' && Math.abs(card.x - layout.core.x) < 1e-6;
  return {x: card.x + (centreLine ? w / 2 + 1.5 : 0), y: card.y - card.h / 2 - 1.75, w, h};
}

export function drawOffline(ctx, k, box, color, items, state = {}) {
  const W = box.w * k, H = box.h * k;
  ctx.clearRect(0, 0, W, H);
  rounded(ctx, 2, 2, W - 4, H - 4, 1 * k); ctx.fillStyle = '#0d1a24'; ctx.fill();
  ctx.setLineDash([0.9 * k, 0.6 * k]); ctx.lineWidth = Math.max(2, 0.14 * k); ctx.strokeStyle = color; ctx.stroke(); ctx.setLineDash([]);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = color;
  ctx.fillText(fitText(ctx, 'OFFLINE VAULT · NO NETWORK LINK', W - 1.6 * k, 700, Math.round(1.35 * k), Math.round(1 * k)), 0.8 * k, 1.5 * k);
  const n = items.length, gap = 0.6 * k, w = (W - 1.6 * k - gap * (n - 1)) / n, y = 3 * k, h = 2.8 * k;
  items.forEach((item, i) => {
    const x = 0.8 * k + i * (w + gap), on = state.highlight?.has(item.id);
    rounded(ctx, x, y, w, h, 0.5 * k); ctx.fillStyle = on ? color : '#1b2a33'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, 0.1 * k); ctx.strokeStyle = on ? '#ffffff' : '#4b5b63'; ctx.stroke();
    ctx.fillStyle = on ? HEADER_TEXT : '#efe2c8'; ctx.textAlign = 'center';
    ctx.fillText(fitText(ctx, item.name, w - 0.6 * k, 600, Math.round(1.2 * k), Math.round(0.95 * k)), x + w / 2, y + h / 2);
  });
}

// Offline chip positions (diagram units), matching drawOffline.
export function offlinePlaces(box, ids) {
  const n = ids.length, gap = 0.6, w = (box.w - 1.6 - gap * (n - 1)) / n, places = new Map();
  ids.forEach((id, i) => places.set(id, {x: box.x - box.w / 2 + 0.8 + i * (w + gap) + w / 2, y: box.y + box.h / 2 - 3 - 1.4, w, h: 2.8}));
  return places;
}

// A walkthrough route on the diagram: source system, its uplink, its gate, the core, the destination's gate and uplink, destination.
// Denied traffic ends at the source's gate. Returns points and the index of each gate along them.
export function stepRoute(layout, from, to) {
  const a = layout.cards.get(from.vlan), b = layout.cards.get(to.vlan);
  if (!a || !b) return null;
  const pa = from.place, pb = to.place;
  if (from.vlan === to.vlan) return {points: [P(pa.x, pa.y), P(pb.x, pb.y)], gates: [], same: true};
  const exitA = a.uplink.points[0], exitB = b.uplink.points[0];
  // Inside a card: leave the chip toward the card's uplink edge, orthogonally.
  const inA = from.id && !a.compact ? leave(pa, exitA, a) : [P(pa.x, pa.y)], inB = to.id && !b.compact ? leave(pb, exitB, b) : [P(pb.x, pb.y)];
  const upA = a.uplink.points, upB = [...b.uplink.points].reverse();
  // Through the core: from each entry straight in to the core's vertical centre line, then along it.
  const cx = layout.core.x, via = [P(cx, a.uplink.entry.y), P(cx, b.uplink.entry.y)];
  const points = simplify(dedupe([...inA, ...upA, ...via, ...upB, ...inB.reverse()]));
  return {points, gates: [a.uplink.gate, b.uplink.gate], same: false};
}
// Drop points that sit in the middle of a straight run.
function simplify(points) {
  return points.filter((p, i) => {
    if (i === 0 || i === points.length - 1) return true;
    const a = points[i - 1], b = points[i + 1];
    return !((Math.abs(a.x - p.x) < 1e-9 && Math.abs(p.x - b.x) < 1e-9 && (p.y - a.y) * (b.y - p.y) > 0) || (Math.abs(a.y - p.y) < 1e-9 && Math.abs(p.y - b.y) < 1e-9 && (p.x - a.x) * (b.x - p.x) > 0));
  });
}
function leave(p, exit, card) {
  // From the chip, go straight toward the edge the uplink leaves from, then along that edge to the exit.
  if (Math.abs(exit.y - (card.y - card.h / 2)) < 1e-6 || Math.abs(exit.y - (card.y + card.h / 2)) < 1e-6) return [P(p.x, p.y), P(p.x, exit.y + (exit.y > card.y ? -0.01 : 0.01)), P(exit.x, exit.y + (exit.y > card.y ? -0.01 : 0.01))].filter((q, i, a) => i === 0 || q.x !== a[i - 1].x || q.y !== a[i - 1].y);
  return [P(p.x, p.y), P(p.x, exit.y), P(exit.x, exit.y)].filter((q, i, a) => i === 0 || q.x !== a[i - 1].x || q.y !== a[i - 1].y);
}
function dedupe(points) { return points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 1e-6); }

// The diagram's extent (diagram units), for framing.
export function extent(layout, {offline = true, onlyShown = null, core = true} = {}) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  if (!core && !offline && onlyShown && ![...layout.cards.keys()].some(id => onlyShown.has(id))) core = true;
  const add = b => { x0 = Math.min(x0, b.x - b.w / 2); x1 = Math.max(x1, b.x + b.w / 2); y0 = Math.min(y0, b.y - b.h / 2); y1 = Math.max(y1, b.y + b.h / 2); };
  if (core) add(layout.ring);
  for (const [id, card] of layout.cards) if (!onlyShown || onlyShown.has(id)) { add(card); for (const p of card.uplink.points) add({x: p.x, y: p.y, w: 0, h: 0}); }
  if (core && layout.ringLabel) { const l = layout.ringLabel, dx = l.align === 'left' ? 6 : l.align === 'right' ? -6 : 0; add({x: l.x + dx, y: l.y, w: 12, h: 2}); }
  if (offline) add(layout.offline);
  return {x0, x1, y0, y1};
}
