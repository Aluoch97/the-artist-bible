#!/usr/bin/env node
// Verifies every URL in src/data/industry-data.json (except the `site` block) is reachable.
// A link fails if it errors, returns a non-200 final status, or redirects to a different site.
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../src/data/industry-data.json', import.meta.url), 'utf8'));
const { site: _site, ...checked } = data;

const urls = new Set();
(function walk(node) {
  if (typeof node === 'string') {
    if (/^https?:\/\//.test(node)) urls.add(node);
  } else if (Array.isArray(node)) node.forEach(walk);
  else if (node && typeof node === 'object') Object.values(node).forEach(walk);
})(checked);

const bare = (host) => host.replace(/^www\./, '').toLowerCase();
const UA = 'Mozilla/5.0 (compatible; ArtistBibleLinkCheck/1.0; +weekly-audit)';

async function check(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,*/*' },
      signal: AbortSignal.timeout(20_000),
    });
    const finalHost = bare(new URL(res.url).hostname);
    const origHost = bare(new URL(url).hostname);
    // Same registrable site is fine (e.g. http->https, www, trailing path); a new domain is not.
    const sameSite = finalHost === origHost || finalHost.endsWith(`.${origHost}`) || origHost.endsWith(`.${finalHost}`);
    if (res.status !== 200) return { url, ok: false, why: `HTTP ${res.status}` };
    if (!sameSite) return { url, ok: false, why: `redirected to another site: ${res.url}` };
    return { url, ok: true, why: res.url !== url ? `200 (via ${res.url})` : '200' };
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return check(url, attempt + 1);
    }
    return { url, ok: false, why: String(err?.cause?.code ?? err?.message ?? err) };
  }
}

const results = await Promise.all([...urls].map((u) => check(u)));
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.url}  ${r.why}`);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} links healthy (data last verified ${data.lastVerified}).`);
if (failed.length) {
  console.error(`\n${failed.length} link(s) need attention:`);
  failed.forEach((r) => console.error(` - ${r.url}: ${r.why}`));
  process.exit(1);
}
