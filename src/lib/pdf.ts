import type { jsPDF } from 'jspdf';
import type { EpkDraft, SplitSheetDraft } from '../types/bible';
import { formatISOForDisplay, formatLongDate, todayISO } from './dates';
import type { PlannedMilestone } from './release';
import { fmtPct, sumPct } from './splitSheet';

/* jsPDF's built-in fonts only cover Latin-1. Names are the whole point of a split sheet, so anything
   outside Latin-1 (Ł, Cyrillic, Chinese, Arabic, emoji…) is drawn with the phone's own fonts onto a
   canvas and placed in the PDF as a picture. Plain text stays real, selectable text.

   Every PDF shares one Artist Bible look: a warm gradient header band with the logo artwork, brand colors,
   colored chips and a branded footer on every page. Colors match the app (see src/index.css). */

const LATIN1 = /^[\x20-\x7E -ÿ]*$/;
const SCALE = 4; // canvas pixels per PDF point, for crisp text
const FONT_STACK = `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans CJK SC", "Hiragino Sans", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif`;
const SITE = 'bible.nrnszn.com';

type Doc = jsPDF;
type RGB = [number, number, number];

const C = {
  brown: [42, 19, 8] as RGB,
  muted: [110, 80, 58] as RGB,
  white: [255, 255, 255] as RGB,
  orange: [240, 138, 60] as RGB,
  deep: [166, 67, 7] as RGB,
  amber: [243, 196, 107] as RGB,
  peach: [253, 234, 219] as RGB,
  cream: [255, 248, 240] as RGB,
  pink: [255, 106, 166] as RGB,
  pinkSoft: [255, 214, 226] as RGB,
  green: [11, 107, 60] as RGB,
  greenBright: [79, 220, 154] as RGB,
  greenSoft: [200, 240, 220] as RGB,
  bad: [179, 38, 30] as RGB,
  badSoft: [255, 224, 218] as RGB,
  lilac: [185, 163, 255] as RGB,
  sky: [110, 197, 255] as RGB,
  rule: [232, 206, 184] as RGB,
};
/** Colors cycled through steps and collaborators, in the same order as the app's gradient cards. */
const ACCENTS: RGB[] = [C.orange, C.amber, C.pink, C.greenBright, C.lilac, C.sky];

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
  align?: 'left' | 'right' | 'center';
  color?: RGB;
}

