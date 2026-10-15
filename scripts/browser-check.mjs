// Opens every page of a running copy of the site in Chromium and reports what a visitor's browser would
// refuse or break on: Content Security Policy blocks, script errors, failed requests, missing browser
// protections, Back links that don't navigate, and the share/owner/form behaviour the audit fixed.
//
//   node scripts/browser-check.mjs http://127.0.0.1:8787
//
// PLAYWRIGHT points at an installed playwright package (CI installs one outside the project).
// Problems are printed as GitHub annotations; the exit code is 1 when a page has a blocking problem.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const base = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const sitemap = existsSync('dist/client/sitemap.xml') ? readFileSync('dist/client/sitemap.xml', 'utf8') : '';
const fromSitemap = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(match => match[1] || '/');
const extra = ['/my-progress', '/account?returnTo=%2Ftraining', '/app-sign-in', '/privacy', '/training/dc01-dc02/', '/training/rmf/', '/inside-network-model/model.html', '/does-not-exist'];
const pages = [...new Set([...fromSitemap, ...extra])];
const protections = ['x-content-type-options', 'referrer-policy', 'x-frame-options', 'permissions-policy'];
const ignoredRequest = url => /cloudflareinsights\.com|\/cdn-cgi\/|youtube-nocookie\.com|ytimg\.com|googlevideo\.com/.test(url);
// Radware's live threat map (/threat-map) is a third-party page in a sandboxed frame: its own requests,
// console output and script errors are Radware's, not this site's. Our page's policy blocking the frame
// itself still shows up as a CSP violation in the main frame.
const thirdPartyFrame = frame => { try { return /^https:\/\/livethreatmap\.radware\.com\//.test(frame?.url() || ''); } catch { return false; } };
const fromThirdParty = (url, frame) => /^https:\/\/livethreatmap\.radware\.com\//.test(url || '') || thirdPartyFrame(frame);

const annotate = (level, title, message) => console.log(`::${level} title=${title}::${String(message).replace(/\r?\n/g, ' | ').slice(0, 3800)}`);
const results = [];
let blocking = 0;

const browser = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
// Record every policy violation in every frame, including the Inside the Network model's frame.
await context.addInitScript(() => {
  window.__violations = [];
  document.addEventListener('securitypolicyviolation', event => {
    window.__violations.push(`${event.effectiveDirective} blocked ${event.blockedURI || 'inline'} (${event.sourceFile || location.pathname}:${event.lineNumber || 0})`);
  });
});

for (const path of pages) {
  const page = await context.newPage();
  const problems = [], notes = [];
  page.on('console', message => {
    if (fromThirdParty(message.location()?.url, null)) return;
    const text = message.text();
    if (/Content Security Policy|Refused to/i.test(text)) problems.push(`console: ${text.slice(0, 300)}`);
    else if (message.type() === 'error' && !/Failed to load resource/.test(text)) notes.push(`console error: ${text.slice(0, 200)}`);
  });
  page.on('pageerror', error => problems.push(`script error: ${String(error.message || error).slice(0, 300)}`));
  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText || '';
    let frame = null; try { frame = request.frame(); } catch {}
    if (fromThirdParty(request.url(), frame)) return;
    if (!ignoredRequest(request.url()) && !/ERR_ABORTED/.test(failure)) problems.push(`request failed: ${request.url().replace(base, '')} (${failure})`);
  });
  page.on('response', response => {
    const url = response.url();
    if (url.startsWith(base) && response.status() >= 400 && url !== base + path) notes.push(`${response.status()} ${url.replace(base, '')}`);
  });
  let status = 0, headers = {};
  try {
    const response = await page.goto(base + path, { waitUntil: 'load', timeout: 60000 });
    status = response?.status() || 0;
    headers = response ? await response.allHeaders() : {};
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    for (const frame of page.frames()) {
      if (thirdPartyFrame(frame)) continue;
      const found = await frame.evaluate(() => window.__violations || []).catch(() => []);
      for (const item of found) problems.push(`CSP: ${item}${frame === page.mainFrame() ? '' : ` [frame ${frame.url().replace(base, '')}]`}`);
    }
  } catch (error) {
    problems.push(`did not load: ${String(error.message || error).split('\n')[0]}`);
  }
  const missing = protections.filter(name => !headers[name]);
  if (missing.length) problems.push(`missing headers: ${missing.join(', ')}`);
  if ((headers['content-type'] || '').includes('text/html') && !headers['content-security-policy']) problems.push('missing header: content-security-policy');
  const expected = path === '/does-not-exist' ? 404 : 200;
  if (status !== expected) problems.push(`status ${status}, expected ${expected}`);
  const unique = [...new Set(problems)];
  if (unique.length) blocking++;
  results.push({ path, status, problems: unique, notes: [...new Set(notes)].slice(0, 8) });
  await page.close();
}

