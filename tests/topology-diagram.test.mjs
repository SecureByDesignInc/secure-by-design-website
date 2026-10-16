// System Hub topology diagram mode (AGENTS.md, "System Hub topology: diagram mode decisions", October 15, 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vlans, facilities } from '../public/inside-network-model/architecture.js';
import {
  desktopLayout, phoneLayout, chipPlaces, stepRoute, extent, isOrthogonal, contrast, drawCard, drawCore,
  HEADER_TEXT, CORE_TITLE, CORE_SUB, RING_LABEL, DROP_LABEL,
} from '../public/inside-network-model/topology-diagram.js';

const scene = readFileSync(new URL('../public/inside-network-model/scene.js', import.meta.url), 'utf8');
const byNumber = n => vlans.find(v => v.number === n).id;

// A canvas stand-in that records the text drawn and measures it at about 0.6 em per character.
function recorder() {
  const texts = [];
  let font = '';
  const ctx = new Proxy({}, {
    get(_, key) {
      if (key === 'texts') return texts;
      if (key === 'font') return font;
      if (key === 'fillText') return text => texts.push(text);
      if (key === 'measureText') return text => ({ width: text.length * 0.6 * Number(/(\d+)px/.exec(font)?.[1] || 10) });
      return () => {};
    },
    set(_, key, value) { if (key === 'font') font = value; return true; },
  });
  return ctx;
}
const box = b => ({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, y0: b.y - b.h / 2, y1: b.y + b.h / 2 });
const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const segments = points => points.slice(1).map((p, i) => [points[i], p]);
// Orthogonal segments cross when one is horizontal, the other vertical, and each spans the other's line (shared ends excepted).
function crosses([a, b], [c, d]) {
  const h1 = a.y === b.y, h2 = c.y === d.y;
  if (h1 === h2) {
    if (h1 && a.y === c.y) return Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) > 1e-6;
    if (!h1 && a.x === c.x) return Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) - Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) > 1e-6;
    return false;
  }
  const [hz, vt] = h1 ? [[a, b], [c, d]] : [[c, d], [a, b]];
  const x = vt[0].x, y = hz[0].y, inside = (v, p, q) => v > Math.min(p, q) + 1e-6 && v < Math.max(p, q) - 1e-6;
  return inside(x, hz[0].x, hz[1].x) && inside(y, vt[0].y, vt[1].y);
}
function assertCleanUplinks(layout, label) {
  const list = [...layout.cards.values()];
  for (const card of list) {
    assert(isOrthogonal(card.uplink.points), `${label}: VLAN ${card.id} uplink runs only horizontally or vertically`);
    const ring = box(layout.ring), g = card.uplink.gate;
    const onRing = (Math.abs(g.x - ring.x0) < 1e-6 || Math.abs(g.x - ring.x1) < 1e-6) && g.y >= ring.y0 && g.y <= ring.y1 || (Math.abs(g.y - ring.y0) < 1e-6 || Math.abs(g.y - ring.y1) < 1e-6) && g.x >= ring.x0 && g.x <= ring.x1;
    assert(onRing, `${label}: VLAN ${card.id} crosses the ring at a gate on its edge`);
    const core = box(layout.core), e = card.uplink.entry;
    assert(e.x >= core.x0 - 1e-6 && e.x <= core.x1 + 1e-6 && e.y >= core.y0 - 1e-6 && e.y <= core.y1 + 1e-6, `${label}: VLAN ${card.id} uplink ends at the core router`);
  }
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++)
    for (const s of segments(list[i].uplink.points)) for (const t of segments(list[j].uplink.points))
      assert(!crosses(s, t), `${label}: uplinks of ${list[i].id} and ${list[j].id} do not cross or overlap`);
  const boxes = [...list.map(c => [c.id, box(c)]), ['ring', box(layout.ring)]];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert(!overlaps(boxes[i][1], boxes[j][1]), `${label}: ${boxes[i][0]} and ${boxes[j][0]} do not overlap`);
}

