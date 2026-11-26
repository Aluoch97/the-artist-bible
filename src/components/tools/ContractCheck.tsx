import { AlertTriangle, Bot, Check, ChevronDown, FileSearch, FileText, Info, Loader2, ShieldCheck, Trash2, TriangleAlert, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { extractText, MAX_AI_CHARS } from '../../lib/contractText';
import { normalizeContract, redact, scanContract, type ScanFinding } from '../../lib/contractScan';
import { SAMPLE_CONTRACT } from '../../lib/sampleContract';
import { cn } from '../../lib/utils';
import type { ContractReview } from '../../types/bible';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { StepHeading } from '../ui/StepHeading';

const ENDPOINT = '/api/review-contract';

type Availability = 'checking' | 'on' | 'off';

function useAiAvailability(): Availability {
  const [state, setState] = useState<Availability>('checking');
  useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (!navigator.onLine) return setState('off'); // offline: nothing to ask, and no network error to log
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 6000);
      fetch(ENDPOINT, { headers: { accept: 'application/json' }, signal: ctrl.signal })
        .then(async (r) => {
          if (!r.ok || !(r.headers.get('content-type') ?? '').includes('application/json')) return !cancelled && setState('off');
          const body = (await r.json()) as { enabled?: unknown };
          if (!cancelled) setState(body.enabled === true ? 'on' : 'off');
        })
        .catch(() => !cancelled && setState('off'))
        .finally(() => window.clearTimeout(timer));
    };
    check();
    window.addEventListener('online', check);
    return () => {
      cancelled = true;
      window.removeEventListener('online', check);
    };
  }, []);
  return state;
}

/* --------------------------- on-device scan results --------------------------- */

function FindingCard({ f }: { f: ScanFinding }) {
  const [open, setOpen] = useState(false);
  const high = f.flag.severity === 'high';
  return (
    <article className={cn('rounded-2xl border border-border border-l-4 bg-surface p-4', high ? 'border-l-pink' : 'border-l-gold')}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-lg font-bold leading-snug">{f.flag.term}</h4>
        <Badge variant={high ? 'bad' : 'warn'}><TriangleAlert className="h-3 w-3" aria-hidden="true" /> {high ? 'Serious' : 'Be careful'}</Badge>
        <span className="text-sm text-muted">{f.count} {f.count === 1 ? 'place' : 'places'}</span>
      </div>
      <p className="mt-2 text-[0.9375rem]">{f.flag.plainEnglish}</p>
      <ul className="mt-3 space-y-2">
        {f.matches.map((m, i) => (
          <li key={i} className="rounded-xl bg-bg p-3 text-sm leading-relaxed text-muted">
            {m.before}
            <mark className="rounded bg-gold/30 px-0.5 font-semibold text-fg">{m.hit}</mark>
            {m.after}
          </li>
        ))}
      </ul>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-2 flex min-h-11 cursor-pointer items-center gap-1 text-[0.9375rem] font-bold text-accent">
        {open ? 'Hide what to do' : 'What to do about it'}
        <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <ul className="list-disc space-y-1 pl-5 text-[0.9375rem] text-muted marker:text-accent">
          {f.flag.whatToDo.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
    </article>
  );
}

function ScanResults({ findings }: { findings: ScanFinding[] }) {
  const serious = findings.filter((f) => f.flag.severity === 'high');
  const careful = findings.filter((f) => f.flag.severity !== 'high');
  if (findings.length === 0) {
    return (
      <Card className="flex gap-3 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <div className="text-[0.9375rem]">
          <p className="font-bold">We did not find wording from our list of known traps.</p>
          <p className="mt-1 text-muted">That does <strong className="text-fg">not</strong> mean the contract is fair. This check only looks for specific phrases, and a deal can be one-sided without using them. Read it all, and have a lawyer look at anything important.</p>
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <p role="status" className="text-[0.9375rem]">
        Found wording linked to <strong>{findings.length}</strong> known {findings.length === 1 ? 'trap' : 'traps'}
        {serious.length > 0 && <> ({serious.length} serious)</>}. These are places to read closely, not proof the deal is bad.
      </p>
      {[{ title: 'Serious', items: serious, color: 'text-pink' }, { title: 'Be careful', items: careful, color: 'text-gold' }].map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.title} aria-label={g.title}>
              <h3 className={cn('mb-3 flex items-center gap-2 font-display text-2xl font-bold', g.color)}>
                <TriangleAlert className="h-6 w-6" aria-hidden="true" /> {g.title} ({g.items.length})
              </h3>
              <div className="space-y-3">{g.items.map((f) => <FindingCard key={f.flag.id} f={f} />)}</div>
            </section>
          ),
      )}
      <p className="text-sm text-muted">Want the full explanation of each one? See the <Link to="/red-flags" className="font-semibold text-fg underline underline-offset-4">Red flags page</Link>.</p>
    </div>
  );
}

