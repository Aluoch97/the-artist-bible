import { ArrowRight, BookOpen, FileSearch, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContractCheck } from '../components/tools/ContractCheck';
import { RedFlagDecoder } from '../components/tools/RedFlagDecoder';
import { ToolHeader } from '../components/ui/ToolHeader';
import { chapters } from '../content';
import { cn } from '../lib/utils';

export type LearnSection = 'guides' | 'red-flags' | 'contract';

const SECTIONS: { id: LearnSection; label: string; to: string; icon: typeof BookOpen }[] = [
  { id: 'guides', label: 'Guides', to: '/guides', icon: BookOpen },
  { id: 'red-flags', label: 'Red Flags', to: '/red-flags', icon: ShieldAlert },
  { id: 'contract', label: 'Contract', to: '/contract', icon: FileSearch },
];

/** The Learn tab: five lifecycle chapters and the Red Flag Decoder in one place. */
export function LearnPage({ section }: { section: LearnSection }) {
  return (
    <section>
      <ToolHeader
        title="Learn the business"
        description={
          section === 'guides'
            ? "Short guides in plain English, in the order you'll run into these things."
            : section === 'red-flags'
              ? 'Contract traps and scams in plain English, from most serious to least. Type a word you saw in a contract or a DM.'
              : 'Add a contract and see which parts to worry about. Read on your device first; AI review is optional.'
        }
      />

      <nav aria-label="Learn sections" className="no-print mb-6 grid grid-cols-3 gap-1 rounded-full border border-border bg-surface p-1">
        {SECTIONS.map(({ id, label, to, icon: Icon }) => {
          const active = id === section;
          return (
            <Link
              key={id}
              to={to}
              replace
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors sm:gap-2 sm:text-[15px]',
                active ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </Link>
          );
        })}
      </nav>

      {section === 'guides' ? (
        <ol className="space-y-3">
          {chapters.map((c) => (
            <li key={c.slug}>
              <Link to={`/guides/${c.slug}`} className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/70 sm:p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 font-display text-xl font-bold text-accent">{c.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold leading-snug">{c.title}</span>
                  <span className="mt-0.5 block text-[15px] text-muted">{c.summary}</span>
                </span>
                <ArrowRight className="mt-2.5 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      ) : section === 'red-flags' ? (
        <RedFlagDecoder embedded />
      ) : (
        <ContractCheck />
      )}
    </section>
  );
}
