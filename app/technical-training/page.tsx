import VideoHub from '../videos/video-hub';
import library from '../../content/videos.json';
import '../videos/videos.css';
import { sharePreview } from '../share-preview';

const description = 'Explore practical training, interactive guides, and resources from Secure By Design. Choose a topic, build your skills, and follow your own learning path.';
export const metadata = {
  title: 'Configuration Hub: Technical Training',
  description,
  ...sharePreview('Configuration Hub: Technical Training | Secure By Design', description, '/technical-training'),
};

export default function TrainingLibraryPage() {
  return <VideoHub library={library} />;
}
