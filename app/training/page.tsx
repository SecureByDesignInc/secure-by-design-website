import VideoHub from '../videos/video-hub';
import library from '../../content/videos.json';
import '../videos/videos.css';

export const metadata = {
  title: 'Training Library',
  description:
    'Explore practical training, interactive guides, and resources from Secure By Design. Choose a topic, build your skills, and follow your own learning path.',
};

export default function TrainingLibraryPage() {
  return <VideoHub library={library} />;
}
