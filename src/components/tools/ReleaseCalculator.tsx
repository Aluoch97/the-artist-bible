import { AlertTriangle, CalendarCheck, Check, Link2, PartyPopper, Printer, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { copyText } from '../../lib/clipboard';
import { daysBetween, formatLongDate, parseISODate, todayISO } from '../../lib/dates';
import { planRelease, relativeDays } from '../../lib/release';
import { cn } from '../../lib/utils';
import type { ReleaseType } from '../../types/bible';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { DateInput } from '../ui/DateInput';
import { Input } from '../ui/input';
import { ProgressBar } from '../ui/ProgressBar';
import { StepHeading } from '../ui/StepHeading';
import { ToolHeader } from '../ui/ToolHeader';

const TYPE_OPTIONS: { value: ReleaseType; label: string; tip: string }[] = [
  { value: 'single', label: 'Single', tip: 'One song. The plan below fits it as written.' },
  { value: 'ep', label: 'EP', tip: 'A few songs. Finish every master and credit sheet before the first step.' },
  { value: 'album', label: 'Album', tip: 'Many songs. Consider starting earlier, since more tracks means more metadata and more splits to register.' },
];

const isType = (v: string | null): v is ReleaseType => v === 'single' || v === 'ep' || v === 'album';
const RELEASE_ID = 'active';
const shortDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export function ReleaseCalculator() {
  const [params, setParams] = useSearchParams();
  const { state, saveRelease, toggleReleaseMilestone } = useLocalProgress();
  const saved = state.activeRelease;

  // Initial form values: a shared link (URL params) wins over this device's saved release.
  const [title, setTitle] = useState(() => params.get('title') ?? saved?.title ?? '');
  const [type, setType] = useState<ReleaseType>(() => {
    const p = params.get('type');
    return isType(p) ? p : (saved?.type ?? 'single');
  });
  const [date, setDate] = useState(() => {
    const p = params.get('date');
    return p && parseISODate(p) ? p : (saved?.releaseDate ?? '');
  });
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const firstRun = useRef(true);

  const targetDate = parseISODate(date);

  // Persist + mirror to the URL whenever the form changes.
  useEffect(() => {
    const hydratedFromLink = firstRun.current && params.has('date');
    firstRun.current = false;

    if (targetDate) {
      const sameAsSaved = saved && saved.title === title && saved.type === type && saved.releaseDate === date;
      if (!sameAsSaved) {
        // A different release from a shared link starts with a clean checklist.
        const keep = hydratedFromLink ? [] : (saved?.completedMilestoneIds ?? []);
        saveRelease({ id: RELEASE_ID, title, type, releaseDate: date, completedMilestoneIds: keep });
      }
    }

    const next = new URLSearchParams();
    if (title) next.set('title', title);
    next.set('type', type);
    if (targetDate) next.set('date', date);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, type, date]);

  const milestones = useMemo(() => (targetDate ? planRelease(date) : []), [targetDate, date]);

  const completed = saved && targetDate && saved.releaseDate === date ? saved.completedMilestoneIds : [];
  const canCheck = Boolean(saved && saved.releaseDate === date);
  const doneCount = milestones.filter((m) => completed.includes(m.id)).length;
  const behind = milestones.filter((m) => m.daysFromNow < 0 && !completed.includes(m.id)).length;
  const nextUp = milestones.find((m) => !completed.includes(m.id));
  const allDone = milestones.length > 0 && doneCount === milestones.length;
  const daysToRelease = targetDate ? daysBetween(parseISODate(todayISO())!, targetDate) : 0;
  const releaseIsPast = targetDate ? daysToRelease < 0 : false;

  async function copyLink() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    if (title) url.searchParams.set('title', title);
    url.searchParams.set('type', type);
    url.searchParams.set('date', date);
    const ok = await copyText(url.toString());
    setCopied(ok ? 'ok' : 'fail');
    window.setTimeout(() => setCopied('idle'), 2500);
  }

  function startOver() {
    setTitle('');
    setType('single');
    setDate('');
    saveRelease(null);
  }

  const typeTip = TYPE_OPTIONS.find((o) => o.value === type)?.tip;

  return (
    <section>
      <ToolHeader
        title="Plan your release"
        description="Pick the day your music comes out. We work backward and tell you what to do by when."
      />

      <Card className="no-print grid gap-5 p-4 sm:p-5">
        <div>
          <label htmlFor="rel-date" className="mb-1.5 block font-bold">When does it come out?</label>
          <DateInput id="rel-date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="rel-title" className="mb-1.5 block font-bold">What's it called? <span className="font-normal text-muted">(optional)</span></label>
          <Input id="rel-title" value={title} maxLength={120} placeholder="e.g. Midnight Drive" onChange={(e) => setTitle(e.target.value)} />
        </div>
        <fieldset>
          <legend className="mb-1.5 font-bold">What kind of release?</legend>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  'flex h-12 cursor-pointer items-center justify-center rounded-full border text-[15px] font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold',
                  type === o.value ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-bg text-muted hover:text-fg',
                )}
              >
                <input type="radio" name="rel-type" value={o.value} checked={type === o.value} onChange={() => setType(o.value)} className="sr-only" />
                {o.label}
              </label>
            ))}
          </div>
          {typeTip && <p className="mt-2 text-sm text-muted">{typeTip}</p>}
        </fieldset>
      </Card>

      {!targetDate ? (
        <Card className="mt-6 flex items-center gap-3 p-5 text-muted">
          <CalendarCheck className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
          <p>Choose a release date above and your step-by-step plan appears here.</p>
        </Card>
      ) : (
        <div>
          <div className="mt-8">
            <h2 className="font-display text-2xl font-bold leading-tight">{title || 'Your release'}</h2>
            <p className="mt-1 text-muted">
              {TYPE_OPTIONS.find((o) => o.value === type)?.label} · out {formatLongDate(targetDate)}
              {!releaseIsPast && ` (${relativeDays(daysToRelease)})`}
            </p>
          </div>

          {releaseIsPast && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> That date has already passed. Pick a future release day to plan ahead.
            </p>
          )}
          {!releaseIsPast && behind > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {behind} {behind === 1 ? 'step is' : 'steps are'} already behind for this date. Do those first, or move your release day back.
            </p>
          )}

          {allDone ? (
            <Card className="mt-5 flex items-center gap-3 border-accent/50 bg-accent/10 p-5">
              <PartyPopper className="h-7 w-7 shrink-0 text-accent" aria-hidden="true" />
              <p className="font-semibold">Every step is done. Go enjoy release day.</p>
            </Card>
          ) : (
            nextUp &&
            canCheck && (
              <div className="no-print mt-5 rounded-2xl border border-accent/50 bg-accent/10 p-4 sm:p-5">
                <p className="text-sm font-bold text-accent">Do this next</p>
                <p className="mt-1 text-lg font-semibold leading-snug">{nextUp.label}</p>
                <p className="mt-1 text-sm text-muted">Due {formatLongDate(nextUp.due)} ({relativeDays(nextUp.daysFromNow)})</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={() => toggleReleaseMilestone(nextUp.id)}>
                  <Check className="h-4 w-4" aria-hidden="true" /> Mark as done
                </Button>
              </div>
            )
          )}

          <StepHeading title="Your full plan" hint={`${doneCount} of ${milestones.length} done`} />
          <ProgressBar value={milestones.length ? (doneCount / milestones.length) * 100 : 0} label="Release plan progress" className="mb-4" />

          <ol className="space-y-2.5">
            {milestones.map((m) => {
              const isDone = completed.includes(m.id);
              const overdue = !isDone && m.daysFromNow < 0;
              return (
                <li key={m.id} className="print-break-avoid">
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3.5 rounded-2xl border bg-surface p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold',
                      isDone ? 'border-accent/40 bg-surface/60' : overdue ? 'border-warn/60' : 'border-border hover:border-muted',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleReleaseMilestone(m.id)}
                      disabled={!canCheck}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-muted/70 text-transparent transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg"
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold tabular-nums">{shortDate(m.due)}</span>
                        <Badge variant={m.weeksOut === 0 ? 'accent' : 'neutral'}>{m.weeksOut === 0 ? 'Release day' : `${m.weeksOut} ${m.weeksOut === 1 ? 'week' : 'weeks'} before`}</Badge>
                        {overdue && <Badge variant="warn">Behind</Badge>}
                      </span>
                      <span className={cn('mt-1 block text-[15px]', isDone && 'text-muted line-through')}>{m.label}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>

          <StepHeading title="Share it with your team" hint="Send the link and they see the same dates. No account needed." />
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="primary" onClick={copyLink}>
              {copied === 'ok' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
              {copied === 'ok' ? 'Link copied' : copied === 'fail' ? 'Copy failed' : 'Copy Shareable Link'}
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" /> Print / Save PDF
            </Button>
            <Button variant="ghost" onClick={startOver}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> New release
            </Button>
          </div>
          <p className="sr-only" role="status">{copied === 'ok' ? 'Shareable link copied to clipboard' : ''}</p>
          <p className="mt-3 text-xs text-muted">Dates use your local time zone. Shared links carry only the title, type and date, never your checkmarks.</p>
        </div>
      )}
    </section>
  );
}
