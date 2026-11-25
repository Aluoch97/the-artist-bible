#!/usr/bin/env node
// Rebuilds every app icon from ONE master file in design/ (not shipped to visitors):
//   design/logo.png   (square, transparent background, 1024px or larger)   <- current
//   design/logo.svg   (used instead if present)
//
//   npm run icons                      default dark background behind the phone Home Screen icons
//   npm run icons -- --bg=#101820      use another background color for those
//
// Writes into public/icons/: icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png, favicon-32.png, favicon-48.png
// The social-share picture (public/og-image.png, 1200x630) is a separate file and is not touched here.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import sharp from 'sharp';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const BG = arg('bg', '#0e0b16');
const root = (p) => new URL(`../${p}`, import.meta.url).pathname;
const srcPath = ['design/logo.svg', 'design/logo.png'].map(root).find(existsSync);
if (!srcPath) {
  console.error('Missing design/logo.png (or design/logo.svg)');
  process.exit(1);
}
const isSvg = srcPath.endsWith('.svg');
const src = readFileSync(srcPath);
mkdirSync(root('public/icons'), { recursive: true });

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const render = (size) =>
  (isSvg ? sharp(src, { density: Math.ceil((size / 64) * 72 * 4) }) : sharp(src))
    .resize(size, size, { fit: 'contain', background: transparent, kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: true, quality: 82, effort: 10, dither: 1 })
    .toBuffer();

/** The logo centred on a solid background (iPhone icons can't be transparent; Android "maskable" needs a safe margin). */
async function onBackground(size, scale) {
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: await render(Math.round(size * scale)), gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true, quality: 82, effort: 10, dither: 1 })
    .toBuffer();
}

const write = async (name, buf) => sharp(buf).toFile(root(`public/icons/${name}`));
await write('icon-192.png', await render(192)); // also the header logo
await write('icon-512.png', await render(512));
await write('maskable-512.png', await onBackground(512, 0.74)); // Android crops to a circle/squircle: keep the mark in the safe zone
await write('apple-touch-icon.png', await sharp(await onBackground(180, 0.86)).flatten({ background: BG }).png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toBuffer()); // iOS rounds the corners itself
await write('favicon-32.png', await render(32));
await write('favicon-48.png', await render(48));

console.log(`Icons rebuilt from ${srcPath.replace(root(''), '')} (background ${BG}) into public/icons/:`);
console.log('  icon-192.png icon-512.png maskable-512.png apple-touch-icon.png favicon-32.png favicon-48.png');
