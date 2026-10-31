// Cyber Range artwork (owner direction, 30 October 2026): the operators as busts (HUD avatars and answer markers) and
// full length (the stage), drawn in code from four bases, glows and marks. Residents with a Blender-rendered sprite set
// (public/range-app/sprites/<id>/, cel-shaded, rendered by scripts/range-sprites/operator_build.py) are drawn from it.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const GLOWS = { cyan: '#83dcfa', ice: '#c2ddfa', blue: '#238df5', magenta: '#ff4fd8' };
const THREAT = '#ff4fd8';
let seq = 0;
const uid = () => 'rg' + (seq++).toString(36);
const DEFS = (g, id) => `<defs><filter id="${id}f" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="${id}c"><rect x="30" y="35" width="36" height="10" rx="3"/></clipPath><clipPath id="${id}g"><circle cx="40" cy="24" r="7"/><circle cx="56" cy="24" r="7"/></clipPath><linearGradient id="${id}j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3657"/><stop offset="1" stop-color="#0c1828"/></linearGradient></defs>`;
const SHOULDERS = (g, id) => `<path d="M6 96c2-18 20-28 42-28s40 10 42 28z" fill="url(#${id}j)" stroke="#3b648c" stroke-width="1.5"/><path class="op-pulse" d="M34 72l14 12 14-12" fill="none" stroke="${g}" stroke-width="1.5"/><path d="M12 88l10-6M84 88l-10-6" stroke="${g}" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
const NECK = `<rect x="41" y="52" width="14" height="18" fill="#0c1828" stroke="#3b648c" stroke-width="1.5"/>`;
const HEAD = `<rect x="28" y="16" width="40" height="44" rx="15" fill="#0f2036" stroke="#3b648c" stroke-width="1.5"/><path d="M34 50c3 8 25 8 28 0" fill="none" stroke="#1d3350" stroke-width="2"/>`;
const EYES = g => `<rect class="op-eye" x="38" y="44" width="7" height="3" rx="1.5" fill="${g}"/><rect class="op-eye" x="51" y="44" width="7" height="3" rx="1.5" fill="${g}"/>`;
const SCAN = (g, tall) => `<rect class="${tall ? 'op-scan-tall' : 'op-scan'}" x="4" y="-4" width="88" height="2" fill="${g}" opacity=".35"/>`;
export const BASES = {
 visor: (g, id) => `${HEAD}<path d="M26 42c0-20 8-30 22-30s22 10 22 30v6H26z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/><path d="M31 22c3-4 9-7 17-7" fill="none" stroke="#5a8ab8" stroke-width="1.5" stroke-linecap="round"/><rect class="op-pulse" x="30" y="35" width="36" height="10" rx="3" fill="${g}" filter="url(#${id}f)"/><g clip-path="url(#${id}c)"><g class="op-sweep"><rect x="28" y="32" width="8" height="16" fill="#fff" opacity=".5" transform="skewX(-22)"/></g></g><path d="M30 48h36" stroke="#3b648c" stroke-width="1.5"/><path d="M60 52h4M60 55h4" stroke="${g}" stroke-width="1" opacity=".7"/><path d="M33 59c4 5 26 5 30 0" fill="none" stroke="#3b648c" stroke-width="1.5"/><path d="M66 24l6-8" stroke="${g}" stroke-width="2" stroke-linecap="round"/><circle class="op-flicker" cx="72" cy="16" r="2" fill="${g}" filter="url(#${id}f)"/>`,
 hood: (g, id) => `<path d="M20 72C16 40 30 12 48 12s32 28 28 60z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/><path class="op-pulse" d="M30 70c-2-24 6-40 18-40s20 16 18 40" fill="none" stroke="${g}" stroke-width="1" opacity=".55"/><path d="M33 66c-3-24 4-38 15-38s18 14 15 38z" fill="#050b14"/><g class="op-flicker"><rect class="op-eye" x="39" y="44" width="7" height="3" rx="1.5" fill="${g}" filter="url(#${id}f)"/><rect class="op-eye" x="50" y="44" width="7" height="3" rx="1.5" fill="${g}" filter="url(#${id}f)"/></g><path d="M42 56h12" stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/><path d="M44 59h8" stroke="${g}" stroke-width="1" stroke-linecap="round" opacity=".5"/>`,
 headset: (g, id) => `${HEAD}<path d="M27 40C27 24 36 14 48 14l6-5 1 7 6-4-1 7c6 3 9 11 9 21z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/><path class="op-pulse" d="M25 44c0-24 46-24 46 0" fill="none" stroke="${g}" stroke-width="3" stroke-linecap="round"/><rect x="21" y="38" width="8" height="14" rx="3" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><rect x="67" y="38" width="8" height="14" rx="3" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><g class="op-flicker"><rect x="23" y="40" width="4" height="2" fill="${g}"/><rect x="23" y="44" width="4" height="2" fill="${g}"/><rect x="23" y="48" width="4" height="2" fill="${g}" opacity=".5"/><rect x="69" y="40" width="4" height="2" fill="${g}"/><rect x="69" y="44" width="4" height="2" fill="${g}"/><rect x="69" y="48" width="4" height="2" fill="${g}" opacity=".5"/></g><path d="M29 52c2 8 8 12 16 12" fill="none" stroke="#3b648c" stroke-width="2" stroke-linecap="round"/><circle class="op-flicker" cx="46" cy="64" r="2.5" fill="${g}" filter="url(#${id}f)"/>${EYES(g)}<path d="M30 50h5" stroke="${g}" stroke-width="1" opacity=".6"/>`,
 goggles: (g, id) => `${HEAD}<path d="M27 36c0-14 8-22 21-22 8 0 14 3 18 8l5-3-3 6c1 3 1 7 1 11z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/><path d="M31 24c-3 2-5 6-4 10M65 24c3 2 5 6 4 10" fill="none" stroke="#3b648c" stroke-width="1.5"/><circle class="op-pulse" cx="40" cy="24" r="7" fill="${g}" filter="url(#${id}f)"/><circle class="op-pulse" cx="56" cy="24" r="7" fill="${g}" filter="url(#${id}f)"/><g clip-path="url(#${id}g)"><g class="op-sweep"><rect x="28" y="12" width="6" height="26" fill="#fff" opacity=".5" transform="skewX(-25)"/></g></g><circle cx="40" cy="24" r="7" fill="none" stroke="#5a8ab8" stroke-width="1.5"/><circle cx="56" cy="24" r="7" fill="none" stroke="#5a8ab8" stroke-width="1.5"/><path d="M47 24h2" stroke="#3b648c" stroke-width="1.5"/>${EYES(g)}<path d="M62 50v8l-6 4" fill="none" stroke="${g}" stroke-width="1" opacity=".6"/>`,
};
export const MARKS = {
 none: () => '',
 trace: g => `<g class="op-pulse"><path d="M60 49h4l3 3v6" fill="none" stroke="${g}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="67" cy="58" r="1.6" fill="${g}"/></g>`,
 node: g => `<g class="op-pulse"><rect x="60" y="50" width="5" height="5" rx="1" fill="${g}"/><path d="M62.5 55v4" stroke="${g}" stroke-width="1.5" stroke-linecap="round"/></g>`,
};
// The body under the bust: jacket with the glow seam, two arms on shoulder pivots, legs and boots. Same lines, same colors.
const BODY = (g, id) => `<ellipse cx="48" cy="174" rx="27" ry="3.2" fill="${g}" opacity=".16"/>
<g class="op-arm op-arm-back" style="transform-origin:24px 77px"><path d="M24 77l-6 24 4 24" fill="none" stroke="#16304d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 77l-6 24" stroke="${g}" stroke-width="1" opacity=".5"/><circle cx="22" cy="126" r="4.6" fill="#0f2036" stroke="#3b648c" stroke-width="1.5"/></g>
<path d="M37 116l-2 30-2 18" fill="none" stroke="#102339" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M59 116l2 30 2 18" fill="none" stroke="#102339" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M37 118l-2 28M59 118l2 28" stroke="#3b648c" stroke-width="1" opacity=".45"/>
<path d="M24 158h20v10a4 4 0 0 1-4 4H26a2 2 0 0 1-2-2z" fill="#0c1828" stroke="#3b648c" stroke-width="1.5"/><path d="M52 158h20v12a2 2 0 0 1-2 2H56a4 4 0 0 1-4-4z" fill="#0c1828" stroke="#3b648c" stroke-width="1.5"/><path class="op-pulse" d="M26 166h14M56 166h14" stroke="${g}" stroke-width="1.5" opacity=".8"/>
<path d="M22 74c0-5 4-7 9-8l9-2 8 7 8-7 9 2c5 1 9 3 9 8l-2 44H24z" fill="url(#${id}j)" stroke="#3b648c" stroke-width="1.5"/><path d="M40 64l8 8 8-8" fill="none" stroke="#5a8ab8" stroke-width="1.5"/><path class="op-pulse" d="M48 75v41" stroke="${g}" stroke-width="1.5" opacity=".75"/><path d="M30 82h10M30 88h7" stroke="${g}" stroke-width="1" opacity=".45"/><path d="M26 70h6M64 70h6" stroke="${g}" stroke-width="2" stroke-linecap="round" opacity=".8"/>
<rect x="22" y="116" width="52" height="5" fill="#0f2036" stroke="#3b648c" stroke-width="1.2"/><circle class="op-flicker" cx="48" cy="118.5" r="1.8" fill="${g}" filter="url(#${id}f)"/>
<g class="op-arm op-arm-front" style="transform-origin:72px 77px"><path d="M72 77l6 24-4 24" fill="none" stroke="#1a3657" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M72 77l6 24" stroke="${g}" stroke-width="1" opacity=".7"/><circle cx="74" cy="126" r="4.6" fill="#0f2036" stroke="#3b648c" stroke-width="1.5"/></g>`;
const glowOf = (op, threat) => threat ? THREAT : GLOWS[op.glow] || GLOWS.cyan;
// The bust, as it is in the Range today (the builder, the ladder, the residents list).
export function bust(op = {}, { size = 96, threat = false, label = '' } = {}) {
 const g = glowOf(op, threat), id = uid(), base = BASES[op.base] ? op.base : 'visor';
 return `<svg class="op-char" viewBox="0 0 96 96" width="${size}" height="${size}" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><g class="op-jitter"><g class="op-idle">${DEFS(g, id)}${SHOULDERS(g, id)}${base === 'hood' ? '' : NECK}${BASES[base](g, id)}${(MARKS[op.mark] || MARKS.none)(g)}${SCAN(g)}</g></g></svg>`;
}
// The same operator full length, for the stage: pose groups wrap the drawing so the arms and the body can act.
export function figure(op = {}, { height = 150, threat = false, label = '' } = {}) {
 const g = glowOf(op, threat), id = uid(), base = BASES[op.base] ? op.base : 'visor';
 const w = Math.round(height * 96 / 178);
 return `<svg class="op-fig" viewBox="0 0 96 178" width="${w}" height="${height}" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><g class="op-pose"><g class="op-kick"><g class="op-jitter"><g class="op-idle">${DEFS(g, id)}${base === 'hood' ? '' : NECK}${BODY(g, id)}${BASES[base](g, id)}${(MARKS[op.mark] || MARKS.none)(g)}${SCAN(g, true)}</g></g></g></g></svg>`;
}

// One sheet per action, frames left to right (range.css steps through them).
export const SPRITES = { ttl_zero: {"idle": {"frames": 12, "w": 256, "h": 384, "fps": 6}, "attack": {"frames": 9, "w": 256, "h": 384, "fps": 12}, "hit": {"frames": 7, "w": 256, "h": 384, "fps": 12}, "down": {"frames": 9, "w": 256, "h": 384, "fps": 12}, "victory": {"frames": 9, "w": 256, "h": 384, "fps": 12}, "command": {"frames": 1, "w": 256, "h": 384, "fps": 1}} };
export const spriteSetFor = op => (op && op.sprite && SPRITES[op.sprite] ? op.sprite : null);
export function spriteHtml(set) {
 const m = SPRITES[set].idle;
 return `<div class="rs-sprite act-idle" data-set="${set}" style="--n:${m.frames};--fw:${m.w};--fh:${m.h}" aria-hidden="true"></div>`;
}
