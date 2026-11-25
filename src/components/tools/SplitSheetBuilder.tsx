import { AlertCircle, Check, CheckCircle2, ChevronDown, ClipboardCopy, FileDown, Plus, Scale, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createCollaborator, useLocalProgress } from '../../hooks/useLocalProgress';
import { copyText } from '../../lib/clipboard';
import { downloadSplitSheetPdf } from '../../lib/pdf';
import { buildTextSummary, evenSplit, exportBlockers, fmtPct, splitStatus, type SplitStatus } from '../../lib/splitSheet';
import { cn } from '../../lib/utils';
import { COLLABORATOR_ROLES, type Collaborator } from '../../types/bible';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { DateInput } from '../ui/DateInput';
import { Input } from '../ui/input';
import { HelpButton } from '../ui/Term';
import { StepHeading } from '../ui/StepHeading';
import { BackToTools } from '../ui/BackToTools';
import { ToolHeader } from '../ui/ToolHeader';
import { TwoHundredPercent } from './TwoHundredPercent';

/** Percent input that lets you clear the field and type freely, committing a clamped number. */
function PctInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    // Sync from outside changes (e.g. "split evenly") without fighting the user's typing.
    setText((t) => (Number(t) === value && t !== '' ? t : String(value)));
  }, [value]);

  return (
    <div className="relative">
      <Input
        aria-label={label}
        inputMode="decimal"
        value={text}
        className="pr-9 text-right text-lg font-bold tabular-nums"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, '');
          setText(raw);
          const n = parseFloat(raw);
          onChange(Number.isFinite(n) ? Math.min(100, Math.round(n * 100) / 100) : 0);
        }}
        onBlur={() => setText(String(value))}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-muted" aria-hidden="true">%</span>
    </div>
  );
}

function TotalItem({ title, status }: { title: string; status: SplitStatus }) {
  const hint = status.ok ? '' : status.remaining < 0 ? ` (${fmtPct(Math.abs(status.remaining))} over)` : ` (${fmtPct(status.remaining)} left)`;
  return (
    <span className={cn('flex min-w-0 items-center gap-1 whitespace-nowrap', status.ok ? 'text-good' : 'text-warn')}>
      {status.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>
        {title}: <strong className="tabular-nums">{fmtPct(status.total)}</strong>
        {hint && <span className="text-xs font-semibold">{hint}</span>}
      </span>
    </span>
  );
}

function totalMessage(title: string, status: SplitStatus): string {
  if (status.ok) return `${title} adds up to 100%.`;
  return status.remaining < 0
    ? `${title} is over by ${fmtPct(Math.abs(status.remaining))}.`
    : `${title} has ${fmtPct(status.remaining)} still unassigned.`;
}

const BAR_COLORS = ['bg-accent', 'bg-gold', 'bg-pink', 'bg-sky-400', 'bg-violet-400', 'bg-lime-300'];

function StackedBar({ rows, keyName, label }: { rows: Collaborator[]; keyName: 'masterPct' | 'publishingPct'; label: string }) {
  const total = rows.reduce((a, r) => a + r[keyName], 0);
  const scale = total > 100 ? total : 100; // never overflow the bar if over-allocated
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-bold text-muted">{label}</span>
      <div
        role="img"
        aria-label={`${label}: ${rows.map((r) => `${r.name || 'Unnamed'} ${fmtPct(r[keyName])}`).join(', ')}`}
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2"
      >
        {rows.map((r, i) =>
          r[keyName] > 0 ? <div key={r.id} className={BAR_COLORS[i % BAR_COLORS.length]} style={{ width: `${(r[keyName] / scale) * 100}%` }} /> : null,
        )}
      </div>
    </div>
  );
}

