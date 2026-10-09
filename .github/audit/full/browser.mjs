// Real-browser checks: console/page errors, failed requests, overflow, axe-core (WCAG 2.2 AA), timing,
// screenshots at phone and desktop sizes, cross-browser renders, and scripted interactions. Read-only.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chromium, webkit, firefox } from 'playwright';
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const SITE = 'https://securebydesigninc.com';
const OUT = 'audit-results/full/browser';
mkdirSync(`${OUT}/shots`, { recursive: true });
const slug = u => (new URL(u).pathname.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home');
const sm = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).concat([
  `${SITE}/app-sign-in?challenge=${'A'.repeat(43)}`, `${SITE}/inside-network-model/model.html`, `${SITE}/training/dc01-dc02/notices.html`, `${SITE}/audit-missing-page`, `${SITE}/resource-preferences`,
]))];
const results = { at: new Date().toISOString(), pages: [], crossBrowser: [], interactions: [], reflow: [] };
const record = (area, name, ok, detail = '') => { results.interactions.push({ area, name, ok, detail: String(detail).slice(0, 600) }); console.log(`${ok ? 'PASS' : ok === null ? 'INFO' : 'FAIL'} [${area}] ${name} ${detail ? '| ' + String(detail).slice(0, 200) : ''}`); };

