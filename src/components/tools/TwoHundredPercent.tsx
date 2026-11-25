import { Disc3, PenLine } from 'lucide-react';

/** Visual explainer: every song is two separate 100% pies. */
export function TwoHundredPercent() {
  return (
    <figure className="not-prose my-6" aria-labelledby="two-hundred-caption">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <div className="flex items-center gap-2 text-accent">
            <Disc3 className="h-6 w-6" aria-hidden="true" />
            <span className="font-display text-3xl font-bold tabular-nums">100%</span>
          </div>
          <h2 className="mt-1 font-bold">The recording</h2>
          <p className="mt-1 text-[15px] text-muted">The audio file everyone hears. Usually owned by whoever paid for the session. This is called the master.</p>
        </div>
        <div className="flex items-center justify-center font-display text-3xl font-bold text-muted" aria-hidden="true">+</div>
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <div className="flex items-center gap-2 text-gold">
            <PenLine className="h-6 w-6" aria-hidden="true" />
            <span className="font-display text-3xl font-bold tabular-nums">100%</span>
          </div>
          <h2 className="mt-1 font-bold">The song itself</h2>
          <p className="mt-1 text-[15px] text-muted">The melody and lyrics as written. Owned by the songwriters, no matter who records it. This is called publishing.</p>
        </div>
      </div>
      <figcaption id="two-hundred-caption" className="mt-3 text-[15px] text-muted">
        Every song is <strong className="text-fg">200%</strong>: 100% recording + 100% song. You split each side separately, and each side must add up to 100%.
      </figcaption>
    </figure>
  );
}
