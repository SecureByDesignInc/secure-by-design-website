'use client';

// The expanded tile for a reference library (the ATO Template Library). It keeps the companion layout every
// expanded tile shares (companion.tsx): the heading, the materials panel and a right-hand column, then an explorer
// below. The explorer lists the templates for one Body of Evidence artifact at a time; the full, filterable list
// is the library page at /training/ato-templates. Templates come from content/ato-templates.json.
import { useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, ExternalLink, FileText, Maximize2 } from 'lucide-react';
import type { ReferenceLibrary } from './catalog-types';
import { CompanionHeading, CompanionMaterials, type CompanionLink } from './companion';
import templates from '../../content/ato-templates.json';
import { FRAMEWORKS, STATUSES, frameworkLabel } from './template-labels';

const pad = (value: number) => String(value).padStart(2, '0');

export default function LibraryExperience({ library }: { library: ReferenceLibrary }) {
  const groups = templates.groups.filter(group => templates.templates.some(item => item.group === group.id));
  const [active, setActive] = useState(0);
  const group = groups[active] ?? groups[0];
  if (!group) return null;
  const items = templates.templates.filter(item => item.group === group.id);
  const total = templates.templates.length;
  const training = library.training;
  const links: CompanionLink[] = (training.relatedResources ?? []).map(resource => ({
    href: resource.href,
    title: resource.title,
    detail: resource.detail,
    icon: <BookOpen size={19} />,
    trailing: <ArrowUpRight size={16} />,
  }));
  const frameworksIn = [...new Set(items.map(item => frameworkLabel(item.framework)))];

  return (
    <div className="vc-experience">
      <section className="vc-episode" aria-labelledby={`library-resources-${library.id}`}>
        <CompanionHeading
          id={`library-resources-${library.id}`}
          intro="Open the full library to search and filter every template, or browse one artifact at a time below."
          action={{ href: training.guide, label: 'Open the full library', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${library.id}`}
            cover={training.cover}
            coverAlt={`Cover of the Secure By Design ${library.title}`}
            heading={['Keep the templates.', 'Build the Body of Evidence.']}
            summary={`${total} free templates from NIST, CNSS, DoD and DCSA, the DoD SAP community, FedRAMP and GovRAMP, grouped by the ${groups.length} artifacts they support.`}
            guide={{
              href: training.guide,
              title: `Open the ${library.title}`,
              detail: `${total} templates · search · filter by framework and status`,
              icon: <BookOpen size={20} />,
              trailing: <ArrowUpRight size={19} />,
            }}
            links={links}
            edition={<>
              <p>Template library · Links checked {training.updated}</p>
              <p>Templates belong to their publishers. Each link goes to the official source.</p>
              <p>© 2026 Secure By Design Team LLC.</p>
            </>}
          />
          <div className="vc-watch vc-library-key">
            <div className="vc-library-counts" role="list" aria-label="Templates by framework">
              {FRAMEWORKS.map(framework => (
                <div role="listitem" key={framework.id}>
                  <b>{templates.templates.filter(item => item.framework === framework.id).length}</b>
                  <span>{framework.label}</span>
                </div>
              ))}
            </div>
            <div className="vc-library-legend">
              <span>HOW TO READ A TEMPLATE'S STATUS</span>
              <ul>
                {Object.entries(STATUSES).map(([id, status]) => (
                  <li key={id}>
                    <i className={`vc-status vc-status-${id}`}>{status.label}</i>
                    {status.detail}
                  </li>
                ))}
              </ul>
            </div>
            <div className="vc-learning-outcomes">
              <span>WHAT YOU WILL FIND</span>
              <p>{library.outcomeSummary}</p>
              <div>
                {library.outcomes.map(text => (
                  <span key={text}>
                    <FileText size={14} />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="vc-explorer" aria-labelledby={`artifact-explorer-${library.id}`}>
        <div className="vc-explorer-heading">
          <div className="vc-stage-title">
            <FileText size={21} />
            <div>
              <p className="vc-kicker">ARTIFACT EXPLORER</p>
              <h4 id={`artifact-explorer-${library.id}`}>Choose an artifact to see its templates.</h4>
            </div>
          </div>
          <div className="vc-scene-tools">
            <a href={training.guide}>
              <BookOpen size={15} />
              <span>Full library</span>
            </a>
            <a href="/authorization-workspace">
              <Maximize2 size={15} />
              <span>Authorization Workspace</span>
            </a>
          </div>
        </div>
        <div className="vc-scene-layout">
          <aside className="vc-build-inspector" aria-live="polite">
            <div className="vc-inspector-marker">
              <span>{pad(active + 1)}</span>
              <p>
                THE BODY OF EVIDENCE
                <br />
                <b>{groups.length} artifacts</b>
              </p>
            </div>
            <h5>{group.title}</h5>
            {group.note && <p>{group.note}</p>}
            <div className="vc-network-note">
              <span>{group.abbr}</span>
              <p>{items.length} template{items.length === 1 ? '' : 's'} · {frameworksIn.join(', ')}</p>
            </div>
            <a className="vc-library-deeplink" href={`${training.guide}#${group.id}`}>
              Open {group.title} in the full library
              <ArrowUpRight size={15} />
            </a>
          </aside>
          <div className="vc-scene-wrap vc-library-stage">
            <p className="vc-kicker">ARTIFACT {active + 1} OF {groups.length} · {items.length} TEMPLATE{items.length === 1 ? '' : 'S'}</p>
            <ul className="vc-library-list">
              {items.map(item => (
                <li key={item.title}>
                  <div className="vc-library-item-head">
                    <h5>{item.title}</h5>
                    <span className="vc-library-badges">
                      <i className="vc-framework">{frameworkLabel(item.framework)}</i>
                      <i className={`vc-status vc-status-${item.status}`}>{STATUSES[item.status]?.label ?? item.status}</i>
                    </span>
                  </div>
                  <p className="vc-library-source">{item.source} · <span>RMF {item.rmf}</span></p>
                  {item.note && <p>{item.note}</p>}
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
              ))}
            </ul>
          </div>
        </div>
        <nav
          className="vc-chapters vc-chapters-lessons vc-chapters-artifacts"
          aria-label={`${library.title} artifacts`}
          style={{ '--lesson-columns': 6 } as CSSProperties}
        >
          {groups.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-current={index === active ? 'step' : undefined}
              onClick={() => setActive(index)}
            >
              <span>{pad(index + 1)}</span>
              <div>
                <b>{item.title}</b>
                <small>{index === active ? 'Exploring now' : item.abbr}</small>
              </div>
              <ArrowRight size={15} />
            </button>
          ))}
        </nav>
      </section>
    </div>
  );
}
