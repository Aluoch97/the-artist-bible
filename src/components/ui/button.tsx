import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-bold transition-[filter,background-color,border-color,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:brightness-110 shadow-[0_4px_18px_rgba(240,138,60,0.28)]',
        secondary: 'bg-surface-2 text-fg border border-border hover:border-muted',
        ghost: 'text-muted hover:text-fg hover:bg-surface-2',
        danger: 'bg-transparent text-bad border border-bad/50 hover:bg-bad/10',
      },
      size: {
        sm: 'h-11 px-4 text-sm',
        md: 'h-12 px-6',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type, ...props }, ref) => (
  <button ref={ref} type={type ?? 'button'} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

export { buttonVariants };
