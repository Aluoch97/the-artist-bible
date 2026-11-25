import type { Collaborator, SplitSheetDraft } from '../types/bible';
import { formatISOForDisplay } from './dates';

/** Round to 2dp to avoid float drift (e.g. 33.33 * 3). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function sumPct(rows: Collaborator[], key: 'masterPct' | 'publishingPct'): number {
  return round2(rows.reduce((acc, r) => acc + (Number.isFinite(r[key]) ? r[key] : 0), 0));
}

export interface SplitStatus {
  total: number;
  ok: boolean;
  /** Positive = still unassigned, negative = over-allocated. */
  remaining: number;
}

export function splitStatus(rows: Collaborator[], key: 'masterPct' | 'publishingPct'): SplitStatus {
  const total = sumPct(rows, key);
  return { total, ok: total === 100, remaining: round2(100 - total) };
}

export function fmtPct(n: number): string {
  return `${round2(n)}%`;
}

/** Even split in 2dp; the first rows absorb the rounding remainder so the total is exactly 100. */
export function evenSplit(count: number): number[] {
  if (count <= 0) return [];
  const cents = 10_000; // 100.00 in hundredths
  const base = Math.floor(cents / count);
  const extra = cents - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < extra ? 1 : 0)) / 100);
}

export function exportBlockers(draft: SplitSheetDraft): string[] {
  const issues: string[] = [];
  const named = draft.collaborators.filter((c) => c.name.trim() !== '');
  if (named.length === 0) issues.push('Add at least one collaborator name.');
  else if (named.length !== draft.collaborators.length) issues.push('Every row needs a name.');
  const master = splitStatus(draft.collaborators, 'masterPct');
  const pub = splitStatus(draft.collaborators, 'publishingPct');
  if (!master.ok) issues.push(`Master splits total ${fmtPct(master.total)}; they must equal 100%.`);
  if (!pub.ok) issues.push(`Publishing splits total ${fmtPct(pub.total)}; they must equal 100%.`);
  return issues;
}

/** Plain-text summary formatted for iMessage / WhatsApp group chats. */
export function buildTextSummary(draft: SplitSheetDraft): string {
  const title = draft.songTitle.trim() || 'Untitled';
  const lines: string[] = [];
  lines.push(`SPLIT SHEET: "${title}"`);
  if (draft.sessionDate) lines.push(`Session date: ${formatISOForDisplay(draft.sessionDate)}`);
  lines.push('');

  lines.push('MASTER (recording) = 100%');
  for (const c of draft.collaborators) {
    if (c.masterPct > 0) lines.push(`- ${c.name.trim() || 'Unnamed'} (${c.role}): ${fmtPct(c.masterPct)}`);
  }
  lines.push('');

  lines.push('PUBLISHING (song / composition) = 100%');
  for (const c of draft.collaborators) {
    if (c.publishingPct > 0) {
      const ipi = c.ipi?.trim() ? ` [IPI ${c.ipi.trim()}]` : '';
      lines.push(`- ${c.name.trim() || 'Unnamed'} (${c.role}): ${fmtPct(c.publishingPct)}${ipi}`);
    }
  }
  lines.push('');
  lines.push('Reply "agree" if this is right. Sign the PDF when you can.');
  lines.push('');
  lines.push('Generated via The Artist Bible');
  return lines.join('\n');
}
