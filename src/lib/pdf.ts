import type { SplitSheetDraft } from '../types/bible';
import { formatISOForDisplay, todayISO } from './dates';
import { fmtPct, sumPct } from './splitSheet';

/** jsPDF's built-in fonts only cover Latin-1; replace anything else so output isn't garbled. */
function safe(text: string): string {
  return text.replace(/[^\x20-\x7E -ÿ]/g, '?');
}

function fileSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}

/** Builds and downloads the formal split sheet. jsPDF is loaded on demand to keep the first load small. */
export async function downloadSplitSheetPdf(draft: SplitSheetDraft): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
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

  const title = safe(draft.songTitle.trim() || 'Untitled');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SPLIT SHEET AGREEMENT', margin, y);
  y += 26;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Song title: ${title}`, margin, y);
  y += 16;
  doc.text(`Session date: ${safe(formatISOForDisplay(draft.sessionDate))}`, margin, y);
  y += 16;
  doc.text(`Date generated: ${formatISOForDisplay(todayISO())}`, margin, y);
  y += 22;

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
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  cols.forEach((c) => doc.text(c.label, c.x, y));
  y += 5;
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentW, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  for (const c of draft.collaborators) {
    const nameLines = doc.splitTextToSize(safe(c.name.trim() || 'Unnamed'), cols[0]!.w) as string[];
    const ipiLines = doc.splitTextToSize(safe(c.ipi?.trim() || '-'), cols[2]!.w) as string[];
    const rowLines = Math.max(nameLines.length, ipiLines.length, 1);
    ensure(rowLines * 13 + 6);
    doc.text(nameLines, cols[0]!.x, y);
    doc.text(safe(c.role), cols[1]!.x, y);
    doc.text(ipiLines, cols[2]!.x, y);
    doc.text(fmtPct(c.masterPct), cols[3]!.x, y);
    doc.text(fmtPct(c.publishingPct), cols[4]!.x, y);
    y += rowLines * 13 + 4;
  }
  ensure(30);
  doc.line(margin, y, margin + contentW, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', cols[0]!.x, y);
  doc.text(fmtPct(sumPct(draft.collaborators, 'masterPct')), cols[3]!.x, y);
  doc.text(fmtPct(sumPct(draft.collaborators, 'publishingPct')), cols[4]!.x, y);
  y += 30;

  // Signatures
  ensure(60);
  doc.setFontSize(12);
  doc.text('Signatures', margin, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const c of draft.collaborators) {
    ensure(54);
    y += 28;
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + 280, y);
    doc.line(margin + 310, y, margin + 430, y);
    y += 12;
    doc.text(`${safe(c.name.trim() || 'Unnamed')} (${safe(c.role)})`, margin, y);
    doc.text('Date', margin + 310, y);
    y += 6;
  }

  y += 18;
  ensure(60);
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
