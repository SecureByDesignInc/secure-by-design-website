import { evidenceGuidePath, jsigSource } from '../../content/rmf-evidence';
import './compliance.css';

const complianceSources = [
  { title: 'NIST SP 800-37', detail: 'Risk Management Framework · Revision 2', href: 'https://csrc.nist.gov/pubs/sp/800/37/r2/final' },
  { title: 'NIST SP 800-53', detail: 'Security and privacy controls · Revision 5', href: 'https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final' },
  { title: 'JSIG', detail: 'Public 2016 edition · Revision 4 controls', href: jsigSource },
  { title: 'CNSSI 1253', detail: '27 March 2014 edition · 2016 JSIG basis', href: 'https://www.dcsa.mil/portals/91/documents/ctp/nao/CNSSI_No1253.pdf' },
];

export function RmfNav() {
  return <nav className="rmf-nav" aria-label="RMF guide"><a href={evidenceGuidePath}>← RMF Guide &amp; Evidence</a></nav>;
}

export function RmfGuidanceContext({ card = false }: { card?: boolean }) {
  const Heading = card ? 'h2' : 'h3';
  return <section id="compliance" className={`rmf-compliance ${card ? 'rmf-system-card' : 'rmf-side-note'}`} aria-labelledby="guidance-context-title">
    <Heading id="guidance-context-title">Source documents</Heading>
    <ul className="rmf-compliance-links" aria-label="RMF source documents">
      {complianceSources.map(source => <li key={source.title}>
        <a href={source.href}>
          <span><strong>{source.title}</strong><small>{source.detail}</small></span>
          <span className="rmf-compliance-arrow" aria-hidden="true">↗</span>
        </a>
      </li>)}
    </ul>
    <p>The National Institute of Standards and Technology (NIST) drives the conversation here. Its Special Publication (SP) 800-37 gives us the Risk Management Framework (RMF), and SP 800-53 provides the security and privacy controls.</p>
    <p>The Joint Special Access Program Implementation Guide (JSIG) builds on that foundation with policies, procedures, and implementation instructions for Department of Defense (DoD) Special Access Program (SAP) networks and systems.</p>
    <p>Use it alongside Committee on National Security Systems Instruction (CNSSI) 1253 and the applicable SAP authority’s direction.</p>
  </section>;
}
