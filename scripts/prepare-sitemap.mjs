// Writes public/sitemap.xml from the published pages: the main sections and every Training Hub course.
// Offline sections (Security Journal, the retired /careers Community pages) are deliberately left out.
// The Cyber Range returned on 26 October 2026 as the stack-duel arena at /cyber-range.
// Community & Careers at /community and its state pages are published.
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const site = 'https://securebydesigninc.com';
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const library = read('content/videos.json');
const configuration = read('content/configuration-courses.json');
const communityStates = read('content/community-states.json');
// My Account is noindex (it is an account page), so it stays out of the sitemap.
const paths = ['/', '/inside-the-network', '/technical-training', '/grc-rmf-training', '/community', '/cyber-range', '/privacy'];
for (const entry of [...library.episodes, ...library.courses]) {
  const guide = entry.training?.guide;
  // List the address a guide is served at: /grc-rmf-training/rmf/index.html redirects to /grc-rmf-training/rmf/.
  // Configuration course guides are served at /training/<id>/ (the old /training/<id> redirects there).
  if (guide && guide.startsWith('/')) paths.push(guide.replace(/#.*$/, '').replace(/\/index\.html$/, '/').replace(/^(\/training\/[a-z0-9-]+)$/, '$1/'));
}
// Reference tiles (the ATO Template Library) are app pages, served without a trailing slash.
for (const reference of library.references ?? []) paths.push(reference.training.guide);
// Government & Vendor Guidelines pages: out of the catalog since 22 October 2026, opened from course 1.1's lessons.
for (const guideline of library.guidelines ?? []) paths.push(guideline.training.guide);
// The ATO Template Library page (in the Training Hub; address under /grc-rmf-training), linked from each step of course 2.1.
if (!paths.includes('/grc-rmf-training/templates')) paths.push('/grc-rmf-training/templates');
for (const course of configuration) paths.push(`/training/${course.id}/checklist`);
for (const state of communityStates) paths.push(`/community/${state.slug}`);
const unique = [...new Set(paths)];
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + unique.map(path => `  <url><loc>${site}${path}</loc></url>`).join('\n') + '\n</urlset>\n';
writeFileSync(new URL('public/sitemap.xml', root), xml);
writeFileSync(new URL('public/robots.txt', root), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`Prepared sitemap.xml with ${unique.length} pages.`);
