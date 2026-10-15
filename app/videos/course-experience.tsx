'use client';

// The expanded tile for a course. It mirrors the identity build's companion
// (episode-experience.tsx): the same heading, materials panel and recording column,
// then a lesson explorer in place of the 3D build explorer. Full lessons, knowledge
// checks and saved progress stay in the course's own guide.
import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Download,
  Maximize2,
  Network,
  Pause,
  Play,
} from 'lucide-react';
import type { TrainingCourse } from './catalog-types';
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
  useEffect(() => {
    if (!tour) return;
    const timer = setInterval(() => setActive(value => (value + 1) % steps.length), 4200);
    return () => clearInterval(timer);
  }, [tour, steps.length]);
  const current = steps[active] ?? steps[0];
  if (!current) return null;
  const select = (index: number) => {
    setActive(index);
    setTour(false);
  };
  const training = course.training;
  const authorization = course.kind === 'authorization';
  const columns = steps.length <= 6 ? steps.length : Math.ceil(steps.length / 2);

  // One download per tile: a course's workbook (PDF and Word) travels in its ZIP with a configuration course's
  // checklist and verification commands (scripts/prepare-training-packages.py) or a Network Authorization
  // course's evidence starters (scripts/prepare-rmf-workbooks.py).
  const download: CompanionLink[] = training.package
    ? [{ href: training.package, title: 'Download the training materials', detail: configuration
        ? `ZIP · ${training.pages}-page workbook (PDF and Word), checklist, and verification commands`
        : `ZIP · ${training.pages}-page workbook (PDF and Word) and evidence starters`, icon: <Download size={19} />, trailing: <Download size={16} />, download: true }]
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
            ? 'Start with the interactive guide, or download every training material in one file.'
            : 'Start with the interactive course, or download its workbook and evidence starters in one file.'}
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
            <BookOpen size={21} />
            <div>
              <p className="vc-kicker">{configuration ? 'INTERACTIVE LESSON EXPLORER' : 'INTERACTIVE MODULE EXPLORER'}</p>
              <h4 id={`lesson-explorer-${course.id}`}>{course.subtitle}</h4>
            </div>
          </div>
          <div className="vc-scene-tools">
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
            {current.note && (
              <div className="vc-network-note">
                <span>{current.note.label}</span>
                <p>{current.note.text}</p>
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
              {tour ? 'Pause the course story' : 'Play the course story'}
            </button>
          </aside>
          <div className="vc-scene-wrap vc-lesson-stage">
            <div className="vc-scene-meta">
              <span>
                <i />
                {course.systems.length ? course.systems.join(' + ') : 'System Hub practice system'}
              </span>
              <span>{course.networkLabel}</span>
            </div>
            <div className="vc-lesson-stage-body">
              <span className="vc-lesson-stage-number" aria-hidden="true">{pad(active + 1)}</span>
              <p className="vc-kicker">
                {unit.toUpperCase()} {active + 1} OF {steps.length}
                {current.duration ? ` · ${current.duration}` : ''}
              </p>
              {current.objectives.length > 0 ? (
                <>
                  <h5>{current.listHeading}</h5>
                  <ul>
                    {current.objectives.map(objective => (
                      <li key={objective}>
                        <Check size={15} aria-hidden="true" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <h5>{current.label}</h5>
              )}
              <div className="vc-lesson-stage-actions">
                <a href={current.open.href}>
                  {current.open.label}
                  <ArrowUpRight size={16} />
                </a>
                {current.model && (
                  <a href={current.model.href}>
                    <Network size={15} />
                    See {current.model.label} inside the network
                  </a>
                )}
              </div>
            </div>
            <div className="vc-orbit-hint">
              <BookOpen size={13} />{' '}
              {configuration
                ? 'Full steps, verification commands, and knowledge checks are in the guide'
                : 'Full lessons, practice tasks, and knowledge checks are in the training'}
            </div>
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
