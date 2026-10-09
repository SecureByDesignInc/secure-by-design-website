// Crawl securebydesigninc.com: every reachable page, its SEO metadata, links (internal + external), fragments,
// images, forms and frames. Read-only GET/HEAD requests with modest concurrency.
import { mkdirSync, writeFileSync } from 'node:fs';
import * as cheerio from 'cheerio';

const SITE = 'https://securebydesigninc.com';
const OUT = 'audit-results/full/crawl';
mkdirSync(`${OUT}/text`, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 SBD-site-audit';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchOnce(url, { method = 'GET', manual = false, timeout = 30000 } = {}) {
  const started = Date.now();
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(url, { method, redirect: manual ? 'manual' : 'follow', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }, signal: AbortSignal.timeout(timeout) });
      const buf = method === 'HEAD' ? Buffer.alloc(0) : Buffer.from(await r.arrayBuffer());
      return { status: r.status, url: r.url, redirected: r.redirected, location: r.headers.get('location'), type: r.headers.get('content-type') || '', length: Number(r.headers.get('content-length')) || buf.length, ms: Date.now() - started, headers: Object.fromEntries(r.headers), buf };
    } catch (e) { if (attempt === 2) return { status: 0, error: String(e.cause?.code || e.name || e.message), ms: Date.now() - started, buf: Buffer.alloc(0), headers: {} }; await sleep(1500); }
  }
}
async function chain(url) { // follow redirects manually to record the chain
  const hops = []; let current = url;
  for (let i = 0; i < 8; i++) {
    const r = await fetchOnce(current, { manual: true, method: 'GET' });
    hops.push({ url: current, status: r.status });
    if (![301, 302, 303, 307, 308].includes(r.status) || !r.location) return { hops, final: r };
    current = new URL(r.location, current).toString();
  }
  return { hops, final: null };
}
async function pool(items, n, fn) { const q = [...items]; await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); }
const norm = u => { const x = new URL(u); x.hash = ''; if (x.hostname === 'www.securebydesigninc.com') x.hostname = 'securebydesigninc.com'; return x.toString(); };
const isInternal = u => /^https?:\/\/(www\.)?securebydesigninc\.com(\/|$)/.test(u);
const isPageLike = u => !/\.(pdf|docx?|xlsx?|pptx?|zip|png|jpe?g|webp|gif|svg|ico|css|js|mjs|txt|md|csv|json|xml|woff2?|ttf|mp4|webm)(\?|$)/i.test(new URL(u).pathname);

