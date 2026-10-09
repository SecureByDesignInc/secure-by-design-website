'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Download,
  Maximize2,
  Move,
  Network,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { CatalogScene } from './catalog-scene';
import { getYouTubeEmbedUrl, supportsIdentityScene } from './video-utils';

import type { Episode } from './catalog-types';
import { CompanionHeading, CompanionMaterials, CompanionWatch } from './companion';

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
  const [target, setTarget] = useState<'dc1' | 'dc2'>('dc1');
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
    scene.current?.update(chapter, moving, target);
  }, [chapter, moving, target, ready]);
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
        <CompanionHeading
          id={`episode-resources-${episode.id}`}
          intro="Start with the interactive guide, or download every training material in one file."
          action={{ href: episode.training.guide, label: 'Open the full guide', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${episode.id}`}
            cover={episode.training.cover}
            coverAlt={`Secure By Design companion workbook for ${episode.title}`}
            heading={['Keep the knowledge.', 'Build with confidence.']}
            summary={`${episode.training.pages} pages of explanations, configuration steps, security reasoning, and evidence prompts.`}
            guide={{ href: episode.training.guide, title: 'Open the interactive guide', detail: '3D network · chapter checks · your notes', icon: <Network size={20} />, trailing: <ArrowUpRight size={19} /> }}
            links={[
              { href: episode.training.package, title: 'Download the training materials', detail: `ZIP · offline guide, ${episode.training.pages}-page workbook (PDF and Word), and verification commands`, icon: <Download size={19} />, trailing: <ArrowDown size={16} />, download: true },
            ]}
            edition={(episode.training.materialsEdition || episode.training.copyrightOwner || episode.training.notices) && <>
              {episode.training.materialsEdition && (
                <p>
                  Course {episode.number} · Materials edition{' '}
                  {episode.training.materialsEdition}
                  {episode.training.updated && <> · Updated {episode.training.updated}</>}
                </p>
              )}
              {episode.training.copyrightOwner && (
                <p>
                  © {episode.training.copyrightYear}{' '}
                  {episode.training.copyrightOwner}.
                </p>
              )}
              {episode.training.notices && <a href={episode.training.notices}>Notices and permissions</a>}
            </>}
          />
          <CompanionWatch
            title={episode.title}
            embedUrl={embedUrl}
            servers={supportsScene}
            tag={episode.tags[0]}
            systems={episode.systems.join(' + ')}
            detail={episode.tags.slice(1).join(' & ')}
            outcomeSummary={episode.outcomeSummary}
            outcomes={episode.outcomes}
          />
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
                className="vc-check-targets"
                role="group"
                aria-label="Choose a controller to check"
              >
                {(['dc1', 'dc2'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={target === id}
                    onClick={() => setTarget(id)}
                  >
                    Check {id === 'dc1' ? 'DC01' : 'DC02'}
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
