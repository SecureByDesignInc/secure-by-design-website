'use client';

// The full ATO Template Library page, in the Training Library's design. The expanded catalog tile
// (app/videos/library-experience.tsx) shows one artifact at a time and links here, to an artifact's
// section by its #id. Filters combine: framework, status ("hide legacy") and search.
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ExternalLink, Search, X } from 'lucide-react';
import templates from '../../../content/ato-templates.json';
import { FRAMEWORKS, STATUSES, frameworkLabel } from '../../videos/template-labels';

type Template = (typeof templates.templates)[number];

const checked = new Date(`${templates.checked}T12:00:00Z`).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function matches(item: Template, framework: string, hideLegacy: boolean, tokens: string[]) {
  if (framework && item.framework !== framework) return false;
  if (hideLegacy && item.status === 'legacy') return false;
  if (!tokens.length) return true;
  const group = templates.groups.find(entry => entry.id === item.group);
  const text = [item.title, item.source, item.note, item.rmf, item.framework, group?.title, group?.abbr].join(' ').toLowerCase();
  return tokens.every(token => text.includes(token));
}

export default function TemplateLibrary() {
  const [framework, setFramework] = useState('');
  const [hideLegacy, setHideLegacy] = useState(false);
  const [query, setQuery] = useState('');
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = templates.templates.filter(item => matches(item, framework, hideLegacy, tokens));
  const groups = templates.groups
    .map(group => ({ ...group, items: visible.filter(item => item.group === group.id) }))
    .filter(group => group.items.length > 0);
  const filtered = Boolean(framework || hideLegacy || tokens.length);
  const reset = () => { setFramework(''); setHideLegacy(false); setQuery(''); };

  return (
    <main id="main" className="vc-page tl-page">
      <section className="container vc-intro">
        <div>
          <p className="vc-kicker">TEMPLATES &amp; REFERENCES</p>
          <h1>
            ATO Template Library.
            <br />
            <em>Start from the real format.</em>
          </h1>
        </div>
        <div className="vc-intro-copy">
          <p>
            {templates.templates.length} free templates for the artifacts in an authorization package, from
            categorization to the POA&amp;M, with the DoD SAP, JSIG and CNSS templates a SAP system uses. Every link goes
            to the publisher, and each template shows its framework, its status and the RMF tasks it supports.
          </p>
          <a href="#template-list">
            Browse the templates <ArrowDown size={16} />
          </a>
        </div>
      </section>

      <section id="template-list" className="container vc-library" aria-labelledby="template-list-title">
        <div className="vc-library-heading">
          <div>
            <p className="vc-kicker">THE BODY OF EVIDENCE</p>
            <h2 id="template-list-title">Find the template for each artifact.</h2>
          </div>
          <span>{templates.groups.length} artifacts · {templates.templates.length} templates · Links checked {checked}</span>
        </div>

        <div className="vc-category-filters" role="group" aria-label="Framework">
          {[{ id: '', label: 'All frameworks' }, ...FRAMEWORKS].map(item => (
            <button type="button" key={item.id} aria-pressed={framework === item.id} onClick={() => setFramework(item.id)}>
              {item.label}
              <span>{item.id ? templates.templates.filter(entry => entry.framework === item.id).length : templates.templates.length}</span>
            </button>
          ))}
        </div>
        <search className="vc-catalog-toolbar" aria-label="Find templates">
          <div className="vc-catalog-search">
            <Search size={18} aria-hidden="true" />
            <label className="vc-sr-only" htmlFor="template-search">Search templates</label>
            <input
              id="template-search"
              type="search"
              value={query}
              placeholder="Search an artifact, publisher or RMF task, e.g. POA&M, ISCP, S-4…"
              onChange={event => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <label className="tl-toggle" htmlFor="template-hide-legacy">
            <input id="template-hide-legacy" type="checkbox" checked={hideLegacy} onChange={event => setHideLegacy(event.target.checked)} />
            Hide legacy templates
          </label>
        </search>

        <ul className="tl-legend" aria-label="Template status">
          {Object.entries(STATUSES).map(([id, status]) => (
            <li key={id}><i className={`vc-status vc-status-${id}`}>{status.label}</i>{status.detail}</li>
          ))}
        </ul>

        <div className="vc-catalog-result-row">
          <output aria-live="polite">
            {visible.length === 0 ? 'No templates found' : `Showing ${visible.length} of ${templates.templates.length} templates`}
          </output>
          {filtered && (
            <button type="button" onClick={reset}>
              Clear filters <X size={13} />
            </button>
          )}
        </div>

        {groups.length > 0 && (
          <nav className="tl-jump" aria-label="Jump to an artifact">
            {groups.map(group => <a key={group.id} href={`#${group.id}`}>{group.abbr.split(' / ')[0]}</a>)}
          </nav>
        )}

        {groups.map(group => (
          <section key={group.id} id={group.id} className="tl-group" aria-labelledby={`${group.id}-title`}>
            <div className="vc-category-heading">
              <div>
                <h3 id={`${group.id}-title`}>{group.title} <span className="tl-abbr">{group.abbr}</span></h3>
                {group.note && <p>{group.note}</p>}
              </div>
              <span>{group.items.length} template{group.items.length === 1 ? '' : 's'}</span>
            </div>
            <ul className="vc-library-list tl-list">
              {group.items.map(item => (
                <li key={item.title}>
                  <div className="vc-library-item-head">
                    <h4>{item.title}</h4>
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
          </section>
        ))}

        {visible.length === 0 && (
          <div className="vc-catalog-empty">
            <Search size={28} />
            <h3>Try another artifact or publisher.</h3>
            <p>Search for a name like SSP, ISCP or DAAPM, or clear your filters to see every template.</p>
            <button type="button" onClick={reset}>Show all templates</button>
          </div>
        )}

        <aside className="tl-gaps" aria-labelledby="template-gaps">
          <h3 id="template-gaps">What isn&apos;t here, and why</h3>
          <ul>
            <li><b>DoD SCTM, Executive Summary and ATO letter templates</b> live in the RMF Knowledge Service and eMASS, which need a CAC or ECA certificate. Component templates differ, so use your authorizing official&apos;s version. The SP 800-53B baselines and the DCSA SSP workbook are the closest public starting points for an SCTM.</li>
            <li><b>FedRAMP&apos;s 2026 packages</b> have no Word or Excel templates. The Certification Package Overview and Security Decision Record are JSON documents checked against FedRAMP&apos;s schemas, listed under Machine-readable formats.</li>
            <li><b>The JSIG a SAP program uses</b> may be newer than the public 11 April 2016 edition, which maps to SP 800-53 Rev. 4. DoDM 5205.07 requires the JSIG or its successor; get the current version and any program templates through your PSO.</li>
            <li><b>SAP authorization packages</b> live in the program&apos;s own eMASS instance and follow its templates, which need access. The public SAP templates here are the DoD SAP Working Group&apos;s, posted by DCSA.</li>
            <li><b>Security categorization</b> has no fill-in worksheet from NIST or CNSS. Use CNSSI 1253 with the JSIG&apos;s confidentiality flowchart, and record the result in the SSP.</li>
            <li><b>GSA&apos;s ISA and IEA-MOA templates</b> are named in GSA&apos;s public procedural guide but kept on GSA&apos;s internal site. Use NIST SP 800-47 Rev. 1 Appendix C instead.</li>
            <li><b>FedRAMP&apos;s Rev5 templates page</b> no longer lists files. The Rev5 templates are on FedRAMP&apos;s legacy page, kept for reference during the move to the 2026 rules.</li>
          </ul>
        </aside>

        <div className="vc-library-footer">
          <p>Templates belong to their publishers. Each link goes to the official source; links were checked on {checked}.</p>
          <Link href="/training">
            <ArrowLeft size={17} /> Back to the Training Library
          </Link>
        </div>
      </section>
    </main>
  );
}
