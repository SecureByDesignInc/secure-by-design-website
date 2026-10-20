'use client';

// The Training Hub (owner direction, 19 October 2026): the training from the Configuration Hub and the Compliance Hub
// in one library, modeled on the owner's reference: a sidebar library, a greeting with search, a featured course and
// rows of tiles with "View all". Every network-build topic or server keeps its own tile; a tile opens the same expanded
// tile as before (episode-tile.tsx), beneath the row it came from, one at a time. The ATO Package Builder is its own
// section, the ATO Package Builder Hub (/grc-rmf-training).
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, ChartNoAxesColumn, ClipboardCheck, Clock, House, Network, Search, X } from 'lucide-react';
import EpisodeTile from './episode-tile';
import { FeatureArt, TileArt } from './hub-art';
import type { CatalogEntry, Library, TrainingCourse } from './catalog-types';
import {
  filterEpisodes,
  getArtFamily,
  getCatalogEntries,
  getHubGroups,
  getRecentlyUpdated,
  getYouTubeEmbedUrl,
  isReferenceLibrary,
  isTrainingCourse,
  type HubGroup,
} from './video-utils';
import { useReaderProgress } from '../reader-progress';
import trainingProgress from '../../content/training-progress.json';

type Open = { id: string; place: string } | null;
type Shelf = { id: string; title: string; entries: CatalogEntry[]; view?: string; viewLabel?: string; meta?: (entry: CatalogEntry) => string; tool?: boolean };

const BUILDER_HUB = '/grc-rmf-training';
// Each course's saved progress IDs (training:<course>:<lesson or module>).
const LESSONS = trainingProgress.reduce<Record<string, string[]>>((all, item) => {
  const course = item.id.split(':')[1];
  (all[course] ??= []).push(item.id);
  return all;
}, {});

const comingSoon = (entry: CatalogEntry) => (entry as { kind?: string }).kind === 'coming-soon';
const isRmf = (entry: CatalogEntry) => isTrainingCourse(entry) && entry.kind === 'authorization';
const videoLabel = (entry: CatalogEntry) => !isReferenceLibrary(entry) && !isTrainingCourse(entry) && getYouTubeEmbedUrl(entry.youtubeId) ? 'Video available' : 'Video coming soon';

function entryMeta(entry: CatalogEntry): string {
  if (isReferenceLibrary(entry)) {
    const stats = (entry as { stats?: { areas: number; sources: number } }).stats;
    if (stats) return `${stats.areas ? `${stats.areas} design areas · ` : ''}${stats.sources} sources · government & vendor guidelines`;
    return 'Official sources · Training samples';
  }
  if (comingSoon(entry)) return 'Training materials in preparation';
  if (isTrainingCourse(entry)) {
    const course = entry as TrainingCourse;
    const size = isRmf(course) ? `${course.moduleCount} modules · ${course.lessonCount ?? course.moduleCount} lessons` : `${course.lessonCount ?? course.moduleCount} lessons`;
    return `${size} · ${course.estimatedHours} h · ${videoLabel(entry)}`;
  }
  return `${entry.chapters.length} lessons · Self-paced · ${videoLabel(entry)}`;
}
const chipFor = (entry: CatalogEntry) => isReferenceLibrary(entry) ? ((entry as { kind?: string }).kind === 'design-reference' ? `DESIGN REFERENCE · ${(entry.topic ?? '').toUpperCase()}` : 'REFERENCE LIBRARY') : `COURSE ${entry.number} · ${(entry.topic ?? entry.tags[0] ?? '').toUpperCase()}`;
const openLabel = (entry: CatalogEntry) => isReferenceLibrary(entry) ? 'the library' : `course ${entry.number}`;

