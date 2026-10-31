import RangeMount from './range-mount';
import './range.css';
import './cyber-range.css';
import './battle.css';
import { sharePreview } from '../share-preview';

export const metadata = {
  title: 'Cyber Range',
  description: 'Battle the computer in seven rounds of multiple choice from the Secure By Design lab network. Answer right to hit, answer fast to hit harder. Open to everyone, no account needed.',
  ...sharePreview('Cyber Range | Secure By Design', 'You against the computer: seven rounds of multiple choice from the lab network. Open to everyone.', '/cyber-range'),
};

// The Cyber Range (owner direction, 30 October 2026): one battle against the computer, seven multiple-choice rounds,
// separate from course progress, in the Training Hub's design. The opening matches the Community hub; the battle
// (app/cyber-range/range-core.js) mounts under it and runs on /api/range.
export default function CyberRangePage() {
  return <main id="main" className="cr-page cyber-range-page">
    <section className="cr-container cr-intro">
      <div>
        <p className="cr-kicker">Cyber Range</p>
        <h1>Prove what<br /><em>you built.</em></h1>
      </div>
      <div className="cr-intro-copy">
        <p>Battle the computer in seven rounds of multiple choice drawn from the network you build in the Training Hub. Answer right to hit, answer fast to hit harder. Open to everyone.</p>
      </div>
    </section>
    <RangeMount />
    <noscript><section className="cr-container"><p className="cr-note">The Cyber Range needs JavaScript. <a href="/range-app/">Open the Range</a>.</p></section></noscript>
  </main>;
}
