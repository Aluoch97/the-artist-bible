import { ArrowRight, BookOpen, CalendarCheck, ChevronRight, CircleDollarSign, FileSignature, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { industryData } from '../../data';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { formatLongDate } from '../../lib/dates';
import { nextMilestone, relativeDays } from '../../lib/release';
import { splitStatus } from '../../lib/splitSheet';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { ProgressBar } from '../ui/ProgressBar';
import { useRoyaltyReadiness } from '../tools/RoyaltyAudit';

interface TriageCard {
  to: string;
  title: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
}

const CARDS: TriageCard[] = [
  { to: '/release', title: "I'm about to drop a song", hint: 'Pick your release day and get a dated to-do list.', icon: CalendarCheck, tint: 'bg-accent/15 text-accent' },
  { to: '/audit', title: 'I have music out. Am I missing money?', hint: 'Four free sign-ups that collect the money you are owed.', icon: CircleDollarSign, tint: 'bg-gold/15 text-gold' },
  { to: '/split-sheet', title: "I'm in the studio with collaborators", hint: 'Write down who owns what before anyone leaves.', icon: FileSignature, tint: 'bg-pink/15 text-pink' },
];

export function HomeTriageHero() {
  const { state } = useLocalProgress();
  const { done, total, percent } = useRoyaltyReadiness();

  const release = state.activeRelease;
  const next = nextMilestone(release);
  const milestoneIds = new Set(industryData.releaseMilestones.map((m) => m.id));
  const releaseDone = release ? release.completedMilestoneIds.filter((id) => milestoneIds.has(id)).length : 0;
  const releaseTotal = industryData.releaseMilestones.length;

  const draft = state.splitSheetDraft;
  const splitsOk = splitStatus(draft.collaborators, 'masterPct').ok && splitStatus(draft.collaborators, 'publishingPct').ok;
  const hasDraft = draft.songTitle.trim() !== '' || draft.collaborators.length > 1;

  return (
    <div>
      <section aria-labelledby="home-title" className="mb-7">
        <h1 id="home-title" className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          What are you <span className="text-accent">working on?</span>
        </h1>
        <p className="mt-3 text-lg text-muted">Pick one. Everything here is free and works offline.</p>
      </section>

      {next && release && (
        <Link
          to="/release"
          className="mb-6 block rounded-2xl border border-accent/50 bg-accent/10 p-4 transition-colors hover:bg-accent/15"
        >
          <p className="text-sm font-bold text-accent">Up next{release.title ? ` for "${release.title}"` : ''}</p>
          <p className="mt-1 text-lg font-semibold leading-snug">{next.label}</p>
          <p className="mt-1 flex items-center justify-between text-sm text-muted">
            <span>Due {formatLongDate(next.due)} ({relativeDays(next.daysFromNow)})</span>
            <ChevronRight className="h-5 w-5 text-accent" aria-hidden="true" />
          </p>
        </Link>
      )}

      <div className="grid gap-3">
        {CARDS.map(({ to, title, hint, icon: Icon, tint }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/70 active:bg-surface-2 sm:p-5"
          >
            <span className={cn('grid h-14 w-14 shrink-0 place-items-center rounded-2xl', tint)}>
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold leading-snug">{title}</span>
              <span className="mt-0.5 block text-[15px] text-muted">{hint}</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <section aria-labelledby="progress-title" className="mt-10">
        <h2 id="progress-title" className="mb-3 font-display text-xl font-bold">Your progress</h2>
        <Card className="divide-y divide-border">
          <Link to="/audit" className="block p-4 transition-colors hover:bg-surface-2/50">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="font-semibold">Royalty Infrastructure: {done}/{total} Complete</span>
              <span className="text-sm font-bold tabular-nums text-muted">{percent}%</span>
            </div>
            <ProgressBar value={percent} label="Royalty infrastructure progress" />
          </Link>
          <Link to="/release" className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-2/50">
            <span>
              <span className="block text-sm text-muted">Release plan</span>
              <span className="font-semibold">
                {release ? `${release.title || 'Untitled'}: ${releaseDone} of ${releaseTotal} steps done` : 'Nothing planned yet'}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          </Link>
          <Link to="/split-sheet" className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface-2/50">
            <span>
              <span className="block text-sm text-muted">Split sheet</span>
              <span className="font-semibold">
                {hasDraft ? `${draft.songTitle.trim() || 'Untitled'}: ${splitsOk ? 'splits add up' : 'not adding up yet'}` : 'No draft yet'}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          </Link>
        </Card>
      </section>

      <section aria-labelledby="learn-title" className="mt-10">
        <h2 id="learn-title" className="mb-3 font-display text-xl font-bold">Learn the basics</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/guides" className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/70">
            <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <span className="block font-bold">Lifecycle Chapters</span>
              <span className="text-[15px] text-muted">Five short guides, from owning your songs to rolling them out.</span>
            </span>
          </Link>
          <Link to="/red-flags" className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-pink/70">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-pink" aria-hidden="true" />
            <span>
              <span className="block font-bold">Red Flag Glossary</span>
              <span className="text-[15px] text-muted">Got a contract or a DM that feels off? Decode it here.</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
