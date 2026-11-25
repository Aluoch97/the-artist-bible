import type { jsPDF } from 'jspdf';
import type { SplitSheetDraft } from '../types/bible';
import { formatISOForDisplay, todayISO } from './dates';
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
