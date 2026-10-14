import { notFound } from 'next/navigation';
import '../community.css';
import { sharePreview } from '../../share-preview';
import FederalJobs from '../federal-jobs';
import { chapterDirectories, discordUrl, findState, marketLinks, suggestMail, trainingHelp, usajobsSearch } from '../community-data';

type Params = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Params) {
  const { state: slug } = await params;
  const state = findState(slug);
  const title = state ? `${state.name} cybersecurity careers` : 'State page';
  const description = state
    ? `Where to find state and federal cybersecurity jobs in ${state.name}, programs that can pay for training, and local security groups.`
    : '';
  return { title, description, ...sharePreview(`${title} | Secure By Design`, description, `/community/${slug}`) };
}

const External = ({ href, children }: { href: string; children: React.ReactNode }) =>
  <a href={href} target="_blank" rel="noopener noreferrer">{children}<span className="community-sr"> (opens in a new tab)</span></a>;

export default async function StatePage({ params }: Params) {
  const { state: slug } = await params;
  const state = findState(slug);
  if (!state) notFound();
  const { name } = state;
  const sameBoard = state.jobBoard && state.stateJobs && state.jobBoard.url === state.stateJobs.url;

  return <main id="main" className="community-page">
    <div className="container">
      <header className="editorial-page-header community-header">
        <a className="back-link" href="/community">← All states</a>
        <p className="eyebrow">Community &amp; Careers · State page</p>
        <h1>{name}</h1>
        <p>Where to look for cybersecurity work in {name}, who can help pay for your training, and where to meet people in the field.</p>
        <div className="community-header-actions">
          <a className="community-button community-button-outline" href={discordUrl} target="_blank" rel="noopener noreferrer">Join the Discord<span className="community-sr"> (opens in a new tab)</span></a>
        </div>
      </header>

      <nav className="community-toc" aria-label="On this page">
        <a href="#jobs">Jobs</a><a href="#federal">Federal openings</a><a href="#training">Paying for training</a><a href="#people">People near you</a><a href="#market">Job market</a>
      </nav>

      <section id="jobs" className="community-section" aria-labelledby="jobs-title">
        <div className="community-section-heading">
          <h2 id="jobs-title">Find a job in {name}</h2>
        </div>
        <div className="community-grid">
          {state.stateJobs ? <div className="community-card">
            <h3>State government jobs</h3>
            <p>{sameBoard ? `${name} lists state government openings on its public job board.` : `Openings with ${name} state agencies, including IT and security roles.`}</p>
            <p className="community-card-link"><External href={state.stateJobs.url}>{state.stateJobs.label}</External></p>
          </div> : null}
          {state.jobBoard && !sameBoard ? <div className="community-card">
            <h3>State job board</h3>
            <p>The state's free public job board, with private-sector and public openings.</p>
            <p className="community-card-link"><External href={state.jobBoard.url}>{state.jobBoard.label}</External></p>
          </div> : null}
          <div className="community-card">
            <h3>Federal jobs</h3>
            <p>Federal cybersecurity openings in {name} on USAJOBS, the federal government's job site.</p>
            <p className="community-card-link"><External href={usajobsSearch(state)}>Search USAJOBS for {name}</External></p>
          </div>
        </div>
      </section>

      <section id="federal" className="community-section" aria-labelledby="federal-title">
        <div className="community-section-heading">
          <h2 id="federal-title">Federal openings in {name}</h2>
          <p>Recent federal IT and cybersecurity openings (series 2210) from USAJOBS. Each one opens the official posting.</p>
        </div>
        <FederalJobs code={state.code} name={name} searchUrl={usajobsSearch(state)} />
      </section>

      <section id="training" className="community-section" aria-labelledby="training-title">
        <div className="community-section-heading">
          <h2 id="training-title">Get help paying for training</h2>
          <p>Programs that can pay for certifications or training, or pay you while you learn.</p>
        </div>
        <div className="community-grid">
          {state.workforceAgency ? <div className="community-card">
            <h3>WIOA training funds and job centers</h3>
            <p>Your state workforce agency runs the American Job Centers, where you can ask about Workforce Innovation and Opportunity Act (WIOA) funding for approved training.</p>
            <p className="community-card-link"><External href={state.workforceAgency.url}>{state.workforceAgency.label}</External></p>
          </div> : null}
          {trainingHelp.map(item => <div key={item.name} className="community-card">
            <h3>{item.name}</h3><p>{item.text}</p>
            <p className="community-card-link"><External href={item.url}>Open {item.name}</External></p>
          </div>)}
        </div>
      </section>

      <section id="people" className="community-section" aria-labelledby="people-title">
        <div className="community-section-heading">
          <h2 id="people-title">Meet people near you</h2>
          <p>Each directory lists chapters and events by location. Look for {name}, or the nearest city.</p>
        </div>
        <ul className="community-directory">
          {chapterDirectories.map(item => <li key={item.name}>
            <External href={item.url}>{item.name}</External>
            <span>{item.text}</span>
          </li>)}
        </ul>
      </section>

      <section id="market" className="community-section" aria-labelledby="market-title">
        <div className="community-section-heading">
          <h2 id="market-title">Know the job market</h2>
        </div>
        <div className="community-grid">
          {marketLinks.map(item => <div key={item.name} className="community-card">
            <h3>{item.name}</h3><p>{item.text}</p>
            <p className="community-card-link"><External href={item.url}>Open {item.name}</External></p>
          </div>)}
        </div>
      </section>

      <section className="community-callout" aria-labelledby="help-title">
        <div>
          <h2 id="help-title">Help build the {name} page</h2>
          <p>Know a local chapter, meetup, employer or training program in {name}? Tell us and we'll add it. Member features, like profiles and members near you, are coming soon.</p>
        </div>
        <a className="community-button" href={suggestMail(state)}>Suggest a resource</a>
      </section>
    </div>
  </main>;
}
