// Presentation coordinates only. VLANs and service identities remain in architecture.js.
// One unit is about 0.2 m. The building follows a small-enterprise floor plan: a locked server room,
// an administration room, an office, and a media room with an offline vault behind it, off one corridor.
// Hardware is vendor neutral: hypervisor hosts, a network rack, in-row cooling, and power, with no makes or models.

export const roomBounds = {min: [-30, 0, -26], max: [46, 15, 44]};

// x0..x1 by z0..z1. Doors sit in the wall named by `wall` (n = low z, s = high z), centred on `at`.
export const rooms = [
  {id:'server', name:'SERVER ROOM', sub:'Badge access · logged entry', x0:-30, x1:20, z0:-26, z1:4, door:{wall:'s', at:15, badge:true}, floor:'raised', sign:[15,-1.2]},
  {id:'admin', name:'ADMINISTRATION', sub:'Tiered admin seats', x0:20, x1:46, z0:-26, z1:4, door:{wall:'s', at:25, badge:true}, floor:'carpet', sign:[37,0]},
  {id:'corridor', name:'', x0:-30, x1:46, z0:4, z1:12, floor:'concrete'},
  {id:'office', name:'OFFICE', sub:'50 user workstations', x0:-30, x1:20, z0:12, z1:44, door:{wall:'n', at:11}, floor:'carpet', sign:[-5,15.4]},
  {id:'media', name:'MEDIA ROOM', sub:'Controlled import and export', x0:20, x1:46, z0:12, z1:24, door:{wall:'n', at:25, badge:true}, floor:'vault', sign:[40,14.4]},
  {id:'vault', name:'OFFLINE VAULT', sub:'No network cabling', x0:20, x1:46, z0:24, z1:44, door:{wall:'n', at:38, badge:true}, floor:'vault', sign:[33,42]}
];

// Two rack rows share a contained cold aisle (z -13.9 to -6.1). Row A faces the aisle (+z); row B is turned around.
export const coldAisle = {x0:-24.6, x1:10.6, z0:-13.9, z1:-6.1};
export const racks = [
  {id:'r01', code:'R01', kind:'network', x:-21, z:-17, row:'A', name:'NETWORK CORE'},
  {id:'r02', code:'R02', kind:'compute', x:-14, z:-17, row:'A', name:'HYPERVISOR HOSTS', label:'Hypervisor hosts', sub:'SBD-HV01 · HV02 · HV03'},
  {id:'cool-a', code:'CRAC', kind:'cooling', x:-7, z:-17, row:'A'},
  {id:'r03', code:'R03', kind:'compute', x:0, z:-17, row:'A', name:'HYPERVISOR HOSTS', label:'Hypervisor hosts', sub:'SBD-HV04 · SBD-HV05'},
  {id:'r04', code:'R04', kind:'compute', x:7, z:-17, row:'A', name:'HYPERVISOR HOSTS', label:'Hypervisor hosts', sub:'SBD-HV06 · SBD-HV07'},
  {id:'ups-1', code:'UPS', kind:'ups', x:-21, z:-3, row:'B'},
  {id:'r05', code:'R05', kind:'reserved', x:-14, z:-3, row:'B', name:'RESERVED'},
  {id:'cool-b', code:'CRAC', kind:'cooling', x:-7, z:-3, row:'B'},
  {id:'r06', code:'R06', kind:'reserved', x:0, z:-3, row:'B', name:'RESERVED'},
  {id:'pdu-1', code:'PDU', kind:'power', x:7, z:-3, row:'B'}
];

// Each server runs as a virtual machine on a hypervisor host. Each domain controller has a host of its own,
// and the issuing CA (with its template administration host) runs on a third, so no CA shares a host with a DC. Servers that talk within one VLAN share a host,
// so that traffic stays on the host's virtual switch.
export const hosts = [
  {id:'hv01', name:'SBD-HV01', rack:'r02', y:7.9, vms:['dc1']},
  {id:'hv02', name:'SBD-HV02', rack:'r02', y:5.75, vms:['dc2']},
  {id:'hv03', name:'SBD-HV03', rack:'r02', y:3.6, vms:['subca','templates']},
  {id:'hv04', name:'SBD-HV04', rack:'r03', y:7.9, vms:['dhcp','syslog','wsus']},
  {id:'hv05', name:'SBD-HV05', rack:'r03', y:5.75, vms:['fs','sql','apps','web']},
  {id:'hv06', name:'SBD-HV06', rack:'r04', y:7.9, vms:['splunk','nessus','epo','audit']},
  {id:'hv07', name:'SBD-HV07', rack:'r04', y:5.75, vms:['management','repo']}
];
// Rack appliances that are systems in the model (none at present; every server is a virtual machine).
export const appliances = [];

