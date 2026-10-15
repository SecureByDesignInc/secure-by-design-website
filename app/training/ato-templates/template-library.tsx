'use client';

// The full ATO Template Library page, in the Training Library's design. Owner direction, 15 October 2026:
// a DoD SAP / JSIG template set arranged by RMF step. The expanded catalog tile (app/videos/library-experience.tsx)
// shows one step at a time and links here, to a step's section by its #id. Filters combine: source, downloads
// only, and search.
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Search, X } from 'lucide-react';
import templates from '../../../content/ato-templates.json';
import { FRAMEWORKS, STATUSES } from '../../videos/template-labels';
import TemplateEntry from '../../videos/template-entry';

type Template = (typeof templates.templates)[number];

const checked = new Date(`${templates.checked}T12:00:00Z`).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const isPosted = (item: Template) => item.status === 'hosted' || item.status === 'adapted';
const postedCount = templates.templates.filter(isPosted).length;

function matches(item: Template, framework: string, downloadsOnly: boolean, tokens: string[]) {
  if (framework && item.framework !== framework) return false;
  if (downloadsOnly && !isPosted(item)) return false;
  if (!tokens.length) return true;
  const group = templates.groups.find(entry => entry.id === item.group);
  const text = [item.title, item.source, item.note, item.rmf, item.framework, group?.title, group?.abbr].join(' ').toLowerCase();
  return tokens.every(token => text.includes(token));
}

