// One ATO Template Library entry, shared by the expanded catalog tile and the full library page.
// Owner direction, 15 October 2026: every entry is a publicly released document, linked to its publisher's own
// copy (opens in a new tab). Nothing is hosted here.
// Owner direction, 21 October 2026: while the official sources are revised, each RMF step shows one StepSoonCard instead
// of its entries, in the design of the coming-soon tiles in the Training Hub (SBD-EPO01, SBD-NESSUS01).
import { Clock, Download, ExternalLink } from 'lucide-react';
import type templates from '../../content/ato-templates.json';
import { TileArt } from './hub-art';
import { STATUSES, frameworkLabel, type OfficialTemplate, type TemplateGroup } from './template-labels';

type Template = OfficialTemplate;
type Sample = (typeof templates.samples)[number];

/**
 * One RMF step's official sources, coming soon: the Training Hub's coming-soon tile (training-hub.css, loaded by every
 * page that shows it) with the step's name and nothing else, so no publisher, version, date or link. It carries the
 * step's id so links to #<step> still land on it.
 */
export function StepSoonCard({ group, heading = 'h4', anchor = true }: { group: TemplateGroup; heading?: 'h4' | 'h5'; anchor?: boolean }) {
  const Heading = heading;
  const titleId = `${anchor ? '' : 'tile-'}${group.id}-soon-title`;
  return (
    <article id={anchor ? group.id : undefined} className="th-tile th-art-reference th-tile-soon tl-step-soon" data-step-soon={group.id} aria-labelledby={titleId}>
      <div className="th-thumb">
        <TileArt family="reference" />
        <span className="th-chip">{`RMF · ${group.abbr.toUpperCase()}`}</span>
        <span className="th-soon"><Clock size={11} aria-hidden="true" />Coming soon</span>
        <Heading id={titleId} className="th-tile-title">{group.title}</Heading>
      </div>
      <p className="th-tile-meta">Official sources in preparation</p>
    </article>
  );
}

export default function TemplateEntry({ item, heading = 'h5' }: { item: Template; heading?: 'h4' | 'h5' }) {
  const Heading = heading;
  return (
    <li>
      <div className="vc-library-item-head">
        <Heading>{item.title}</Heading>
        <span className="vc-library-badges">
          <i className="vc-framework">{frameworkLabel(item.framework)}</i>
          <i className={`vc-status vc-status-${item.status}`}>{STATUSES[item.status]?.label ?? item.status}</i>
        </span>
      </div>
      <p className="vc-library-source">{item.source} · <span>RMF {item.rmf}</span></p>
      <p>{item.note}</p>
      <div className="vc-library-links">
        {item.links.map(link => (
          <a key={link.href + link.label} href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
            <small>{link.format}</small>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        ))}
      </div>
    </li>
  );
}

/** A Secure By Design training sample: written here from public guidance, hosted here, and labeled as not an official form. */
export function SampleEntry({ item, heading = 'h5' }: { item: Sample; heading?: 'h4' | 'h5' }) {
  const Heading = heading;
  return (
    <li>
      <div className="vc-library-item-head">
        <Heading>{item.title}</Heading>
        <span className="vc-library-badges">
          <i className="vc-framework">{item.artifact}</i>
          <i className="vc-status vc-status-sample">Training sample</i>
        </span>
      </div>
      <p className="vc-library-source">Secure By Design, from {item.basis} · <span>RMF {item.rmf}</span></p>
      <p>{item.note}</p>
      <div className="vc-library-links">
        <a className="vc-library-download" href={item.href} download>
          <Download size={13} aria-hidden="true" />
          Download
          <small>{item.format}</small>
        </a>
      </div>
    </li>
  );
}
