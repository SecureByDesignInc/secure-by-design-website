// The expanded tile for a US design reference (owner's compendium, 19 October 2026). It keeps the companion layout
// every expanded tile shares (companion.tsx): the heading, the materials panel and a right-hand column, then the
// design areas below. The full reference is its own page, /training/design/<service> (design-reference.tsx).
import { ArrowUpRight, BookOpen, Compass, FileText, Scale } from 'lucide-react';
import type { ReferenceLibrary } from './catalog-types';
import { CompanionHeading, CompanionMaterials, type CompanionLink } from './companion';

// The tile carries its design areas and counts (content/videos.json, written by scripts/prepare-design-references.py),
// so the full 800 KB reference stays on its own page.
export default function DesignReferenceExperience({ reference }: { reference: ReferenceLibrary }) {
  const training = reference.training;
  const areas = reference.areas ?? [];
  const stats = reference.stats ?? { areas: areas.length, sources: 0 };
  const design = stats.areas > 0;
  const links: CompanionLink[] = (training.relatedResources ?? []).map(resource => ({
    href: resource.href,
    title: resource.title,
    detail: resource.detail,
    icon: <BookOpen size={19} />,
    trailing: <ArrowUpRight size={16} />,
  }));

  return (
    <div className="vc-experience">
      <section className="vc-episode" aria-labelledby={`design-resources-${reference.id}`}>
        <CompanionHeading
          id={`design-resources-${reference.id}`}
          intro="Read the design areas, then open the full reference with its source catalog."
          action={{ href: training.guide, label: 'Open the full reference', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${reference.id}`}
            cover={training.cover}
            coverAlt={`Cover of the Secure By Design ${reference.title} reference`}
            heading={['Design it first.', 'Then build it right.']}
            summary={`${design ? `${stats.areas} design areas` : `${areas.length} sections`} and ${stats.sources} sources, from official Microsoft documentation and US government and standards guidance only.`}
            guide={{
              href: training.guide,
              title: `Open the ${reference.title} reference`,
              detail: design ? 'Decision at stake · options · what the US authorities say · trade-offs · conflicts' : 'Guidance landscape · sources by publisher · crosswalk · agreements and conflicts',
              icon: <Compass size={20} />,
              trailing: <ArrowUpRight size={19} />,
            }}
            links={links}
            edition={<>
              <p>US design reference · Compendium assembled {training.updated}</p>
              <p>Sources are named by publisher, title, date and status; open each at the publisher&apos;s own site.</p>
              <p>© 2026 Secure By Design Team LLC.</p>
            </>}
          />
          <div className="vc-watch vc-design-areas">
            <p className="vc-kicker"><Scale size={13} aria-hidden="true" /> {design ? 'DESIGN AREAS' : 'IN THIS CATALOG'}</p>
            <ol>
              {areas.map(area => <li key={area.anchor}><a href={`${training.guide}#${area.anchor}`}>{area.title}</a></li>)}
            </ol>
            <p className="vc-design-note"><FileText size={13} aria-hidden="true" /> {reference.outcomeSummary}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
