#!/usr/bin/env node
// Sends two real contracts to the LIVE AI review endpoint and prints a quality report. Uses 2 of the free daily reviews.
//   SITE=https://bible.nrnszn.com node scripts/live-ai-test.mjs
import { readFileSync } from 'node:fs';

const SITE = process.env.SITE ?? 'https://bible.nrnszn.com';
const src = readFileSync(new URL('../src/lib/sampleContract.ts', import.meta.url), 'utf8');
const SAMPLE = src.slice(src.indexOf('`') + 1, src.lastIndexOf('`'));
const BENIGN = `VENUE BOOKING AGREEMENT. This agreement is between The Corner Room ("Venue") and the performing artist ("Artist"). The Artist will perform a 45 minute set on May 5 starting at 9:00 pm. The Venue will pay the Artist a flat fee of $500 in cash immediately after the show. Either party may cancel with 14 days written notice; if the Venue cancels with less notice it will still pay half the fee. The Venue provides the sound system, lights and a sound engineer. The Artist keeps all rights to their songs and recordings, and may sell their own merchandise at the show with no commission to the Venue. The Venue may take photos at the show for its social media with credit to the Artist.`;

async function review(name, text) {
  const t0 = Date.now();
  const res = await fetch(`${SITE}/api/review-contract`, { method: 'POST', headers: { 'content-type': 'application/json', origin: SITE }, body: JSON.stringify({ text }) });
  const ms = Date.now() - t0;
  const body = await res.json().catch(() => ({}));
  console.log(`\n===== ${name}: HTTP ${res.status} in ${(ms / 1000).toFixed(1)}s =====`);
  if (!res.ok) return console.log('ERROR:', JSON.stringify(body));
  const r = body.review;
  console.log(`model: ${body.model}\noverall: ${r.overall}`);
  console.log('summary:'); r.summary.forEach((s) => console.log('  -', s));
  console.log('key terms:'); r.keyTerms.forEach((k) => console.log(`  - ${k.label}: ${k.plain}`));
  console.log(`flags (${r.flags.length}):`); r.flags.forEach((f) => console.log(`  - [${f.severity}] ${f.title} | quote verified: ${f.quoteFound}${f.quoteFound ? ` ("${f.quote.slice(0, 70)}")` : ''}\n      why: ${f.why}\n      ask: ${f.askFor}`));
  console.log('questions:'); r.questions.forEach((q) => console.log('  -', q));
  return r;
}

await review('EXAMPLE CONTRACT (full of traps)', SAMPLE);
await review('BENIGN GIG CONTRACT (should be mostly clean)', BENIGN);
