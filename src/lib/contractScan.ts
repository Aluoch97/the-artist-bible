import { redFlags } from '../data';
import type { RedFlag } from '../types/bible';

export interface ScanMatch {
  /** Text around the match, with the match itself marked. */
  before: string;
  hit: string;
  after: string;
}

export interface ScanFinding {
  flag: RedFlag;
  matches: ScanMatch[];
  /** Total times the wording appears (we only show a few). */
  count: number;
}

const CONTEXT = 110;
const MAX_SHOWN = 3;
const MAX_SCAN_CHARS = 400_000;

const compiled = redFlags.map((flag) => ({
  flag,
  regexes: flag.detect.flatMap((src) => {
    try {
      return [new RegExp(src, 'gi')];
    } catch {
      return []; // a bad pattern in the data file must never break the scan
    }
  }),
}));

/** Collapse whitespace so line breaks from PDFs don't split a phrase. */
export function normalizeContract(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t\f\v]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Looks for wording linked to the known red flags. This only finds phrases: it cannot tell
 * whether a deal is fair, so results are "worth a closer look", never "safe" or "unsafe".
 */
export function scanContract(raw: string): ScanFinding[] {
  const text = normalizeContract(raw).slice(0, MAX_SCAN_CHARS);
  const flat = text.replace(/\s+/g, ' ');
  const findings: ScanFinding[] = [];

  for (const { flag, regexes } of compiled) {
    const seen: { start: number; end: number }[] = [];
    for (const re of regexes) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(flat)) !== null) {
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        const start = m.index;
        const end = start + m[0].length;
        // Skip repeats of the same spot from overlapping patterns.
        if (!seen.some((s) => start < s.end + 60 && end > s.start - 60)) seen.push({ start, end });
      }
    }
    if (seen.length === 0) continue;
    seen.sort((a, b) => a.start - b.start);
    findings.push({
      flag,
      count: seen.length,
      matches: seen.slice(0, MAX_SHOWN).map((s) => ({
        before: (s.start > CONTEXT ? '…' : '') + flat.slice(Math.max(0, s.start - CONTEXT), s.start),
        hit: flat.slice(s.start, s.end),
        after: flat.slice(s.end, s.end + CONTEXT) + (s.end + CONTEXT < flat.length ? '…' : ''),
      })),
    });
  }

  // Serious first, then by how often it shows up.
  return findings.sort((a, b) => (a.flag.severity === b.flag.severity ? b.count - a.count : a.flag.severity === 'high' ? -1 : 1));
}

/** Hides details that identify people before text is sent anywhere. Not perfect: people should still review it. */
export function redact(text: string): { text: string; removed: number } {
  let removed = 0;
  const sub = (re: RegExp, label: string) => {
    text = text.replace(re, () => {
      removed++;
      return label;
    });
  };
  sub(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email removed]');
  sub(/\b\d{3}-\d{2}-\d{4}\b/g, '[ID number removed]');
  sub(/(?:\+?\d{1,2}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}\b/g, '[phone removed]');
  sub(/\b\d{9,}\b/g, '[number removed]');
  return { text, removed };
}
