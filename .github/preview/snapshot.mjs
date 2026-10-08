// Saves each page's server HTML and phone/desktop screenshots of a running copy of the site.
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
  if (path.endsWith('/') && path !== '/' ) continue; // static guides are already in public/
  const html = await (await fetch(base + path, { headers: { 'user-agent': ua } })).text();
  const file = join(out, 'pages', path === '/' ? 'index.html' : path.replace(/^\//, '') + '/index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
const shots = ['/', '/training', '/training/dns-configuration', '/training/dns-configuration/checklist', '/my-progress', '/privacy', '/inside-the-network', '/training/rmf/', '/training/dc01-dc02/'];
const browser = await chromium.launch();
const metrics = [];
for (const [name, viewport, mobile] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1280, height: 900 }, false]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  for (const path of shots) {
    const page = await context.newPage();
    try {
      await page.goto(base + path, { waitUntil: 'load', timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const m = await page.evaluate(() => {
        const header = document.querySelector('header.site-header, header');
        const h1 = document.querySelector('h1:not(.vc-sr-only)');
        return { header: header ? Math.round(header.getBoundingClientRect().height) : null, h1Top: h1 ? Math.round(h1.getBoundingClientRect().top + scrollY) : null, scrollWidth: document.documentElement.scrollWidth };
      });
      metrics.push({ name, path, ...m });
      const file = join(out, 'shots', name, (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/\//g, '_')) + '.jpg');
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file, type: 'jpeg', quality: 70, fullPage: false });
      if (path === '/' || path === '/training') {
        await page.screenshot({ path: file.replace('.jpg', '-full.jpg'), type: 'jpeg', quality: 55, fullPage: true });
      }
    } catch (error) { metrics.push({ name, path, error: String(error.message).split('\n')[0] }); }
    await page.close();
  }
  await context.close();
}
await browser.close();
writeFileSync(join(out, 'metrics.json'), JSON.stringify(metrics, null, 1));
console.log(JSON.stringify(metrics));
