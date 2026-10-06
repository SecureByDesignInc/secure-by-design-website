import { BookOpen, Download, FileText, Share2 } from 'lucide-react';
import type { TrainingCourse } from './catalog-types';
import TrainingShare from './training-share';
import ConfigurationGuide from './configuration-guide';
import configurationCourses from '../../content/configuration-courses.json';

export default function CourseExperience({ course }: { course: TrainingCourse }) {
  const configuration = configurationCourses.find(item => item.id === course.id);
  if (configuration) return <ConfigurationGuide course={course} configuration={configuration} />;
  return <section className="vc-course-experience" aria-labelledby={`course-resources-${course.id}`}>
    <div className="vc-course-resources">
      <div className="vc-training-top"><span className="vc-training-label"><BookOpen size={17} />YOUR TRAINING MATERIALS</span><span className="vc-included-badge"><Share2 size={14} aria-hidden="true" />Learn it. Share it.</span></div>
      {course.seriesPart && <p className="vc-kicker">NETWORK AUTHORIZATION · PART {course.seriesPart} OF 3</p>}
      <h4 id={`course-resources-${course.id}`}>{course.title}</h4>
      <p>{course.description}</p>
      <p>Follow a Learn, See, Build, Prove sequence through {course.moduleCount} modules and {course.lessonCount} lesson primers. Apply each task to the system you build in <a href="/inside-the-network">Inside the Network</a>.</p>
      <a className="vc-guide-link" href={course.training.guide}><span><BookOpen size={22} /><span><b>Open {course.title} training</b><small>Start this part’s lessons, practice tasks, and knowledge checks</small></span></span></a>
      <div className="vc-download-list">{course.training.relatedResources?.map(resource => <a key={resource.href} href={resource.href}><BookOpen size={20} /><span><b>{resource.title}</b><small>{resource.detail}</small></span></a>)}{course.training.word && <a href={course.training.word} download><FileText size={20} /><span><b>Download the full authorization catalog</b><small>All three parts · Editable Word document · {course.training.pages} pages</small></span><Download size={18} /></a>}</div>
      <TrainingShare />
      <div className="vc-training-edition"><p>Edition {course.training.materialsEdition} · Updated {course.training.updated}</p><p>{course.estimatedHours} estimated study hours{course.capstoneHours ? `: ${course.estimatedHours - course.capstoneHours} guided hours plus a ${course.capstoneHours} hour capstone` : ' of guided learning'}.</p></div>
    </div>
    <div className="vc-course-path"><p className="vc-kicker">THE LEARNING PATH</p><h4>What you’ll work through</h4><ol>{course.stages.map((stage, index) => <li key={stage.title}><span>{stage.number ?? String(index + 1).padStart(2, '0')}</span><div><h5>{stage.href ? <a href={stage.href}>{stage.title}</a> : stage.title}</h5><p>{stage.detail}</p></div></li>)}</ol><p className="vc-course-note">These tiles share one complete authorization course. Your existing module progress and evidence workspace carry across all three parts.</p></div>
  </section>;
}
