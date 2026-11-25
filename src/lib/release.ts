import { industryData } from '../data';
import type { ReleaseMilestone, ReleaseType, SavedRelease } from '../types/bible';
import { addDays, daysBetween, parseISODate, todayISO } from './dates';

export interface PlannedMilestone extends ReleaseMilestone {
  due: Date;
  /** Whole days from today: negative = already past. */
  daysFromNow: number;
}

/** Steps for a release type: the shared steps plus any extras that type needs. */
export function milestonesFor(type: ReleaseType): ReleaseMilestone[] {
  return [...industryData.releaseMilestones, ...(industryData.releaseTypeSteps[type] ?? [])];
}

/** Milestones for a release date, earliest first, with exact due dates. */
export function planRelease(releaseDate: string, type: ReleaseType = 'single'): PlannedMilestone[] {
  const target = parseISODate(releaseDate);
  const today = parseISODate(todayISO());
  if (!target || !today) return [];
  return milestonesFor(type)
    .sort((a, b) => b.weeksOut - a.weeksOut)
    .map((m) => {
      const due = addDays(target, -m.weeksOut * 7);
      return { ...m, due, daysFromNow: daysBetween(today, due) };
    });
}

/** First unfinished step of a saved release, or null if all are done. */
export function nextMilestone(release: SavedRelease | null): PlannedMilestone | null {
  if (!release) return null;
  return planRelease(release.releaseDate, release.type).find((m) => !release.completedMilestoneIds.includes(m.id)) ?? null;
}

export function relativeDays(n: number): string {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${Math.abs(n)} days ago`;
}
