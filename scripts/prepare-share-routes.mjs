import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (name) =>
  JSON.parse(readFileSync(new URL(`content/${name}.json`, root), 'utf8'));
const paths = [
  '/',
  '/blog',
  '/blogs',
  '/videos',
  '/inside-the-network',
  '/careers',
  '/career-explorer/roles',
  '/resources',
  '/resource-options',
  '/cyber-range',
  '/how-to',
  '/guides-and-labs',
  '/rmf-series',
  '/rmf-series/controls',
  '/rmf-series/other-approaches',
  '/rmf-series/concepts/dns',
  '/rmf-series/phases-and-evidence',
  '/rmf-series/prepare',
  ...[...read('series'), ...read('posts')].map((post) => `/blog/${post.slug}`),
  ...read('career-roles-catalog').map(
    (role) => `/career-explorer/roles/${role.code}`,
  ),
];
writeFileSync(
  new URL('public/share-routes.mjs', root),
  '// Generated from public content by prepare-share-routes.mjs.\nexport const publicSharePaths = ' +
    JSON.stringify([...new Set(paths)], null, 2) +
    ';\n',
);
