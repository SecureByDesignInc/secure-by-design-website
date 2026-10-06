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
import { protocols, scenarios } from '../public/inside-network-model/technical.js';

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
  await page.goto(url);
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
  console.log(`Browser checks passed: ${scenarios.length} processes, every system and VLAN, protocol reference, 4K export, mobile layout, reduced motion, and WebGL fallback.`);
} finally {
  await browser.close();
  server.close();
}
