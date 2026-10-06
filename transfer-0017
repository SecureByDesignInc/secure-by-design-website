'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, FileCheck2, ShieldCheck, Terminal } from 'lucide-react';

const technicalSteps = [
  ['01', 'What Is Active Directory?', 'Start with identity, access, and the services behind a normal workday.', '/blog/what-is-active-directory'],
  ['02', 'Domains, Forests, OUs, and Trusts', 'Understand the boundaries used to organize and manage an environment.', '/blog/domains-forests-ous-and-trusts'],
  ['03', 'Users, Groups, and Permissions', 'Follow an access problem from sign-in to the resource itself.', '/blog/users-groups-and-permissions'],
  ['04', 'Group Policy', 'See how settings reach users and systems—and how to check the result.', '/blog/understanding-group-policy'],
  ['05', 'Replication and FSMO Roles', 'Learn how domain controllers share changes and divide special responsibilities.', '/blog/replication-and-fsmo-roles'],
  ['06', 'Securing Active Directory', 'Build on the fundamentals with administration, detection, and recovery.', '/blog/securing-active-directory'],
];

const paths = [
  { id: 'compliance', label: 'Compliance Blog', summary: 'Risk, decisions, controls, and evidence' },
  { id: 'technical', label: 'Technical Blog', summary: 'Systems, identity, administration, and security' },
] as const;

export default function BlogHub() {
  const [selected, setSelected] = useState<'compliance' | 'technical'>('compliance');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeys(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + paths.length) % paths.length;
    setSelected(paths[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return <main id="main" className="blogs-hub">
    <section className="blogs-intro" aria-labelledby="blogs-title">
      <div className="container blogs-intro-copy">
        <p className="blogs-kicker">SECURITY JOURNAL / CHOOSE YOUR PATH</p>
        <div><h1 id="blogs-title">Security Journal<br/><span>Technical depth. Compliance clarity.</span></h1><p>Thoughtful, practical writing for readers who want to understand how systems work and how security decisions become defensible. Choose the path that matches your question.</p></div>
      </div>
    </section>

    <div className="container blogs-workspace">
      <div className="blog-path-tabs" role="tablist" aria-label="Choose a Security Journal path">
        {paths.map((path, index) => <button
          key={path.id}
          ref={element => { tabRefs.current[index] = element; }}
          type="button"
          role="tab"
          id={`${path.id}-blog-tab`}
          aria-selected={selected === path.id}
          aria-controls={`${path.id}-blog-panel`}
          tabIndex={selected === path.id ? 0 : -1}
          onClick={() => setSelected(path.id)}
          onKeyDown={event => handleKeys(event, index)}
        ><span>PATH {String(index + 1).padStart(2, '0')}</span><b>{path.label}</b><small>{path.summary}</small></button>)}
      </div>

      <section id="compliance-blog-panel" role="tabpanel" aria-labelledby="compliance-blog-tab" hidden={selected !== 'compliance'} className="blog-path-panel">
        <header className="blog-path-heading">
          <div className="blog-path-icon"><ShieldCheck size={30} strokeWidth={1.4}/></div>
          <div><p className="blogs-kicker">DECISIONS &amp; ASSURANCE</p><h2>Understand how security decisions become defensible.</h2><p>Use the Compliance Blog to work through mission, risk, control selection, accountability, assessment, authorization, and the evidence that connects them.</p></div>
        </header>
        <div className="blog-agenda-grid">
          <article className="blog-agenda-card">
            <span>THIS PATH HELPS YOU</span>
            <ul><li>Understand why a security requirement applies.</li><li>Connect NIST guidance to SAP-specific implementation direction.</li><li>Explain what evidence supports a risk decision.</li></ul>
          </article>
          <article className="blog-start-card">
            <FileCheck2 size={26} strokeWidth={1.4}/><span>START HERE</span><h3>RMF Guide &amp; Evidence</h3><p>Read the full seven-phase Risk Management Framework (RMF) walkthrough, use the diagrams and artifact guidance, and explore authorization, evidence maintenance, source documents, and other security approaches in one guide.</p><a href="/rmf-series">Explore the guide <ArrowRight size={17}/></a>
          </article>
        </div>
      </section>

      <section id="technical-blog-panel" role="tabpanel" aria-labelledby="technical-blog-tab" hidden={selected !== 'technical'} className="blog-path-panel">
        <header className="blog-path-heading">
          <div className="blog-path-icon"><Terminal size={30} strokeWidth={1.4}/></div>
          <div><p className="blogs-kicker">SYSTEMS &amp; OPERATIONS</p><h2>Understand what the technology does—and what to check when it doesn’t.</h2><p>Use the Technical Blog to explore systems, identity, administration, troubleshooting, and security through practical explanations that stay focused on the technology.</p></div>
        </header>
        <div className="blog-agenda-grid">
          <article className="blog-agenda-card">
            <span>THIS PATH HELPS YOU</span>
            <ul><li>Build a useful mental model before memorizing commands.</li><li>Follow dependencies across identity, systems, and services.</li><li>Connect configuration choices to day-to-day operations.</li></ul>
          </article>
          <article className="blog-start-card technical">
            <BookOpen size={26} strokeWidth={1.4}/><span>CURRENT SERIES</span><h3>Active Directory Foundations</h3><p>Follow the identities, systems, and services behind a normal workday.</p><a href="/blog/what-is-active-directory">Start the series <ArrowRight size={17}/></a>
          </article>
        </div>
        <div className="blog-sequence-heading"><div><span>THE READING PATH</span><h3>Start with the purpose. Then follow how the pieces connect.</h3></div><small>6 chapters</small></div>
        <ol className="blog-sequence">{technicalSteps.map(([number, title, question, href]) => <li key={href}><a href={href}><span>{number}</span><div><b>{title}</b><p>{question}</p></div><ArrowUpRight size={17}/></a></li>)}</ol>
        <nav className="blog-path-links" aria-label="More Technical Blog destinations"><a href="/blog">Browse all technical articles <ArrowUpRight size={16}/></a><a href="/blog/active-directory-certificate-services">Explore Active Directory Certificate Services <ArrowUpRight size={16}/></a></nav>
      </section>
    </div>
  </main>;
}
