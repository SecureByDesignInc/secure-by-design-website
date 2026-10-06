# Inside the Network

October 3 presentation update: removed the RMF lifecycle strip, handlers, retired styles, categorization/authorization process material, and repeated educational/illustrative disclaimer labels. NIST security-control mappings, technical sources, protocols, security procedures, and validation requirements remain. The independent RMF section is unchanged. The lifecycle descriptions below record the earlier iteration, not the current interface.

Published at `/inside-the-network`; the shared site header and navigation surround the same-origin model at `/inside-network-model/model.html`.

The October 3, 2026 motion concept replaces the previous model with detailed 3D equipment, animated request paths, guided camera movement, and six technical sequences: sign-in, file access, updates, log collection, licensing, and offline certificate operations. `inventory.js` retains the supplied systems and illustrative NIST notes; `technical.js` holds services, dependencies, assumptions, and primary-source references. Protocols are teaching examples, not configuration evidence or a complete firewall policy. The offline root CA never has an animated network path.

The inspector and sequence controls are keyboard accessible. Motion can be disabled and reduced-motion preferences are honored on load. The same-origin height message lets the mobile frame expand as inspector content changes. Fullscreen presentation mode supports screen recording; Export 4K downloads the current 3D scene as a 3840 × 2160 PNG.

Three.js and OrbitControls are served locally under the bundled MIT license. No external graphics CDN or model telemetry is used. Keep the existing shared header proportions and global navigation unchanged when revising this page.

## Detailed reference architecture

The expanded motion model uses `architecture.js` for eight color-coded VLANs, reference subnets and host addresses, functions, control relationships, offline processes, and the seven RMF steps. The original sixteen systems and fifty workstations remain; three explicitly identified planning roles from the supplied diagrams add certificate-template administration, an internal Apache web server, and management tools. Certificate templates remain directory objects, not a separate database hosted by the administrative workstation. The Linux repository receives an illustrative VLAN 70 address; the strengthened design assigns 50 workstations to VLAN 80 with a proposed 10.0.80.100–149 pool. Three scoped administration hosts and an internal time server extend the model.

The scene adds a two-switch core, internal topology traces, an air-gap perimeter, separate import/export workstations, and offline backup media. Traffic between segments is illustrated through the core; topology traces do not mean traffic is allowed. The root remains non-domain-joined with no network address, uplink, or packet animation. Manual transfers replace the references' superseded data-diode annotations; Revision 5 remains the control catalog. The 2016 JSIG's Revision 4 basis remains distinct, and mappings are educational rather than an approved baseline.

VLAN, facility, control-family, individual-control, system, and RMF selections share the existing inspector and camera. Overview clears flow emphasis; pause/reduced-motion and 4K export remain available. The embedded model reports its full height on desktop and mobile so added detail is not clipped. Shared navigation and the separate coming-soon RMF system page are unchanged.

Run `node scripts/check-network-architecture.mjs` for membership/address consistency, complete control references, valid scenario endpoints, offline-root isolation, and lifecycle order. Browser checks should cover segment/system selection, control highlighting, manual and live sequences, viewport resizing, and WebGL fallback.

## Security design implementation

The eight review priorities are implemented in the website model through `security.js` and `security-ui.js`: explicit traffic decisions, scoped privileged access, host isolation, manual media custody, PKI safeguards, protected audit/time, disconnected maintenance, and recovery exercises. The policy explorer evaluates model data only and sends no network probes. Unknown service dependencies remain blocked pending validation; the matrix is deliberately not an importable production ruleset. Downloads contain the traffic CSV and an implementation plan with owner roles, proposed cadences, acceptance checks, media records, recovery records, and assessment fields. No results are pre-marked as assessed or compliant.

The user confirmed one server instance each for Splunk, Tenable/Nessus, and Trellix ePO/DLP. Preserve these constraints: no cluster, standby, or extra product nodes. AUDIT01 is separate retained storage, not a Splunk replica. Model recovery from protected backups and vendor-supported recovery material, including log queues, deferred scans, and verification of agent behavior during an ePO/DLP outage. Do not invent application/database co-location requirements.

Added planning nodes are TIME01, ADMIN-SRV01, and ADMIN-PC01. The existing jump box is scoped to identity/PKI. Host rules and separate identities enforce the three administration scopes inside VLAN 60. This is an example design; no real system was configured. Current acceptance tests also verify policy outcomes and offline-root isolation.

## Data-center equipment view — October 5, 2026

The user requested a realistic data-center appearance while retaining the motion graphics. The locally modeled room now includes rack cabinets, server chassis and drive bays, switch ports and cable runs, raised floor tiles, cooling and overhead lighting, administration desks, and a separate workstation area. Root CA and backup equipment remain physically separate and uncabled. The architecture still owns every system identity, address, service, policy, and scenario. Hardware vendors, virtualization products, and physical host assignments are not supplied; do not invent those as inventory facts. Rack positions are presentation coordinates.

`data-center-layout.js` owns room placement. `equipment.js` builds unbranded equipment and batches static metalwork using instancing. `scene.js` preserves orbit/zoom, keyboard selection, guided camera motion, traffic packets, reduced-motion support, labels, presentation mode, and 4K export. The selected server is outlined at its actual scene position; system details identify its room location. Existing architecture checks now also validate complete equipment coverage and distinct, in-bounds positions. Browser QA is unavailable in this managed environment without the control-browser skill; source, geometry, and build checks are used, with the visual verification limit reported.

## Review and browser verification — October 6, 2026

`node scripts/check-network-browser.mjs` serves `public/` locally and drives the model in headless Chromium. It selects all six processes and their steps, every system and VLAN, and opens the protocol reference. It also verifies a 3840 × 2160 PNG export, mobile width, reduced motion, and the WebGL fallback, and it fails on console errors, warnings, or missing files. It skips when Playwright is not installed; set `PLAYWRIGHT_MODULE` to use a global installation.

Control titles were checked against NIST's OSCAL SP 800-53 Rev. 5 catalog: all 47 controls exist, none are withdrawn, and enhancements use the official “Base | Enhancement” titles. Domain controller services and the protocol reference follow Microsoft's AD port reference and Windows service and port requirements; they list core client-to-DC services, not a complete firewall profile. `scripts/prepare-network-text.mjs` writes `content/inside-the-network.json` for the text version on `/inside-the-network`. Rerun it, or `pnpm dev` / `pnpm build`, whenever model data changes.
