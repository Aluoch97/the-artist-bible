import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', {
  variants: {
    variant: {
      neutral: 'bg-surface-2 text-muted',
      good: 'bg-good/15 text-good',
      warn: 'bg-warn/15 text-warn',
      bad: 'bg-bad/15 text-bad',
      accent: 'bg-accent/15 text-accent',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
