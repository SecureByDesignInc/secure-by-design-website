// Starts the app's standalone Range. A file, not an inline script: the /range-app/ policy allows scripts from this
// site only (script-src 'self'), which blocks inline ones.
import { mountRange } from './range-core.js';
mountRange(document.getElementById('range'), { standalone: true });