export function SplitSheetBuilder() {
  const { state, updateSplitSheet, startNewSplitSheet, openSplitSheet, deleteSavedSplitSheet } = useLocalProgress();
  const draft = state.splitSheetDraft;
  const saved = state.savedSplitSheets;
  const songLabel = (d: { songTitle: string }) => d.songTitle.trim() || 'Untitled song';
  const rows = draft.collaborators;
  const master = splitStatus(rows, 'masterPct');
  const pub = splitStatus(rows, 'publishingPct');
  // Totals bar stays hidden until the numbers need attention, so a fresh sheet is not covered by it.
  const [totalsSeen, setTotalsSeen] = useState(false);
  const totalsOk = master.ok && pub.ok;
  useEffect(() => { if (!totalsOk) setTotalsSeen(true); }, [totalsOk]);
  const blockers = exportBlockers(draft);
  const canExport = blockers.length === 0;

  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const patchRow = (id: string, patch: Partial<Collaborator>) =>
    updateSplitSheet((d) => ({ ...d, collaborators: d.collaborators.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const addRow = () => updateSplitSheet((d) => ({ ...d, collaborators: [...d.collaborators, createCollaborator()] }));

  const removeRow = (id: string) =>
    updateSplitSheet((d) => ({
      ...d,
      collaborators: d.collaborators.length > 1 ? d.collaborators.filter((c) => c.id !== id) : d.collaborators,
    }));

  const splitEvenly = (key: 'masterPct' | 'publishingPct') =>
    updateSplitSheet((d) => {
      const shares = evenSplit(d.collaborators.length);
      return { ...d, collaborators: d.collaborators.map((c, i) => ({ ...c, [key]: shares[i] ?? 0 })) };
    });

  async function onCopy() {
    const ok = await copyText(buildTextSummary(draft));
    setCopied(ok ? 'ok' : 'fail');
    window.setTimeout(() => setCopied('idle'), 2500);
  }

  async function onPdf() {
    setPdfBusy(true);
    setPdfError('');
    try {
      await downloadSplitSheetPdf(draft);
    } catch {
      setPdfError('Could not build the PDF. Try again, or use Copy Text Summary.');
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <section>
      <BackToTools />
      <ToolHeader
        title="Split sheet"
        description="Settle who owns what, in writing, before anyone leaves the studio. It takes about two minutes."
      />

      {saved.length > 0 && (
        <div className="no-print mb-5">
          <p className="mb-2 text-sm font-bold text-muted">Your songs</p>
          <div className="flex flex-wrap gap-2">
            <span aria-current="true" className="inline-flex h-11 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-fg">{songLabel(draft)}</span>
            {saved.map((d) => (
              <span key={d.id} className="inline-flex items-center rounded-full border border-border bg-surface">
                <button type="button" onClick={() => openSplitSheet(d.id)} className="h-11 cursor-pointer rounded-l-full pl-4 pr-2 text-sm font-bold text-fg hover:text-accent">{songLabel(d)}</button>
                <button
                  type="button"
                  aria-label={`Remove ${songLabel(d)}`}
                  onClick={() => { if (window.confirm(`Remove "${songLabel(d)}" from this device?`)) deleteSavedSplitSheet(d.id); }}
                  className="grid h-11 w-10 cursor-pointer place-items-center rounded-r-full text-muted hover:text-bad"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            ))}
            <button type="button" onClick={startNewSplitSheet} className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-muted px-4 text-sm font-bold text-muted hover:border-accent hover:text-accent">
              <Plus className="h-4 w-4" aria-hidden="true" /> New song
            </button>
          </div>
        </div>
      )}

      <details className="group rounded-2xl border border-border bg-surface px-4 py-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
          Wait, what's a "200% song"?
          <ChevronDown className="h-5 w-5 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <TwoHundredPercent />
      </details>

      <StepHeading n={1} title="The song" />
      <Card className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <label htmlFor="ss-title" className="mb-1.5 block font-bold">Song title</label>
          <Input id="ss-title" value={draft.songTitle} maxLength={120} placeholder="e.g. Midnight Drive" onChange={(e) => updateSplitSheet({ songTitle: e.target.value })} />
        </div>
        <div>
          <label htmlFor="ss-date" className="mb-1.5 block font-bold">Session date</label>
          <DateInput id="ss-date" value={draft.sessionDate} onChange={(e) => updateSplitSheet({ sessionDate: e.target.value })} />
        </div>
      </Card>

      <StepHeading n={2} title="Who worked on it?" hint="Enter each person's share of the recording and of the song." />
      <ul className="space-y-3">
        {rows.map((c, i) => (
          <li key={c.id}>
            <Card className="p-4 sm:p-5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`name-${c.id}`} className="mb-1.5 block text-sm font-bold">Name or stage name</label>
                  <Input id={`name-${c.id}`} value={c.name} maxLength={80} placeholder={`Collaborator ${i + 1}`} onChange={(e) => patchRow(c.id, { name: e.target.value })} />
                </div>
                <Button variant="ghost" size="icon" className="mt-7" onClick={() => removeRow(c.id)} disabled={rows.length <= 1} aria-label={`Remove ${c.name || `collaborator ${i + 1}`}`}>
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-3">
                <label htmlFor={`role-${c.id}`} className="mb-1.5 block text-sm font-bold">Role</label>
                <select
                  id={`role-${c.id}`}
                  value={c.role}
                  onChange={(e) => patchRow(c.id, { role: e.target.value })}
                  className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-base focus-visible:border-accent"
                >
                  {!COLLABORATOR_ROLES.some((r) => r === c.role) && <option value={c.role}>{c.role}</option>}
                  {COLLABORATOR_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="mb-1.5 block text-sm font-bold">Recording share</span>
                  <PctInput value={c.masterPct} label={`Master percent for ${c.name || `collaborator ${i + 1}`}`} onChange={(n) => patchRow(c.id, { masterPct: n })} />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-bold">Song share</span>
                  <PctInput value={c.publishingPct} label={`Publishing percent for ${c.name || `collaborator ${i + 1}`}`} onChange={(n) => patchRow(c.id, { publishingPct: n })} />
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor={`ipi-${c.id}`} className="block text-sm font-bold">PRO / IPI number <span className="font-normal text-muted">(optional)</span></label>
                  <HelpButton id="ipi" label="What is an IPI number?" />
                </div>
                <Input id={`ipi-${c.id}`} value={c.ipi ?? ''} maxLength={30} inputMode="numeric" onChange={(e) => patchRow(c.id, { ipi: e.target.value })} />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={addRow} disabled={rows.length >= 50}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add someone
        </Button>
        <Button size="sm" onClick={() => splitEvenly('masterPct')}>
          <Scale className="h-4 w-4" aria-hidden="true" /> Split recording evenly
        </Button>
        <Button size="sm" onClick={() => splitEvenly('publishingPct')}>
          <Scale className="h-4 w-4" aria-hidden="true" /> Split song evenly
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted">Engineers and mixers are usually paid a flat fee and get 0% unless everyone agrees otherwise.</p>

      <div className="mt-5 space-y-2">
        <StackedBar rows={rows} keyName="masterPct" label="Recording" />
        <StackedBar rows={rows} keyName="publishingPct" label="Song" />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pl-[5.75rem] pt-1 text-xs text-muted" aria-hidden="true">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-sm', BAR_COLORS[i % BAR_COLORS.length])} />
              {r.name.trim() || `Collaborator ${i + 1}`}
            </li>
          ))}
        </ul>
      </div>

      {/* Always-visible running total: one slim row so it barely covers the form on a phone. */}
      {(totalsSeen || !totalsOk) && (
      <div className="no-print sticky bottom-[calc(var(--tab-h)+0.5rem)] z-10 mt-6 flex items-center justify-center gap-2 rounded-full border border-border bg-bg/95 px-3 py-2 text-sm font-bold shadow-[0_6px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <TotalItem title="Recording" status={master} />
        <span className="text-muted" aria-hidden="true">&bull;</span>
        <TotalItem title="Song" status={pub} />
        <p className="sr-only" role="status">{totalMessage('Recording', master)} {totalMessage('Song', pub)}</p>
      </div>
      )}

      <StepHeading n={3} title="Send it" hint="Both totals need to be 100% first." />
      <Card className="p-4 sm:p-5">
        {!canExport && (
          <ul className="mb-4 space-y-1.5 text-sm text-warn" aria-label="Fix these before sending">
            {blockers.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {b}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={!canExport || pdfBusy} onClick={onPdf}>
            <FileDown className="h-4 w-4" aria-hidden="true" /> {pdfBusy ? 'Building PDF…' : 'Download PDF'}
          </Button>
          <Button disabled={!canExport} onClick={onCopy}>
            {copied === 'ok' ? <Check className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
            {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy Text Summary'}
          </Button>
        </div>
        <p className="mt-3 text-sm" role="status">
          {copied === 'ok' && <span className="text-accent">Copied. Paste it into iMessage or WhatsApp.</span>}
          {copied === 'fail' && <span className="text-bad">Your browser blocked copying. Use Download PDF instead.</span>}
          {pdfError && <span className="text-bad">{pdfError}</span>}
        </p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={startNewSplitSheet}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Start another song
        </Button>
        <p className="mt-2 text-xs text-muted">The PDF has signature lines. The text summary is for group chats. This records what everyone agreed and is not legal advice. Your draft is saved on this device only.</p>
      </Card>
    </section>
  );
}
