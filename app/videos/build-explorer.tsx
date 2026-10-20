'use client';

// The interactive build explorer at the bottom of every expanded catalog tile (owner request,
// 18 October 2026: one shared explorer for course 1.1 and courses 1.2–1.12). It draws the course
// guide's own 3D lesson network from public/training/<id>/scene.json with app/videos/guide-scene.ts,
// and beside it the build story: the chosen lesson, its network state, system buttons, the chosen
// system's notes and the lesson's guide link. Full lessons, knowledge checks and saved progress stay
// in the course's own guide.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, Maximize2, Move, Network, Pause, Play, RotateCcw } from 'lucide-react';
import { nodeActive, type GuideScene, type GuideSceneSpec } from './guide-scene';

export type ExplorerStep = {
  id: string;
  /** The short name on the lesson button. */
  label: string;
  /** The heading in the inspector. */
  title: string;
  summary: string;
  /** Shown when the scene file has no network caption for this lesson. */
  note?: { label: string; text: string };
  links: { href: string; label: string }[];
};
type SceneFile = { scene: GuideSceneSpec; chapters: { id: string; tag: string; status: string; network: string }[] };

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (listener: () => void) => {
  const preference = matchMedia(motionQuery);
  preference.addEventListener('change', listener);
  return () => preference.removeEventListener('change', listener);
};
const getMotionPreference = () => matchMedia(motionQuery).matches;
const getServerMotionPreference = () => true;
const pad = (value: number) => String(value).padStart(2, '0');