/** Draw one line. Returns the width used in points. */
function line(doc: Doc, str: string, x: number, y: number, o: TextOpts): number {
  const color = o.color ?? C.brown;
  if (LATIN1.test(str)) {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(o.size);
    doc.setTextColor(color[0], color[1], color[2]);
    let text = str;
    if (o.maxW) {
      // Shrink up to 25%, then trim, so long names never run into the artwork or off the page.
      let size = o.size;
      while (doc.getTextWidth(text) > o.maxW && size > o.size * 0.75) {
        size -= 0.5;
        doc.setFontSize(size);
      }
      if (doc.getTextWidth(text) > o.maxW) {
        while (text.length > 1 && doc.getTextWidth(text + '…') > o.maxW) text = text.slice(0, -1);
        text += '…';
      }
    }
    doc.text(text, x, y, o.align ? { align: o.align } : undefined);
    const w = doc.getTextWidth(text);
    doc.setFontSize(o.size);
    return w;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // No canvas available: fall back to a visible placeholder rather than silently dropping a name.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(o.size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(str.replace(/[^\x20-\x7E -ÿ]/g, '?'), x, y);
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
  c2.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  c2.textBaseline = 'alphabetic';
  c2.fillText(text, 2, Math.round(size * 1.12 * SCALE));
  const wPt = canvas.width / SCALE;
  const hPt = canvas.height / SCALE;
  const left = o.align === 'right' ? x - wPt : o.align === 'center' ? x - wPt / 2 : x;
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', left, y - size * 1.12, wPt, hPt);
  return wPt;
}

/** Wrap Latin text across lines; non-Latin text is kept to one fitted line. Returns lines used. */
function wrapped(doc: Doc, str: string, x: number, y: number, o: TextOpts & { maxW: number }, lineH: number): number {
  if (LATIN1.test(str)) {
    const color = o.color ?? C.brown;
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(o.size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(str, o.maxW) as string[];
    lines.forEach((l, i) => doc.text(l, x, y + i * lineH));
    return lines.length;
  }
  line(doc, str, x, y, o);
  return 1;
}

/* ---------- Shared Artist Bible look ---------- */

interface BrandAssets {
  /** The warm gradient behind the header, as a JPEG data address (null: a flat orange band is drawn instead). */
  band: string | null;
  /** The logo artwork as a PNG data address (null: the header is drawn without it). */
  art: string | null;
}

function makeBand(): string | null {
  try {
    const c = document.createElement('canvas');
    c.width = 1224;
    c.height = 300;
    const g = c.getContext('2d');
    if (!g) return null;
    const grad = g.createLinearGradient(0, 0, 1224, 300);
    grad.addColorStop(0, '#f08a3c');
    grad.addColorStop(0.55, '#f6b95c');
    grad.addColorStop(1, '#f9dcae');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1224, 300);
    // Soft light, like the glow on the home screen cards.
    const glow = g.createRadialGradient(150, 20, 10, 150, 20, 420);
    glow.addColorStop(0, 'rgba(255,255,255,0.38)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 1224, 300);
    return c.toDataURL('image/jpeg', 0.9);
  } catch {
    return null;
  }
}

async function loadArt(): Promise<string | null> {
  try {
    const res = await fetch('/hero-art.webp');
    if (!res.ok) return null;
    const bmp = await createImageBitmap(await res.blob());
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 320;
    const g = c.getContext('2d');
    if (!g) return null;
    g.drawImage(bmp, 0, 0, 320, 320);
    return c.toDataURL('image/png');
  } catch {
    return null; // offline and not saved, or blocked: the PDF still gets its colors and wordmark
  }
}

async function loadBrand(): Promise<BrandAssets> {
  return { band: makeBand(), art: await loadArt() };
}

const PAGE_MARGIN = 54;
const BAND_H = 132;

interface HeaderOpts {
  kicker: string;
  title: string;
  subtitle?: string;
}

/** First-page header: gradient band, wordmark, kicker, big title and the logo artwork breaking out of the band. */
function brandHeader(doc: Doc, brand: BrandAssets, o: HeaderOpts): number {
  const pageW = doc.internal.pageSize.getWidth();
  if (brand.band) doc.addImage(brand.band, 'JPEG', 0, 0, pageW, BAND_H);
  else {
    doc.setFillColor(...C.orange);
    doc.rect(0, 0, pageW, BAND_H, 'F');
  }
  const textW = pageW - PAGE_MARGIN * 2 - (brand.art ? 128 : 0);
  line(doc, 'THE ARTIST BIBLE', PAGE_MARGIN, 34, { size: 9, bold: true, color: C.deep });
  line(doc, o.kicker.toUpperCase(), PAGE_MARGIN, 54, { size: 12, bold: true, color: C.deep, maxW: textW });
  line(doc, o.title, PAGE_MARGIN, 90, { size: 28, bold: true, color: C.brown, maxW: textW });
  if (o.subtitle) line(doc, o.subtitle, PAGE_MARGIN, 112, { size: 11, color: C.brown, maxW: textW });
  if (brand.art) doc.addImage(brand.art, 'PNG', pageW - PAGE_MARGIN - 118, 12, 124, 124);
  return BAND_H + 24;
}

/** Later pages: a slim orange strip with the wordmark. Returns where content starts. */
function nextPage(doc: Doc): number {
  const pageW = doc.internal.pageSize.getWidth();
  doc.addPage();
  doc.setFillColor(...C.orange);
  doc.rect(0, 0, pageW, 26, 'F');
  line(doc, 'THE ARTIST BIBLE', PAGE_MARGIN, 17, { size: 8, bold: true, color: C.brown });
  return 62;
}

/** Colored bar and site name at the bottom of every page, plus page numbers. */
function brandFooters(doc: Doc, note?: string): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...C.orange);
    doc.rect(0, pageH - 9, pageW * 0.5, 9, 'F');
    doc.setFillColor(...C.amber);
    doc.rect(pageW * 0.5, pageH - 9, pageW * 0.25, 9, 'F');
    doc.setFillColor(...C.pink);
    doc.rect(pageW * 0.75, pageH - 9, pageW * 0.25, 9, 'F');
    line(doc, `Generated via The Artist Bible  |  ${SITE}`, PAGE_MARGIN, pageH - 22, { size: 8, color: C.muted });
    line(doc, `Page ${p} of ${pages}`, pageW - PAGE_MARGIN, pageH - 22, { size: 8, color: C.muted, align: 'right' });
    if (note) line(doc, note, PAGE_MARGIN, pageH - 34, { size: 7.5, color: C.muted, maxW: pageW - PAGE_MARGIN * 2 });
  }
}

