import { Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface Row {
  id: number;
  name: string;
  perRelease: string; // one-time fee per release
  yearly: string; // yearly fee (per release or whole account; see "yearlyCovers")
  yearlyPerRelease: boolean;
  cutPct: string; // % of earnings the distributor keeps
}

const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/** Fees are typed in by the artist from each company's own page, so nothing here goes out of date. */
export function DistributorCompare() {
  const uid = useId();
  const [releases, setReleases] = useState('4');
  const [years, setYears] = useState('3');
  const [earnings, setEarnings] = useState('500');
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: '', perRelease: '', yearly: '', yearlyPerRelease: true, cutPct: '0' },
    { id: 2, name: '', perRelease: '', yearly: '', yearlyPerRelease: false, cutPct: '0' },
  ]);
  const [nextId, setNextId] = useState(3);

  const nReleases = Math.max(0, Math.min(200, Math.floor(num(releases))));
  const nYears = Math.max(1, Math.min(20, Math.floor(num(years)) || 1));
  const yearlyEarn = Math.max(0, num(earnings));

  const results = rows.map((r) => {
    const totalReleases = nReleases * nYears; // simple: new releases each year, all kept live
    const oneTime = num(r.perRelease) * totalReleases;
    // Releases stay live while you pay: on average a release released during year k is live for (nYears - k + 1) years.
    const liveReleaseYears = nReleases * (nYears * (nYears + 1)) / 2;
    const yearly = r.yearlyPerRelease ? num(r.yearly) * liveReleaseYears : num(r.yearly) * nYears;
    const cut = (yearlyEarn * nYears * Math.min(100, num(r.cutPct))) / 100;
    return { id: r.id, fees: oneTime + yearly, cut, total: oneTime + yearly + cut };
  });
  const filled = rows.filter((r) => r.perRelease !== '' || r.yearly !== '' || r.cutPct !== '0');
  const cheapest = filled.length > 1 ? Math.min(...results.filter((x) => filled.some((f) => f.id === x.id)).map((x) => x.total)) : null;

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="not-prose my-8 rounded-3xl border border-border bg-surface p-4 sm:p-5">
      <h3 className="font-display text-xl font-bold">What will each one really cost me?</h3>
      <p className="mt-1 text-[0.9375rem] text-muted">
        Open each company&apos;s fee page and type in what it says. The math runs on your device and nothing is saved or sent anywhere. Estimates only.
      </p>

      <div className="mt-4 grid grid-cols-3 items-end gap-2">
        {[
          { id: 'rel', label: 'Releases a year', v: releases, set: setReleases },
          { id: 'yrs', label: 'Years', v: years, set: setYears },
          { id: 'earn', label: 'Earned a year ($)', v: earnings, set: setEarnings },
        ].map((f) => (
          <div key={f.id} className="min-w-0">
            <label htmlFor={`${uid}-${f.id}`} className="mb-1 block text-xs font-bold leading-tight">{f.label}</label>
            <Input id={`${uid}-${f.id}`} inputMode="decimal" value={f.v} onChange={(e) => f.set(e.target.value)} className="px-3" />
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {rows.map((r, i) => {
          const res = results[i]!;
          const best = cheapest !== null && filled.some((f) => f.id === r.id) && res.total === cheapest;
          return (
            <fieldset key={r.id} className={cn('rounded-2xl border p-3', best ? 'border-good/60 bg-good/10' : 'border-border bg-bg/40')}>
              <legend className="px-1 text-sm font-bold">Option {i + 1}{best ? ' · lowest estimate' : ''}</legend>
              <div className="grid grid-cols-2 items-end gap-2">
                <div className="col-span-2">
                  <label htmlFor={`${uid}-n${r.id}`} className="mb-1 block text-xs font-bold">Company (optional)</label>
                  <Input id={`${uid}-n${r.id}`} value={r.name} maxLength={60} onChange={(e) => update(r.id, { name: e.target.value })} />
                </div>
                <div className="min-w-0">
                  <label htmlFor={`${uid}-p${r.id}`} className="mb-1 block text-xs font-bold">One-time fee per release ($)</label>
                  <Input id={`${uid}-p${r.id}`} inputMode="decimal" placeholder="0" value={r.perRelease} onChange={(e) => update(r.id, { perRelease: e.target.value })} className="px-3" />
                </div>
                <div className="min-w-0">
                  <label htmlFor={`${uid}-y${r.id}`} className="mb-1 block text-xs font-bold">Yearly fee ($)</label>
                  <Input id={`${uid}-y${r.id}`} inputMode="decimal" placeholder="0" value={r.yearly} onChange={(e) => update(r.id, { yearly: e.target.value })} className="px-3" />
                </div>
                <label className="col-span-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={r.yearlyPerRelease} onChange={(e) => update(r.id, { yearlyPerRelease: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" />
                  The yearly fee is charged per release (not one fee for everything)
                </label>
                <div className="min-w-0">
                  <label htmlFor={`${uid}-c${r.id}`} className="mb-1 block text-xs font-bold">They keep (% of earnings)</label>
                  <Input id={`${uid}-c${r.id}`} inputMode="decimal" value={r.cutPct} onChange={(e) => update(r.id, { cutPct: e.target.value })} className="px-3" />
                </div>
                <div className="flex items-end justify-end">
                  {rows.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} aria-label={`Remove option ${i + 1}`}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[0.9375rem]" aria-live="polite">
                About <strong>{money(res.total)}</strong> over {nYears} {nYears === 1 ? 'year' : 'years'}
                <span className="text-muted"> ({money(res.fees)} in fees{res.cut > 0 ? ` + ${money(res.cut)} kept by them` : ''})</span>
              </p>
            </fieldset>
          );
        })}
      </div>

      {rows.length < 4 && (
        <Button className="mt-4" onClick={() => { setRows((rs) => [...rs, { id: nextId, name: '', perRelease: '', yearly: '', yearlyPerRelease: false, cutPct: '0' }]); setNextId((n) => n + 1); }}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add another option
        </Button>
      )}
      <p className="mt-4 text-sm text-muted">
        Assumes you release the same number of songs each year and keep every release live. Cost isn&apos;t everything: also check what happens to your music if you stop paying, and whether you can take it with you.
      </p>
    </div>
  );
}
