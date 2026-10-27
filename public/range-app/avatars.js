// Cyber Range artwork (owner direction, 26 October 2026): every operator is an original animated bust drawn from
// four bases, a glow color and a cheek mark; every system is an abstract glyph with no make or model. All of it is
// inline SVG with CSS animation classes from range.css, so it stops under prefers-reduced-motion.
export const GLOWS = { cyan: '#83dcfa', ice: '#c2ddfa', blue: '#238df5', magenta: '#ff4fd8' };
export const THREAT = '#ff4fd8';
let seq = 0;
const uid = () => 'rg' + (seq++).toString(36);

const JACKET = (g, id) => `<defs><filter id="${id}f" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="${id}c"><rect x="30" y="35" width="36" height="10" rx="3"/></clipPath><clipPath id="${id}g"><circle cx="40" cy="24" r="7"/><circle cx="56" cy="24" r="7"/></clipPath><linearGradient id="${id}j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3657"/><stop offset="1" stop-color="#0c1828"/></linearGradient></defs>
<path d="M6 96c2-18 20-28 42-28s40 10 42 28z" fill="url(#${id}j)" stroke="#3b648c" stroke-width="1.5"/>
<path class="op-pulse" d="M34 72l14 12 14-12" fill="none" stroke="${g}" stroke-width="1.5"/>
<path d="M12 88l10-6M84 88l-10-6" stroke="${g}" stroke-width="2" stroke-linecap="round" opacity=".8"/>`;
const HEAD = `<rect x="41" y="52" width="14" height="18" fill="#0c1828" stroke="#3b648c" stroke-width="1.5"/>
<rect x="28" y="16" width="40" height="44" rx="15" fill="#0f2036" stroke="#3b648c" stroke-width="1.5"/>
<path d="M34 50c3 8 25 8 28 0" fill="none" stroke="#1d3350" stroke-width="2"/>`;
const EYES = g => `<rect class="op-eye" x="38" y="44" width="7" height="3" rx="1.5" fill="${g}"/><rect class="op-eye" x="51" y="44" width="7" height="3" rx="1.5" fill="${g}"/>`;
const SCAN = g => `<rect class="op-scan" x="4" y="-4" width="88" height="2" fill="${g}" opacity=".35"/>`;

