'use client';

// One catalog tile with its expanded experience: the identity build (1.1), each configuration course, course 2.1 and
// the ATO Template Library. Every expanded tile matches the expanded "Build the identity foundation" tile (owner
// direction, 8 October 2026). The Training Hub (training-hub.tsx) opens the tile chosen in its library beneath the
// row it came from (owner direction, 19 October 2026).
import { useRef } from 'react';
import Image from 'next/image';
import { BookOpen, Check, ChevronUp, Clock, FileText, Link2, Network, Video } from 'lucide-react';
import EpisodeExperience from './episode-experience';
import CourseExperience from './course-experience';
import LibraryExperience from './library-experience';
import DesignReferenceExperience from './design-reference-experience';
import type { CatalogEntry } from './catalog-types';
import atoTemplates from '../../content/ato-templates.json';
import { getYouTubeEmbedUrl, isReferenceLibrary, isTrainingCourse, supportsIdentityScene } from './video-utils';

const ART_SERIES: Record<string, string> = {
  'network-authorization': 'FROM BUILD TO AUTHORIZATION',
  'templates-references': 'TEMPLATES & REFERENCES',
  'design-references': 'GOVERNMENT & VENDOR GUIDELINES',
};

export default function EpisodeTile({
  episode,
  expanded,
  onToggle,
}: {
  episode: CatalogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const opener = useRef<HTMLButtonElement>(null);
  const course = isTrainingCourse(episode);
  // Reference tiles (the ATO Template Library) share the course tile's layout: labels beside a cover, no recording.
  const reference = isReferenceLibrary(episode);
  // A design reference (owner's compendium, 19 October 2026; framed as Government & Vendor Guidelines since 20 October): design areas and sources instead of template counts.
  const design = reference && episode.kind === 'design-reference';
  const stats = design ? (episode as { stats?: { areas: number; sources: number } }).stats : undefined;
  // Coming-soon tiles hold their place in the path but have no material yet: no cover, no download, no opening.
  const comingSoon = course && episode.kind === 'coming-soon';
  const available = !course && !reference && Boolean(getYouTubeEmbedUrl(episode.youtubeId));
  const series = ART_SERIES[episode.categoryId ?? ''] ?? 'THE NETWORK BUILD SERIES';
  // The ATO Template Library counts its official sources and the RMF steps they are arranged by.
  const sourceCount = atoTemplates.templates.length;
  const sectionCount = atoTemplates.groups.length;
  const openLabel = design ? 'reference' : reference ? 'library' : 'training';
  const close = () => {
    onToggle();
    opener.current?.focus();
  };

  return (
    <article
      className={`vc-catalog-tile ${expanded ? 'vc-tile-expanded' : ''}${reference ? ' vc-tile-reference' : ''}`}
      aria-labelledby={`tile-title-${episode.id}`}
    >
      <div className="vc-tile-overview">
        <div className="vc-tile-art" aria-hidden="true">
          <div className="vc-tile-art-top">
            <span>{series}</span>
            {!reference && <b>{episode.number}</b>}
          </div>
          {course || reference ? <>
            <div className={`vc-course-art vc-art-${episode.id}${episode.training.cover ? ' vc-course-art-book' : ''}`}>{(episode.artLabels ?? ['Risk Management Framework', 'Body of Evidence', 'Authorization to Operate']).map(label => <span key={label}>{label.replace(/ ([+→]) /g, '\u00a0$1 ')}</span>)}</div>
            {/* Every tile shows its workbook, as the identity build's does: the same placement and size. */}
            {episode.training.cover && <div className="vc-tile-topology">
              <Image
                className="vc-tile-book"
                src={episode.training.cover}
                width={110}
                height={142}
                alt=""
                loading="lazy"
                unoptimized
              />
            </div>}
          </> : <div className="vc-tile-topology">
            <div className="vc-tile-servers">
              {episode.systems.slice(0, 2).map((system) => (
                <div className="vc-tile-system" key={system}>
                  <div className="vc-server-mini">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>{system}</span>
                </div>
              ))}
              <span className="vc-tile-wire" />
            </div>
            <Image
              className="vc-tile-book"
              src={episode.training.cover}
              width={110}
              height={142}
              alt=""
              loading="lazy"
              unoptimized
            />
          </div>}
          <div className="vc-tile-art-bottom">
            <span>
              {course || reference ? <BookOpen size={13} /> : <Network size={13} />}
              {design ? 'DESIGN REFERENCE' : reference ? 'TEMPLATE LIBRARY' : comingSoon ? 'IN PREPARATION' : course ? (episode.kind === 'configuration' ? 'CONFIGURATION GUIDE' : 'AUTHORIZATION TRAINING') : supportsIdentityScene(episode)
                ? 'INTERACTIVE 3D BUILD'
                : 'EXPLORE THE BUILD'}
            </span>
            <span>{design ? (stats?.areas ? `${stats.areas} DESIGN AREAS` : `${stats?.sources ?? 0} SOURCES`) : reference ? `${sourceCount} SOURCES` : comingSoon ? 'COMING SOON' : course ? `${episode.lessonCount ?? episode.moduleCount} LESSONS` : `${episode.chapters.length} LESSONS`}</span>
          </div>
        </div>
        <div className="vc-tile-body">
          <div className="vc-tile-description">
            <p className="vc-kicker">
              {episode.categoryId === 'network-build' && episode.categoryOrder === 1 && <span className="vc-start-here">START HERE</span>}
              {design ? 'DESIGN REFERENCE' : reference ? 'REFERENCE LIBRARY' : `COURSE ${episode.number}`}
              {/* Compact tiles hide the topic visually so the kicker fits one line; it stays in the DOM and shows when expanded. */}
              <span className="vc-kicker-topic">{` / ${design ? (episode.topic ?? 'DESIGN').toUpperCase() : reference ? 'TEMPLATES' : episode.categoryId === 'network-authorization' ? 'NETWORK AUTHORIZATION' : episode.tags[0]}`}</span>
            </p>
            <h3 id={`tile-title-${episode.id}`} title={episode.title}>{episode.title}</h3>
            <p className="vc-tile-subtitle" title={episode.subtitle}>{episode.subtitle}</p>
            <p className="vc-tile-summary">{episode.description}</p>
            <div className="vc-tile-tags">
              {episode.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          {comingSoon ? <div className="vc-tile-actions vc-tile-soon">
            <p className="vc-tile-soon-badge"><Clock size={15} aria-hidden="true" />Coming soon</p>
            <p className="vc-tile-included">Training materials are in preparation.</p>
          </div> : <div className="vc-tile-actions">
            {design ? <div className="vc-tile-status">
              <span>
                <Check size={13} />
                Government & vendor guidelines
              </span>
              <span className="vc-tile-course-size"><FileText size={13} />{stats?.sources ?? 0} sources{stats?.areas ? ` · ${stats.areas} design areas` : ''}</span>
              <span>
                <Link2 size={13} />
                Compendium {episode.training.updated}
              </span>
            </div> : reference ? <div className="vc-tile-status">
              <span>
                <Check size={13} />
                Verified public sources
              </span>
              <span className="vc-tile-course-size"><FileText size={13} />{sourceCount} official links · {sectionCount} RMF steps</span>
              <span>
                <Link2 size={13} />
                Links checked {episode.training.updated}
              </span>
            </div> : <div className="vc-tile-status">
              <span>
                <Check size={13} />
                Written training available
              </span>
              {course ? <span className="vc-tile-course-size"><BookOpen size={13} />{episode.lessonCount ?? episode.moduleCount} lessons · {episode.estimatedHours}h</span> : <span className="vc-tile-course-size"><BookOpen size={13} />{episode.chapters.length} lessons · Self-paced</span>}
              <span>
                <Video size={13} />
                {available ? 'Video available' : 'Video coming soon'}
              </span>
            </div>}
            <button
              ref={opener}
              id={`episode-open-${episode.id}`}
              type="button"
              className="vc-tile-open"
              aria-expanded={expanded}
              aria-controls={`episode-content-${episode.id}`}
              aria-label={`${expanded ? `Close ${openLabel}` : `Open ${openLabel}`}: ${episode.title}`}
              onClick={onToggle}
            >
              <span>{expanded ? `Close ${openLabel}` : `Open ${openLabel}`}</span>
              {expanded ? <ChevronUp size={18} /> : <BookOpen size={18} />}
            </button>
            <p className="vc-tile-included">
              <BookOpen size={12} />
              {design ? <>Design reference<span>·</span>Source catalog</> : reference ? <>Reference library<span>·</span>Official links</> : <>Interactive guide<span>·</span>One download</>}
            </p>
          </div>}
        </div>
      </div>
      <div id={`episode-content-${episode.id}`} hidden={!expanded}>
        {expanded && (
          <>
            {design ? <DesignReferenceExperience reference={episode} /> : reference ? <LibraryExperience library={episode} /> : course ? <CourseExperience course={episode} /> : <EpisodeExperience episode={episode} />}
            <div className="vc-tile-close-row">
              <span>{design ? 'Design it before you build it.' : reference ? 'Your official sources, in one place.' : 'Your course materials, in one place.'}</span>
              <button type="button" onClick={close}>
                <ChevronUp size={16} />
                {`Close ${openLabel}`}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
