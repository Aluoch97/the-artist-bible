import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { ToolHeader } from '../components/ui/ToolHeader';
import { chapters } from '../content';
import { formatVerified } from '../lib/dates';

export function GuidesIndex() {
  return (
    <section>
      <ToolHeader title="Lifecycle Chapters" description="Short, jargon-free guides in the order you will run into these things." />
      <ol className="space-y-3">
        {chapters.map((c) => (
          <li key={c.slug}>
            <Link to={`/guides/${c.slug}`} className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent">
              <span className="font-mono text-2xl font-bold text-accent tabular-nums">{String(c.number).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{c.title}</span>
                <span className="mt-1 block text-sm text-muted">{c.summary}</span>
                <Badge className="mt-2">Verified: {formatVerified(c.lastVerified)}</Badge>
              </span>
              <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
