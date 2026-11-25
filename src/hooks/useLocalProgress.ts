import { useSyncExternalStore } from 'react';
import type {
  ArtistBibleState,
  BudgetItem,
  CatalogSong,
  Collaborator,
  EpkDraft,
  LiveShow,
  ReleaseType,
  SavedRelease,
  SplitSheetDraft,
} from '../types/bible';
import { newId } from '../lib/utils';
import { todayISO } from '../lib/dates';

export type { ArtistBibleState, Collaborator, SavedRelease } from '../types/bible';

export const STORAGE_KEY = 'artist_bible_v1';
const MAX_IMPORT_BYTES = 1_000_000;
const RELEASE_TYPES: ReleaseType[] = ['single', 'ep', 'album'];

/* ------------------------------ defaults ------------------------------ */

export function createCollaborator(overrides: Partial<Collaborator> = {}): Collaborator {
  return { id: newId(), name: '', role: 'Songwriter', ipi: '', masterPct: 0, publishingPct: 0, ...overrides };
}

export function createSplitDraft(): SplitSheetDraft {
  return {
    id: newId(),
    songTitle: '',
    sessionDate: todayISO(),
    collaborators: [createCollaborator({ role: 'Vocalist/Artist', masterPct: 100, publishingPct: 100 })],
  };
}

export const BUDGET_PRESETS = ['Recording', 'Mixing', 'Mastering', 'Cover art', 'Distribution', 'Marketing and ads', 'Music video', 'Other'];

export function createSong(overrides: Partial<CatalogSong> = {}): CatalogSong {
  return { id: newId(), title: '', isrc: '', upc: '', iswc: '', splits: false, pro: false, mlc: false, soundexchange: false, notes: '', ...overrides };
}

export function createShow(overrides: Partial<LiveShow> = {}): LiveShow {
  return { id: newId(), date: todayISO(), venue: '', city: '', songs: [], reported: false, ...overrides };
}

export function createEpk(): EpkDraft {
  return { artistName: '', genre: '', location: '', bio: '', topTracks: '', website: '', spotify: '', instagram: '', email: '', pitchSong: '', pitchGenre: '', pitchMood: '', pitchStory: '', pitchPlan: '' };
}

export function createBudget(): BudgetItem[] {
  return BUDGET_PRESETS.map((label) => ({ id: newId(), label, amount: 0 }));
}

export function defaultState(): ArtistBibleState {
  return {
    version: 1,
    completedAuditIds: [],
    activeRelease: null,
    splitSheetDraft: createSplitDraft(),
    savedReleases: [],
    savedSplitSheets: [],
    catalog: [],
    shows: [],
    epk: createEpk(),
    budget: createBudget(),
  };
}

const MAX_SAVED = 30;
const MAX_SONGS = 200;
const MAX_SHOWS = 500;
const MAX_BUDGET = 30;

/* ----------------------------- validation ----------------------------- */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.slice(0, max) : '');

const pct = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number.NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
};

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 100)))] : [];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanRelease(r: unknown): SavedRelease | null {
  if (!isObject(r) || !RELEASE_TYPES.includes(r.type as ReleaseType) || !DATE_RE.test(str(r.releaseDate))) return null;
  return {
    id: str(r.id) || newId(),
    title: str(r.title),
    type: r.type as ReleaseType,
    releaseDate: str(r.releaseDate),
    completedMilestoneIds: strArray(r.completedMilestoneIds),
  };
}

function cleanDraft(s: unknown): SplitSheetDraft | null {
  if (!isObject(s)) return null;
  const rows = Array.isArray(s.collaborators)
    ? s.collaborators.filter(isObject).slice(0, 50).map((c) => ({
        id: str(c.id) || newId(),
        name: str(c.name),
        role: str(c.role, 60) || 'Songwriter',
        ipi: str(c.ipi, 40),
        masterPct: pct(c.masterPct),
        publishingPct: pct(c.publishingPct),
      }))
    : [];
  return {
    id: str(s.id) || newId(),
    songTitle: str(s.songTitle),
    sessionDate: DATE_RE.test(str(s.sessionDate)) ? str(s.sessionDate) : todayISO(),
    collaborators: rows.length > 0 ? rows : createSplitDraft().collaborators,
  };
}

function cleanSong(v: unknown): CatalogSong | null {
  if (!isObject(v)) return null;
  return {
    id: str(v.id) || newId(),
    title: str(v.title),
    isrc: str(v.isrc, 30),
    upc: str(v.upc, 30),
    iswc: str(v.iswc, 30),
    splits: v.splits === true,
    pro: v.pro === true,
    mlc: v.mlc === true,
    soundexchange: v.soundexchange === true,
    notes: str(v.notes, 500),
  };
}

