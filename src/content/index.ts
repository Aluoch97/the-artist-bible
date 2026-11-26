import type { ComponentType } from 'react';
import type { MDXComponents } from 'mdx/types';
import type { ChapterFrontmatter } from '../types/bible';

type ChapterBody = ComponentType<{ components?: MDXComponents }>;

export interface Chapter extends ChapterFrontmatter {
  slug: string;
  number: number;
  /** Loads the chapter text and widgets on demand, so the first page load stays small. Still precached for offline use. */
  load: () => Promise<ChapterBody>;
}

// Only the title, summary and verified date are bundled up front; each chapter's body is its own file.
const meta = import.meta.glob<ChapterFrontmatter>('./*.mdx', { eager: true, query: '?frontmatter', import: 'default' });
const bodies = import.meta.glob<ChapterBody>('./*.mdx', { import: 'default' });

export const chapters: Chapter[] = Object.entries(meta)
  .map(([key, frontmatter]) => {
    const path = key.replace(/\?.*$/, ''); // the glob key ends in ?frontmatter
    const file = path.replace('./', '').replace('.mdx', ''); // e.g. 02-creation-rights
    const m = /^(\d+)-(.+)$/.exec(file);
    return {
      ...frontmatter,
      slug: m?.[2] ?? file,
      number: Number(m?.[1] ?? 0),
      load: bodies[path]!,
    };
  })
  .sort((a, b) => a.number - b.number);

export const getChapter = (slug: string | undefined): Chapter | undefined => chapters.find((c) => c.slug === slug);
