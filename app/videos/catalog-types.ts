type Chapter = {
  id: string;
  title: string;
  label: string;
  description: string;
  network: string;
  timestamp: number | null;
};
export type Episode = {
  categoryId?: string;
  categoryOrder?: number;
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  youtubeId: string | null;
  systems: string[];
  scene?: string;
  networkLabel?: string;
  outcomeSummary: string;
  outcomes: string[];
  chapters: Chapter[];
  training: {
    guide: string;
    pdf: string;
    word: string;
    package: string;
    cover: string;
    pages: number;
    materialsEdition?: string;
    updated?: string;
    copyrightOwner?: string;
    copyrightYear?: number;
    notices?: string;
  };
};
export type TrainingCourse = {
  categoryId?: string;
  categoryOrder?: number;
  /** 'configuration', 'authorization', or 'coming-soon' (a placeholder tile with no material yet). */
  kind?: string;
  artLabels?: string[];
  id: string;
  number: string;
  afterEpisode: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  /** Platforms the course configures, shown in the course-page kicker (for example "Windows Server · Linux"). */
  platform?: string;
  systems: string[];
  moduleCount: number;
  lessonCount: number;
  estimatedHours: number;
  seriesPart?: number;
  moduleIds?: string[];
  capstoneHours?: number;
  outcomes: string[];
  /** One-line promise shown above the outcomes in the expanded tile. */
  outcomeSummary?: string;
  /** Where the course's systems sit in Inside the Network, shown in the lesson explorer. */
  networkLabel?: string;
  /** RMF parts list each module's lessons and study hours (kept equal to public/grc-rmf-training/rmf/catalog-data.js by a test). */
  stages: { title: string; detail: string; number?: string; href?: string; hours?: string; lessons?: string[] }[];
  training: {
    guide: string;
    pdf?: string;
    word?: string;
    checklist?: string;
    checklistPage?: string;
    /** The tile's one download: the workbook (PDF and Word), checklist, and verification commands in a ZIP. */
    package?: string;
    pages?: number;
    /** Workbook cover image (the first page of the workbook or catalog). */
    cover?: string;
    materialsEdition: string;
    updated: string;
    relatedResources?: { title: string; detail: string; href: string }[];
  };
};
/**
 * A reference tile (kind 'library'): a collection of outside templates rather than a course.
 * Its contents come from its own data file (the ATO Template Library reads content/ato-templates.json),
 * so the tile carries only its catalog details, artwork and page.
 */
export type ReferenceLibrary = {
  categoryId?: string;
  categoryOrder?: number;
  /** Always 'library' (typed as a string because the catalog is read from JSON). */
  kind: string;
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  systems: string[];
  artLabels: string[];
  outcomeSummary: string;
  outcomes: string[];
  training: {
    /** The full library page. */
    guide: string;
    /** Library cover, shown where a course shows its workbook. */
    cover: string;
    updated: string;
    relatedResources?: { title: string; detail: string; href: string }[];
  };
};
export type CatalogEntry = Episode | TrainingCourse | ReferenceLibrary;
/** kind 'reference' marks a group of reference tiles: it is not a learning path and has no course order. */
export type CatalogCategory = { id: string; title: string; description: string; kind?: string; library?: string };
export type Library = { episodes: Episode[]; courses?: TrainingCourse[]; references?: ReferenceLibrary[]; categories?: CatalogCategory[] };
