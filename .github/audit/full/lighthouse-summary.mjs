import { readdirSync, readFileSync } from 'node:fs';
const dir = process.argv[2];
const rows = [], details = [];
for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  let r; try { r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); } catch { continue; }
  const c = r.categories || {}, a = r.audits || {};
  const s = k => c[k] ? Math.round(c[k].score * 100) : '-';
  const m = k => a[k]?.displayValue || '-';
  rows.push(`| ${f.replace('.json', '')} | ${s('performance')} | ${s('accessibility')} | ${s('best-practices')} | ${s('seo')} | ${m('first-contentful-paint')} | ${m('largest-contentful-paint')} | ${m('total-blocking-time')} | ${m('cumulative-layout-shift')} | ${m('total-byte-weight')} |`);
  const opps = Object.values(a).filter(x => x.details?.type === 'opportunity' && (x.details.overallSavingsMs > 0 || x.details.overallSavingsBytes > 0)).sort((x, y) => (y.details.overallSavingsMs || 0) - (x.details.overallSavingsMs || 0)).slice(0, 6).map(x => `${x.title} (${x.displayValue || ''})${x.details.items?.[0]?.url ? ' e.g. ' + x.details.items[0].url.slice(0, 100) : ''}`);
  const failing = [];
  for (const [cat, obj] of Object.entries(c)) for (const ref of obj.auditRefs || []) { const x = a[ref.id]; if (x && x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'manual' && cat !== 'performance') failing.push(`[${cat}] ${x.title}${x.details?.items?.[0] ? ' — ' + JSON.stringify(x.details.items[0]).slice(0, 160) : ''}`); }
  const diag = ['largest-contentful-paint-element', 'lcp-lazy-loaded', 'render-blocking-resources', 'unused-javascript', 'uses-optimized-images', 'modern-image-formats', 'uses-responsive-images', 'efficient-animated-content', 'bootup-time', 'mainthread-work-breakdown', 'dom-size', 'uses-long-cache-ttl', 'font-display', 'third-party-summary'].filter(k => a[k] && a[k].score !== null && a[k].score < 0.9).map(k => `${a[k].title}: ${a[k].displayValue || ''}`);
  details.push(`### ${f}\n- Opportunities: ${opps.join(' · ') || 'none'}\n- Diagnostics: ${diag.join(' · ') || 'none'}\n- Failing (non-performance): ${failing.join(' · ') || 'none'}`);
}
console.log(['| Run | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Weight |', '|---|---|---|---|---|---|---|---|---|---|', ...rows, '', ...details].join('\n'));