/** A small rounded label ("DONE", "BEHIND", "100%"). Fixed English text only. Returns its width. */
function chip(doc: Doc, text: string, x: number, y: number, fill: RGB, color: RGB, size = 8): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  const w = doc.getTextWidth(text) + 14;
  const h = size + 8;
  doc.setFillColor(...fill);
  doc.roundedRect(x, y - h + 3, w, h, h / 2, h / 2, 'F');
  doc.setTextColor(...color);
  doc.text(text, x + 7, y);
  return w;
}

/** A section heading with a colored marker, like the app's gradient cards. */
function sectionHeading(doc: Doc, text: string, x: number, y: number, accent: RGB): void {
  doc.setFillColor(...accent);
  doc.roundedRect(x, y - 12, 5, 16, 2.5, 2.5, 'F');
  line(doc, text, x + 13, y, { size: 14, bold: true, color: C.brown });
}

function tick(doc: Doc, cx: number, cy: number, r: number, filled: boolean, accent: RGB): void {
  if (filled) {
    doc.setFillColor(...C.green);
    doc.circle(cx, cy, r, 'F');
    doc.setDrawColor(...C.white);
    doc.setLineWidth(1.6);
    doc.line(cx - r * 0.45, cy + 0.2, cx - r * 0.1, cy + r * 0.45);
    doc.line(cx - r * 0.1, cy + r * 0.45, cx + r * 0.5, cy - r * 0.4);
  } else {
    doc.setDrawColor(...accent);
    doc.setLineWidth(1.6);
    doc.circle(cx, cy, r, 'S');
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

/* ---------- Split sheet ---------- */

/** Builds and downloads the formal split sheet. jsPDF is loaded on demand to keep the first load small. */
export async function downloadSplitSheetPdf(draft: SplitSheetDraft): Promise<void> {
  const [{ jsPDF: PDF }, brand] = await Promise.all([import('jspdf'), loadBrand()]);
  const doc = new PDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = PAGE_MARGIN;
  const contentW = pageW - margin * 2;
  const title = draft.songTitle.trim() || 'Untitled';
  let y = brandHeader(doc, brand, {
    kicker: 'Split sheet agreement',
    title,
    subtitle: `Session date: ${formatISOForDisplay(draft.sessionDate)}   |   Generated: ${formatISOForDisplay(todayISO())}`,
  });

  const ensure = (needed: number): void => {
    if (y + needed > pageH - 46) y = nextPage(doc);
  };

  const intro = doc.splitTextToSize(
    'The undersigned collaborators agree that ownership of the master recording and of the musical composition ' +
      '(publishing) of the song named above is divided as shown below. Each side totals 100%.',
    contentW,
  ) as string[];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...C.brown);
  doc.text(intro, margin, y);
  y += intro.length * 13 + 14;

  // The 200% of a song, as two colored bars: one slice per collaborator.
  const bar = (label: string, key: 'masterPct' | 'publishingPct'): void => {
    const total = sumPct(draft.collaborators, key);
    const ok = Math.abs(total - 100) < 0.005;
    line(doc, label, margin, y, { size: 10, bold: true });
    chip(doc, `${fmtPct(total)}`, margin + contentW - 52, y, ok ? C.greenSoft : C.badSoft, ok ? C.green : C.bad, 9);
    y += 8;
    doc.setFillColor(...C.peach);
    doc.roundedRect(margin, y, contentW, 14, 7, 7, 'F');
    const scale = Math.max(100, total);
    let x = margin;
    draft.collaborators.forEach((c, i) => {
      const w = (Math.max(0, c[key]) / scale) * contentW;
      if (w < 0.5) return;
      doc.setFillColor(...ACCENTS[i % ACCENTS.length]!);
      doc.rect(x, y, w, 14, 'F');
      x += w;
    });
    y += 30;
  };
  bar('Master recording (the sound)', 'masterPct');
  bar('Publishing (the song itself)', 'publishingPct');
  y += 4;

  // Table
  const cols = [
    { label: 'Name', x: margin + 16, w: 134 },
    { label: 'Role', x: margin + 160, w: 92 },
    { label: 'PRO / IPI #', x: margin + 258, w: 88 },
    { label: 'Master %', x: margin + 352, w: 58 },
    { label: 'Publishing %', x: margin + 420, w: 74 },
  ];
  doc.setFillColor(...C.deep);
  doc.roundedRect(margin, y - 14, contentW, 24, 8, 8, 'F');
  cols.forEach((c) => line(doc, c.label, c.x, y + 2, { size: 10, bold: true, color: C.white }));
  y += 26;

  draft.collaborators.forEach((c, i) => {
    ensure(40);
    const nameLines = wrapped(doc, c.name.trim() || 'Unnamed', cols[0]!.x, y, { size: 10, maxW: cols[0]!.w }, 13);
    const ipiLines = wrapped(doc, c.ipi?.trim() || '-', cols[2]!.x, y, { size: 10, maxW: cols[2]!.w }, 13);
    line(doc, c.role, cols[1]!.x, y, { size: 10, maxW: cols[1]!.w });
    line(doc, fmtPct(c.masterPct), cols[3]!.x, y, { size: 10, bold: true });
    line(doc, fmtPct(c.publishingPct), cols[4]!.x, y, { size: 10, bold: true });
    doc.setFillColor(...ACCENTS[i % ACCENTS.length]!);
    doc.circle(margin + 6, y - 3, 4.5, 'F');
    const rowH = Math.max(nameLines, ipiLines, 1) * 13 + 16;
    y += rowH;
    doc.setDrawColor(...C.rule);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 15, margin + contentW, y - 15);
  });
  ensure(34);
  y += 6;
  doc.setFillColor(...C.peach);
  doc.roundedRect(margin, y - 14, contentW, 26, 8, 8, 'F');
  line(doc, 'TOTAL', cols[0]!.x, y + 3, { size: 10, bold: true });
  const mTotal = sumPct(draft.collaborators, 'masterPct');
  const pTotal = sumPct(draft.collaborators, 'publishingPct');
  line(doc, fmtPct(mTotal), cols[3]!.x, y + 3, { size: 10, bold: true, color: Math.abs(mTotal - 100) < 0.005 ? C.green : C.bad });
  line(doc, fmtPct(pTotal), cols[4]!.x, y + 3, { size: 10, bold: true, color: Math.abs(pTotal - 100) < 0.005 ? C.green : C.bad });
  y += 44;

  // Signatures
  ensure(80);
  sectionHeading(doc, 'Signatures', margin, y, C.pink);
  y += 12;
  draft.collaborators.forEach((c, i) => {
    ensure(58);
    y += 32;
    doc.setDrawColor(...ACCENTS[i % ACCENTS.length]!);
    doc.setLineWidth(1.2);
    doc.line(margin, y, margin + 280, y);
    doc.line(margin + 310, y, margin + 430, y);
    y += 13;
    const nameW = line(doc, c.name.trim() || 'Unnamed', margin, y, { size: 10, bold: true, maxW: 220 });
    line(doc, ` (${c.role})`, margin + nameW, y, { size: 10, color: C.muted });
    line(doc, 'Date', margin + 310, y, { size: 10, color: C.muted });
    y += 6;
  });
  doc.setDrawColor(0);

  brandFooters(doc, 'A convenience tool recording the parties\' intentions; not legal advice. Register splits with your PRO and The MLC, and consult an entertainment attorney for binding contracts.');
  doc.save(`split-sheet-${fileSlug(draft.songTitle)}.pdf`);
}