/* ------------------------------- AI review ------------------------------- */

const OVERALL = {
  serious: { title: 'Several serious concerns', tone: 'border-pink/50 bg-pink/10 text-pink', body: 'Do not sign this without a lawyer reading it.' },
  careful: { title: 'Some things to negotiate', tone: 'border-gold/50 bg-gold/10 text-gold', body: 'Ask about the points below and get the answers in writing.' },
  few_concerns: { title: 'No major problems spotted', tone: 'border-good/50 bg-good/10 text-good', body: 'The AI can miss things. If money or ownership is involved, still have a lawyer read it.' },
} as const;

function AiResults({ r, model }: { r: ContractReview; model: string }) {
  const o = OVERALL[r.overall];
  return (
    <div className="space-y-6" aria-live="polite">
      <div className={cn('rounded-2xl border p-4', o.tone)}>
        <p className="font-display text-xl font-bold">{o.title}</p>
        <p className="mt-1 text-[0.9375rem] text-fg">{o.body}</p>
      </div>
      <p className="text-sm text-muted">The AI read and the instant check can disagree, because they look at the contract differently. If one is more cautious, trust the more cautious one.</p>

      {r.summary.length > 0 && (
        <section aria-label="Summary">
          <h3 className="mb-2 font-display text-xl font-bold">What you'd be agreeing to</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem] marker:text-accent">{r.summary.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
      )}

      {r.keyTerms.length > 0 && (
        <section aria-label="Key terms">
          <h3 className="mb-2 font-display text-xl font-bold">Key terms</h3>
          <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {r.keyTerms.map((t) => (
              <div key={t.label} className="p-3 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-3">
                <dt className="text-sm font-bold text-muted">{t.label}</dt>
                <dd className="text-[0.9375rem]">{t.plain}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {r.flags.length > 0 && (
        <section aria-label="Concerns">
          <h3 className="mb-3 font-display text-xl font-bold">Concerns</h3>
          <div className="space-y-3">
            {[...r.flags].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'serious' ? -1 : 1)).map((f, i) => (
              <article key={i} className={cn('rounded-2xl border border-border border-l-4 bg-surface p-4', f.severity === 'serious' ? 'border-l-pink' : 'border-l-gold')}>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-bold leading-snug">{f.title}</h4>
                  <Badge variant={f.severity === 'serious' ? 'bad' : 'warn'}>{f.severity === 'serious' ? 'Serious' : 'Be careful'}</Badge>
                </div>
                {f.quoteFound ? (
                  <blockquote className="mt-2 rounded-xl bg-bg p-3 text-sm italic text-muted">&ldquo;{f.quote}&rdquo;<span className="mt-1 block text-xs not-italic">From your contract</span></blockquote>
                ) : (
                  <p className="mt-2 text-xs text-muted">The AI described this but we could not match its wording to your text. Check the original.</p>
                )}
                <p className="mt-2 text-[0.9375rem]">{f.why}</p>
                {f.askFor && <p className="mt-2 text-[0.9375rem]"><strong>Ask for:</strong> <span className="text-muted">{f.askFor}</span></p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {r.questions.length > 0 && (
        <section aria-label="Questions to ask">
          <h3 className="mb-2 font-display text-xl font-bold">Questions to ask before you sign</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem] marker:text-accent">{r.questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </section>
      )}

      <p className="rounded-xl border border-border bg-surface p-3 text-xs text-muted">
        Made by an AI ({model}). It can misread or miss things, and it is not a lawyer or legal advice. Use it to know what to ask, then have an entertainment attorney review any contract that matters.
      </p>
    </div>
  );
}

function AiPanel({ text, availability }: { text: string; availability: Availability }) {
  const [agreed, setAgreed] = useState(false);
  const [hide, setHide] = useState(true);
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'done'; review: ContractReview; model: string }>({ kind: 'idle' });

  const prepared = useMemo(() => {
    const base = normalizeContract(text);
    const r = hide ? redact(base) : { text: base, removed: 0 };
    return { text: r.text.slice(0, MAX_AI_CHARS), removed: r.removed, truncated: r.text.length > MAX_AI_CHARS };
  }, [text, hide]);

  // A different contract means the old result no longer applies.
  useEffect(() => setState({ kind: 'idle' }), [text]);

  if (availability === 'checking') return null;
  if (availability === 'off') {
    return (
      <Card className="flex gap-3 p-4 text-[0.9375rem]">
        <Bot className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        <p className="text-muted">The optional AI review is not turned on right now. The instant check above works without it.</p>
      </Card>
    );
  }

  async function run() {
    setState({ kind: 'loading' });
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ text: prepared.text }) });
      const body = (await res.json().catch(() => ({}))) as { review?: ContractReview; model?: string; message?: string };
      if (!res.ok || !body.review) return setState({ kind: 'error', message: body.message ?? 'The review could not be completed. Try again later.' });
      setState({ kind: 'done', review: body.review, model: body.model ?? 'AI model' });
    } catch {
      setState({ kind: 'error', message: navigator.onLine ? 'Could not reach the review service. Try again in a moment.' : 'You are offline. The AI review needs a connection.' });
    }
  }

  const tooShort = prepared.text.length < 300;
  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex gap-3">
          <Bot className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
          <div className="text-[0.9375rem]">
            <p className="font-bold">Get a plain-English review from an AI</p>
            <p className="mt-1 text-muted">It summarizes the deal, points out concerns with quotes from your contract, and suggests what to ask for.</p>
          </div>
        </div>

        <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">
          <p className="font-bold text-gold">Before you send it</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-fg">
            <li>The text below is sent over the internet to <strong>Cloudflare Workers AI</strong>. Nothing is sent until you press the button.</li>
            <li>Cloudflare says it does not use content to train its models and does not keep it after it replies. This app stores none of it.</li>
            <li>The AI can be wrong. It is not a lawyer.</li>
            <li>Free and limited: 3 reviews per person per day, and a shared daily allowance that can run out.</li>
          </ul>
        </div>

        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem]">
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span>Remove emails, phone numbers and long ID numbers first {hide && prepared.removed > 0 && <span className="text-muted">({prepared.removed} removed)</span>}</span>
        </label>
        <p className="-mt-2 text-xs text-muted">Names and addresses are not removed automatically. Check the preview, and edit your contract text above if you want them out.</p>

        <details className="group rounded-xl border border-border bg-bg px-3 py-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[0.9375rem] font-bold [&::-webkit-details-marker]:hidden">
            Show exactly what will be sent ({prepared.text.length.toLocaleString('en-US')} characters)
            <ChevronDown className="h-5 w-5 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <pre tabIndex={0} className="mb-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-muted">{prepared.text}</pre>
        </details>
        {prepared.truncated && (
          <p role="alert" className="flex gap-2 text-sm text-warn"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> This contract is longer than the {MAX_AI_CHARS.toLocaleString('en-US')} characters the free review can read. Only the first part will be reviewed. Review the rest in a second pass.</p>
        )}

        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem]">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span>I understand this text will be sent to an AI service to produce the review.</span>
        </label>

        <Button variant="primary" disabled={!agreed || tooShort || state.kind === 'loading'} onClick={run}>
          {state.kind === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
          {state.kind === 'loading' ? 'Reading your contract…' : 'Get AI review'}
        </Button>
        {tooShort && <p className="text-sm text-muted">Add more of the contract first. The review needs at least a few paragraphs.</p>}
        <div role="status" aria-live="polite">
          {state.kind === 'loading' && <p className="text-sm text-muted">This can take up to a minute. Keep this screen open.</p>}
          {state.kind === 'error' && <p className="flex gap-2 text-[0.9375rem] text-bad"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {state.message}</p>}
        </div>
      </Card>
      {state.kind === 'done' && <AiResults r={state.review} model={state.model} />}
    </div>
  );
}