const BASES = {
 visor: (g, id) => `${JACKET(g, id)}${HEAD}
<path d="M26 42c0-20 8-30 22-30s22 10 22 30v6H26z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/>
<path d="M31 22c3-4 9-7 17-7" fill="none" stroke="#5a8ab8" stroke-width="1.5" stroke-linecap="round"/>
<rect class="op-pulse" x="30" y="35" width="36" height="10" rx="3" fill="${g}" filter="url(#${id}f)"/>
<g clip-path="url(#${id}c)"><g class="op-sweep"><rect x="28" y="32" width="8" height="16" fill="#fff" opacity=".5" transform="skewX(-22)"/></g></g>
<path d="M30 48h36" stroke="#3b648c" stroke-width="1.5"/><path d="M60 52h4M60 55h4" stroke="${g}" stroke-width="1" opacity=".7"/>
<path d="M33 59c4 5 26 5 30 0" fill="none" stroke="#3b648c" stroke-width="1.5"/>
<path d="M66 24l6-8" stroke="${g}" stroke-width="2" stroke-linecap="round"/><circle class="op-flicker" cx="72" cy="16" r="2" fill="${g}" filter="url(#${id}f)"/>`,
 hood: (g, id) => `${JACKET(g, id)}
<path d="M20 72C16 40 30 12 48 12s32 28 28 60z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/>
<path class="op-pulse" d="M30 70c-2-24 6-40 18-40s20 16 18 40" fill="none" stroke="${g}" stroke-width="1" opacity=".55"/>
<path d="M33 66c-3-24 4-38 15-38s18 14 15 38z" fill="#050b14"/>
<g class="op-flicker"><rect class="op-eye" x="39" y="44" width="7" height="3" rx="1.5" fill="${g}" filter="url(#${id}f)"/><rect class="op-eye" x="50" y="44" width="7" height="3" rx="1.5" fill="${g}" filter="url(#${id}f)"/></g>
<path d="M42 56h12" stroke="${g}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/><path d="M44 59h8" stroke="${g}" stroke-width="1" stroke-linecap="round" opacity=".5"/>`,
 headset: (g, id) => `${JACKET(g, id)}${HEAD}
<path d="M27 40C27 24 36 14 48 14l6-5 1 7 6-4-1 7c6 3 9 11 9 21z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/>
<path class="op-pulse" d="M25 44c0-24 46-24 46 0" fill="none" stroke="${g}" stroke-width="3" stroke-linecap="round"/>
<rect x="21" y="38" width="8" height="14" rx="3" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><rect x="67" y="38" width="8" height="14" rx="3" fill="#102339" stroke="#3b648c" stroke-width="1.5"/>
<g class="op-flicker"><rect x="23" y="40" width="4" height="2" fill="${g}"/><rect x="23" y="44" width="4" height="2" fill="${g}"/><rect x="23" y="48" width="4" height="2" fill="${g}" opacity=".5"/><rect x="69" y="40" width="4" height="2" fill="${g}"/><rect x="69" y="44" width="4" height="2" fill="${g}"/><rect x="69" y="48" width="4" height="2" fill="${g}" opacity=".5"/></g>
<path d="M29 52c2 8 8 12 16 12" fill="none" stroke="#3b648c" stroke-width="2" stroke-linecap="round"/><circle class="op-flicker" cx="46" cy="64" r="2.5" fill="${g}" filter="url(#${id}f)"/>
${EYES(g)}<path d="M30 50h5" stroke="${g}" stroke-width="1" opacity=".6"/>`,
 goggles: (g, id) => `${JACKET(g, id)}${HEAD}
<path d="M27 36c0-14 8-22 21-22 8 0 14 3 18 8l5-3-3 6c1 3 1 7 1 11z" fill="#1a3657" stroke="#3b648c" stroke-width="1.5"/>
<path d="M31 24c-3 2-5 6-4 10M65 24c3 2 5 6 4 10" fill="none" stroke="#3b648c" stroke-width="1.5"/>
<circle class="op-pulse" cx="40" cy="24" r="7" fill="${g}" filter="url(#${id}f)"/><circle class="op-pulse" cx="56" cy="24" r="7" fill="${g}" filter="url(#${id}f)"/>
<g clip-path="url(#${id}g)"><g class="op-sweep"><rect x="28" y="12" width="6" height="26" fill="#fff" opacity=".5" transform="skewX(-25)"/></g></g>
<circle cx="40" cy="24" r="7" fill="none" stroke="#5a8ab8" stroke-width="1.5"/><circle cx="56" cy="24" r="7" fill="none" stroke="#5a8ab8" stroke-width="1.5"/><path d="M47 24h2" stroke="#3b648c" stroke-width="1.5"/>
${EYES(g)}<path d="M62 50v8l-6 4" fill="none" stroke="${g}" stroke-width="1" opacity=".6"/>`,
};
const MARKS = {
 none: () => '',
 trace: g => `<g class="op-pulse"><path d="M60 49h4l3 3v6" fill="none" stroke="${g}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="67" cy="58" r="1.6" fill="${g}"/></g>`,
 node: g => `<g class="op-pulse"><rect x="60" y="50" width="5" height="5" rx="1" fill="${g}"/><path d="M62.5 55v4" stroke="${g}" stroke-width="1.5" stroke-linecap="round"/></g>`,
};

// An operator bust. `threat` draws it as the opposing side (always magenta); `hit` adds the flinch-and-flash loop.
export function operatorSvg({ base = 'visor', glow = 'cyan', mark = 'none', size = 96, threat = false, hit = false, label = '' } = {}) {
 const g = threat ? THREAT : GLOWS[glow] || GLOWS.cyan;
 const id = uid();
 const draw = BASES[base] || BASES.visor;
 const flash = hit ? `<rect class="op-flash" x="0" y="0" width="96" height="96" fill="${g}" opacity="0"/>` : '';
 return `<svg class="op-char" viewBox="0 0 96 96" width="${size}" height="${size}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><g class="${hit ? 'op-hit' : 'op-jitter'}"><g class="op-idle">${draw(g, id)}${(MARKS[mark] || MARKS.none)(g)}${SCAN(g)}${flash}</g></g></svg>`;
}

