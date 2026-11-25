import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { industryData } from '../../data';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { cn } from '../../lib/utils';
import type { RoyaltyEntity } from '../../types/bible';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { ExternalLink } from '../ui/ExternalLink';
import { ProgressBar } from '../ui/ProgressBar';
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
    <Card className={cn('overflow-hidden transition-colors', done && 'border-good/40')}>
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark "${entity.name}" as ${done ? 'not done' : 'done'}`}
          onClick={onToggle}
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition-colors',
            done ? 'border-good bg-good text-accent-fg' : 'border-muted hover:border-fg',
          )}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{entity.name}</h3>
            <CostBadge cost={entity.cost} />
          </div>
          <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-muted">{entity.category}</p>
          <p className="mt-2 text-sm text-muted">{entity.whyItMatters}</p>

          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className="mt-3 flex cursor-pointer items-center gap-1 text-sm font-semibold text-accent"
          >
            {open ? 'Hide steps' : 'Show steps'}
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
          </button>

          {open && (
            <div id={panelId} className="mt-3 space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm marker:font-mono marker:text-muted">
                {entity.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <ExternalLink href={entity.officialUrl}>Official site</ExternalLink>
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
    <section aria-labelledby={embedded ? undefined : 'audit-title'} className={embedded ? 'not-prose my-8' : undefined}>
      {!embedded && (
        <div id="audit-title">
          <ToolHeader
            title="Royalty Setup Audit"
            description="Four free-to-join registrations decide whether you actually get paid. Check off what you have already set up."
          />
        </div>
      )}

      <Card className="mb-5 p-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold">Royalty Readiness</span>
          <span className="font-mono text-sm tabular-nums" aria-live="polite">
            {percent}% · {done}/{total} complete
          </span>
        </div>
        <ProgressBar value={percent} label="Royalty readiness" />
        {percent === 100 && <p className="mt-2 text-sm text-good">Everything is set up. Re-check when you release new music.</p>}
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
