// Labels for the ATO Template Library (content/ato-templates.json), shared by the expanded catalog tile
// (library-experience.tsx) and the full library page (app/training/ato-templates).
export const FRAMEWORKS: { id: string; label: string }[] = [
  { id: 'NIST', label: 'NIST' },
  { id: 'CNSS', label: 'CNSS' },
  { id: 'DoD', label: 'DoD / DCSA' },
  { id: 'SAP', label: 'DoD SAP / JSIG' },
  { id: 'FedRAMP', label: 'FedRAMP' },
  { id: 'Other', label: 'Other' },
];

export const STATUSES: Record<string, { label: string; detail: string }> = {
  current: { label: 'Current', detail: 'Official and in force' },
  legacy: { label: 'Legacy', detail: 'FedRAMP Rev5, kept for reference under the 2026 rules' },
  superseded: { label: 'Superseded', detail: 'Withdrawn publication that is still widely used' },
  restricted: { label: 'Restricted', detail: 'Internal, by request or with membership' },
};

export const frameworkLabel = (id: string) => FRAMEWORKS.find(framework => framework.id === id)?.label ?? id;
