import type { ReactNode } from 'react';

interface ToolHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function ToolHeader({ title, description, children }: ToolHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-xl text-lg text-muted">{description}</p>
      {children}
    </header>
  );
}
