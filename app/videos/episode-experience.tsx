'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Download,
  FileText,
  Maximize2,
  Move,
  Network,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Video,
} from 'lucide-react';
import type { CatalogScene } from './catalog-scene';
import { getYouTubeEmbedUrl, supportsIdentityScene } from './video-utils';

import type { Episode } from './catalog-types';
import TrainingShare from './training-share';

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (listener: () => void) => {
  const preference = matchMedia(motionQuery);
  preference.addEventListener('change', listener);
  return () => preference.removeEventListener('change', listener);
};
const getMotionPreference = () => matchMedia(motionQuery).matches;
const getServerMotionPreference = () => true;

export default function EpisodeExperience({ episode }: { episode: Episode }) {
  const [chapter, setChapter] = useState(
    Math.min(2, episode.chapters.length - 1),
  );
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionPreference,
    getServerMotionPreference,
  );
  const moving = motionOverride ?? !reducedMotion;
  const [tour, setTour] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const [resolver, setResolver] = useState<'dc1' | 'dc2'>('dc1');
  const [videoStart, setVideoStart] = useState<number | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CatalogScene | null>(null);
  const current = episode.chapters[chapter] ?? episode.chapters[0];
  const supportsScene = supportsIdentityScene(episode);

  useEffect(() => {
    if (!supportsScene) return;
    let cancelled = false;
    import('./catalog-scene')
      .then(({ createCatalogScene }) => {
        if (cancelled || !host.current) return;
        try {
          scene.current = createCatalogScene(
            host.current,
            (next) => {
              setChapter(next);
              setTour(false);
              setVideoStart(episode.chapters[next]?.timestamp ?? null);
            },
            () => setFallback(true),
          );
          setReady(true);
        } catch {
          setFallback(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [supportsScene, episode]);

  useEffect(() => {
    scene.current?.update(chapter, moving, resolver);
  }, [chapter, moving, resolver, ready]);
  useEffect(() => {
    if (!tour || !episode) return;
    const timer = setInterval(
      () => setChapter((value) => (value + 1) % episode.chapters.length),
      4200,
    );
    return () => clearInterval(timer);
  }, [tour, episode]);

  if (!current) return null;

  const selectChapter = (value: number) => {
    setChapter(value);
    setTour(false);
    setVideoStart(episode.chapters[value]?.timestamp ?? null);
  };
  const embedUrl = getYouTubeEmbedUrl(episode.youtubeId, videoStart);

  return (
    <div className="vc-experience">
      <section
        className="vc-episode"
        aria-labelledby={`episode-resources-${episode.id}`}
      >
        <header className="vc-episode-heading">
          <div>
            <p className="vc-kicker">YOUR COURSE COMPANION</p>
            <h4 id={`episode-resources-${episode.id}`}>
              Your training materials.
            </h4>
            <p>
              Start with the interactive guide or download the workbook and
              verification commands. Everything you need is included below.
            </p>
          </div>
          <a href={episode.training.package} download>
            <Download size={16} />
            Download all materials
          </a>
        </header>
        <div className="vc-episode-content">
          <aside
            className="vc-training"
            aria-labelledby={`training-${episode.id}`}
          >
            <div className="vc-training-top">
              <span className="vc-training-label">
                <BookOpen size={15} />
                YOUR TRAINING MATERIALS
              </span>
              <span className="vc-included-badge">
                <Share2 size={14} aria-hidden="true" />
                Learn it. Share it.
              </span>
            </div>
            <div className="vc-workbook-intro">
              <Image
                src={episode.training.cover}
                width={154}
                height={199}
                alt={`Secure By Design companion workbook for ${episode.title}`}
                loading="lazy"
                unoptimized
              />
              <div>
                <h5 id={`training-${episode.id}`}>
                  Keep the knowledge.
                  <br />
                  Build with confidence.
                </h5>
                <p>
                  {episode.training.pages} pages of explanations, configuration
                  steps, security reasoning, and evidence prompts.
                </p>
              </div>
            </div>
            <a className="vc-guide-link" href={episode.training.guide}>
              <span>
                <Network size={20} />
                <span>
                  <b>Open the interactive guide</b>
                  <small>3D network · chapter checks · your notes</small>
                </span>
              </span>
              <ArrowUpRight size={19} />
            </a>
            <div className="vc-download-list">
              <a href={episode.training.pdf} target="_blank" rel="noopener">
                <FileText size={19} />
                <span>
                  <b>Companion workbook</b>
                  <small>PDF · {episode.training.pages} pages</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
              <a href={episode.training.word} download>
                <FileText size={19} />
                <span>
                  <b>Editable workbook</b>
                  <small>Word document</small>
                </span>
                <Download size={16} />
              </a>
              <a href={episode.training.package} download>
                <Download size={19} />
                <span>
                  <b>The complete learning package</b>
                  <small>Guide, workbooks, and verification commands</small>
                </span>
                <ArrowDown size={16} />
              </a>
            </div>
            <TrainingShare />
            {(episode.training.materialsEdition ||
              episode.training.copyrightOwner ||
              episode.training.notices) && (
              <div className="vc-training-edition" aria-label="Edition and notices">
                {episode.training.materialsEdition && (
                  <p>
                    Course {episode.number} · Materials edition{' '}
                    {episode.training.materialsEdition}
                    {episode.training.updated && (
                      <> · Updated {episode.training.updated}</>
                    )}
                  </p>
                )}
                {episode.training.copyrightOwner && (
                  <p>
                    © {episode.training.copyrightYear}{' '}
                    {episode.training.copyrightOwner}.
                  </p>
                )}
                {episode.training.notices && (
                  <a href={episode.training.notices}>Notices and permissions</a>
                )}
              </div>
            )}
          </aside>
          <div className="vc-watch">
            <div className="vc-video-surface">
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  title={`${episode.title} — video walkthrough`}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="vc-recording-poster">
                  <div className="vc-poster-top">
                    <span>SECURE BY DESIGN</span>
                    <span>THE NETWORK BUILD SERIES</span>
                  </div>
                  <div className="vc-poster-systems" aria-hidden="true">
                    {supportsScene ? (
                      <>
                        <div className="vc-server-mini">
                          <i />
                          <i />
                          <i />
                          <i />
                        </div>
                        <span className="vc-poster-link" />
                        <div className="vc-server-mini">
                          <i />
                          <i />
                          <i />
                          <i />
                        </div>
                      </>
                    ) : (
                      <Network size={76} />
                    )}
                  </div>
                  <div className="vc-poster-bottom">
                    <div>
                      <span>{episode.tags[0]}</span>
                      <h5>{episode.systems.join(' + ')}</h5>
                      <p>{episode.tags.slice(1).join(' & ')}</p>
                    </div>
                    <span className="vc-coming">
                      <Video size={15} />
                      Video coming soon
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="vc-watch-note">
              <Video size={19} />
              <p>
                {embedUrl
                  ? 'Watch the course video here, with the training materials alongside you.'
                  : 'The recording is on its way. Start exploring with the interactive guide and companion workbook.'}
              </p>
            </div>
            <div className="vc-learning-outcomes">
              <span>WHAT YOU WILL BUILD</span>
              <p>{episode.outcomeSummary}</p>
              <div>
                {episode.outcomes.map((text) => (
                  <span key={text}>
                    <Check size={14} />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section
        className="vc-explorer"
        aria-labelledby={`build-explorer-${episode.id}`}
      >
        <div className="vc-explorer-heading">
          <div className="vc-stage-title">
            <Network size={21} />
            <div>
              <p className="vc-kicker">INTERACTIVE BUILD EXPLORER</p>
              <h4 id={`build-explorer-${episode.id}`}>{episode.subtitle}</h4>
            </div>
          </div>
          <div className="vc-scene-tools">
            {supportsScene && (
              <>
                <button
                  type="button"
                  aria-pressed={moving}
                  onClick={() => {
                    setMotionOverride(!moving);
                    setTour(false);
                  }}
                >
                  {moving ? <Pause size={14} /> : <Play size={14} />}
                  {moving ? 'Pause motion' : 'Play motion'}
                </button>
                <button
                  type="button"
                  onClick={() => scene.current?.reset()}
                  disabled={!ready || fallback}
                >
                  <RotateCcw size={14} />
                  Reset view
                </button>
              </>
            )}
            <Link
              href="/inside-the-network"
              aria-label="Explore the complete network"
            >
              <Maximize2 size={15} />
              <span>Full network</span>
            </Link>
          </div>
        </div>
        <div className="vc-scene-layout">
          <aside className="vc-build-inspector" aria-live="polite">
            <div className="vc-inspector-marker">
              <span>{String(chapter + 1).padStart(2, '0')}</span>
              <p>
                THE BUILD STORY
                <br />
                <b>{episode.chapters.length} connected chapters</b>
              </p>
            </div>
            <h5>{current.title}</h5>
            <p>{current.description}</p>
            <div className="vc-network-note">
              <span>IN THE NETWORK</span>
              <p>{current.network}</p>
            </div>
            {supportsScene && chapter >= 3 && (
              <div
                className="vc-resolvers"
                aria-label="Choose a DNS query path"
              >
                {(['dc1', 'dc2'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={resolver === id}
                    onClick={() => setResolver(id)}
                  >
                    Query {id === 'dc1' ? 'DC01' : 'DC02'}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="vc-story-button"
              aria-pressed={tour}
              onClick={() => {
                setTour((value) => !value);
                if (!tour) setChapter(0);
              }}
            >
              {tour ? <Pause size={15} /> : <Play size={15} />}
              {tour ? 'Pause the build story' : 'Play the build story'}
            </button>
          </aside>
          <div className="vc-scene-wrap">
            <div className="vc-scene-meta">
              <span>
                <i />
                {episode.systems.join(' + ')}
              </span>
              <span>{episode.networkLabel}</span>
            </div>
            <div
              ref={host}
              className={`vc-canvas ${fallback ? 'vc-canvas-hidden' : ''}`}
            />
            {(!supportsScene || !ready || fallback) && (
              <div className="vc-scene-fallback">
                <Network size={45} />
                <h5>
                  {!supportsScene || fallback
                    ? 'Explore through the chapters'
                    : 'Preparing your network'}
                </h5>
                <p>
                  {!supportsScene || fallback
                    ? 'Use the chapter controls to follow each system and its dependencies.'
                    : `${episode.systems.join(', ')}, and their connections.`}
                </p>
              </div>
            )}
            {supportsScene && !fallback && (
              <div className="vc-orbit-hint">
                <Move size={13} /> Drag to orbit · scroll to zoom · select a
                system
              </div>
            )}
          </div>
        </div>
        <nav className="vc-chapters" aria-label="Build chapters">
          {episode.chapters.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-current={index === chapter ? 'step' : undefined}
              onClick={() => selectChapter(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <b>{item.label}</b>
                <small>
                  {index === chapter ? 'Exploring now' : 'Explore chapter'}
                </small>
              </div>
              <ArrowRight size={15} />
            </button>
          ))}
        </nav>
      </section>
    </div>
  );
}
