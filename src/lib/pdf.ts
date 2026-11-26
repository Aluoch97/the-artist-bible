import type { jsPDF } from 'jspdf';
import type { EpkDraft, SplitSheetDraft } from '../types/bible';
import { formatISOForDisplay, formatLongDate, todayISO } from './dates';
import type { PlannedMilestone } from './release';
import { fmtPct, sumPct } from './splitSheet';

/* jsPDF's built-in fonts only cover Latin-1. Names are the whole point of a split sheet, so anything
   outside Latin-1 (Ł, Cyrillic, Chinese, Arabic, emoji…) is drawn with the phone's own fonts onto a
   canvas and placed in the PDF as a picture. Plain text stays real, selectable text. */

const LATIN1 = /^[\x20-\x7E -ÿ]*$/;
const SCALE = 4; // canvas pixels per PDF point, for crisp text
const FONT_STACK = `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans CJK SC", "Hiragino Sans", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif`;

type Doc = jsPDF;

function fileSlug(title: string): string {
  const slug = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}

interface TextOpts {
  size: number;
  bold?: boolean;
  /** Maximum width in points (the picture path shrinks or trims to fit). */
  maxW?: number;
  align?: 'left' | 'right';
}

/** Draw one line. Returns the width used in points. */
function line(doc: Doc, str: string, x: number, y: number, o: TextOpts): number {
  if (LATIN1.test(str)) {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(o.size);
    doc.text(str, x, y, o.align ? { align: o.align } : undefined);
    return doc.getTextWidth(str);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // No canvas available: fall back to a visible placeholder rather than silently dropping a name.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(o.size);
    doc.text(str.replace(/[^\x20-\x7E -ÿ]/g, '?'), x, y);
    return 0;
  }
  const font = (sizePt: number) => `${o.bold ? '700 ' : ''}${sizePt * SCALE}px ${FONT_STACK}`;
  let size = o.size;
  let text = str;
  ctx.font = font(size);
  const maxPx = (o.maxW ?? Number.POSITIVE_INFINITY) * SCALE;
  // Shrink up to 30%, then trim with an ellipsis.
  while (ctx.measureText(text).width > maxPx && size > o.size * 0.7) {
    size -= 0.5;
    ctx.font = font(size);
  }
  if (ctx.measureText(text).width > maxPx) {
    while (text.length > 1 && ctx.measureText(text + '…').width > maxPx) text = text.slice(0, -1);
    text += '…';
  }
  const w = Math.ceil(ctx.measureText(text).width);
  const h = Math.ceil(size * 1.5 * SCALE);
  canvas.width = Math.max(1, w + 4);
  canvas.height = h;
  const c2 = canvas.getContext('2d')!;
  c2.font = font(size);
  c2.fillStyle = '#000';
  c2.textBaseline = 'alphabetic';
  c2.fillText(text, 2, Math.round(size * 1.12 * SCALE));
  const wPt = canvas.width / SCALE;
  const hPt = canvas.height / SCALE;
  const left = o.align === 'right' ? x - wPt : x;
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', left, y - size * 1.12, wPt, hPt);
  return wPt;
}

/** Wrap Latin text across lines; non-Latin text is kept to one fitted line. Returns lines used. */
function wrapped(doc: Doc, str: string, x: number, y: number, o: TextOpts & { maxW: number }, lineH: number): number {
  if (LATIN1.test(str)) {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(o.size);
    const lines = doc.splitTextToSize(str, o.maxW) as string[];
    lines.forEach((l, i) => doc.text(l, x, y + i * lineH));
    return lines.length;
  }
  line(doc, str, x, y, o);
  return 1;
}

