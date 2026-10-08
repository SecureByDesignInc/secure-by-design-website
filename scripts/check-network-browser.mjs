// Browser smoke test for Inside the Network (public/inside-network-model/model.html).
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
    assert.equal(await page.locator('#scenarioButtons button').count(), scenarios.length);
    for (const [index, scenario] of scenarios.entries()) {
      await page.locator('#scenarioButtons button').nth(index).click();
      for (let step = 0; step < scenario.steps.length; step++) await page.locator('#steps button').nth(step).click();
      assert.equal(await page.locator('#stepCounter').textContent(), `Step ${scenario.steps.length} of ${scenario.steps.length}`);
    }
    // Motion and labels follow the policy register.
    await page.locator('#scenarioButtons button').nth(0).click();await page.locator('#steps button').nth(0).click();
    assert.equal(await page.locator('#stageKind').textContent(), 'BLOCKED PENDING VALIDATION', 'Pending DHCP relay is shown as blocked');
    // Learning view: choosing a process keeps the stage on screen, the step's narration and controls sit on the stage,
    // and only the step's own systems keep labels.
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.locator('#scenarioButtons button').nth(scenarios.findIndex(s => s.id === 'files')).click();
    await page.waitForTimeout(1200);
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
    const pcs = await page.evaluate(() => window.insideNetworkQA.project('workstations'));
    await page.mouse.move(pcs.x, pcs.y);
    assert.match(await page.locator('#hoverTip').textContent(), /50 Windows 11 PCs/, 'Hover tooltip');
    await page.mouse.move(2, 2);
    // Rack names are readable in the full-room view.
    const zoneLabels = await page.evaluate(() => window.insideNetworkQA.labels().filter(l => l.kind === 'zone' && l.show).length);
    assert(zoneLabels >= 6, `Most rack names show in the full-room view (${zoneLabels} of 8)`);
    // Connection map for one system.
    await page.selectOption('#systemSelect', 'dc1');
    await page.locator('#connectionsToggle').click();
    assert.equal(await page.locator('#connectionsToggle').getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('#systemContent .connections').textContent(), /Permitted[\s\S]*F01[\s\S]*F03[\s\S]*Pending[\s\S]*F08/, 'Connections list every rule for the system');
    await page.locator('#connectionsToggle').click();
    // Logical view (with a shareable link) and the cinematic look.
    await page.locator('#viewToggle').click();
    assert.equal(await page.locator('#viewToggle').getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(() => location.hash.includes('layout=logical'));
    await page.waitForTimeout(1800);
    await page.locator('#viewToggle').click();
    await page.locator('#lookToggle').click();
    assert.equal(await page.locator('#lookToggle').getAttribute('aria-pressed'), 'true');
    await page.waitForTimeout(1500);
    await page.locator('#lookToggle').click();
    const systems = await page.locator('#systemSelect option').evaluateAll(options => options.map(option => option.value));
    for (const id of systems) { await page.selectOption('#systemSelect', id); assert((await page.locator('#systemContent h2').textContent()).length > 0); }
    for (let i = 0; i < await page.locator('#vlanLegend button').count(); i++) {
      await page.locator('#vlanToggle').click();
      await page.locator('#vlanLegend button').nth(i).click();
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
    const { context, page } = await open({ width: 1280, height: 800 }, { hash: '#process=web&step=2&layout=logical' });
    assert.equal(await page.locator('#stepCounter').textContent(), 'Step 2 of 4');
    assert.equal(await page.locator('#sequenceKicker').textContent(), '07 / USE A WEB APP');
    assert.equal(await page.locator('#viewToggle').getAttribute('aria-pressed'), 'true', 'Links can open the logical view');
    await context.close();
  }
  // Mobile layout stays within the viewport.
  {
    const { context, page } = await open({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, 'No horizontal scrolling on mobile');
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
  console.log(`Browser checks passed: ${scenarios.length} processes and ${whatIfs.length} what-ifs (with the attack drill), stage kept in view with on-stage controls, focused labels, policy-matched motion, packet inspection, hover tooltips, readable rack names, connection map, logical view, cinematic look, every system and VLAN, knowledge checks, shareable links, protocol reference, 4K export, clip recording with cards, mobile layout, reduced motion, and WebGL fallback.`);
} finally {
  await browser.close();
  server.close();
}
