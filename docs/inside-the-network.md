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

A seventh process, “Use a web app”, follows a workstation through internal DNS (F01) and HTTPS to SBD-WEB01 (F13), including client-side certificate validation against the internal PKI. It introduces no new systems or permitted flows. `check-network-relationships.mjs` asserts that all three steps map to permitted rules.

## Motion, what-ifs, links, checks, and clips — October 6, 2026

Main-scene motion now follows `flow-policy.js`: permit badges at the core, amber gates for pending rules, red gates for denials, replies, UDP pulses, TLS and signed markers, and amber custody walks for manual transfers. Four what-if sequences live in `technical.js` (`whatIfs`, combined with the processes as `sequences`). `courses.js` holds course links, and `knowledge-checks.js` holds the per-process questions. `recorder.js` records clips through a 2D compositing canvas fed by the scene's frame hook, and the scene's `setOutput` renders at the clip size. The scene pauses rendering when off screen.

`check-network-architecture.mjs` now validates every sequence's endpoints, wire fields, custody-walk routes, what-if outcomes, course links, and knowledge-check answers. `check-network-relationships.mjs` covers the what-if flows. `check-network-browser.mjs` adds what-ifs, policy labels, knowledge checks, shareable links, and a recorded clip.

## Visual and interaction upgrade — October 6, 2026

`scene.js` was rebuilt around the same public API, with additions for the new features: `setView`, `setTheme`, `setCameraMode`, `setStepSeconds`, `showConnections`, `inspectPacket`, `releasePacket`, and `setReserved`.

- **Routes and packet timing.** Routes are polylines (`Route`) through the overhead cable trays to the core switch. Packets follow fixed timelines: travel, a dwell at the core, or a hold and a drop at a gate. Their speed adapts so the first packet finishes within the step length.
- **Labels.** Labels are screen-space sprites redrawn at their on-screen pixel size, including 4K export and recording sizes. A per-frame placement pass orders them by priority and moves crowded labels up on leader lines.
- **See-through equipment.** `equipment.batch` returns a fade registry. Batched instances dither through an `aFade` instance attribute, and the scene fades the groups that block the camera's view of the active systems.
- **Logical view.** The logical view (VLAN islands, a hexagonal core, and the separate offline area) lives in its own group. A 1.6-second morph fades the room while each system's role icon travels from its rack to its island.
- **Bloom.** The cinematic look's bloom lazy-loads three.js r186 post-processing, vendored under `vendor/postprocessing` and `vendor/shaders` (MIT).
- **App and content modules.** `packets.js` describes one packet per networked step. `app.js` adds hover tooltips, the packet card, the connection list, and the view and look toggles. The attack drill is a what-if in `technical.js` with `drill:true` and per-step `test` text.
- **Recording.** `recorder.js` adds the step length, title and end cards, the follow camera, and the cinematic look. With cards, the last step holds behind the end card before the clip ends.

`check-network-architecture.mjs` now also checks the drill outcomes and rules, that each drill step replays a documented acceptance test, and that every networked step has a packet profile and card. `check-network-browser.mjs` also exercises the drill scorecard, packet inspection by button and by selecting a packet in the 3D view, hover tooltips, readable rack names, the connection map, the logical view and its link, the cinematic look, and clips with cards. Its URL adds `?qa`, which exposes read-only test helpers (packet, equipment, and label screen positions) as `window.insideNetworkQA`.

## Learning pass — October 7, 2026

`scene.js` adds screen-space traffic lines (`screenLine`, a fixed pixel width that scales with recording and export size), minimum packet sizes, endpoint rings, and the `guided` camera mode (now the default; `setCameraMode` also accepts `wide` and `follow`, and `getCameraMode` reports it). `setLabelMode('focus'|'all'|'off')` replaces the on/off label switch (`setLabels` still maps to focus/off). `equipment.js` adds a per-instance `aDim` attribute and `setDim`, which darken equipment outside the current step without making it see-through. `labelTexture` widens a label to fit its text, and `screenLabel` scales its on-screen size by the same factor. In `app.js`, choosing a process calls `revealStage()`, and the stage caption hosts `#stageDescription`, `#stageBack`, `#stagePlay`, `#stageNext`, and `#stageCounter`. Clips use the guided camera unless the close-up option is checked. `check-network-browser.mjs` covers the stage staying in view, the on-stage controls, focused labels, and the label and follow toggles.

## Architecture review changes — October 7, 2026

The policy register now gives every domain member its domain paths (F01–F03, F03 permitted with the full AD profile) and revocation data (F18), patches every Windows system (F06) and the domain-joined Linux servers (F19, from SBD-REPO01), forwards Windows events (F17) and Linux syslog (F07), completes the log chain (F10, F11), and admits VLAN 80 devices with 802.1X through the NPS role on the existing SBD-DHCP01 (F20). Tier 0 (A01) covers the DC-facing scopes of WSUS, ePO, Nessus, and Splunk. A practice, “Protect the network's own management”, was added, and twelve baseline controls were mapped (AU-2, AU-3, AU-9(4), IA-3, IA-2(2), AC-6(5), SC-13, SC-22, SC-23, SI-4(2), SI-4(4), PL-2), with PL added as a control family. No systems were added.

SBD-AUDIT01 is domain-joined Windows. `architecture.js` applies role changes to existing systems through `roleChanges` (NPS on SBD-DHCP01). `security.js` exports `windowsMembers`, `linuxMembers` (Splunk and Nessus), and `domainMembers`, which the rules use. Steps may set `service` to name their policy service directly (`flow-policy.js`). The architecture check asserts the new paths, the Tier 0 scope, and that the system count is unchanged; the browser check expects four steps in “Use a web app”.

## Optional traffic walkthroughs — October 7, 2026

Startup calls `architectureOverview()` instead of selecting a system. The scenario cards and `#processPlayback` sit inside `<details id="trafficSection">`. `setProcessMode(on)` in `app.js` toggles `body.process-active`, which shows the playback panel, the Flow details tab, and the flow-only stage tools; leaving a process clears the selected card. `applyHash` opens the section for process links. The browser check asserts the collapsed default, the hidden flow-only controls, and that process links open the section.
