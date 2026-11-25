#!/usr/bin/env node
// Automated fact check for the claims the app makes about outside organizations.
//
//   node scripts/verify-claims.mjs                 check every claim in src/data/claims.json
//   node scripts/verify-claims.mjs --browser       retry bot-blocked pages in a real browser (needs `playwright`)
//   node scripts/verify-claims.mjs --discover URL… print what pages say about fees/deadlines, to help write claims
//
// Each claim = a plain-English statement + an official page + a regex that page should contain.
// Results per claim: pass | drift (page loads, text gone: claim may be outdated) | gone (404)
//                    | blocked (site refuses bots) | error (network). Human-only claims track a sign-off date.
import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const discoverUrls = argv.filter((a) => /^https?:/.test(a));
const useBrowser = flags.has('--browser');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const claimsFile = process.env.CLAIMS_FILE ? new URL('file://' + process.env.CLAIMS_FILE) : new URL('../src/data/claims.json', import.meta.url);
const { claims = [], humanReviewMaxAgeMonths = 6 } = JSON.parse(readFileSync(claimsFile, 'utf8'));

const strip = (html) =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#x?27;|&apos;/g, "'").replace(/\s+/g, ' ');
const looksBlocked = (status, text) => [401, 403, 429, 503].includes(status) || /just a moment|access denied|verify you are human|captcha|request blocked/i.test(text.slice(0, 3000));

let browser;
async function browserGet(url) {
  if (!browser) {
    const { chromium } = await import('playwright');
    browser = await chromium.launch();
  }
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US' });
  const page = await ctx.newPage();
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(2500);
    return { status: res?.status() ?? 0, html: await page.content(), finalUrl: page.url(), via: 'browser' };
  } finally {
    await ctx.close();
  }
}

async function get(url) {
  let r;
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*', 'accept-language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(25000) });
    r = { status: res.status, html: await res.text(), finalUrl: res.url, via: 'fetch' };
  } catch (e) {
    r = { status: 0, html: '', finalUrl: url, via: 'fetch', error: String(e?.cause?.code ?? e?.message ?? e) };
  }
  // Some sites answer bots with a fake 404, so a 404 is re-checked in a real browser before it is called gone.
  if (useBrowser && (r.status === 0 || r.status === 404 || looksBlocked(r.status, strip(r.html)))) {
    try {
      const b = await browserGet(url);
      if (b.status && b.status < 400 && !looksBlocked(b.status, strip(b.html))) return b;
      if (b.status === 404 || b.status === 410) return b; // genuinely missing in a real browser too
      r = { ...r, browserStatus: b.status };
    } catch (e) {
      r = { ...r, browserError: String(e?.message ?? e).split('\n')[0] };
    }
  }
  return r;
}

const monthsAgo = (ym) => {
  if (!/^\d{4}-\d{2}$/.test(ym ?? '')) return Infinity;
  const [y, m] = ym.split('-').map(Number);
  const now = new Date();
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
};

/* ------------------------------ discover mode ------------------------------ */
if (discoverUrls.length) {
  const KEY = /fee|free|cost|\$\s?\d|no charge|membership|deadline|days?\b.{0,20}(before|prior|ahead)|weeks?\b.{0,20}(before|prior|ahead)|in advance/i;
  for (const url of discoverUrls) {
    const r = await get(url);
    const text = strip(r.html);
    console.log(`\n### ${url}\nstatus=${r.status} via=${r.via} final=${r.finalUrl}${r.error ? ' error=' + r.error : ''}${r.browserStatus ? ' browserStatus=' + r.browserStatus : ''} chars=${text.length}`);
    const links = [...r.html.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]{0,120}?)<\/a>/gi)]
      .map((m) => [m[1], strip(m[2]).trim()]).filter(([h, t]) => /join|member|faq|fee|pric|pitch|help|register|writer|apply|cost/i.test(h + ' ' + t) && t).slice(0, 14);
    links.forEach(([h, t]) => console.log(`  link: ${t.slice(0, 50)} -> ${h.slice(0, 110)}`));
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => KEY.test(s) && s.length < 260).slice(0, 10);
    sentences.forEach((s) => console.log(`  said: ${s.trim()}`));
  }
  if (browser) await browser.close();
  process.exit(0);
}

/* -------------------------------- check mode -------------------------------- */
const results = [];
for (const c of claims) {
  const row = { id: c.id, statement: c.statement, url: c.url, kind: c.automated === false ? 'human' : 'auto' };
  if (c.automated === false) {
    const age = monthsAgo(c.humanCheckedOn);
    row.status = age <= humanReviewMaxAgeMonths ? 'human-ok' : 'human-due';
    row.detail = c.humanCheckedOn ? `last human check ${c.humanCheckedOn} (${age} months ago)` : 'never checked by a person';
  } else {
    const r = await get(c.url);
    const text = strip(r.html);
    if (r.status === 404 || r.status === 410) { row.status = 'gone'; row.detail = `HTTP ${r.status}`; }
    else if (r.status === 0 || looksBlocked(r.status, text)) { row.status = r.status === 0 ? 'error' : 'blocked'; row.detail = r.error ?? `HTTP ${r.status}, site refuses automated visitors`; }
    else if (r.status >= 400) { row.status = 'gone'; row.detail = `HTTP ${r.status}`; }
    else {
      const m = new RegExp(c.pattern, 'i').exec(text);
      if (m) { row.status = 'pass'; row.detail = `found: "…${text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).trim()}…" (via ${r.via})`; }
      else { row.status = 'drift'; row.detail = `page loads (HTTP ${r.status}) but /${c.pattern}/ no longer appears`; }
    }
  }
  results.push(row);
}
if (browser) await browser.close();

const icon = { pass: 'OK   ', 'human-ok': 'OK   ', drift: 'DRIFT', gone: 'GONE ', blocked: 'BLOCK', error: 'ERROR', 'human-due': 'HUMAN' };
for (const r of results) console.log(`${icon[r.status]} ${r.id}: ${r.statement}\n        ${r.detail}${r.kind === 'auto' ? '\n        ' + r.url : ''}`);

const count = (s) => results.filter((r) => r.status === s).length;
const problems = results.filter((r) => ['drift', 'gone'].includes(r.status));
const unverified = results.filter((r) => ['blocked', 'error', 'human-due'].includes(r.status));
const summary = { total: results.length, pass: count('pass'), humanOk: count('human-ok'), drift: count('drift'), gone: count('gone'), blocked: count('blocked'), error: count('error'), humanDue: count('human-due'), problems: problems.length, unverified: unverified.length, allVerified: problems.length === 0 && unverified.length === 0 };
console.log('\n' + JSON.stringify(summary));
writeFileSync(process.env.CLAIMS_REPORT ?? 'claims-report.json', JSON.stringify({ summary, results }, null, 2));
process.exit(problems.length ? 2 : 0);