function cleanShow(v: unknown): LiveShow | null {
  if (!isObject(v) || !DATE_RE.test(str(v.date))) return null;
  return {
    id: str(v.id) || newId(),
    date: str(v.date),
    venue: str(v.venue, 120),
    city: str(v.city, 120),
    songs: Array.isArray(v.songs) ? v.songs.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 120)).slice(0, 60) : [],
    reported: v.reported === true,
  };
}

function cleanEpk(v: unknown): EpkDraft {
  const base = createEpk();
  if (!isObject(v)) return base;
  const out = { ...base };
  (Object.keys(base) as (keyof EpkDraft)[]).forEach((k) => {
    out[k] = str(v[k], k === 'bio' || k === 'pitchStory' || k === 'pitchPlan' || k === 'topTracks' ? 2000 : 300);
  });
  return out;
}

function cleanBudgetItem(v: unknown): BudgetItem | null {
  if (!isObject(v)) return null;
  const n = typeof v.amount === 'number' && Number.isFinite(v.amount) ? Math.min(10_000_000, Math.max(0, Math.round(v.amount * 100) / 100)) : 0;
  return { id: str(v.id) || newId(), label: str(v.label, 80), amount: n };
}

function cleanList<T extends { id: string }>(raw: unknown, clean: (v: unknown) => T | null, max = MAX_SAVED): T[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of raw.slice(0, max)) {
    const c = clean(item);
    if (c && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

/** Returns a clean state, or null if `raw` isn't a v1 Artist Bible state. */
export function sanitizeState(raw: unknown): ArtistBibleState | null {
  if (!isObject(raw) || raw.version !== 1) return null;
  return {
    version: 1,
    completedAuditIds: strArray(raw.completedAuditIds),
    activeRelease: cleanRelease(raw.activeRelease),
    splitSheetDraft: cleanDraft(raw.splitSheetDraft) ?? createSplitDraft(),
    savedReleases: cleanList(raw.savedReleases, cleanRelease),
    savedSplitSheets: cleanList(raw.savedSplitSheets, cleanDraft),
    catalog: cleanList(raw.catalog, cleanSong, MAX_SONGS),
    shows: cleanList(raw.shows, cleanShow, MAX_SHOWS),
    epk: cleanEpk(raw.epk),
    budget: Array.isArray(raw.budget) ? cleanList(raw.budget, cleanBudgetItem, MAX_BUDGET) : createBudget(),
  };
}

/* ------------------------- module-level store -------------------------- */
// One shared store so every component (home progress, audit, calculator…) stays in sync,
// including across browser tabs via the `storage` event.

let storageWritable = true;

function readStorage(): ArtistBibleState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const clean = sanitizeState(JSON.parse(raw));
      if (clean) return clean;
    }
  } catch {
    storageWritable = false;
  }
  return defaultState();
}

let current: ArtistBibleState = readStorage();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function commit(next: ArtistBibleState): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    storageWritable = true;
  } catch {
    storageWritable = false; // private mode / quota: keep working in memory
  }
  emit();
}

function onStorageEvent(e: StorageEvent): void {
  if (e.key === STORAGE_KEY || e.key === null) {
    current = readStorage();
    emit();
  }
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', onStorageEvent);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorageEvent);
  };
}

const getSnapshot = (): ArtistBibleState => current;
const getStorageSnapshot = (): boolean => storageWritable;

/* ------------------------------ backup I/O ------------------------------ */

