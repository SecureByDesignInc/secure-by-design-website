// Builds the text version of Inside the Network from the same modules the 3D model uses,
// so /inside-the-network has readable, indexable content that stays in sync with the model.
import { writeFileSync } from 'node:fs';
import { inventory } from '../public/inside-network-model/inventory.js';
import { vlans, buildArchitectureNodes, additionalControls } from '../public/inside-network-model/architecture.js';
import { scenarios, whatIfs, technical, protocols } from '../public/inside-network-model/technical.js';
import { locationText, hosts, rooms, racks } from '../public/inside-network-model/data-center-layout.js';

const controls = { ...inventory.controls, ...additionalControls };
const nodes = buildArchitectureNodes(inventory.nodes);
const byId = new Map(nodes.map(node => [node.id, node]));
const name = id => {
  if (!byId.has(id)) throw new Error(`Unknown system ${id}`);
  return byId.get(id).name;
};
const control = id => {
  if (!controls[id]) throw new Error(`Unknown control ${id}`);
  return { id, title: controls[id][0] };
};
const vlanFor = id => vlans.find(vlan => vlan.ids.includes(id));
const order = [...vlans.flatMap(vlan => vlan.ids), ...nodes.filter(node => !vlanFor(node.id)).map(node => node.id)];

const systems = order.map(id => {
  // Mirrors the model inspector's fallback in app.js for systems without technical detail.
  const node = byId.get(id), vlan = vlanFor(id);
  const detail = technical[id] ?? { purpose: node.known, services: [{ name: node.role, port: 'Listeners to define', note: '' }] };
  return {
    id,
    name: node.name,
    role: node.role,
    segment: vlan ? `VLAN ${vlan.number} · ${vlan.name}` : 'Offline · not domain-joined',
    address: node.address ?? 'No network address (offline)',
    location: locationText(id),
    purpose: detail.purpose,
    services: detail.services.map(({ name, port, note }) => ({ name, port, note: note ?? '' })),
    controls: node.controls.map(control),
  };
});

const segments = vlans.map(vlan => ({
  number: vlan.number,
  name: vlan.name,
  subnet: vlan.subnet,
  boundary: vlan.boundary,
  systems: vlan.ids.map(name),
  controls: vlan.controls.map(control),
}));

const sequenceText = scenario => ({
  id: scenario.id,
  label: scenario.label,
  title: scenario.title,
  caption: scenario.caption,
  steps: scenario.steps.map(step => ({
    title: step.title,
    from: step.from ? name(step.from) : 'Authorized operator',
    to: name(step.to),
    protocol: step.protocol,
    description: step.description,
    // Attack-drill steps name the acceptance test they replay; other steps leave this empty.
    test: step.test ?? '',
  })),
});
const processes = scenarios.map(sequenceText);
const whatIfText = whatIfs.map(sequenceText);

const reference = protocols.map(([service, transport, meaning]) => ({ service, transport, meaning }));

const offline = systems.filter(system => !vlanFor(system.id)).map(system => system.name);
// The building and its hosting, from the same layout the 3D room uses.
const building = {
  rooms: rooms.filter(room => room.name).map(room => ({ name: room.name[0] + room.name.slice(1).toLowerCase(), detail: room.sub })),
  hosts: hosts.map(host => ({ name: host.name, rack: racks.find(rack => rack.id === host.rack).code, systems: host.vms.map(name) })),
};
const text = { building, systems, segments, processes, whatIfs: whatIfText, protocols: reference, offline, controlCount: Object.keys(controls).length };
writeFileSync(new URL('../content/inside-the-network.json', import.meta.url), JSON.stringify(text, null, 2) + '\n');
console.log(`Prepared Inside the Network text: ${systems.length} systems, ${segments.length} VLANs, ${processes.length} traffic processes.`);