function HubTile({ entry, family, meta, place, active, onOpen }: { entry: CatalogEntry; family: string; meta: string; place: string; active: boolean; onOpen: () => void }) {
  const soon = comingSoon(entry);
  return (
    <article className={`th-tile th-art-${family}${soon ? ' th-tile-soon' : ''}${active ? ' th-tile-active' : ''}`} data-hub-tile={entry.id} aria-labelledby={`th-${place}-${entry.id}`}>
      <div className="th-thumb">
        <TileArt family={family} />
        {!isReferenceLibrary(entry) && <span className="th-tile-num" aria-hidden="true">{entry.number}</span>}
        <span className="th-chip">{chipFor(entry)}</span>
        {soon && <span className="th-soon"><Clock size={11} aria-hidden="true" />Coming soon</span>}
        <h3 id={`th-${place}-${entry.id}`} className="th-tile-title">{entry.title}</h3>
      </div>
      <p className="th-tile-meta">{meta}</p>
      {!soon && <button
        id={`th-open-${place}-${entry.id}`}
        type="button"
        className="th-tile-open"
        aria-expanded={active}
        aria-controls={active ? `th-panel-${place}` : undefined}
        aria-label={`${active ? 'Close' : 'Open'} ${openLabel(entry)}: ${entry.title}`}
        onClick={onOpen}
      />}
    </article>
  );
}

