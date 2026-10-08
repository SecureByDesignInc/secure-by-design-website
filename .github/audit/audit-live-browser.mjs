// Browser pass over the live site: what a visitor actually sees, console errors, and screenshots.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { writeFile, mkdir } from 'node:fs/promises';

const SITE = process.env.SITE || 'https://securebydesigninc.com';
await mkdir('audit-results/shots', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const note = (page, name, ok, detail = '') => results.push({ page, name, ok, detail: String(detail).slice(0, 800) });

async function visit(path, viewport, fn) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text() + ' @ ' + (m.location()?.url || '')); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  const tag = `${path.replace(/[^a-z0-9]+/gi, '_') || 'home'}_${viewport.width}`;
  try {
    await page.goto(SITE + path, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    if (fn) await fn(page);
    await page.screenshot({ path: `audit-results/shots/${tag}.png`, fullPage: viewport.width < 800 ? false : true });
  } catch (e) { errors.push('audit: ' + e.message.split('\n')[0]); }
  note(path, `No errors at ${viewport.width}px`, errors.length === 0, errors.slice(0, 8).join(' || '));
  await ctx.close();
}

const desktop = { width: 1440, height: 900 }, phone = { width: 390, height: 844 };
await visit('/', desktop, async page => {
  const order = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
  note('/', 'Homepage section order', true, order.join(' → '));
});
await visit('/', phone);
await visit('/training', desktop, async page => {
  const visibleTiles = await page.locator('.vc-catalog-tile').count();
  const titles = await page.locator('.vc-catalog-tile h3').allTextContents();
  const headings = await page.evaluate(() => [...document.querySelectorAll('main h2, main h3')].map(h => h.textContent.trim()).filter(Boolean).slice(0, 40));
  note('/training', 'Tiles shown before "Show more"', true, `${visibleTiles}: ${titles.join(' | ')}`);
  const authVisible = titles.some(t => /Risk Management Framework|Body of Evidence|Authorization to Operate/.test(t));
  note('/training', 'Network Authorization tiles visible without clicking "Show more"', authVisible, authVisible ? '' : 'RMF 2.1–2.3 appear only after Show more materials');
  const more = page.getByRole('button', { name: /Show more materials/i });
  if (await more.count()) { await more.click(); await page.waitForTimeout(800); }
  const all = await page.locator('.vc-catalog-tile h3').allTextContents();
  note('/training', 'All catalog tiles after "Show more"', all.length >= 15, `${all.length}: ${all.join(' | ')}`);
  note('/training', 'Headings', true, headings.join(' | '));
  // Filter to Network Authorization and open the first tile.
  const cat = page.getByRole('button', { name: /Network Authorization/i }).first();
  if (await cat.count()) { await cat.click(); await page.waitForTimeout(600); const t = await page.locator('.vc-catalog-tile h3').allTextContents(); note('/training', 'Network Authorization filter', t.length === 3, t.join(' | ')); }
});
await visit('/training', phone);
await visit('/training/connect-segment', desktop);
await visit('/training/workstation-fleet', desktop);
await visit('/training/rmf/index.html', desktop, async page => {
  const ed = await page.evaluate(() => (document.body.innerText.match(/edition[^\n]{0,40}/i) || [''])[0]);
  note('/training/rmf', 'RMF course edition shown', /1\.2/.test(ed), ed);
});
await visit('/training/dc01-dc02/index.html', desktop);
await visit('/my-progress', desktop, async page => {
  const order = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
  note('/my-progress', 'Section order (signed out)', true, order.join(' → '));
});
await visit('/inside-the-network', desktop, async page => {
  const frame = page.frameLocator('iframe').first();
  await page.waitForTimeout(6000);
  const canvas = await frame.locator('#viewport canvas').count().catch(() => -1);
  const selected = await frame.locator('#architectureTab').getAttribute('aria-selected').catch(() => null);
  const trafficOpen = await frame.locator('#trafficSection').evaluate(el => el.open).catch(() => null);
  const toolbar = await frame.locator('.stage-toolbar').count().catch(() => -1);
  note('/inside-the-network', 'Model renders and opens on the architecture explorer', canvas === 1 && selected === 'true', `canvas ${canvas}, architecture tab selected ${selected}`);
  note('/inside-the-network', 'Follow the traffic starts collapsed', trafficOpen === false, `open=${trafficOpen}`);
  note('/inside-the-network', 'Slim stage toolbar present', toolbar >= 1, `count ${toolbar}`);
});
await visit('/inside-the-network', phone);
await visit('/inside-network-model/model.html#process=signin&step=2', desktop, async page => { await page.waitForTimeout(4000); });

await browser.close();
await writeFile('audit-results/browser.json', JSON.stringify(results, null, 1));
const md = ['# Live browser pass', '', '| | Page | Check | Detail |', '|---|---|---|---|', ...results.map(r => `| ${r.ok ? '✅' : '❌'} | ${r.page} | ${r.name} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n');
await writeFile('audit-results/browser.md', md + '\n');
console.log(md);