test('VLAN header bands keep dark text at 4.5:1 or better in the model\'s own colours', () => {
  for (const v of vlans) assert(contrast(v.color, HEADER_TEXT) >= 4.5, `VLAN ${v.number} (${v.color}) header text contrast ${contrast(v.color, HEADER_TEXT).toFixed(2)}`);
});

test('desktop keeps fixed slots: 10, 20, 30 on top; 80 left and 40 right of the core; 50, 60, 70 below', () => {
  const layout = desktopLayout(vlans), at = n => layout.cards.get(byNumber(n));
  assert.equal(layout.cards.size, 8);
  for (const row of [[10, 20, 30], [50, 60, 70]]) {
    assert(at(row[0]).x < at(row[1]).x && at(row[1]).x < at(row[2]).x, `VLANs ${row.join(', ')} run left to right`);
    assert(row.every(n => at(n).y === at(row[0]).y), `VLANs ${row.join(', ')} share a row`);
  }
  assert(at(10).y > 0 && at(50).y < 0, 'Top row above the core, bottom row below');
  assert(at(80).x < layout.core.x && at(40).x > layout.core.x && at(80).y === layout.core.y && at(40).y === layout.core.y, 'VLAN 80 left, VLAN 40 right');
  // Positions never depend on what is selected.
  assert.deepEqual(JSON.stringify([...desktopLayout(vlans).cards]), JSON.stringify([...layout.cards]));
  assertCleanUplinks(layout, 'desktop');
  assert(box(layout.offline).y1 < Math.min(...[...layout.cards.values()].map(c => box(c).y0)), 'The offline area sits below the diagram');
});

test('phones stack the source VLAN, the core and the destination VLAN; many VLANs fit two columns without crossings', () => {
  const v80 = byNumber(80), v40 = byNumber(40);
  const step = phoneLayout(vlans, [v40, v80], { source: v80, destination: v40 });
  const src = box(step.cards.get(v80)), dst = box(step.cards.get(v40)), ring = box(step.ring);
  assert(src.y0 > ring.y1 && ring.y0 > dst.y1, 'Source above the ring, destination below');
  assertCleanUplinks(step, 'phone step');
  const reversed = phoneLayout(vlans, [v40, v80], { source: v40, destination: v80 });
  assert(box(reversed.cards.get(v40)).y0 > box(reversed.ring).y1, 'The source is always on top');
  assertCleanUplinks(phoneLayout(vlans, vlans.map(v => v.id)), 'phone, every VLAN');
  assertCleanUplinks(phoneLayout(vlans, vlans.slice(0, 3).map(v => v.id)), 'phone, three VLANs');
});

