import { ArrowRight, BookOpen, CalendarClock, CircleDollarSign, FileSignature, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { industryData } from '../../data';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { splitStatus } from '../../lib/splitSheet';
import { Card } from '../ui/card';
import { ProgressBar } from '../ui/ProgressBar';
import { useRoyaltyReadiness } from '../tools/RoyaltyAudit';

interface TriageCard {
  to: string;
  title: string;
  hint: string;
  icon: LucideIcon;
}

const CARDS: TriageCard[] = [
  { to: '/release', title: "I'm about to drop a song", hint: 'Get a dated, step-by-step release plan.', icon: CalendarClock },
  { to: '/audit', title: "I have music out. Am I missing money?", hint: 'Check the four registrations that collect your royalties.', icon: CircleDollarSign },
  { to: '/split-sheet', title: "I'm in the studio with collaborators", hint: 'Agree on splits before anyone leaves the room.', icon: FileSignature },
];

export function HomeTriageHero() {
  const { state } = useLocalProgress();
  const { done, total, percent } = useRoyaltyReadiness();

  const release = state.activeRelease;
  const milestoneIds = new Set(industryData.releaseMilestones.map((m) => m.id));
  const releaseDone = release ? release.completedMilestoneIds.filter((id) => milestoneIds.has(id)).length : 0;
  const releaseTotal = industryData.releaseMilestones.length;

  const draft = state.splitSheetDraft;
  const splitsOk = splitStatus(draft.collaborators, 'masterPct').ok && splitStatus(draft.collaborators, 'publishingPct').ok;

  return (
    <div>
      <section aria-labelledby="home-title" className="pb-8 pt-2 sm:pt-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Free · No login · Works offline</p>
        <h1 id="home-title" className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Know the business. <span className="text-accent">Get paid for your music.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Where are you right now? Pick one and we'll take you to the tool.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map(({ to, title, hint, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex min-h-40 flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <div>
              <Icon className="h-7 w-7 text-accent" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold leading-snug">{title}</h2>
              <p className="mt-1 text-sm text-muted">{hint}</p>
            </div>
            <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent">
              Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <section aria-labelledby="progress-title" className="mt-10">
        <h2 id="progress-title" className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Your progress</h2>
        <Card className="space-y-5 p-5">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <Link to="/audit" className="font-semibold hover:text-accent">Royalty Infrastructure: {done}/{total} Complete</Link>
              <span className="font-mono text-sm tabular-nums text-muted">{percent}%</span>
            </div>
            <ProgressBar value={percent} label="Royalty infrastructure progress" />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-muted">Release plan</dt>
              <dd className="mt-0.5 font-semibold">
                {release ? (
                  <Link to="/release" className="hover:text-accent">{release.title || 'Untitled'}: {releaseDone}/{releaseTotal} tasks</Link>
                ) : (
                  <Link to="/release" className="hover:text-accent">No release planned yet</Link>
                )}
              </dd>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-muted">Split sheet draft</dt>
              <dd className="mt-0.5 font-semibold">
                <Link to="/split-sheet" className="hover:text-accent">
                  {draft.songTitle.trim() || 'Untitled'}: {splitsOk ? 'splits add up' : 'needs attention'}
                </Link>
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section aria-label="More resources" className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/guides" className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent">
          <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="block font-bold">Lifecycle Chapters</span>
            <span className="text-sm text-muted">Five short guides, from owning your songs to rolling them out.</span>
          </span>
        </Link>
        <Link to="/red-flags" className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent">
          <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="block font-bold">Red Flag Glossary</span>
            <span className="text-sm text-muted">360 deals, botted playlists and other traps, decoded.</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
