import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { glossary } from '../components/ui/Term';

/** The "Words" section of Learn: every music-business word the app uses, in plain English. */
export function WordsList() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [hash]);
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term));
  return (
    <dl className="space-y-3">
      {sorted.map((e) => (
        <div key={e.id} id={`word-${e.id}`} className="scroll-mt-24 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <dt className="font-display text-xl font-extrabold">{e.term}</dt>
          <dd className="mt-1 text-[1.0625rem] leading-relaxed text-muted">{e.meaning}</dd>
          <dd className="mt-2 rounded-xl bg-surface-2 p-3 text-[0.9375rem] leading-relaxed"><strong>Example:</strong> {e.example}</dd>
        </div>
      ))}
    </dl>
  );
}
