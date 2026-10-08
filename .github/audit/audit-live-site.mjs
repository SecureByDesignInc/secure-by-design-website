// Live-site audit for securebydesigninc.com. Runs from GitHub Actions (the domain is reachable there).
// Compares what the domain serves with the repository at EXPECTED_SHA and checks each discussed update.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const SITE = process.env.SITE || 'https://securebydesigninc.com';
const WWW = 'https://www.securebydesigninc.com';
const WORKERS = 'https://secure-by-design-website.securebydesign.workers.dev';
const EXPECTED = process.env.EXPECTED_SHA || '';
const ROOT = process.env.REPO_DIR || '.';
const out = { site: SITE, expected: EXPECTED, startedAt: new Date().toISOString(), checks: [], routes: [], files: {}, resources: [], links: {} };
const check = (area, name, ok, detail = '') => { out.checks.push({ area, name, ok: ok === null ? null : Boolean(ok), detail: String(detail).slice(0, 600) }); };
const sha = buf => createHash('sha256').update(buf).digest('hex');
const text = html => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;|&rsquo;|’/g, "'").replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/\s+/g, ' ');

async function get(url, opts = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { redirect: opts.redirect || 'follow', headers: { 'user-agent': 'SBD-live-audit/1.0', 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
      const buf = Buffer.from(await r.arrayBuffer());
      return { status: r.status, url: r.url, location: r.headers.get('location'), type: r.headers.get('content-type') || '', buf, body: buf.toString('utf8') };
    } catch (e) { if (attempt === 3) return { status: 0, error: e.message, buf: Buffer.alloc(0), body: '' }; await new Promise(r => setTimeout(r, 2000)); }
  }
}
const json = async p => JSON.parse(await readFile(join(ROOT, p), 'utf8'));
async function walk(dir) { const res = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) res.push(...await walk(p)); else res.push(p); } return res; }

// 1. Which build is live
for (const [label, base] of [['apex', SITE], ['www', WWW], ['workers.dev', WORKERS]]) {
  const r = await get(`${base}/build-info.json?audit=${Date.now()}`);
  let commit = ''; try { commit = JSON.parse(r.body).commit; } catch {}
  check('Hosting', `${label} serves the current main build`, commit === EXPECTED, `${base} → ${r.status} commit ${commit || 'none'} (expected ${EXPECTED})`);
}
{
  const r = await get('http://securebydesigninc.com/', { redirect: 'manual' });
  check('Hosting', 'http:// redirects to https://', [301, 302, 307, 308].includes(r.status) && /^https:/.test(r.location || ''), `${r.status} → ${r.location}`);
}

// 2. Every public/ file is byte-identical on the live site
const publicDir = join(ROOT, 'public');
const files = (await walk(publicDir)).map(f => relative(publicDir, f).split('\\').join('/')).filter(f => f !== 'build-info.json' && !f.endsWith('.DS_Store'));
let same = 0; const diff = [], missing = [];
const queue = [...files];
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) { const f = queue.shift(); const local = await readFile(join(publicDir, f)); const r = await get(`${SITE}/${f.split('/').map(encodeURIComponent).join('/')}`); if (r.status !== 200) missing.push(`${f} (${r.status})`); else if (sha(r.buf) !== sha(local)) diff.push(`${f} (live ${r.buf.length} B, repo ${local.length} B)`); else same++; } }));
out.files = { total: files.length, identical: same, different: diff, missing };
check('Hosting', 'Every static file in public/ is live and identical to main', !diff.length && !missing.length, `${same}/${files.length} identical; ${diff.length} different; ${missing.length} missing`);

