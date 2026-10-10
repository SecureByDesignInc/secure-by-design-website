// Saves each page's server HTML and phone/desktop screenshots of a running copy of the site.
// This run: the dark My Account and app sign-in pages, signed out (the real local account API) and
// signed in (the account APIs answered with sample data in the browser; nothing is stored).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
const [base, out] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT);
const sitemap = existsSync('dist/client/sitemap.xml') ? readFileSync('dist/client/sitemap.xml', 'utf8') : '';
const pages = [...new Set([...[...sitemap.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(m => m[1] || '/'), '/my-progress', '/app-sign-in', '/does-not-exist'])];
const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
for (const path of pages) {
  if (path.endsWith('/') && path !== '/') continue; // static guides are already in public/
  const html = await (await fetch(base + path, { headers: { 'user-agent': ua } })).text();
  const file = join(out, 'pages', path === '/' ? 'index.html' : path.replace(/^\//, '') + '/index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const now = new Date().toISOString();
const signedIn = {
  '/api/reader-progress': {
    user: { email: 'learner@example.com', needsPassword: false },
    membership: { plan: 'community', status: 'active', joinedAt: now },
    profile: null,
    records: [
      { id: 'training:dc01-dc02:prepare', status: 'completed', updatedAt: now },
      { id: 'training:dc01-dc02:dc01', status: 'completed', updatedAt: now },
      { id: 'training:dc01-dc02:dc02', status: 'in_progress', updatedAt: now },
      { id: 'training:rmf-boe-ato:01', status: 'completed', updatedAt: now },
    ],
    bookmarks: ['dc-guide', 'dc-package', 'dns-configuration-guide', 'rmf-word', 'ms-ad'].map(id => ({ id, saved: true, updatedAt: now })),
  },
  '/api/sign-in/methods': {
    email: 'learner@example.com', password: true,
    identities: [{ provider: 'apple', subject: 'a1', email: 'learner@privaterelay.example', createdAt: now }],
    passkeys: [{ id: 'p1', label: 'iPhone', createdAt: now, lastUsedAt: now }],
    providers: { apple: true, google: true, microsoft: true },
  },
  '/api/sign-in/providers': { providers: { apple: true, google: true, microsoft: true }, passkeys: true },
};
const allProviders = { '/api/sign-in/providers': { providers: { apple: true, google: true, microsoft: true }, passkeys: true } };
const challenge = 'A'.repeat(43);
// [name, path, answers for the account APIs (none: the real local API), full page]
const shots = [
  ['home', '/', null, false],
  ['training', '/training', null, false],
  ['my-progress', '/my-progress', null, true],
  ['my-progress-providers', '/my-progress', allProviders, true],
  ['my-progress-signed-in', '/my-progress', signedIn, true],
  ['app-sign-in', '/app-sign-in?challenge=' + challenge, null, true],
  ['app-sign-in-signed-in', '/app-sign-in?challenge=' + challenge, signedIn, true],
];
const browser = await chromium.launch();
const metrics = [];
for (const [device, viewport, mobile] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1280, height: 900 }, false]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  for (const [name, path, answers, full] of shots) {
    const page = await context.newPage();
    const problems = [];
    page.on('pageerror', error => problems.push(String(error.message).split('\n')[0]));
    if (answers) await page.route(url => Object.hasOwn(answers, new URL(url).pathname), route => route.fulfill({ json: answers[new URL(route.request().url()).pathname] }));
    try {
      await page.goto(base + path, { waitUntil: 'load', timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      const m = await page.evaluate(() => {
        const main = document.querySelector('main');
        const nav = document.querySelector('.reader-section-links'), aside = document.querySelector('.reader-membership-summary');
        return {
          main: main?.className, mainBg: main && getComputedStyle(main).backgroundColor, bodyBg: getComputedStyle(document.body).backgroundColor,
          auth: Math.round(document.querySelector('.reader-auth')?.getBoundingClientRect().height || 0) || null,
          reserve: nav && aside ? Math.round(aside.getBoundingClientRect().top - nav.getBoundingClientRect().bottom - 48) : null,
          sso: document.querySelectorAll('.sso-button').length, scrollWidth: document.documentElement.scrollWidth,
        };
      });
      metrics.push({ device, name, ...m, problems });
      const file = join(out, 'shots', device, name + '.jpg');
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file, type: 'jpeg', quality: 72, fullPage: full });
    } catch (error) { metrics.push({ device, name, error: String(error.message).split('\n')[0] }); }
    await page.close();
  }
  await context.close();
}
await browser.close();
writeFileSync(join(out, 'metrics.json'), JSON.stringify(metrics, null, 1));
for (const m of metrics) console.log(`::notice title=${m.device} ${m.name}::${JSON.stringify(m)}`);
