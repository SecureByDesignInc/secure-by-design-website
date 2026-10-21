// The full ATO Template Library page (/grc-rmf-training/templates), in the Training Hub (owner direction, 19 October 2026). Since 15 October 2026 it is part of course 2.1
// "RMF to ATO" (/grc-rmf-training/rmf/): each step page there lists its own sources and samples and links here by #<step>. Owner direction, 15 October 2026: the
// library lists only documents verified as publicly released by an official publisher, arranged by RMF step and
// linked to the publisher's own copy. Owner direction, 21 October 2026: the official sources are being revised, so every
// RMF step is one "Coming soon" card in the design of the Training Hub's coming-soon tiles (SBD-EPO01, SBD-NESSUS01), with
// no publisher, version, date or link. The Secure By Design training samples section is unchanged.
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import templates from '../../../content/ato-templates.json';
import TemplateEntry, { SampleEntry, StepSoonCard } from '../../videos/template-entry';
import { officialFor } from '../../videos/template-labels';

export default function TemplateLibrary() {
  const groups = templates.groups.map(group => ({ ...group, items: officialFor(group.id) }));
  const soon = groups.filter(group => group.items.length === 0);
  const listed = groups.filter(group => group.items.length > 0);

  return (
    <main id="main" className="vc-page tl-page">
      <section className="container vc-intro">
        <div>
          <p className="vc-kicker"><Link href="/technical-training#templates-references">TRAINING HUB</Link> · TEMPLATES</p>
          <h1>
            ATO Template Library.
            <br />
            <em>Sources coming soon.</em>
          </h1>
        </div>
        <div className="vc-intro-copy">
          <p>
            Templates for building an authorization package, arranged by RMF step. The official sources for each step are
            coming soon. The Secure By Design training samples below are ready to use now.
          </p>
          <Link href="/grc-rmf-training/rmf/index.html#step/prepare">Open course 2.1 by RMF step <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section id="template-list" className="container vc-library" aria-labelledby="template-list-title">
        <div className="vc-library-heading">
          <div>
            <p className="vc-kicker">THE BODY OF EVIDENCE</p>
            <h2 id="template-list-title">Official sources by RMF step.</h2>
          </div>
          {soon.length > 0 && <span className="tl-soon-note"><Clock size={13} aria-hidden="true" />Coming soon</span>}
        </div>

        {soon.length > 0 && <div className="th-grid tl-step-grid">
          {soon.map(group => <StepSoonCard key={group.id} group={group} />)}
        </div>}

        {listed.map(group => (
          <section key={group.id} id={group.id} className="tl-group" aria-labelledby={`${group.id}-title`}>
            <div className="vc-category-heading">
              <div>
                <h3 id={`${group.id}-title`}>{group.title} <span className="tl-abbr">{group.abbr}</span></h3>
                <p>{group.note}</p>
              </div>
              <span>{group.items.length} entr{group.items.length === 1 ? 'y' : 'ies'}</span>
            </div>
            <ul className="vc-library-list tl-list">
              {group.items.map(item => <TemplateEntry key={item.title} item={item} heading="h4" />)}
            </ul>
          </section>
        ))}

        <section id="training-samples" className="tl-group tl-samples" aria-labelledby="training-samples-title">
          <div className="vc-category-heading">
            <div>
              <p className="vc-kicker">SECURE BY DESIGN TRAINING SAMPLES</p>
              <h3 id="training-samples-title">Practice templates <span className="tl-abbr">Not official forms</span></h3>
              <p>
                No public DoD or JSIG version exists for these documents, so Secure By Design wrote practice versions from
                the public JSIG, CNSSI 1253 and NIST guidance named on each. They are not DoD, DCSA, PSO or AO forms. Fill
                them in with fictional data only, and use your AO&apos;s and PSO&apos;s templates on a real system.
              </p>
            </div>
            <span>{templates.samples.length} files</span>
          </div>
          <ul className="vc-library-list tl-list">
            {templates.samples.map(item => <SampleEntry key={item.href} item={item} heading="h4" />)}
          </ul>
        </section>

        <div className="vc-library-footer">
          <p>Training samples © 2026 Secure By Design Team LLC.</p>
          <Link href="/technical-training#templates-references">
            <ArrowLeft size={17} /> Back to the Training Hub
          </Link>
        </div>
      </section>
    </main>
  );
}