// 3. Routes
const cc = await json('content/configuration-courses.json');
const vids = await json('content/videos.json');
const articles = await json('content/articles.json');
const routes = ['/', '/training', '/inside-the-network', '/my-progress', '/account', '/about', '/blog', '/blogs', '/resources', '/rmf-series', '/rmf-series/artifacts', '/rmf-series/controls', '/rmf-series/phases-and-evidence', '/rmf-series/prepare', '/rmf-series/system', '/rmf-series/other-approaches', '/rmf-series/concepts/dns', '/inside-network-model/model.html', '/training/dc01-dc02/index.html', '/training/rmf/index.html', '/sitemap.xml', '/robots.txt'];
for (const c of cc) routes.push(`/training/${c.id}`, `/training/${c.id}/checklist`);
for (const a of articles) if (!a.draft) routes.push(`/blog/${a.slug}`);
const pages = {};
for (const path of routes) {
  const r = await get(SITE + path);
  pages[path] = r;
  const title = (r.body.match(/<title>([^<]*)/) || [])[1] || '';
  out.routes.push({ path, status: r.status, final: r.url, title });
}
const bad = out.routes.filter(r => r.status !== 200);
check('Pages', 'Every known page returns 200', !bad.length, bad.map(r => `${r.path} → ${r.status}`).join('; ') || `${out.routes.length} pages`);

// Sitemap entries
{
  const locs = [...(pages['/sitemap.xml'].body.matchAll(/<loc>([^<]+)<\/loc>/g))].map(m => m[1]);
  const broken = [];
  for (const loc of locs) { const r = await get(loc.replace(/^https?:\/\/(www\.)?securebydesigninc\.com/, SITE)); if (r.status !== 200) broken.push(`${loc} → ${r.status}`); }
  out.sitemap = { count: locs.length, broken, locs };
  check('Pages', 'Every sitemap URL returns 200', locs.length && !broken.length, `${locs.length} URLs; broken: ${broken.join('; ') || 'none'}`);
  const stale = locs.filter(l => /cyber-range|careers|career-|community|\/videos|learning-library|memberships|how-to|guides-and-labs/.test(l));
  check('Decommissioned', 'Sitemap does not list decommissioned or redirected pages', !stale.length, stale.join('; ') || 'none');
}

// Redirects
for (const [from, to] of [['/videos', '/training'], ['/learning-library', '/training'], ['/memberships', '/my-progress'], ['/career-explorer', '/careers']]) {
  const r = await get(SITE + from, { redirect: 'manual' });
  check('Redirects', `${from} redirects to ${to}`, [301, 308, 302, 307].includes(r.status) && (r.location || '').includes(to), `${r.status} → ${r.location}`);
}

// Decommissioned sections: reachable by URL? linked from anywhere?
for (const path of ['/cyber-range', '/careers', '/career-goals', '/how-to', '/guides-and-labs', '/community-contributions']) {
  const r = await get(SITE + path, { redirect: 'manual' });
  check('Decommissioned', `${path} direct-URL status (informational)`, null, `${r.status}${r.location ? ' → ' + r.location : ''}`);
}

