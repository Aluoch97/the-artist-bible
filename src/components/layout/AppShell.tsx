import { BookOpen, CalendarCheck, CircleDollarSign, Download, Save, Home, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { GlossaryDialog } from '../ui/Term';
import { Link, useLocation } from 'react-router-dom';
import { industryData } from '../../data';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { cn } from '../../lib/utils';
import { BackupModal } from './BackupModal';
import { ThemeToggle } from './ThemeControls';
import { SOCIAL_ICON_PATHS } from './socialIcons';

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Other paths that should highlight this tab. */
  also?: string[];
  home?: boolean;
}

// Same pattern as the other NuRenaissance apps: five tabs, Home is the raised round button in the middle.
const TABS: Tab[] = [
  { to: '/release', label: 'Release', icon: CalendarCheck },
  { to: '/audit', label: 'Get Paid', icon: CircleDollarSign },
  { to: '/', label: 'Home', icon: Home, home: true },
  { to: '/tools', label: 'Tools', icon: Wrench, also: ['/split-sheet', '/streams', '/songs', '/shows', '/epk', '/budget', '/contract'] },
  { to: '/guides', label: 'Learn', icon: BookOpen, also: ['/red-flags', '/words'] },
];

// Phones keep Home raised in the middle; the desktop menu reads left to right with Home first.
const DESKTOP_TABS: Tab[] = [...TABS.filter((t) => t.home), ...TABS.filter((t) => !t.home)];

function isCurrent(tab: Tab, path: string): boolean {
  if (tab.to === '/') return path === '/';
  return [tab.to, ...(tab.also ?? [])].some((p) => path === p || path.startsWith(`${p}/`));
}

/** The master logo lives in design/logo.png. Replace it, run `npm run icons`, and this header logo updates with the rest. */
export function Logo({ size = 36 }: { size?: number }) {
  return <img src="/icons/icon-192.png" width={size} height={size} alt="" aria-hidden="true" className="shrink-0 object-contain drop-shadow-[0_2px_5px_var(--logo-shadow)]" />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [backupOpen, setBackupOpen] = useState(false);
  const { canInstall, install } = usePwaInstall();
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, '') || '/';

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="no-print sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:font-bold focus:text-accent-fg">
        Skip to content
      </a>

      {/* Slim top bar: logo on the left, utilities on the right. */}
      <header className="no-print sticky top-0 z-30 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-accent/60 after:to-transparent">
        <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto] items-center gap-3 px-4 lg:grid-cols-[auto_1fr_auto]">
          <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2.5">
            <Logo size={46} />
            <span className="grid min-w-0 leading-none">
              <span className="truncate font-display text-xl font-bold tracking-tight"><span className="min-[360px]:hidden">Artist Bible</span><span className="hidden min-[360px]:inline">The Artist Bible</span></span>
              <span className="mt-1 truncate text-[11px] font-semibold tracking-wide text-muted">Free tools for independent artists</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden justify-self-center rounded-full border border-border bg-surface p-1 lg:flex">
            {DESKTOP_TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                aria-current={isCurrent(t, path) ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors',
                  isCurrent(t, path) ? 'bg-accent text-accent-fg' : 'text-fg hover:bg-surface-2',
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-accent px-3.5 text-sm font-bold text-accent-fg sm:px-4"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Install</span><span className="sr-only sm:hidden">Install the app</span>
              </button>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setBackupOpen(true)}
              aria-label="Backup and restore"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass)] text-fg backdrop-blur-md transition-colors hover:border-accent hover:text-accent"
            >
              <Save className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <GlossaryDialog />

      <main id="main" className={cn('mx-auto w-full flex-1 px-4 pb-6 pt-6 [overflow-wrap:anywhere] sm:pt-8', pathname === '/' ? 'max-w-3xl lg:max-w-5xl' : 'max-w-3xl')}>
        <div key={path} className="page-enter">{children}</div>
      </main>

      <footer className="no-print border-t border-border px-4 pb-[calc(var(--tab-h)+1.5rem)] pt-8 text-center">
        <ul aria-label="Social links" className="flex flex-wrap justify-center gap-3">
          {industryData.site.socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} (opens in a new tab)`}
                className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-gold transition-colors hover:bg-border hover:text-fg"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d={SOCIAL_ICON_PATHS[s.icon]} /></svg>
              </a>
            </li>
          ))}
        </ul>
        <nav aria-label="Site links" className="mt-5 flex flex-wrap justify-center gap-x-7">
          <Link to="/about" className="inline-flex min-h-11 items-center text-lg font-bold">About</Link>
          <Link to="/about#install" className="inline-flex min-h-11 items-center text-lg font-bold">Add to Home Screen</Link>
        </nav>
        <p className="mt-2 flex flex-wrap justify-center gap-x-5 text-sm">
          <Link to="/privacy" className="inline-flex min-h-11 items-center text-muted underline underline-offset-4 hover:text-fg">Privacy policy</Link>
          <Link to="/terms" className="inline-flex min-h-11 items-center text-muted underline underline-offset-4 hover:text-fg">Terms</Link>
          <Link to="/admin" className="inline-flex min-h-11 items-center text-muted underline underline-offset-4 hover:text-fg">Admin</Link>
        </p>
        <p className="mt-3 text-sm text-muted">&copy; {new Date().getFullYear()} {industryData.site.owner}</p>
      </footer>

      {/* Floating glass pill with the five tabs (phones and tablets). Home is the raised button in the middle. */}
      <nav aria-label="Tabs" className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] lg:hidden">
        <ul className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] px-1 shadow-[var(--shadow-pop)] backdrop-blur-xl">
          {TABS.map((t) => {
            const active = isCurrent(t, path);
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-[60px] select-none flex-col items-center justify-center gap-0.5 text-xs font-semibold',
                    t.home && 'justify-end pb-1.5',
                    active ? 'text-accent' : t.home ? 'text-fg' : 'text-muted',
                  )}
                >
                  <span
                    className={cn(
                      'grid place-items-center rounded-full transition-colors',
                      t.home
                        ? cn('-mt-7 h-14 w-14 shadow-[0_6px_18px_rgba(240,138,60,0.35)]', active ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-accent ring-1 ring-[var(--glass-border)]')
                        : cn('h-7 w-14', active && 'bg-accent/20'),
                    )}
                  >
                    <Icon className={t.home ? 'h-7 w-7' : 'h-6 w-6'} aria-hidden="true" />
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  );
}
