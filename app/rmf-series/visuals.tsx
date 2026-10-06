import { Fragment } from 'react';
import { stages } from '../../content/rmf';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import './visuals.css';

const stepNames = Object.fromEntries(stages.map(stage => [stage.slug, stage.name]));

/** Original, code-native diagram; chapter links retain native keyboard navigation. */
export function RmfCycle({ current, withinGuide = false }: { current?: string; withinGuide?: boolean }) {
  const instance = current || 'overview';
  const point = (angle: number) => ({ x: 190 + Math.cos(angle) * 120, y: 170 + Math.sin(angle) * 120 });
  return <figure className="rmf-cycle" aria-labelledby={`cycle-caption-${instance}`}>
    <figcaption id={`cycle-caption-${instance}`}>{current ? 'Where we are in the cycle' : 'The RMF at a glance'}</figcaption>
    <svg viewBox="0 0 380 338" className="rmf-cycle-wheel" aria-labelledby={`cycle-title-${instance} cycle-desc-${instance}`}>
      <title id={`cycle-title-${instance}`}>{`Risk Management Framework cycle${current ? `: ${stepNames[current]}` : ''}`}</title>
      <desc id={`cycle-desc-${instance}`}>Clockwise: Prepare, Categorize, Select, Implement, Assess, Authorize, and Monitor. Each phase links to its {withinGuide ? 'section in this guide' : 'chapter'}. Changes can require returning to earlier phases.</desc>
      <defs><marker id={`cycle-arrow-${instance}`} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L5,3 L0,6" fill="none" stroke="currentColor" strokeWidth="1.25"/></marker></defs>
      <circle cx="190" cy="170" r="65" className="rmf-cycle-center"/>
      <text x="190" y="157" textAnchor="middle" className="rmf-cycle-center-label">{current ? 'CURRENT PHASE' : 'NIST'}</text>
      <text x="190" y="187" textAnchor="middle" className="rmf-cycle-center-name">{current ? stepNames[current] : 'RMF'}</text>
      {stages.map((stage, i) => {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / 7;
        const start = point(angle + .3);
        const end = point(angle + Math.PI * 2 / 7 - .29);
        return <path key={stage.slug} d={`M${start.x} ${start.y} A120 120 0 0 1 ${end.x} ${end.y}`} className="rmf-cycle-connector" markerEnd={`url(#cycle-arrow-${instance})`}/>;
      })}
      {stages.map((stage, i) => {
        const node = point(-Math.PI / 2 + i * Math.PI * 2 / 7);
        const active = current === stage.slug;
        const width = stage.slug === 'assess' ? 80 : 116;
        return <a key={stage.slug} href={withinGuide ? `#${stage.slug}` : `/rmf-series/${stage.slug}`} aria-label={`${stage.name} ${withinGuide ? 'guidance and evidence' : 'chapter'}${active ? ', current phase' : ''}`} aria-current={active ? 'page' : undefined} className="rmf-cycle-node">
          <rect x={node.x - width / 2} y={node.y - 20} width={width} height="40" rx="8"/>
          <text x={node.x} y={node.y + 7} textAnchor="middle">{stage.name}</text>
        </a>;
      })}
    </svg>
    <p className="rmf-cycle-note">Follow the cycle, and revisit earlier decisions when something changes.</p>
  </figure>;
}

function Node({ title, detail, accent = false }: { title: string; detail: string; accent?: boolean }) {
  return <div className={`rmf-visual-node${accent ? ' is-outcome' : ''}`}><strong>{title}</strong><span>{detail}</span></div>;
}
function Arrow({ down = false }: { down?: boolean }) { return <span className={down ? 'rmf-flow-arrow is-down' : 'rmf-flow-arrow'} aria-hidden="true">{down ? '↓' : '→'}</span>; }
function Flow({ items }: { items: { title: string; detail: string }[] }) {
  return <div className="rmf-visual-flow">{items.map((item, i) => <Fragment key={item.title}>{i > 0 && <Arrow/>}<Node {...item}/></Fragment>)}</div>;
}

