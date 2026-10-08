import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import PrintButton from './print-button';
import configurationCourses from '../../../../content/configuration-courses.json';
import library from '../../../../content/videos.json';
import '../../../videos/videos.css';
import { sharePreview } from '../../../share-preview';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = library.courses.find(item => item.id === slug);
  const title = course ? `${course.title} — configuration checklist` : 'Configuration checklist';
  return { title, description: course?.description, ...sharePreview(`${title} | Secure By Design`, course?.description ?? '', `/training/${slug}/checklist`) };
}

export default async function ChecklistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const configuration = configurationCourses.find(item => item.id === slug);
  const course = library.courses.find(item => item.id === slug);
  if (!configuration || !course) notFound();
  return <main id="main" className="vc-page vc-checklist-page">
    <a className="vc-guide-back" href={course.training.guide}><ArrowLeft size={15} /> Back to {course.title}</a>
    <header className="vc-checklist-head">
      <p className="vc-kicker">COURSE {course.number} · CONFIGURATION CHECKLIST</p>
      <h1>{course.title}</h1>
      <p>Secure By Design · Edition {course.training.materialsEdition} · {course.training.updated}</p>
      <p>{configuration.labNote}</p>
      <div className="vc-checklist-actions">
        <PrintButton />
        {course.training.checklist && <a href={course.training.checklist} download><Download size={15} />Markdown version</a>}
      </div>
    </header>
    <section className="vc-checklist-section" aria-labelledby="checklist-prerequisites">
      <h2 id="checklist-prerequisites">Before you start</h2>
      <ul className="vc-checklist-items">{configuration.prerequisites.map(item => <li key={item}>{item}</li>)}</ul>
    </section>
    {configuration.lessons.map((lesson, index) => <section className="vc-checklist-section" key={lesson.id} aria-labelledby={`checklist-${lesson.id}`}>
      <h2 id={`checklist-${lesson.id}`}>{index + 1}. {lesson.title}</h2>
      <p>About {lesson.minutes} min · <a href={`${course.training.guide}#${lesson.id}`}>Open this lesson</a></p>
      <ul className="vc-checklist-items">{lesson.steps.map(step => <li key={step}>{step}</li>)}</ul>
      <div className="vc-checklist-commands">
        <p><strong>Commands:</strong></p>
        <pre><code>{lesson.command}</code></pre>
      </div>
      <div className="vc-checklist-proof">
        <p><strong>Verify:</strong> {lesson.check}</p>
        <p><strong>Evidence:</strong> {lesson.evidence}</p>
      </div>
      <p className="vc-checklist-notes">Notes / result / date:</p>
    </section>)}
    <section className="vc-checklist-section vc-config-sources vc-checklist-sources" aria-labelledby="checklist-sources">
      <h2 id="checklist-sources">Sources</h2>
      <ul>{configuration.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
    </section>
    <p className="vc-checklist-copyright">© 2026 Secure By Design Team LLC</p>
  </main>;
}
