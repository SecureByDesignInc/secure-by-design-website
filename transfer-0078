import { notFound } from 'next/navigation';
import Link from 'next/link';
import ConfigurationGuide from '../../videos/configuration-guide';
import configurationCourses from '../../../content/configuration-courses.json';
import library from '../../../content/videos.json';
import '../../videos/videos.css';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = library.courses.find(item => item.id === slug);
  return { title: course?.title ?? 'Training guide', description: course?.description };
}

export default async function ConfigurationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const configuration = configurationCourses.find(item => item.id === slug);
  const course = library.courses.find(item => item.id === slug);
  if (!configuration || !course) notFound();
  return <main id="main" className="vc-page vc-guide-page container">
    <Link className="vc-guide-back" href="/videos">← Back to the Training Library</Link>
    <h1 className="vc-sr-only">{course.title}</h1>
    <ConfigurationGuide course={course} configuration={configuration} standalone />
  </main>;
}
