import './community.css';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { sharePreview } from '../share-preview';
import StateFinder from './state-finder';
import { communityStates, discordUrl, suggestMail } from './community-data';
import bookingConfig from '../../content/booking.json';
import { bookingLink } from '../../lib/booking.mjs';

const booking = bookingLink(bookingConfig);

const description = 'Job leads, training funding and local networking for cybersecurity careers, organized for all 50 states and Washington, DC.';

export const metadata = {
  title: 'Community & Careers Hub',
  description,
  ...sharePreview('Community & Careers Hub | Secure By Design', description, '/community'),
};

const onEveryPage = [
  ['Jobs', 'The state’s own government job portal and public job board, plus current federal IT and cybersecurity openings.'],
  ['Paying for training', 'The state workforce agency that runs WIOA training funds and American Job Centers, plus apprenticeships and SkillBridge.'],
  ['People near you', 'Where to find ISSA, ISC2, ISACA, OWASP, InfraGard, DEF CON groups and BSides events in your state.'],
  ['The job market', 'Where to see openings, workforce size and in-demand certifications for your state.'],
];

const inTheWorks = [
  ['Role pathways', 'Sysadmin, SOC analyst, ISSO and more, mapped to the courses that build each skill.'],
  ['Certification roadmap', 'Which certifications each role asks for, in what order, and where DoD 8140 applies.'],
  ['Portfolio and resume guide', 'Turning your lab work into proof a hiring manager can see.'],
  ['Interview prep', 'Common technical and behavioral questions, and how to talk through your lab work.'],
  ['Spot a fake job posting', 'The warning signs of recruiter scams aimed at people breaking into cyber.'],
  ['Member-shared job leads', 'Leads shared by the community and checked by a moderator before they appear.'],
];

export default function Community() {
  return <main id="main" className="cm-page">
    <section className="container cm-intro">
      <div>
        <p className="cm-kicker">Community &amp; Careers Hub</p>
        <h1>Find your people.<br /><em>Find your next role.</em></h1>
      </div>
      <div className="cm-intro-copy">
        <p>Job openings, programs that can pay for your training, and places to meet people in the field, organized by state. Built for everyone learning with Secure By Design.</p>
        <div className="cm-intro-links">
          <a href="#states">Find your state <ArrowDown size={16} aria-hidden="true" /></a>
          <a href={discordUrl} target="_blank" rel="noopener noreferrer">Join the Discord <ArrowUpRight size={16} aria-hidden="true" /><span className="cm-sr"> (opens in a new tab)</span></a>
          {booking && <a href={booking.href} target="_blank" rel="noopener noreferrer" data-track="booking_click" data-placement="community_hub">{booking.label} <ArrowUpRight size={16} aria-hidden="true" /><span className="cm-sr"> (opens in a new tab)</span></a>}
        </div>
      </div>
    </section>

    <section id="states" className="container cm-section cm-section-first" aria-labelledby="states-title">
      <div className="cm-heading">
        <div>
          <p className="cm-kicker">Your state</p>
          <h2 id="states-title">Find your state.</h2>
          <p>Each state page lists where to find state and federal jobs, who can help pay for training, and local groups to join.</p>
        </div>
        <span>50 states · Washington, DC</span>
      </div>
      <StateFinder states={communityStates.map(({ code, name, slug }) => ({ code, name, slug }))} />
    </section>

    <section className="container cm-section" aria-labelledby="page-title">
      <div className="cm-heading">
        <div>
          <p className="cm-kicker">On every state page</p>
          <h2 id="page-title">What you’ll find.</h2>
        </div>
      </div>
      <div className="cm-grid">
        {onEveryPage.map(([name, text]) => <div key={name} className="cm-tile"><h3>{name}</h3><p>{text}</p></div>)}
      </div>
    </section>

    <section className="container cm-section" aria-labelledby="works-title">
      <div className="cm-heading">
        <div>
          <p className="cm-kicker">In the works</p>
          <h2 id="works-title">Coming soon to the hub.</h2>
        </div>
      </div>
      <ul className="cm-soon">
        {inTheWorks.map(([name, text]) => <li key={name}><span className="cm-badge">Coming soon</span><strong>{name}</strong><span>{text}</span></li>)}
      </ul>
    </section>

    <div className="container">
      <section className="cm-callout" aria-labelledby="help-title">
        <div>
          <h2 id="help-title">Know a group, employer or program we missed?</h2>
          <p>Tell us and we’ll add it to the right state page.</p>
        </div>
        <a className="cm-button" href={suggestMail()}>Suggest a resource</a>
      </section>
    </div>
  </main>;
}
