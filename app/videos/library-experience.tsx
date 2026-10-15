// The expanded tile for a reference library (the ATO Template Library). It keeps the companion layout every
// expanded tile shares (companion.tsx): the heading, the materials panel and a right-hand column, then the entries
// below. Owner direction, 15 October 2026: the library lists only documents verified as publicly released, each
// linked to its publisher (content/ato-templates.json). The full page is /grc-rmf-training/templates.
import { ArrowUpRight, BookOpen, FileText, Maximize2 } from 'lucide-react';
import type { ReferenceLibrary } from './catalog-types';
import { CompanionHeading, CompanionMaterials, type CompanionLink } from './companion';
import templates from '../../content/ato-templates.json';
import TemplateEntry, { SampleEntry } from './template-entry';
import { sourcesPhrase } from './template-labels';

export default function LibraryExperience({ library }: { library: ReferenceLibrary }) {
  const total = templates.templates.length;
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
          intro="Open each official source below, or the full library page."
          action={{ href: training.guide, label: 'Open the full library', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${library.id}`}
            cover={training.cover}
            coverAlt={`Cover of the Secure By Design ${library.title}`}
            heading={['Keep the sources.', 'Build the Body of Evidence.']}
            summary={`${sourcesPhrase(total)}, each verified as publicly released by its publisher and linked to the publisher's own copy.`}
            guide={{
              href: training.guide,
              title: `Open the ${library.title}`,
              detail: `${total} entries · arranged by RMF step`,
              icon: <BookOpen size={20} />,
              trailing: <ArrowUpRight size={19} />,
            }}
            links={links}
            edition={<>
              <p>For instruction and practice. Your AO&apos;s and PSO&apos;s current templates take precedence. Links checked {training.updated}.</p>
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
              <p className="vc-kicker">VERIFIED PUBLIC SOURCES</p>
              <h4 id={`library-sources-${library.id}`}>Open each source from its publisher.</h4>
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
          <ul className="vc-library-list">
            {templates.templates.map(item => <TemplateEntry key={item.title} item={item} />)}
          </ul>
          <p className="vc-kicker vc-library-samples-kicker">SECURE BY DESIGN TRAINING SAMPLES · NOT OFFICIAL FORMS · FICTIONAL DATA ONLY</p>
          <ul className="vc-library-list">
            {templates.samples.map(item => <SampleEntry key={item.href} item={item} />)}
          </ul>
        </div>
      </section>
    </div>
  );
}
