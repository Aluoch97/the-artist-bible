import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { deviceReducesMotion, useDisplayPrefs, type TextSize } from '../../hooks/useDisplayPrefs';
import { useTheme } from '../../hooks/useTheme';
import { closeSettings, useSettingsOpen } from '../../lib/settingsDialog';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ThemeChoice } from './ThemeControls';

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Largest' },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 first:mt-0">
      <h3 className="mb-1.5 text-[0.9375rem] font-bold">{title}</h3>
      {children}
    </section>
  );
}

interface SwitchRowProps {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

/** One on/off setting: a real checkbox (so keyboards and screen readers get it) drawn as a switch. Kept to a compact row. */
function SwitchRow({ label, hint, checked, disabled, onChange }: SwitchRowProps) {
  return (
    <label className={cn('flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2', disabled && 'cursor-not-allowed opacity-80')}>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block font-semibold">{label}</span>
        <span className="block text-[0.8125rem] text-muted">{hint}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full border border-border bg-surface-2 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-fg after:transition-transform peer-checked:border-accent peer-checked:bg-accent peer-checked:after:translate-x-5 peer-checked:after:bg-accent-fg peer-focus-visible:outline-3 peer-focus-visible:outline-gold"
      />
    </label>
  );
}

/**
 * Settings: how the app looks and reads. Everything is saved on this device only.
 * The title bar (with Close) and the Done / Reset bar stay put; only the options in between scroll.
 */
export function SettingsDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const open = useSettingsOpen();
  const { prefs, update, reset } = useDisplayPrefs();
  const { setPref } = useTheme();
  const deviceMotion = deviceReducesMotion();

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={closeSettings}
      onClick={(e) => { if (e.target === ref.current) closeSettings(); }}
      aria-labelledby="settings-title"
      className="m-auto max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top))] w-[min(30rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-[var(--surface-solid)] p-0 text-fg backdrop:bg-black/75 open:flex"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <h2 id="settings-title" className="font-display text-xl font-bold leading-tight">Settings</h2>
          <p className="text-[0.8125rem] text-muted">Saved on this device only.</p>
        </div>
        <Button variant="secondary" size="icon" onClick={closeSettings} aria-label="Close settings"><X className="h-5 w-5" aria-hidden="true" /></Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <Group title="Appearance">
          <ThemeChoice />
        </Group>

        <Group title="Text size">
          <fieldset>
            <legend className="sr-only">Text size</legend>
            <div className="grid grid-cols-2 gap-1 rounded-3xl border border-border bg-surface p-1 min-[360px]:grid-cols-4 min-[360px]:rounded-full">
              {TEXT_SIZES.map(({ value, label }) => (
                <label
                  key={value}
                  className={cn(
                    'flex h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-1 text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold',
                    prefs.text === value ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  <input type="radio" name="text-size" value={value} checked={prefs.text === value} onChange={() => update({ text: value })} className="sr-only" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-1.5 rounded-2xl border border-border bg-surface px-3 py-2 text-[1rem] leading-snug">Sample: pitch your song three weeks early.</p>
        </Group>

        <Group title="Easier on the eyes">
          <div className="space-y-1.5">
            <SwitchRow label="Higher contrast" hint="Stronger text and borders." checked={prefs.contrast === 'high'} onChange={(on) => update({ contrast: on ? 'high' : 'normal' })} />
            <SwitchRow label="Underline links" hint="Links in sentences are underlined." checked={prefs.links === 'underline'} onChange={(on) => update({ links: on ? 'underline' : 'normal' })} />
            <SwitchRow label="Plainer background" hint="Solid cards, no glass or glow." checked={prefs.plain} onChange={(on) => update({ plain: on })} />
            <SwitchRow
              label="Reduce motion"
              hint={deviceMotion ? 'Your device already asks for this.' : 'No sliding, floating or fading.'}
              checked={deviceMotion || prefs.motion === 'reduce'}
              disabled={deviceMotion}
              onChange={(on) => update({ motion: on ? 'reduce' : 'system' })}
            />
          </div>
        </Group>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            reset();
            setPref('system');
          }}
        >
          Reset to defaults
        </Button>
        <Button variant="primary" size="sm" onClick={closeSettings}>Done</Button>
      </div>
    </dialog>
  );
}
