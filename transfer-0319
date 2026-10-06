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
    const w = kind === 'workstations' ? 20 : kind === 'desks' ? 15 : 7.6;
    const d = kind === 'workstations' ? 12 : kind === 'desks' ? 11 : 7.2;
    return {...vlan, x, z, rack, kind, w, d};
  });
}

export function equipmentPosition(zone, index) {
  if (zone.kind === 'rack') return [zone.x, 9.1 - index * 2.05, zone.z];
  if (zone.kind === 'desks') return [zone.x + (index - 1) * 4.4, .3, zone.z];
  return [zone.x, .3, zone.z];
}
