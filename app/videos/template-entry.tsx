// One ATO Template Library entry, shared by the expanded catalog tile and the full library page.
// Owner direction, 15 October 2026: every entry is a publicly released document, linked to its publisher's own
// copy (opens in a new tab). Nothing is hosted here.
import { Download, ExternalLink } from 'lucide-react';
import type templates from '../../content/ato-templates.json';
import { STATUSES, frameworkLabel } from './template-labels';

type Template = (typeof templates.templates)[number];
type Sample = (typeof templates.samples)[number];

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
