import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { deviceReducesMotion, useDisplayPrefs, type TextSize } from '../../hooks/useDisplayPrefs';
import { useTheme } from '../../hooks/useTheme';
import { closeSettings, useSettingsOpen } from '../../lib/settingsDialog';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ThemeChoice } from './ThemeControls';

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Smaller' },
  { value: 'normal', label: 'Standard' },
  { value: 'large', label: 'Larger' },
  { value: 'xlarge', label: 'Largest' },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 font-bold">{title}</h3>
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

/** One on/off setting: a real checkbox (so keyboards and screen readers get it) drawn as a switch. */
function SwitchRow({ label, hint, checked, disabled, onChange }: SwitchRowProps) {
  return (
    <label className={cn('flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface p-3', disabled && 'cursor-not-allowed opacity-80')}>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full border border-border bg-surface-2 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-fg after:transition-transform peer-checked:border-accent peer-checked:bg-accent peer-checked:after:translate-x-5 peer-checked:after:bg-accent-fg peer-focus-visible:outline-3 peer-focus-visible:outline-gold"
      />
    </label>
  );
}

/** Settings: how the app looks and reads. Everything is saved on this device only. */
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
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(32rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl border border-border bg-[var(--surface-solid)] p-0 text-fg backdrop:bg-black/75"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="settings-title" className="font-display text-2xl font-bold">Settings</h2>
            <p className="mt-1 text-[0.9375rem] text-muted">Make the app easier to see and use. Saved on this device only.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={closeSettings} aria-label="Close settings"><X className="h-4 w-4" aria-hidden="true" /></Button>
        </div>

        <Group title="Appearance">
          <ThemeChoice />
        </Group>

        <Group title="Text size">
          <fieldset>
            <legend className="sr-only">Text size</legend>
            <div className="grid grid-cols-2 gap-1 rounded-3xl border border-border bg-surface p-1 min-[420px]:grid-cols-4 min-[420px]:rounded-full">
              {TEXT_SIZES.map(({ value, label }) => (
                <label
                  key={value}
                  className={cn(
                    'flex h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-2 text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold',
                    prefs.text === value ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  <input type="radio" name="text-size" value={value} checked={prefs.text === value} onChange={() => update({ text: value })} className="sr-only" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-2 rounded-2xl border border-border bg-surface p-3 text-[1rem]">Sample: pitch your song at least three weeks before release day.</p>
        </Group>

        <Group title="Easier on the eyes">
          <div className="space-y-2">
            <SwitchRow label="Higher contrast" hint="Stronger text and borders." checked={prefs.contrast === 'high'} onChange={(on) => update({ contrast: on ? 'high' : 'normal' })} />
            <SwitchRow label="Underline links" hint="Links in sentences are always underlined." checked={prefs.links === 'underline'} onChange={(on) => update({ links: on ? 'underline' : 'normal' })} />
            <SwitchRow label="Plainer background" hint="Solid cards and bars: no frosted glass or colored glow." checked={prefs.plain} onChange={(on) => update({ plain: on })} />
            <SwitchRow
              label="Reduce motion"
              hint={deviceMotion ? 'Your device already asks for less motion, so this is on.' : 'No sliding, floating or fading.'}
              checked={deviceMotion || prefs.motion === 'reduce'}
              disabled={deviceMotion}
              onChange={(on) => update({ motion: on ? 'reduce' : 'system' })}
            />
          </div>
        </Group>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              setPref('system');
            }}
          >
            Reset to defaults
          </Button>
          <Button variant="primary" onClick={closeSettings}>Done</Button>
        </div>
      </div>
    </dialog>
  );
}
