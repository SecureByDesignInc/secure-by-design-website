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
const url = `http://127.0.0.1:${server.address().port}/inside-network-model/model.html`;
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
    const { context, page } = await open({ width: 1280, height: 800 }, { hash: '#process=web&step=2' });
    assert.equal(await page.locator('#stepCounter').textContent(), 'Step 2 of 3');
    assert.equal(await page.locator('#sequenceKicker').textContent(), '07 / USE A WEB APP');
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
  console.log(`Browser checks passed: ${scenarios.length} processes and ${whatIfs.length} what-ifs, policy-matched motion, every system and VLAN, knowledge checks, shareable links, protocol reference, 4K export, clip recording, mobile layout, reduced motion, and WebGL fallback.`);
} finally {
  await browser.close();
  server.close();
}