function PrepareMap() {
  return <div className="rmf-prepare-map">
    <Node title="Mission & priorities" detail="What work must the organization accomplish?" accent/>
    <div className="rmf-visual-fork" aria-hidden="true"><span/><span/></div>
    <div className="rmf-visual-pair"><Node title="Stakeholders" detail="Who depends on the system and understands the risk?"/><Node title="Scope & dependencies" detail="What information, services, and boundaries matter?"/></div>
    <div className="rmf-visual-join" aria-hidden="true"><span/><span/></div>
    <Node title="Responsibilities & shared context" detail="Agree who owns decisions, implements safeguards, and supplies evidence."/>
  </div>;
}

function ImpactMatrix() {
  return <div className="rmf-impact-matrix">
    <div className="rmf-impact-scroll" tabIndex={0} role="region" aria-label="Impact matrix; scroll horizontally on small screens">
      <Table className="rmf-impact-table">
        <TableHeader><TableRow><TableHead scope="col">Security objective</TableHead><TableHead scope="col">Low</TableHead><TableHead scope="col">Moderate</TableHead><TableHead scope="col">High</TableHead></TableRow></TableHeader>
        <TableBody>{[
          ['Confidentiality', 'Unauthorized disclosure'], ['Integrity', 'Unauthorized modification or destruction'], ['Availability', 'Loss of access or use'],
        ].map(([title, description]) => <TableRow key={title}><TableHead scope="row"><strong>{title}</strong><span>{description}</span></TableHead><TableCell>Limited<br/>adverse effect</TableCell><TableCell>Serious<br/>adverse effect</TableCell><TableCell>Severe or catastrophic adverse effect</TableCell></TableRow>)}</TableBody>
      </Table>
    </div>
    <div className="rmf-matrix-result"><span aria-hidden="true">↓</span><p><strong>Document each impact level and its rationale.</strong> Use the categorization rules that apply to the system.</p></div>
  </div>;
}

function SelectionFlow() {
  return <div><div className="rmf-visual-inputs"><span>Applicable guidance</span><span>Impact & risk analysis</span></div><Arrow down/>
    <Flow items={[{ title: 'Start with a baseline', detail: 'Identify the applicable initial control set.' }, { title: 'Tailor the selection', detail: 'Apply overlays, parameters, and justified adjustments.' }, { title: 'Allocate responsibility', detail: 'Identify system, common, and hybrid control owners.' }]}/>
    <div className="rmf-visual-result">A documented control set with accountable owners</div>
  </div>;
}

function ImplementationFlow() {
  return <div><Flow items={[{ title: 'Requirement', detail: 'What must the control accomplish?' }, { title: 'Safeguard', detail: 'What process or mechanism carries it out?' }, { title: 'Supporting evidence', detail: 'What records show how it is implemented?' }]}/>
    <div className="rmf-implementation-threads"><span>Control owner</span><span>Implementation description</span><span>Traceable records</span></div>
    <p className="rmf-visual-callout">Assessment then evaluates whether the implementation works as intended.</p>
  </div>;
}

function AssessmentMap() {
  return <div><div className="rmf-visual-inputs"><span>Agreed objectives, scope, and procedures</span></div><Arrow down/>
    <div className="rmf-assessment-methods"><Node title="Examine" detail="Review records and other assessment objects."/><Node title="Interview" detail="Discuss responsibilities and operation."/><Node title="Test" detail="Compare observed and expected behavior."/></div>
    <div className="rmf-visual-converge" aria-hidden="true"><span/><span/><span/></div>
    <Node title="Evidence-supported findings" detail="Record results, limitations, and weaknesses; remediate and retest as appropriate." accent/>
  </div>;
}