export default function TrainingHub({ library }: { library: Library }) {
  const entries = useMemo(() => getCatalogEntries(library), [library]);
  const groups = useMemo(() => getHubGroups(library), [library]);
  const byId = useMemo(() => new Map(entries.map(entry => [entry.id, entry])), [entries]);
  const family = useCallback((entry: CatalogEntry) => getArtFamily(entry, library), [library]);
  const { data } = useReaderProgress();
  const [view, setView] = useState('hub');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Open>(null);
  const [feature, setFeature] = useState(0);
  const [greeting, setGreeting] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const lastOpener = useRef<string | null>(null);

  // Views have addresses: #<group> for a library group and #course/<id> for an open tile. The old #episode-library
  // anchor (and anything unknown) opens the Hub.
  const readHash = useCallback(() => {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    const course = /^course\/(.+)$/.exec(hash)?.[1];
    if (course && byId.has(course)) {
      const entry = byId.get(course)!;
      setView(entry.categoryId ?? 'hub');
      setOpen(comingSoon(entry) ? null : { id: course, place: 'grid' });
    } else if (groups.some(group => group.id === hash)) {
      setView(hash);
      setOpen(null);
    } else {
      setView('hub');
      setOpen(null);
    }
    setQuery('');
  }, [byId, groups]);
  useEffect(() => {
    readHash();
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.');
    window.addEventListener('popstate', readHash);
    return () => window.removeEventListener('popstate', readHash);
  }, [readHash]);
  // Bring an opened tile into view.
  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }));
  }, [open]);

  const go = (next: string) => {
    setView(next);
    setOpen(null);
    setQuery('');
    history.pushState(null, '', next === 'hub' ? location.pathname : `#${next}`);
    window.scrollTo({ top: Math.min(window.scrollY, document.getElementById('training-hub')?.offsetTop ?? 0) });
  };
  const toggle = (id: string, place: string) => {
    if (open?.id === id && open.place === place) return close();
    lastOpener.current = `th-open-${place}-${id}`;
    setOpen({ id, place });
  };
  function close() {
    setOpen(null);
    const opener = lastOpener.current;
    requestAnimationFrame(() => opener && document.getElementById(opener)?.focus());
  }

  // Signed-in learners: courses in progress, and the next course on the path.
  const records = useMemo(() => data?.records ?? [], [data]);
  const signedIn = Boolean(data?.user);
  const progressOf = useCallback((entry: CatalogEntry) => {
    const ids = LESSONS[entry.id] ?? [];
    const mine = records.filter(record => ids.includes(record.id));
    return { total: ids.length, done: mine.filter(record => record.status === 'completed').length, last: Math.max(0, ...mine.map(record => Date.parse(record.updatedAt) || 0)), started: mine.length > 0 };
  }, [records]);
  const inProgress = useMemo(() => entries
    .map(entry => ({ entry, progress: progressOf(entry) }))
    .filter(item => item.progress.started && item.progress.done < item.progress.total)
    .sort((a, b) => b.progress.last - a.progress.last)
    .map(item => item.entry), [entries, progressOf]);
  const upNext = signedIn ? inProgress[0] ?? entries.find(entry => !isReferenceLibrary(entry) && !comingSoon(entry) && progressOf(entry).done < progressOf(entry).total) : undefined;

  // The featured courses: where to start (or continue), the most recently updated build course, and course 2.1.
  const features = useMemo(() => {
    const start = upNext ?? byId.get('identity-foundation') ?? entries[0];
    const list: { entry: CatalogEntry; kicker: string; primary: string }[] = [
      { entry: start, kicker: upNext ? 'UP NEXT FOR YOU' : 'START HERE', primary: upNext && progressOf(upNext).started ? 'Continue the course' : 'Open the course' },
    ];
    const updated = getRecentlyUpdated(library, 8).find(entry => entry.categoryId === 'network-build' && entry.id !== start.id);
    if (updated) list.push({ entry: updated, kicker: `UPDATED ${(updated.training.updated ?? '').toUpperCase()}`, primary: 'Open the course' });
    const rmf = entries.find(isRmf);
    if (rmf && !list.some(item => item.entry.id === rmf.id)) list.push({ entry: rmf, kicker: 'AUTHORIZE THE NETWORK', primary: 'Open the course' });
    return list;
  }, [byId, entries, library, upNext, progressOf]);
  const current = features[Math.min(feature, features.length - 1)];
  const currentFamily = family(current.entry);

  const group = (id: string) => groups.find(item => item.id === id);
  const shelves: Shelf[] = [];
  if (signedIn && inProgress.length) shelves.push({ id: 'continue', title: 'Continue where you left off', entries: inProgress.slice(0, 4), meta: entry => { const progress = progressOf(entry); return `${progress.done} of ${progress.total} ${isRmf(entry) ? 'modules' : 'lessons'} complete`; } });
  shelves.push({ id: 'recent', title: 'Recently updated', entries: getRecentlyUpdated(library, 4), meta: entry => `Updated ${entry.training.updated}` });
  const build = group('network-build');
  if (build) shelves.push({ id: 'path', title: 'The network build, in order', entries: build.entries.slice(0, 4), view: build.id, viewLabel: `View all ${build.entries.length}` });
  const logging = group('logging');
  if (logging) shelves.push({ id: 'logging', title: logging.title, entries: logging.entries, view: logging.id, viewLabel: 'View all' });
  const authorize = [...(group('network-authorization')?.entries ?? []), ...(group('templates-references')?.entries ?? [])];
  if (authorize.length) shelves.push({ id: 'authorize', title: 'Authorize the network', entries: authorize, view: 'network-authorization', viewLabel: 'View all', tool: true });
  const designs = group('design-references');
  if (designs?.entries.length) shelves.push({ id: 'design', title: designs.title, entries: designs.entries.slice(0, 4), view: designs.id, viewLabel: `View all ${designs.entries.length}` });
  const soon = entries.filter(comingSoon);
  if (soon.length) shelves.push({ id: 'soon', title: 'Coming soon', entries: soon });

  const searching = query.trim().length > 0;
  const results = searching ? filterEpisodes(entries, query, '') : [];
  const selected = !searching && view !== 'hub' ? group(view) : undefined;
  const groupFamily = (item: HubGroup) => item.parent ? item.id : item.id === 'network-authorization' ? 'authorize' : item.id === 'templates-references' || item.id === 'design-references' ? 'reference' : 'build';

  const opened = (entry: CatalogEntry, place: string) => open?.id === entry.id && open.place === place;
  const expanded = (entry: CatalogEntry, place: string) => opened(entry, place) && (
    <div className="th-open" id={`th-panel-${place}`} ref={panel} key={`${entry.id}-open`}>
      <EpisodeTile episode={entry} expanded onToggle={close} />
    </div>
  );
  const tiles = (list: CatalogEntry[], place: string, meta?: (entry: CatalogEntry) => string) => list.map(entry => (
    <Fragment key={entry.id}>
      <HubTile entry={entry} family={family(entry)} meta={meta ? meta(entry) : entryMeta(entry)} place={place} active={opened(entry, place)} onOpen={() => toggle(entry.id, place)} />
      {expanded(entry, place)}
    </Fragment>
  ));
  const toolCard = (
    <Link className="th-tool-card" href={BUILDER_HUB} key="builder-hub">
      <span className="th-tool-kicker">PRACTICE TOOL</span>
      <span><strong>ATO Package Builder Hub</strong><span>Do each RMF step on the network you built.</span></span>
      <span className="th-tool-go">Open the hub <ArrowRight size={14} aria-hidden="true" /></span>
    </Link>
  );
  const countLabel = (item: HubGroup) => {
    const later = item.entries.filter(comingSoon).length;
    if (item.id === 'templates-references') return `${item.entries.length} ${item.entries.length === 1 ? 'library' : 'libraries'}`;
    if (item.id === 'design-references') return `${item.entries.length} design references`;
    const courses = `${item.entries.length} course${item.entries.length === 1 ? '' : 's'}`;
    return item.id === 'network-build' ? `${courses} · take them in order` : later ? `${courses} · ${later} coming soon` : item.parent ? `${courses} · in course order` : courses;
  };
  const numberOf = (entry?: CatalogEntry) => entry && 'number' in entry ? entry.number : '';
  const kickerFor = (item: HubGroup) => item.parent ? `${group(item.parent)?.title ?? ''} · Topic` : item.id === 'templates-references' || item.id === 'design-references' ? 'Reference' : `Learning path · ${item.entries.length > 1 ? `Courses ${numberOf(item.entries[0])}–${numberOf(item.entries[item.entries.length - 1])}` : `Course ${numberOf(item.entries[0])}`}`;

  return (
    <main id="main" className="vc-page th-page">
      <div className="container th-layout" id="training-hub" data-hub-entries={entries.length}>
        <aside className="th-sidebar" aria-label="Training Hub library">
          <p className="th-side-brand"><BookOpen size={20} aria-hidden="true" />Training Hub</p>
          <nav aria-label="Library">
            <ul className="th-side-list">
              <li><button type="button" className="th-side-link" aria-current={view === 'hub' && !searching ? 'page' : undefined} onClick={() => go('hub')}><House size={16} aria-hidden="true" /><span>Hub</span></button></li>
              <li className="th-side-label" aria-hidden="true">Library</li>
              {groups.map(item => <li key={item.id}>
                <button type="button" className={`th-side-link th-art-${groupFamily(item)}${item.parent ? ' th-side-sub' : ''}`} aria-current={selected?.id === item.id ? 'page' : undefined} onClick={() => go(item.id)}>
                  <span className="th-dot" aria-hidden="true" /><span>{item.title}</span><span className="th-count" aria-label={`${item.entries.length} items`}>{item.entries.length}</span>
                </button>
              </li>)}
            </ul>
          </nav>
          <div className="th-side-extra">
            <p className="th-side-label">Tools</p>
            <Link className="th-side-link" href={BUILDER_HUB}><ClipboardCheck size={16} aria-hidden="true" /><span>ATO Package Builder Hub</span></Link>
            <Link className="th-side-link" href="/inside-the-network"><Network size={16} aria-hidden="true" /><span>System Hub</span></Link>
            <p className="th-side-label">Your account</p>
            <Link className="th-side-link" href="/my-progress#saved-materials"><Bookmark size={16} aria-hidden="true" /><span>Saved materials</span></Link>
            <Link className="th-side-link" href="/my-progress"><ChartNoAxesColumn size={16} aria-hidden="true" /><span>My progress</span></Link>
          </div>
        </aside>

        <div className="th-content">
          <header className="th-top">
            <div>
              <h1>{greeting ?? 'Welcome.'}</h1>
              <p>{signedIn ? 'Welcome back. Here’s what’s new in your library.' : 'Welcome to the Training Hub: every course to build the network and take it to an Authorization to Operate, in one library.'}</p>
              {data && !signedIn && <p className="th-join"><Link href="/my-progress">Create a free Community account</Link> to keep your progress and saved materials.</p>}
            </div>
            <div className="th-tools">
              <search className="th-search">
                <Search size={18} aria-hidden="true" />
                <label className="vc-sr-only" htmlFor="th-search">Search the Training Hub</label>
                <input id="th-search" type="search" value={query} placeholder="Search a course, system or topic" onChange={event => { setQuery(event.target.value); setOpen(null); }} />
                {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}
              </search>
              <Link className="th-saved" href="/my-progress#saved-materials"><Bookmark size={15} aria-hidden="true" /><span className="th-saved-label">Saved</span></Link>
            </div>
          </header>

          {searching ? <section className="th-section" aria-labelledby="th-results-title">
            <h2 id="th-results-title" className="th-shelf-title" aria-live="polite">{results.length} {results.length === 1 ? 'result' : 'results'} for “{query.trim()}”</h2>
            {results.length ? <div className="th-grid">{tiles(results, 'results')}</div> : <div className="th-empty">
              <p>Try another topic or system.</p>
              <span>Search by a name like SBD-DC01, or clear the search to see the full library.</span>
            </div>}
          </section> : selected ? <section className="th-section" aria-labelledby="th-group-title">
            <button type="button" className="th-back" onClick={() => go('hub')}><ArrowLeft size={16} aria-hidden="true" />Back to the Hub</button>
            <div className={`th-group-head th-art-${groupFamily(selected)}`}>
              <div>
                <p className="vc-kicker">{kickerFor(selected)}</p>
                <h2 id="th-group-title">{selected.title}</h2>
                <p>{selected.description}</p>
              </div>
              <span>{countLabel(selected)}</span>
            </div>
            <div className="th-grid">
              {tiles(selected.entries, 'grid')}
              {selected.id === 'network-authorization' && toolCard}
            </div>
          </section> : <>
            <section className={`th-feature th-art-${currentFamily}`} aria-roledescription="carousel" aria-label="Featured courses">
              <div className="th-feature-body" aria-live="polite">
                <div className="th-feature-copy">
                  <p className="th-feature-kicker">{current.kicker}</p>
                  <h2>{current.entry.title}</h2>
                  <p>{current.entry.outcomeSummary}</p>
                  <p className="th-feature-meta">{isReferenceLibrary(current.entry) ? '' : `Course ${current.entry.number} · `}{entryMeta(current.entry)}</p>
                  <div className="th-feature-actions">
                    <button id={`th-open-featured-${current.entry.id}`} type="button" className="th-primary" aria-expanded={opened(current.entry, 'featured')} onClick={() => toggle(current.entry.id, 'featured')}>
                      {opened(current.entry, 'featured') ? 'Close the course' : current.primary}
                    </button>
                    {isRmf(current.entry)
                      ? <Link className="th-secondary" href={BUILDER_HUB}>Open the ATO Package Builder Hub</Link>
                      : <a className="th-secondary" href={current.entry.training.guide}>Open the interactive guide</a>}
                  </div>
                </div>
                <div className="th-feature-art">
                  <FeatureArt entry={current.entry} family={currentFamily} />
                  <span className="th-feature-chip">{isRmf(current.entry) ? 'COURSE PAGE · ATO PACKAGE BUILDER' : videoLabel(current.entry).toUpperCase()}</span>
                </div>
              </div>
              {features.length > 1 && <div className="th-dots" role="group" aria-label="Choose a featured course">
                {features.map((item, index) => <button
                  key={item.entry.id}
                  type="button"
                  aria-pressed={index === feature}
                  aria-label={`Featured course ${index + 1} of ${features.length}: ${item.entry.title}`}
                  onClick={() => { setFeature(index); if (open?.place === 'featured') setOpen(null); }}
                />)}
              </div>}
            </section>
            {expanded(current.entry, 'featured')}

            {shelves.map(shelf => <section className="th-shelf" key={shelf.id} aria-labelledby={`th-shelf-${shelf.id}`}>
              <div className="th-shelf-head">
                <h2 id={`th-shelf-${shelf.id}`} className="th-shelf-title">{shelf.title}</h2>
                {shelf.view && <button type="button" className="th-view-all" onClick={() => go(shelf.view!)}>{shelf.viewLabel}<ArrowRight size={14} aria-hidden="true" /></button>}
              </div>
              <div className="th-grid">
                {tiles(shelf.entries, shelf.id, shelf.meta)}
                {shelf.tool && toolCard}
              </div>
            </section>)}
          </>}

          <section className="th-mobile-tools" aria-label="Tools">
            <Link href={BUILDER_HUB}><ClipboardCheck size={16} aria-hidden="true" />ATO Package Builder Hub</Link>
            <Link href="/inside-the-network"><Network size={16} aria-hidden="true" />System Hub</Link>
          </section>
          <div className="th-footer">
            <p><Network size={20} aria-hidden="true" />Every build is part of a bigger network.</p>
            <Link href="/inside-the-network">Step inside the complete network in the System Hub <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </main>
  );
}
