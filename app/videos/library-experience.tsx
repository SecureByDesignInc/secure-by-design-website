// The expanded tile for a reference library (the ATO Template Library). It keeps the companion layout every
// expanded tile shares (companion.tsx): the heading, the materials panel and a right-hand column, then the entries
// below. Owner direction, 15 October 2026: the library lists only documents verified as publicly released, each
// linked to its publisher (content/ato-templates.json). The full page is /grc-rmf-training/templates.
// Owner direction, 21 October 2026: while the official sources are revised, each RMF step is one coming-soon card, as on
// the full page, with no publisher, version, date or link. The training samples are unchanged.
import { ArrowUpRight, BookOpen, FileText, Maximize2 } from 'lucide-react';
import type { ReferenceLibrary } from './catalog-types';
import { CompanionHeading, CompanionMaterials, type CompanionLink } from './companion';
import templates from '../../content/ato-templates.json';
import TemplateEntry, { SampleEntry, StepSoonCard } from './template-entry';
import { officialFor, officialTemplates, sourcesPhrase } from './template-labels';

export default function LibraryExperience({ library }: { library: ReferenceLibrary }) {
  const total = officialTemplates.length;
  const soon = templates.groups.filter(group => officialFor(group.id).length === 0);
  const training = library.training;
  const links: CompanionLink[] = (training.relatedResources ?? []).map(resource => ({
    href: resource.href,
    title: resource.title,
    detail: resource.detail,
    icon: <BookOpen size={19} />,
    trailing: <ArrowUpRight size={16} />,
  }));

  return (
    <div className="vc-experience">
      <section className="vc-episode" aria-labelledby={`library-resources-${library.id}`}>
        <CompanionHeading
          id={`library-resources-${library.id}`}
          intro={total ? 'Open each official source below, or the full library page.' : 'Official sources are coming soon. The training samples below are ready to use now.'}
          action={{ href: training.guide, label: 'Open the full library', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${library.id}`}
            cover={training.cover}
            coverAlt={`Cover of the Secure By Design ${library.title}`}
            heading={['Keep the sources.', 'Build the Body of Evidence.']}
            summary={total ? `${sourcesPhrase(total)}, each verified as publicly released by its publisher and linked to the publisher's own copy.` : `Official sources for each RMF step are coming soon. ${templates.samples.length} Secure By Design training samples are ready now.`}
            guide={{
              href: training.guide,
              title: `Open the ${library.title}`,
              detail: total ? `${total} entries · arranged by RMF step` : 'Official sources coming soon · training samples',
              icon: <BookOpen size={20} />,
              trailing: <ArrowUpRight size={19} />,
            }}
            links={links}
            edition={<>
              <p>For instruction and practice. Your AO&apos;s and PSO&apos;s current templates take precedence.</p>
              <p>© 2026 Secure By Design Team LLC.</p>
            </>}
          />
          <div className="vc-watch vc-library-key">
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

      <section className="vc-explorer" aria-labelledby={`library-sources-${library.id}`}>
        <div className="vc-explorer-heading">
          <div className="vc-stage-title">
            <FileText size={21} />
            <div>
              <p className="vc-kicker">{total ? 'VERIFIED PUBLIC SOURCES' : 'OFFICIAL SOURCES · COMING SOON'}</p>
              <h4 id={`library-sources-${library.id}`}>{total ? 'Open each source from its publisher.' : 'Official sources by RMF step.'}</h4>
            </div>
          </div>
          <div className="vc-scene-tools">
            <a href={training.guide}>
              <BookOpen size={15} />
              <span>Full library</span>
            </a>
            <a href="/grc-rmf-training/workspace">
              <Maximize2 size={15} />
              <span>ATO Package Builder</span>
            </a>
          </div>
        </div>
        <div className="vc-library-stage">
          {soon.length > 0 && <div className="th-grid vc-library-steps">
            {soon.map(group => <StepSoonCard key={group.id} group={group} heading="h5" anchor={false} />)}
          </div>}
          {total > 0 && <ul className="vc-library-list">
            {officialTemplates.map(item => <TemplateEntry key={item.title} item={item} />)}
          </ul>}
          <p className="vc-kicker vc-library-samples-kicker">SECURE BY DESIGN TRAINING SAMPLES · NOT OFFICIAL FORMS · FICTIONAL DATA ONLY</p>
          <ul className="vc-library-list">
            {templates.samples.map(item => <SampleEntry key={item.href} item={item} />)}
          </ul>
        </div>
      </section>
    </div>
  );
}
