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
  /** RMF parts list each module's lessons and study hours (kept equal to public/training/rmf/catalog-data.js by a test). */
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
export type CatalogEntry = Episode | TrainingCourse;
export type CatalogCategory = { id: string; title: string; description: string };
export type Library = { episodes: Episode[]; courses?: TrainingCourse[]; categories?: CatalogCategory[] };
