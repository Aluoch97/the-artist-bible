import { Info } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { industryData } from '../../data';
import { Input } from '../ui/input';
import { StepHeading } from '../ui/StepHeading';
import { BackToTools } from '../ui/BackToTools';
import { ToolHeader } from '../ui/ToolHeader';

const { platforms, reviewed, note } = industryData.streamingRates;

const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number) => (n >= 100 ? `$${Math.round(n).toLocaleString('en-US')}` : `$${n.toFixed(2)}`);
const count = (n: number) => Math.round(n).toLocaleString('en-US');
const range = (lo: number, hi: number) => (Math.round(lo * 100) === Math.round(hi * 100) ? money(lo) : `${money(lo)} to ${money(hi)}`);

function reviewedLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Rough earnings estimate from stream counts. Rates come from the data file so one edit updates everything. */
export function StreamingCalculator() {
  const uid = useId();
  const [streams, setStreams] = useState<Record<string, string>>({});
  const [share, setShare] = useState('100');
  const [cut, setCut] = useState('0');
  const [goal, setGoal] = useState('100');

  const keep = (Math.min(100, num(share)) / 100) * (1 - Math.min(100, num(cut)) / 100);
  const rows = platforms.map((p) => {
    const n = num(streams[p.id] ?? '');
    return { ...p, n, lo: n * p.low * keep, hi: n * p.high * keep };
  });
  const totalStreams = rows.reduce((a, r) => a + r.n, 0);
  const lo = rows.reduce((a, r) => a + r.lo, 0);
  const hi = rows.reduce((a, r) => a + r.hi, 0);
  const target = Math.max(0, num(goal));

  return (
    <section>
      <BackToTools />
      <ToolHeader
        title="Streaming earnings estimate"
        description="Type in your stream counts to see roughly what they pay. It is only an estimate, and it runs on your device."
      />

      <aside className="mb-6 flex gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-[15px]">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
        <p>
          <strong>Treat this as a range, not a promise.</strong> {note} Rates last reviewed {reviewedLabel(reviewed)}. For exact numbers, check your distributor&apos;s earnings report.
        </p>
      </aside>

      <StepHeading n={1} title="How many streams?" hint="Fill in only the services you have numbers for." />
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((p) => (
          <div key={p.id} className="min-w-0">
            <label htmlFor={`${uid}-${p.id}`} className="mb-1.5 block text-sm font-bold">{p.name}</label>
            <Input
              id={`${uid}-${p.id}`}
              inputMode="numeric"
              placeholder="0"
              value={streams[p.id] ?? ''}
              onChange={(e) => setStreams((s) => ({ ...s, [p.id]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <StepHeading n={2} title="What share is yours?" hint="Collaborators and your distributor may take a share." />
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="min-w-0">
          <label htmlFor={`${uid}-share`} className="mb-1.5 block text-sm font-bold">Your share of the recording (%)</label>
          <Input id={`${uid}-share`} inputMode="decimal" value={share} onChange={(e) => setShare(e.target.value)} />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${uid}-cut`} className="mb-1.5 block text-sm font-bold">Distributor keeps (%)</label>
          <Input id={`${uid}-cut`} inputMode="decimal" value={cut} onChange={(e) => setCut(e.target.value)} />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Not sure of your share? <Link to="/split-sheet" className="font-semibold text-fg underline underline-offset-4">Build a split sheet</Link>. Check your distributor&apos;s fee page for what it keeps.
      </p>

      <StepHeading n={3} title="What it adds up to" />
      <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5" aria-live="polite">
        {totalStreams > 0 ? (
          <>
            <p className="text-sm font-bold text-muted">About</p>
            <p className="font-display text-3xl font-extrabold leading-tight text-accent">{range(lo, hi)}</p>
            <p className="mt-1 text-[15px] text-muted">from {count(totalStreams)} {totalStreams === 1 ? 'stream' : 'streams'} for you, after the shares above.</p>
            <ul className="mt-4 divide-y divide-border text-[15px]">
              {rows.filter((r) => r.n > 0).map((r) => (
                <li key={r.id} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0">{r.name} <span className="text-muted">({count(r.n)})</span></span>
                  <span className="shrink-0 font-bold tabular-nums">{range(r.lo, r.hi)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[15px] text-muted">Enter some streams above and your estimate shows up here.</p>
        )}
      </div>

      <StepHeading title="How many streams to earn a goal?" hint="The reverse: what it takes to reach a number." />
      <div className="max-w-xs">
        <label htmlFor={`${uid}-goal`} className="mb-1.5 block text-sm font-bold">I want to earn ($)</label>
        <Input id={`${uid}-goal`} inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>
      {target > 0 && keep > 0 && (
        <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface text-[15px]">
          {platforms.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <span>{p.name}</span>
              <span className="text-right font-bold tabular-nums">{count(target / (p.high * keep))} to {count(target / (p.low * keep))} streams</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 space-y-2 text-sm text-muted">
        <p><strong className="text-fg">What this covers:</strong> money for the recording (the master). Songwriters are paid separately, through a PRO and The MLC, and that money is not included. See <Link to="/audit" className="font-semibold text-fg underline underline-offset-4">Get Paid</Link>.</p>
        <p><strong className="text-fg">Why the range is wide:</strong> platforms pay from a shared pool, not a fixed rate per play. What you earn depends on the listener&apos;s country, whether they pay for a plan, and how much everyone else was streamed that month.</p>
      </div>
    </section>
  );
}
