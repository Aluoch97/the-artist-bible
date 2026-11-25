import type { MDXComponents } from 'mdx/types';
import { Info } from 'lucide-react';
import type { AnchorHTMLAttributes, ReactNode, TableHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { industryData } from '../../data';
import { RedFlagDecoder } from '../tools/RedFlagDecoder';
import { RoyaltyAudit } from '../tools/RoyaltyAudit';
import { TwoHundredPercent } from '../tools/TwoHundredPercent';
import { buttonVariants } from './button';
import { ExternalLink } from './ExternalLink';

function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="not-prose my-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-[15px]">
      <p className="mb-1 flex items-center gap-2 font-bold text-gold">
        <Info className="h-4 w-4" aria-hidden="true" /> {title ?? 'Heads up'}
      </p>
      <div className="space-y-2 text-fg [&_p]:m-0">{children}</div>
    </aside>
  );
}

/** Button-style link to one of the in-app tools. */
function ToolLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <p className="not-prose my-6">
      <Link to={to} className={buttonVariants({ variant: 'primary' })}>{children}</Link>
    </p>
  );
}

/** Pulls a changeable value from industry-data.json so prose never hardcodes fees or URLs. */
function IndustryValue({ id, field }: { id: string; field: 'cost' | 'name' }) {
  const entity = industryData.royaltyEntities.find((e) => e.id === id);
  return <>{entity ? entity[field] : `[missing: ${id}]`}</>;
}

/** Link to a registry/portal by id from industry-data.json. */
function Portal({ id, which = 'officialUrl', children }: { id: string; which?: 'officialUrl' | 'secondaryUrl'; children: ReactNode }) {
  const entity = industryData.royaltyEntities.find((e) => e.id === id);
  const url = entity?.[which];
  return url ? <ExternalLink href={url}>{children}</ExternalLink> : <>{children}</>;
}

function ResourceLink({ id, children }: { id: string; children?: ReactNode }) {
  const res = industryData.resources.find((r) => r.id === id);
  return res ? <ExternalLink href={res.url}>{children ?? res.label}</ExternalLink> : <>{children}</>;
}

/** The rollout timeline, straight from the data file. */
function Milestones() {
  const list = [...industryData.releaseMilestones].sort((a, b) => b.weeksOut - a.weeksOut);
  return (
    <ol className="not-prose my-6 space-y-2">
      {list.map((m) => (
        <li key={m.id} className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-[15px]">
          <span className="w-16 shrink-0 font-bold tabular-nums text-accent">{m.weeksOut === 0 ? 'Day 0' : `-${m.weeksOut} wk`}</span>
          <span>{m.label}</span>
        </li>
      ))}
    </ol>
  );
}

function SmartLink({ href = '', children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith('/')) return <Link to={href} {...rest}>{children}</Link>;
  return <ExternalLink href={href}>{children}</ExternalLink>;
}

/** Wide tables scroll inside their own box instead of pushing the page sideways on phones. */
function ScrollTable(props: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border" tabIndex={0} role="region" aria-label="Table, scrolls sideways">
      <table {...props} className="!my-0 min-w-[34rem]" />
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  a: SmartLink,
  table: ScrollTable,
  Callout,
  ToolLink,
  IndustryValue,
  Portal,
  ResourceLink,
  Milestones,
  TwoHundredPercent,
  RoyaltyAudit: () => <RoyaltyAudit embedded headingLevel={3} />,
  RedFlagDecoder: () => <RedFlagDecoder embedded className="my-8" headingLevel={3} />,
};
