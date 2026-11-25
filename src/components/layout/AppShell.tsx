import { BookOpen, CircleDollarSign, Download, FileSignature, HardDriveDownload, Home, ShieldAlert, CalendarClock } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { BackupModal } from './BackupModal';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/release', label: 'Release', icon: CalendarClock },
  { to: '/audit', label: 'Royalties', icon: CircleDollarSign },
  { to: '/split-sheet', label: 'Splits', icon: FileSignature },
  { to: '/guides', label: 'Guides', icon: BookOpen },
  { to: '/red-flags', label: 'Red Flags', icon: ShieldAlert },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
      <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--accent)" />
        <g fill="var(--accent-fg)">
          <rect x="12" y="26" width="6" height="12" rx="3" />
          <rect x="22" y="16" width="6" height="32" rx="3" />
          <rect x="32" y="22" width="6" height="20" rx="3" />
          <rect x="42" y="12" width="6" height="40" rx="3" />
        </g>
      </svg>
      <span>The Artist Bible</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [backupOpen, setBackupOpen] = useState(false);
  const { canInstall, install } = usePwaInstall();

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="no-print sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
        Skip to content
      </a>

      <header className="no-print sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('rounded-md px-3 py-2 text-sm font-semibold transition-colors', isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {canInstall && (
              <Button size="sm" variant="primary" onClick={install}>
                <Download className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Install app</span><span className="sm:hidden">Install</span>
              </Button>
            )}
            <Button size="sm" onClick={() => setBackupOpen(true)}>
              <HardDriveDownload className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Backup</span><span className="sr-only sm:hidden">Backup</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:pb-12">{children}</main>

      <footer className="no-print border-t border-border py-6 text-center text-xs text-muted">
        <p>Free forever. No ads, no accounts. Your data stays on your device.</p>
        <p className="mt-1">Educational information, not legal or financial advice.</p>
      </footer>

      <nav aria-label="Primary mobile" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-6">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold', isActive ? 'text-accent' : 'text-muted')
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  );
}
