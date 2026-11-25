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

## Changing the logo
1. Replace `public/logo.svg` with the new logo (SVG, square works best).
2. Run `npm run icons` to rebuild the favicon and the 192/512, maskable and iPhone icons from it. Use `npm run icons -- --bg=#YOURCOLOR` to change the background behind the phone Home Screen icons.
3. Replace `public/og-image.png` (1200x630) if you want the link-preview picture to match.
4. Run `npm run build`. The app header, browser tab and installed app icon all update.