// Back links on course and checklist pages (they did nothing when clicked before the fix).
const backLinks = [];
for (const [from, label, to] of [
  // The course guide is served at /training/<id>/ (the old address redirects there).
  ['/training/dns-configuration/checklist', 'Back to', '/training/dns-configuration/'],
]) {
  const page = await context.newPage();
  try {
    await page.goto(base + from, { waitUntil: 'load', timeout: 60000 });
    // Link names may start with an arrow ("← Back to…").
    await page.getByRole('link', { name: new RegExp('^\\W*' + label) }).first().click();
    await page.waitForURL(url => new URL(url).pathname === to, { timeout: 15000 });
    backLinks.push(`${from} -> ${to} ok`);
  } catch (error) {
    backLinks.push(`${from}: "${label}" did not reach ${to} (${String(error.message || error).split('\n')[0].slice(0, 160)})`);
    blocking++;
  }
  await page.close();
}

// Course guides 1.2–1.10: static pages in the course 1.1 guide's design (scripts/prepare-course-guides.mjs).
// Open each from its old address with a lesson link, walk the three tabs, and keep screenshots for review.
const guides = [];
const configurations = JSON.parse(readFileSync('content/configuration-courses.json', 'utf8'));
mkdirSync('guide-screens', { recursive: true });
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const [index, course] of configurations.entries()) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error.message || error).slice(0, 200)));
  const lesson = course.lessons[1];
  try {
    await page.goto(`${base}/training/${course.id}#${lesson.id}`, { waitUntil: 'load', timeout: 60000 });
    const landed = new URL(page.url());
    if (landed.pathname !== `/training/${course.id}/` || landed.hash !== `#${lesson.id}`) throw new Error(`landed on ${landed.pathname}${landed.hash}`);
    await page.waitForFunction(() => window.SBD_GUIDE_READY === true, null, { timeout: 15000 });
    const listed = await page.locator('#chapter-list .chapter').count();
    if (listed !== course.lessons.length) throw new Error(`${listed} lessons listed, expected ${course.lessons.length}`);
    const title = (await page.locator('#chapter-title').textContent() || '').trim();
    if (title !== lesson.title) throw new Error(`the lesson link opened "${title}"`);
    if ((await page.locator('#guide-panel .step').count()) !== lesson.steps.length) throw new Error('walkthrough steps missing');
    await page.getByRole('tab', { name: 'Security reasoning' }).click();
    await page.locator('#security-panel .controlcard').waitFor({ timeout: 5000 });
    await page.getByRole('tab', { name: 'My evidence' }).click();
    const quizzes = await page.locator('#evidence-panel .quiz').count();
    if (quizzes !== lesson.quizzes.length) throw new Error(`${quizzes} knowledge checks shown, expected ${lesson.quizzes.length}`);
    await page.getByRole('tab', { name: 'Walkthrough' }).click();
    await page.waitForTimeout(1200);
    const scene = (await page.locator('#stage canvas').count()) ? 'canvas' : (await page.locator('#fallback:not([hidden])').count()) ? 'fallback' : '';
    if (!scene) throw new Error('neither the lesson network nor its fallback appeared');
    if (errors.length) throw new Error('script error: ' + errors.join(' | '));
    await page.screenshot({ path: `guide-screens/${String(index + 2).padStart(2, '0')}-${course.id}-desktop.png` });
    guides.push(`${course.id} ok (${scene})`);
  } catch (error) {
    guides.push(`${course.id}: ${String(error.message || error).split('\n')[0].slice(0, 200)}`);
    blocking++;
  }
  await page.close();
}
for (const path of ['/training/dc01-dc02/', '/training/dns-configuration/', '/training/two-tier-pki/']) {
  const name = path.split('/')[2];
  for (const [label, ctx] of [['desktop', context], ['phone', phone]]) {
    if (label === 'desktop' && name !== 'dc01-dc02') continue;
    const page = await ctx.newPage();
    try {
      await page.goto(base + path, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `guide-screens/compare-${name}-${label}.png`, fullPage: label === 'phone' });
    } catch {}
    await page.close();
  }
}