// 4. Crawl internal links from the main pages
const seen = new Map(); const linkSources = {};
const crawlQueue = ['/', '/training', '/inside-the-network', '/my-progress', '/about', '/blog', '/resources', '/rmf-series', ...cc.map(c => `/training/${c.id}`)];
const htmlFetched = new Set();
while (crawlQueue.length && htmlFetched.size < 250) {
  const path = crawlQueue.shift(); if (htmlFetched.has(path)) continue; htmlFetched.add(path);
  const r = pages[path] || await get(SITE + path); seen.set(path, r.status);
  if (!/text\/html/.test(r.type || 'text/html')) continue;
  for (const m of r.body.matchAll(/href="([^"#?]*)(?:[?#][^"]*)?"/g)) {
    let href = m[1]; if (!href) continue;
    if (/^https?:\/\/(www\.)?securebydesigninc\.com/.test(href)) href = href.replace(/^https?:\/\/(www\.)?securebydesigninc\.com/, '') || '/';
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    (linkSources[href] ||= new Set()).add(path);
    if (!htmlFetched.has(href) && !crawlQueue.includes(href) && !/\.(pdf|docx|xlsx|zip|png|jpe?g|webp|svg|css|js|mjs|ico|txt|md|csv|json|woff2?)$/i.test(href)) crawlQueue.push(href);
  }
}
const linkStatus = {};
for (const href of Object.keys(linkSources)) { if (seen.has(href)) linkStatus[href] = seen.get(href); else { const r = await get(SITE + href, { redirect: 'manual' }); linkStatus[href] = r.status; } }
const broken = Object.entries(linkStatus).filter(([, s]) => s >= 400 || s === 0);
out.links = { checked: Object.keys(linkStatus).length, broken: broken.map(([h, s]) => ({ href: h, status: s, from: [...linkSources[h]].slice(0, 5) })) };
check('Pages', 'No broken internal links on crawled pages', !broken.length, `${Object.keys(linkStatus).length} links checked; ${broken.map(([h, s]) => `${h} (${s}) from ${[...linkSources[h]].slice(0, 3).join(', ')}`).join('; ') || 'none broken'}`);
const decomLinks = Object.keys(linkSources).filter(h => /^\/(cyber-range|careers|career-goals|career-explorer|community-contributions|how-to|guides-and-labs)(\/|$)/.test(h));
check('Decommissioned', 'No page links to Cyber Range or Community/career pages', !decomLinks.length, decomLinks.map(h => `${h} from ${[...linkSources[h]].slice(0, 4).join(', ')}`).join('; ') || 'none');

// 5. Content checks per discussed update
const has = (path, needle) => text(pages[path]?.body || '').toLowerCase().includes(needle.toLowerCase());
const home = '/';
check('Homepage', 'Start building your network section', has(home, 'Start building your network'));
check('Homepage', 'A note from Secure By Design card', has(home, 'A note from Secure By Design'));
{
  const b = text(pages[home].body); const i = b.indexOf('Start building your network'), j = b.indexOf('A note from Secure By Design');
  check('Homepage', 'Note card follows Start building your network', i >= 0 && j > i, `positions ${i} / ${j}`);
}
const nav = (pages[home].body.match(/<nav[\s\S]*?<\/nav>/i) || [''])[0];
check('Homepage', 'Navigation is Home / Inside the Network / Training Library / My Account only', /Inside the Network/.test(nav) && /Training Library/.test(nav) && /My Account/.test(nav) && !/Cyber Range|>Community</.test(nav), text(nav).slice(0, 200));
check('Training Library', 'Build the Network category', has('/training', 'Build the Network'));
check('Training Library', 'Network Authorization category', has('/training', 'Network Authorization'));
check('Training Library', 'Share invitation (Learn it. Share it. Pay it forward.)', has('/training', 'Learn it. Share it. Pay it forward.'));
check('Training Library', '“Written training available” and “Open training” labels', has('/training', 'Written training available') && has('/training', 'Open training'));
const tilesServer = (pages['/training'].body.match(/id="tile-title-/g) || []).length;
check('Training Library', 'Tiles in the first page of the catalog (server HTML)', null, `${tilesServer} tiles before "Show more"; catalog has ${vids.episodes.length + vids.courses.length} entries`);
for (const c of cc) {
  const path = `/training/${c.id}`; const missingLessons = c.lessons.filter(l => !has(path, l.title)).map(l => l.title);
  const course = vids.courses.find(v => v.id === c.id);
  const ed = course?.training?.materialsEdition;
  check('Courses', `${course?.number} ${course?.title}: all ${c.lessons.length} lessons on the live page`, !missingLessons.length, missingLessons.length ? 'missing: ' + missingLessons.join(' | ') : `edition ${ed}`);
}
const lessonsExpected = { 'connect-segment': "Protect the router's own management", 'workstation-fleet': 'Admit only enrolled devices with 802.1X', 'prove-recovery': 'Carry the copies to the offline cabinet' };
for (const [id, t] of Object.entries(lessonsExpected)) check('Architecture courses', `New lesson “${t}” is live`, has(`/training/${id}`, t));
for (const [id, needles] of Object.entries({ 'logging-pipeline': ['Linux', 'SBD-AUDIT01'], 'patch-protect': ['Nessus', 'Linux'], 'workstation-fleet': ['SBD-DHCP01', 'NPS'] })) {
  check('Architecture courses', `/training/${id} mentions ${needles.join(' + ')}`, needles.every(n => has(`/training/${id}`, n)));
}
check('My Account', 'Continue learning leads the signed-in page (text present)', has('/my-progress', 'Continue learning'));
check('My Account', 'Membership options Community / Builder / Guided', ['Community', 'Builder', 'Guided'].every(n => has('/my-progress', n)));
check('My Account', 'Guided tier text (informational)', null, (text(pages['/my-progress'].body).match(/Guided.{0,400}/) || [''])[0]);
check('App labels', 'iOS invitation-only TestFlight beta / Android coming soon', (has('/account', 'invitation-only') || has('/my-progress', 'invitation-only') || has('/', 'invitation-only')) && (has('/account', 'TestFlight') || has('/', 'TestFlight')));
check('Inside the Network', 'Page heading and “Read the network as text”', has('/inside-the-network', 'Read the network as text'));
check('Closing invitation', '“If this helped you, help someone else find it.” on guides (script served)', (await get(SITE + '/footer-share.mjs')).body.includes('If this helped you, help someone else find it.'));

// 6. Training resources (what the app bookmarks and the Resources page link to)
const resources = await json('content/training-resources.json');
const resBad = [];
for (const r of resources) {
  const url = r.url.replace(/#.*$/, '').replace(/^https:\/\/securebydesigninc\.com/, SITE);
  const res = await get(url); out.resources.push({ id: r.id, url: r.url, status: res.status });
  if (res.status !== 200) resBad.push(`${r.id} ${r.url} → ${res.status}`);
}
check('Resources', `All ${resources.length} training resources (workbooks, checklists, guides) download`, !resBad.length, resBad.join('; ') || 'all 200');

// 7. Inside the Network model data on the live site
{
  const sec = (await get(SITE + '/inside-network-model/security.js')).body;
  const arch = (await get(SITE + '/inside-network-model/architecture.js')).body;
  check('Inside the Network', 'Live model has linuxMembers (Splunk, Nessus) and domainMembers', /linuxMembers/.test(sec) && /domainMembers/.test(sec));
  check('Inside the Network', 'Live model gives the NPS role to SBD-DHCP01 (roleChanges)', /roleChanges/.test(arch) && /NPS/.test(arch));
  check('Inside the Network', 'Live model has policy rules F19 and F20', /['"]F19['"]/.test(sec) && /['"]F20['"]/.test(sec));
  const internal = ['app.js', 'packets.js'];
  const hits = [];
  for (const f of internal) if ((await get(`${SITE}/inside-network-model/${f}`)).body.includes('SecureByDesign.internal')) hits.push(f);
  check('Training recommendations (Oct 6)', 'Sample domain standardized on sbd.test in the model', !hits.length, hits.length ? `SecureByDesign.internal still in ${hits.join(', ')}` : 'ok');
  const ad = pages['/blog/what-is-active-directory'] || await get(SITE + '/blog/what-is-active-directory');
  check('Training recommendations (Oct 6)', '“What Is Active Directory?” uses sbd.test as the internal domain', !/internal domain is securebydesigninc\.com/i.test(text(ad.body)), (text(ad.body).match(/internal domain is.{0,40}/i) || [''])[0]);
  const dc = (await get(SITE + '/training/dc01-dc02/package-manifest.json')).body;
  check('Training recommendations (Oct 6)', 'DC01/DC02 workbook new edition (ports box, pktmon step)', !/0\.3/.test(dc), (dc.match(/"edition"[^,]*/) || [''])[0]);
}

out.finishedAt = new Date().toISOString();
await mkdir('audit-results', { recursive: true });
await writeFile('audit-results/audit.json', JSON.stringify(out, null, 1));
const icon = c => c.ok === null ? 'ℹ️' : c.ok ? '✅' : '❌';
const md = [`# Live audit — ${SITE}`, '', `Expected build: \`${EXPECTED}\` · ${out.startedAt}`, '', '| | Area | Check | Detail |', '|---|---|---|---|', ...out.checks.map(c => `| ${icon(c)} | ${c.area} | ${c.name} | ${c.detail.replace(/\|/g, '/').replace(/\n/g, ' ')} |`), '', `Files: ${same}/${files.length} identical`, ...diff.map(d => `- different: ${d}`), ...missing.map(d => `- missing: ${d}`), '', '## Routes', ...out.routes.map(r => `- ${r.status} ${r.path} — ${r.title}`)].join('\n');
await writeFile('audit-results/audit.md', md + '\n');
console.log(md);
