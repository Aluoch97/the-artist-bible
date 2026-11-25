import { AlertTriangle, Check, Link2, Printer, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { industryData } from '../../data';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { copyText } from '../../lib/clipboard';
import { addDays, daysBetween, formatLongDate, parseISODate, todayISO } from '../../lib/dates';
import { cn } from '../../lib/utils';
import type { ReleaseType } from '../../types/bible';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { ProgressBar } from '../ui/ProgressBar';
import { ToolHeader } from '../ui/ToolHeader';

const TYPE_OPTIONS: { value: ReleaseType; label: string; tip: string }[] = [
  { value: 'single', label: 'Single', tip: 'One song. The timeline below fits it as written.' },
  { value: 'ep', label: 'EP', tip: 'A few songs. Finish every master and credit sheet before the first milestone.' },
  { value: 'album', label: 'Album', tip: 'Many songs. Consider starting earlier, since more tracks means more metadata and more splits to register.' },
];

const isType = (v: string | null): v is ReleaseType => v === 'single' || v === 'ep' || v === 'album';
const RELEASE_ID = 'active';

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

  const milestones = useMemo(() => {
    if (!targetDate) return [];
    const today = parseISODate(todayISO())!;
    return [...industryData.releaseMilestones]
      .sort((a, b) => b.weeksOut - a.weeksOut)
      .map((m) => {
        const due = addDays(targetDate, -m.weeksOut * 7);
        return { ...m, due, daysFromNow: daysBetween(today, due) };
      });
  }, [targetDate]);

  const completed = saved && targetDate && saved.releaseDate === date ? saved.completedMilestoneIds : [];
  const doneCount = milestones.filter((m) => completed.includes(m.id)).length;
  const behind = milestones.filter((m) => m.daysFromNow < 0 && !completed.includes(m.id)).length;
  const releaseIsPast = targetDate ? daysBetween(parseISODate(todayISO())!, targetDate) < 0 : false;

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
        title="Release Timeline Calculator"
        description="Pick your release day. We count backward and give you the exact date each task is due."
      />

      <Card className="no-print mb-6 grid gap-4 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="rel-title" className="mb-1.5 block text-sm font-semibold">Release title</label>
          <Input id="rel-title" value={title} maxLength={120} placeholder="e.g. Midnight Drive" onChange={(e) => setTitle(e.target.value)} />
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Release type</legend>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  'flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                  type === o.value ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-bg text-muted hover:text-fg',
                )}
              >
                <input type="radio" name="rel-type" value={o.value} checked={type === o.value} onChange={() => setType(o.value)} className="sr-only" />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="rel-date" className="mb-1.5 block text-sm font-semibold">Target release date</label>
          <Input id="rel-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono" />
        </div>

        {typeTip && <p className="text-sm text-muted sm:col-span-2">{typeTip}</p>}
      </Card>

      {!targetDate ? (
        <Card className="p-6 text-center text-muted">Choose a release date to see your timeline.</Card>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{title || 'Untitled release'}</h2>
              <p className="text-sm text-muted">
                {TYPE_OPTIONS.find((o) => o.value === type)?.label} · Release day {formatLongDate(targetDate)}
              </p>
            </div>
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
          </div>
          <p className="sr-only" role="status">{copied === 'ok' ? 'Shareable link copied to clipboard' : ''}</p>

          {releaseIsPast && (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> That date has already passed. Pick a future release day to plan ahead.
            </p>
          )}
          {!releaseIsPast && behind > 0 && (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {behind} {behind === 1 ? 'task is' : 'tasks are'} already past due for this date. Consider pushing release day back, or do the overdue tasks first.
            </p>
          )}

          <Card className="mb-4 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold">Plan progress</span>
              <span className="font-mono tabular-nums">{doneCount}/{milestones.length} done</span>
            </div>
            <ProgressBar value={milestones.length ? (doneCount / milestones.length) * 100 : 0} label="Release plan progress" />
          </Card>

          <ol className="space-y-2">
            {milestones.map((m) => {
              const isDone = completed.includes(m.id);
              const overdue = !isDone && m.daysFromNow < 0;
              return (
                <li key={m.id} className="print-break-avoid">
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                      isDone ? 'border-good/40' : overdue ? 'border-warn/50' : 'border-border hover:border-muted',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleReleaseMilestone(m.id)}
                      disabled={!saved || saved.releaseDate !== date}
                      className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--good)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold tabular-nums">{formatLongDate(m.due)}</span>
                        <Badge variant={m.weeksOut === 0 ? 'accent' : 'neutral'}>
                          {m.weeksOut === 0 ? 'Release day' : `${m.weeksOut} wk out`}
                        </Badge>
                        {overdue && <Badge variant="warn">Past due</Badge>}
                      </span>
                      <span className={cn('mt-1 block text-sm', isDone && 'text-muted line-through')}>{m.label}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted">Dates are calculated in your local time zone. Shared links carry only the title, type and date, never your checkmarks.</p>
        </div>
      )}
    </section>
  );
}
