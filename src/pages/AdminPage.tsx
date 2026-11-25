import { CheckCircle2, CircleAlert, LogOut, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Field } from '../components/ui/Field';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ToolHeader } from '../components/ui/ToolHeader';
import { chapters } from '../content';
import claimsFile from '../data/claims.json';
import claimsState from '../data/claims-state.json';
import { industryData } from '../data';

const TOKEN_KEY = 'artist_bible_admin';

interface Checklist { group: string; items: { name: string; label: string; present: boolean }[] }
interface Ai { enabled: boolean; spentToday: number; dailyBudget: number; perPersonDaily: number }
type View =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'not-set-up' }
  | { kind: 'signed-out'; error?: string }
  | { kind: 'in'; checklist: Checklist[]; ai: Ai };

const readToken = () => {
  try { return window.localStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
};
const writeToken = (t: string) => {
  try { if (t) window.localStorage.setItem(TOKEN_KEY, t); else window.localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

async function api(token?: string): Promise<{ status: number; data: Record<string, unknown> | null }> {
  try {
    const r = await fetch('/api/admin', { headers: token ? { authorization: `Bearer ${token}` } : {}, cache: 'no-store' });
    if (!(r.headers.get('content-type') ?? '').includes('json')) return { status: 0, data: null };
    return { status: r.status, data: (await r.json()) as Record<string, unknown> };
  } catch {
    return { status: 0, data: null };
  }
}

function monthsAgo(ym: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return Number.POSITIVE_INFINITY;
  const now = new Date();
  return (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]));
}

function Section({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-3xl border border-border bg-surface">
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-5 font-display text-lg font-bold">
        {title}
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-3 px-5 pb-5">{children}</div>
    </details>
  );
}

function Chip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${ok ? 'bg-good/15 text-good' : 'bg-warn/15 text-warn'}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** The owner's page: sign in, then a short list of settings and health checks. Nothing about visitors is stored or shown. */
export function AdminPage() {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState('');

  const load = useCallback(async () => {
    const token = readToken();
    const first = await api(token || undefined);
    if (!first.data) return setView({ kind: 'unavailable' });
    if (first.data.mode === 'not-set-up') return setView({ kind: 'not-set-up' });
    if (first.status === 401) {
      writeToken('');
      return setView({ kind: 'signed-out', error: 'You were signed out. Sign in again.' });
    }
    if (first.data.mode === 'signed-in') return setView({ kind: 'in', checklist: first.data.checklist as Checklist[], ai: first.data.ai as Ai });
    setView({ kind: 'signed-out' });
  }, []);

  useEffect(() => {
    void load();
    fetch('/version.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { version?: string; release?: string } | null) => j?.version && setVersion(j.release ? `${j.release} (${j.version})` : j.version))
      .catch(() => undefined);
  }, [load]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/admin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'login', password }) });
      const j = (await r.json()) as { token?: string; message?: string };
      if (r.ok && j.token) {
        writeToken(j.token);
        setPassword('');
        await load();
      } else {
        setView({ kind: 'signed-out', error: j.message ?? 'Could not sign in.' });
      }
    } catch {
      setView({ kind: 'signed-out', error: 'Could not reach the server. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  const refreshApp = async () => {
    try {
      if ('serviceWorker' in navigator) await Promise.all((await navigator.serviceWorker.getRegistrations()).map((r) => r.update()));
      if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    } catch { /* keep going */ }
    location.reload();
  };

  const human = claimsFile.claims.filter((c) => (c as { automated?: boolean }).automated === false);
  const auto = claimsFile.claims.length - human.length;
  const maxAge = claimsFile.humanReviewMaxAgeMonths ?? 6;
  const repo = industryData.site.githubRepo;

  return (
    <section>
      <ToolHeader title="Admin" description="For the owner. Nothing here is about visitors: this app stores none of their data." />

      {view.kind === 'loading' && <p role="status" className="text-muted">Loading…</p>}

      {view.kind === 'unavailable' && (
        <Card className="p-5 text-[15px]">
          <p className="font-bold">The admin service is not reachable here.</p>
          <p className="mt-1 text-muted">It runs on the live site. On a local copy, or if the site&apos;s server functions are off, this page cannot sign you in.</p>
        </Card>
      )}

      {view.kind === 'not-set-up' && (
        <Card className="p-5 text-[15px]">
          <p className="font-bold">Sign-in is not set up yet.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>Make up a long password (at least 10 characters).</li>
            <li>In Cloudflare, open the Pages project, then <strong>Settings</strong>, then <strong>Variables and Secrets</strong>.</li>
            <li>Add a <strong>Secret</strong> named exactly <code>ADMIN_PASSWORD</code> with your password, and save.</li>
            <li>Open <strong>Deployments</strong> and retry the latest one. Then come back here.</li>
          </ol>
        </Card>
      )}

      {view.kind === 'signed-out' && (
        <Card className="p-5">
          <form onSubmit={signIn} className="space-y-3">
            <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" variant="primary" disabled={busy || password.length === 0}>{busy ? 'Signing in…' : 'Sign in'}</Button>
            {view.error && <p className="text-sm text-bad" role="alert">{view.error}</p>}
          </form>
        </Card>
      )}

      {view.kind === 'in' && (
        <div className="space-y-3">
          <Section title="Status" open>
            {view.checklist.map((g) => (
              <div key={g.group}>
                <p className="mb-1 text-sm font-bold text-muted">{g.group}</p>
                <ul className="divide-y divide-border">
                  {g.items.map((i) => (
                    <li key={i.name} className="flex items-center justify-between gap-3 py-2 text-[15px]">
                      <span className="min-w-0">{i.label}</span>
                      <Chip ok={i.present}>{i.present ? 'Set' : 'Not set'}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>

          <Section title="AI contract review" open>
            <p className="text-[15px]">
              {view.ai.enabled ? 'On.' : 'Off (it needs the AI connection and the counters store above).'} Each person can run {view.ai.perPersonDaily} reviews a day.
            </p>
            <div>
              <p className="mb-1.5 text-sm font-bold text-muted">Today&apos;s budget: {view.ai.spentToday.toLocaleString('en-US')} of {view.ai.dailyBudget.toLocaleString('en-US')} used</p>
              <ProgressBar value={(view.ai.spentToday / view.ai.dailyBudget) * 100} label="AI budget used today" />
            </div>
            <p className="text-sm text-muted">The budget resets every day (UTC) and stays under Cloudflare&apos;s free daily allowance.</p>
          </Section>

          <Section title="Content freshness">
            <p className="text-[15px]">Data last verified: <strong>{industryData.lastVerified}</strong>. Guides: {chapters.map((c) => `${c.number} ${c.lastVerified}`).join(', ')}.</p>
            <p className="text-[15px]">{auto} claims are checked automatically each week. {human.length} need a person to re-check them (at least every {maxAge} months):</p>
            <ul className="divide-y divide-border text-[15px]">
              {human.map((c) => {
                const when = (c as { humanCheckedOn?: string }).humanCheckedOn ?? '';
                const due = monthsAgo(when) > maxAge;
                return (
                  <li key={c.id} className="flex items-start justify-between gap-3 py-2">
                    <span className="min-w-0">{c.statement}</span>
                    <Chip ok={!due}>{when || 'never'}</Chip>
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-muted">Sources last confirmed by the weekly check: {Object.keys(claimsState).length} of {auto}.</p>
            <p className="flex flex-wrap gap-x-5 text-[15px] font-semibold">
              <a className="inline-flex min-h-11 items-center text-accent underline underline-offset-4" href={`${repo}/issues?q=is%3Aopen+label%3Aaudit`} target="_blank" rel="noopener noreferrer">Open audit issues</a>
              <a className="inline-flex min-h-11 items-center text-accent underline underline-offset-4" href={`${repo}/actions`} target="_blank" rel="noopener noreferrer">Automatic checks</a>
            </p>
          </Section>

          <Section title="Account" open>
            <p className="text-[15px]">App version: <strong>{version || 'not available'}</strong></p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={refreshApp}><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh the app</Button>
              <Button variant="danger" onClick={() => { writeToken(''); setView({ kind: 'signed-out' }); }}><LogOut className="h-4 w-4" aria-hidden="true" /> Sign out on this device</Button>
            </div>
            <p className="text-sm text-muted">Refreshing clears the saved app files so you get the newest version. Your songs, releases and drafts are kept.</p>
          </Section>
        </div>
      )}
    </section>
  );
}