export function exportBackupJson(): string {
  const json = JSON.stringify(current, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `artist-bible-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return json;
}

export type ImportResult = { ok: true; state: ArtistBibleState } | { ok: false; error: string };

/** Validate a backup file without applying it. */
export async function parseBackupFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, error: 'That file is too large to be an Artist Bible backup.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  const state = sanitizeState(parsed);
  if (!state) return { ok: false, error: 'This does not look like an Artist Bible backup (expected version 1).' };
  return { ok: true, state };
}

export async function importBackupJson(file: File): Promise<ImportResult> {
  const result = await parseBackupFile(file);
  if (result.ok) commit(result.state);
  return result;
}

/* -------------------------------- actions -------------------------------- */

export function toggleAuditItem(id: string): void {
  const done = current.completedAuditIds;
  commit({
    ...current,
    completedAuditIds: done.includes(id) ? done.filter((x) => x !== id) : [...done, id],
  });
}

/** Save (or clear with null) the active release. */
export function saveRelease(release: SavedRelease | null): void {
  commit({ ...current, activeRelease: release });
}

export function toggleReleaseMilestone(milestoneId: string): void {
  const rel = current.activeRelease;
  if (!rel) return;
  const done = rel.completedMilestoneIds;
  commit({
    ...current,
    activeRelease: {
      ...rel,
      completedMilestoneIds: done.includes(milestoneId) ? done.filter((x) => x !== milestoneId) : [...done, milestoneId],
    },
  });
}

export function updateSplitSheet(
  update: Partial<SplitSheetDraft> | ((draft: SplitSheetDraft) => SplitSheetDraft),
): void {
  const next = typeof update === 'function' ? update(current.splitSheetDraft) : { ...current.splitSheetDraft, ...update };
  commit({ ...current, splitSheetDraft: next });
}

/* ---- several releases and songs ---- */

const uniqueId = (taken: string[], id: string) => (taken.includes(id) ? newId() : id);

/** Put the current release on the shelf and start a blank one. */
export function startNewRelease(): void {
  const cur = current.activeRelease;
  commit({
    ...current,
    activeRelease: null,
    savedReleases: cur
      ? [{ ...cur, id: uniqueId(current.savedReleases.map((r) => r.id), cur.id) }, ...current.savedReleases].slice(0, MAX_SAVED)
      : current.savedReleases,
  });
}

/** Make a shelved release the current one (the current one goes on the shelf). */
export function openRelease(id: string): void {
  const target = current.savedReleases.find((r) => r.id === id);
  if (!target) return;
  const rest = current.savedReleases.filter((r) => r.id !== id);
  const cur = current.activeRelease;
  commit({
    ...current,
    activeRelease: target,
    savedReleases: cur ? [{ ...cur, id: uniqueId([target.id, ...rest.map((r) => r.id)], cur.id) }, ...rest] : rest,
  });
}

export function deleteSavedRelease(id: string): void {
  commit({ ...current, savedReleases: current.savedReleases.filter((r) => r.id !== id) });
}

const hasContent = (d: SplitSheetDraft) =>
  d.songTitle.trim() !== '' || d.collaborators.length > 1 || d.collaborators.some((c) => c.name.trim() !== '' || (c.ipi ?? '').trim() !== '');

/** Put the current song on the shelf (if it has anything in it) and start a blank one. */
export function startNewSplitSheet(): void {
  const cur = current.splitSheetDraft;
  commit({
    ...current,
    splitSheetDraft: createSplitDraft(),
    savedSplitSheets: hasContent(cur) ? [cur, ...current.savedSplitSheets].slice(0, MAX_SAVED) : current.savedSplitSheets,
  });
}

export function openSplitSheet(id: string): void {
  const target = current.savedSplitSheets.find((d) => d.id === id);
  if (!target) return;
  const rest = current.savedSplitSheets.filter((d) => d.id !== id);
  const cur = current.splitSheetDraft;
  commit({ ...current, splitSheetDraft: target, savedSplitSheets: hasContent(cur) ? [cur, ...rest] : rest });
}

export function deleteSavedSplitSheet(id: string): void {
  commit({ ...current, savedSplitSheets: current.savedSplitSheets.filter((d) => d.id !== id) });
}

/* ---- songs, shows, press kit, budget ---- */

export function addSong(song: Partial<CatalogSong> = {}): string {
  const s = createSong(song);
  commit({ ...current, catalog: [s, ...current.catalog].slice(0, MAX_SONGS) });
  return s.id;
}

export function updateSong(id: string, patch: Partial<CatalogSong>): void {
  commit({ ...current, catalog: current.catalog.map((s) => (s.id === id ? { ...s, ...patch, id } : s)) });
}

export function deleteSong(id: string): void {
  commit({ ...current, catalog: current.catalog.filter((s) => s.id !== id) });
}

export function addShow(show: Partial<LiveShow> = {}): string {
  const s = createShow(show);
  commit({ ...current, shows: [s, ...current.shows].slice(0, MAX_SHOWS) });
  return s.id;
}

export function updateShow(id: string, patch: Partial<LiveShow>): void {
  commit({ ...current, shows: current.shows.map((s) => (s.id === id ? { ...s, ...patch, id } : s)) });
}

export function deleteShow(id: string): void {
  commit({ ...current, shows: current.shows.filter((s) => s.id !== id) });
}

export function updateEpk(patch: Partial<EpkDraft>): void {
  commit({ ...current, epk: { ...current.epk, ...patch } });
}

export function setBudget(items: BudgetItem[]): void {
  commit({ ...current, budget: items.slice(0, MAX_BUDGET) });
}

export function resetAll(): void {
  commit(defaultState());
}

/* --------------------------------- hook --------------------------------- */

// Actions are module-level functions, so their identities are already stable.
const actions = {
  toggleAuditItem,
  saveRelease,
  toggleReleaseMilestone,
  updateSplitSheet,
  startNewRelease,
  openRelease,
  deleteSavedRelease,
  startNewSplitSheet,
  openSplitSheet,
  deleteSavedSplitSheet,
  addSong,
  updateSong,
  deleteSong,
  addShow,
  updateShow,
  deleteShow,
  updateEpk,
  setBudget,
  exportBackupJson,
  importBackupJson,
  parseBackupFile,
  resetAll,
};

export function useLocalProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const storageOk = useSyncExternalStore(subscribe, getStorageSnapshot, getStorageSnapshot);
  return { state, storageOk, ...actions };
}
