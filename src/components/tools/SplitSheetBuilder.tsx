import { AlertCircle, Check, CheckCircle2, ClipboardCopy, FileDown, Plus, Scale, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createCollaborator, useLocalProgress } from '../../hooks/useLocalProgress';
import { copyText } from '../../lib/clipboard';
import { downloadSplitSheetPdf } from '../../lib/pdf';
import { buildTextSummary, evenSplit, exportBlockers, fmtPct, splitStatus, type SplitStatus } from '../../lib/splitSheet';
import { cn } from '../../lib/utils';
import { COLLABORATOR_ROLES, type Collaborator } from '../../types/bible';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
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
    <Input
      aria-label={label}
      inputMode="decimal"
      value={text}
      className="w-24 text-right font-mono tabular-nums"
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '');
        setText(raw);
        const n = parseFloat(raw);
        onChange(Number.isFinite(n) ? Math.min(100, Math.round(n * 100) / 100) : 0);
      }}
      onBlur={() => setText(String(value))}
    />
  );
}

function TotalMeter({ title, status }: { title: string; status: SplitStatus }) {
  const over = status.remaining < 0;
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        status.ok ? 'border-good/50 bg-good/10' : 'border-warn/50 bg-warn/10',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className={cn('font-mono text-lg font-bold tabular-nums', status.ok ? 'text-good' : 'text-warn')}>
          {fmtPct(status.total)}
        </span>
      </div>
      <p className={cn('mt-1 flex items-center gap-1.5 text-xs', status.ok ? 'text-good' : 'text-warn')} role="status">
        {status.ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
        {status.ok
          ? 'Adds up to 100%'
          : over
            ? `Over by ${fmtPct(Math.abs(status.remaining))}. Reduce someone's share.`
            : `${fmtPct(status.remaining)} still unassigned.`}
      </p>
    </div>
  );
}

const BAR_COLORS = ['bg-accent', 'bg-good', 'bg-warn', 'bg-sky-400', 'bg-fuchsia-400', 'bg-lime-300'];