/* --------------------------------- main --------------------------------- */

export function ContractCheck() {
  const availability = useAiAvailability();
  const [text, setText] = useState('');
  const [scanned, setScanned] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const findings = useMemo(() => (scanned ? scanContract(scanned) : []), [scanned]);

  async function onFile(file: File | undefined, extra = 0) {
    if (!file) return;
    setBusy(true);
    setError('');
    setFileNote('');
    const r = await extractText(file);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    if (!r.ok) return setError(r.error);
    setText(r.text);
    setScanned(null);
    setFileNote(`Read "${file.name}" on this device.${r.note ? ' ' + r.note : ''}${extra > 0 ? ` Only the first file was read; ${extra} other${extra === 1 ? ' was' : 's were'} ignored.` : ''}`);
  }

  function check() {
    setScanned(text);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function clearAll() {
    setText('');
    setScanned(null);
    setFileNote('');
    setError('');
  }

  // Accept a file dropped anywhere on this screen. Without this, a missed drop makes the browser open the file and leave the app.
  // Dragging plain text (no files) is left alone so it can still be dropped into the text box.
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;
  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    let depth = 0;
    const enter = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; setDragging(true); };
    const over = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; };
    const leave = (e: DragEvent) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (depth === 0) setDragging(false); };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      void onFileRef.current(files[0], Math.max(0, files.length - 1));
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  const hasText = text.trim().length >= 40;

  return (
    <div>
      <p className="mb-6 flex gap-2 rounded-2xl border border-border bg-surface p-3 text-[0.9375rem]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <span>Your file is read <strong>on this device</strong>. Nothing is uploaded or saved. The only time any text leaves your device is if you choose the optional AI review below and agree to it.</span>
      </p>

      <StepHeading n={1} title="Add your contract" hint="PDF, Word (.docx) or text file. Or paste the text." />
      <Card className="space-y-4 p-4 sm:p-5">
        <div
          data-dropzone
          className={cn('rounded-2xl border-2 border-dashed p-5 text-center transition-colors', dragging ? 'border-accent bg-accent/10' : 'border-border')}
        >
          <Upload className={cn('mx-auto h-7 w-7', dragging ? 'text-accent' : 'text-muted')} aria-hidden="true" />
          <p className="mt-2 font-bold" aria-live="polite">
            {dragging ? 'Drop it to read it' : (
              <>
                <span className="hidden [@media(pointer:fine)]:inline">Drag a contract here, or </span>
                <span className="[@media(pointer:fine)]:hidden">Add a contract: </span>
                choose a file
              </>
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted">PDF, Word (.docx) or text. Read on this device only.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <input ref={fileRef} id="contract-file" aria-label="Choose a contract file" tabIndex={-1} type="file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="primary" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
              {busy ? 'Reading…' : 'Choose a file'}
            </Button>
            <Button onClick={() => { setText(SAMPLE_CONTRACT); setScanned(null); setFileNote('Loaded a made-up example. It is not a real contract.'); setError(''); }}>
              <FileText className="h-4 w-4" aria-hidden="true" /> Try an example
            </Button>
            {text && (
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear
              </Button>
            )}
          </div>
        </div>
        <div role="status" aria-live="polite">
          {fileNote && <p className="flex gap-2 text-sm text-accent"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {fileNote}</p>}
          {error && <p role="alert" className="flex gap-2 text-sm text-bad"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}</p>}
        </div>
        <div>
          <label htmlFor="contract-text" className="mb-1.5 block font-bold">Contract text</label>
          <textarea
            id="contract-text"
            value={text}
            maxLength={400_000}
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste the contract here, or choose a file above."
            onChange={(e) => { setText(e.target.value); setScanned(null); }}
            className="min-h-48 w-full rounded-xl border border-border bg-bg p-4 text-base text-fg placeholder:text-muted focus-visible:border-accent"
          />
          {text && <p className="mt-1 text-xs text-muted">{text.length.toLocaleString('en-US')} characters. Kept in memory only; closing this page erases it.</p>}
        </div>
        <Button variant="primary" disabled={!hasText} onClick={check}>
          <FileSearch className="h-4 w-4" aria-hidden="true" /> Check my contract
        </Button>
      </Card>

      {scanned !== null && (
        <div ref={resultsRef}>
          <StepHeading n={2} title="Instant check" hint="Done on this device. Looks for wording linked to known traps." />
          <ScanResults findings={findings} />

          <StepHeading n={3} title="Optional: AI review" hint="A deeper, plain-English read. Only if you choose it." />
          <AiPanel text={scanned} availability={availability} />
        </div>
      )}
    </div>
  );
}
