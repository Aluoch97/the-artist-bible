/** Strict types shared across the app. Persisted state shape matches CLAUDE.md §6. */

export type ReleaseType = 'single' | 'ep' | 'album';

export const COLLABORATOR_ROLES = ['Producer', 'Songwriter', 'Vocalist/Artist', 'Engineer'] as const;
export type CollaboratorRole = (typeof COLLABORATOR_ROLES)[number];

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  ipi?: string;
  masterPct: number;
  publishingPct: number;
}

export interface SavedRelease {
  id: string;
  title: string;
  type: ReleaseType;
  releaseDate: string; // YYYY-MM-DD
  completedMilestoneIds: string[];
}

export interface SplitSheetDraft {
  /** Added after v1 launch; older saves get one on load. */
  id: string;
  songTitle: string;
  sessionDate: string;
  collaborators: Collaborator[];
}

export interface ArtistBibleState {
  version: 1;
  completedAuditIds: string[];
  activeRelease: SavedRelease | null;
  splitSheetDraft: SplitSheetDraft;
  /** Earlier releases and songs kept on the shelf. Additive: v1 backups without these still load. */
  savedReleases: SavedRelease[];
  savedSplitSheets: SplitSheetDraft[];
  /** Added later (all additive, so older backups still load). */
  catalog: CatalogSong[];
  shows: LiveShow[];
  epk: EpkDraft;
  budget: BudgetItem[];
}

/** One song in "My songs", with where it is registered. */
export interface CatalogSong {
  id: string;
  title: string;
  isrc: string;
  upc: string;
  iswc: string;
  splits: boolean;
  pro: boolean;
  mlc: boolean;
  soundexchange: boolean;
  notes: string;
}

export interface LiveShow {
  id: string;
  date: string; // YYYY-MM-DD
  venue: string;
  city: string;
  songs: string[];
  reported: boolean;
}

export interface EpkDraft {
  artistName: string;
  genre: string;
  location: string;
  bio: string;
  topTracks: string;
  website: string;
  spotify: string;
  instagram: string;
  email: string;
  pitchSong: string;
  pitchGenre: string;
  pitchMood: string;
  pitchStory: string;
  pitchPlan: string;
}

export interface BudgetItem {
  id: string;
  label: string;
  amount: number;
}

/* ---------- Volatile industry data (src/data/industry-data.json) ---------- */

export interface RoyaltyEntity {
  id: string;
  name: string;
  category: string;
  cost: string;
  officialUrl: string;
  secondaryUrl?: string;
  whyItMatters: string;
  steps: string[];
}

export interface ReleaseMilestone {
  id: string;
  weeksOut: number;
  label: string;
}

export interface ResourceLink {
  id: string;
  label: string;
  url: string;
}

export interface IndustryData {
  lastVerified: string; // YYYY-MM
  site: {
    githubRepo: string;
    url: string;
    owner: string;
    socials: { label: string; href: string; icon: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'bandcamp' }[];
  };
  royaltyEntities: RoyaltyEntity[];
  releaseMilestones: ReleaseMilestone[];
  /** Extra steps shown only for that release type. */
  releaseTypeSteps: Partial<Record<ReleaseType, ReleaseMilestone[]>>;
  resources: ResourceLink[];
  streamingRates: {
    reviewed: string; // YYYY-MM
    note: string;
    platforms: { id: string; name: string; low: number; high: number }[];
  };
}

/* ---------- Red flag glossary (src/data/red-flags.json) ---------- */

export type RedFlagCategory = 'Contract' | 'Distribution' | 'Streaming Scam' | 'Scam';

export interface RedFlag {
  id: string;
  term: string;
  category: RedFlagCategory;
  severity: 'high' | 'medium';
  aliases: string[];
  plainEnglish: string;
  whyItHurts: string;
  whatToDo: string[];
  lookFor: string[];
  /** Case-insensitive regex sources the on-device contract scan looks for. */
  detect: string[];
}

/* ---------- MDX chapters ---------- */

export interface ChapterFrontmatter {
  title: string;
  summary: string;
  lastVerified: string; // YYYY-MM
}

/* ---------- Contract check (AI review result from /api/review-contract) ---------- */

export interface ContractReview {
  overall: 'serious' | 'careful' | 'few_concerns';
  summary: string[];
  keyTerms: { label: string; plain: string }[];
  flags: { severity: 'serious' | 'careful'; title: string; quote: string; quoteFound: boolean; why: string; askFor: string }[];
  questions: string[];
}

/* ---------- Music words (src/data/glossary.json) ---------- */

export interface GlossaryEntry {
  id: string;
  term: string;
  /** Regex source for finding this word in text. */
  match: string;
  meaning: string;
}
