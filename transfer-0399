import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const postcss = createRequire(import.meta.resolve('vite'))('postcss');
const root = new URL('../', import.meta.url);
const source = postcss.parse(readFileSync(new URL('content/career-explorer/source.css', root), 'utf8'));

source.walkRules(rule => {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
    parent = parent.parent;
  }

  const selectors = rule.selectors.flatMap(selector => {
    const value = selector.trim();
    if (value === 'html' || value === 'body' || value.startsWith('.site-header') || value.startsWith('.brand') || value === 'nav' || value.startsWith('nav ') || value === 'footer' || value.startsWith('footer ')) return [];
    if (value === ':root') return ['.career-explorer-content'];
    return [`.career-explorer-content ${value}`];
  });

  if (!selectors.length) rule.remove();
  else rule.selectors = selectors;
});

const websiteOverrides = `
.career-explorer-content {
  --ink: #0b243b;
  --navy: #08192b;
  --navy-2: #102a47;
  --paper: #f8fbff;
  --line: #c2d9e8;
  --muted: #526b7e;
  --green: #a2edf5;
  --purple: #b9d7ff;
  --green-deep: #1269b9;
  background: #f8fbff;
}
.career-explorer-content .journey-section,
.career-explorer-content .market-section {
  padding-inline: max(32px, calc((100% - 1180px) / 2));
}
.career-explorer-content .journey-section { background: #f8fbff; }
.career-explorer-content .market-section { background: #edf5fa; }
.career-explorer-content .direction-tab,
.career-explorer-content .stage,
.career-explorer-content .stage-panel,
.career-explorer-content .market-dashboard,
.career-explorer-content .role-detail { border-color: #c2d9e8; }
.career-explorer-content .direction-tab.active,
.career-explorer-content .stage.active,
.career-explorer-content .scenario,
.career-explorer-content .market-controls,
.career-explorer-content .role-family,
.career-explorer-content .role-simulation,
.career-explorer-content .role-caution { background: #08192b; }
.career-explorer-content .role-family:hover { background: #102a47; }
.career-explorer-content .direction-tab.active,
.career-explorer-content .role-family.active { background: linear-gradient(115deg, #176bb7, #145276); color: #fff; }
.career-explorer-content .role-family.active > span,
.career-explorer-content .role-family.active small { color: #d9f7fb; }
.career-explorer-content :is(.section-number,.mini-label,.view-heading > span,.role-code,.role-label,.simulation-output span) { color: #1269b9; }
.career-explorer-content :is(.stage.active .stage-index,.stage.active .stage-arrow,.scenario .mini-label,.direction-tab.active > span,.role-family > span,.role-simulation .role-label,.simulation-output span) { color: #a2edf5; }
.career-explorer-content :is(.section-number,.mini-label,.view-heading > span,.role-code,.role-label,.simulation-output span,.metric-grid span,.card-title > div > span) { font-size: .75rem; }
.career-explorer-content :is(.stage small,.direction-tab small,.metric-grid small,.role-family small,.role-title-list p,.role-facts b,.role-list li,.role-fit li,.role-tools > p,.role-simulation p,.role-caution,.data-note,.data-explainer,.metro-note) { font-size: .8125rem; }
.career-explorer-content .section-heading h2,
.career-explorer-content .view-heading h3,
.career-explorer-content .stage-panel h3,
.career-explorer-content .market-result-head h3,
.career-explorer-content .role-detail-head h3 { font-family: var(--font-geist-sans), Arial, sans-serif; }
.career-explorer-content .direction-tab,
.career-explorer-content .stage,
.career-explorer-content .stage-panel,
.career-explorer-content .market-dashboard,
.career-explorer-content .market-controls,
.career-explorer-content .role-family-tabs,
.career-explorer-content .role-detail,
.career-explorer-content .role-caution { border-radius: 12px; }
.career-explorer-content .role-family-tabs { border-radius: 12px 12px 0 0; }
.career-explorer-content .role-detail { border-radius: 0; }
.career-explorer-content .role-caution { border-radius: 0 0 12px 12px; }
@media (max-width: 620px) {
  .career-explorer-content .journey-section,
  .career-explorer-content .market-section { padding-inline: 18px; }
}
`;

writeFileSync(new URL('public/career-explorer/explorer.css', root), source.toString() + websiteOverrides + readFileSync(new URL('content/career-explorer/directory-entry.css', root), 'utf8'));
