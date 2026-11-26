import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { VitePWA } from 'vite-plugin-pwa';

/** `chapter.mdx?frontmatter` gives just the title, summary and verified date, so guide lists don't pull in every chapter's code. */
function mdxFrontmatter(): Plugin {
  const suffix = '?frontmatter';
  const virtual = '\0mdx-frontmatter:';
  return {
    name: 'mdx-frontmatter-only',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!id.endsWith(suffix)) return null;
      // A virtual id (starts with \0) keeps the MDX plugin from compiling this tiny data module as a chapter.
      return this.resolve(id.slice(0, -suffix.length), importer, { skipSelf: true }).then((r) => (r ? virtual + r.id : null));
    },
    load(id) {
      if (!id.startsWith(virtual)) return null;
      const file = id.slice(virtual.length);
      this.addWatchFile(file);
      const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'))?.[1] ?? '';
      const out: Record<string, string> = {};
      for (const line of block.split(/\r?\n/)) {
        const kv = /^(\w+):\s*(.*)$/.exec(line);
        if (kv) out[kv[1]!] = kv[2]!.trim().replace(/^["']|["']$/g, '');
      }
      return `export default ${JSON.stringify(out)};`;
    },
  };
}

// Static, client-only build. Output goes to dist/ for Cloudflare Pages.
export default defineConfig({
  plugins: [
    mdxFrontmatter(),
    // MDX must run before the React plugin so JSX in chapters is compiled.
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkGfm, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // The manifest lives in public/manifest.json and is linked from index.html.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,json,woff2}'],
        // jsPDF can lazy-load these for HTML/SVG-to-PDF, which the app never uses, so don't download them up front.
        globIgnores: ['**/version.json', '**/html2canvas-*.js', '**/index.es-*.js', '**/purify.es-*.js', '**/og-image.png', '**/pdf-*.js', '**/pdf.worker.min-*'],
        // The PDF reader (Contract check) is big and rarely used: cache it the first time it is needed instead.
        runtimeCaching: [{ urlPattern: /\/assets\/pdf[.-].*\.m?js$/, handler: 'CacheFirst', options: { cacheName: 'pdf-reader', expiration: { maxEntries: 4 } } }],
        navigateFallback: 'index.html',
        // Addresses under /api go to the server function, never to the offline app shell.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // The one chunk over 500 kB is the PDF reader, loaded only when someone picks a PDF in Contract check.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Name every emitted module file .js (not .mjs): browsers refuse a worker whose server labels .mjs as a download.
        assetFileNames: (info) => ((info.names ?? []).some((n) => n.endsWith('.mjs')) ? 'assets/[name]-[hash].js' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
});