export default function BuildExplorer({
  id,
  kicker,
  heading,
  storyLabel,
  unit,
  steps,
  initial = 0,
  sceneUrl,
  systems,
  networkLabel,
  guideHref,
  onStep,
  tools,
}: {
  id: string;
  kicker: string;
  heading: string;
  storyLabel: string;
  unit: string;
  steps: ExplorerStep[];
  initial?: number;
  sceneUrl: string | null;
  systems: string;
  networkLabel?: string;
  guideHref: string;
  /** Called when the learner chooses a lesson (the 1.1 tile seeks its video). */
  onStep?: (index: number) => void;
  /** Extra header tools, after Full guide. */
  tools?: ReactNode;
}) {
  const [active, setActive] = useState(Math.min(initial, Math.max(0, steps.length - 1)));
  const [tour, setTour] = useState(false);
  const [file, setFile] = useState<SceneFile | null>(null);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, getMotionPreference, getServerMotionPreference);
  const moving = motionOverride ?? !reducedMotion;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<GuideScene | null>(null);

  useEffect(() => {
    if (!tour) return;
    const timer = setInterval(() => setActive(value => (value + 1) % steps.length), 4200);
    return () => clearInterval(timer);
  }, [tour, steps.length]);
  // The scene data loads with the tile, the drawing module when the data arrives.
  useEffect(() => {
    if (!sceneUrl) return;
    let cancelled = false;
    fetch(sceneUrl, { cache: 'force-cache' })
      .then(response => (response.ok ? (response.json() as Promise<SceneFile>) : Promise.reject(new Error(String(response.status)))))
      .then(data => {
        if (!cancelled) setFile(data);
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sceneUrl]);
  useEffect(() => {
    if (!file || fallback) return;
    let cancelled = false;
    import('./guide-scene')
      .then(({ createGuideScene }) => {
        if (cancelled || !host.current) return;
        try {
          scene.current = createGuideScene(host.current, file.scene, file.chapters.length - 1, node => setSelected(node), () => setFallback(true));
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
      setReady(false);
    };
  }, [file, fallback]);

  const nodes = file?.scene.nodes ?? [];
  const selectedNode = nodes.find(node => node.id === selected) ?? nodes[0] ?? null;
  const sceneState = { stages: [active], selected: selectedNode?.id ?? '', motion: moving, complete: false };
  useEffect(() => {
    scene.current?.update(sceneState);
  }, [active, moving, selectedNode?.id, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = steps[active] ?? steps[0];
  if (!current) return null;
  const chapter = file?.chapters[active];
  const supportsScene = !!sceneUrl;
  const columns = steps.length <= 6 ? steps.length : Math.ceil(steps.length / 2);
  const select = (index: number) => {
    setActive(index);
    setTour(false);
    onStep?.(index);
  };

  return (
    <section className="vc-explorer" aria-labelledby={`build-explorer-${id}`}>
      <div className="vc-explorer-heading">
        <div className="vc-stage-title">
          <Network size={21} />
          <div>
            <p className="vc-kicker">{kicker}</p>
            <h4 id={`build-explorer-${id}`}>{heading}</h4>
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
              <button type="button" onClick={() => scene.current?.reset()} disabled={!ready || fallback}>
                <RotateCcw size={14} />
                Reset view
              </button>
            </>
          )}
          <a href={guideHref}>
            <BookOpen size={15} />
            <span>Full guide</span>
          </a>
          {tools}
          <Link href="/inside-the-network" aria-label="Explore the complete network">
            <Maximize2 size={15} />
            <span>Full network</span>
          </Link>
        </div>
      </div>
      <div className="vc-scene-layout">
        <aside className="vc-build-inspector" aria-live="polite">
          <div className="vc-inspector-marker">
            <span>{pad(active + 1)}</span>
            <p>
              {storyLabel}
              <br />
              <b>{steps.length} connected {unit}s</b>
            </p>
          </div>
          <h5>{current.title}</h5>
          <p>{current.summary}</p>
          {(chapter?.network || current.note) && (
            <div className="vc-network-note">
              <span>{chapter?.network ? 'IN THE NETWORK' : current.note?.label}</span>
              <p>{chapter?.network ?? current.note?.text}</p>
            </div>
          )}
          {nodes.length > 0 && (
            <div className="vc-check-targets vc-system-buttons" role="group" aria-label="Choose a system">
              {nodes.map(node => (
                <button key={node.id} type="button" aria-pressed={selectedNode?.id === node.id} onClick={() => setSelected(node.id)}>
                  {node.button ?? node.name}
                </button>
              ))}
            </div>
          )}
          {selectedNode && (
            <div className="vc-node-details">
              <small>
                {selectedNode.kind === 'viewpoint'
                  ? 'ADMINISTRATION VIEWPOINT'
                  : nodeActive(selectedNode, sceneState)
                    ? selectedNode.existing ? 'BUILT IN AN EARLIER COURSE' : `CONFIGURED BY THIS ${unit.toUpperCase()}`
                    : 'PLANNED SYSTEM'}
              </small>
              <b>{selectedNode.title}</b>
              <p>{selectedNode.description}</p>
            </div>
          )}
          {current.links.length > 0 && (
            <div className="vc-inspector-links">
              {current.links.map(link => (
                <a key={link.href} href={link.href}>
                  {link.label}
                  <ArrowUpRight size={14} />
                </a>
              ))}
            </div>
          )}
          <button
            type="button"
            className="vc-story-button"
            aria-pressed={tour}
            onClick={() => {
              setTour(value => !value);
              if (!tour) setActive(0);
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
              {systems}
            </span>
            <span>{chapter?.status ?? networkLabel}</span>
          </div>
          <div ref={host} className={`vc-canvas ${fallback ? 'vc-canvas-hidden' : ''}`} />
          {(!supportsScene || !ready || fallback) && (
            <div className="vc-scene-fallback">
              <Network size={45} />
              <h5>{!supportsScene || fallback ? `Explore through the ${unit}s` : 'Preparing your network'}</h5>
              <p>
                {!supportsScene || fallback
                  ? `Use the ${unit} controls to follow each system and its dependencies.`
                  : `${systems}, and their connections.`}
              </p>
            </div>
          )}
          {supportsScene && !fallback && (
            <div className="vc-orbit-hint">
              <Move size={13} /> Drag to orbit · scroll to zoom · select a system
            </div>
          )}
        </div>
      </div>
      <nav
        className="vc-chapters vc-chapters-lessons"
        aria-label={`${heading} ${unit}s`}
        style={{ '--lesson-columns': columns } as CSSProperties}
      >
        {steps.map((item, index) => (
          <button key={item.id} type="button" aria-current={index === active ? 'step' : undefined} onClick={() => select(index)}>
            <span>{pad(index + 1)}</span>
            <div>
              <b>{item.label}</b>
              <small>{index === active ? 'Exploring now' : `Explore ${unit}`}</small>
            </div>
            <ArrowRight size={15} />
          </button>
        ))}
      </nav>
    </section>
  );
}
