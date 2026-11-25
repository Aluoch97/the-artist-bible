import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/70 focus-visible:border-accent',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
