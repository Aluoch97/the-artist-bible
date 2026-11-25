import { unzipSync } from 'fflate';

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_AI_CHARS = 45_000;

export type Extracted = { ok: true; text: string; note?: string } | { ok: false; error: string };

const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function fromPdf(file: File): Promise<Extracted> {
  // Loaded only when someone picks a PDF, so it costs nothing for everyone else.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 80); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = '';
    const lines: string[] = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      } else if (item.str && !item.str.endsWith(' ')) line += ' ';
    }
    if (line) lines.push(line);
    pages.push(lines.join('\n'));
  }
  const text = pages.join('\n\n').trim();
  if (text.length < 40) {
    return { ok: false, error: 'This PDF looks like a scan or photo, so there is no text to read. Paste the text instead (on iPhone, press and hold the page and choose Copy Text, or use Live Text).' };
  }
  return { ok: true, text, note: doc.numPages > 80 ? 'Only the first 80 pages were read.' : undefined };
}

function fromDocx(buf: Uint8Array): Extracted {
  const files = unzipSync(buf, { filter: (f) => f.name === 'word/document.xml' && f.originalSize < 40_000_000 });
  const xml = files['word/document.xml'];
  if (!xml) return { ok: false, error: 'That does not look like a Word (.docx) document.' };
  const text = decodeEntities(
    new TextDecoder()
      .decode(xml)
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  ).trim();
  return text.length < 40 ? { ok: false, error: 'No readable text was found in that document.' } : { ok: true, text };
}

/** Pulls plain text out of a PDF, Word or text file entirely on this device. */
export async function extractText(file: File): Promise<Extracted> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'That file is bigger than 8 MB. Try a smaller one, or paste the text.' };
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.pdf') || file.type === 'application/pdf') return await fromPdf(file);
    if (name.endsWith('.docx')) return fromDocx(new Uint8Array(await file.arrayBuffer()));
    if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) {
      const text = (await file.text()).trim();
      return text.length < 40 ? { ok: false, error: 'That file has almost no text in it.' } : { ok: true, text };
    }
    if (/\.(jpe?g|png|heic|webp|gif)$/.test(name) || file.type.startsWith('image/')) {
      return { ok: false, error: 'Photos can not be read yet. Paste the text instead (on iPhone, press and hold the text in the photo and choose Copy, or use Live Text).' };
    }
    if (name.endsWith('.doc')) return { ok: false, error: 'Old .doc files are not supported. Save it as .docx or PDF, or paste the text.' };
    return { ok: false, error: 'Use a PDF, Word (.docx) or text file, or paste the text.' };
  } catch {
    return { ok: false, error: 'Could not read that file. It may be password-protected or damaged. Paste the text instead.' };
  }
}
