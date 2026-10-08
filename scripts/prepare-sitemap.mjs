// Writes public/sitemap.xml from the published pages: the main sections and every Training Library course.
// Offline sections (Security Journal, Cyber Range, Community) are deliberately left out.
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const site = 'https://securebydesigninc.com';
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const library = read('content/videos.json');
const configuration = read('content/configuration-courses.json');
const paths = ['/', '/inside-the-network', '/training', '/my-progress'];
for (const entry of [...library.episodes, ...library.courses]) {
  const guide = entry.training?.guide;
  if (guide && guide.startsWith('/')) paths.push(guide.replace(/#.*$/, ''));
}
for (const course of configuration) paths.push(`/training/${course.id}/checklist`);
const unique = [...new Set(paths)];
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + unique.map(path => `  <url><loc>${site}${path}</loc></url>`).join('\n') + '\n</urlset>\n';
writeFileSync(new URL('public/sitemap.xml', root), xml);
writeFileSync(new URL('public/robots.txt', root), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`Prepared sitemap.xml with ${unique.length} pages.`);
