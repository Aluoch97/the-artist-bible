import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { industryData } from '../../data';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { cn } from '../../lib/utils';
import type { RoyaltyEntity } from '../../types/bible';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { ExternalLink } from '../ui/ExternalLink';
import { ProgressRing } from '../ui/ProgressRing';
import { ToolHeader } from '../ui/ToolHeader';

/** Anything with no non-zero dollar amount is shown as "$0 Free". Mixed pricing shows the full text. */
function CostBadge({ cost }: { cost: string }) {
  const hasPaidOption = /\$[1-9]/.test(cost);
  return hasPaidOption ? <Badge variant="warn">{cost}</Badge> : <Badge variant="good">$0 Free</Badge>;
}

function AuditCard({ entity, done, onToggle }: { entity: RoyaltyEntity; done: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const panelId = `audit-steps-${entity.id}`;

  return (
    <Card className={cn('overflow-hidden transition-colors', done && 'border-accent/50')}>
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark "${entity.name}" as ${done ? 'not done' : 'done'}`}
          onClick={onToggle}
          className={cn(
            'mt-0.5 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-2 transition-colors active:scale-95',
            done ? 'border-accent bg-accent text-accent-fg' : 'border-muted/70 hover:border-accent',
          )}
        >
          {done && <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-lg font-bold leading-snug">{entity.name}</h3>
            <CostBadge cost={entity.cost} />
          </div>
          <p className="mt-0.5 text-sm font-semibold text-muted">{entity.category}</p>
          <p className="mt-2 text-[15px]">{entity.whyItMatters}</p>

          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className="mt-3 flex min-h-11 cursor-pointer items-center gap-1 text-[15px] font-bold text-accent"
          >
            {open ? 'Hide the steps' : 'How do I set this up?'}
            <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
          </button>

          {open && (
            <div id={panelId} className="mt-1 space-y-4">
              <ol className="space-y-3">
                {entity.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-[15px]">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-muted">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-semibold">
                <ExternalLink href={entity.officialUrl}>Go to the official site</ExternalLink>
                {entity.secondaryUrl && <ExternalLink href={entity.secondaryUrl}>Alternate site</ExternalLink>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function useRoyaltyReadiness() {
  const { state } = useLocalProgress();
  const ids = industryData.royaltyEntities.map((e) => e.id);
  const total = ids.length;
  // Count only IDs that still exist in the data file, so a data update can't push this past 100%.
  const done = state.completedAuditIds.filter((id) => ids.includes(id)).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function RoyaltyAudit({ embedded = false }: { embedded?: boolean }) {
  const { state, toggleAuditItem } = useLocalProgress();
  const { done, total, percent } = useRoyaltyReadiness();

  return (
    <section className={embedded ? 'not-prose my-8' : undefined}>
      {!embedded && (
        <ToolHeader
          title="Get paid what you're owed"
          description="Money from your music is collected by four different groups. Tick off the ones you've already joined."
        />
      )}

      <Card className="mb-5 flex items-center gap-4 p-4 sm:p-5">
        <ProgressRing value={percent} label="Royalty readiness" />
        <div>
          <p className="text-sm font-semibold text-muted">Royalty Readiness</p>
          <p className="font-display text-2xl font-bold" aria-live="polite">{done} of {total} set up</p>
          <p className="mt-0.5 text-sm text-muted">
            {percent === 100 ? 'All set. Re-check when you release new music.' : 'Start with any one. They are all free to check.'}
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        {industryData.royaltyEntities.map((entity) => (
          <AuditCard
            key={entity.id}
            entity={entity}
            done={state.completedAuditIds.includes(entity.id)}
            onToggle={() => toggleAuditItem(entity.id)}
          />
        ))}
      </div>
    </section>
  );
}
