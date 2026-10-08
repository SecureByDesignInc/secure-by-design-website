'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardList, Download, ListChecks, Video } from 'lucide-react';
import type { TrainingCourse } from './catalog-types';
import { ReadingProgress, ReadingProgressGroup } from '../reader-progress';
import TrainingShare from './training-share';
import type configurationCourses from '../../content/configuration-courses.json';

type Configuration = (typeof configurationCourses)[number];

export default function ConfigurationGuide({ course, configuration, standalone = false }: {
  course: TrainingCourse; configuration: Configuration; standalone?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  useEffect(() => {
    if (!standalone) return;
    const readHash = () => {
      const index = configuration.lessons.findIndex(lesson => `#${lesson.id}` === window.location.hash);
      if (index >= 0) { setActive(index); setAnswers([]); }
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [configuration, standalone]);
  const lesson = configuration.lessons[active];
  const model = (lesson as { model?: { href: string; label: string; text: string } }).model;
  const select = (index: number) => {
    setActive(index); setAnswers([]);
    if (standalone) window.history.replaceState(null, '', `#${configuration.lessons[index].id}`);
  };
  const answerQuiz = (quizIndex: number, option: number) => setAnswers(current => {
    const next = [...current];
    next[quizIndex] = option;
    return next;
  });
  return <ReadingProgressGroup><section className="vc-configuration" aria-label={`${course.title} training materials`}>
    <div className="vc-config-intro">
      <div><p className="vc-kicker">COURSE {course.number} · BUILD THE NETWORK · {(course.platform ?? 'Windows Server 2025').toUpperCase()}</p><h2>{course.title}</h2><p>{course.description}</p><p className="vc-config-meta">{configuration.lessons.length} lessons · ~{course.estimatedHours}h · Self-paced · Written edition</p></div>
      <div className="vc-config-links">
        {!standalone && <a href={course.training.guide}><BookOpen size={18} />Open full guide</a>}
        {course.training.pdf && <a href={course.training.pdf} download><Download size={18} />Workbook (PDF{course.training.pages ? ` · ${course.training.pages} pages` : ''})</a>}
        {course.training.word && <a href={course.training.word} download><Download size={18} />Workbook (Word, editable)</a>}
        {course.training.checklistPage && <a href={course.training.checklistPage}><ClipboardList size={18} />Open the checklist</a>}
        {course.training.checklist && <a href={course.training.checklist} download><Download size={18} />Checklist (Markdown)</a>}
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
        <p className="vc-kicker" aria-live="polite">LESSON {active + 1} OF {configuration.lessons.length} · ABOUT {lesson.minutes} MIN</p>
        <h3 id={`lesson-title-${course.id}`}>{lesson.title}</h3><p>{lesson.summary}</p>
        <div className="vc-config-objectives"><h4><ListChecks size={16} aria-hidden="true" /> In this lesson you will</h4><ul>{lesson.objectives.map(objective => <li key={objective}>{objective}</li>)}</ul></div>
        <h4>Work through the configuration</h4><ol className="vc-config-steps">{lesson.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <h4>Inspect your configuration</h4><p className="vc-config-command-note">Run the relevant checks in an elevated PowerShell session — or a shell, on the Linux servers — on the host identified in the lesson. Adapt the example names and paths to your lab.</p><pre tabIndex={0} aria-label="Verification commands"><code>{lesson.command}</code></pre>
        <div className="vc-config-proof"><div><h4>What success looks like</h4><p>{lesson.check}</p></div><div><h4>Keep your evidence</h4><p>{lesson.evidence}</p></div></div>
        {model && <aside className="vc-config-model" aria-label="See it inside the network"><h4>See it inside the network</h4><p>{model.text}</p><a href={model.href}>Open {model.label} in Inside the Network <ArrowRight size={14} aria-hidden="true" /></a></aside>}
        <p className="vc-config-video-note"><Video size={15} aria-hidden="true" />This lesson’s video walkthrough is coming soon. Its chapter timestamp will link here when the episode publishes.</p>
        {lesson.quizzes.map((quiz, quizIndex) => {
          const answer = answers[quizIndex] ?? null;
          return <fieldset className="vc-config-quiz" key={`${lesson.id}-quiz-${quizIndex}`}><legend>Check your understanding · {quizIndex + 1} of {lesson.quizzes.length}</legend><p>{quiz.question}</p><div>{quiz.answers.map((option, index) => <button key={`${lesson.id}-${quizIndex}-${index}`} type="button" aria-pressed={answer === index} onClick={() => answerQuiz(quizIndex, index)}>{option}</button>)}</div>{answer !== null && <p role="status"><strong>{answer === quiz.correct ? 'That’s right. ' : 'Take another look. '}</strong>{quiz.explanation}</p>}</fieldset>;
        })}
        <div className="vc-config-recap"><h4>Lesson recap</h4><ul>{lesson.recap.map(item => <li key={item}>{item}</li>)}</ul><p className="vc-config-next"><strong>Up next:</strong> {lesson.next}</p></div>
        <ReadingProgress id={`training:${course.id}:${lesson.id}`} path={`${course.training.guide}#${lesson.id}`} title={lesson.title} />
        <div className="vc-config-paging"><button type="button" disabled={active === 0} onClick={() => select(active - 1)}><ArrowLeft size={16} />Previous lesson</button><button type="button" disabled={active === configuration.lessons.length - 1} onClick={() => select(active + 1)}>Next lesson<ArrowRight size={16} /></button></div>
        <details className="vc-config-sources"><summary>Source documentation for this lesson</summary><ul>{configuration.sources.filter(source => lesson.sources.includes(source.id)).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>
      </article>
    </div>
    {active === configuration.lessons.length - 1 && <TrainingShare closing />}
    <p className="vc-config-edition">Secure By Design · Edition {course.training.materialsEdition} · Updated {course.training.updated}</p>
    <p className="vc-config-edition">© 2026 Secure By Design Team LLC</p>
  </section></ReadingProgressGroup>;
}
