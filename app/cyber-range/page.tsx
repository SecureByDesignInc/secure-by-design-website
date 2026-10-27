import RangeMount from './range-mount';
import './range.css';
import './cyber-range.css';
import { sharePreview } from '../share-preview';

export const metadata = {
  title: 'Cyber Range',
  description: 'Test what you know about the Secure By Design lab network: checkpoints, sparring, runs and decks, built from the same systems you configure in the Training Hub. Open to everyone, no account needed.',
  ...sharePreview('Cyber Range | Secure By Design', 'Checkpoints, sparring, runs and decks built from the lab network. Open to everyone.', '/cyber-range'),
};

// The Cyber Range (owner direction, 26 and 27 October 2026): an arena for testing what you know, separate from course
// progress and portfolios, in the Training Hub's design. The opening matches the Community hub; the Range itself
// (app/cyber-range/range-core.js) mounts under it and runs on /api/range.
export default function CyberRangePage() {
  return <main id="main" className="cr-page cyber-range-page">
    <section className="cr-container cr-intro">
      <div>
        <p className="cr-kicker">Cyber Range</p>
        <h1>Prove what<br /><em>you built.</em></h1>
      </div>
      <div className="cr-intro-copy">
        <p>Short rounds built from the same network you configure in the Training Hub. Take a resident checkpoint, spar against a bot, run your stack as far as it goes, or keep your decks warm. It’s a place to find out what you know, with nothing riding on it but your spot on the ladder. Open to everyone; nothing here touches your training progress or goes into a portfolio.</p>
      </div>
    </section>
    <RangeMount />
    <noscript><section className="cr-container"><p className="cr-note">The Cyber Range needs JavaScript. <a href="/range-app/">Open the Range</a>.</p></section></noscript>
  </main>;
}