// Network Authorization courses 2.1–2.3 (scripts/prepare-rmf-courses.mjs), one page each. Open each course's first
// module from the old single-page address, check it lands on that course's page, walk the five module tabs, then open
// the course's evidence workspace (and the capstone on 2.3). Screenshots are kept for review.
const rmfData = { window: {} };
for (const file of ['catalog-data.js', 'learning-data.js']) runInNewContext(readFileSync(`public/training/rmf/${file}`, 'utf8'), rmfData);
const { CATALOG_PARTS: rmfParts, CATALOG: rmfModules, LEARNING: rmfLessons } = rmfData.window;
for (const part of rmfParts) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error.message || error).slice(0, 200)));
  const first = part.modules[0], at = `/training/${part.folder}/`;
  const artifacts = new Set(part.modules.flatMap(id => rmfLessons[rmfModules.findIndex(m => m.id === id)].artifacts));
  try {
    // The 2.1 page moves a 2.2 or 2.3 module to its own page while loading, which can interrupt this navigation.
    await page.goto(`${base}/training/rmf/index.html#catalog/${first}`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    await page.waitForURL(url => url.pathname.replace(/index\.html$/, '') === at && url.hash === `#catalog/${first}`, { timeout: 15000 });
    await page.locator('#lesson .tabs').waitFor({ timeout: 15000 });
    const listed = await page.locator('#module-list .num:not(.word)').count();
    if (listed !== part.modules.length) throw new Error(`${listed} modules listed, expected ${part.modules.length}`);
    for (const [name, panel] of [['Learn', '#learn-panel .lesson-body'], ['See', '#see-panel .step'], ['Build', '#build-panel .artifact-links'], ['Prove', '#prove-panel .quiz'], ['RMF step', '#step-panel .controlid']]) {
      await page.getByRole('tab', { name, exact: true }).click();
      await page.locator(panel).first().waitFor({ timeout: 5000 });
    }
    await page.waitForTimeout(1200);
    const scene = (await page.locator('#stage canvas').count()) ? 'canvas' : (await page.locator('#fallback:not([hidden])').count()) ? 'fallback' : '';
    if (!scene) throw new Error('neither the authorization view nor its fallback appeared');
    await page.screenshot({ path: `guide-screens/rmf-${part.number}-desktop.png` });
    await page.evaluate(() => { location.hash = 'evidence'; });
    await page.locator('.artifact-menu button').first().waitFor({ timeout: 5000 });
    const shown = await page.locator('.artifact-menu button').count();
    if (shown !== artifacts.size) throw new Error(`${shown} practice artifacts shown, expected ${artifacts.size}`);
    if (part.capstone) {
      await page.evaluate(() => { location.hash = 'capstone'; });
      await page.locator('.deliverables li').first().waitFor({ timeout: 5000 });
    }
    if (errors.length) throw new Error('script error: ' + errors.join(' | '));
    guides.push(`Course ${part.number} ok (${scene}, ${listed} modules, ${shown} artifacts)`);
  } catch (error) {
    guides.push(`Course ${part.number}: ${String(error.message || error).split('\n')[0].slice(0, 200)}`);
    blocking++;
  }
  await page.close();
}
await phone.close();

