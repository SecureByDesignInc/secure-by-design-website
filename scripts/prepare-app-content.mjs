// Writes the native app's content feed to public/app/content/v1.json (served at
// https://securebydesigninc.com/app/content/v1.json). Runs as part of `pnpm build`
// through scripts/prepare-content.mjs, so the feed always matches the deployed Site.
//
//   node scripts/prepare-app-content.mjs              write the feed
//   node scripts/prepare-app-content.mjs --stdout     print it instead (used by the app's sync tool)
//   node scripts/prepare-app-content.mjs --write-site also regenerate content/training-progress.json
//                                                     and content/training-resources.json from it
//                                                     (not part of the normal workflow)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {APP_CONTENT_PATH, buildAppContent, serializeAppContent} from './app-content.mjs';

const args = process.argv.slice(2);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const stdout = isMain && args.includes('--stdout');
const writeSite = isMain && args.includes('--write-site');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const {content, summary, localOnlyMaterials, siteCatalogs} = await buildAppContent(root, {writeSite});
if (stdout) {
  process.stdout.write(serializeAppContent(content));
} else {
  const target = path.join(root, APP_CONTENT_PATH);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, serializeAppContent(content));
  console.log(`Prepared the app content feed ${content.version}: ${summary}.`);
  if (localOnlyMaterials.length) console.log(`Materials not in the bookmark catalog (saved on the device only): ${localOnlyMaterials.join(', ')}`);
}
if (writeSite) {
  fs.writeFileSync(path.join(root, 'content/training-progress.json'), JSON.stringify(siteCatalogs.progress, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'content/training-resources.json'), JSON.stringify(siteCatalogs.resources, null, 2) + '\n');
  console.error('Wrote the Site progress and resource catalogs (--write-site).');
}