/* ---------- Press kit ---------- */

/** One-page press kit (EPK). Same on-demand jsPDF loading as the split sheet. */
export async function downloadEpkPdf(epk: EpkDraft): Promise<void> {
  const [{ jsPDF: PDF }, brand] = await Promise.all([import('jspdf'), loadBrand()]);
  const doc = new PDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = PAGE_MARGIN;
  const contentW = pageW - margin * 2;
  const name = epk.artistName.trim() || 'Artist name';
  const sub = [epk.genre.trim(), epk.location.trim()].filter(Boolean).join('   |   ');
  let y = brandHeader(doc, brand, { kicker: 'Press kit', title: name, subtitle: sub || undefined });
  const ensure = (needed: number): void => {
    if (y + needed > pageH - 46) y = nextPage(doc);
  };

  const bio = epk.bio.trim();
  if (bio) {
    sectionHeading(doc, 'About', margin, y, C.orange);
    y += 24;
    for (const para of bio.split(/\n+/)) {
      const used = wrapped(doc, para, margin, y, { size: 11, maxW: contentW }, 15);
      ensure(used * 15);
      y += used * 15 + 8;
    }
    y += 10;
  }

  const tracks = epk.topTracks.split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 12);
  if (tracks.length) {
    ensure(50);
    sectionHeading(doc, 'Listen', margin, y, C.pink);
    y += 26;
    tracks.forEach((t, i) => {
      ensure(30);
      doc.setFillColor(...ACCENTS[i % ACCENTS.length]!);
      doc.circle(margin + 10, y - 3.5, 10, 'F');
      line(doc, String(i + 1), margin + 10, y, { size: 10, bold: true, color: C.brown, align: 'center' });
      line(doc, t, margin + 28, y, { size: 11, maxW: contentW - 28 });
      y += 26;
    });
    y += 4;
  }

  const links: [string, string][] = [['Website', epk.website], ['Spotify', epk.spotify], ['Instagram', epk.instagram], ['Contact', epk.email]];
  const filled = links.filter(([, v]) => v.trim());
  if (filled.length) {
    ensure(40 + filled.length * 26);
    sectionHeading(doc, 'Find me', margin, y, C.greenBright);
    y += 28;
    for (const [label, value] of filled) {
      chip(doc, label.toUpperCase(), margin, y, C.peach, C.deep, 8);
      line(doc, value.trim(), margin + 78, y, { size: 11, maxW: contentW - 78 });
      y += 26;
    }
  }

  brandFooters(doc);
  doc.save(`${fileSlug(name)}-press-kit.pdf`);
}

