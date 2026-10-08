// Presentation coordinates only. VLANs and service identities remain in architecture.js.
const locations = {
  v10: [-17, -12, 'R01', 'rack'],
  v20: [-8, -12, 'R02', 'rack'],
  v30: [1, -12, 'R03', 'rack'],
  v40: [10, -12, 'R04', 'rack'],
  v50: [-17, 8, 'R05', 'rack'],
  v70: [-8, 8, 'R06', 'rack'],
  v60: [24, -12, 'ADMIN', 'desks'],
  v80: [-16, 30, 'WORKSTATIONS', 'workstations'],
};

export const roomBounds = {min: [-28, 0, -24], max: [34, 17, 40]};
export const facilityPositions = {core: [1, 8], media: [3, 30], backup: [24, 30]};
export const offlinePosition = [24, 8];

export function dataCenterLayout(vlans) {
  return vlans.map(vlan => {
    const [x, z, rack, kind] = locations[vlan.id];
    const w = kind === 'workstations' ? 20 : kind === 'desks' ? Math.max(15, vlan.ids.length * 4.2 + 2.6) : 7.6;
    const d = kind === 'workstations' ? 12 : kind === 'desks' ? 11 : 7.2;
    return {...vlan, x, z, rack, kind, w, d};
  });
}

// Rack slot heights: four servers keep the original spacing; a fifth tightens the spacing to fit above the base unit.
export const rackSlots = count => count > 4 ? Array.from({length: count}, (_, i) => 9.7 - i * 1.85) : Array.from({length: count}, (_, i) => 9.1 - i * 2.05);

export function equipmentPosition(zone, index) {
  if (zone.kind === 'rack') return [zone.x, rackSlots(zone.ids.length)[index], zone.z];
  if (zone.kind === 'desks') return [zone.x + (index - (zone.ids.length - 1) / 2) * 4.2, .3, zone.z];
  return [zone.x, .3, zone.z];
}
