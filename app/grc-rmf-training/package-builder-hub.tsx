'use client';

// The ATO Package Builder Hub (owner direction, 19 October 2026): the ATO Package Builder as its own section. The
// training it used to hold (course 2.1 "RMF to ATO" and the ATO Template Library) lives in the Training Hub
// (/technical-training); each RMF step here links back to its lessons and templates there.
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardCheck, FileText, Network } from 'lucide-react';
import atoTemplates from '../../content/ato-templates.json';
import type { Library } from '../videos/catalog-types';

const BUILDER = '/grc-rmf-training/workspace';
const TRAINING_HUB = '/technical-training';
const COURSE_IN_HUB = '/technical-training#course/rmf-boe-ato';
const TEMPLATES = '/grc-rmf-training/templates';
const RMF_GUIDE = '/grc-rmf-training/rmf/index.html#catalog/01';

// The seven RMF steps of course 2.1 "RMF to ATO", in the ATO Package Builder's order. modules mirrors COURSE_STEP_MODULES in
// lib/authorization/model.mjs; it is repeated here because importing that file would load the full control index into this page.
// task describes the step's work in the builder, in the same terms as the builder's own checks (phases() and issmReview()).
const RMF_STEPS = [
  { id: 'prepare', title: 'Prepare', modules: ['01', '02'], task: 'Register the Secure By Design enclave, describe it and its authorization boundary, and name everyone in an authorization role.' },
  { id: 'categorize', title: 'Categorize', modules: ['03'], task: 'Add its information types, set the confidentiality, integrity and availability impacts, and explain the categorization.' },
  { id: 'select', title: 'Select', modules: ['04'], task: 'Select the controls in scope from NIST SP 800-53 Rev. 5 and explain how they were chosen and tailored.' },
  { id: 'implement', title: 'Implement', modules: ['05', '06'], task: 'Write an implementation statement for each control, link the evidence that proves it, and submit it to the assessor.' },
  { id: 'assess', title: 'Assess', modules: ['07', '08', '09'], task: 'In the assessor’s seat, record a result for every assessment objective, validate or return each control, and plan every weakness in the POA&M.' },
  { id: 'authorize', title: 'Authorize', modules: ['10', '11'], task: 'Write the executive summary and route the package through the ISSM, the assessor and the Authorizing Official to a decision.' },
  { id: 'monitor', title: 'Monitor', modules: ['12'], task: 'Keep the authorization current: track the termination date, overdue POA&M milestones, changes, reassessments and the annual review.' },
];
// The ATO Template Library has no Authorize section, so that step gets its own description.
const AUTHORIZE_NOTE = 'Assemble the authorization package, take it through review, and record the Authorizing Official’s decision and its termination date.';

// What the builder keeps for a learner's enclave (docs/authorization-workspace.md).
const KEEPS = [
  { title: 'System record and controls', text: 'The enclave, its boundary, its roles, its categorization and the controls in scope.' },
  { title: 'Body of Evidence', text: 'Each control’s implementation statement and the evidence linked to it.' },
  { title: 'POA&M', text: 'Every weakness from the assessment, with its milestones.' },
  { title: 'Approval chain and decision', text: 'The ISSM, assessor and Authorizing Official reviews, and the decision with its termination date.' },
  { title: 'Continuous monitoring', text: 'Termination dates, overdue milestones, changes, reassessments and the annual review.' },
];

type RmfStage = { number: string; title: string; href: string };
type RmfCourse = { id: string; stages?: RmfStage[]; training?: { guide?: string } };
const findRmfCourse = (library: Library) => ((library as unknown as { courses?: RmfCourse[] }).courses ?? []).find(entry => entry.id === 'rmf-boe-ato');

