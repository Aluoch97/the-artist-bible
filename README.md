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
The master logo is `design/logo.png` (square, transparent background, 1024px or larger; or `design/logo.svg`). It is not shipped to visitors; small icons are generated from it.
1. Replace `design/logo.png` with the new logo.
2. Run `npm run icons`. It rebuilds the browser-tab icons, the 192/512 icons, the Android maskable icon and the iPhone Home Screen icon. Use `npm run icons -- --bg=#YOURCOLOR` to change the background behind the phone Home Screen icons.
3. Replace `public/og-image.png` (1200x630) if you want the link-preview picture to match.
4. Run `npm run build`. The app header, browser tab and installed app icon all update.

`design/logo-original.webp` is the file as first supplied (with its baked-in soft shadow); `design/logo.png` is the cleaned cut-out used by the app.