function AuthorizationTree() {
  return <div className="rmf-authorization-tree"><Node title="Authorization package" detail="Plans, assessment results, and planned risk responses."/><Arrow down/>
    <Node title="Risk review" detail="Consider residual risk, mission needs, and proposed conditions."/><Arrow down/>
    <Node title="Authorizing official’s decision" detail="Is the risk acceptable for the intended operation?" accent/>
    <div className="rmf-visual-fork" aria-hidden="true"><span/><span/></div>
    <div className="rmf-visual-pair rmf-decision-outcomes"><Node title="Authorize" detail="Record terms and conditions; carry them into monitoring."/><Node title="Deny authorization" detail="Record the reasons and determine the next course of action."/></div>
  </div>;
}

function MonitoringLoop() {
  return <div className="rmf-monitor-loop">
    <div className="rmf-monitor-step monitor-watch"><span className="rmf-loop-order">01</span><Node title="Watch for change" detail="Track the system, threats, and control performance."/></div>
    <span className="monitor-right rmf-flow-arrow" aria-hidden="true">→</span>
    <div className="rmf-monitor-step monitor-assess"><span className="rmf-loop-order">02</span><Node title="Reassess effectiveness" detail="Determine what needs further evaluation."/></div>
    <span className="monitor-down rmf-flow-arrow" aria-hidden="true">↓</span>
    <div className="rmf-monitor-step monitor-update"><span className="rmf-loop-order">03</span><Node title="Update the evidence" detail="Revise plans, findings, and corrective actions."/></div>
    <span className="monitor-left rmf-flow-arrow" aria-hidden="true">←</span>
    <div className="rmf-monitor-step monitor-decide"><span className="rmf-loop-order">04</span><Node title="Revisit risk decisions" detail="Report changes and seek decisions when needed."/></div>
    <span className="monitor-up rmf-flow-arrow" aria-hidden="true">↑</span>
    <p className="rmf-monitor-center">Ongoing<br/>feedback</p>
    <p className="rmf-monitor-return">Continue monitoring; return to earlier RMF phases when warranted.</p>
  </div>;
}

const visuals = {
  prepare: { title: 'Build a shared picture before making decisions.', Component: PrepareMap, note: 'Preparation connects the mission, the people, and the scope of the work.' },
  categorize: { title: 'Consider the consequence of each kind of loss.', Component: ImpactMatrix, note: 'These impact descriptions follow FIPS 199. No category is assigned by this diagram.' },
  select: { title: 'Turn risk and guidance into a control set.', Component: SelectionFlow, note: 'Tailoring decisions and inherited responsibilities need supporting rationale.' },
  implement: { title: 'Connect the requirement to what is actually done.', Component: ImplementationFlow, note: 'Keep the requirement, implementation, and supporting records traceable to one another.' },
  assess: { title: 'Use evidence to reach a supported conclusion.', Component: AssessmentMap, note: 'Choose methods and coverage for the assessment objectives; the diagram does not prescribe a fixed test sequence.' },
  authorize: { title: 'Bring the evidence to an accountable risk decision.', Component: AuthorizationTree, note: 'The package supports the decision. The authorizing official makes it.' },
  monitor: { title: 'Keep the risk picture current.', Component: MonitoringLoop, note: 'The four activities illustrate a feedback loop within Monitor; they are not additional RMF phases.' },
};

export function RmfPhaseVisual({ step }: { step: string }) {
  const visual = visuals[step as keyof typeof visuals];
  if (!visual) return null;
  const Component = visual.Component;
  return <figure id={`${step}-visual`} className={`rmf-phase-visual visual-${step}`} aria-labelledby={`${step}-visual-title`}>
    <figcaption><span>{stepNames[step]} / Visual guide</span><strong id={`${step}-visual-title`}>{visual.title}</strong></figcaption>
    <Component/>
    <p className="rmf-visual-note">{visual.note}</p>
  </figure>;
}
