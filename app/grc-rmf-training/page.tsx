import VideoHub from '../videos/video-hub';
import library from '../../content/videos.json';
import '../videos/videos.css';
import { sharePreview } from '../share-preview';

// Compliance Hub (owner direction, 15 October 2026): the Network Authorization course, the Authorization
// Workspace (/grc-rmf-training/workspace) and the ATO Template Library (/grc-rmf-training/templates) in one section.
const description = 'Governance, risk and compliance training from Secure By Design: take a system through every RMF step to an Authorization to Operate with the RMF to ATO course, the ATO Package Builder, and the ATO Template Library.';
export const metadata = {
  title: 'Compliance Hub: GRC & RMF Training',
  description,
  ...sharePreview('Compliance Hub: GRC & RMF Training | Secure By Design', description, '/grc-rmf-training'),
};

export default function GrcRmfTrainingPage() {
  return <VideoHub library={library} edition="grc" />;
}