function BuilderPanel({ library }: { library: Library }) {
  const [active, setActive] = useState(0);
  const detail = useRef<HTMLDivElement>(null);
  const course = findRmfCourse(library);
  const stages = course?.stages ?? [];
  const step = RMF_STEPS[active];
  const group = atoTemplates.groups.find(item => item.id === step.id);
  const official = atoTemplates.templates.filter(item => item.group === step.id);
  // The control-family practice plans (20 October 2026) show as one line per step, so the list stays short.
  const familyPlan = (href: string) => /SBD-Training-(?!CM-)[A-Z]{2}-Plan\.docx$/.test(href);
  const samples = atoTemplates.samples.filter(item => item.group === step.id && !familyPlan(item.href));
  const plans = atoTemplates.samples.filter(item => item.group === step.id && familyPlan(item.href));
  const previous = RMF_STEPS[active - 1];
  const next = RMF_STEPS[active + 1];
  const range = (modules: string[]) => modules.length === 1 ? `Module ${modules[0]}` : `Modules ${modules[0]}–${modules[modules.length - 1]}`;
  // On phones the steps stack above the detail, so a tap scrolls the detail into view.
  const choose = (index: number, scroll = false) => {
    setActive(index);
    if (scroll && window.matchMedia('(max-width: 520px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() => detail.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
    }
  };

  return (
    <section id="package-builder" className="container ab-panel" aria-labelledby="ab-title">
      <div className="ab-shell">
        <div className="ab-head">
          <div>
            <p className="vc-kicker">THE SEVEN RMF STEPS</p>
            <h2 id="ab-title">Do each step on the network you built.</h2>
            <p>Pick a step to see its lessons in course 2.1, the same task in the builder, and the templates it uses.</p>
          </div>
          <Link className="ab-open" href={BUILDER}>Open the package builder <ArrowRight size={17} /></Link>
        </div>
        <ol className="ab-steps" aria-label="The seven RMF steps">
          {RMF_STEPS.map((item, index) => (
            <li key={item.id}>
              <button type="button" aria-pressed={index === active} aria-controls="ab-step-detail" onClick={() => choose(index, true)}>
                <span className="ab-step-num">{String(index + 1).padStart(2, '0')}</span>
                <span className="ab-step-title">{item.title}</span>
                <span className="ab-step-meta">{range(item.modules)}</span>
              </button>
            </li>
          ))}
        </ol>
        <div id="ab-step-detail" className="ab-detail" ref={detail}>
          <div className="ab-detail-head">
            <p className="vc-kicker">STEP {active + 1} OF {RMF_STEPS.length}</p>
            <h3>{step.title}</h3>
            <p>{group?.note ?? AUTHORIZE_NOTE}</p>
          </div>
          <div className="ab-columns">
            <section className="ab-column" aria-labelledby="ab-learn">
              <BookOpen size={24} strokeWidth={1.5} aria-hidden="true" />
              <h4 id="ab-learn">Learn it in the Training Hub</h4>
              <ul>
                {step.modules.map(number => {
                  const stage = stages.find(item => item.number === number);
                  return <li key={number}><a href={stage?.href ?? `/grc-rmf-training/rmf/index.html#catalog/${number}`}>{number} · {stage?.title ?? `Module ${number}`}</a></li>;
                })}
              </ul>
              <a className="ab-link" href={`/grc-rmf-training/rmf/index.html#step/${step.id}`}>Open the {step.title} step in course 2.1 <ArrowRight size={15} /></a>
            </section>
            <section className="ab-column" aria-labelledby="ab-do">
              <ClipboardCheck size={24} strokeWidth={1.5} aria-hidden="true" />
              <h4 id="ab-do">Do it in the builder</h4>
              <p>{step.task}</p>
              <Link className="ab-link" href={BUILDER}>Open the package builder <ArrowRight size={15} /></Link>
            </section>
            <section className="ab-column" aria-labelledby="ab-use">
              <FileText size={24} strokeWidth={1.5} aria-hidden="true" />
              <h4 id="ab-use">Use its templates</h4>
              {group ? <>
                <ul>
                  {official.map(item => <li key={item.title}>{item.title}</li>)}
                  {samples.map(item => <li key={item.href}>{item.title}<span className="ab-tag">Training sample</span></li>)}
                  {plans.length > 0 && <li key="family-plans">{plans.length === 1 ? plans[0].title : `${plans.length} control family plans (${plans.map(item => /SBD-Training-([A-Z]{2})-Plan/.exec(item.href)?.[1]).join(', ')})`}<span className="ab-tag">Training sample</span></li>}
                </ul>
                <Link className="ab-link" href={`${TEMPLATES}#${step.id}`}>Open the {step.title} templates in the Training Hub <ArrowRight size={15} /></Link>
              </> : <>
                <p>The library has no separate Authorize section. The package draws on the documents from the earlier steps: the SSP, the assessment results and the POA&amp;M.</p>
                <Link className="ab-link" href={TEMPLATES}>Open the ATO Template Library in the Training Hub <ArrowRight size={15} /></Link>
              </>}
            </section>
          </div>
          <div className="ab-pager">
            {previous ? <button type="button" onClick={() => choose(active - 1, true)}><ArrowLeft size={15} aria-hidden="true" />Previous: {previous.title}</button> : <span />}
            {next ? <button type="button" onClick={() => choose(active + 1, true)}>Next: {next.title}<ArrowRight size={15} aria-hidden="true" /></button> : <span />}
          </div>
        </div>
        <div className="ab-course">
          <p><BookOpen size={16} aria-hidden="true" />The whole course lives in the Training Hub: 2.1, RMF to ATO</p>
          <ul aria-label="Course 2.1 in the Training Hub">
            <li><Link href={COURSE_IN_HUB}>Open course 2.1 in the Training Hub</Link></li>
            <li><a href={course?.training?.guide ?? RMF_GUIDE}>Start from module 01</a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function PackageBuilderHub({ library }: { library: Library }) {
  return (
    <main id="main" className="vc-page bh-page">
      <section className="container vc-intro">
        <div>
          <p className="vc-kicker">ATO PACKAGE BUILDER HUB · PRACTICE TOOL</p>
          <h1>
            Take a system to an ATO.
            <br />
            <em>One RMF step at a time.</em>
          </h1>
        </div>
        <div className="vc-intro-copy">
          <p>Register the Secure By Design enclave in the ATO Package Builder and take it through all seven RMF steps, from naming its roles to the Authorizing Official’s decision and continuous monitoring. Each step links to its lessons and templates in the Training Hub. Your work is saved privately to your account.</p>
          <div className="vc-intro-actions">
            <Link className="vc-intro-primary" href={BUILDER}>Open the package builder <ArrowRight size={16} /></Link>
            <Link href={COURSE_IN_HUB}>Learn each step in the Training Hub <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
      <BuilderPanel library={library} />
      <section className="container bh-keeps" aria-labelledby="bh-keeps-title">
        <h2 id="bh-keeps-title">What the builder keeps for your enclave</h2>
        <ul>
          {KEEPS.map(item => <li key={item.title}><h3>{item.title}</h3><p>{item.text}</p></li>)}
        </ul>
        <p className="bh-note">The reviews and the decision are automated practice rules and carry no authority. Enter practice data only.</p>
      </section>
      <div className="container vc-library-footer">
        <p>
          <Network size={20} />
          Authorize the network you built.
        </p>
        <Link href={TRAINING_HUB}>
          Build it first in the Training Hub <ArrowRight size={17} />
        </Link>
      </div>
    </main>
  );
}
