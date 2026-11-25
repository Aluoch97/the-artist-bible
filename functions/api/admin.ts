/**
 * The owner's sign-in and the owner-only facts behind the /admin page (same idea as the other NuRenaissance apps).
 *
 *   GET  /api/admin                          no sign-in: only says whether sign-in is set up ("not-set-up" | "ready"). No data.
 *   POST /api/admin {action:'login', password}   right password => a signed session token (30 days). Wrong => 401; five wrong tries from
 *                                                one address lock that address out for 15 minutes.
 *   GET  /api/admin + Authorization: Bearer <token>   the setup checklist (yes/no only, never a value) and today's AI-review usage.
 *
 * Fail closed: it does nothing unless the Cloudflare secret ADMIN_PASSWORD exists (at least 10 characters). The session token is signed
 * with a key made from that password, so changing the password signs every device out. Nothing about visitors is stored or shown.
 */

interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}
export interface Env {
  ADMIN_PASSWORD?: string;
  AI?: unknown;
  BUDGET?: KVLike;
}

export const SESSION_MS = 30 * 24 * 3600 * 1000;
export const MAX_TRIES = 5;
export const LOCK_MS = 15 * 60 * 1000;
const DAILY_NEURON_BUDGET = 6_000; // keep in step with review-contract.ts
const PER_PERSON_DAILY = 3;

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

export const adminReady = (env: Env) => String(env?.ADMIN_PASSWORD ?? '').length >= 10;

const enc = new TextEncoder();
const b64u = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function sign(env: Env, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(`${env.ADMIN_PASSWORD}|artist-bible-admin-session-v1`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/** Compares two strings in constant time (by comparing their hashes byte by byte). */
export async function sameText(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

export async function makeToken(env: Env, now = Date.now()): Promise<string> {
  const payload = b64u(enc.encode(JSON.stringify({ exp: now + SESSION_MS, v: 1 })));
  return `${payload}.${await sign(env, payload)}`;
}

export async function verifyToken(env: Env, token: string, now = Date.now()): Promise<boolean> {
  if (!adminReady(env)) return false;
  const [payload, sig, extra] = String(token || '').split('.');
  if (!payload || !sig || extra !== undefined) return false;
  if (!(await sameText(sig, await sign(env, payload)))) return false;
  try {
    const p = JSON.parse(new TextDecoder().decode(fromB64u(payload))) as { exp?: number; v?: number };
    return p.v === 1 && Number(p.exp) > now;
  } catch {
    return false;
  }
}

/* Wrong-password counter. In the budget store when there is one (so it survives restarts); in memory otherwise. */
const memTries = new Map<string, { n: number; until: number }>();
export const forgetTries = () => memTries.clear();

async function ipKey(request: Request): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const d = await crypto.subtle.digest('SHA-256', enc.encode(`${ip}|artist-bible-admin`));
  return 'a:' + [...new Uint8Array(d)].slice(0, 10).map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function isLocked(env: Env, key: string, now: number): Promise<boolean> {
  if (env.BUDGET) return Number((await env.BUDGET.get(key)) ?? 0) >= MAX_TRIES;
  const t = memTries.get(key);
  return !!t && t.until > now;
}

async function recordWrong(env: Env, key: string, now: number): Promise<void> {
  if (env.BUDGET) {
    const n = Number((await env.BUDGET.get(key)) ?? 0) + 1;
    await env.BUDGET.put(key, String(n), { expirationTtl: Math.ceil(LOCK_MS / 1000) });
    return;
  }
  const t = memTries.get(key) ?? { n: 0, until: 0 };
  if (t.until && t.until <= now) {
    t.n = 0;
    t.until = 0;
  }
  t.n += 1;
  if (t.n >= MAX_TRIES) t.until = now + LOCK_MS;
  memTries.set(key, t);
  if (memTries.size > 5000) memTries.clear();
}

/** Which secrets and bindings exist. Yes/no only. */
export function setupChecklist(env: Env) {
  return [
    {
      group: 'AI contract review',
      items: [
        { name: 'AI', label: 'Workers AI connection (binding AI)', present: Boolean(env.AI) },
        { name: 'BUDGET', label: 'Daily counters store (KV binding BUDGET)', present: Boolean(env.BUDGET) },
      ],
    },
    { group: 'This page', items: [{ name: 'ADMIN_PASSWORD', label: 'Admin password', present: adminReady(env) }] },
  ];
}

const today = () => new Date().toISOString().slice(0, 10);

async function aiUsage(env: Env) {
  const on = Boolean(env.AI && env.BUDGET);
  let spent = 0;
  if (env.BUDGET) spent = Number((await env.BUDGET.get(`n:${today()}`)) ?? 0) || 0;
  return { enabled: on, spentToday: spent, dailyBudget: DAILY_NEURON_BUDGET, perPersonDaily: PER_PERSON_DAILY };
}

const authed = (request: Request, env: Env) => verifyToken(env, (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, ''));

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  env = env ?? {};
  if (!adminReady(env)) return reply({ mode: 'not-set-up' });
  if (!request.headers.get('authorization')) return reply({ mode: 'ready' });
  if (!(await authed(request, env))) return reply({ error: 'signed_out', message: 'Sign in again.' }, 401);
  return reply({ mode: 'signed-in', checklist: setupChecklist(env), ai: await aiUsage(env), now: new Date().toISOString() });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  env = env ?? {};
  if (!adminReady(env)) return reply({ error: 'not_set_up', message: 'Sign-in is not set up yet.' }, 503);
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return reply({ error: 'bad_origin', message: 'This can only be used from the app.' }, 403);
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return reply({ error: 'bad_type', message: 'Send JSON.' }, 415);
  let body: { action?: unknown; password?: unknown };
  try {
    const text = await request.text();
    if (text.length > 2_000) return reply({ error: 'too_large', message: 'Too much data.' }, 413);
    body = JSON.parse(text);
  } catch {
    return reply({ error: 'bad_json', message: 'That was not valid.' }, 400);
  }
  if (body.action !== 'login') return reply({ error: 'unknown_action', message: 'Unknown action.' }, 400);

  const now = Date.now();
  const key = await ipKey(request);
  if (await isLocked(env, key, now)) return reply({ error: 'locked', message: 'Too many wrong tries. Wait 15 minutes and try again.' }, 429);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!(await sameText(password, String(env.ADMIN_PASSWORD)))) {
    await recordWrong(env, key, now);
    return reply({ error: 'wrong_password', message: 'That password is not right.' }, 401);
  }
  return reply({ token: await makeToken(env, now), expiresInDays: 30 });
}

export function onRequest(): Response {
  return reply({ error: 'method', message: 'Not allowed.' }, 405);
}
