import { BookOpen, CalendarCheck, CircleDollarSign, Download, FileSignature, HardDriveDownload, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { cn } from '../../lib/utils';
import { BackupModal } from './BackupModal';

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
  { to: '/split-sheet', label: 'Splits', icon: FileSignature },
  { to: '/guides', label: 'Learn', icon: BookOpen, also: ['/red-flags'] },
];

function isCurrent(tab: Tab, path: string): boolean {
  if (tab.to === '/') return path === '/';
  return [tab.to, ...(tab.also ?? [])].some((p) => path === p || path.startsWith(`${p}/`));
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="15" fill="#0e0b16" />
      <rect x="14" y="9" width="37" height="46" rx="5" fill="#3ee08f" />
      <rect x="14" y="9" width="8" height="46" rx="4" fill="#1fa868" />
      <g fill="#07150e">
        <rect x="26" y="28" width="3.4" height="10" rx="1.7" />
        <rect x="32" y="21" width="3.4" height="24" rx="1.7" />
        <rect x="38" y="25" width="3.4" height="16" rx="1.7" />
        <rect x="44" y="31" width="3" height="6" rx="1.5" />
      </g>
      <path d="M42 9h8v17l-4-3.4L42 26z" fill="#e8bb52" />
    </svg>
  );
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
      <header className="no-print sticky top-0 z-30 bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-accent/60 after:to-transparent">
        <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto] items-center gap-3 px-4 lg:grid-cols-[auto_1fr_auto]">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <Logo size={38} />
            <span className="grid leading-none">
              <span className="font-display text-xl font-bold tracking-tight">The Artist Bible</span>
              <span className="mt-1 text-[11px] font-semibold tracking-wide text-muted">Free tools for independent artists</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden justify-self-center rounded-full border border-border bg-surface p-1 lg:flex">
            {TABS.map((t) => (
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
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-accent-fg"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Install
              </button>
            )}
            <button
              type="button"
              onClick={() => setBackupOpen(true)}
              aria-label="Backup and restore"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-border bg-surface-2 text-fg transition-colors hover:border-accent hover:text-accent"
            >
              <HardDriveDownload className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-[calc(var(--tab-h)+2.5rem)] pt-6 sm:pt-8">
        {children}
      </main>

      <footer className="no-print border-t border-border px-4 pb-[calc(var(--tab-h)+1.5rem)] pt-6 text-center text-sm text-muted">
        <p className="font-semibold text-fg">Free. No ads. No accounts.</p>
        <p className="mt-1">Everything you enter stays on your device.</p>
        <p className="mt-3 text-xs">Guides are educational, not legal or financial advice.</p>
      </footer>

      {/* Bottom tab bar (phones and tablets). */}
      <nav aria-label="Tabs" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
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
                        ? cn('-mt-6 h-14 w-14 shadow-[0_0_0_4px_var(--bg),0_8px_18px_rgba(0,0,0,0.5)]', active ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-accent')
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