/** Builds and downloads the formal split sheet. jsPDF is loaded on demand to keep the first load small. */
export async function downloadSplitSheetPdf(draft: SplitSheetDraft): Promise<void> {
  const { jsPDF: PDF } = await import('jspdf');
  const doc = new PDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensure = (needed: number): void => {
    if (y + needed > pageH - margin - 24) {
      doc.addPage();
      y = margin;
    }
  };

  const title = draft.songTitle.trim() || 'Untitled';

  line(doc, 'SPLIT SHEET AGREEMENT', margin, y, { size: 20, bold: true });
  y += 26;
  const used = line(doc, 'Song title: ', margin, y, { size: 12 });
  line(doc, title, margin + used, y, { size: 12, maxW: contentW - used });
  y += 16;
  line(doc, `Session date: ${formatISOForDisplay(draft.sessionDate)}`, margin, y, { size: 12 });
  y += 16;
  line(doc, `Date generated: ${formatISOForDisplay(todayISO())}`, margin, y, { size: 12 });
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const intro = doc.splitTextToSize(
    'The undersigned collaborators agree that ownership of the master recording and of the musical composition ' +
      '(publishing) of the song named above is divided as shown below. Each side totals 100%.',
    contentW,
  ) as string[];
  doc.text(intro, margin, y);
  y += intro.length * 13 + 10;

  // Table
  const cols = [
    { label: 'Name', x: margin, w: 150 },
    { label: 'Role', x: margin + 155, w: 95 },
    { label: 'PRO / IPI #', x: margin + 255, w: 90 },
    { label: 'Master %', x: margin + 350, w: 60 },
    { label: 'Publishing %', x: margin + 420, w: 72 },
  ];
  cols.forEach((c) => line(doc, c.label, c.x, y, { size: 10, bold: true }));
  y += 5;
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentW, y);
  y += 14;

  for (const c of draft.collaborators) {
    ensure(36);
    const nameLines = wrapped(doc, c.name.trim() || 'Unnamed', cols[0]!.x, y, { size: 10, maxW: cols[0]!.w }, 13);
    const ipiLines = wrapped(doc, c.ipi?.trim() || '-', cols[2]!.x, y, { size: 10, maxW: cols[2]!.w }, 13);
    line(doc, c.role, cols[1]!.x, y, { size: 10, maxW: cols[1]!.w });
    line(doc, fmtPct(c.masterPct), cols[3]!.x, y, { size: 10 });
    line(doc, fmtPct(c.publishingPct), cols[4]!.x, y, { size: 10 });
    y += Math.max(nameLines, ipiLines, 1) * 13 + 4;
  }
  ensure(30);
  doc.line(margin, y, margin + contentW, y);
  y += 14;
  line(doc, 'TOTAL', cols[0]!.x, y, { size: 10, bold: true });
  line(doc, fmtPct(sumPct(draft.collaborators, 'masterPct')), cols[3]!.x, y, { size: 10, bold: true });
  line(doc, fmtPct(sumPct(draft.collaborators, 'publishingPct')), cols[4]!.x, y, { size: 10, bold: true });
  y += 30;

  // Signatures
  ensure(60);
  line(doc, 'Signatures', margin, y, { size: 12, bold: true });
  y += 10;
  for (const c of draft.collaborators) {
    ensure(54);
    y += 28;
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + 280, y);
    doc.line(margin + 310, y, margin + 430, y);
    y += 12;
    const nameW = line(doc, c.name.trim() || 'Unnamed', margin, y, { size: 10, maxW: 220 });
    line(doc, ` (${c.role})`, margin + nameW, y, { size: 10 });
    line(doc, 'Date', margin + 310, y, { size: 10 });
    y += 6;
  }

  y += 18;
  ensure(60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90);
  const note = doc.splitTextToSize(
    'This document records the parties\' intentions and is a convenience tool. It is not legal advice. ' +
      'Register the splits with your PRO and The MLC, and consult an entertainment attorney for binding contracts.',
    contentW,
  ) as string[];
  doc.text(note, margin, y);

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Generated via The Artist Bible', margin, pageH - 30);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 30, { align: 'right' });
  }

  doc.save(`split-sheet-${fileSlug(draft.songTitle)}.pdf`);
}

