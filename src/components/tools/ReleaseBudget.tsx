import { Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { industryData } from '../../data';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { newId } from '../../lib/utils';
import { BackToTools } from '../ui/BackToTools';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Field } from '../ui/Field';
import { StepHeading } from '../ui/StepHeading';
import { ToolHeader } from '../ui/ToolHeader';

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const count = (n: number) => Math.round(n).toLocaleString('en-US');
const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** Add up what a release costs and see how many streams it takes to earn that back. */
export function ReleaseBudget() {
  const { state, setBudget } = useLocalProgress();
  const items = state.budget;
  const total = items.reduce((a, i) => a + i.amount, 0);
  const { platforms } = industryData.streamingRates;

  const update = (id: string, patch: Partial<{ label: string; amount: number }>) => setBudget(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <section>
      <BackToTools />
      <ToolHeader title="Release budget" description="Add up what a release will cost and see how many streams it takes to earn it back. Saved on your device." />

      <StepHeading n={1} title="What will it cost?" hint="Leave a line blank if it doesn't apply." />
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="flex items-end gap-2">
            <Field label="Item" value={i.label} maxLength={80} onChange={(e) => update(i.id, { label: e.target.value })} className="flex-[3]" />
            <Field label="Cost ($)" inputMode="decimal" placeholder="0" value={i.amount ? String(i.amount) : ''} onChange={(e) => update(i.id, { amount: num(e.target.value) })} className="flex-[2]" />
            <Button variant="ghost" size="icon" className="shrink-0" aria-label={`Remove ${i.label || 'item'}`} onClick={() => setBudget(items.filter((x) => x.id !== i.id))}>
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <Button className="mt-3" onClick={() => setBudget([...items, { id: newId(), label: '', amount: 0 }])}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Add an item
      </Button>

      <StepHeading n={2} title="Your total" />
      <Card className="p-4 sm:p-5" aria-live="polite">
        <p className="text-sm font-bold text-muted">This release costs about</p>
        <p className="font-display text-3xl font-extrabold text-accent">{money(total)}</p>
      </Card>

      <StepHeading n={3} title="Streams to earn it back" hint="A range, using the same rough rates as the streaming estimate." />
      {total > 0 ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface text-[0.9375rem]">
          {platforms.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <span>{p.name}</span>
              <span className="text-right font-bold tabular-nums">{count(total / p.high)} to {count(total / p.low)} streams</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-border bg-surface p-4 text-[0.9375rem] text-muted">Add some costs above to see this.</p>
      )}
      <p className="mt-3 text-sm text-muted">
        These numbers assume every dollar of streaming income is yours. Splits and distributor fees lower it. Try the <Link to="/streams" className="font-semibold text-fg underline underline-offset-4">streaming earnings estimate</Link> to include them.
      </p>
    </section>
  );
}
