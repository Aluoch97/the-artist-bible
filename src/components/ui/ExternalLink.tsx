import { ExternalLink as ExternalIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
}

/** All outbound links open in a new tab without leaking the opener. */
export function ExternalLink({ href, children, className }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline', className)}
    >
      {children}
      <ExternalIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
