// One ATO Template Library entry, shared by the expanded catalog tile and the full library page.
// Owner direction, 15 October 2026: every entry is a publicly released document, linked to its publisher's own
// copy (opens in a new tab). Nothing is hosted here.
import { ExternalLink } from 'lucide-react';
import type templates from '../../content/ato-templates.json';
import { STATUSES, frameworkLabel } from './template-labels';

type Template = (typeof templates.templates)[number];

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
