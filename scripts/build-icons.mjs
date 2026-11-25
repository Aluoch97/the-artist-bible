#!/usr/bin/env node
// Rebuilds every app icon from ONE file: public/logo.svg (SVG, ideally a square mark).
//
//   npm run icons                      uses the default dark background for the phone Home Screen icons
//   npm run icons -- --bg=#101820      use another background color for those
//
// Writes: public/favicon.svg (copy), public/icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png
// The social-share image (public/og-image.png) is a separate 1200x630 picture and is not touched here.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import sharp from 'sharp';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const BG = arg('bg', '#0e0b16');
const SRC = new URL('../public/logo.svg', import.meta.url);
if (!existsSync(SRC)) {
  console.error('Missing public/logo.svg');
  process.exit(1);
}
const svg = readFileSync(SRC);
const out = (f) => new URL(`../public/${f}`, import.meta.url).pathname;
mkdirSync(out('icons'), { recursive: true });

const render = (size) => sharp(svg, { density: Math.ceil((size / 64) * 72 * 4) }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

/** The logo centred on a solid background (iPhone icons can't be transparent; Android "maskable" needs a safe margin). */
async function onBackground(size, scale) {
  const inner = Math.round(size * scale);
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: await render(inner), gravity: 'center' }])
    .png()
    .toBuffer();
}

// Standard icons keep the logo's own shape and transparency exactly as designed.
await sharp(await render(192)).toFile(out('icons/icon-192.png'));
await sharp(await render(512)).toFile(out('icons/icon-512.png'));
// Android maskable: the OS crops to a circle/squircle, so keep the mark inside the safe zone (~72%).
await sharp(await onBackground(512, 0.72)).toFile(out('icons/maskable-512.png'));
// iPhone Home Screen: opaque, iOS rounds the corners itself.
await sharp(await onBackground(180, 0.86)).flatten({ background: BG }).toFile(out('icons/apple-touch-icon.png'));
copyFileSync(SRC, out('favicon.svg'));

console.log(`Icons rebuilt from public/logo.svg (background ${BG}):`);
for (const f of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'favicon.svg']) console.log('  public/' + f);
