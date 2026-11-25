import type { ComponentType } from 'react';
import type { MDXComponents } from 'mdx/types';
import type { ChapterFrontmatter } from '../types/bible';

interface MdxModule {
  default: ComponentType<{ components?: MDXComponents }>;
  frontmatter: ChapterFrontmatter;
}

export interface Chapter extends ChapterFrontmatter {
  slug: string;
  number: number;
  Content: MdxModule['default'];
}

// Chapters are tiny and eagerly bundled so every guide works offline from first load.
const modules = import.meta.glob<MdxModule>('./*.mdx', { eager: true });

export const chapters: Chapter[] = Object.entries(modules)
  .map(([path, mod]) => {
    const file = path.replace('./', '').replace('.mdx', ''); // e.g. 01-creation-rights
    const m = /^(\d+)-(.+)$/.exec(file);
    return {
      ...mod.frontmatter,
      slug: m?.[2] ?? file,
      number: Number(m?.[1] ?? 0),
      Content: mod.default,
    };
  })
  .sort((a, b) => a.number - b.number);

export const getChapter = (slug: string | undefined): Chapter | undefined => chapters.find((c) => c.slug === slug);
