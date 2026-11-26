import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePref } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Match my device', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/** The appearance choice (Match my device / Light / Dark), shown in Settings. */
export function ThemeChoice() {
  const { pref, setPref } = useTheme();
  return (
    <fieldset className="not-prose">
      <legend className="sr-only">Appearance</legend>
      <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-1 rounded-full border border-border bg-surface p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={cn(
              'flex h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold',
              pref === value ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg',
            )}
          >
            <input type="radio" name="theme" value={value} checked={pref === value} onChange={() => setPref(value)} className="sr-only" />
            <Icon className="hidden h-4 w-4 shrink-0 min-[400px]:block" aria-hidden="true" /> <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
