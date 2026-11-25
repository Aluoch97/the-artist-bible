import { ArrowRight, Calculator, FileSearch, FileSignature, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToolHeader } from '../components/ui/ToolHeader';

interface ToolItem {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

// Add new tools here and they show up on the Tools tab.
export const TOOLS: ToolItem[] = [
  { to: '/split-sheet', title: 'Split sheet', description: 'Write down who owns what before anyone leaves the studio. Download a PDF or copy a text summary.', icon: FileSignature },
  { to: '/streams', title: 'Streaming earnings', description: 'Type in your stream counts to see roughly what they pay. A range, not a promise.', icon: Calculator },
  { to: '/contract', title: 'Contract check', description: 'Add a contract and see which parts to worry about. Read on your device.', icon: FileSearch },
  { to: '/guides/distribution-metadata', title: 'Distributor cost compare', description: 'Compare what different distributors would really cost you over a few years.', icon: Wallet },
];

/** The Tools tab: every interactive helper in one list. */
export function ToolsPage() {
  return (
    <section>
      <ToolHeader title="Tools" description="Small helpers for the business side of your music. Everything runs on your device." />
      <ul className="space-y-3">
        {TOOLS.map(({ to, title, description, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/70 sm:p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold leading-snug">{title}</span>
                <span className="mt-0.5 block text-[15px] text-muted">{description}</span>
              </span>
              <ArrowRight className="mt-2.5 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
