import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

/**
 * Date field that behaves on iPhone Safari: an empty native date input collapses and shows nothing,
 * so we draw our own hint and keep the field inside its container.
 */
export function DateInput({ className, value, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const empty = value === undefined || value === '';
  return (
    <div className="relative w-full min-w-0">
      <input
        type="date"
        value={value}
        className={cn(
          'block h-12 w-full min-w-0 max-w-full rounded-xl border border-border bg-bg px-4 text-left text-base text-fg focus-visible:border-accent',
          empty && 'text-transparent',
          className,
        )}
        {...props}
      />
      {empty && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted/70" aria-hidden="true">
          Tap to choose a date
        </span>
      )}
    </div>
  );
}
