// The ATO Package Builder inside the Training Hub (owner direction, 27 October 2026). The separate ATO Package Builder
// Hub page (/grc-rmf-training) is retired and redirects here (#ato-package-builder); its seven-step overview is the
// Network Authorization panel below. The builder itself keeps its full page, /grc-rmf-training/workspace.
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Network } from 'lucide-react';
import atoTemplates from '../../content/ato-templates.json';
import type { Library } from './catalog-types';

export const BUILDER = '/grc-rmf-training/workspace';
const TEMPLATES = '/grc-rmf-training/templates';

// The seven RMF steps of course 2.1 "RMF to ATO", in the ATO Package Builder's order. modules are the course's module
// numbers for each step (COURSE_STEP_MODULES in lib/authorization/model.mjs, repeated here so this page does not load the
// control index). task describes the step's work in
// the builder, in the same terms as the builder's own checks (phases() and issmReview() in lib/authorization/model.mjs).
export const RMF_STEPS = [
  { id: 'prepare', modules: ['01', '02'], title: 'Prepare', task: 'Register the Secure By Design enclave, describe it and its boundary, and name everyone in an authorization role.' },
  { id: 'categorize', modules: ['03'], title: 'Categorize', task: 'Add its information types, set the confidentiality, integrity and availability impacts, and explain the categorization.' },
  { id: 'select', modules: ['04'], title: 'Select', task: 'Select the controls in scope from NIST SP 800-53 Rev. 5 and explain how they were chosen and tailored.' },
  { id: 'implement', modules: ['05', '06'], title: 'Implement', task: 'Write an implementation statement for each control, link its evidence, and submit it to the assessor.' },
  { id: 'assess', modules: ['07', '08', '09'], title: 'Assess', task: 'Record a result for every assessment objective, validate or return each control, and plan every weakness in the POA&M.' },
  { id: 'authorize', modules: ['10', '11'], title: 'Authorize', task: 'Write the executive summary and route the package through the ISSM, the assessor and the Authorizing Official to a decision.' },
  { id: 'monitor', modules: ['12'], title: 'Monitor', task: 'Keep the authorization current: termination date, overdue milestones, changes, reassessments and the annual review.' },
];

export function HubTools() {
  return (
    <section id="ato-package-builder" className="th-tools" aria-labelledby="th-tools-title" data-hub-tools="">
      <h2 id="th-tools-title" className="th-shelf-title">Tools</h2>
      <div className="th-tools-grid">
        <article className="th-tools-card th-tools-builder">
          <p className="th-tools-kicker"><ClipboardCheck size={15} aria-hidden="true" />Tool · No account needed</p>
          <h3>ATO Package Builder</h3>
          <p>Take the Secure By Design enclave through all seven RMF steps, from naming its roles to the authorization decision. Sign in to save your work, or use it without an account for one visit.</p>
          <div className="th-tools-actions">
            <Link className="th-primary" href={BUILDER}>Open the builder</Link>
            <a className="th-secondary" href="#rmf-steps">How it follows the RMF</a>
          </div>
        </article>
        <article className="th-tools-card">
          <p className="th-tools-kicker"><Network size={15} aria-hidden="true" />Tool</p>
          <h3>System Hub</h3>
          <p>Explore every system in the lab network and follow the traffic between them.</p>
          <div className="th-tools-actions"><Link className="th-text-link" href="/inside-the-network">Open the System Hub <ArrowRight size={14} aria-hidden="true" /></Link></div>
        </article>
      </div>
    </section>
  );
}

type RmfStage = { number: string; title: string; href: string };
type RmfCourse = { id: string; stages?: RmfStage[] };

export function RmfStepsPanel({ library }: { library: Library }) {
  const course = ((library as unknown as { courses?: RmfCourse[] }).courses ?? []).find(entry => entry.id === 'rmf-boe-ato');
  const stages = course?.stages ?? [];
  const samples = (id: string) => atoTemplates.samples.filter(item => item.group === id).length;
  return (
    <section id="rmf-steps" className="th-rmf" aria-labelledby="th-rmf-title" data-hub-rmf-steps="">
      <p className="th-tools-kicker">Network Authorization · Course 2.1 RMF to ATO</p>
      <h2 id="th-rmf-title" className="th-shelf-title">Seven RMF steps: learn it, do it, use its templates</h2>
      <p className="th-rmf-intro">Each step links to its lesson in course 2.1, its task in the ATO Package Builder, and its section of the ATO Template Library.</p>
      <div className="th-rmf-table" role="table" aria-label="The seven RMF steps">
        <div className="th-rmf-row th-rmf-head" role="row">
          <span role="columnheader">Step</span><span role="columnheader">Learn it</span><span role="columnheader">Do it in the builder</span><span role="columnheader">Templates</span>
        </div>
        {RMF_STEPS.map((step, index) => {
          const modules = stages.filter(stage => step.modules.includes(stage.number));
          const count = samples(step.id);
          return (
            <div className="th-rmf-row" role="row" key={step.id} data-rmf-step={step.id}>
              <span role="cell" className="th-rmf-step"><b>{index + 1}</b>{step.title}</span>
              <span role="cell" className="th-rmf-learn">{modules.length ? modules.map(stage => <Link key={stage.number} href={stage.href}>{stage.number} · {stage.title}</Link>) : 'Course 2.1'}</span>
              <span role="cell">{step.task} <Link className="th-text-link" href={BUILDER}>Open the builder</Link></span>
              {/* Official sources are coming soon (21 October 2026); the training samples are ready. */}
              <span role="cell" className="th-rmf-templates"><span className="th-tag-soon">Official sources · Coming soon</span><Link href={`${TEMPLATES}#${step.id}`}>{count ? `${count} training sample${count === 1 ? '' : 's'}` : 'Template Library section'}</Link></span>
            </div>
          );
        })}
      </div>
      <p className="th-rmf-note">The reviews and the decision are automated practice rules and carry no authority. Enter practice data only.</p>
    </section>
  );
}
