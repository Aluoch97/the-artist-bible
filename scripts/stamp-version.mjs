// Runs right after `vite build`. Works out a short fingerprint of everything in dist/ that a visitor's phone could keep,
// and writes dist/version.json. The app looks at this file to know when a new version is ready ("Tap to update").
// The short number people see ("1.2") is the newest "## x.y" heading in CHANGELOG.md.
import { existsSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

const DIST = process.argv[2] || 'dist';
const SKIP = new Set(['version.json']);

async function walk(dir) {
  const out = [];
  for (const name of (await readdir(dir)).sort()) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...(await walk(p)));
    else if (!SKIP.has(relative(DIST, p))) out.push(p);
  }
  return out;
}

export async function fingerprint(dist = DIST) {
  const h = createHash('sha256');
  for (const p of await walk(dist)) {
    h.update(relative(dist, p).split(sep).join('/'));
    h.update('\0');
    h.update(await readFile(p));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 8);
}

const clPath = process.env.AB_CHANGELOG || join(DIST, '..', 'CHANGELOG.md');
const release = existsSync(clPath) ? ((await readFile(clPath, 'utf8')).match(/^## (\d+\.\d+)\b/m) || [])[1] || '' : '';
const version = 'ab-' + (await fingerprint(DIST));
await writeFile(join(DIST, 'version.json'), JSON.stringify({ version, release, builtAt: new Date().toISOString() }) + '\n');
console.log(`stamp-version: ${version}${release ? ` (release ${release})` : ''}`);
