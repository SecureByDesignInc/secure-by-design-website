'use client';

// The expanded tile for a course. It mirrors the identity build's companion
// (episode-experience.tsx): the same heading, materials panel and recording column, then
// the shared interactive build explorer (build-explorer.tsx) drawing the course's own
// systems from its guide's scene. Full lessons, knowledge checks and saved progress stay
// in the course's own guide.
import { ArrowUpRight, BookOpen, Download } from 'lucide-react';
import type { TrainingCourse } from './catalog-types';
import { CompanionHeading, CompanionMaterials, CompanionWatch, type CompanionLink } from './companion';
import BuildExplorer, { type ExplorerStep } from './build-explorer';
import configurationCourses from '../../content/configuration-courses.json';

type Configuration = (typeof configurationCourses)[number];
const pad = (value: number) => String(value).padStart(2, '0');
// The poster names at most two systems, like the identity build's "DC01 + DC02".
function posterSystems(course: TrainingCourse) {
  if (!course.systems.length) return course.title;
  const names = course.systems.map(system => system.replace(/^SBD-/, ''));
  return names.slice(0, 2).join(' + ');
}

function lessonSteps(course: TrainingCourse, configuration: Configuration): ExplorerStep[] {
  return configuration.lessons.map((lesson, index) => {
    const model = (lesson as { model?: { href: string; label: string } }).model;
    return {
      id: lesson.id,
      label: lesson.title,
      title: lesson.title,
      summary: lesson.summary,
      note: { label: 'WHAT SUCCESS LOOKS LIKE', text: lesson.check },
      links: [
        { href: `${course.training.guide}#${lesson.id}`, label: `Open lesson ${index + 1} in the guide` },
        ...(model ? [{ href: model.href, label: `See ${model.label} inside the network` }] : []),
      ],
    };
  });
}

function moduleSteps(course: TrainingCourse): ExplorerStep[] {
  return course.stages.map((stage, index) => ({
    id: stage.number ?? pad(index + 1),
    label: stage.title,
    title: stage.title,
    summary: stage.detail,
    note: { label: 'IN THE NETWORK', text: 'Apply this module to the System Hub practice system you built in the Build the Network courses.' },
    links: [{ href: stage.href ?? course.training.guide, label: `Open module ${stage.number ?? pad(index + 1)}` }],
  }));
}

export default function CourseExperience({ course }: { course: TrainingCourse }) {
  const configuration = configurationCourses.find(item => item.id === course.id);
  const steps = configuration ? lessonSteps(course, configuration) : moduleSteps(course);
  const unit = configuration ? 'lesson' : 'module';
  const training = course.training;
  const authorization = course.kind === 'authorization';

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

      <BuildExplorer
        id={course.id}
        kicker={configuration ? 'INTERACTIVE BUILD EXPLORER' : 'INTERACTIVE MODULE EXPLORER'}
        heading={course.subtitle}
        storyLabel={authorization ? 'THE AUTHORIZATION STORY' : 'THE BUILD STORY'}
        unit={unit}
        steps={steps}
        sceneUrl={configuration ? `${training.guide}/scene.json` : null}
        systems={course.systems.length ? course.systems.join(' + ') : 'System Hub practice system'}
        networkLabel={course.networkLabel}
        guideHref={training.guide}
      />
    </div>
  );
}
