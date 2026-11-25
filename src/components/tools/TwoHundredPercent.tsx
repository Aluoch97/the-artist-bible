import { Disc3, PenLine } from 'lucide-react';
import { Card } from '../ui/card';

/** Visual explainer: every song is two separate 100% pies. */
export function TwoHundredPercent() {
  return (
    <figure className="not-prose my-6" aria-labelledby="two-hundred-caption">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <Card className="border-accent/40 p-4">
          <div className="flex items-center gap-2 text-accent">
            <Disc3 className="h-5 w-5" aria-hidden="true" />
            <span className="font-mono text-2xl font-bold tabular-nums">100%</span>
          </div>
          <h3 className="mt-1 font-semibold">Master recording</h3>
          <p className="mt-1 text-sm text-muted">The finished recording you hear. Usually owned by the artist, producer or label who paid for it.</p>
        </Card>
        <div className="flex items-center justify-center font-mono text-2xl font-bold text-muted" aria-hidden="true">+</div>
        <Card className="border-good/40 p-4">
          <div className="flex items-center gap-2 text-good">
            <PenLine className="h-5 w-5" aria-hidden="true" />
            <span className="font-mono text-2xl font-bold tabular-nums">100%</span>
          </div>
          <h3 className="mt-1 font-semibold">Publishing (the song)</h3>
          <p className="mt-1 text-sm text-muted">The melody and lyrics as written. Owned by the songwriters, no matter who recorded it.</p>
        </Card>
      </div>
      <figcaption id="two-hundred-caption" className="mt-3 text-sm text-muted">
        Every song is <strong className="text-fg">200%</strong>: 100% master + 100% publishing. Each side is split on its own, and each side has to total 100%.
      </figcaption>
    </figure>
  );
}
