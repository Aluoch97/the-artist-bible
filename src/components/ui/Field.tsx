import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Input } from './input';

interface BaseProps {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export function Field({ label, hint, className, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">{label}</label>
      <Input id={id} {...props} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, hint, className, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">{label}</label>
      <textarea
        id={id}
        className="min-h-28 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base text-fg placeholder:text-muted focus-visible:border-accent"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** A check that looks like a pill. Green means done. */
export function CheckPill({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label
      className={cn(
        'inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold',
        checked ? 'border-good/60 bg-good/15 text-good' : 'border-border bg-bg/40 text-muted hover:text-fg',
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className={cn('grid h-5 w-5 place-items-center rounded-full border text-[0.6875rem]', checked && 'pop',
        checked ? 'border-good bg-good text-accent-fg' : 'border-muted/60')}>{checked ? '✓' : ''}</span>
      {children}
    </label>
  );
}
