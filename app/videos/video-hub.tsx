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
  Network,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from 'lucide-react';
import EpisodeExperience from './episode-experience';
import CourseExperience from './course-experience';
import type { CatalogEntry, Library } from './catalog-types';
import {
  filterEpisodes,
  getCatalogEntries,
  groupCatalogEntries,
  getCatalogTopics,
  getYouTubeEmbedUrl,
  isTrainingCourse,
  supportsIdentityScene,
} from './video-utils';

// Large enough that both paths (1.1–1.10 and 2.1–2.3) show without "Show more".
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
  const available = !course && Boolean(getYouTubeEmbedUrl(episode.youtubeId));
  const close = () => {
    onToggle();
    opener.current?.focus();
  };

  return (
    <article
      className={`vc-catalog-tile ${expanded ? 'vc-tile-expanded' : ''}`}
      aria-labelledby={`tile-title-${episode.id}`}
    >
      <div className="vc-tile-overview">
        <div className="vc-tile-art" aria-hidden="true">
          <div className="vc-tile-art-top">
            <span>{episode.categoryId === 'network-authorization' ? 'FROM BUILD TO AUTHORIZATION' : 'THE NETWORK BUILD SERIES'}</span>
            <b>{episode.number}</b>
          </div>
          {course ? <>
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
              {course ? <BookOpen size={13} /> : <Network size={13} />}
              {course ? (episode.kind === 'configuration' ? 'CONFIGURATION GUIDE' : 'AUTHORIZATION TRAINING') : supportsIdentityScene(episode)
                ? 'INTERACTIVE 3D BUILD'
                : 'EXPLORE THE BUILD'}
            </span>
            <span>{course ? `${episode.lessonCount ?? episode.moduleCount} LESSONS` : `${episode.chapters.length} LESSONS`}</span>
          </div>
        </div>
        <div className="vc-tile-body">
          <div className="vc-tile-description">
            <p className="vc-kicker">
              {episode.categoryOrder === 1 && <span className="vc-start-here">START HERE</span>}
              {`COURSE ${episode.number}`}
              {/* Compact tiles hide the topic visually so the kicker fits one line; it stays in the DOM and shows when expanded. */}
              <span className="vc-kicker-topic">{` / ${episode.categoryId === 'network-authorization' ? 'NETWORK AUTHORIZATION' : episode.tags[0]}`}</span>
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
          <div className="vc-tile-actions">
            <div className="vc-tile-status">
              <span>
                <Check size={13} />
                Written training available
              </span>
              {course ? <span className="vc-tile-course-size"><BookOpen size={13} />{episode.lessonCount ?? episode.moduleCount} lessons · {episode.estimatedHours}h</span> : <span className="vc-tile-course-size"><BookOpen size={13} />{episode.chapters.length} lessons · Self-paced</span>}
              <span>
                <Video size={13} />
                {available ? 'Video available' : 'Video coming soon'}
              </span>
            </div>
            <button
              ref={opener}
              id={`episode-open-${episode.id}`}
              type="button"
              className="vc-tile-open"
              aria-expanded={expanded}
              aria-controls={`episode-content-${episode.id}`}
              aria-label={`${expanded ? 'Close training' : 'Open training'}: ${episode.title}`}
              onClick={onToggle}
            >
              <span>{expanded ? 'Close training' : 'Open training'}</span>
              {expanded ? <ChevronUp size={18} /> : <BookOpen size={18} />}
            </button>
            <p className="vc-tile-included">
              <BookOpen size={12} />
              Interactive guide<span>·</span>One download
            </p>
          </div>
        </div>
      </div>
      <div id={`episode-content-${episode.id}`} hidden={!expanded}>
        {expanded && (
          <>
            {course ? <CourseExperience course={episode} /> : <EpisodeExperience episode={episode} />}
            <div className="vc-tile-close-row">
              <span>Your course materials, in one place.</span>
              <button type="button" onClick={close}>
                <ChevronUp size={16} />
                Close training
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export default function VideoHub({ library }: { library: Library }) {
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
          <p className="vc-kicker">TRAINING LIBRARY</p>
          <h1>
            Build your skills.
            <br />
            <em>Understand the why.</em>
          </h1>
        </div>
        <div className="vc-intro-copy">
          <p>
            Explore practical training, interactive guides, and resources
            that help you build your skills. Choose a topic and follow
            your own learning path.
          </p>
          <a href="#episode-library">
            Explore the catalog <ArrowDown size={16} />
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
            <p className="vc-kicker">YOUR TRAINING LIBRARY</p>
            <h2 id="episode-library-title">Choose your next course.</h2>
          </div>
          <span>
            {(library.categories ?? []).length} learning paths · {catalog.length} course{catalog.length === 1 ? '' : 's'}
          </span>
        </div>
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
              : `Showing ${visible.length} of ${matches.length} course${matches.length === 1 ? '' : 's'}`}
            {topic && ` · ${topic}`}
          </output>
          {filtered && (
            <button type="button" onClick={reset}>
              Clear filters <X size={13} />
            </button>
          )}
        </div>
        {groups.map(group => <section className="vc-category-group" key={group.id} aria-labelledby={`category-${group.id}`}>
          <div className="vc-category-heading"><div><h3 id={`category-${group.id}`}>{group.title}</h3><p>{group.description}</p></div><span>{group.entries.length} course{group.entries.length === 1 ? '' : 's'}</span></div>
          <div className="vc-catalog-grid">
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
          </div>
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
        <div className="vc-library-footer">
          <p>
            <Network size={20} />
            Every build is part of a bigger network.
          </p>
          <Link href="/inside-the-network">
            Step inside the complete network <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
