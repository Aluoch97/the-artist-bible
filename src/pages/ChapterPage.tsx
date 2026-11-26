import { ArrowLeft, ArrowRight, BadgeCheck, MessageSquareWarning } from 'lucide-react';
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { MDXComponents } from 'mdx/types';
import { mdxComponents } from '../components/ui/mdx';
import { ExternalLink } from '../components/ui/ExternalLink';
import { chapters, getChapter, type Chapter } from '../content';
import { industryData } from '../data';
import { formatVerified } from '../lib/dates';
import { NotFound } from './NotFound';

const bodies = new Map<string, LazyExoticComponent<ComponentType<{ components?: MDXComponents }>>>();
function bodyFor(c: Chapter) {
  let body = bodies.get(c.slug);
  if (!body) {
    body = lazy(() => c.load().then((component) => ({ default: component })));
    bodies.set(c.slug, body);
  }
  return body;
}

export function ChapterPage() {
  const { slug } = useParams();
  const chapter = getChapter(slug);
  if (!chapter) return <NotFound />;

  const index = chapters.findIndex((c) => c.slug === chapter.slug);
  const prev = chapters[index - 1];
  const next = chapters[index + 1];

  const issueUrl = new URL(`${industryData.site.githubRepo}/issues/new`);
  issueUrl.searchParams.set('title', `Outdated info: ${chapter.title}`);
  issueUrl.searchParams.set('labels', 'outdated-info');
  issueUrl.searchParams.set(
    'body',
    `Chapter: ${chapter.title} (/guides/${chapter.slug})\nLast verified: ${chapter.lastVerified}\n\nWhat looks outdated or wrong?\n\nA source or link that shows the correct info (optional):\n`,
  );

  const Content = bodyFor(chapter);

  return (
    <article>
      <Link to="/guides" className="no-print mb-4 inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-semibold text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All guides
      </Link>

      <p className="text-sm font-bold text-accent">Chapter {chapter.number}</p>
      <h1 className="mt-1 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{chapter.title}</h1>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
        <BadgeCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> Verified: {formatVerified(chapter.lastVerified)}
      </p>

      <div className="chapter-prose prose mt-8 max-w-none prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline">
        <Suspense fallback={<div className="min-h-dvh" role="status" aria-label="Loading the guide" />}>
          <Content components={mdxComponents} />
        </Suspense>
      </div>

      <footer className="no-print mt-12 border-t border-border pt-6">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <MessageSquareWarning className="h-4 w-4 text-warn" aria-hidden="true" />
          <ExternalLink href={issueUrl.toString()}>Spot outdated info?</ExternalLink>
          <span className="text-muted">Tell us what changed and we will update it.</span>
        </p>
        <nav aria-label="Chapter navigation" className="mt-6 flex justify-between gap-4 text-[0.9375rem] font-semibold">
          {prev ? (
            <Link to={`/guides/${prev.slug}`} className="inline-flex min-h-11 items-center gap-1 hover:text-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link to={`/guides/${next.slug}`} className="inline-flex min-h-11 items-center gap-1 text-right hover:text-accent">{next.title} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          ) : <span />}
        </nav>
      </footer>
    </article>
  );
}
