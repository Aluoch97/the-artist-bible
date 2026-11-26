import { BookA, CircleHelp, X } from 'lucide-react';
import { Fragment, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import glossaryJson from '../../data/glossary.json';
import type { GlossaryEntry } from '../../types/bible';

export const glossary = glossaryJson as GlossaryEntry[];
const byId = new Map(glossary.map((e) => [e.id, e]));

/* One shared "what does this word mean" sheet, opened from anywhere. */
let openId: string | null = null;
const listeners = new Set<() => void>();
const setOpen = (id: string | null) => {
  openId = id;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** A word that opens its plain-English meaning when tapped. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const entry = byId.get(id);
  if (!entry) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => setOpen(id)}
      aria-haspopup="dialog"
      title={`What is ${entry.term}?`}
      className="cursor-pointer border-b border-dotted border-current bg-transparent p-0 font-[inherit] text-[inherit] underline-offset-2 hover:text-accent"
    >
      {children}
    </button>
  );
}

/** Small "?" button for places where the word sits inside a label. */
export function HelpButton({ id, label }: { id: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => setOpen(id)}
      aria-haspopup="dialog"
      aria-label={label}
      className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:text-accent"
    >
      <CircleHelp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

const compiled = glossary.map((e) => ({ id: e.id, re: new RegExp(`\\b(?:${e.match})\\b`, 'i') }));

/** Finds the glossary entries whose words appear in some text (used for "words in this plan"). */
export function termsIn(texts: string[]): GlossaryEntry[] {
  const joined = texts.join(' \n ');
  return glossary.filter((e) => compiled.find((c) => c.id === e.id)!.re.test(joined));
}

/** Text with the first use of each music word made tappable. */
export function Annotated({ text, skip = [] }: { text: string; skip?: string[] }) {
  const active = compiled.filter((c) => !skip.includes(c.id));
  const hits: { start: number; end: number; id: string }[] = [];
  for (const c of active) {
    const m = c.re.exec(text);
    if (m) hits.push({ start: m.index, end: m.index + m[0].length, id: c.id });
  }
  hits.sort((a, b) => a.start - b.start);
  const clean: typeof hits = [];
  for (const h of hits) if (!clean.length || h.start >= clean[clean.length - 1]!.end) clean.push(h);
  if (clean.length === 0) return <>{text}</>;
  const out: ReactNode[] = [];
  let pos = 0;
  clean.forEach((h, i) => {
    out.push(<Fragment key={`t${i}`}>{text.slice(pos, h.start)}</Fragment>);
    out.push(<Term key={`w${i}`} id={h.id}>{text.slice(h.start, h.end)}</Term>);
    pos = h.end;
  });
  out.push(<Fragment key="rest">{text.slice(pos)}</Fragment>);
  return <>{out}</>;
}

/** Mount once in the app shell. */
export function GlossaryDialog() {
  const id = useSyncExternalStore(subscribe, () => openId, () => null);
  const ref = useRef<HTMLDialogElement>(null);
  const entry = id ? byId.get(id) : undefined;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (entry && !d.open) d.showModal();
    if (!entry && d.open) d.close();
  }, [entry]);

  return (
    <dialog
      ref={ref}
      onClose={() => setOpen(null)}
      onClick={(e) => { if (e.target === ref.current) setOpen(null); }}
      aria-labelledby="glossary-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl border border-border bg-[var(--surface-solid)] p-0 text-fg backdrop:bg-black/70"
    >
      {entry && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-accent"><BookA className="h-4 w-4" aria-hidden="true" /> What it means</p>
              <h2 id="glossary-title" className="mt-1 font-display text-2xl font-extrabold">{entry.term}</h2>
            </div>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:text-fg">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 text-[17px] leading-relaxed">{entry.meaning}</p>
          <p className="mt-3 rounded-2xl bg-surface-2 p-3 text-[15px] leading-relaxed"><strong>Example:</strong> {entry.example}</p>
          <Link to={`/words#word-${entry.id}`} onClick={() => setOpen(null)} className="mt-4 inline-flex min-h-11 items-center font-bold text-accent underline underline-offset-4">
            See all music words
          </Link>
        </div>
      )}
    </dialog>
  );
}
