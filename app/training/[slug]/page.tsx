import { notFound } from 'next/navigation';
import ConfigurationGuide from '../../videos/configuration-guide';
import configurationCourses from '../../../content/configuration-courses.json';
import library from '../../../content/videos.json';
import '../../videos/videos.css';
import { sharePreview } from '../../share-preview';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = library.courses.find(item => item.id === slug);
  const title = course?.title ?? 'Training guide';
  return { title, description: course?.description, ...sharePreview(`${title} | Secure By Design`, course?.description ?? '', `/training/${slug}`) };
}

export default async function ConfigurationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const configuration = configurationCourses.find(item => item.id === slug);
  const course = library.courses.find(item => item.id === slug);
  if (!configuration || !course) notFound();
  return <main id="main" className="vc-page vc-guide-page container">
    <a className="vc-guide-back" href="/training">← Back to the Training Library</a>
    <h1 className="vc-sr-only">{course.title}</h1>
    <ConfigurationGuide course={course} configuration={configuration} standalone />
  </main>;
}
