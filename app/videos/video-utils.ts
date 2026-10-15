import type { CatalogEntry, Library, ReferenceLibrary, TrainingCourse } from './catalog-types';

export function isTrainingCourse(entry: CatalogEntry): entry is TrainingCourse {
  return 'moduleCount' in entry;
}

export function isReferenceLibrary(entry: CatalogEntry): entry is ReferenceLibrary {
  return 'kind' in entry && entry.kind === 'library';
}

// Two libraries share one catalog (owner direction, 15 October 2026): the Build Studio (/technical-training)
// holds the network build; the Authorization Studio (/grc-rmf-training) holds the categories marked
// "library": "grc" in content/videos.json (Network Authorization). Categories without the field are technical.
export type LibraryEdition = 'technical' | 'grc';
export function libraryFor(library: Library, edition: LibraryEdition): Library {
  const categories = (library.categories ?? []).filter(category => (category.library ?? 'technical') === edition);
  const ids = new Set(categories.map(category => category.id));
  const keep = (entry: { categoryId?: string }) => ids.has(entry.categoryId ?? '');
  return { ...library, categories, episodes: library.episodes.filter(keep), courses: (library.courses ?? []).filter(keep), references: (library.references ?? []).filter(keep) };
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
