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
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        // jsPDF can lazy-load these for HTML/SVG-to-PDF, which the app never uses, so don't download them up front.
        globIgnores: ['**/html2canvas-*.js', '**/index.es-*.js', '**/purify.es-*.js', '**/og-image.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
