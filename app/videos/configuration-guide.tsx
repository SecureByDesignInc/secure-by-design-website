'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Download } from 'lucide-react';
import type { TrainingCourse } from './catalog-types';
import { ReadingProgress, ReadingProgressGroup } from '../reader-progress';
import TrainingShare from './training-share';
import type configurationCourses from '../../content/configuration-courses.json';

type Configuration = (typeof configurationCourses)[number];

export default function ConfigurationGuide({ course, configuration, standalone = false }: {
  course: TrainingCourse; configuration: Configuration; standalone?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  useEffect(() => {
    if (!standalone) return;
    const readHash = () => {
      const index = configuration.lessons.findIndex(lesson => `#${lesson.id}` === window.location.hash);
      if (index >= 0) { setActive(index); setAnswer(null); }
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [configuration, standalone]);
  const lesson = configuration.lessons[active];
  const select = (index: number) => {
    setActive(index); setAnswer(null);
    if (standalone) window.history.replaceState(null, '', `#${configuration.lessons[index].id}`);
  };
  return <ReadingProgressGroup><section className="vc-configuration" aria-label={`${course.title} training materials`}>
    <div className="vc-config-intro">
      <div><p className="vc-kicker">BUILD THE NETWORK · WINDOWS SERVER 2025</p><h2>{course.title}</h2><p>{course.description}</p><p className="vc-config-meta">{configuration.lessons.length} lessons · Self-paced · Video coming soon</p></div>
      <div className="vc-config-links">
        {!standalone && <a href={course.training.guide}><BookOpen size={18} />Open full guide</a>}
        {course.training.checklist && <a href={course.training.checklist} download><Download size={18} />Download checklist</a>}
        <a href="/inside-the-network">See the complete network <ArrowRight size={16} /></a>
      </div>
    </div>
    <details className="vc-config-prerequisites"><summary>Before you start · prerequisites and lab plan</summary><ul>{configuration.prerequisites.map(item => <li key={item}>{item}</li>)}</ul><p>{configuration.labNote}</p></details>
    <div className="vc-config-layout">
      <nav className="vc-config-nav" aria-label={`${course.title} lessons`}>
        <p className="vc-kicker">YOUR LEARNING PATH</p>
        {configuration.lessons.map((item, index) => <button key={item.id} type="button" aria-pressed={active === index} aria-controls={`lesson-panel-${course.id}`} onClick={() => select(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</button>)}
      </nav>
      <article className="vc-config-lesson" id={`lesson-panel-${course.id}`} aria-labelledby={`lesson-title-${course.id}`}>
        <p className="vc-kicker" aria-live="polite">LESSON {active + 1} OF {configuration.lessons.length}</p>
        <h3 id={`lesson-title-${course.id}`}>{lesson.title}</h3><p>{lesson.summary}</p>
        <h4>Work through the configuration</h4><ol className="vc-config-steps">{lesson.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <h4>Inspect your configuration</h4><p className="vc-config-command-note">Run the relevant checks in an elevated PowerShell session on the host identified in the lesson. Adapt the example names and paths to your lab.</p><pre tabIndex={0} aria-label="PowerShell verification commands"><code>{lesson.command}</code></pre>
        <div className="vc-config-proof"><div><h4>What success looks like</h4><p>{lesson.check}</p></div><div><h4>Keep your evidence</h4><p>{lesson.evidence}</p></div></div>
        <fieldset className="vc-config-quiz"><legend>Check your understanding</legend><p>{lesson.quiz.question}</p><div>{lesson.quiz.answers.map((option, index) => <button key={`${lesson.id}-${index}`} type="button" aria-pressed={answer === index} onClick={() => setAnswer(index)}>{option}</button>)}</div>{answer !== null && <p role="status"><strong>{answer === lesson.quiz.correct ? 'That’s right. ' : 'Take another look. '}</strong>{lesson.quiz.explanation}</p>}</fieldset>
        <ReadingProgress id={`training:${course.id}:${lesson.id}`} path={`${course.training.guide}#${lesson.id}`} title={lesson.title} />
        <div className="vc-config-paging"><button type="button" disabled={active === 0} onClick={() => select(active - 1)}><ArrowLeft size={16} />Previous lesson</button><button type="button" disabled={active === configuration.lessons.length - 1} onClick={() => select(active + 1)}>Next lesson<ArrowRight size={16} /></button></div>
        <details className="vc-config-sources"><summary>Source documentation for this lesson</summary><ul>{configuration.sources.filter(source => lesson.sources.includes(source.id)).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>
      </article>
    </div>
    {active === configuration.lessons.length - 1 && <TrainingShare closing />}
    <p className="vc-config-edition">Secure By Design · Edition {course.training.materialsEdition} · Updated {course.training.updated}</p>
  </section></ReadingProgressGroup>;
}
