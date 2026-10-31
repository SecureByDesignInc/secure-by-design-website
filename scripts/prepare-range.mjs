// The Cyber Range's app page (owner direction, 26 October 2026; the battle, 30 October 2026): copy the page's core, its
// artwork and its styles to public/range-app/ for the native app's standalone page. tests/range-app.test.mjs checks
// every copy is current.
import { copyFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
mkdirSync(new URL('public/range-app/', root), { recursive: true });
for (const name of ['range-core.js', 'avatars.js', 'range.css', 'battle.css']) {
  copyFileSync(new URL('app/cyber-range/' + name, root), new URL('public/range-app/' + name, root));
}
