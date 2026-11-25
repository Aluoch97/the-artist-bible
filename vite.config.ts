import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { VitePWA } from 'vite-plugin-pwa';

// Static, client-only build. Output goes to dist/ for Cloudflare Pages.
export default defineConfig({
  plugins: [
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
        globIgnores: ['**/html2canvas-*.js', '**/index.es-*.js', '**/purify.es-*.js', '**/og-image.png', '**/pdf-*.js', '**/pdf.worker.min-*'],
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
