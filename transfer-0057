import { ReadingProgress } from '../reader-progress';
import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { stages } from '../../content/rmf';
import { evidencePhases } from '../../content/rmf-evidence';
import { RmfPhaseVisual } from './visuals';

/** Full phase content, embedded once in the unified guide. */
export function RmfChapter({ step }: { step: string }) {
  const index = stages.findIndex(stage => stage.slug === step);
  const phase = evidencePhases.find(phase => phase.slug === step);
  if (index < 0 || !phase) notFound();
  const stage = stages[index];
  const next = stages[index + 1];

  return <section className="evidence-phase rmf-guide-phase" id={step} aria-labelledby={`${step}-title`}>
    <header>
      <p className="evidence-phase-label">{phase.step === null ? 'NIST preparation · added in SP 800-37 Rev. 2' : '2016 JSIG · Step ' + phase.step}</p>
      <h2 id={`${step}-title`}>{stage.name}</h2>
      <p className="rmf-guide-question">{stage.question}</p>
      <p className="evidence-purpose">{stage.summary}</p>
      {step === 'prepare' && <p className="rmf-phase-topics">Security and Risk Management · Asset Security</p>}
      <nav className="rmf-phase-contents" aria-label={`${stage.name} section contents`}>
        <a href={`#${step}-explanation`}>Understand the phase</a>
        <a href={`#${step}-evidence`}>Artifacts &amp; responsibilities</a>
        <a href={`#${step}-talk-it-through`}>Discuss &amp; carry forward</a>
      </nav>
    </header>

    <div id={`${step}-explanation`} className="rmf-guide-prose">
      <p>{stage.intro}</p>
      <p>{stage.nist}</p>
      <RmfPhaseVisual step={step} />
      {stage.sections.map((section, sectionIndex) => <Fragment key={section.heading}>
        <h3 id={`${step}-discussion-${sectionIndex + 1}`}>{section.heading}</h3>
        {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </Fragment>)}

      <h3 id={`${step}-sap-application`}>{stage.jsig ? 'How this applies on SAP networks' : 'Where SAP implementation comes in'}</h3>
      {stage.jsig
        ? <p>{stage.jsig.text} 2016 JSIG section {stage.jsig.section} gives the SAP-specific instructions for this step.</p>
        : <>
          <p>Prepare helps us understand the mission, scope, responsibilities, and risk priorities. For a Special Access Program (SAP) network, those answers set the context for applying NIST’s security controls through JSIG’s policies, procedures, and implementation instructions. As we move through the guide, we’ll connect each NIST decision to that SAP application.</p>
          <p>Prepare itself comes from NIST SP 800-37 Revision 2. The public 2016 JSIG’s step sequence begins with Categorize.</p>
        </>}
    </div>

    <div id={`${step}-evidence`} className="rmf-phase-evidence">
      <h3>Artifacts &amp; responsibilities</h3>
      <p className="evidence-purpose">{phase.purpose}</p>
      <div className="evidence-phase-details">
        <div><h4>Produce or update</h4><ul>{phase.outputs.map(output => <li key={output}>{output}</li>)}</ul></div>
        <div><h4>Who’s responsible?</h4><p>{phase.responsibility}</p><h4>Keep it current</h4><p>{phase.maintain}</p></div>
      </div>
      <p className="evidence-application"><strong>At Secure By Design</strong>{' '}{phase.application}</p>
      <p className="rmf-source-reference">{phase.reference}</p>
    </div>

    <div className="rmf-guide-prose rmf-phase-discussion">
      <h3 id={`${step}-talk-it-through`}>Let’s talk it through</h3>
      <p>Pick a question and compare how you’d approach it. Ask what information would change your answer.</p>
      <ul>{stage.discussion.map(question => <li key={question}>{question}</li>)}</ul>
      <h3 id={`${step}-carry-forward`}>What do we carry forward?</h3>
      <p>{stage.handoff}</p>
    </div>

    <ReadingProgress id={`rmf:${step}`} path={`/rmf-series#${step}`} title={stage.name} />
    <nav className="rmf-guide-next" aria-label={`Continue after ${stage.name}`}>
      <a href="#guide-contents">Back to contents ↑</a>
      <a href={next ? '#' + next.slug : '#authorization-package'}>{next ? 'Next: ' + next.name : 'Next: Authorization package'} →</a>
    </nav>
  </section>;
}