export default function TemplateLibrary() {
  const [framework, setFramework] = useState('');
  const [downloadsOnly, setDownloadsOnly] = useState(false);
  const [query, setQuery] = useState('');
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = templates.templates.filter(item => matches(item, framework, downloadsOnly, tokens));
  const groups = templates.groups
    .map(group => ({ ...group, items: visible.filter(item => item.group === group.id) }))
    .filter(group => group.items.length > 0);
  const frameworks = FRAMEWORKS.filter(item => templates.templates.some(entry => entry.framework === item.id));
  const filtered = Boolean(framework || downloadsOnly || tokens.length);
  const reset = () => { setFramework(''); setDownloadsOnly(false); setQuery(''); };

  return (
    <main id="main" className="vc-page tl-page">
      <section className="container vc-intro">
        <div>
          <p className="vc-kicker">TEMPLATES &amp; REFERENCES</p>
          <h1>
            ATO Template Library.
            <br />
            <em>The JSIG set, step by step.</em>
          </h1>
        </div>
        <div className="vc-intro-copy">
          <p>
            The templates a DoD Special Access Program system is authorized with, arranged by RMF step: {postedCount} Word
            and Excel templates to download, plus official sources for the rest of the Body of Evidence. Use them to
            practice on the Inside the Network system.
          </p>
          <a href={templates.download.href} download>
            {templates.download.label} <Download size={16} />
          </a>
        </div>
      </section>

      <section id="template-list" className="container vc-library" aria-labelledby="template-list-title">
        <aside className="tl-edition" aria-labelledby="template-edition">
          <h2 id="template-edition">Which edition these follow</h2>
          <p>
            The templates follow the <b>{templates.edition}</b>. No Rev. 5 JSIG or JSIG successor had been published as
            of {checked}, so a SAP program still uses this edition with the current CNSSI 1253 baselines and overlays its
            authorizing official directs. DoDM 5205.07 (17 January 2025) requires the JSIG or its successor.
          </p>
          <p>
            These files are for instruction and practice. Fill them in with fictional data only, and use your AO and
            PSO&apos;s current templates on a real system.
          </p>
        </aside>

        <div className="vc-library-heading">
          <div>
            <p className="vc-kicker">THE BODY OF EVIDENCE</p>
            <h2 id="template-list-title">Find the template for each step.</h2>
          </div>
          <span>{templates.groups.length} sections · {templates.templates.length} entries · Links checked {checked}</span>
        </div>

        <div className="vc-category-filters" role="group" aria-label="Source">
          {[{ id: '', label: 'All sources' }, ...frameworks].map(item => (
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
              placeholder="Search an artifact or RMF task, e.g. SCTM, POA&M, AFT, R-4…"
              onChange={event => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <label className="tl-toggle" htmlFor="template-downloads-only">
            <input id="template-downloads-only" type="checkbox" checked={downloadsOnly} onChange={event => setDownloadsOnly(event.target.checked)} />
            Downloads only
          </label>
        </search>

        <ul className="tl-legend" aria-label="What each entry gives you">
          {Object.entries(STATUSES).map(([id, status]) => (
            <li key={id}><i className={`vc-status vc-status-${id}`}>{status.label}</i>{status.detail}</li>
          ))}
        </ul>

        <div className="vc-catalog-result-row">
          <output aria-live="polite">
            {visible.length === 0 ? 'No templates found' : `Showing ${visible.length} of ${templates.templates.length} entries`}
          </output>
          {filtered && (
            <button type="button" onClick={reset}>
              Clear filters <X size={13} />
            </button>
          )}
        </div>

        {groups.length > 0 && (
          <nav className="tl-jump" aria-label="Jump to an RMF step">
            {groups.map(group => <a key={group.id} href={`#${group.id}`}>{group.title}</a>)}
          </nav>
        )}

        {groups.map(group => (
          <section key={group.id} id={group.id} className="tl-group" aria-labelledby={`${group.id}-title`}>
            <div className="vc-category-heading">
              <div>
                <h3 id={`${group.id}-title`}>{group.title} <span className="tl-abbr">{group.abbr}</span></h3>
                {group.note && <p>{group.note}</p>}
              </div>
              <span>{group.items.length} entr{group.items.length === 1 ? 'y' : 'ies'}</span>
            </div>
            <ul className="vc-library-list tl-list">
              {group.items.map(item => <TemplateEntry key={item.title} item={item} heading="h4" />)}
            </ul>
          </section>
        ))}

        {visible.length === 0 && (
          <div className="vc-catalog-empty">
            <Search size={28} />
            <h3>Try another artifact or source.</h3>
            <p>Search for a name like SSP, SCTM or DATO, or clear your filters to see every entry.</p>
            <button type="button" onClick={reset}>Show all templates</button>
          </div>
        )}

        <aside className="tl-gaps" aria-labelledby="template-gaps">
          <h3 id="template-gaps">What isn&apos;t posted, and why</h3>
          <ul>
            <li><b>Some SCTM overlays.</b> The Intelligence and Cross Domain Solution overlays are FOUO and CAC-only, and the JSIG Accessibility, Isolated LAN and Standalone overlays could not be verified as publicly released, so their columns were removed. The Classified (2014) and Privacy (2015) overlays remain, with the current CNSS editions linked under Select.</li>
            <li><b>The DAF IT Categorization and Selection Checklist (ITCSC)</b> is distributed on the Air Force RMF Knowledge Service, which needs a CAC. Its entry describes what it records.</li>
            <li><b>The Sanitization Plan Review Checklist</b> is marked not releasable outside its issuing office. Its entry points to NIST SP 800-88 Rev. 2 and NSA/CSS Policy Manual 9-12, which teach the same steps.</li>
            <li><b>Decision letters, the System Validation Memorandum, Mission Impact Memorandum and PPSM matrix</b> have no public templates. They are kept on the RMF Knowledge Service, in SAP eMASS or inside each organization.</li>
            <li><b>Rev. 5 versions</b> of these templates have not been published. When you map a Rev. 4 template to Rev. 5 for practice, label the result as an unofficial teaching mapping.</li>
          </ul>
        </aside>

        <div className="vc-library-footer">
          <p>Official templates belong to their publishers. Adapted files are marked as training adaptations. Links checked {checked}.</p>
          <Link href="/training">
            <ArrowLeft size={17} /> Back to the Training Library
          </Link>
        </div>
      </section>
    </main>
  );
}
