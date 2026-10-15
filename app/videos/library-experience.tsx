'use client';

// The expanded tile for a reference library (the ATO Template Library). It keeps the companion layout every
// expanded tile shares (companion.tsx): the heading, the materials panel and a right-hand column, then an explorer
// below. The explorer lists the templates for one RMF step at a time; the full, filterable list is the library
// page at /training/ato-templates. Templates come from content/ato-templates.json (a DoD SAP / JSIG set).
import { useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Download, FileText, Maximize2 } from 'lucide-react';
import type { ReferenceLibrary } from './catalog-types';
import { CompanionHeading, CompanionMaterials, type CompanionLink } from './companion';
import templates from '../../content/ato-templates.json';
import { STATUSES, frameworkLabel } from './template-labels';
import TemplateEntry from './template-entry';

const pad = (value: number) => String(value).padStart(2, '0');

export default function LibraryExperience({ library }: { library: ReferenceLibrary }) {
  const groups = templates.groups.filter(group => templates.templates.some(item => item.group === group.id));
  const [active, setActive] = useState(0);
  const group = groups[active] ?? groups[0];
  if (!group) return null;
  const items = templates.templates.filter(item => item.group === group.id);
  const total = templates.templates.length;
  const training = library.training;
  const posted = templates.templates.filter(item => item.status === 'hosted' || item.status === 'adapted').length;
  const links: CompanionLink[] = [
    { href: templates.download.href, title: templates.download.label, detail: `ZIP · ${posted} Word and Excel templates with a README`, icon: <Download size={19} />, trailing: <Download size={16} />, download: true },
    ...(training.relatedResources ?? []).map(resource => ({
      href: resource.href,
      title: resource.title,
      detail: resource.detail,
      icon: <BookOpen size={19} />,
      trailing: <ArrowUpRight size={16} />,
    })),
  ];
  const frameworksIn = [...new Set(items.map(item => frameworkLabel(item.framework)))];

  return (
    <div className="vc-experience">
      <section className="vc-episode" aria-labelledby={`library-resources-${library.id}`}>
        <CompanionHeading
          id={`library-resources-${library.id}`}
          intro="Download the JSIG templates, open the full library, or browse one RMF step at a time below."
          action={{ href: training.guide, label: 'Open the full library', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${library.id}`}
            cover={training.cover}
            coverAlt={`Cover of the Secure By Design ${library.title}`}
            heading={['Keep the templates.', 'Build the Body of Evidence.']}
            summary={`A DoD SAP / JSIG template set: ${posted} templates to download and ${total - posted} more entries that point to the official source, arranged by RMF step.`}
            guide={{
              href: training.guide,
              title: `Open the ${library.title}`,
              detail: `${total} entries · search · filter by source and downloads`,
              icon: <BookOpen size={20} />,
              trailing: <ArrowUpRight size={19} />,
            }}
            links={links}
            edition={<>
              <p>Edition: {templates.edition}</p>
              <p>For instruction and practice. Your AO and PSO&apos;s current templates take precedence. Links checked {training.updated}.</p>
              <p>© 2026 Secure By Design Team LLC.</p>
            </>}
          />
          <div className="vc-watch vc-library-key">
            <div className="vc-library-counts" role="list" aria-label="Entries by status">
              {Object.entries(STATUSES).map(([id, status]) => (
                <div role="listitem" key={id}>
                  <b>{templates.templates.filter(item => item.status === id).length}</b>
                  <span>{status.label}</span>
                </div>
              ))}
            </div>
            <div className="vc-library-legend">
              <span>WHAT EACH ENTRY GIVES YOU</span>
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
              <p className="vc-kicker">RMF STEP EXPLORER</p>
              <h4 id={`artifact-explorer-${library.id}`}>Choose a step to see its templates.</h4>
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
                <b>{groups.length} sections</b>
              </p>
            </div>
            <h5>{group.title}</h5>
            {group.note && <p>{group.note}</p>}
            <div className="vc-network-note">
              <span>{group.abbr}</span>
              <p>{items.length} entr{items.length === 1 ? 'y' : 'ies'} · {frameworksIn.join(', ')}</p>
            </div>
            <a className="vc-library-deeplink" href={`${training.guide}#${group.id}`}>
              Open {group.title} in the full library
              <ArrowUpRight size={15} />
            </a>
          </aside>
          <div className="vc-scene-wrap vc-library-stage">
            <p className="vc-kicker">SECTION {active + 1} OF {groups.length} · {items.length} ENTR{items.length === 1 ? 'Y' : 'IES'}</p>
            <ul className="vc-library-list">
              {items.map(item => <TemplateEntry key={item.title} item={item} />)}
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