async function inspect(browser, url, viewport, { axe = true, shot = true, tag = 'chromium' } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 500 && tag !== 'firefox', hasTouch: viewport.width < 500 && tag !== 'firefox', userAgent: undefined });
  const page = await context.newPage();
  const errors = [], warnings = [], failed = [], bad = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); else if (m.type() === 'warning') warnings.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('requestfailed', r => failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 200)}`));
  page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 200)}`); });
  const rec = { url, viewport: `${viewport.width}x${viewport.height}`, browser: tag };
  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    rec.status = resp?.status();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { rec.networkidleTimeout = true; });
    rec.loadMs = Date.now() - t0;
    await page.waitForTimeout(800);
    Object.assign(rec, await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const res = performance.getEntriesByType('resource');
      const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
      const bytes = res.reduce((a, r) => a + (r.transferSize || 0), 0) + (nav?.transferSize || 0);
      const big = res.filter(r => r.encodedBodySize > 150000).map(r => `${Math.round(r.encodedBodySize / 1024)}KB ${r.name.slice(0, 140)}`).slice(0, 10);
      const de = document.documentElement;
      const overflowEls = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map(e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${[...e.classList].slice(0, 2).join('.')} right=${Math.round(e.getBoundingClientRect().right)}`);
      const small = [...document.querySelectorAll('a[href], button, input, select, textarea, [role=button]')].filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < 24 || r.height < 24) && !(e.tagName === 'A' && getComputedStyle(e).display === 'inline'); }).length;
      const fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i);
      return { ttfb: nav ? Math.round(nav.responseStart) : null, dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null, lcp: lcp ? Math.round(lcp.startTime) : null, requests: res.length + 1, kb: Math.round(bytes / 1024), big, overflowPx: de.scrollWidth - innerWidth, overflowEls, heightPx: de.scrollHeight, smallTargets: small, fonts, title: document.title, skipLink: !!document.querySelector('a[href^="#main"], a[href="#content"], .skip-link'), lang: de.lang };
    }));
    rec.cls = await page.evaluate(() => new Promise(res => { let v = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {} setTimeout(() => res(Math.round(v * 1000) / 1000), 300); }));
    if (axe) {
      await page.addScriptTag({ content: axeSource });
      const a = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] }));
      rec.axe = a.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 4).map(n => n.target.join(' ')), summary: v.nodes[0]?.failureSummary?.slice(0, 300) }));
    }
    if (shot) {
      const name = `${tag}-${slug(url)}-${viewport.width}`;
      await page.screenshot({ path: `${OUT}/shots/${name}-top.jpg`, type: 'jpeg', quality: 70 });
      const h = Math.min(rec.heightPx || 0, 16000);
      if (h > viewport.height * 1.2) await page.screenshot({ path: `${OUT}/shots/${name}-full.jpg`, type: 'jpeg', quality: 55, fullPage: true, clip: h >= 16000 ? { x: 0, y: 0, width: viewport.width, height: 16000 } : undefined });
    }
  } catch (e) { rec.error = e.message.slice(0, 300); }
  rec.consoleErrors = [...new Set(errors)].slice(0, 15); rec.consoleWarnings = [...new Set(warnings)].slice(0, 8); rec.failedRequests = [...new Set(failed)].slice(0, 10); rec.badResponses = [...new Set(bad)].slice(0, 10);
  await context.close();
  return rec;
}

const chrome = await chromium.launch();
for (const url of urls) for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const rec = await inspect(chrome, url, vp);
  results.pages.push(rec);
  console.log(`${rec.status} ${rec.viewport} ${url} errs=${rec.consoleErrors.length} axe=${(rec.axe || []).length} overflow=${rec.overflowPx} lcp=${rec.lcp} kb=${rec.kb}`);
}
// WCAG 1.4.10 reflow: 320 CSS px wide.
for (const url of [`${SITE}/`, `${SITE}/training`, `${SITE}/training/dns-configuration`, `${SITE}/my-progress`, `${SITE}/inside-the-network`, `${SITE}/privacy`, `${SITE}/training/rmf/`, `${SITE}/training/dc01-dc02/`]) {
  const rec = await inspect(chrome, url, { width: 320, height: 640 }, { axe: false, shot: true });
  results.reflow.push({ url, overflowPx: rec.overflowPx, overflowEls: rec.overflowEls });
}
// Cross-browser renders of key pages.
for (const [tag, engine] of [['webkit', webkit], ['firefox', firefox]]) {
  let b; try { b = await engine.launch(); } catch (e) { results.crossBrowser.push({ browser: tag, error: e.message.slice(0, 200) }); continue; }
  for (const url of [`${SITE}/`, `${SITE}/training`, `${SITE}/training/two-tier-pki`, `${SITE}/my-progress`, `${SITE}/inside-the-network`, `${SITE}/training/rmf/`]) for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const rec = await inspect(b, url, vp, { axe: false, tag });
    results.crossBrowser.push(rec);
    console.log(`[${tag}] ${rec.status} ${rec.viewport} ${url} errs=${rec.consoleErrors.length} overflow=${rec.overflowPx}`);
  }
  await b.close();
}

// Scripted interactions (Chromium).
const ctx = await chrome.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const step = async (area, name, fn) => { try { const d = await fn(); record(area, name, d?.ok ?? true, d?.detail ?? ''); } catch (e) { record(area, name, false, e.message.split('\n')[0]); } };
await step('Training Library', 'loads tiles and search narrows results', async () => {
  await page.goto(`${SITE}/training`, { waitUntil: 'networkidle' });
  const before = await page.locator('[id^="tile-title-"]').count();
  const search = page.getByPlaceholder('Search a topic, system, or course…');
  await search.fill('DNS'); await page.waitForTimeout(600);
  const after = await page.locator('[id^="tile-title-"]:visible').count();
  const text = await page.locator('main').innerText();
  await search.fill('zzzqqq'); await page.waitForTimeout(600);
  const none = await page.locator('[id^="tile-title-"]:visible').count();
  const empty = /no (matching|training|results)|clear filters/i.test(await page.locator('main').innerText());
  const clear = page.getByRole('button', { name: /clear filters|clear search/i }).first();
  if (await clear.count()) await clear.click();
  await page.waitForTimeout(400);
  const restored = await page.locator('[id^="tile-title-"]:visible').count();
  return { ok: before > 0 && after > 0 && after < before && none === 0 && empty && restored >= after, detail: `tiles ${before}; "DNS" → ${after}; nonsense → ${none} (empty state ${empty}); after clear → ${restored}; DNS mentioned ${/DNS/.test(text)}` };
});
await step('Training Library', 'category filter', async () => {
  const sel = page.getByLabel('Training category');
  if (!(await sel.count())) return { ok: null, detail: 'no category control found by label' };
  const tag = await sel.evaluate(e => e.tagName);
  if (tag === 'SELECT') { const opts = await sel.locator('option').allInnerTexts(); await sel.selectOption({ index: Math.min(1, opts.length - 1) }); await page.waitForTimeout(400); return { ok: true, detail: `options: ${opts.join(' | ')}; visible tiles after first category: ${await page.locator('[id^="tile-title-"]:visible').count()}` }; }
  const buttons = await sel.locator('button, [role=tab], [role=radio]').allInnerTexts();
  if (buttons.length > 1) { await sel.locator('button, [role=tab], [role=radio]').nth(1).click(); await page.waitForTimeout(400); }
  return { ok: true, detail: `choices: ${buttons.join(' | ')}; visible tiles: ${await page.locator('[id^="tile-title-"]:visible').count()}` };
});
await step('Training Library', 'open a tile shows its materials, downloads respond', async () => {
  await page.goto(`${SITE}/training`, { waitUntil: 'networkidle' });
  const open = page.getByRole('button', { name: /open training|view materials/i }).first();
  await open.click(); await page.waitForTimeout(1200);
  const expanded = await page.locator('[aria-expanded="true"]').count();
  const links = await page.locator('main a[href$=".pdf"], main a[href$=".docx"], main a[href$=".zip"], main a[href$=".md"]').evaluateAll(as => as.map(a => a.href));
  const statuses = [];
  for (const l of [...new Set(links)].slice(0, 12)) { const r = await fetch(l, { method: 'GET' }); statuses.push(`${r.status} ${l.split('/').slice(-2).join('/')}`); }
  await page.screenshot({ path: `${OUT}/shots/interaction-training-expanded.jpg`, type: 'jpeg', quality: 60 });
  return { ok: expanded > 0 && statuses.every(s => s.startsWith('200')), detail: `expanded=${expanded}; ${statuses.join('; ')}` };
});
await step('Sharing', 'Pass it on copies the homepage URL (no native share in headless)', async () => {
  await page.goto(`${SITE}/training`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { delete navigator.share; } catch {} navigator.share = undefined; });
  const btn = page.getByRole('button', { name: /pass it on|share/i }).first();
  await btn.click(); await page.waitForTimeout(800);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(e => 'ERR ' + e.message));
  const msg = await page.locator('[role=status], [aria-live]').allInnerTexts();
  return { ok: clip === 'https://securebydesigninc.com/', detail: `clipboard="${clip}" status="${msg.join(' ').slice(0, 120)}"` };
});
await step('Course page', 'DNS course: lessons, quiz answer feedback, checklist and workbook links', async () => {
  await page.goto(`${SITE}/training/dns-configuration`, { waitUntil: 'networkidle' });
  const h = await page.locator('h1').first().innerText();
  const lessons = await page.locator('main h2, main h3').count();
  const radios = page.locator('main input[type=radio]');
  let quiz = 'no radio quiz inputs';
  if (await radios.count()) { await radios.first().check({ force: true }); const check = page.getByRole('button', { name: /check|submit/i }).first(); if (await check.count()) { await check.click(); await page.waitForTimeout(400); } quiz = (await page.locator('[role=status], [aria-live], .quiz-feedback, [class*=feedback]').allInnerTexts()).join(' ').slice(0, 160) || 'answered (no visible feedback element found)'; }
  const files = await page.locator('main a[href*="/training/dns-configuration/"]').evaluateAll(as => [...new Set(as.map(a => a.href))]);
  const statuses = []; for (const f of files) { const r = await fetch(f); statuses.push(`${r.status} ${f.split('/').pop()}`); }
  return { ok: statuses.every(s => s.startsWith('200')), detail: `h1="${h}" headings=${lessons} quiz=${quiz} files: ${statuses.join('; ')}` };
});
await step('Course page', 'Mark a lesson complete without an account (guest progress)', async () => {
  const btn = page.getByRole('button', { name: /mark (as )?(complete|done)|complete lesson|i('|’)ve done this/i }).first();
  if (!(await btn.count())) return { ok: null, detail: 'no completion button found' };
  await btn.click(); await page.waitForTimeout(500);
  return { ok: true, detail: (await btn.innerText().catch(() => 'clicked')).slice(0, 80) };
});
await step('Inside the Network', 'frame loads a WebGL scene; text version opens; traffic section opens', async () => {
  await page.goto(`${SITE}/inside-the-network`, { waitUntil: 'load' }); await page.waitForTimeout(6000);
  const frame = page.frameLocator('iframe').first();
  const canvas = await frame.locator('canvas').count();
  const summary = page.getByText('Read the network as text').first();
  let textOpen = false; if (await summary.count()) { await summary.click(); await page.waitForTimeout(500); textOpen = (await page.locator('details[open]').count()) > 0; }
  const traffic = frame.getByText(/Follow the traffic/i).first();
  let trafficOk = 'not found'; if (await traffic.count()) { await traffic.click().catch(() => {}); await page.waitForTimeout(800); trafficOk = 'clicked'; }
  await page.screenshot({ path: `${OUT}/shots/interaction-inside-network.jpg`, type: 'jpeg', quality: 60 });
  return { ok: canvas > 0, detail: `canvases in frame=${canvas}; text section opens=${textOpen}; traffic=${trafficOk}` };
});
await step('Inside the Network', 'model views render (default, topology off, overview) at phone and desktop sizes', async () => {
  const out = [];
  for (const [name, hash] of [['default', ''], ['topology-off', '#topology=off'], ['overview', '#view=overview'], ['dc1', '#system=dc1']]) for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const c = await chrome.newContext({ viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 500 });
    const p = await c.newPage(); const e = []; p.on('pageerror', x => e.push(x.message)); p.on('console', m => { if (m.type() === 'error') e.push(m.text()); });
    await p.goto(`${SITE}/inside-network-model/model.html${hash}`, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(9000);
    const canvas = await p.locator('canvas').count();
    await p.screenshot({ path: `${OUT}/shots/model-${name}-${vp.width}.jpg`, type: 'jpeg', quality: 65 });
    out.push(`${name}@${vp.width}: canvas=${canvas} errors=${e.length}${e.length ? ' (' + e.slice(0, 2).join(' / ').slice(0, 160) + ')' : ''}`);
    await c.close();
  }
  return { ok: out.every(o => /canvas=[1-9]/.test(o) && /errors=0/.test(o)), detail: out.join(' | ') };
});
await step('Inside the Network', 'deep link #process=… selects a process', async () => {
  await page.goto(`${SITE}/inside-the-network#process=web-app&step=1`, { waitUntil: 'load' }); await page.waitForTimeout(6000);
  return { ok: null, detail: `page url now ${page.url()}` };
});
await step('My Account', 'sign-in form validates empty and malformed input without sending anything', async () => {
  await page.goto(`${SITE}/my-progress`, { waitUntil: 'networkidle' });
  const sent = []; page.on('request', r => { if (r.method() === 'POST') sent.push(r.url()); });
  const signInTab = page.getByRole('button', { name: /^sign in$/i }).first(); if (await signInTab.count()) await signInTab.click();
  const submit = page.locator('form.reader-account-form button.reader-primary, form button[type=submit], form button.reader-primary').first();
  await submit.click(); await page.waitForTimeout(400);
  const msgs = await page.locator('.reader-error, [role=alert], :invalid').count();
  const email = page.locator('input[type=email]').first();
  if (await email.count()) { await email.fill('not-an-email'); await submit.click(); await page.waitForTimeout(400); }
  const invalid = await page.locator('input:invalid').count();
  return { ok: sent.length === 0 && (msgs > 0 || invalid > 0), detail: `validation signals=${msgs}, invalid inputs=${invalid}, POSTs sent=${sent.length}` };
});
await step('My Account', 'membership options visible to visitors', async () => {
  const t = await page.locator('main').innerText();
  return { ok: /Builder/.test(t) && /Guided/.test(t) && /Community/.test(t), detail: (t.match(/\$\d+[^\n]{0,40}/g) || []).slice(0, 6).join(' | ') };
});
await step('Keyboard', 'first 20 Tab stops on the homepage show a visible focus style', async () => {
  await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
  const out = [];
  for (let i = 0; i < 20; i++) { await page.keyboard.press('Tab'); out.push(await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e); const visible = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'; return { el: `${e.tagName.toLowerCase()} ${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30)}`, visible }; })); }
  const stops = out.filter(Boolean); const hidden = stops.filter(s => !s.visible);
  return { ok: hidden.length === 0, detail: `${stops.length} stops; without visible focus: ${hidden.map(h => h.el).join(' | ') || 'none'}; first: ${stops.slice(0, 4).map(s => s.el).join(' | ')}` };
});
await step('Display', 'dark-mode and reduced-motion renders (screenshots)', async () => {
  const c2 = await chrome.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const p2 = await c2.newPage(); await p2.goto(`${SITE}/`, { waitUntil: 'networkidle' }); await p2.screenshot({ path: `${OUT}/shots/interaction-home-dark-reduced.jpg`, type: 'jpeg', quality: 60 }); await c2.close();
  return { ok: null, detail: 'saved' };
});
await step('Errors', 'pages during interactions threw no errors', async () => ({ ok: errs.length === 0, detail: [...new Set(errs)].slice(0, 8).join(' || ') }));
await chrome.close();
writeFileSync(`${OUT}/browser.json`, JSON.stringify(results, null, 1));
const md = ['# Browser checks', '', '## Pages (Chromium)', ...results.pages.map(p => `- ${p.status} ${p.viewport} ${p.url} | load ${p.loadMs}ms LCP ${p.lcp} CLS ${p.cls} ${p.kb}KB ${p.requests} req | overflow ${p.overflowPx}px | small targets ${p.smallTargets} | errors ${p.consoleErrors?.length} ${p.consoleErrors?.slice(0, 2).join(' / ') || ''} | bad ${p.badResponses?.join(', ') || ''} | axe ${(p.axe || []).map(a => `${a.id}(${a.impact},${a.nodes})`).join(' ') || 'none'}${p.error ? ' | ERROR ' + p.error : ''}`), '', '## Reflow 320px', ...results.reflow.map(r => `- ${r.url} overflow ${r.overflowPx}px ${r.overflowEls?.join(', ') || ''}`), '', '## Cross-browser', ...results.crossBrowser.map(p => `- [${p.browser}] ${p.status} ${p.viewport} ${p.url} | errors ${p.consoleErrors?.join(' / ') || 0} | overflow ${p.overflowPx} ${p.error || ''}`), '', '## Interactions', ...results.interactions.map(i => `- ${i.ok === true ? 'PASS' : i.ok === false ? 'FAIL' : 'INFO'} [${i.area}] ${i.name} — ${i.detail}`)];
writeFileSync(`${OUT}/browser.md`, md.join('\n'));
