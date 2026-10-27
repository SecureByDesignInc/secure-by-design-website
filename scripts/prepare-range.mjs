// The Cyber Range page runs the same engine as the Worker (owner direction, 26 October 2026): copy lib/range/engine.mjs
// beside the page so a visitor's solo match follows exactly the rules the API scores by. tests/range-app.test.mjs
// checks the copy is current.
import { copyFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
mkdirSync(new URL('public/range-app/', root), { recursive: true });
copyFileSync(new URL('lib/range/engine.mjs', root), new URL('public/range-app/engine.mjs', root));
