import type { ReactNode } from 'react';

interface ToolHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function ToolHeader({ title, description, children }: ToolHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{description}</p>
      {children}
    </header>
  );
}
