#!/usr/bin/env node
// Records that a person checked the human-only claims. Usage: node scripts/sign-off.mjs all|id,id
import { readFileSync, writeFileSync } from 'node:fs';
const file = new URL('../src/data/claims.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const want = (process.argv[2] ?? 'all').split(',').map((s) => s.trim()).filter(Boolean);
const now = new Date().toISOString().slice(0, 7);
let n = 0;
for (const c of data.claims) {
  if (c.automated === false && (want.includes('all') || want.includes(c.id))) { c.humanCheckedOn = now; n++; console.log(`signed off: ${c.id} (${now})`); }
}
if (!n) { console.error('No matching human-check claims.'); process.exit(1); }
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
