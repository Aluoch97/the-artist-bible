/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { MDXComponents } from 'mdx/types';

  /** Frontmatter exported by remark-mdx-frontmatter. */
  export const frontmatter: {
    title: string;
    summary: string;
    lastVerified: string;
  };

  const MDXContent: ComponentType<{ components?: MDXComponents }>;
  export default MDXContent;
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url' {
  const url: string;
  export default url;
}
