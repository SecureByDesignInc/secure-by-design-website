import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit, firefox } from 'playwright';
const SITE = 'https://securebydesigninc.com';
const OUT = 'audit-results/verify'; mkdirSync(OUT, { recursive: true });
const lines = [];
const log = (k, v) => { const s = `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`; lines.push(s); console.log(s); };
const cases = [
  ['/training/dns-configuration', 'link', /Back to the Training Library/i],
  ['/training/dns-configuration', 'link', /^Training Library$/],
  ['/training/dns-configuration', 'link', /Open the checklist/i],
  ['/training/dns-configuration', 'link', /See the complete network/i],
  ['/training/dns-configuration', 'link', /^Privacy$/],
  ['/training/dns-configuration', 'link', /^Home$/],
  ['/training/dns-configuration/checklist', 'link', /Back to Configure DNS/i],
  ['/training/dns-configuration/checklist', 'link', /^My Account$/],
  ['/training/harden-baseline', 'link', /Back to the Training Library/i],
  ['/', 'link', /Explore all training/i],
  ['/', 'link', /^Training Library$/],
  ['/training', 'link', /^Inside the Network$/],
  ['/privacy', 'link', /^Home$/],
  ['/my-progress', 'link', /^Training Library$/],
];
for (const [tag, engine] of [['chromium', chromium], ['webkit', webkit], ['firefox', firefox]]) {
  const browser = await engine.launch();
  for (const [path, role, name] of cases) {
    if (tag !== 'chromium' && !path.startsWith('/training/dns')) continue;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
    await page.goto(SITE + path, { waitUntil: 'networkidle' });
    const link = page.getByRole(role, { name }).first();
    const href = await link.getAttribute('href').catch(() => null);
    if (!href) { log(`[${tag}] ${path} -> ${name}`, 'link not found'); await ctx.close(); continue; }
    await link.click();
    let moved = false;
    for (let i = 0; i < 16 && !moved; i++) { await page.waitForTimeout(500); moved = new URL(page.url()).pathname !== new URL(SITE + path).pathname; }
    log(`[${tag}] ${path} -> ${name}`, { href, landed: page.url().replace(SITE, ''), navigated: moved, errors: [...new Set(errors)].slice(0, 2) });
    await ctx.close();
  }
  await browser.close();
}
writeFileSync(`${OUT}/links.txt`, lines.join('\n'));