function StackedBar({ rows, keyName, label }: { rows: Collaborator[]; keyName: 'masterPct' | 'publishingPct'; label: string }) {
  const total = rows.reduce((a, r) => a + r[keyName], 0);
  const scale = total > 100 ? total : 100; // never overflow the bar if over-allocated
  return (
    <div role="img" aria-label={`${label}: ${rows.map((r) => `${r.name || 'Unnamed'} ${fmtPct(r[keyName])}`).join(', ')}`} className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
      {rows.map((r, i) =>
        r[keyName] > 0 ? (
          <div key={r.id} className={BAR_COLORS[i % BAR_COLORS.length]} style={{ width: `${(r[keyName] / scale) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}

export function SplitSheetBuilder() {
  const { state, updateSplitSheet } = useLocalProgress();
  const draft = state.splitSheetDraft;
  const rows = draft.collaborators;
  const master = splitStatus(rows, 'masterPct');
  const pub = splitStatus(rows, 'publishingPct');
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
      <ToolHeader
        title="Split Sheet Builder"
        description="Agree on who owns what before the session ends. Fill it in together, then send a PDF or a text recap."
      />

      <TwoHundredPercent />

      <Card className="mb-6 grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ss-title" className="mb-1.5 block text-sm font-semibold">Song title</label>
          <Input id="ss-title" value={draft.songTitle} maxLength={120} placeholder="e.g. Midnight Drive" onChange={(e) => updateSplitSheet({ songTitle: e.target.value })} />
        </div>
        <div>
          <label htmlFor="ss-date" className="mb-1.5 block text-sm font-semibold">Session date</label>
          <Input id="ss-date" type="date" value={draft.sessionDate} className="font-mono" onChange={(e) => updateSplitSheet({ sessionDate: e.target.value })} />
        </div>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <TotalMeter title="Master total" status={master} />
        <TotalMeter title="Publishing total" status={pub} />
      </div>

      <div className="mb-6 space-y-2">
        <StackedBar rows={rows} keyName="masterPct" label="Master split" />
        <StackedBar rows={rows} keyName="publishingPct" label="Publishing split" />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted" aria-hidden="true">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-sm', BAR_COLORS[i % BAR_COLORS.length])} />
              {r.name.trim() || `Collaborator ${i + 1}`}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Collaborators</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => splitEvenly('masterPct')}><Scale className="h-4 w-4" aria-hidden="true" /> Split master evenly</Button>
          <Button size="sm" onClick={() => splitEvenly('publishingPct')}><Scale className="h-4 w-4" aria-hidden="true" /> Split publishing evenly</Button>
        </div>
      </div>

      <ul className="space-y-3">
        {rows.map((c, i) => (
          <li key={c.id}>
            <Card className="grid gap-3 p-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor={`name-${c.id}`} className="mb-1 block text-xs font-semibold text-muted">Name / stage name</label>
                <Input id={`name-${c.id}`} value={c.name} maxLength={80} placeholder={`Collaborator ${i + 1}`} onChange={(e) => patchRow(c.id, { name: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor={`role-${c.id}`} className="mb-1 block text-xs font-semibold text-muted">Role</label>
                <select
                  id={`role-${c.id}`}
                  value={c.role}
                  onChange={(e) => patchRow(c.id, { role: e.target.value })}
                  className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm focus-visible:border-accent"
                >
                  {!COLLABORATOR_ROLES.some((r) => r === c.role) && <option value={c.role}>{c.role}</option>}
                  {COLLABORATOR_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`ipi-${c.id}`} className="mb-1 block text-xs font-semibold text-muted">PRO / IPI # (optional)</label>
                <Input id={`ipi-${c.id}`} value={c.ipi ?? ''} maxLength={30} inputMode="numeric" className="font-mono" onChange={(e) => patchRow(c.id, { ipi: e.target.value })} />
              </div>
              <div className="flex gap-3 sm:col-span-3 sm:justify-end">
                <div>
                  <span id={`m-${c.id}`} className="mb-1 block text-xs font-semibold text-muted">Master %</span>
                  <PctInput value={c.masterPct} label={`Master percent for ${c.name || `collaborator ${i + 1}`}`} onChange={(n) => patchRow(c.id, { masterPct: n })} />
                </div>
                <div>
                  <span id={`p-${c.id}`} className="mb-1 block text-xs font-semibold text-muted">Publishing %</span>
                  <PctInput value={c.publishingPct} label={`Publishing percent for ${c.name || `collaborator ${i + 1}`}`} onChange={(n) => patchRow(c.id, { publishingPct: n })} />
                </div>
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <Button variant="ghost" size="icon" onClick={() => removeRow(c.id)} disabled={rows.length <= 1} aria-label={`Remove ${c.name || `collaborator ${i + 1}`}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Button className="mt-3" onClick={addRow} disabled={rows.length >= 50}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Add collaborator
      </Button>
      <p className="mt-2 text-xs text-muted">Engineers and mixers are usually paid a flat fee and get 0% unless everyone agrees otherwise.</p>

      <Card className="mt-8 p-4">
        <h2 className="text-lg font-bold">Share it</h2>
        {!canExport && (
          <ul className="mt-2 space-y-1 text-sm text-warn" aria-label="Fix these before exporting">
            {blockers.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {b}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" disabled={!canExport || pdfBusy} onClick={onPdf}>
            <FileDown className="h-4 w-4" aria-hidden="true" /> {pdfBusy ? 'Building PDF…' : 'Download PDF'}
          </Button>
          <Button disabled={!canExport} onClick={onCopy}>
            {copied === 'ok' ? <Check className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
            {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy Text Summary'}
          </Button>
        </div>
        <p className="mt-2 text-sm" role="status">
          {copied === 'ok' && <span className="text-good">Copied. Paste it into iMessage or WhatsApp.</span>}
          {copied === 'fail' && <span className="text-bad">Your browser blocked copying. Use Download PDF instead.</span>}
          {pdfError && <span className="text-bad">{pdfError}</span>}
        </p>
        <p className="mt-2 text-xs text-muted">A split sheet records what everyone agreed. It is not legal advice. Your draft is saved on this device only.</p>
      </Card>
    </section>
  );
}
