# The Artist Bible

Free, ad-free, no-login PWA with plain-English guides and studio tools for independent artists. Full spec: [CLAUDE.md](./CLAUDE.md).

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ locally (service worker + offline work here)
npm run check-links
```

Deploy to Cloudflare Pages: build command `npm run build`, output directory `dist`.

The "Spot outdated info?" links use `site.githubRepo` in `src/data/industry-data.json`.