test('cards carry the VLAN number, subnet, name and every system from the model data, without cutting names', () => {
  const nodes = new Map([['dc1', 'SBD-DC01'], ['dc2', 'SBD-DC02'], ['dhcp', 'SBD-DHCP01'], ['syslog', 'SBD-SYSLOG01'], ['wsus', 'SBD-WSUS01'], ['subca', 'SBD-SUBCA01'], ['templates', 'SBD-PKI-MGMT01'], ['fs', 'SBD-FS01'], ['sql', 'SBD-SQL01'], ['apps', 'SBD-APPS01'], ['web', 'SBD-WEB01'], ['splunk', 'SBD-SPLUNK01'], ['nessus', 'SBD-NESSUS01'], ['epo', 'SBD-EPO01'], ['audit', 'SBD-AUDIT01'], ['jump', 'AdminJumpBox01'], ['jump1', 'SBD-ADMIN-SRV01'], ['jump2', 'SBD-ADMIN-PC01'], ['management', 'SBD-MGMT01'], ['repo', 'SBD-REPO01'], ['workstations', '50 Windows PCs']]);
  const layout = desktopLayout(vlans);
  for (const v of vlans) {
    const ctx = recorder();
    drawCard(ctx, 40, layout.cards.get(v.id), v, nodes, {});
    for (const text of [`VLAN ${v.number}`, v.subnet, v.name, ...v.ids.map(id => nodes.get(id))]) assert(ctx.texts.includes(text), `VLAN ${v.number} card shows "${text}" (drew: ${ctx.texts.join(' | ')})`);
    // Each system has its own chip inside the card.
    const places = [...chipPlaces(layout.cards.get(v.id), v.ids).values()].map(box), card = box(layout.cards.get(v.id));
    for (const p of places) assert(p.x0 >= card.x0 && p.x1 <= card.x1 && p.y0 >= card.y0 && p.y1 <= card.y1, `VLAN ${v.number} chips sit inside the card`);
  }
  const core = recorder();drawCore(core, 40, layout.core, '#7bddf0', {});
  assert.deepEqual(core.texts, [CORE_TITLE, CORE_SUB]);
  assert.equal(CORE_TITLE, 'Core router');
  assert.equal(CORE_SUB, 'Learner-built virtual L3 router');
  assert.equal(RING_LABEL, 'DEFAULT DENY');
  assert.equal(DROP_LABEL, 'Dropped · no exception');
});

test('a walkthrough route leaves its system, crosses both ring gates and reaches the destination, only at right angles', () => {
  const layout = desktopLayout(vlans);
  for (const [a, b, ia, ib] of [[10, 50, 'dc1', 'splunk'], [80, 40, 'workstations', 'sql'], [20, 60, 'syslog', 'jump1'], [30, 70, 'subca', 'repo']]) {
    const va = vlans.find(v => v.number === a), vb = vlans.find(v => v.number === b);
    const from = { id: ia, vlan: va.id, place: chipPlaces(layout.cards.get(va.id), va.ids).get(ia) };
    const to = { id: ib, vlan: vb.id, place: chipPlaces(layout.cards.get(vb.id), vb.ids).get(ib) };
    const route = stepRoute(layout, from, to);
    assert(isOrthogonal(route.points), `VLAN ${a} to ${b} turns only at right angles`);
    for (const gate of route.gates) assert(route.points.some((p, i) => i > 0 && (p.x === gate.x && Math.min(p.y, route.points[i - 1].y) <= gate.y && Math.max(p.y, route.points[i - 1].y) >= gate.y && route.points[i - 1].x === gate.x || p.y === gate.y && Math.min(p.x, route.points[i - 1].x) <= gate.x && Math.max(p.x, route.points[i - 1].x) >= gate.x && route.points[i - 1].y === gate.y)), `VLAN ${a} to ${b} passes the gate at ${gate.x},${gate.y}`);
    assert.deepEqual(route.points[0], { x: from.place.x, y: from.place.y });
    assert.deepEqual(route.points.at(-1), { x: to.place.x, y: to.place.y });
  }
  const e = extent(layout);
  assert(e.x1 - e.x0 < 100 && e.y1 - e.y0 < 70, 'The desktop diagram stays compact enough to frame');
});

test('the scene uses diagram mode: core router wording, no tether from the core, labels and the model\'s colours', () => {
  assert.match(scene, /from '\.\/topology-diagram\.js'/);
  assert.doesNotMatch(scene, /glass layer floating/, 'The floating glass layer is gone');
  // The core router has no dashed line down to the building until the owner decides where the router VM runs.
  assert.match(scene, /filter\(id=>id!=='core'&&objects\.get\(id\)\?\.logical/);
  // Cards use the model's VLAN colours, never a hard-coded palette.
  assert.match(scene, /drawCard\(ctx,PX,card,vlan,systemNames/);
  assert.equal(facilities.find(f => f.id === 'core').name, 'Core switch stack', 'The building keeps its core switch stack until the owner decides (open question)');
});