/** One-page press kit (EPK). Same on-demand jsPDF loading as the split sheet. */
export async function downloadEpkPdf(epk: EpkDraft): Promise<void> {
  const { jsPDF: PDF } = await import('jspdf');
  const doc = new PDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;
  let y = margin;
  const ensure = (needed: number): void => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const name = epk.artistName.trim() || 'Artist name';
  line(doc, name, margin, y + 12, { size: 28, bold: true, maxW: contentW });
  y += 40;
  const sub = [epk.genre.trim(), epk.location.trim()].filter(Boolean).join('  |  ');
  if (sub) {
    line(doc, sub, margin, y, { size: 12, maxW: contentW });
    y += 22;
  }
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentW, y);
  y += 24;

  const bio = epk.bio.trim();
  if (bio) {
    line(doc, 'About', margin, y, { size: 12, bold: true });
    y += 18;
    for (const para of bio.split(/\n+/)) {
      const used = wrapped(doc, para, margin, y, { size: 11, maxW: contentW }, 15);
      ensure(used * 15);
      y += used * 15 + 8;
    }
    y += 8;
  }

  const tracks = epk.topTracks.split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 12);
  if (tracks.length) {
    ensure(40);
    line(doc, 'Listen', margin, y, { size: 12, bold: true });
    y += 18;
    for (const t of tracks) {
      ensure(18);
      line(doc, `-  ${t}`, margin, y, { size: 11, maxW: contentW });
      y += 16;
    }
    y += 12;
  }

  const links: [string, string][] = [['Website', epk.website], ['Spotify', epk.spotify], ['Instagram', epk.instagram], ['Contact', epk.email]];
  const filled = links.filter(([, v]) => v.trim());
  if (filled.length) {
    ensure(30 + filled.length * 16);
    line(doc, 'Find me', margin, y, { size: 12, bold: true });
    y += 18;
    for (const [label, value] of filled) {
      const used = line(doc, `${label}: `, margin, y, { size: 11, bold: true });
      line(doc, value.trim(), margin + used, y, { size: 11, maxW: contentW - used });
      y += 16;
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Made with The Artist Bible', margin, pageH - 30);
  doc.save(`${fileSlug(name)}-press-kit.pdf`);
}

export interface ReleasePlanPdfInput {
  title: string;
  type: string;
  /** YYYY-MM-DD */
  releaseDate: string;
  steps: PlannedMilestone[];
  completedIds: string[];
}

/** The release plan as a PDF: every step with its due date and whether it is done. Same on-demand jsPDF loading as the others. */
export async function downloadReleasePlanPdf(input: ReleasePlanPdfInput): Promise<void> {
  const { jsPDF: PDF } = await import('jspdf');
  const doc = new PDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;
  let y = margin;
  const ensure = (needed: number): void => {
    if (y + needed > pageH - margin - 24) {
      doc.addPage();
      y = margin;
    }
  };

  const name = input.title.trim() || 'Untitled release';
  const typeLabel = input.type === 'ep' ? 'EP' : input.type.charAt(0).toUpperCase() + input.type.slice(1);
  line(doc, 'RELEASE PLAN', margin, y, { size: 12, bold: true });
  y += 28;
  line(doc, name, margin, y, { size: 24, bold: true, maxW: contentW });
  y += 22;
  line(doc, `${typeLabel}  |  Release day: ${formatISOForDisplay(input.releaseDate)}`, margin, y, { size: 12, maxW: contentW });
  y += 16;
  const done = input.steps.filter((m) => input.completedIds.includes(m.id)).length;
  line(doc, `${done} of ${input.steps.length} steps done  |  Printed ${formatISOForDisplay(todayISO())}`, margin, y, { size: 10, maxW: contentW });
  y += 14;
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentW, y);
  y += 22;

  const dateX = margin + 22;
  const stepX = margin + 150;
  const stepW = contentW - 150;
  for (const m of input.steps) {
    const isDone = input.completedIds.includes(m.id);
    ensure(44);
    // Tick box
    doc.setLineWidth(0.8);
    doc.rect(margin, y - 9, 11, 11);
    if (isDone) {
      doc.setLineWidth(1.4);
      doc.line(margin + 2, y - 3, margin + 5, y);
      doc.line(margin + 5, y, margin + 10, y - 8);
    }
    const when = m.weeksOut === 0 ? 'Release day' : `${m.weeksOut} ${m.weeksOut === 1 ? 'week' : 'weeks'} before`;
    line(doc, formatLongDate(m.due), dateX, y, { size: 10, bold: true, maxW: 124 });
    line(doc, when, dateX, y + 12, { size: 8, maxW: 124 });
    const rows = wrapped(doc, m.label, stepX, y, { size: 10, maxW: stepW }, 13);
    const status = isDone ? 'Done' : m.daysFromNow < 0 ? 'Behind' : '';
    if (status) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(isDone ? 20 : 170, isDone ? 110 : 40, isDone ? 60 : 40);
      doc.text(status.toUpperCase(), stepX, y + rows * 13 + 1);
      doc.setTextColor(0);
    }
    y += Math.max(rows * 13 + (status ? 12 : 0), 26) + 12;
    doc.setLineWidth(0.3);
    doc.setDrawColor(200);
    doc.line(margin, y - 8, margin + contentW, y - 8);
    doc.setDrawColor(0);
  }

  y += 6;
  ensure(40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90);
  const note = doc.splitTextToSize(
    'Dates are counted back from your release day in your local time zone. This plan is a planning aid, not legal or financial advice.',
    contentW,
  ) as string[];
  doc.text(note, margin, y);

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Generated via The Artist Bible', margin, pageH - 30);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 30, { align: 'right' });
  }

  doc.save(`release-plan-${fileSlug(input.title)}.pdf`);
}