/* ---------- Release plan ---------- */

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
  const [{ jsPDF: PDF }, brand] = await Promise.all([import('jspdf'), loadBrand()]);
  const doc = new PDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = PAGE_MARGIN;
  const contentW = pageW - margin * 2;
  const name = input.title.trim() || 'Untitled release';
  const typeLabel = input.type === 'ep' ? 'EP' : input.type.charAt(0).toUpperCase() + input.type.slice(1);
  let y = brandHeader(doc, brand, {
    kicker: 'Release plan',
    title: name,
    subtitle: `${typeLabel}   |   Release day: ${formatISOForDisplay(input.releaseDate)}`,
  });
  const ensure = (needed: number): void => {
    if (y + needed > pageH - 46) y = nextPage(doc);
  };

  // Progress
  const done = input.steps.filter((m) => input.completedIds.includes(m.id)).length;
  const total = Math.max(1, input.steps.length);
  line(doc, `${done} of ${input.steps.length} steps done`, margin, y, { size: 12, bold: true });
  line(doc, `Printed ${formatISOForDisplay(todayISO())}`, margin + contentW, y, { size: 9, color: C.muted, align: 'right' });
  y += 10;
  doc.setFillColor(...C.peach);
  doc.roundedRect(margin, y, contentW, 12, 6, 6, 'F');
  if (done > 0) {
    doc.setFillColor(...C.orange);
    doc.roundedRect(margin, y, Math.max(12, (done / total) * contentW), 12, 6, 6, 'F');
  }
  y += 28;

  const nextId = input.steps.find((m) => !input.completedIds.includes(m.id))?.id;
  const dateX = margin + 46;
  const stepX = margin + 176;
  const stepW = contentW - 176 - 12;

  input.steps.forEach((m, i) => {
    const isDone = input.completedIds.includes(m.id);
    const isRelease = m.weeksOut === 0;
    const accent = ACCENTS[i % ACCENTS.length]!;
    // Measure first so the card fits its text.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const labelLines = (doc.splitTextToSize(m.label, stepW) as string[]).length;
    const status = isDone ? 'DONE' : m.daysFromNow < 0 ? 'BEHIND' : m.id === nextId ? 'UP NEXT' : '';
    const h = Math.max(48, labelLines * 14 + (status ? 18 : 0) + 16);
    ensure(h + 2);

    // Card
    doc.setFillColor(...(isRelease ? C.amber : C.cream));
    doc.roundedRect(margin, y, contentW, h, 12, 12, 'F');
    doc.setDrawColor(...C.rule);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, contentW, h, 12, 12, 'S');
    doc.setFillColor(...accent);
    doc.roundedRect(margin, y, 8, h, 4, 4, 'F');
    doc.rect(margin + 4, y, 4, h, 'F');
    tick(doc, margin + 26, y + h / 2, 9, isDone, isRelease ? C.deep : accent);

    // Date column
    line(doc, formatLongDate(m.due), dateX, y + h / 2 - 2, { size: 10.5, bold: true, maxW: 124 });
    line(doc, isRelease ? 'RELEASE DAY' : m.weeksOut === 1 ? '1 week before' : `${m.weeksOut} weeks before`, dateX, y + h / 2 + 12, { size: 8.5, color: isRelease ? C.deep : C.muted, bold: isRelease, maxW: 124 });

    // Step text
    const textTop = y + 21;
    wrapped(doc, m.label, stepX, textTop, { size: 10.5, maxW: stepW, bold: isRelease }, 14);
    if (status) {
      const fill = isDone ? C.greenSoft : status === 'BEHIND' ? C.badSoft : C.peach;
      const col = isDone ? C.green : status === 'BEHIND' ? C.bad : C.deep;
      chip(doc, status, stepX, textTop + labelLines * 14 + 6, fill, col, 7.5);
    }
    y += h + 7;
  });
  doc.setDrawColor(0);

  brandFooters(doc, 'Dates are counted back from your release day in your local time zone. A planning aid, not legal or financial advice.');
  doc.save(`release-plan-${fileSlug(input.title)}.pdf`);
}
