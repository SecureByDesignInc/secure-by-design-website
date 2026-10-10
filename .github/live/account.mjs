// Read-only look at the live My Account page: which sign-in providers are on, how tall the signed-out
// sign-in form is at each width (the loading placeholder reserves that height), the page colors, and
// screenshots. Nothing is submitted.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT);
const out = process.argv[2];
const site = 'https://securebydesigninc.com';
mkdirSync(out, { recursive: true });
const providers = await (await fetch(site + '/api/sign-in/providers', { headers: { 'cache-control': 'no-store' } })).text();
console.log(`::notice title=Sign-in providers::${providers}`);
const browser = await chromium.launch();
const results = [];
for (const width of [1280, 800, 799, 640, 540, 480, 430, 390, 360, 320]) {
  const phone = width < 500;
  const context = await browser.newContext({ viewport: { width, height: phone ? 844 : 900 }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
  const page = await context.newPage();
  await page.goto(site + '/my-progress', { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const top = el => el ? Math.round(el.getBoundingClientRect().top + scrollY) : null;
    const auth = document.querySelector('.reader-auth');
    return {
      authHeight: auth ? Math.round(auth.getBoundingClientRect().height) : null,
      progressTop: top(document.querySelector('#progress')),
      asideTop: top(document.querySelector('.reader-membership-summary')),
      main: document.querySelector('main')?.className,
      mainBg: getComputedStyle(document.querySelector('main')).backgroundColor,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      ssoButtons: document.querySelectorAll('.sso-button').length,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  results.push({ width, ...m });
  if ([1280, 390].includes(width)) await page.screenshot({ path: `${out}/my-progress-${width}.png`, fullPage: true });
  if (width === 1280) {
    await page.goto(site + '/app-sign-in?challenge=' + 'A'.repeat(43), { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/app-sign-in-${width}.png`, fullPage: true });
  }
  await context.close();
}
await browser.close();
writeFileSync(`${out}/account.json`, JSON.stringify(results, null, 1));
for (const r of results) console.log(`::notice title=My Account at ${r.width}px::form ${r.authHeight}px, #progress ${r.progressTop} to membership ${r.asideTop} (${r.asideTop - r.progressTop}px), sso ${r.ssoButtons}, main "${r.main}" ${r.mainBg}, body ${r.bodyBg}, scroll ${r.scrollWidth}`);