// Where crawlers and link previews find the page title, description, picture and canonical address.
const share = [];
for (const [agent, ua] of [
  ['browser', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'],
  ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
  ['facebookexternalhit', 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'],
  ['Slackbot', 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'],
]) {
  for (const path of ['/', '/training/dns-configuration', '/training/dns-configuration/checklist']) {
    const html = await (await fetch(base + path, { headers: { 'user-agent': ua } })).text();
    const head = html.slice(0, Math.max(0, html.indexOf('</head>')));
    const inHead = tag => head.includes(tag);
    const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || '';
    share.push(`${agent} ${path}: title ${inHead('<title>') ? 'in head' : html.includes('<title>') ? 'in body' : 'missing'} ("${title.slice(0, 60)}"), description ${inHead('name="description"') ? 'in head' : 'not in head'}, og:image ${inHead('property="og:image"') ? 'in head' : html.includes('property="og:image"') ? 'in body' : 'missing'}, canonical ${inHead('rel="canonical"') ? 'in head' : 'not in head'}`);
  }
}

// Server behaviour the audit changed.
const server = [];
const check = async (label, request, test) => {
  // Retry once on a network error: a local server may close a kept-alive connection after answering a POST
  // without reading its body, and the next request on that socket fails (Cloudflare doesn't).
  const get = () => fetch(base + request.path, { redirect: 'manual', ...request.init });
  const retry = () => new Promise(resolve => setTimeout(resolve, 500)).then(get);
  try { let response = await get().catch(retry); if (response.status >= 500) response = await retry(); const ok = await test(response); server.push(`${ok ? 'ok' : 'FAIL'} ${label}: ${response.status} ${response.headers.get('location') || ''}`); if (!ok) blocking++; }
  catch (error) { server.push(`FAIL ${label}: ${error.message}`); blocking++; }
};
await check('owner page sends visitors to sign in', { path: '/career-records' }, r => r.status === 302 && (r.headers.get('location') || '').endsWith('/my-progress?returnTo=%2Fcareer-records#account'));
await check('forged ChatGPT identity is ignored', { path: '/career-records', init: { headers: { 'oai-authenticated-user-id': 'x', 'oai-authenticated-user-email': 'support@securebydesigninc.com' } } }, r => r.status === 302);
for (const form of ['/api/career-submissions', '/api/community-contributions', '/api/resource-signups']) {
  await check(`${form} is closed`, { path: form, init: { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: '{"email":"check@example.invalid"}' } }, r => r.status === 410);
}
await check('security.txt', { path: '/security.txt' }, async r => r.status === 200 && (await r.text()).includes('Contact: mailto:support@securebydesigninc.com'));
await check('/.well-known/security.txt', { path: '/.well-known/security.txt' }, async r => r.status === 200 && (await r.text()).includes('Contact: mailto:support@securebydesigninc.com'));
await check('apple-app-site-association', { path: '/.well-known/apple-app-site-association' }, async r => r.status === 200 && (r.headers.get('content-type') || '').includes('application/json') && (await r.text()).includes('PZK2PZT6KP.com.securebydesigninc.secureByDesignApp'));
await check('app sign-in callback page', { path: '/app-auth/callback?code=AAAAAAAAAAAAAAAAAAAAAAAA' }, async r => r.status === 200 && (await r.text()).includes('securebydesign://auth?code=AAAAAAAAAAAAAAAAAAAAAAAA'));
await check('old RMF catalog download moves to the course 2.1 workbook', { path: '/training/rmf/Secure_By_Design_RMF_Training_Catalog.docx' }, r => r.status === 301 && (r.headers.get('location') || '').endsWith('/training/rmf/SecureByDesign-rmf-Workbook.docx'));
await check('favicon.ico', { path: '/favicon.ico' }, r => r.status === 200);
await check('share picture', { path: '/og/secure-by-design.jpg' }, r => r.status === 200 && (r.headers.get('content-type') || '').includes('image/jpeg'));
await check('logo size under 20 KB', { path: '/brand-lock.svg' }, async r => r.status === 200 && (await r.arrayBuffer()).byteLength < 20000);

// Cloudflare Web Analytics (kept by the owner, 8 October 2026): Cloudflare injects its beacon at the edge, so this only
// finds it on the live site. Informational: the CSP must allow it, but a local run has no beacon to load.
const analytics = await (async () => {
  const page = await context.newPage();
  const seen = [];
  page.on('response', response => { if (/cloudflareinsights\.com|\/cdn-cgi\/rum/.test(response.url())) seen.push(`${response.request().method()} ${new URL(response.url()).host}${new URL(response.url()).pathname} ${response.status()}`); });
  // A report still in flight when the page navigates away is aborted by the browser; that's expected.
  page.on('requestfailed', request => { if (/cloudflareinsights\.com|\/cdn-cgi\/rum/.test(request.url()) && !/ERR_ABORTED/.test(request.failure()?.errorText || '')) seen.push(`FAILED ${request.url()} (${request.failure()?.errorText})`); });
  try {
    await page.goto(base + '/training', { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.goto(base + '/privacy', { waitUntil: 'load', timeout: 60000 }); // leaving the first page sends its report
    await page.waitForTimeout(4000);
  } catch (error) { seen.push(`error: ${String(error.message || error).split('\n')[0]}`); }
  await page.close();
  return seen.length ? [...new Set(seen)].join(' || ') : 'no beacon (expected for a local run)';
})();

await browser.close();

const failing = results.filter(result => result.problems.length);
annotate(failing.length ? 'warning' : 'notice', 'Pages checked', `${results.length} pages; ${failing.length} with problems. Clean: ${results.filter(r => !r.problems.length).map(r => r.path).join(', ')}`);
failing.slice(0, 9).forEach(result => annotate('error', `Browser check ${result.path}`, result.problems.join(' || ')));
if (failing.length > 9) annotate('error', 'Browser check (more pages)', failing.slice(9).map(result => `${result.path}: ${result.problems.join(' || ')}`).join(' ### '));
const noted = results.filter(result => result.notes.length);
if (noted.length) annotate('notice', 'Other console messages and 4xx responses', noted.map(result => `${result.path}: ${result.notes.join('; ')}`).join(' ### '));
annotate('notice', 'Back links', backLinks.join(' || '));
annotate(guides.some(line => !/ ok /.test(line + ' ')) ? 'error' : 'notice', 'Course guides', guides.join(' || '));
annotate('notice', 'Share previews and crawlers', share.join(' || '));
annotate(server.some(line => line.startsWith('FAIL')) ? 'warning' : 'notice', 'Server checks', server.join(' || '));
annotate(/FAILED|error/.test(analytics) ? 'warning' : 'notice', 'Cloudflare Web Analytics', analytics);
writeFileSync('browser-check.json', JSON.stringify({ base, results, backLinks, guides, share, server, analytics }, null, 1));
console.log(`${results.length} pages, ${failing.length} with problems; ${blocking} blocking issue(s).`);
process.exit(blocking ? 1 : 0);
