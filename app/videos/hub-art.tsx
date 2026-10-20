// Training Hub artwork (owner direction, 19 October 2026): line art in the site's colors, one family per topic group,
// with no hardware makes or models. Strokes use currentColor; training-hub.css sets each family's color and glow
// through the .th-art-<family> class on a parent.
import type { CatalogEntry } from './catalog-types';
import { isReferenceLibrary } from './video-utils';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

// The small art on a library tile.
export function TileArt({ family }: { family: string }) {
  return (
    <svg className="th-art" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
      {family === 'harden' ? <g {...stroke}>
        <path d="M160 22l38 14v28c0 26-17 40-38 48c-21-8-38-22-38-48V36z" />
        <path d="M144 66l11 11l22-24" />
        <path d="M88 46h20M88 58h12M212 46h20M220 58h12" opacity="0.7" />
      </g> : family === 'logging' ? <g {...stroke}>
        <path d="M70 44h86M70 68h86M70 92h86" strokeDasharray="2 7" />
        <path d="M156 44c20 0 20 24 38 24M156 92c20 0 20-24 38-24M156 68h38" />
        <ellipse cx="226" cy="46" rx="26" ry="8" />
        <path d="M200 46v46c0 4 12 8 26 8s26-4 26-8V46M200 69c0 4 12 8 26 8s26-4 26-8" />
      </g> : family === 'endpoint' ? <g {...stroke}>
        <rect x="92" y="26" width="36" height="24" rx="3" /><rect x="138" y="26" width="36" height="24" rx="3" /><rect x="184" y="26" width="36" height="24" rx="3" />
        <rect x="92" y="68" width="36" height="24" rx="3" /><rect x="138" y="68" width="36" height="24" rx="3" /><rect x="184" y="68" width="36" height="24" rx="3" />
        <path d="M104 56h12M150 56h12M196 56h12M104 98h12M150 98h12M196 98h12" />
        <path d="M246 26v52M236 68l10 10l10-10" />
      </g> : family === 'ops' ? <g {...stroke}>
        <ellipse cx="160" cy="44" rx="22" ry="7" />
        <path d="M138 44v38c0 4 10 7 22 7s22-3 22-7V44M138 63c0 4 10 7 22 7s22-3 22-7" />
        <path d="M112 64a48 48 0 0 1 80-36" /><path d="M186 20l7 8l-10 3" />
        <path d="M208 64a48 48 0 0 1-80 36" /><path d="M134 108l-7-8l10-3" />
      </g> : family === 'authorize' ? <g {...stroke}>
        <path d="M116 20h52l16 16v76h-68z" /><path d="M168 20v16h16" />
        <path d="M128 48h40M128 60h40M128 72h28" />
        <circle cx="200" cy="92" r="22" /><path d="M190 92l7 7l13-14" />
      </g> : family === 'reference' ? <g {...stroke}>
        <rect x="132" y="18" width="64" height="84" rx="5" />
        <path d="M124 26v84h64" opacity="0.7" /><path d="M116 34v84h64" opacity="0.45" />
        <path d="M144 38h40M144 50h40M144 62h28M144 74h36" />
      </g> : <g {...stroke}>
        <rect x="104" y="30" width="40" height="70" rx="6" /><rect x="176" y="30" width="40" height="70" rx="6" />
        <path d="M114 46h20M114 56h20M114 66h20M186 46h20M186 56h20M186 66h20" />
        <path d="M144 66h32" strokeDasharray="3 5" />
        <path d="M124 100v12h72v-12M160 112v10" />
        <circle cx="124" cy="86" r="3" fill="currentColor" /><circle cx="196" cy="86" r="3" fill="currentColor" /><circle cx="160" cy="126" r="4" fill="currentColor" />
      </g>}
    </svg>
  );
}

// The two systems a course centres on, as the System Hub names them.
const systemName = (name: string) => /^DC0\d$/.test(name) ? `SBD-${name}` : name;
const RMF_STEPS = ['Prepare', 'Categorize', 'Select', 'Implement', 'Assess', 'Authorize', 'Monitor'];

