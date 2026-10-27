import type { CatalogEntry, Library, ReferenceLibrary, TrainingCourse } from './catalog-types';

export function isTrainingCourse(entry: CatalogEntry): entry is TrainingCourse {
  return 'moduleCount' in entry;
}

export function isReferenceLibrary(entry: CatalogEntry): entry is ReferenceLibrary {
  return 'kind' in entry && (entry.kind === 'library' || entry.kind === 'design-reference');
}

// One Training Hub (owner direction, 19 October 2026): the network build, Network Authorization and the ATO Template
// Library share one library page at /technical-training. The ATO Package Builder (/grc-rmf-training/workspace) is a tool in it.
// The sidebar lists each category, with the Build the Network topic groups (content/videos.json, `collections`) under it.
export type HubGroup = { id: string; title: string; description: string; parent?: string; entries: CatalogEntry[] };
export function getHubGroups(library: Library): HubGroup[] {
  const entries = getCatalogEntries(library);
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const groups: HubGroup[] = [];
  for (const category of library.categories ?? []) {
    groups.push({ id: category.id, title: category.title, description: category.description, entries: entries.filter(entry => entry.categoryId === category.id) });
    for (const collection of (library.collections ?? []).filter(item => item.parent === category.id)) {
      groups.push({
        id: collection.id, parent: category.id, title: collection.title, description: collection.description,
        entries: collection.entries.map(id => byId.get(id)).filter((entry): entry is CatalogEntry => Boolean(entry)),
      });
    }
  }
  return groups;
}

// The artwork family for a tile: its topic group inside Build the Network, otherwise its category.
export function getArtFamily(entry: CatalogEntry, library: Library): string {
  const collection = (library.collections ?? []).find(item => item.entries.includes(entry.id));
  if (collection) return collection.id;
  if (isReferenceLibrary(entry)) return 'reference';
  return entry.categoryId === 'network-authorization' ? 'authorize' : 'identity';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Catalog dates read like "14 October 2026".
export function catalogDate(value: string | undefined): number {
  const match = /^(\d{1,2}) ([A-Z][a-z]+) (\d{4})$/.exec((value ?? '').trim());
  const month = match ? MONTHS.indexOf(match[2]) : -1;
  return match && month >= 0 ? Date.UTC(Number(match[3]), month, Number(match[1])) : 0;
}

// The most recently updated courses with material, newest first; ties keep course order.
export function getRecentlyUpdated(library: Library, count: number): CatalogEntry[] {
  return getCatalogEntries(library)
    .map((entry, index) => ({ entry, index, date: isReferenceLibrary(entry) || (entry as { kind?: string }).kind === 'coming-soon' ? 0 : catalogDate(entry.training.updated) }))
    .filter(item => item.date > 0)
    .sort((a, b) => b.date - a.date || a.index - b.index)
    .slice(0, count)
    .map(item => item.entry);
}

export function getCatalogEntries(library: Library): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const courses = library.courses ?? [];
  for (const episode of library.episodes) {
    entries.push(episode, ...courses.filter(course => course.afterEpisode === episode.id));
  }
  entries.push(...courses.filter(course => !library.episodes.some(episode => episode.id === course.afterEpisode)));
  entries.push(...(library.references ?? []));
  const categoryOrder = new Map((library.categories ?? []).map((category, index) => [category.id, index]));
  return entries.sort((a, b) =>
    (categoryOrder.get(a.categoryId ?? '') ?? categoryOrder.size) -
    (categoryOrder.get(b.categoryId ?? '') ?? categoryOrder.size) ||
    (a.categoryOrder ?? 0) - (b.categoryOrder ?? 0));
}

export function groupCatalogEntries(entries: CatalogEntry[], library: Library) {
  const categories = [...(library.categories ?? [])];
  const known = new Set(categories.map(category => category.id));
  const ungrouped = entries.filter(entry => !known.has(entry.categoryId ?? ''));
  const groups = categories.map(category => ({ ...category, entries: entries.filter(entry => entry.categoryId === category.id) }));
  if (ungrouped.length) groups.push({ id: 'more-training', title: 'More training', description: 'Continue your learning path.', entries: ungrouped });
  return groups.filter(group => group.entries.length > 0);
}

export type SearchableEpisode = {
  title: string;
  subtitle: string;
  description: string;
  tags: readonly string[];
  systems: readonly string[];
};

export function filterEpisodes<T extends SearchableEpisode>(
  episodes: T[],
  query: string,
  topic: string,
): T[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return episodes.filter((episode) => {
    if (topic && !episode.tags.includes(topic)) return false;
    const searchable = [
      episode.title,
      episode.subtitle,
      episode.description,
      ...episode.tags,
      ...episode.systems,
    ]
      .join(' ')
      .toLowerCase();
    return tokens.every((token) => searchable.includes(token));
  });
}

export function getCatalogTopics(episodes: SearchableEpisode[]): string[] {
  return [...new Set(episodes.flatMap((episode) => episode.tags))].sort(
    (left, right) => left.localeCompare(right),
  );
}

export function supportsIdentityScene(episode: {
  scene?: string;
  chapters: { id: string }[];
}): boolean {
  const stages = ['prepare', 'dc01', 'dc02', 'verify', 'evidence'];
  return (
    episode.scene === 'identity-dc' &&
    episode.chapters.length === stages.length &&
    stages.every((id, index) => episode.chapters[index].id === id)
  );
}

export function getYouTubeEmbedUrl(
  id: string | null,
  start: number | null = null,
): string | null {
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  const params = new URLSearchParams({ rel: '0', playsinline: '1' });
  if (start !== null && Number.isFinite(start) && start >= 0)
    params.set('start', String(Math.floor(start)));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