// System glyphs by the `glyph` field in content/range/systems.json.
const GLYPHS = {
 dc: (c, id) => `<rect x="32" y="26" width="32" height="58" rx="5" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><rect x="38" y="34" width="20" height="4" rx="1" fill="${c}" opacity=".9"/><rect x="38" y="42" width="20" height="4" rx="1" fill="${c}" opacity=".6"/><rect x="38" y="50" width="20" height="4" rx="1" fill="${c}" opacity=".35"/><circle class="op-flicker" cx="42" cy="72" r="2" fill="${c}"/><circle cx="48" cy="72" r="2" fill="${c}"/><circle cx="54" cy="72" r="2" fill="${c}" opacity=".4"/><path d="M48 26V14M48 14l-12 8M48 14l12 8" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/><circle class="op-pulse" cx="48" cy="13" r="3.5" fill="${c}" filter="url(#${id}f)"/><circle cx="36" cy="22" r="2.5" fill="${c}"/><circle cx="60" cy="22" r="2.5" fill="${c}"/>`,
 dc2: (c, id) => `<rect x="32" y="26" width="32" height="58" rx="5" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><rect x="38" y="34" width="20" height="4" rx="1" fill="${c}" opacity=".9"/><rect x="38" y="42" width="20" height="4" rx="1" fill="${c}" opacity=".6"/><rect x="38" y="50" width="20" height="4" rx="1" fill="${c}" opacity=".35"/><circle cx="42" cy="72" r="2" fill="${c}"/><circle class="op-flicker" cx="48" cy="72" r="2" fill="${c}"/><circle cx="54" cy="72" r="2" fill="${c}" opacity=".4"/><path d="M48 26V14M48 14l-12 8M48 14l12 8" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity=".6"/><circle class="op-pulse" cx="48" cy="13" r="3.5" fill="none" stroke="${c}" stroke-width="1.5"/><circle cx="36" cy="22" r="2.5" fill="${c}"/><circle cx="60" cy="22" r="2.5" fill="${c}"/>`,
 router: (c, id) => `<path d="M10 40h76" stroke="${c}" stroke-width="1.5" opacity=".35"/><path d="M10 78h76" stroke="${c}" stroke-width="1.5" opacity=".2"/><path d="M14 48l10-12h48l10 12v20H14z" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><rect x="22" y="54" width="9" height="7" fill="${c}"/><rect x="36" y="54" width="9" height="7" fill="${c}" opacity=".8"/><rect x="51" y="54" width="9" height="7" fill="${c}" opacity=".6"/><rect x="65" y="54" width="9" height="7" fill="${c}" opacity=".4"/><path d="M30 36V22M66 36V22" stroke="#3b648c" stroke-width="1.5"/><circle class="op-flicker" cx="30" cy="20" r="2.5" fill="${c}" filter="url(#${id}f)"/><circle class="op-pulse" cx="66" cy="20" r="2.5" fill="${c}" filter="url(#${id}f)"/><path d="M40 26h16m-4-4 4 4-4 4" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
 pki: (c, id) => `<rect x="28" y="42" width="40" height="36" rx="6" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><path d="M36 42v-10a12 12 0 0 1 24 0v10" fill="none" stroke="${c}" stroke-width="3"/><circle class="op-pulse" cx="48" cy="58" r="5" fill="${c}" filter="url(#${id}f)"/><path d="M48 62v8" stroke="${c}" stroke-width="3"/><path d="M66 70l6 12 4-6 6 2-6-12" fill="${c}" opacity=".7"/><circle class="op-flicker" cx="34" cy="48" r="1.5" fill="${c}"/>`,
 splunk: (c, id) => `<path d="M30 60a22 22 0 0 1 36-18" fill="none" stroke="${c}" stroke-width="3"/><circle cx="48" cy="52" r="20" fill="none" stroke="#3b648c" stroke-width="1.5"/><circle class="sy-spin" cx="48" cy="52" r="20" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="4 10" style="transform-origin:48px 52px"/><circle cx="48" cy="52" r="12" fill="none" stroke="#3b648c" opacity=".6"/><circle class="op-pulse" cx="48" cy="52" r="3" fill="${c}" filter="url(#${id}f)"/><path d="M48 72v10M40 82h16" stroke="#3b648c" stroke-width="1.5"/>`,
 nessus: (c, id) => `<path d="M48 14l30 17v34L48 82 18 65V31z" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><ellipse cx="48" cy="48" rx="16" ry="9" fill="none" stroke="${c}" stroke-width="2"/><circle class="op-pulse" cx="48" cy="48" r="4" fill="${c}" filter="url(#${id}f)"/><path class="op-scan" d="M26 48h44" stroke="${c}" stroke-width="1" opacity=".5"/>`,
 epo: (c, id) => `<path d="M48 12l28 10v24c0 18-12 30-28 38-16-8-28-20-28-38V22z" fill="#102339" stroke="#3b648c" stroke-width="1.5"/><circle class="op-pulse" cx="48" cy="46" r="5" fill="${c}" filter="url(#${id}f)"/><circle cx="34" cy="60" r="3.5" fill="${c}"/><circle cx="62" cy="60" r="3.5" fill="${c}"/><path d="M48 46L34 60M48 46l14 14" stroke="${c}" stroke-width="2"/>`,
};
export function systemSvg(glyph, { color = '#83dcfa', size = 96, down = false, label = '' } = {}) {
 const id = uid();
 const c = down ? '#647d9b' : color;
 return `<svg class="sy-char${down ? ' sy-down' : ''}" viewBox="0 0 96 96" width="${size}" height="${size}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><defs><filter id="${id}f" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><ellipse cx="48" cy="88" rx="26" ry="4" fill="${c}" opacity=".12"/><g class="${down ? '' : 'sy-float'}">${(GLYPHS[glyph] || GLYPHS.dc)(c, id)}</g></svg>`;
}