// The larger preview beside the featured course.
export function FeatureArt({ entry, family }: { entry: CatalogEntry; family: string }) {
  if (family === 'authorize' || isReferenceLibrary(entry)) {
    // The seven RMF steps around an ATO, evenly spaced on a circle.
    const points = RMF_STEPS.map((step, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / RMF_STEPS.length;
      const x = 240 + 80 * Math.cos(angle), y = 140 + 80 * Math.sin(angle);
      const lx = 240 + 104 * Math.cos(angle), ly = 140 + 104 * Math.sin(angle) + 4;
      const anchor = Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
      return { step, x, y, lx, ly: index === 0 ? ly - 6 : ly, anchor } as const;
    });
    return (
      <svg className="th-art" viewBox="0 0 480 270" role="img" aria-label="The seven RMF steps around an Authorization to Operate">
        <circle cx="240" cy="140" r="80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 6" />
        {points.map(point => <circle key={point.step} cx={point.x} cy={point.y} r="9" fill="#0b2032" stroke="currentColor" strokeWidth="2" />)}
        {points.map(point => <text key={`${point.step}-label`} x={point.lx} y={point.ly} textAnchor={point.anchor} className="th-art-label">{point.step}</text>)}
        <text x="240" y="148" textAnchor="middle" className="th-art-center">ATO</text>
      </svg>
    );
  }
  if (family === 'logging') {
    const stages = [['COLLECT', 'SBD-SYSLOG01'], ['PROTECT', 'SBD-AUDIT01'], ['ANALYZE', 'SBD-SPLUNK01']];
    return (
      <svg className="th-art" viewBox="0 0 480 270" role="img" aria-label="The logging pipeline: SBD-SYSLOG01 collects, SBD-AUDIT01 protects, SBD-SPLUNK01 analyzes">
        <g {...stroke} strokeWidth={2}>
          <path d="M40 70h80M40 84h56M40 98h68" strokeDasharray="2 6" opacity="0.7" />
          {stages.map((_, index) => <rect key={index} x={36 + index * 143} y="112" width="122" height="66" rx="10" />)}
          <path d="M158 145h21M301 145h21M172 139l7 6l-7 6M315 139l7 6l-7 6" />
        </g>
        {stages.map(([stage, name], index) => <g key={stage}>
          <text x={97 + index * 143} y="138" textAnchor="middle" className="th-art-kicker">{stage}</text>
          <text x={97 + index * 143} y="160" textAnchor="middle" className="th-art-label">{name}</text>
        </g>)}
      </svg>
    );
  }
  const systems = entry.systems.slice(0, 2).map(systemName);
  const [left, right] = systems.length > 1 ? systems : [systems[0] ?? entry.title, null];
  const label = `${systems.join(' and ') || entry.title}, the systems this course builds`;
  return (
    <svg className="th-art" viewBox="0 0 480 270" role="img" aria-label={label}>
      <g {...stroke} strokeWidth={2}>
        <ellipse cx="240" cy="196" rx="170" ry="26" opacity="0.35" />
        {right ? <>
          <rect x="140" y="66" width="64" height="118" rx="8" /><rect x="276" y="66" width="64" height="118" rx="8" />
          <path d="M154 88h36M154 104h36M154 120h36M290 88h36M290 104h36M290 120h36" opacity="0.8" />
          <path d="M204 128h72" strokeDasharray="4 7" />
        </> : <>
          <rect x="208" y="66" width="64" height="118" rx="8" />
          <path d="M222 88h36M222 104h36M222 120h36" opacity="0.8" />
        </>}
      </g>
      {right ? <>
        <circle cx="172" cy="164" r="5" fill="currentColor" /><circle cx="308" cy="164" r="5" fill="currentColor" />
        <text x="172" y="222" textAnchor="middle" className="th-art-label">{left}</text>
        <text x="308" y="222" textAnchor="middle" className="th-art-label">{right}</text>
      </> : <>
        <circle cx="240" cy="164" r="5" fill="currentColor" />
        <text x="240" y="222" textAnchor="middle" className="th-art-label">{left}</text>
      </>}
      <text x="240" y="44" textAnchor="middle" className="th-art-kicker">{(entry.topic ?? '').toUpperCase()}</text>
    </svg>
  );
}
