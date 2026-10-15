// The full ATO Template Library page, in the Training Library's design. Owner direction, 15 October 2026: the
// library lists only documents verified as publicly released by an official publisher, arranged by RMF step and
// linked to the publisher's own copy. The expanded catalog tile (app/videos/library-experience.tsx) links here.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import templates from '../../../content/ato-templates.json';
import TemplateEntry from '../../videos/template-entry';
import { sourcesPhrase } from '../../videos/template-labels';

const checked = new Date(`${templates.checked}T12:00:00Z`).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function TemplateLibrary() {
  const total = templates.templates.length;
  const groups = templates.groups
    .map(group => ({ ...group, items: templates.templates.filter(item => item.group === group.id) }))
    .filter(group => group.items.length > 0);

  return (
    <main id="main" className="vc-page tl-page">
      <section className="container vc-intro">
        <div>
          <p className="vc-kicker">TEMPLATES &amp; REFERENCES</p>
          <h1>
            ATO Template Library.
            <br />
            <em>Verified public sources.</em>
          </h1>
        </div>
        <div className="vc-intro-copy">
          <p>
            {sourcesPhrase(total)} for building an authorization package, arranged by RMF step. Each one is
            verified as publicly released by its publisher, and every link opens the publisher&apos;s own copy.
          </p>
        </div>
      </section>

      <section id="template-list" className="container vc-library" aria-labelledby="template-list-title">
        <aside className="tl-edition" aria-labelledby="template-rule">
          <h2 id="template-rule">How these were chosen</h2>
          <p>
            Each entry was checked on {checked}: its publisher posts it on an official government site that anyone can
            open without signing in. Templates that could not be verified as publicly released are not listed. Ask your
            ISSM or PSO for the versions your program uses.
          </p>
          <p>
            Use these for instruction and practice with fictional data only. On a real system, your AO&apos;s and
            PSO&apos;s current templates take precedence.
          </p>
        </aside>

        <div className="vc-library-heading">
          <div>
            <p className="vc-kicker">THE BODY OF EVIDENCE</p>
            <h2 id="template-list-title">Open each source from its publisher.</h2>
          </div>
          <span>{total} entries · Links checked {checked}</span>
        </div>

        {groups.map(group => (
          <section key={group.id} id={group.id} className="tl-group" aria-labelledby={`${group.id}-title`}>
            <div className="vc-category-heading">
              <div>
                <h3 id={`${group.id}-title`}>{group.title} <span className="tl-abbr">{group.abbr}</span></h3>
                <p>{group.note}</p>
              </div>
              <span>{group.items.length} entr{group.items.length === 1 ? 'y' : 'ies'}</span>
            </div>
            <ul className="vc-library-list tl-list">
              {group.items.map(item => <TemplateEntry key={item.title} item={item} heading="h4" />)}
            </ul>
          </section>
        ))}

        <div className="vc-library-footer">
          <p>Official documents belong to their publishers. Links checked {checked}.</p>
          <Link href="/training">
            <ArrowLeft size={17} /> Back to the Training Library
          </Link>
        </div>
      </section>
    </main>
  );
}
