// Browser smoke test for the System Hub (public/inside-network-model/model.html).
// Serves public/ locally, drives the model in headless Chromium, and fails on runtime errors
// or broken interactions. Requires Playwright with Chromium; skips cleanly when unavailable.
//   node scripts/check-network-browser.mjs
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/check-network-browser.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { protocols, scenarios, whatIfs } from '../public/inside-network-model/technical.js';
import { knowledgeChecks } from '../public/inside-network-model/knowledge-checks.js';

let playwright;
try { playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { console.log('Browser checks skipped: Playwright is not installed.'); process.exit(0); }

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.csv': 'text/csv', '.md': 'text/markdown', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://local').pathname)).replace(/^([/\\])+/, '');
  try { const body = await readFile(join(publicDir, path)); res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
// ?qa exposes read-only test helpers (packet, equipment, and label positions); nothing else uses it.
const url = `http://127.0.0.1:${server.address().port}/inside-network-model/model.html?qa`;
let browser;
try { browser = await playwright.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); }
catch (error) { server.close(); console.log(`Browser checks skipped: Chromium could not start (${error.message.split('\n')[0]}).`); process.exit(0); }
const problems = [];

async function open(viewport, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: options.reducedMotion || 'no-preference', acceptDownloads: true });
  if (options.noWebGL) await context.addInitScript(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/i.test(type) ? null : get.call(this, type, ...rest); }; });
  const page = await context.newPage(), label = `${viewport.width}x${viewport.height}`;
  page.on('pageerror', error => problems.push(`${label} page error: ${error.message}`));
  // Without WebGL, Three.js and the model log the expected renderer failure to the console.
  if (!options.noWebGL) page.on('console', message => { if (['error', 'warning'].includes(message.type())) problems.push(`${label} console ${message.type()}: ${message.text()}`); });
  page.on('response', response => { if (response.status() >= 400) problems.push(`${label} HTTP ${response.status()}: ${response.url()}`); });
  await page.goto(url + (options.hash || ''));
  await page.waitForTimeout(1500);
  return { context, page };
}

