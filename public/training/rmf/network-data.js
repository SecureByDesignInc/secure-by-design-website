// The authorization view beside each module: the Inside the Network system as eight VLANs plus the
// offline root CA, drawn by the course guides' 3D scene (public/training/guide/scene.js). A node's focus
// lists the module indexes (0 = module 01) that highlight it; a flow's lessons list the modules that draw
// it. Denied flows are the attack drill's refused attempts; final flows show in the whole-boundary view.
// Keep names and roles in step with content/inside-the-network.json and the module content.
window.RMF_NETWORK = {
  scene: {
    tag: 'Authorization boundary',
    label: 'Interactive 3D view of the authorization boundary: the eight VLANs of the Secure By Design network and the offline root CA, highlighting the parts each module works with.',
    finalOnly: true,
    // Viewed from the front and a little higher than the course guides, so the two rows of four and five read clearly.
    zoom: 1.12,
    camera: [0, 21, 25],
    completeStatus: 'The whole boundary',
    completeCaption: 'The whole network in one view: eight VLANs and the offline root CA. The package describes all of it, and an authorization decision covers the system as a whole.',
    nodes: [
      { id: 'v10', name: 'VLAN 10', sub: 'Domain controllers', kind: 'server', row: 'back', button: 'VLAN 10', focus: [0, 1, 2, 3, 4, 7, 9, 10],
        title: 'VLAN 10 · Domain controllers',
        description: 'SBD-DC01 and SBD-DC02 hold the directory, DNS and domain time, with SBD-DC01 as the reliable time source. Account management and authentication evidence starts here.' },
      { id: 'v20', name: 'VLAN 20', sub: 'Identity & services', kind: 'server', row: 'back', button: 'VLAN 20', focus: [0, 1, 3, 4, 5, 8, 9, 10, 11],
        title: 'VLAN 20 · Identity & services',
        description: 'SBD-DHCP01 hands out addresses and runs 802.1X admission, SBD-SYSLOG01 collects the network’s events, and SBD-WSUS01 distributes approved Windows updates.' },
      { id: 'v30', name: 'VLAN 30', sub: 'PKI infrastructure', kind: 'server', row: 'back', button: 'VLAN 30', focus: [0, 1, 4, 9, 10],
        title: 'VLAN 30 · PKI infrastructure',
        description: 'SBD-SUBCA01 issues the network’s certificates, and SBD-PKI-MGMT01 publishes revocation information at pki.sbd.test and administers the certificate templates.' },
      { id: 'v40', name: 'VLAN 40', sub: 'Servers & data', kind: 'server', row: 'back', button: 'VLAN 40', focus: [0, 1, 2, 4, 7, 9, 10],
        title: 'VLAN 40 · Servers & data',
        description: 'SBD-FS01, SBD-SQL01, SBD-APPS01 and SBD-WEB01 run the business services. Their files and records are central to categorization.' },
      { id: 'v50', name: 'VLAN 50', sub: 'Security & monitoring', kind: 'server', row: 'back', button: 'VLAN 50', focus: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        title: 'VLAN 50 · Security & monitoring',
        description: 'SBD-AUDIT01 keeps the protected audit record and SBD-SPLUNK01 the searchable working copy. SBD-NESSUS01 and SBD-EPO01 are planned here; their courses are coming soon.' },
      { id: 'v60', name: 'VLAN 60', sub: 'Tiered administration', kind: 'workstation', row: 'front', button: 'VLAN 60', focus: [0, 1, 4, 5, 6, 7, 9, 10],
        title: 'VLAN 60 · Tiered administration',
        description: 'AdminJumpBox01 (Tier 0), SBD-ADMIN-SRV01 (Tier 1) and SBD-ADMIN-PC01 (Tier 2) are where administrators work, where the SCAP Compliance Checker runs, and where the evidence folders are kept.' },
      { id: 'v70', name: 'VLAN 70', sub: 'Management tools', kind: 'server', row: 'front', button: 'VLAN 70', focus: [0, 1, 3, 4, 6, 8, 9, 10, 11],
        title: 'VLAN 70 · Management tools',
        description: 'SBD-MGMT01 keeps the living inventory, and SBD-REPO01 serves verified packages to the Red Hat Enterprise Linux servers.' },
      { id: 'v80', name: 'VLAN 80', sub: 'User workstations', kind: 'fleet', row: 'front', button: 'VLAN 80', focus: [0, 1, 4, 7, 9, 10, 11],
        title: 'VLAN 80 · User workstations',
        description: 'Fifty Windows PCs, admitted by 802.1X with machine certificates. The people the mission depends on work here.' },
      { id: 'root', name: 'SBD-ROOTCA01', sub: 'Offline root CA', kind: 'offline', row: 'front', button: 'Root CA', focus: [0, 1, 4, 9, 10],
        title: 'SBD-ROOTCA01 · Offline root CA',
        description: 'Never connected to the network, so it is assessed during its key ceremonies. The package records that as an assessment limitation, not a missing test.' },
    ],
    flows: [
      { from: 'v80', to: 'v40', lessons: [0, 1, 2, 4, 10], final: true },
      { from: 'v80', to: 'v10', lessons: [1, 4], final: true },
      { from: 'v10', to: 'v20', lessons: [3, 5, 6, 11], final: true },
      { from: 'v20', to: 'v50', lessons: [3, 5, 6, 8, 11], final: true },
      { from: 'root', to: 'v30', lessons: [1, 9], offline: true },
      { from: 'v70', to: 'v20', lessons: [8] },
      { from: 'v80', to: 'v40', lessons: [7], denied: true },
      { from: 'v80', to: 'v50', lessons: [7], denied: true },
      { from: 'v60', to: 'v10', lessons: [7], denied: true },
      { from: 'v20', to: 'v80', lessons: [11] },
      { from: 'v70', to: 'v40', lessons: [11] },
    ],
  },
  // One entry per module, in catalog order.
  modules: [
    {
      "status": "One system · one mission",
      "caption": "Everything you built in Build the Network is one system with one mission. Course 2.1 takes it through Prepare, Categorize, and Select, so every later record and the authorizing official’s decision rest on the same defined system."
    },
    {
      "status": "Drawing the boundary",
      "caption": "Draw the boundary around the eight VLANs and the offline root CA, then trace each information flow across it. The hypervisor hosts, shared services and offline media transfers each need a recorded decision: inside, external, or inherited."
    },
    {
      "status": "Information and impact",
      "caption": "Categorization starts with the information: business files and databases on VLAN 40, the identities in the directory, and the audit record on VLAN 50. Availability follows the mission processes that depend on them."
    },
    {
      "status": "Where controls land",
      "caption": "Each practice control lands on real systems: account management (AC-2) on the domain controllers, audit (AU-2, AU-6, AU-12) on the collector and VLAN 50, and flaw remediation (SI-2) through SBD-WSUS01 and SBD-REPO01. The traceability matrix records who implements each one."
    },
    {
      "status": "The system as built",
      "caption": "The system security plan describes this network as it is: each VLAN and its systems, the administration tiers, and the permitted paths between them. Every implementation statement names who does what, where, and when."
    },
    {
      "status": "Evidence from the systems",
      "caption": "Proof comes from the systems themselves: SCAP Compliance Checker results and STIG checklists from the administration seats, log review records from SBD-SPLUNK01, and the course 1.19 restore record."
    },
    {
      "status": "What the assessor receives",
      "caption": "The assessor works from records you already keep: the evidence folders on the administration seats, the protected archive on SBD-AUDIT01, and the living inventory on SBD-MGMT01. The assessment plan names which records and systems each procedure covers."
    },
    {
      "status": "Testing what should fail",
      "caption": "Assessment tests what should fail as well as what should work. The attack drill’s six attempts should all be refused; the three that cross VLANs are drawn here: a PC to SQL, a PC to Splunk, and a stolen session on SBD-ADMIN-PC01 aimed at a domain controller."
    },
    {
      "status": "A finding close to home",
      "caption": "The worked finding is in this network: SBD-MGMT01 missing from verified audit collection. The POA&M entry restores collection, retests the selected event, and keeps the original result until the retest verifies the fix."
    },
    {
      "status": "One consistent package",
      "caption": "The package has to agree with itself: 21 named systems and 50 workstations in the SSP, and an assessment that explains why the offline root CA is tested only during its key ceremonies."
    },
    {
      "status": "The decision",
      "caption": "The Authorizing Official decides for the whole system, not one server at a time. The briefing explains what this network enables, the risk that remains, and the conditions and monitoring that would come with an authorization."
    },
    {
      "status": "Keeping it current",
      "caption": "Monitoring keeps the package true: Splunk review and alerts, updates through SBD-WSUS01 and SBD-REPO01, and the inventory on SBD-MGMT01. A missed update goes to remediation and the status report; a new component starts a security impact analysis."
    }
  ],
};
