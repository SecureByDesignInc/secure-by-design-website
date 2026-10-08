import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const SITE = 'https://securebydesigninc.com';
const OUT = 'audit-results/verify'; mkdirSync(OUT, { recursive: true });
const lines = [];
const log = (k, v) => { const s = `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`; lines.push(s); console.log(s); };
// V1: where the title and description sit in the served HTML.
for (const p of ['/training/dns-configuration', '/training/dns-configuration/checklist', '/training', '/', '/privacy']) {
  const html = await (await fetch(SITE + p)).text();
  const headEnd = html.indexOf('</head>');
  const titles = [...html.matchAll(/<title[^>]*>([^<]*)<\/title>/g)].map(m => ({ at: m.index, inHead: m.index < headEnd, text: m[1].slice(0, 70) }));
  const descs = [...html.matchAll(/<meta name="description" content="([^"]{0,60})/g)].map(m => ({ at: m.index, inHead: m.index < headEnd }));
  log(`V1 ${p}`, { headEnd, titles, descs, ogTags: (html.match(/property="og:/g) || []).length });
}
// V5: www redirect headers.
{ const r = await fetch('https://www.securebydesigninc.com/', { redirect: 'manual' }); log('V5 www', { status: r.status, hsts: r.headers.get('strict-transport-security'), location: r.headers.get('location') }); }
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
// V2: lesson hash deep links.
for (const hash of ['#zones', '#records', '#troubleshoot', '#verify']) {
  await page.goto(`${SITE}/training/dns-configuration${hash}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  const shown = await page.evaluate(() => ({ lessonHeading: document.querySelector('main h2')?.textContent?.trim(), kicker: [...document.querySelectorAll('main p, main span')].map(e => e.textContent.trim()).find(t => /^Lesson \d+ of/i.test(t)), idExists: !!document.getElementById(location.hash.slice(1)), url: location.href }));
  log(`V2 ${hash}`, shown);
}
// Where do those hash links come from?
await page.goto(`${SITE}/training`, { waitUntil: 'networkidle' });
log('V2 sources on /training', await page.evaluate(() => [...document.querySelectorAll('a[href*="dns-configuration#"]')].slice(0, 5).map(a => a.getAttribute('href'))));
await page.goto(`${SITE}/inside-the-network`, { waitUntil: 'networkidle' });
// V3: prototype key in signin_error.
errors.length = 0;
await page.goto(`${SITE}/my-progress?signin_error=__proto__`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
log('V3 __proto__', { h1: await page.locator('h1').first().textContent().catch(() => null), bodyChars: (await page.locator('body').innerText()).length, signInPanel: await page.getByText('One account for your learning').count(), errors: errors.slice(0, 4) });
await page.screenshot({ path: `${OUT}/v3-proto.jpg`, type: 'jpeg', quality: 60 });
errors.length = 0;
await page.goto(`${SITE}/my-progress?signin_error=failed`, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
log('V3 control (failed)', { alert: await page.locator('[role=alert]').allInnerTexts(), errors: errors.slice(0, 3) });
// V13: in-site navigation still works on a course page despite the prefetch error.
errors.length = 0;
await page.goto(`${SITE}/training/dns-configuration`, { waitUntil: 'networkidle' });
await page.getByRole('link', { name: /Back to the Training Library/i }).first().click();
await page.waitForTimeout(2500);
log('V13 back link', { url: page.url(), h1: await page.locator('h1').first().textContent(), errors: errors.slice(0, 3) });
await page.goto(`${SITE}/training/dns-configuration`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Next lesson/i }).first().click(); await page.waitForTimeout(800);
log('V13 next lesson', { url: page.url(), heading: await page.locator('main h2').first().textContent() });
// V14: the footer's About link target exists.
await page.goto(`${SITE}/#about`, { waitUntil: 'networkidle' });
log('V14 #about', await page.evaluate(() => ({ exists: !!document.getElementById('about'), text: document.getElementById('about')?.textContent?.trim().slice(0, 80) })));
// V15: header height share of the first screen.
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const p2 = await (await browser.newContext({ viewport: vp })).newPage();
  await p2.goto(`${SITE}/training`, { waitUntil: 'networkidle' });
  log(`V15 header ${vp.width}`, await p2.evaluate(() => { const h = document.querySelector('header.site-header'); const r = h.getBoundingClientRect(); const h1 = document.querySelector('main h1, main h2'); return { headerPx: Math.round(r.height), viewport: innerHeight, firstHeadingTop: Math.round(h1?.getBoundingClientRect().top || 0) }; }));
}
await browser.close();
writeFileSync(`${OUT}/verify.txt`, lines.join('\n'));
