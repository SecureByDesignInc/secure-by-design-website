'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  ChevronUp,
  ClipboardCheck,
  Clock,
  FileText,
  Link2,
  Network,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from 'lucide-react';
import EpisodeExperience from './episode-experience';
import CourseExperience from './course-experience';
import LibraryExperience from './library-experience';
import CatalogSequenceGrid from './catalog-sequence';
import type { CatalogEntry, Library } from './catalog-types';
import atoTemplates from '../../content/ato-templates.json';
import {
  filterEpisodes,
  getCatalogEntries,
  groupCatalogEntries,
  getCatalogTopics,
  getYouTubeEmbedUrl,
  isReferenceLibrary,
  isTrainingCourse,
  libraryFor,
  supportsIdentityScene,
  type LibraryEdition,
} from './video-utils';

const ART_SERIES: Record<string, string> = {
  'network-authorization': 'FROM BUILD TO AUTHORIZATION',
  'templates-references': 'TEMPLATES & REFERENCES',
};

// Large enough that both paths (1.1–1.19 and 2.1–2.3) show without "Show more".
const PAGE_SIZE = 24;

function EpisodeTile({
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
  // Coming-soon tiles hold their place in the path but have no material yet: no cover, no download, no opening.
  const comingSoon = course && episode.kind === 'coming-soon';
  const available = !course && !reference && Boolean(getYouTubeEmbedUrl(episode.youtubeId));
  const series = ART_SERIES[episode.categoryId ?? ''] ?? 'THE NETWORK BUILD SERIES';
  // The ATO Template Library counts its official sources and the RMF steps they are arranged by.
  const sourceCount = atoTemplates.templates.length;
  const sectionCount = atoTemplates.groups.length;
  const openLabel = reference ? 'library' : 'training';
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
            <div className={`vc-course-art vc-art-${episode.id}${episode.training.cover ? ' vc-course-art-book' : ''}`}>{(episode.artLabels ?? ['Risk Management Framework', 'Body of Evidence', 'Authorization to Operate']).map(label => <span key={label}>{label.replace(/ ([+→]) /g, ' $1 ')}</span>)}</div>
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
              {reference ? 'TEMPLATE LIBRARY' : comingSoon ? 'IN PREPARATION' : course ? (episode.kind === 'configuration' ? 'CONFIGURATION GUIDE' : 'AUTHORIZATION TRAINING') : supportsIdentityScene(episode)
                ? 'INTERACTIVE 3D BUILD'
                : 'EXPLORE THE BUILD'}
            </span>
            <span>{reference ? `${sourceCount} SOURCES` : comingSoon ? 'COMING SOON' : course ? `${episode.lessonCount ?? episode.moduleCount} LESSONS` : `${episode.chapters.length} LESSONS`}</span>
          </div>
        </div>
        <div className="vc-tile-body">
          <div className="vc-tile-description">
            <p className="vc-kicker">
              {episode.categoryOrder === 1 && !reference && <span className="vc-start-here">START HERE</span>}
              {reference ? 'REFERENCE LIBRARY' : `COURSE ${episode.number}`}
              {/* Compact tiles hide the topic visually so the kicker fits one line; it stays in the DOM and shows when expanded. */}
              <span className="vc-kicker-topic">{` / ${reference ? 'TEMPLATES' : episode.categoryId === 'network-authorization' ? 'NETWORK AUTHORIZATION' : episode.tags[0]}`}</span>
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
            {reference ? <div className="vc-tile-status">
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
              {reference ? <>Reference library<span>·</span>Official links</> : <>Interactive guide<span>·</span>One download</>}
            </p>
          </div>}
        </div>
      </div>
      <div id={`episode-content-${episode.id}`} hidden={!expanded}>
        {expanded && (
          <>
            {reference ? <LibraryExperience library={episode} /> : course ? <CourseExperience course={episode} /> : <EpisodeExperience episode={episode} />}
            <div className="vc-tile-close-row">
              <span>{reference ? 'Your official sources, in one place.' : 'Your course materials, in one place.'}</span>
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

// The two libraries' headings (owner direction, 15 October 2026): Build Studio (technical training) and Authorization
// Studio (GRC & RMF training). The kicker names the kind of training so visitors know the studio is training. Both use this page and the same tiles.
const EDITIONS: Record<LibraryEdition, { kicker: string; title: string; em: string; copy: string; heading: string; choose: string }> = {
  technical: {
    kicker: 'BUILD STUDIO · TECHNICAL TRAINING',
    title: 'Build your skills.',
    em: 'Understand the why.',
    copy: 'Explore practical training, interactive guides, and resources that help you build your skills. Choose a topic and follow your own learning path.',
    heading: 'TECHNICAL TRAINING',
    choose: 'Choose your next course.',
  },
  grc: {
    kicker: 'AUTHORIZATION STUDIO · GRC & RMF TRAINING',
    title: 'Take a system to an ATO.',
    em: 'One RMF step at a time.',
    copy: 'Governance, risk and compliance training built on the Risk Management Framework: the RMF to ATO course, the ATO Package Builder where you do each step, and the ATO Template Library with the documents each step uses.',
    heading: 'GRC & RMF TRAINING',
    choose: 'Start the course.',
  },
};

export default function VideoHub({ library: fullLibrary, edition = 'technical' }: { library: Library; edition?: LibraryEdition }) {
  const library = libraryFor(fullLibrary, edition);
  const text = EDITIONS[edition];
  const grc = edition === 'grc';
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInput = useRef<HTMLInputElement>(null);
  const nextFocus = useRef<string | null>(null);
  useEffect(() => {
    if (nextFocus.current) {
      document.getElementById(`episode-open-${nextFocus.current}`)?.focus();
      nextFocus.current = null;
    }
  }, [visibleCount]);
  const catalog = getCatalogEntries(library);
  const topics = getCatalogTopics(catalog);
  const matches = filterEpisodes(catalog, query, topic).filter(entry => !category || entry.categoryId === category);
  const visible = matches.slice(0, visibleCount);
  const groups = groupCatalogEntries(visible, library);
  // Reference groups (Templates & References) sit outside the learning paths and the course count.
  const referenceGroups = new Set((library.categories ?? []).filter(item => item.kind === 'reference').map(item => item.id));
  const paths = (library.categories ?? []).filter(item => !referenceGroups.has(item.id));
  const referenceCount = catalog.filter(isReferenceLibrary).length;
  const courseCount = catalog.length - referenceCount;
  const noun = matches.every(entry => !isReferenceLibrary(entry)) ? `course${matches.length === 1 ? '' : 's'}` : `item${matches.length === 1 ? '' : 's'}`;
  const filtered = Boolean(query.trim() || topic || category);
  const reset = () => {
    setQuery('');
    setTopic('');
    setCategory('');
    setVisibleCount(PAGE_SIZE);
    setExpandedId(null);
    searchInput.current?.focus();
  };

  return (
    <main id="main" className="vc-page">
      <section className="container vc-intro">
        <div>
          <p className="vc-kicker">{text.kicker}</p>
          <h1>
            {text.title}
            <br />
            <em>{text.em}</em>
          </h1>
        </div>
        <div className="vc-intro-copy">
          <p>{text.copy}</p>
          <a href="#episode-library">
            {grc ? 'Open the course and tools' : 'Explore the catalog'} <ArrowDown size={16} />
          </a>
        </div>
      </section>
      <section
        id="episode-library"
        className="container vc-library"
        aria-labelledby="episode-library-title"
      >
        <div className="vc-library-heading">
          <div>
            <p className="vc-kicker">{text.heading}</p>
            <h2 id="episode-library-title">{text.choose}</h2>
          </div>
          <span>
            {grc ? `${courseCount} course · 2 tools` : `${paths.length} learning path${paths.length === 1 ? '' : 's'} · ${courseCount} course${courseCount === 1 ? '' : 's'}`}
            {referenceCount > 0 && ` · ${referenceCount} template librar${referenceCount === 1 ? 'y' : 'ies'}`}
          </span>
        </div>
        {!grc && <>
        <div className="vc-category-filters" role="group" aria-label="Training category">
          {[{ id: '', title: 'All training' }, ...(library.categories ?? [])].map(item => <button
            type="button" key={item.id} aria-pressed={category === item.id}
            onClick={() => { setCategory(item.id); setVisibleCount(PAGE_SIZE); setExpandedId(null); }}
          >{item.title}<span>{item.id ? catalog.filter(entry => entry.categoryId === item.id).length : catalog.length}</span></button>)}
        </div>
        <search className="vc-catalog-toolbar" aria-label="Find training materials">
          <div className="vc-catalog-search">
            <Search size={18} aria-hidden="true" />
            <label className="vc-sr-only" htmlFor="episode-search">
              Search training materials
            </label>
            <input
              ref={searchInput}
              id="episode-search"
              type="search"
              value={query}
              placeholder="Search a topic, system, or course…"
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
                setExpandedId(null);
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('');
                  setVisibleCount(PAGE_SIZE);
                  setExpandedId(null);
                  searchInput.current?.focus();
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="vc-catalog-filter">
            <SlidersHorizontal size={16} aria-hidden="true" />
            <label className="vc-sr-only" htmlFor="episode-topic">
              Filter by topic
            </label>
            <select
              id="episode-topic"
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                setVisibleCount(PAGE_SIZE);
                setExpandedId(null);
              }}
            >
              <option value="">All topics</option>
              {topics.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </search>
        <div className="vc-catalog-result-row">
          <output aria-live="polite">
            {matches.length === 0
              ? 'No training materials found'
              : `Showing ${visible.length} of ${matches.length} ${noun}`}
            {topic && ` · ${topic}`}
          </output>
          {filtered && (
            <button type="button" onClick={reset}>
              Clear filters <X size={13} />
            </button>
          )}
        </div>
        </>}
        {groups.map((group, groupIndex) => <section className="vc-category-group" key={group.id} aria-labelledby={`category-${group.id}`}>
          {groupIndex > 0 && (referenceGroups.has(group.id) ? <p className="vc-path-next">
            <FileText size={15} aria-hidden="true" />
            <span>Keep these beside you on any course</span>
          </p> : <p className="vc-path-next">
            <ArrowDown size={15} aria-hidden="true" />
            <span>Then continue to {group.title}</span>
          </p>)}
          <div className="vc-category-heading"><div><h3 id={`category-${group.id}`}>{group.title}</h3><p>{group.description}{group.entries.length > 1 && !referenceGroups.has(group.id) && <span className="vc-sr-only"> Take these courses in order.</span>}</p></div><span>{referenceGroups.has(group.id)
            ? `${group.entries.length} ${group.entries.length === 1 ? 'library' : 'libraries'}`
            : `${group.entries.length} course${group.entries.length === 1 ? '' : 's'}`}</span></div>
          <CatalogSequenceGrid>
          {group.entries.map((episode) => (
            <EpisodeTile
              key={episode.id}
              episode={episode}
              expanded={expandedId === episode.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === episode.id ? null : episode.id,
                )
              }
            />
          ))}
          </CatalogSequenceGrid>
        </section>)}
        {matches.length === 0 && (
          <div className="vc-catalog-empty">
            <Search size={28} />
            <h3>
              {library.episodes.length
                ? 'Try another topic or system.'
                : 'Your next build is on its way.'}
            </h3>
            <p>
              {library.episodes.length
                ? 'Search by a name like DC01, or clear your filters to see the full catalog.'
                : 'Walkthroughs and their companion training materials will appear here.'}
            </p>
            {filtered && (
              <button type="button" onClick={reset}>
                Show all materials <BookOpen size={16} />
              </button>
            )}
          </div>
        )}
        {visible.length < matches.length && (
          <div className="vc-catalog-more">
            <button
              type="button"
              onClick={() => {
                nextFocus.current = matches[visibleCount]?.id ?? null;
                setVisibleCount((count) => count + PAGE_SIZE);
              }}
            >
              Show more materials <BookOpen size={16} />
            </button>
            <span>{matches.length - visible.length} more to explore</span>
          </div>
        )}
        {grc && <section className="vc-category-group vc-grc-tools" aria-labelledby="grc-tools-title">
          <p className="vc-path-next">
            <ArrowDown size={15} aria-hidden="true" />
            <span>Do each step and use its templates</span>
          </p>
          <div className="vc-category-heading"><div><h3 id="grc-tools-title">Course tools</h3><p>Every step of the course links to both: the ATO Package Builder for the practice task, and the ATO Template Library for the documents it produces.</p></div><span>2 tools</span></div>
          <ul className="vc-tool-list">
            <li>
              <ClipboardCheck size={26} strokeWidth={1.4} aria-hidden="true" />
              <div>
                <p className="vc-kicker">PRACTICE TOOL</p>
                <h4>ATO Package Builder</h4>
                <p>Register the Secure By Design enclave and take it through every RMF step: system record and categorization, controls and evidence, assessment, the POA&amp;M, the package and the AO&apos;s decision, then continuous monitoring. Saved privately to your account.</p>
              </div>
              <Link href="/grc-rmf-training/workspace">Open the package builder <ArrowRight size={16} /></Link>
            </li>
            <li>
              <FileText size={26} strokeWidth={1.4} aria-hidden="true" />
              <div>
                <p className="vc-kicker">REFERENCE LIBRARY</p>
                <h4>ATO Template Library</h4>
                <p>{atoTemplates.templates.length} official sources verified as publicly released, arranged by RMF step and linked to each publisher&apos;s copy, with {atoTemplates.samples.length} Secure By Design training samples for the documents that have no public DoD or JSIG version.</p>
              </div>
              <Link href="/grc-rmf-training/templates">Open the library <ArrowRight size={16} /></Link>
            </li>
          </ul>
        </section>}
        <div className="vc-library-footer">
          {grc ? <>
            <p>
              <Network size={20} />
              Authorize the network you built.
            </p>
            <Link href="/technical-training">
              Build it first in the Build Studio <ArrowRight size={17} />
            </Link>
          </> : <>
            <p>
              <Network size={20} />
              Every build is part of a bigger network.
            </p>
            <Link href="/inside-the-network">
              Step inside the complete network <ArrowRight size={17} />
            </Link>
          </>}
        </div>
      </section>
    </main>
  );
}
