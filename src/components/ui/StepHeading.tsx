import type { ReactNode } from 'react';

/** Numbered section title so long tools read as a short sequence of steps. */
export function StepHeading({ n, title, hint }: { n?: number; title: string; hint?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-start gap-3">
      {n !== undefined && (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-accent-fg" aria-hidden="true">{n}</span>
      )}
      <div>
        <h2 className="font-display text-xl font-bold leading-snug">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
    </div>
  );
}
