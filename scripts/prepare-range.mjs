// The Cyber Range page runs the same engine as the Worker (owner direction, 26 October 2026): copy lib/range/engine.mjs
// beside the page's core in app/cyber-range/, and copy the core, its artwork, its styles and the engine to
// public/range-app/ for the native app's standalone page. tests/range-app.test.mjs checks every copy is current.
import { copyFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
mkdirSync(new URL('public/range-app/', root), { recursive: true });
copyFileSync(new URL('lib/range/engine.mjs', root), new URL('app/cyber-range/engine.mjs', root));
for (const [from, to] of [['lib/range/engine.mjs', 'engine.mjs'], ['app/cyber-range/range-core.js', 'range-core.js'], ['app/cyber-range/avatars.js', 'avatars.js'], ['app/cyber-range/range.css', 'range.css']]) {
  copyFileSync(new URL(from, root), new URL('public/range-app/' + to, root));
}
