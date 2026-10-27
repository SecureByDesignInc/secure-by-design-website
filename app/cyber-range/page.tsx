import RangeFrame from './range-frame';
import './cyber-range.css';
import { sharePreview } from '../share-preview';

export const metadata = {
  title: 'Cyber Range',
  description: 'Test what you know about the Secure By Design lab network: checkpoints, sparring, runs and decks, built from the same systems you configure in the Training Hub. Open to everyone, no account needed.',
  ...sharePreview('Cyber Range | Secure By Design', 'Checkpoints, sparring, runs and decks built from the lab network. Open to everyone.', '/cyber-range'),
};

// The Cyber Range (owner direction, 26 October 2026): an arena for testing what you know, separate from course
// progress and portfolios. The page itself lives in public/range-app/ and runs on /api/range; this route gives it the
// site shell, the way the System Hub hosts its model.
export default function CyberRangePage() {
  return <main id="main" className="cyber-range-page">
    <h1 className="sr-only">Cyber Range</h1>
    <RangeFrame />
    <section className="cyber-range-about" aria-labelledby="cyber-range-about-heading">
      <div className="cyber-range-about-inner">
        <h2 id="cyber-range-about-heading">What the Range is</h2>
        <p>Short rounds built from the same network you configure in the Training Hub. Every system, mode and checkpoint is open from your first visit; nothing unlocks by finishing a course, and nothing you do here touches your training progress or goes into a portfolio. It is a place to find out what you know, with nothing riding on it but your spot on the ladder.</p>
        <ul>
          <li><strong>Checkpoints.</strong> Six resident operators, each with a stack of three lab systems. Take them in any order; a badge on the first win moves you up a tier.</li>
          <li><strong>Sparring and runs.</strong> A bot match with your own stack, or one stack carried through every resident with no repairs between fights.</li>
          <li><strong>Today’s encounter.</strong> The same question as the morning post, one try a day.</li>
          <li><strong>Decks.</strong> Flashcards cut from the lesson checks. Spaced repetition brings each card back right before you’d forget it, and twenty cards reviewed level a system.</li>
        </ul>
        <p>Play as a guest and everything lasts for the visit. Sign in with a free Community account to keep your operator, stack, badges and points, and to appear on the weekly ladder. Live duels between learners are in the works.</p>
      </div>
    </section>
  </main>;
}
