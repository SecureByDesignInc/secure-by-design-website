// One ATO Template Library entry, shared by the expanded catalog tile and the full library page.
// Posted files download directly; publisher links open in a new tab; restricted entries explain why
// nothing is posted.
import { Download, ExternalLink, Lock } from 'lucide-react';
import type templates from '../../content/ato-templates.json';
import { STATUSES, frameworkLabel, isHostedFile } from './template-labels';

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
      {item.note && <p>{item.note}</p>}
      {item.links.length > 0 ? (
        <div className="vc-library-links">
          {item.links.map(link => isHostedFile(link.href) ? (
            <a key={link.href + link.label} className="vc-library-download" href={link.href} download>
              <Download size={13} aria-hidden="true" />
              {link.label}
              <small>{link.format}</small>
            </a>
          ) : (
            <a key={link.href + link.label} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
              <small>{link.format}</small>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : (
        <p className="vc-library-restricted"><Lock size={12} aria-hidden="true" /> Not posted. Ask your ISSM or PSO for the current version.</p>
      )}
    </li>
  );
}
