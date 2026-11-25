import { ChevronDown, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { redFlags } from '../../data';
import { cn } from '../../lib/utils';
import type { RedFlag, RedFlagCategory } from '../../types/bible';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ToolHeader } from '../ui/ToolHeader';

const CATEGORIES: ('All' | RedFlagCategory)[] = ['All', 'Contract', 'Distribution', 'Streaming Scam', 'Scam'];
/** Short labels so every filter pill fits on a narrow phone. */
const CATEGORY_LABEL: Record<string, string> = { 'Streaming Scam': 'Streaming' };

function matches(flag: RedFlag, q: string): boolean {
  if (!q) return true;
  const hay = [flag.term, flag.plainEnglish, flag.whyItHurts, ...flag.aliases, ...flag.lookFor].join(' ').toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

function FlagCard({ flag, level }: { flag: RedFlag; level: 2 | 3 }) {
  const Title = level === 2 ? 'h2' : 'h3';
  const Sub = level === 2 ? 'h3' : 'h4';
  const [open, setOpen] = useState(false);
  const id = `flag-${flag.id}`;
  const high = flag.severity === 'high';
  return (
    <article className={cn('print-break-avoid overflow-hidden rounded-2xl border border-border border-l-4 bg-surface', high ? 'border-l-pink' : 'border-l-gold')}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Title className="text-lg font-bold leading-snug">{flag.term}</Title>
          <Badge variant={high ? 'bad' : 'warn'}>
            <TriangleAlert className="h-3 w-3" aria-hidden="true" /> {high ? 'Serious' : 'Be careful'}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm font-semibold text-muted">{flag.category}</p>
        <p className="mt-2 text-[15px]">{flag.plainEnglish}</p>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="mt-2 flex min-h-11 cursor-pointer items-center gap-1 text-[15px] font-bold text-accent"
        >
          {open ? 'Show less' : 'Why it hurts and what to do'}
          <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>

        {open && (
          <div id={id} className="mt-1 space-y-4 text-[15px]">
            <div>
              <Sub className="mb-1 font-bold">Why it hurts</Sub>
              <p className="text-muted">{flag.whyItHurts}</p>
            </div>
            <div>
              <Sub className="mb-1 flex items-center gap-1.5 font-bold"><ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" /> What to do</Sub>
              <ul className="list-disc space-y-1 pl-5 text-muted marker:text-accent">
                {flag.whatToDo.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <Sub className="mb-1.5 font-bold">Wording to watch for</Sub>
              <ul className="flex flex-wrap gap-2">
                {flag.lookFor.map((s) => (
                  <li key={s} className="rounded-lg bg-surface-2 px-2.5 py-1 text-sm">{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function RedFlagDecoder({ embedded = false, className, headingLevel = 2 }: { embedded?: boolean; className?: string; headingLevel?: 2 | 3 }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');

  const results = useMemo(
    () => redFlags.filter((f) => (category === 'All' || f.category === category) && matches(f, query.trim())),
    [query, category],
  );

  return (
    <section className={cn(embedded && 'not-prose', className)}>
      {!embedded && (
        <ToolHeader
          title="Red flag decoder"
          description="Contract traps and scams in plain English. Type a word you saw in a contract or a DM."
        />
      )}

      <div className="no-print mb-4 space-y-3">
        <div className="relative">
          <label htmlFor={`rf-search${embedded ? '-e' : ''}`} className="sr-only">Search red flags</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            id={`rf-search${embedded ? '-e' : ''}`}
            type="search"
            value={query}
            placeholder="Search: 360, playlist, renewal"
            className="rounded-full pl-11"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'h-11 cursor-pointer rounded-full border px-4 text-sm font-bold transition-colors',
                category === c ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-muted hover:text-fg',
              )}
            >
              {CATEGORY_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-muted" role="status">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-muted">
          Nothing matches. If something still feels off, get a second opinion before you sign or pay.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((f) => <FlagCard key={f.id} flag={f} level={headingLevel} />)}
        </div>
      )}
      <p className="mt-4 text-xs text-muted">Educational information, not legal advice. Have an entertainment attorney review any contract.</p>
    </section>
  );
}
