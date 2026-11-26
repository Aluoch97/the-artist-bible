import { ArrowUpRight, Calculator, FileSearch, FileSignature, Mic2, Music, Newspaper, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocalProgress } from '../hooks/useLocalProgress';

/** Pastel gradients with dark text (same recipe as the Home cards), so contrast holds in both themes. */
const GRADIENTS = {
  orange: 'linear-gradient(135deg, #f59a45 0%, #f8c46a 100%)',
  green: 'linear-gradient(135deg, #4fdc9a 0%, #a6ecd0 100%)',
  pink: 'linear-gradient(135deg, #ff8fb4 0%, #ffc3a6 100%)',
  lilac: 'linear-gradient(135deg, #b9a3ff 0%, #e0d4ff 100%)',
  sky: 'linear-gradient(135deg, #6ec5ff 0%, #bfe8ff 100%)',
  sun: 'linear-gradient(135deg, #f6d04d 0%, #fbe9a6 100%)',
} as const;

type Gradient = keyof typeof GRADIENTS;
type ChipKey = 'songs' | 'shows' | 'budget';

interface ToolItem {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: Gradient;
  /** A short fixed badge, or the key of a live badge worked out from what the artist has saved. */
  chip: string | ChipKey;
  /** Spans the whole row on phones: the tool most people need first in its group. */
  wide?: boolean;
}

interface ToolGroup {
  id: string;
  title: string;
  blurb: string;
  tools: ToolItem[];
}

// Add new tools here and they show up on the Tools tab.
const GROUPS: ToolGroup[] = [
  {
    id: 'protect',
    title: 'Protect yourself',
    blurb: 'Before you sign, split or switch.',
    tools: [
      { to: '/split-sheet', title: 'Split sheet', description: 'Write down who owns what before anyone leaves the studio. Download a PDF or copy a text summary.', icon: FileSignature, gradient: 'pink', chip: 'PDF and text', wide: true },
      { to: '/contract', title: 'Contract check', description: 'Spot the risky parts of a contract before you sign.', icon: FileSearch, gradient: 'lilac', chip: 'Stays on your device' },
      { to: '/guides/distribution-metadata', title: 'Distributor cost compare', description: 'What different distributors really cost over a few years.', icon: Wallet, gradient: 'sky', chip: 'Compare' },
    ],
  },
  {
    id: 'track',
    title: 'Keep track',
    blurb: 'So no money goes unclaimed.',
    tools: [
      { to: '/songs', title: 'My songs', description: 'Track where each song is registered.', icon: Music, gradient: 'green', chip: 'songs' },
      { to: '/shows', title: 'Live show log', description: 'Log shows and copy the setlist to report for live royalties.', icon: Mic2, gradient: 'sun', chip: 'shows' },
    ],
  },
  {
    id: 'money',
    title: 'Know your numbers',
    blurb: 'What it costs, and what it can earn.',
    tools: [
      { to: '/budget', title: 'Release budget', description: 'Add up what a release costs and see how many streams earn it back.', icon: PiggyBank, gradient: 'orange', chip: 'budget' },
      { to: '/streams', title: 'Streaming earnings', description: 'Estimate what your streams pay, as a range.', icon: Calculator, gradient: 'green', chip: 'Estimate' },
    ],
  },
  {
    id: 'promote',
    title: 'Get noticed',
    blurb: 'Pitch yourself with something polished.',
    tools: [
      { to: '/epk', title: 'Press kit and pitch', description: 'Build a one-page press kit PDF and write a short playlist pitch.', icon: Newspaper, gradient: 'pink', chip: 'PDF', wide: true },
    ],
  },
];

/** Every tool, flat (kept for anything that needs the plain list). */
export const TOOLS = GROUPS.flatMap((g) => g.tools);

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function useChips(): Record<ChipKey, string> {
  const { state } = useLocalProgress();
  const total = state.budget.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);
  return {
    songs: state.catalog.length ? plural(state.catalog.length, 'song') : 'No songs yet',
    shows: state.shows.length ? plural(state.shows.length, 'show') : 'No shows yet',
    budget: total > 0 ? `$${Math.round(total).toLocaleString('en-US')} planned` : 'Not started',
  };
}

function ToolTile({ tool, chip }: { tool: ToolItem; chip: string }) {
  const { to, title, description, icon: Icon, gradient, wide } = tool;
  return (
    <Link
      to={to}
      style={{ background: GRADIENTS[gradient] }}
      className={`lift group relative flex flex-col overflow-hidden rounded-[24px] p-4 text-[#2a1308] shadow-[var(--shadow-pop)] transition-transform active:scale-[0.985] sm:p-5 ${wide ? 'col-span-2' : ''}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
      <span className="relative flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/50">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </span>
      <h3 className="relative mt-3 text-lg font-extrabold leading-snug">{title}</h3>
      <p className="relative mt-1 flex-1 text-[14.5px] leading-snug text-[#43260f]">{description}</p>
      <span className="relative mt-3 self-start rounded-full bg-white/60 px-3 py-1 text-xs font-bold">{chip}</span>
    </Link>
  );
}

/** The Tools tab: every interactive helper, grouped by what you are trying to do. */
export function ToolsPage() {
  const chips = useChips();
  return (
    <section>
      <header
        style={{ background: 'linear-gradient(135deg, #f59a45 0%, #f6b95c 55%, #f8d9a8 100%)' }}
        className="relative mb-7 min-h-[170px] overflow-hidden rounded-[30px] p-5 pr-[38%] text-[#2a1308] shadow-[var(--shadow-pop)] sm:min-h-[200px] sm:p-8 sm:pr-[42%]"
      >
        <span aria-hidden="true" className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
        <h1 className="relative font-display text-[1.7rem] font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Your <span className="text-[#7a2f04]">toolkit</span>
        </h1>
        <p className="relative mt-2 text-[15px] font-medium text-[#43260f] sm:text-lg">Small helpers for the business side of your music. Everything runs on your device.</p>
        <img
          src="/hero-art.webp"
          alt=""
          aria-hidden="true"
          width="320"
          height="320"
          className="float pointer-events-none absolute -bottom-3 -right-4 w-[40%] max-w-[240px] -rotate-[6deg] drop-shadow-[0_14px_16px_rgba(70,30,5,0.38)]"
        />
      </header>

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`tools-${group.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
              <h2 id={`tools-${group.id}`} className="font-display text-xl font-bold">{group.title}</h2>
              <p className="text-sm text-muted">{group.blurb}</p>
            </div>
            <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {group.tools.map((tool) => (
                <ToolTile key={tool.to} tool={tool} chip={tool.chip in chips ? chips[tool.chip as ChipKey] : tool.chip} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
