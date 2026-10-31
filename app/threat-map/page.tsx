import ThreatMapSection from './threat-map-section';
import './threat-map.css';
import { sharePreview } from '../share-preview';

export const metadata = {
  title: 'Live Threat Map',
  description: 'Watch attacks Radware recorded moments ago: where they start, where they land, and which kinds are most common today, with notes on how to read the map.',
  ...sharePreview('Live Threat Map | Secure By Design', 'The internet, under attack. Right now.', '/threat-map'),
};

// The Live Threat Map's own page again (owner's request, 31 October 2026); the homepage links here from a card under
// the Cyber Range taster.
export default function ThreatMapPage() {
  return <main id="main" className="tm-standalone"><ThreatMapSection /></main>;
}
