import './community.css';
import { sharePreview } from '../share-preview';
import StateFinder from './state-finder';
import { communityStates, discordUrl, suggestMail } from './community-data';

const description = 'Job leads, training funding and local networking for cybersecurity careers, organized for all 50 states and Washington, DC.';

export const metadata = {
  title: 'Community & Careers',
  description,
  ...sharePreview('Community & Careers | Secure By Design', description, '/community'),
};

const inTheWorks = [
  ['Role pathways', 'Sysadmin, SOC analyst, ISSO and more, mapped to the courses that build each skill.'],
  ['Certification roadmap', 'Which certifications each role asks for, in what order, and where DoD 8140 applies.'],
  ['Portfolio and resume guide', 'Turning your lab work into proof a hiring manager can see.'],
  ['Interview prep', 'Common technical and behavioral questions, and how to talk through your lab work.'],
  ['Spot a fake job posting', 'The warning signs of recruiter scams aimed at people breaking into cyber.'],
  ['Member-shared job leads', 'Leads shared by the community and checked by a moderator before they appear.'],
];

export default function Community() {
  return <main id="main" className="community-page">
    <div className="container">
      <header className="editorial-page-header community-header">
        <p className="eyebrow">Community &amp; Careers</p>
        <h1>Find your people. Find your next role.</h1>
        <p>Job openings, programs that can pay for your training, and places to meet people in the field, organized by state. Built for everyone learning with Secure By Design.</p>
        <div className="community-header-actions">
          <a className="community-button community-button-light" href="#states">Find your state</a>
          <a className="community-button community-button-outline" href={discordUrl} target="_blank" rel="noopener noreferrer">Join the Discord<span className="community-sr"> (opens in a new tab)</span></a>
        </div>
      </header>

      <section id="states" className="community-section" aria-labelledby="states-title">
        <div className="community-section-heading">
          <h2 id="states-title">Find your state</h2>
          <p>Every state page lists where to find state and federal jobs, who can help pay for training, and local groups to join. All 50 states and Washington, DC are here.</p>
        </div>
        <StateFinder states={communityStates.map(({ code, name, slug }) => ({ code, name, slug }))} />
      </section>

      <section className="community-section" aria-labelledby="page-title">
        <div className="community-section-heading">
          <h2 id="page-title">On every state page</h2>
        </div>
        <div className="community-grid">
          <div className="community-card"><h3>Jobs</h3><p>The state's own government job portal and public job board, plus current federal IT and cybersecurity openings.</p></div>
          <div className="community-card"><h3>Paying for training</h3><p>The state workforce agency that runs WIOA training funds and American Job Centers, plus apprenticeships and SkillBridge.</p></div>
          <div className="community-card"><h3>People near you</h3><p>Where to find ISSA, ISC2, ISACA, OWASP, InfraGard, DEF CON groups and BSides events in your state.</p></div>
          <div className="community-card"><h3>The job market</h3><p>Where to see openings, workforce size and in-demand certifications for your state.</p></div>
        </div>
      </section>

      <section className="community-section" aria-labelledby="works-title">
        <div className="community-section-heading">
          <h2 id="works-title">In the works</h2>
          <p>Coming soon to Community &amp; Careers.</p>
        </div>
        <ul className="community-works">
          {inTheWorks.map(([name, text]) => <li key={name}><strong>{name}</strong><span>{text}</span></li>)}
        </ul>
      </section>

      <section className="community-callout" aria-labelledby="help-title">
        <div>
          <h2 id="help-title">Know a group, employer or program we missed?</h2>
          <p>Tell us and we'll add it to the right state page.</p>
        </div>
        <a className="community-button" href={suggestMail()}>Suggest a resource</a>
      </section>
    </div>
  </main>;
}
