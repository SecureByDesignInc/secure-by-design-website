'use client';

// The expanded tile for a course. It mirrors the identity build's companion
// (episode-experience.tsx): the same heading, materials panel and recording column,
// then an interactive build explorer that draws the course's own systems in 3D (the
// guide's lesson network, from public/training/<id>/scene.json) with the lesson
// story beside it. Full lessons, knowledge checks and saved progress stay in the
// course's own guide. Owner request, 18 October 2026: every tile matches course 1.1.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Link from 'next/link';
import {
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
import type { TrainingCourse } from './catalog-types';
import { nodeActive, type GuideScene, type GuideSceneSpec } from './guide-scene';
import { CompanionHeading, CompanionMaterials, CompanionWatch, type CompanionLink } from './companion';
import configurationCourses from '../../content/configuration-courses.json';

type Configuration = (typeof configurationCourses)[number];
type Step = {
  id: string;
  label: string;
  summary: string;
  note?: { label: string; text: string };
  duration?: string;
  listHeading: string;
  objectives: string[];
  open: { href: string; label: string };
  model?: { href: string; label: string; text: string };
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
// The poster names at most two systems, like the identity build's "DC01 + DC02".
function posterSystems(course: TrainingCourse) {
  if (!course.systems.length) return course.title;
  const names = course.systems.map(system => system.replace(/^SBD-/, ''));
  return names.slice(0, 2).join(' + ');
}

function lessonSteps(course: TrainingCourse, configuration: Configuration): Step[] {
  return configuration.lessons.map((lesson, index) => ({
    id: lesson.id,
    label: lesson.title,
    summary: lesson.summary,
    note: { label: 'WHAT SUCCESS LOOKS LIKE', text: lesson.check },
    duration: `ABOUT ${lesson.minutes} MIN`,
    listHeading: 'In this lesson you will',
    objectives: lesson.objectives,
    open: { href: `${course.training.guide}#${lesson.id}`, label: `Open lesson ${index + 1} in the guide` },
    model: (lesson as { model?: Step['model'] }).model,
  }));
}

function moduleSteps(course: TrainingCourse): Step[] {
  return course.stages.map((stage, index) => ({
    id: stage.number ?? pad(index + 1),
    label: stage.title,
    summary: stage.detail,
    note: { label: 'IN THE NETWORK', text: 'Apply this module to the System Hub practice system you built in the Build the Network courses.' },
    duration: stage.hours ? `ABOUT ${stage.hours} ${stage.hours === '1' ? 'HOUR' : 'HOURS'}` : undefined,
    listHeading: 'Lessons in this module',
    objectives: stage.lessons ?? [],
    open: { href: stage.href ?? course.training.guide, label: `Open module ${stage.number ?? pad(index + 1)}` },
  }));
}

export default function CourseExperience({ course }: { course: TrainingCourse }) {
  const configuration = configurationCourses.find(item => item.id === course.id);
  const steps = configuration ? lessonSteps(course, configuration) : moduleSteps(course);
  const unit = configuration ? 'lesson' : 'module';
  const [active, setActive] = useState(0);
  const [tour, setTour] = useState(false);
  // The 3D lesson network: its data loads with the tile, the drawing module when the data arrives.
  const sceneUrl = configuration ? `${course.training.guide}/scene.json` : null;
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
          scene.current = createGuideScene(host.current, file.scene, file.chapters.length - 1, id => setSelected(id), () => setFallback(true));
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
  const select = (index: number) => {
    setActive(index);
    setTour(false);
  };
  const training = course.training;
  const authorization = course.kind === 'authorization';
  const columns = steps.length <= 6 ? steps.length : Math.ceil(steps.length / 2);

  // One download per tile (owner request, 18 October 2026): the course's Word workbook. A Network Authorization
  // workbook carries the course's evidence starters (scripts/prepare-rmf-workbooks.py).
  const download: CompanionLink[] = training.word
    ? [{ href: training.word, title: 'Download the workbook', detail: configuration
        ? `Word · ${training.pages}-page workbook`
        : `Word · ${training.pages}-page workbook with evidence starters`, icon: <Download size={19} />, trailing: <Download size={16} />, download: true }]
    : [];
  const links: CompanionLink[] = configuration
    ? download
    : [
        ...(training.relatedResources ?? []).map(resource => ({ href: resource.href, title: resource.title, detail: resource.detail, icon: <BookOpen size={19} />, trailing: <ArrowUpRight size={16} /> })),
        ...download,
      ];

  return (
    <div className="vc-experience">
      <section className="vc-episode" aria-labelledby={`course-resources-${course.id}`}>
        <CompanionHeading
          id={`course-resources-${course.id}`}
          intro={configuration
            ? 'Start with the interactive guide, or download the workbook.'
            : 'Start with the interactive course, or download its workbook with the evidence starters.'}
          action={{ href: training.guide, label: configuration ? 'Open the full guide' : 'Open the training', icon: <BookOpen size={16} /> }}
        />
        <div className="vc-episode-content">
          <CompanionMaterials
            id={`training-${course.id}`}
            cover={training.cover}
            coverAlt={`Secure By Design companion workbook for ${course.title}`}
            heading={['Keep the knowledge.', authorization ? 'Authorize with confidence.' : 'Build with confidence.']}
            summary={configuration
              ? `${training.pages} pages of explanations, configuration steps, verification commands, and evidence prompts.`
              : `${training.pages} pages of RMF steps, tasks, and outputs, with lessons, worked examples, and practice records.`}
            guide={{
              href: training.guide,
              title: configuration ? 'Open the interactive guide' : `Open ${course.title} training`,
              detail: configuration ? `${steps.length} lessons · knowledge checks · your progress` : 'RMF steps and outputs · 3D network · knowledge checks',
              icon: <BookOpen size={20} />,
              trailing: <ArrowUpRight size={19} />,
            }}
            links={links}
            edition={<>
              <p>Course {course.number} · Materials edition {training.materialsEdition} · Updated {training.updated}</p>
              <p>
                {course.estimatedHours} estimated study hours
                {course.capstoneHours ? `: ${course.estimatedHours - course.capstoneHours} guided hours plus a ${course.capstoneHours} hour capstone` : ''}.
              </p>
              <p>© 2026 Secure By Design Team LLC.</p>
            </>}
          />
          <CompanionWatch
            title={course.title}
            embedUrl={null}
            servers={course.systems.length > 0}
            tag={authorization ? `NETWORK AUTHORIZATION · COURSE ${course.number}` : course.tags[0]}
            systems={posterSystems(course)}
            detail={course.tags.slice(1, 3).join(' & ')}
            outcomesLabel={authorization ? 'WHAT YOU WILL PREPARE' : 'WHAT YOU WILL BUILD'}
            outcomeSummary={course.outcomeSummary}
            outcomes={course.artLabels ?? course.outcomes}
          />
        </div>
      </section>

      <section className="vc-explorer" aria-labelledby={`lesson-explorer-${course.id}`}>
        <div className="vc-explorer-heading">
          <div className="vc-stage-title">
            <Network size={21} />
            <div>
              <p className="vc-kicker">{configuration ? 'INTERACTIVE BUILD EXPLORER' : 'INTERACTIVE MODULE EXPLORER'}</p>
              <h4 id={`lesson-explorer-${course.id}`}>{course.subtitle}</h4>
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
            <a href={training.guide}>
              <BookOpen size={15} />
              <span>Full guide</span>
            </a>
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
                {authorization ? 'THE AUTHORIZATION STORY' : 'THE BUILD STORY'}
                <br />
                <b>{steps.length} connected {unit}s</b>
              </p>
            </div>
            <h5>{current.label}</h5>
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
                      ? selectedNode.existing ? 'BUILT IN AN EARLIER COURSE' : 'CONFIGURED IN THIS LESSON STATE'
                      : 'PLANNED SYSTEM'}
                </small>
                <b>{selectedNode.title}</b>
                <p>{selectedNode.description}</p>
              </div>
            )}
            <div className="vc-inspector-links">
              <a href={current.open.href}>
                {current.open.label}
                <ArrowUpRight size={14} />
              </a>
              {current.model && (
                <a href={current.model.href}>
                  See {current.model.label} inside the network
                  <ArrowUpRight size={14} />
                </a>
              )}
            </div>
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
                {course.systems.length ? course.systems.join(' + ') : 'System Hub practice system'}
              </span>
              <span>{chapter?.status ?? course.networkLabel}</span>
            </div>
            <div ref={host} className={`vc-canvas ${fallback ? 'vc-canvas-hidden' : ''}`} />
            {(!supportsScene || !ready || fallback) && (
              <div className="vc-scene-fallback">
                <Network size={45} />
                <h5>{!supportsScene || fallback ? `Explore through the ${unit}s` : 'Preparing your network'}</h5>
                <p>
                  {!supportsScene || fallback
                    ? `Use the ${unit} controls to follow each system and its dependencies.`
                    : `${course.systems.join(', ')}, and their connections.`}
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
          aria-label={`${course.title} ${unit}s`}
          style={{ '--lesson-columns': columns } as CSSProperties}
        >
          {steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-current={index === active ? 'step' : undefined}
              onClick={() => select(index)}
            >
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
    </div>
  );
}
