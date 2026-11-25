import { ArrowUpRight, BookOpen, Calculator, CalendarCheck, ChevronRight, CircleDollarSign, FileSearch, FileSignature, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { formatLongDate } from '../../lib/dates';
import { nextMilestone, planRelease, relativeDays } from '../../lib/release';
import { splitStatus } from '../../lib/splitSheet';
import { Card } from '../ui/card';
import { useRoyaltyReadiness } from '../tools/RoyaltyAudit';
import { IosInstallTip } from './IosInstallTip';

/** Colorful "course card" style: pastel gradients with dark text, so contrast holds in both themes. */
const GRADIENTS = {
  release: 'linear-gradient(135deg, #f59a45 0%, #f8c46a 100%)',
  money: 'linear-gradient(135deg, #4fdc9a 0%, #a6ecd0 100%)',
  splits: 'linear-gradient(135deg, #ff8fb4 0%, #ffc3a6 100%)',
} as const;

interface TriageCardProps {
  to: string;
  title: string;
  hint: string;
  icon: LucideIcon;
  gradient: string;
  meta: string;
  /** 0-100, or null when there is nothing to measure yet. */
  progress: number | null;
}

function TriageCard({ to, title, hint, icon: Icon, gradient, meta, progress }: TriageCardProps) {
  return (
    <Link
      to={to}
      style={{ background: gradient }}
      className="lift group relative block overflow-hidden rounded-[26px] p-5 text-[#2a1308] shadow-[var(--shadow-pop)] transition-transform active:scale-[0.985] sm:p-6"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/25 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/50">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <h2 className="relative mt-4 text-xl font-extrabold leading-snug">{title}</h2>
      <p className="relative mt-1 text-[15px] text-[#43260f]">{hint}</p>
      <div className="relative mt-4 flex items-center gap-3">
        <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-bold">{meta}</span>
        {progress !== null && (
          <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-white/45">
            <span className="block h-full rounded-full bg-[#2a1308]/80 transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </span>
        )}
      </div>
    </Link>
  );
}

function Row({ to, icon: Icon, tint, label, children, chip }: { to: string; icon: LucideIcon; tint: string; label: string; children: React.ReactNode; chip: string }) {
  return (
    <Link to={to} className="flex items-center gap-3.5 p-4 transition-colors hover:bg-surface-2">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tint}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-muted">{label}</span>
        <span className="block font-semibold">{children}</span>
      </span>
      <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold tabular-nums">{chip}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}

export function HomeTriageHero() {
  const { state } = useLocalProgress();
  const { done, total, percent } = useRoyaltyReadiness();

  const release = state.activeRelease;
  const next = nextMilestone(release);
  const plan = release ? planRelease(release.releaseDate, release.type) : [];
  const releaseDone = release ? plan.filter((m) => release.completedMilestoneIds.includes(m.id)).length : 0;
  const releaseTotal = plan.length;
  const releasePct = releaseTotal ? Math.round((releaseDone / releaseTotal) * 100) : 0;
  const shelved = state.savedReleases.length;

  const draft = state.splitSheetDraft;
  const splitsOk = splitStatus(draft.collaborators, 'masterPct').ok && splitStatus(draft.collaborators, 'publishingPct').ok;
  const hasDraft = draft.songTitle.trim() !== '' || draft.collaborators.length > 1;

  return (
    <div>
      {/* Hero: your logo artwork breaks out of the card, like the sticker-style images in the inspiration apps. */}
      <section
        aria-labelledby="home-title"
        style={{ background: 'linear-gradient(135deg, #f59a45 0%, #f6b95c 55%, #f8d9a8 100%)' }}
        className="relative mb-5 min-h-[236px] overflow-hidden rounded-[30px] p-5 pr-[40%] text-[#2a1308] shadow-[var(--shadow-pop)] sm:min-h-[260px] sm:p-8 sm:pr-[44%]"
      >
        <span aria-hidden="true" className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
        <h1 id="home-title" className="relative font-display text-[1.45rem] font-bold leading-[1.1] tracking-tight min-[360px]:text-[1.75rem] sm:text-5xl">
          What are you <span className="text-[#7a2f04]">working on?</span>
        </h1>
        <p className="relative mt-3 text-[15px] font-medium text-[#43260f] min-[360px]:text-base sm:text-lg">Pick one. Everything here is free, and it keeps working without a signal once it has loaded.</p>
        <img
          src="/hero-art.webp"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          width="320"
          height="320"
          className="float pointer-events-none absolute -bottom-4 -right-5 w-[46%] max-w-[300px] rotate-[7deg] drop-shadow-[0_16px_18px_rgba(70,30,5,0.38)]"
        />
      </section>
      <p className="mb-6 px-1 text-sm text-muted">Made for artists releasing music in the U.S. Royalty details follow U.S. organizations; other countries have their own.</p>

      <IosInstallTip />

      {next && release && (
        <Link
          to="/release"
          className="mb-6 block rounded-3xl border border-accent/50 bg-accent/10 p-4 backdrop-blur-sm transition-colors hover:bg-accent/15"
        >
          <p className="text-sm font-bold text-accent">Up next{release.title ? ` for "${release.title}"` : ''}</p>
          <p className="mt-1 text-lg font-semibold leading-snug">{next.label}</p>
          <p className="mt-1 flex items-center justify-between text-sm text-muted">
            <span>Due {formatLongDate(next.due)} ({relativeDays(next.daysFromNow)})</span>
            <ChevronRight className="h-5 w-5 text-accent" aria-hidden="true" />
          </p>
        </Link>
      )}

      {!release && done === 0 && !hasDraft && (
        <Link to="/guides/start-here" className="mb-4 flex items-center justify-between gap-3 rounded-3xl border border-accent/50 bg-accent/10 p-4 backdrop-blur-sm transition-colors hover:bg-accent/15">
          <span>
            <span className="block font-bold">New to this? Start here</span>
            <span className="text-[15px] text-muted">A short path from your first song to getting paid.</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        </Link>
      )}

      <div className="stagger grid gap-4 lg:grid-cols-3">
        <TriageCard
          to="/release"
          title="I'm about to drop a song"
          hint="Pick your release day and get a dated to-do list."
          icon={CalendarCheck}
          gradient={GRADIENTS.release}
          meta={release ? `${releaseDone} of ${releaseTotal} steps` : 'Not started'}
          progress={release ? releasePct : null}
        />
        <TriageCard
          to="/audit"
          title="I have music out. Am I missing money?"
          hint="Four free sign-ups (U.S.) that collect the money you are owed."
          icon={CircleDollarSign}
          gradient={GRADIENTS.money}
          meta={`${done} of ${total} set up`}
          progress={percent}
        />
        <TriageCard
          to="/split-sheet"
          title="I'm in the studio with collaborators"
          hint="Write down who owns what before anyone leaves."
          icon={FileSignature}
          gradient={GRADIENTS.splits}
          meta={hasDraft ? (splitsOk ? 'Splits add up' : 'Needs attention') : 'No draft yet'}
          progress={null}
        />
      </div>

      <section aria-labelledby="progress-title" className="mt-10">
        <h2 id="progress-title" className="mb-3 font-display text-xl font-bold">Your progress</h2>
        <Card className="divide-y divide-border overflow-hidden rounded-3xl">
          <Row to="/audit" icon={CircleDollarSign} tint="bg-good/20 text-good" label="Royalties" chip={`${percent}%`}>
            Royalty Infrastructure: {done}/{total} Complete
          </Row>
          <Row to="/release" icon={CalendarCheck} tint="bg-accent/20 text-accent" label="Release plan" chip={release ? `${releaseDone}/${releaseTotal}` : '0'}>
            {release ? `${release.title || 'Untitled'}: ${releaseDone} of ${releaseTotal} steps done${shelved ? ` (+${shelved} saved)` : ''}` : 'Nothing planned yet'}
          </Row>
          <Row to="/split-sheet" icon={FileSignature} tint="bg-pink/20 text-pink" label="Split sheet" chip={hasDraft ? (splitsOk ? '100%' : '!') : '0'}>
            {hasDraft ? `${draft.songTitle.trim() || 'Untitled'}: ${splitsOk ? 'splits add up' : 'not adding up yet'}${state.savedSplitSheets.length ? ` (+${state.savedSplitSheets.length} saved)` : ''}` : 'No draft yet'}
          </Row>
        </Card>
      </section>

      <section aria-labelledby="learn-title" className="mt-10">
        <h2 id="learn-title" className="mb-3 font-display text-xl font-bold">More tools and guides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/guides" className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-4 transition-colors hover:border-accent/70">
            <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <span className="block font-bold">Guides</span>
              <span className="text-[15px] text-muted">Seven short guides, from your first release to getting paid.</span>
            </span>
          </Link>
          <Link to="/red-flags" className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-4 transition-colors hover:border-pink/70">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-pink" aria-hidden="true" />
            <span>
              <span className="block font-bold">Red flags</span>
              <span className="text-[15px] text-muted">Got a contract or a DM that feels off? Decode it here.</span>
            </span>
          </Link>
          <Link to="/streams" className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-4 transition-colors hover:border-accent/70">
            <Calculator className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <span className="block font-bold">Streaming earnings</span>
              <span className="text-[15px] text-muted">See roughly what your streams pay. A range, not a promise.</span>
            </span>
          </Link>
          <Link to="/contract" className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-4 transition-colors hover:border-accent/70 sm:col-span-2 lg:col-span-3">
            <FileSearch className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <span className="block font-bold">Contract check</span>
              <span className="text-[15px] text-muted">Add a contract and see which parts to worry about. Read on your device.</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
