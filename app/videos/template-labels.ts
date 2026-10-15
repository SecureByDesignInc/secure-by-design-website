// Labels for the ATO Template Library (content/ato-templates.json), shared by the expanded catalog tile
// (library-experience.tsx) and the full library page (app/training/ato-templates).
// Owner direction, 15 October 2026: the library is a DoD SAP / JSIG set arranged by RMF step.
export const FRAMEWORKS: { id: string; label: string }[] = [
  { id: 'JSIG', label: 'DoD SAP / JSIG' },
  { id: 'DAF', label: 'Air Force' },
  { id: 'DoD', label: 'DoD / DCSA' },
  { id: 'CNSS', label: 'CNSS' },
  { id: 'NIST', label: 'NIST' },
  { id: 'FedRAMP', label: 'FedRAMP format' },
  { id: 'Other', label: 'Other' },
];

// What a learner can do with each entry: download our copy, download an adapted copy, follow the publisher's link,
// or read about an item that cannot be posted.
export const STATUSES: Record<string, { label: string; detail: string }> = {
  hosted: { label: 'Download', detail: 'Unclassified template, posted here as published with personal metadata removed' },
  adapted: { label: 'Adapted', detail: 'Generalized for training: restricted content, offices, people and contact details removed' },
  official: { label: 'Official link', detail: 'Opens the publisher\'s current copy' },
  restricted: { label: 'Restricted', detail: 'CAC-only, internal or not releasable, so described here and not posted' },
};

export const frameworkLabel = (id: string) => FRAMEWORKS.find(framework => framework.id === id)?.label ?? id;

/** Files posted on this site download directly; everything else opens the publisher's page in a new tab. */
export const isHostedFile = (href: string) => href.startsWith('/training/library/');
