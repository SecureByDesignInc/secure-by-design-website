import TemplateHome, { type BuildPathCourse } from './template-home';
import library from '../content/videos.json';
import { getCatalogEntries } from './videos/video-utils';
import './saleshook-effects.css';
import './template-home.css';
import { sharePreview } from './share-preview';
export const metadata = {title: {absolute: 'Secure By Design — Cybersecurity Starts with Curiosity'}, description: 'Straightforward conversations about cybersecurity, technology, and compliance. Bring your curiosity and explore Secure By Design.', ...sharePreview('Secure By Design — Cybersecurity Starts with Curiosity', 'Straightforward conversations about cybersecurity, technology, and compliance. Bring your curiosity and explore Secure By Design.', '/')};

// The homepage's Build the Network path, in catalog order, from the Training Library data
// (resolved on the server so the full catalog stays out of the page's client bundle).
const buildCategory = library.categories.find(category => category.id === 'network-build');
const buildPath: BuildPathCourse[] = getCatalogEntries(library)
  .filter(entry => entry.categoryId === buildCategory?.id)
  .map(entry => ({ id: entry.id, number: entry.number, title: entry.title, subtitle: entry.subtitle, href: entry.training.guide, video: 'youtubeId' in entry && Boolean(entry.youtubeId) }));

export default function Home() { return <TemplateHome buildPath={buildPath} buildCategory={buildCategory?.title ?? 'Build the Network'} />; }
