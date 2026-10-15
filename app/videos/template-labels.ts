// Labels for the ATO Template Library (content/ato-templates.json), shared by the expanded catalog tile
// (library-experience.tsx) and the full library page (app/training/ato-templates).
// Owner direction, 15 October 2026: the library lists only documents verified as publicly released by an
// official publisher, each linked to the publisher's own copy. Nothing is hosted here.
export const FRAMEWORKS: { id: string; label: string }[] = [
  { id: 'JSIG', label: 'DoD SAP / JSIG' },
  { id: 'DAF', label: 'Air Force' },
  { id: 'DoD', label: 'DoD / DCSA' },
  { id: 'CNSS', label: 'CNSS' },
  { id: 'NIST', label: 'NIST' },
  { id: 'FedRAMP', label: 'FedRAMP format' },
  { id: 'Other', label: 'Other' },
];

// What a learner gets from an entry: every entry opens its publisher's own copy.
export const STATUSES: Record<string, { label: string; detail: string }> = {
  official: { label: 'Official link', detail: 'Opens the publisher\'s own copy' },
};

export const frameworkLabel = (id: string) => FRAMEWORKS.find(framework => framework.id === id)?.label ?? id;

/** Opens a sentence with the entry count: "Three official sources", "One official source". */
export const sourcesPhrase = (count: number) =>
  `${['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][count] ?? count} official source${count === 1 ? '' : 's'}`;