export const hostHeight = 1.55, tileWidth = 1.24, tileGap = .1;
const rackOf = id => racks.find(r => r.id === id);
export function tileOffset(host, index) {
  const n = host.vms.length, span = n * tileWidth + (n - 1) * tileGap;
  return -span / 2 + tileWidth / 2 + index * (tileWidth + tileGap);
}
// Rack fronts (row A) are at z = rack.z + 2.85; faceplates sit just behind the door frame.
export const faceZ = 2.53;

// Office: twelve representative desks stand in for fifty. The highlighted user sits at `activeDesk`;
// `peerDesk` is the neighbour used by the peer-to-peer what-ifs.
export const deskScale = 2;
export const officeDesks = [20, 29, 38].flatMap(z => [-22, -12, -2, 8].map(x => [x, z]));
export const activeDesk = 6, peerDesk = 7;
export const seatedDesks = [0, 2, 3, 5, 6, 7, 9, 10];
export const adminDesks = {jump:[27, -18], jump1:[35, -18], jump2:[42, -18]};
export const idfPosition = [17, 14.4];

// Offline equipment: the media station in the media room; the root CA and backups in the vault.
export const facilityPositions = {core:[-21, -17], media:[33, 17], backup:[28, 32]};
export const offlinePosition = [40, 32];

// Overhead cable trays (y = trayHeight). Nodes are [x, z]; edges are trays. The vault and media room have none.
export const trayHeight = 13.2;
export const trayNodes = {
  cw:[-26, 8], csrv:[12, 8], cidf:[17, 8], cadm:[33, 8], ce:[40, 8],
  feed:[12, -15.5], a1:[-21, -15.5], a2:[-14, -15.5], a3:[0, -15.5], a4:[7, -15.5],
  adm:[33, -15], adm0:[27, -15], adm1:[35, -15], adm2:[42, -15],
  spine:[17, 14.4], o1:[17, 20], o2:[17, 29], o3:[17, 38]
};
export const trayEdges = [
  ['cw','csrv'], ['csrv','cidf'], ['cidf','cadm'], ['cadm','ce'],
  ['csrv','feed'], ['feed','a4'], ['a4','a3'], ['a3','a2'], ['a2','a1'],
  ['cadm','adm'], ['adm','adm0'], ['adm','adm1'], ['adm1','adm2'],
  ['cidf','spine'], ['spine','o1'], ['o1','o2'], ['o2','o3']
];
export const rackTray = {r01:'a1', r02:'a2', r03:'a3', r04:'a4'};
export const deskRowTray = {20:'o1', 29:'o2', 38:'o3'};
export const adminTray = {jump:'adm0', jump1:'adm1', jump2:'adm2'};
export const hubPoint = [-21, 9.3, -13.1];

// Walking routes for carried media, through the doors. Each room lists the points from inside it to the corridor
// (or, for the vault, to the media room it opens into).
export const walkExits = {
  server:{points:[[12, -10], [15, 1]], out:[15, 8], parent:'corridor'},
  media:{points:[[25, 15.2]], out:[25, 8], parent:'corridor'},
  vault:{points:[[38, 26.6]], out:[38, 21.4], parent:'media'}
};
export const walkPoints = {media:[33, 21.4], root:[40, 35.6], backup:[28, 35.6]};

// Where every system lives: the zone carries the room or rack label; the VLAN stays the logical segment.
export function placements() {
  const out = new Map();
  for (const host of hosts) host.vms.forEach((id, slot) => out.set(id, {kind:'vm', host, slot, rack:rackOf(host.rack), zone:host.rack, room:'server'}));
  for (const a of appliances) out.set(a.id, {kind:'appliance', rack:rackOf(a.rack), y:a.y, zone:a.rack, room:'server'});
  for (const [id, [x, z]] of Object.entries(adminDesks)) out.set(id, {kind:'desk', x, z, zone:'admin', room:'admin'});
  out.set('workstations', {kind:'office', zone:'office', room:'office'});
  out.set('root', {kind:'offline', x:offlinePosition[0], z:offlinePosition[1], zone:'vault', room:'vault'});
  return out;
}
export const zoneLabels = [
  ...racks.filter(r => r.label).map(r => ({id:r.id, title:`${r.code} · ${r.label}`, sub:r.sub, position:[r.x, 13.1, r.z]})),
  {id:'admin', title:'Administration room', sub:'VLAN 60 · three admin seats', position:[34.5, 7.6, -18]},
  {id:'office', title:'Office', sub:'VLAN 80 · 50 workstations', position:[-7, 9.6, 29]}
];

// Plain-language location for the system inspector.
export function locationText(id) {
  const p = placements().get(id);
  if (!p) return 'Offline vault · secure cabinet';
  if (p.kind === 'vm') return `Virtual machine on ${p.host.name} · rack ${p.rack.code} · server room`;
  if (p.kind === 'appliance') return `Rack appliance · ${p.rack.code} · server room`;
  if (p.kind === 'desk') return 'Administration room · dedicated admin seat';
  if (p.kind === 'office') return 'Office · user desks';
  return 'Offline vault · secure cabinet';
}
