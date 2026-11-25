import { ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToolHeader } from '../components/ui/ToolHeader';
import { chapters } from '../content';

export function GuidesIndex() {
  return (
    <section>
      <ToolHeader title="Learn the business" description="Short guides in plain English, in the order you'll run into these things." />

      <Link
        to="/red-flags"
        className="group mb-6 flex items-center gap-4 rounded-2xl border border-pink/40 bg-pink/10 p-4 transition-colors hover:bg-pink/15"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pink/20 text-pink">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Got a contract or a message that feels off?</span>
          <span className="text-[15px] text-muted">Look it up in the Red Flag Decoder.</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-pink transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>

      <ol className="space-y-3">
        {chapters.map((c) => (
          <li key={c.slug}>
            <Link to={`/guides/${c.slug}`} className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/70 sm:p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 font-display text-xl font-bold text-accent">{c.number}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold leading-snug">{c.title}</span>
                <span className="mt-0.5 block text-[15px] text-muted">{c.summary}</span>
              </span>
              <ArrowRight className="mt-2.5 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