// Seeds: sitemap + homepage + redirects/offline routes we expect to behave a certain way.
const sm = await fetchOnce(`${SITE}/sitemap.xml`);
const sitemap = [...sm.buf.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
const pages = new Map(); // url -> record
const linkGraph = new Map(); // target -> Set(source)
const queue = [...new Set([`${SITE}/`, ...sitemap.map(norm)])];
const queued = new Set(queue);
const assets = new Map(); // internal non-page url -> sources
const external = new Map(); // external url -> sources
const fragments = []; // {source, target, id}

async function visit(url) {
  if (pages.size >= 700) return;
  const r = await fetchOnce(url);
  const rec = { url, status: r.status, finalUrl: r.url, redirected: r.redirected, type: r.type, bytes: r.buf.length, ms: r.ms, error: r.error, cache: r.headers['cache-control'] || '', encoding: r.headers['content-encoding'] || '' };
  pages.set(url, rec);
  if (r.status !== 200 || !/text\/html/.test(r.type)) return;
  const html = r.buf.toString('utf8');
  const $ = cheerio.load(html);
  rec.lang = $('html').attr('lang') || '';
  rec.title = $('head > title').first().text().trim();
  rec.description = $('meta[name="description"]').attr('content') || '';
  rec.canonical = $('link[rel="canonical"]').attr('href') || '';
  rec.robots = $('meta[name="robots"]').attr('content') || '';
  rec.viewport = $('meta[name="viewport"]').attr('content') || '';
  rec.og = { title: $('meta[property="og:title"]').attr('content') || '', description: $('meta[property="og:description"]').attr('content') || '', image: $('meta[property="og:image"]').attr('content') || '', url: $('meta[property="og:url"]').attr('content') || '', type: $('meta[property="og:type"]').attr('content') || '' };
  rec.twitter = $('meta[name="twitter:card"]').attr('content') || '';
  rec.jsonLd = $('script[type="application/ld+json"]').length;
  rec.icons = $('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]').map((_, e) => `${$(e).attr('rel')}=${$(e).attr('href')}`).get();
  rec.h1 = $('h1').map((_, e) => $(e).text().trim().replace(/\s+/g, ' ')).get();
  rec.headings = $('h1,h2,h3,h4,h5,h6').map((_, e) => e.tagName).get();
  rec.headingSkips = rec.headings.reduce((acc, h, i, a) => (i && Number(h[1]) - Number(a[i - 1][1]) > 1 ? acc + 1 : acc), 0);
  rec.imgs = $('img').length;
  rec.imgNoAlt = $('img:not([alt])').map((_, e) => $(e).attr('src')).get().slice(0, 20);
  rec.imgNoSize = $('img:not([width]), img:not([height])').length;
  rec.forms = $('form').map((_, e) => ({ action: $(e).attr('action') || '', method: $(e).attr('method') || 'get' })).get();
  rec.iframes = $('iframe').map((_, e) => ({ src: $(e).attr('src') || '', title: $(e).attr('title') || '', sandbox: $(e).attr('sandbox') ?? null })).get();
  rec.scripts = $('script[src]').map((_, e) => $(e).attr('src')).get();
  rec.inlineScripts = $('script:not([src])').length;
  rec.inlineScriptBytes = $('script:not([src])').map((_, e) => $(e).html().length).get().reduce((a, b) => a + b, 0);
  rec.styles = $('link[rel="stylesheet"]').map((_, e) => $(e).attr('href')).get();
  rec.targetBlankNoopener = $('a[target="_blank"]').filter((_, e) => !/noopener|noreferrer/.test($(e).attr('rel') || '')).length;
  rec.emptyLinks = $('a').filter((_, e) => !$(e).text().trim() && !$(e).attr('aria-label') && !$(e).find('img[alt]').length && !$(e).attr('title')).length;
  rec.ids = $('[id]').map((_, e) => $(e).attr('id')).get();
  const dupIds = rec.ids.filter((id, i, a) => a.indexOf(id) !== i);
  rec.duplicateIds = [...new Set(dupIds)].slice(0, 20);
  const text = $('body').clone().find('script,style,noscript,svg').remove().end().text().replace(/\s+/g, ' ').trim();
  rec.words = text ? text.split(' ').length : 0;
  writeFileSync(`${OUT}/text/${new URL(url).pathname.replace(/[^a-z0-9]+/gi, '_') || 'home'}.txt`, text.replace(/([.!?]) /g, '$1\n'));
  rec.placeholders = (text.match(/\b(lorem ipsum|TODO|TBD|FIXME|placeholder|coming soon|in the works|undefined|NaN|\[object Object\])\b/gi) || []).slice(0, 30);
  for (const el of $('a[href], area[href]').toArray()) {
    const href = $(el).attr('href').trim();
    if (!href || /^(mailto|tel|javascript|sms|data):/i.test(href)) { if (/^mailto:/i.test(href)) (external.get(href) || external.set(href, new Set()).get(href)).add(url); continue; }
    let abs; try { abs = new URL(href, r.url).toString(); } catch { continue; }
    if (href.startsWith('#') || (isInternal(abs) && new URL(abs).hash)) { const t = new URL(abs); if (t.hash.length > 1) fragments.push({ source: url, target: norm(abs), id: decodeURIComponent(t.hash.slice(1)) }); }
    if (isInternal(abs)) {
      const n = norm(abs);
      (linkGraph.get(n) || linkGraph.set(n, new Set()).get(n)).add(url);
      if (isPageLike(n)) { if (!queued.has(n)) { queued.add(n); queue.push(n); } }
      else (assets.get(n) || assets.set(n, new Set()).get(n)).add(url);
    } else if (/^https?:/.test(abs)) (external.get(abs) || external.set(abs, new Set()).get(abs)).add(url);
  }
  for (const src of [...rec.scripts, ...rec.styles, ...$('img[src]').map((_, e) => $(e).attr('src')).get(), ...$('source[src], video[src], iframe[src]').map((_, e) => $(e).attr('src')).get()]) {
    let abs; try { abs = new URL(src, r.url).toString(); } catch { continue; }
    if (isInternal(abs)) { const n = norm(abs); (assets.get(n) || assets.set(n, new Set()).get(n)).add(url); }
    else if (/^https?:/.test(abs)) (external.get(abs) || external.set(abs, new Set()).get(abs)).add(url);
  }
  for (const f of rec.iframes) { try { const abs = new URL(f.src, r.url).toString(); if (isInternal(abs) && isPageLike(abs)) { const n = norm(abs); if (!queued.has(n)) { queued.add(n); queue.push(n); } } } catch {} }
}
while (queue.length && pages.size < 700) { const batch = queue.splice(0, 4); await Promise.all(batch.map(visit)); }

// Internal assets: status, type, size.
const assetResults = [];
await pool([...assets.keys()], 6, async u => { const r = await fetchOnce(u, { timeout: 60000 }); assetResults.push({ url: u, status: r.status, type: r.type, bytes: r.buf.length, cache: r.headers['cache-control'] || '', encoding: r.headers['content-encoding'] || '', from: [...assets.get(u)].slice(0, 5) }); });

// Fragments: check the id exists in the target's served HTML (client-rendered ids may be missing; reported as unverified).
const fragmentResults = fragments.filter((f, i, a) => a.findIndex(g => g.target === f.target && g.id === f.id) === i).map(f => { const p = pages.get(f.target); return { ...f, found: p?.ids ? p.ids.includes(f.id) : null }; });

// External links: one GET each (HEAD is often refused), browser-like UA.
const externalResults = [];
await pool([...external.keys()].filter(u => /^https?:/.test(u)), 6, async u => { const r = await fetchOnce(u, { timeout: 25000 }); externalResults.push({ url: u, status: r.status, final: r.url, error: r.error, from: [...external.get(u)].slice(0, 5) }); });
const mailtos = [...external.keys()].filter(u => /^mailto:/i.test(u)).map(u => ({ url: u, from: [...external.get(u)].slice(0, 5) }));

// Expected behaviours: redirects, offline sections, a missing page.
const expectations = [];
for (const [from, to] of [['/about', '/#about'], ['/account', '/my-progress'], ['/memberships', '/my-progress#memberships'], ['/videos', '/training'], ['/learning-library', '/training'], ['/rmf-series/system', null], ['/career-explorer', null], ['/training/dc01-dc02/index.html', '/training/dc01-dc02/'], ['/training/rmf/index.html', '/training/rmf/'], ['/.well-known/security.txt', null], ['/apple-app-site-association', null]]) { const c = await chain(SITE + from); expectations.push({ kind: 'redirect', from, expect: to, hops: c.hops }); }
for (const p of ['/blog', '/blogs', '/rmf-series', '/blog/what-is-active-directory', '/cyber-range', '/how-to', '/guides-and-labs', '/careers', '/career-goals', '/resources', '/resource-options', '/learning-library', `/audit-missing-page-${Date.now()}`]) { const r = await fetchOnce(SITE + p, { manual: true }); const $ = cheerio.load(r.buf.toString()); expectations.push({ kind: 'status', path: p, status: r.status, location: r.location, title: $('title').text().trim(), h1: $('h1').first().text().trim() }); }
for (const host of ['http://securebydesigninc.com/', 'http://www.securebydesigninc.com/', 'https://www.securebydesigninc.com/training?x=1', 'https://secure-by-design-website.securebydesign.workers.dev/']) { const c = await chain(host); expectations.push({ kind: 'host', from: host, hops: c.hops, finalStatus: c.final?.status }); }

const pageList = [...pages.values()];
const dup = key => { const m = new Map(); for (const p of pageList) if (p[key]) (m.get(p[key]) || m.set(p[key], []).get(p[key])).push(p.url); return [...m].filter(([, v]) => v.length > 1).map(([k, v]) => ({ value: k, pages: v })); };
const result = { site: SITE, at: new Date().toISOString(), sitemap, pages: pageList.map(({ ids, ...p }) => p), linkSources: Object.fromEntries([...linkGraph].map(([k, v]) => [k, [...v].slice(0, 8)])), assets: assetResults, fragments: fragmentResults, external: externalResults, mailtos, expectations, duplicateTitles: dup('title'), duplicateDescriptions: dup('description') };
writeFileSync(`${OUT}/crawl.json`, JSON.stringify(result, null, 1));
const bad = pageList.filter(p => p.status !== 200);
const lines = [`# Crawl ${result.at}`, `${pageList.length} pages crawled, ${bad.length} not 200; sitemap ${sitemap.length}; assets ${assetResults.length} (${assetResults.filter(a => a.status !== 200).length} not 200); external ${externalResults.length} (${externalResults.filter(e => e.status >= 400 || e.status === 0).length} failing); fragments ${fragmentResults.length} (${fragmentResults.filter(f => f.found === false).length} missing ids)`];
lines.push('', '## Pages', ...pageList.map(p => `- ${p.status} ${p.url} | ${p.ms}ms ${Math.round(p.bytes / 1024)}KB | title: ${p.title || ''} | desc: ${(p.description || '').length} | canon: ${p.canonical || '-'} | og:image: ${p.og?.image ? 'y' : 'n'} | h1: ${(p.h1 || []).length} | noalt: ${(p.imgNoAlt || []).length} | words ${p.words || 0}`));
lines.push('', '## Non-200 internal assets', ...assetResults.filter(a => a.status !== 200).map(a => `- ${a.status} ${a.url} from ${a.from.join(', ')}`));
lines.push('', '## External failing', ...externalResults.filter(e => e.status >= 400 || e.status === 0).map(e => `- ${e.status} ${e.error || ''} ${e.url} from ${e.from.join(', ')}`));
lines.push('', '## Missing fragment ids', ...fragmentResults.filter(f => f.found === false).map(f => `- #${f.id} on ${f.target} from ${f.source}`));
lines.push('', '## Expectations', ...expectations.map(e => `- ${JSON.stringify(e)}`));
writeFileSync(`${OUT}/crawl.md`, lines.join('\n'));
console.log(lines.slice(0, 3).join('\n'));
