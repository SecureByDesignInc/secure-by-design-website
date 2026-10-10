// Screenshots the live Training Library tiles and measures each tile's art: the workbook cover's
// presence and whether the course labels touch the cover or the bottom row.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT);
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const width of [1280, 1120, 1050, 900, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('https://securebydesigninc.com/training', { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const tiles = await page.evaluate(() => [...document.querySelectorAll('.vc-catalog-tile')].map(t => {
    const art = t.querySelector('.vc-tile-art').getBoundingClientRect();
    const book = t.querySelector('.vc-tile-book');
    const b = book ? book.getBoundingClientRect() : null;
    const bottom = t.querySelector('.vc-tile-art-bottom').getBoundingClientRect();
    const labels = [...t.querySelectorAll('.vc-course-art span')];
    const right = labels.length ? Math.max(...labels.map(s => s.getBoundingClientRect().right)) : 0;
    const low = labels.length ? Math.max(...labels.map(s => s.getBoundingClientRect().bottom)) : 0;
    return { n: t.querySelector('.vc-tile-art-top b')?.textContent, w: Math.round(art.width), book: !!(book && book.complete && book.naturalWidth > 0 && b.width > 0),
      hitsBook: labels.length > 0 && b && right > b.left - 1, hitsBottom: labels.length > 0 && low > bottom.top, font: getComputedStyle(t.querySelector('.vc-course-art span') || document.body).fontFamily.split(',')[0] };
  }));
  results.push({ width, tiles });
  const grid = await page.$('.vc-catalog-grid');
  if (grid) await grid.screenshot({ path: `${out}/tiles-${width}.png` });
  await page.close();
}
await browser.close();
writeFileSync(`${out}/tiles.json`, JSON.stringify(results, null, 1));
for (const { width, tiles } of results) {
  const missing = tiles.filter(t => !t.book).map(t => t.n);
  const touching = tiles.filter(t => t.hitsBook || t.hitsBottom).map(t => `${t.n}${t.hitsBook ? ' cover' : ''}${t.hitsBottom ? ' bottom' : ''}`);
  console.log(`::notice title=Tiles at ${width}px::${tiles.length} tiles, ${tiles[0]?.w}px wide, font ${tiles[1]?.font} · without a workbook: ${missing.join(', ') || 'none'} · labels touching: ${touching.join(', ') || 'none'}`);
}
