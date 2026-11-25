import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold font-mono uppercase tracking-wide',
  {
    variants: {
      variant: {
        neutral: 'border-border text-muted bg-surface-2',
        good: 'border-good/40 text-good bg-good/10',
        warn: 'border-warn/40 text-warn bg-warn/10',
        bad: 'border-bad/40 text-bad bg-bad/10',
        accent: 'border-accent/40 text-accent bg-accent/10',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
