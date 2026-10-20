import TrainingHub from '../videos/training-hub';
import library from '../../content/videos.json';
import '../videos/videos.css';
import '../videos/training-hub.css';
import { sharePreview } from '../share-preview';
import type { Library } from '../videos/catalog-types';

// The Training Hub (owner direction, 19 October 2026): every course from the former Configuration Hub and Compliance Hub
// in one library. The address is unchanged; /training, /videos and /learning-library still redirect here.
const description = 'Every Secure By Design course in one library: build the air-gapped network one system at a time, then take it through the Risk Management Framework to an Authorization to Operate.';
export const metadata = {
  title: 'Training Hub',
  description,
  ...sharePreview('Training Hub | Secure By Design', description, '/technical-training'),
};

export default function TrainingHubPage() {
  return <TrainingHub library={library as unknown as Library} />;
}
