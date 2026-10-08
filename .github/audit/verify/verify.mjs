import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const SITE = 'https://securebydesigninc.com';
const OUT = 'audit-results/verify'; mkdirSync(OUT, { recursive: true });
const lines = []; const log = (k, v) => { const s = `${k}: ${JSON.stringify(v)}`; lines.push(s); console.log(s); };
const browser = await chromium.launch();
for (let i = 0; i < 4; i++) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
  await page.goto(`${SITE}/training`, { waitUntil: 'networkidle' });
  const open = page.getByRole('button', { name: /open training|view materials/i }).nth([0, 1, 5, 12][i]);
  const label = (await open.getAttribute('aria-label').catch(() => null)) || (await open.innerText().catch(() => ''));
  await open.click(); await page.waitForTimeout(1200);
  const links = await page.locator('main a[href^="/training/"]:visible').evaluateAll(as => as.map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim().slice(0, 50) })).filter(l => !/\.(pdf|docx|zip|md|txt)$/.test(l.href)));
  const target = links.find(l => !/checklist/.test(l.href)) || links[0];
  let result = 'no course link in panel';
  if (target) {
    const before = page.url();
    await page.locator(`main a[href="${target.href}"]:visible`).first().click();
    let moved = false; for (let k = 0; k < 16 && !moved; k++) { await page.waitForTimeout(500); moved = page.url() !== before; }
    result = { clicked: target, landed: page.url().replace(SITE, ''), navigated: moved };
  }
  log(`tile ${i} (${label.slice(0, 60)})`, { linksInPanel: links.slice(0, 5), result, errors: [...new Set(errors)].slice(0, 2) });
}
writeFileSync(`${OUT}/tiles.txt`, lines.join('\n'));
await browser.close();
