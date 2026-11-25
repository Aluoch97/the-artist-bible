import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-xl border border-border bg-bg px-4 text-base text-fg placeholder:text-muted/60 focus-visible:border-accent',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
