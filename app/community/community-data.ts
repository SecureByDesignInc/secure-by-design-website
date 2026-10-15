import states from '../../content/community-states.json';

export type StateLink = { label: string; url: string };
export type CommunityState = {
  code: string;
  name: string;
  slug: string;
  stateJobs?: StateLink;
  workforceAgency?: StateLink;
  jobBoard?: StateLink;
};

export const communityStates = states as CommunityState[];

export const findState = (slug: string) => communityStates.find(state => state.slug === slug);

// USAJOBS website search, filtered by keyword and the state's name.
export const usajobsSearch = (state: CommunityState) =>
  `https://www.usajobs.gov/search/results/?k=cybersecurity&l=${encodeURIComponent(state.name)}`;

// National directories. Each one lets a visitor narrow to their state on the directory's own site.
export const chapterDirectories: { name: string; url: string; text: string }[] = [
  { name: 'ISSA chapters', url: 'https://www.members.issa.org/page/global-chapter-list', text: 'Information Systems Security Association chapters hold regular meetings and talks.' },
  { name: 'ISC2 chapters', url: 'https://www.isc2.org/chapters/chapter-directory', text: 'Local ISC2 chapters, open to people working toward a certification as well as holders.' },
  { name: 'ISACA chapters', url: 'https://www.isaca.org/chapters', text: 'Audit, governance and risk chapters. Filter the directory by state.' },
  { name: 'OWASP chapters', url: 'https://owasp.org/chapters/status', text: 'Application security meetups, usually free and open to anyone.' },
  { name: 'InfraGard', url: 'https://www.infragardnational.org', text: 'A partnership between the FBI and people who protect critical infrastructure, organized in local member alliances.' },
  { name: 'DEF CON groups', url: 'https://defcongroups.org/', text: 'Local hacker groups that meet year-round.' },
  { name: 'Security BSides', url: 'https://bsides.org/', text: 'Low-cost, community-run security conferences in cities across the country.' },
];

export const trainingHelp: { name: string; url: string; text: string }[] = [
  { name: 'Cybersecurity apprenticeships', url: 'https://www.nist.gov/itl/applied-cybersecurity/nice/resources/apprenticeship-finder', text: 'The NICE Apprenticeship Finder lists registered programs where an employer pays you while you train.' },
  { name: 'DoD SkillBridge', url: 'https://skillbridge.osd.mil/locations.htm', text: 'For service members in their final months of service: train with a civilian employer. Search by state.' },
  { name: 'CAE-designated schools', url: 'https://www.caecommunity.org', text: 'Colleges designated as National Centers of Academic Excellence in Cybersecurity.' },
];

export const marketLinks: { name: string; url: string; text: string }[] = [
  { name: 'CyberSeek heat map', url: 'https://www.cyberseek.org/heatmap.html', text: 'Choose your state for its cybersecurity job openings, workforce size and the certifications employers ask for.' },
  { name: 'DoD Manual 8140.03', url: 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/814003p.PDF', text: 'Many Department of Defense and contractor cyber roles require qualifications under this manual.' },
];

export const discordUrl = 'https://discord.gg/MDrGbP4cAY';
export const suggestMail = (state?: CommunityState) =>
  `mailto:support@securebydesigninc.com?subject=${encodeURIComponent(state ? `Community: ${state.name} suggestion` : 'Community suggestion')}`;
