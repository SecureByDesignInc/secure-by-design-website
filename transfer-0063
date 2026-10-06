const approaches = [
  { title: 'National Institute of Standards and Technology (NIST) Cybersecurity Framework (CSF)', detail: 'Managing cybersecurity risk across an organization.', href: 'https://www.nist.gov/cyberframework' },
  { title: 'ISO/IEC 27001', detail: 'Information security management. Published by the International Organization for Standardization and the International Electrotechnical Commission.', href: 'https://www.iso.org/standard/27001' },
  { title: 'Center for Internet Security (CIS) Controls', detail: 'Prioritized, practical security safeguards.', href: 'https://www.cisecurity.org/controls' },
  { title: 'Control Objectives for Information and Related Technologies (COBIT)', detail: 'Governance and management of enterprise technology.', href: 'https://www.isaca.org/resources/cobit' },
  { title: 'System and Organization Controls (SOC) 2', detail: 'Assurance about controls at service providers.', href: 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2/' },
  { title: 'Payment Card Industry Data Security Standard (PCI DSS)', detail: 'Protecting payment account data.', href: 'https://www.pcisecuritystandards.org/standards/pci-dss/' },
  { title: 'HITRUST Framework', detail: 'Bringing multiple security and privacy requirements together.', href: 'https://hitrustalliance.net/hitrust-framework' },
  { title: 'Cybersecurity Maturity Model Certification (CMMC)', detail: 'Cybersecurity assurance for defense contractors.', href: 'https://dodcio.defense.gov/CMMC/' },
  { title: 'Federal Risk and Authorization Management Program (FedRAMP)', detail: 'Security assessment and authorization for federal cloud services.', href: 'https://www.fedramp.gov/' },
];

export function RmfOtherApproaches() {
  return <section id="other-approaches" className="rmf-guide-references" aria-labelledby="other-approaches-title">
    <h2 id="other-approaches-title">Explore other approaches</h2>
    <p>Secure By Design’s Risk Management Framework (RMF) coverage draws on experience with Department of Defense (DoD) Special Access Program (SAP) networks. Other frameworks, standards, and assurance programs are worth knowing about, too.</p>
    <ul className="rmf-framework-links">
      {approaches.map(approach => <li key={approach.title}>
        <a href={approach.href}>{approach.title}</a>
        <p>{approach.detail}</p>
      </li>)}
    </ul>
    <a className="rmf-guide-back" href="#guide-contents">Back to contents ↑</a>
  </section>;
}