try {
  // Desktop: every process, step, system, and segment can be selected.
  {
    const { context, page } = await open({ width: 1440, height: 900 });
    assert.equal(await page.locator('#viewport canvas').count(), 1, '3D canvas renders');
    assert.equal(await page.locator('#loading').isVisible(), false, 'Loading message clears');
    // The model opens on the architecture explorer; traffic walkthroughs are an optional, collapsed section.
    assert.equal(await page.locator('#architectureTab').getAttribute('aria-selected'), 'true', 'Opens on the architecture explorer');
    assert.equal(await page.locator('#trafficSection').evaluate(el => el.open), false, 'Traffic walkthroughs start collapsed');
    assert.equal(await page.locator('#flowTab').isHidden(), true, 'Flow details appear only while a process is shown');
    assert.equal(await page.locator('#followToggle').isHidden(), true, 'Flow-only stage tools are hidden until a process is chosen');
    await page.locator('#trafficSection > summary').click();
    assert.equal(await page.locator('#processPlayback').isHidden(), true, 'Playback appears only after a process is chosen');
    assert.equal(await page.locator('#scenarioButtons [aria-current=true]').count(), 0, 'No process is preselected');
    assert.equal(await page.locator('#scenarioButtons button').count(), scenarios.length);
    for (const [index, scenario] of scenarios.entries()) {
      await page.locator('#scenarioButtons button').nth(index).click();
      for (let step = 0; step < scenario.steps.length; step++) await page.locator('#steps button').nth(step).click();
      assert.equal(await page.locator('#stepCounter').textContent(), `Step ${scenario.steps.length} of ${scenario.steps.length}`);
    }
    // Motion and labels follow the policy register.
    await page.locator('#scenarioButtons button').nth(0).click();await page.locator('#steps button').nth(0).click();
    assert.equal(await page.locator('#stageKind').textContent(), 'PERMITTED SERVICE REQUEST', 'The DHCP relay (F04) is shown as a permitted request');
    // Learning view: choosing a process keeps the stage on screen, the step's narration and controls sit on the stage,
    // and only the step's own systems keep labels.
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.locator('#scenarioButtons button').nth(scenarios.findIndex(s => s.id === 'files')).click();
    await page.waitForFunction(() => Math.abs(document.querySelector('.stage').getBoundingClientRect().top) < innerHeight / 2 && document.querySelector('.stage').getBoundingClientRect().top >= -1, null, { timeout: 8000 });
    const stageBox = await page.evaluate(() => { const r = document.querySelector('.stage').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: innerHeight }; });
    assert(stageBox.top >= -1 && stageBox.top < stageBox.height / 2, `Stage is in view after choosing a process (${Math.round(stageBox.top)})`);
    assert.equal(await page.locator('#stageCounter').textContent(), '1 / 3');
    assert.match(await page.locator('#stageDescription').textContent(), /\S/, 'Step narration on the stage');
    await page.locator('#stageNext').click();
    assert.equal(await page.locator('#stepCounter').textContent(), 'Step 2 of 3', 'On-stage controls drive playback');
    await page.waitForTimeout(800);
    const shownZones = await page.evaluate(() => window.insideNetworkQA.labels().filter(l => l.kind === 'zone' && l.show).length);
    assert(shownZones <= 2, `Only the step's segments keep rack labels (${shownZones})`);
    await page.locator('#labels').click();
    assert.equal(await page.locator('#labels .tool-long').textContent(), 'Labels: All');
    await page.waitForTimeout(800);
    assert((await page.evaluate(() => window.insideNetworkQA.labels().filter(l => l.kind === 'zone' && l.show).length)) > shownZones, 'All labels shows the other racks');
    await page.locator('#labels').click();await page.locator('#labels').click();
    assert.equal(await page.locator('#labels .tool-long').textContent(), 'Labels: Focus');
    await page.locator('#followToggle').click();
    assert.equal(await page.locator('#followToggle').getAttribute('aria-pressed'), 'false');
    await page.locator('#followToggle').click();
    // Layout pass: the step diagram, the step's systems in the inspector, pause-after-step, and the Key popover.
    await page.locator('#flowTab').click();
    assert.equal(await page.locator('.ladder-row').count(), scenarios.find(s => s.id === 'files').steps.length, 'Sequence diagram has one row per step');
    assert.equal(await page.locator('.ladder-row.current').getAttribute('data-step'), '1', 'Sequence diagram marks the current step');
    assert.equal(await page.locator('#relationshipView').isHidden(), true, 'Step diagram replaces the relationship thumbnail during walkthroughs');
    await page.locator('.ladder-row').nth(2).click();
    assert.equal(await page.locator('#stepCounter').textContent(), 'Step 3 of 3', 'Diagram rows jump to their step');
    assert.match(await page.locator('#stepSystems').textContent(), /In this step[\s\S]*SBD-FS01/, 'Inspector names the step\'s systems');
    assert.match(await page.locator('#viewport canvas').getAttribute('aria-label'), /step 3 of 3/i, '3D description follows the step');
    assert.equal(await page.locator('#autoAdvance').getAttribute('aria-pressed'), 'false', 'Playback pauses after each step by default');
    await page.locator('#legendToggle').click();
    assert.equal(await page.locator('#sceneKey').isVisible(), true, 'Key opens from the toolbar');
    await page.locator('#legendToggle').click();
    assert.equal(await page.locator('#whatIfButtons button').count(), whatIfs.length);
    for (let i = 0; i < whatIfs.length; i++) {
      await page.locator('#whatIfButtons button').nth(i).click();
      for (let step = 0; step < whatIfs[i].steps.length; step++) await page.locator('#steps button').nth(step).click();
    }
    assert.equal(await page.locator('#stageKind').textContent(), 'DENIED BY POLICY', 'Peer remote desktop is denied');
    // Knowledge check for the web process.
    await page.locator('#scenarioButtons button').nth(scenarios.findIndex(s => s.id === 'web')).click();
    await page.locator('#knowledgeCheck summary').click();
    for (const [i, q] of knowledgeChecks.web.entries()) await page.locator(`input[name="kc-web-${i}"][value="${q.correct}"]`).check();
    assert.equal(await page.locator('#knowledgeStatus').textContent(), `${knowledgeChecks.web.length} of ${knowledgeChecks.web.length} correct`);
    // The attack drill replays the acceptance tests; every attempt is stopped.
    const drillIndex = whatIfs.findIndex(s => s.drill);
    await page.locator('#whatIfButtons button').nth(drillIndex).click();
    assert.equal(await page.locator('#steps button').count(), whatIfs[drillIndex].steps.length);
    await page.locator('#flowTab').click();
    assert.match(await page.locator('.drill-summary').textContent(), /6 of 6/, 'Drill scorecard');
    // Inspect a packet with the keyboard-accessible button, then by selecting one in the 3D view.
    await page.locator('#scenarioButtons button').nth(0).click();
    await page.locator('#steps button').nth(1).click();
    await page.locator('#flowTab').click();
    await page.locator('[data-inspect=request]').click();
    assert.equal(await page.locator('#packetCard').isVisible(), true, 'Packet card opens');
    assert.equal(await page.locator('#packetTitle').textContent(), 'Domain Name System (DNS)');
    assert.match(await page.locator('#packetCard').textContent(), /10\.0\.10\.10[\s\S]*READABLE ON THE WIRE[\s\S]*F01/, 'Packet card shows addresses, what is readable, and the policy decision');
    await page.locator('.packet-close').click();
    assert.equal(await page.locator('#packetCard').isVisible(), false, 'Packet card closes');
    await page.locator('#motion').click();
    await page.evaluate(() => scrollTo(0, 0));
    const packet = (await page.evaluate(() => window.insideNetworkQA.packets()))[0];
    await page.mouse.click(packet.x, packet.y);
    assert.equal(await page.locator('#packetCard').isVisible(), true, 'Selecting a packet in the 3D view inspects it');
    await page.keyboard.press('Escape');
    await page.locator('.packet-close').click().catch(() => {});
    await page.locator('#motion').click();
    // Hover highlights equipment and names it.
    await page.locator('#overview').click();
    await page.waitForTimeout(2600);
    await page.evaluate(() => scrollTo(0, 0));
    // Point at the PCs' own label when it shows; otherwise at the PCs, clear of any label that sits over the office.
    const pcs = await page.evaluate(() => {
      const qa = window.insideNetworkQA, shown = qa.labels().filter(l => l.show && l.rect), c = document.querySelector('#viewport canvas').getBoundingClientRect();
      const own = shown.find(l => l.id === 'workstations');
      if (own) return { x: c.left + (own.rect[0] + own.rect[2]) / 2, y: c.top + (own.rect[1] + own.rect[3]) / 2 };
      const p = qa.project('workstations'), clear = q => !shown.some(l => q.x - c.left >= l.rect[0] - 4 && q.x - c.left <= l.rect[2] + 4 && q.y - c.top >= l.rect[1] - 4 && q.y - c.top <= l.rect[3] + 4);
      return [[0, 0], [0, 24], [0, 44], [-30, 24], [30, 24], [0, -24]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).find(clear) || p;
    });
    await page.mouse.move(pcs.x, pcs.y);
    assert.match(await page.locator('#hoverTip').textContent(), /50 Windows PCs/, 'Hover tooltip');
    await page.mouse.move(2, 2);
    // The overview shows the building alone; the topology diagram waits until something is chosen.
    assert.deepEqual((await page.evaluate(() => window.insideNetworkQA.diagram())).shown, [], 'The overview hides the topology diagram');
    // Opening a VLAN shows only that segment and the core router on the diagram, with the room labels out of the way.
    const diagramShows = async (hash, expected, message) => {
      await page.evaluate(h => { location.hash = h; }, hash);
      await page.waitForFunction(n => { const d = window.insideNetworkQA.diagram(); return d && d.amount > .99 && d.shown.length === n; }, expected.length, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(2600);
      const d = await page.evaluate(() => window.insideNetworkQA.diagram());
      assert.deepEqual(d.shown, expected, `${message} (${d.shown.join(', ')})`);
      assert.equal(d.core, true, `${message}: the core router shows`);
      // Every card stays inside the frame (audit item D11).
      for (const [id, b] of Object.entries(d.cards)) assert(b.x0 >= -1 && b.y0 >= -1 && b.x1 <= d.width + 1 && b.y1 <= d.height + 1, `${message}: VLAN card ${id} stays inside the stage`);
      return d;
    };
    await diagramShows('vlan=30', ['v30'], 'Only the chosen VLAN shows on the diagram');
    assert.equal(await page.evaluate(() => window.insideNetworkQA.labels().filter(l => ['zone', 'facility', 'node'].includes(l.kind) && l.show).length), 0, 'Room and rack labels hide while the diagram shows');
    // The core router brings all eight VLANs, in their fixed places: 10, 20, 30 on top; 80 left, 40 right; 50, 60, 70 below.
    const all = await diagramShows('facility=core', ['v10', 'v20', 'v30', 'v40', 'v50', 'v60', 'v70', 'v80'], 'The core router shows every VLAN');
    const mid = id => ({ x: (all.cards[id].x0 + all.cards[id].x1) / 2, y: (all.cards[id].y0 + all.cards[id].y1) / 2 });
    assert(mid('v10').x < mid('v20').x && mid('v20').x < mid('v30').x && Math.abs(mid('v10').y - mid('v30').y) < 2, 'VLANs 10, 20 and 30 form the top row');
    assert(mid('v80').x < mid('v40').x && mid('v80').y > mid('v10').y && mid('v80').y < mid('v50').y, 'VLAN 80 sits left and VLAN 40 right of the core');
    assert(mid('v50').x < mid('v60').x && mid('v60').x < mid('v70').x && mid('v50').y > mid('v80').y, 'VLANs 50, 60 and 70 form the bottom row');
    assert.equal(all.tethers, 0, 'The core router has no line down to the building until its host is decided');
    await diagramShows('system=sql', ['v40'], 'A selected system shows its VLAN');
    assert.equal((await page.evaluate(() => window.insideNetworkQA.diagram())).tethers, 1, 'A selected system keeps its dashed line down to the building');
    await page.locator('#overview').click();
    await page.waitForTimeout(1200);
    // Connection map for one system.
    await page.selectOption('#systemSelect', 'dc1');
    await page.locator('#connectionsToggle').click();
    assert.equal(await page.locator('#connectionsToggle').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('#systemContent .connections').textContent(), /Permitted[\s\S]*F01[\s\S]*F03[\s\S]*F09/, 'Connections list every rule for the system');
    await page.locator('#connectionsToggle').click();
    await page.selectOption('#systemSelect', 'sql');
    assert.match(await page.locator('#systemContent .connections').textContent(), /Permitted[\s\S]*F22[\s\S]*Denied[\s\S]*F14/, 'SBD-SQL01 lists its one registered consumer and the web-to-SQL deny');
    // The topology layer is on (shown when relevant) by default; turning it off travels with the link. Then the cinematic look.
    assert.equal(await page.locator('#viewToggle').getAttribute('aria-pressed'), 'true', 'Topology shows by default');
    await page.locator('#viewToggle').click();
    assert.equal(await page.locator('#viewToggle').getAttribute('aria-pressed'), 'false');
    await page.waitForFunction(() => location.hash.includes('topology=off'));
    await page.waitForTimeout(1200);
    await page.locator('#viewToggle').click();
    await page.locator('#lookToggle').click();
    assert.equal(await page.locator('#lookToggle').getAttribute('aria-pressed'), 'true');
    await page.waitForTimeout(1500);
    await page.locator('#lookToggle').click();
    const systems = await page.locator('#systemSelect option').evaluateAll(options => options.map(option => option.value));
    for (const id of systems) { await page.selectOption('#systemSelect', id); assert((await page.locator('#systemContent h2').textContent()).length > 0); }
    // Network segments live in Explore (keyboard and screen-reader access to every VLAN).
    for (let i = 0; i < 8; i++) {
      await page.locator('#relationshipExplore').click();
      await page.locator('#relationshipExplorer .relationship-choice').first().click();
      const segments = page.locator('#relationshipExplorer .segment-choice');
      assert.equal(await segments.count(), 8, 'Explore lists all eight VLANs');
      await segments.nth(i).click();
      assert.match(await page.locator('#architectureContent h2').textContent(), /\S/);
    }
    await page.locator('#reference').click();
    assert.equal(await page.locator('#protocolRows tr').count(), protocols.length, 'Protocol reference lists every protocol');
    await page.keyboard.press('Escape');
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.locator('#export').click()]);
    const png = await readFile(await download.path());
    assert.equal(png.readUInt32BE(16), 3840, 'Export width'); assert.equal(png.readUInt32BE(20), 2160, 'Export height');
    await page.waitForFunction(() => document.getElementById('toast').textContent === '4K image downloaded');
    // Record a one-step clip and confirm a real video file downloads.
    await page.locator('#record').click();
    await page.selectOption('#clipProcess', String(scenarios.findIndex(s => s.id === 'license')));
    const [clip] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.locator('#clipStart').click()]);
    const video = await readFile(await clip.path());
    assert(video.readUInt32BE(0) === 0x1A45DFA3 || video.toString('latin1', 4, 8) === 'ftyp', 'Clip is a WebM or MP4 file');
    assert(video.length > 20000, 'Clip contains video frames');
    await page.waitForFunction(() => /^Clip downloaded/.test(document.getElementById('toast').textContent));
    assert.equal(await page.evaluate(() => document.body.classList.contains('recording')), false, 'Recording ends after the sequence');
    await context.close();
  }
  // Shareable links open the linked step.
  {
    const { context, page } = await open({ width: 1280, height: 800 }, { hash: '#process=web&step=2&topology=off' });
    assert.equal(await page.locator('#stepCounter').textContent(), 'Step 2 of 4');
    assert.equal(await page.locator('#trafficSection').evaluate(el => el.open), true, 'Process links open the walkthroughs');
    assert.equal(await page.locator('#sequenceKicker').textContent(), '07 / USE A WEB APP');
    assert.equal(await page.locator('#viewToggle').getAttribute('aria-pressed'), 'false', 'Links can hide the topology layer');
    await context.close();
  }
  // Mobile layout stays within the viewport.
  {
    const { context, page } = await open({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, 'No horizontal scrolling on mobile');
    assert.equal(await page.locator('#sceneTools').isVisible(), false, 'Phone tools start folded into a menu');
    await page.locator('#toolsMenu').click();
    assert.equal(await page.locator('#overview').isVisible(), true, 'The View options menu opens the tools');
    assert.equal(await page.locator('#stageFullscreen').isVisible(), true, 'Phones get a full-screen button on the stage');
    await context.close();
  }
  // Phones stack a step on the diagram: the source VLAN, the core and ring, the destination VLAN, then the step card.
  {
    const { context, page } = await open({ width: 390, height: 844 }, { hash: '#process=pc-to-sql&step=1' });
    await page.waitForFunction(() => { const d = window.insideNetworkQA.diagram(); return d && d.amount > .99 && d.shown.length === 2; }, null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2600);
    const d = await page.evaluate(() => window.insideNetworkQA.diagram());
    assert.equal(d.layout, 'phone', 'Phones use the stacked diagram');
    assert.deepEqual(d.shown, ['v40', 'v80'], 'The step shows its two VLANs');
    assert(d.cards.v80.y1 < d.coreBox.y0 && d.coreBox.y1 < d.cards.v40.y0, 'Source above the core, destination below');
    for (const [id, b] of Object.entries(d.cards)) assert(b.x0 >= -1 && b.x1 <= d.width + 1 && b.y0 >= -1, `Phone card ${id} stays inside the stage`);
    const caption = await page.locator('.flow-caption').boundingBox(), canvas = await page.locator('#viewport canvas').boundingBox();
    assert(canvas.y + d.cards.v40.y1 <= caption.y + 2, 'The destination VLAN sits above the step card');
    for (const id of ['#stageBack', '#stageNext']) { const b = await page.locator(id).boundingBox(); assert(b.height >= 44 && b.width >= 44, `${id} is at least 44 px for touch`); }
    await context.close();
  }
  // Reduced-motion preference starts paused with motion off.
  {
    const { context, page } = await open({ width: 1280, height: 800 }, { reducedMotion: 'reduce' });
    assert.equal(await page.locator('#play').textContent(), 'Play sequence');
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'false');
    await context.close();
  }
  // Without WebGL, the explanation stays usable.
  {
    const { context, page } = await open({ width: 1280, height: 800 }, { noWebGL: true });
    assert.match(await page.locator('#loading').textContent(), /3D graphics unavailable/);
    assert((await page.locator('#systemContent').textContent()).length > 200, 'System details render without WebGL');
    await context.close();
  }
  assert.deepEqual(problems, [], 'No runtime errors, warnings, or missing files');
  console.log(`Browser checks passed: opens on the architecture explorer with optional walkthroughs, step diagram, pause-after-step, phone tools menu, ${scenarios.length} processes and ${whatIfs.length} what-ifs (with the attack drill), stage kept in view with on-stage controls, focused labels, policy-matched motion, packet inspection, hover tooltips, only the chosen VLAN on the topology diagram, the core router's eight VLANs in their fixed places, the phone step stack, connection map, topology toggle, cinematic look, every system and VLAN, knowledge checks, shareable links, protocol reference, 4K export, clip recording with cards, mobile layout, reduced motion, and WebGL fallback.`);
} finally {
  await browser.close();
  server.close();
}
