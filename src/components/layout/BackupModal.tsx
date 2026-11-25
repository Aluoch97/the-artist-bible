import { AlertCircle, CheckCircle2, Download, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import type { ArtistBibleState } from '../../types/bible';
import { Button } from '../ui/button';

type Status = { kind: 'idle' } | { kind: 'error'; message: string } | { kind: 'ready'; file: File; state: ArtistBibleState } | { kind: 'done'; message: string };

function describe(s: ArtistBibleState): string {
  const parts = [
    `${s.completedAuditIds.length} royalty step${s.completedAuditIds.length === 1 ? '' : 's'} done`,
    s.activeRelease ? `release "${s.activeRelease.title || 'Untitled'}" (${s.activeRelease.releaseDate})` : 'no active release',
    `split sheet with ${s.splitSheetDraft.collaborators.length} collaborator${s.splitSheetDraft.collaborators.length === 1 ? '' : 's'}`,
  ];
  return parts.join(' · ');
}

export function BackupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { exportBackupJson, parseBackupFile, importBackupJson, resetAll, storageOk } = useLocalProgress();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      setStatus({ kind: 'idle' });
      setConfirmReset(false);
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const result = await parseBackupFile(file);
    setStatus(result.ok ? { kind: 'ready', file, state: result.state } : { kind: 'error', message: result.error });
    if (fileRef.current) fileRef.current.value = '';
  }

  async function confirmImport() {
    if (status.kind !== 'ready') return;
    const result = await importBackupJson(status.file);
    setStatus(result.ok ? { kind: 'done', message: 'Backup restored.' } : { kind: 'error', message: result.error });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="backup-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-border bg-surface p-0 text-fg backdrop:bg-black/75"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="backup-title" className="font-display text-2xl font-bold">Backup &amp; restore</h2>
            <p className="mt-1 text-[15px] text-muted">Everything you enter lives only on this device. Save a file to keep a copy or move to a new phone.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-4 w-4" aria-hidden="true" /></Button>
        </div>

        {!storageOk && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Your browser is blocking storage (private mode?). Progress will be lost when you close this tab. Export a backup before you leave.
          </p>
        )}

        <div className="mt-5 space-y-5">
          <div>
            <h3 className="mb-2 font-bold">Save a backup</h3>
            <Button variant="primary" onClick={() => exportBackupJson()}><Download className="h-4 w-4" aria-hidden="true" /> Download backup (.json)</Button>
          </div>

          <div>
            <h3 className="mb-2 font-bold">Restore from a backup</h3>
            <input ref={fileRef} id="backup-file" type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
            <Button onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" /> Choose backup file</Button>

            <div role="status" className="mt-3 text-sm">
              {status.kind === 'error' && (
                <p className="flex items-start gap-2 text-bad"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {status.message}</p>
              )}
              {status.kind === 'done' && (
                <p className="flex items-start gap-2 text-accent"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {status.message}</p>
              )}
              {status.kind === 'ready' && (
                <div className="rounded-xl border border-border bg-bg p-3">
                  <p className="text-muted">Found: {describe(status.state)}.</p>
                  <p className="mt-1 font-semibold text-warn">Restoring replaces what is saved on this device now.</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="primary" size="sm" onClick={confirmImport}>Replace my data</Button>
                    <Button size="sm" onClick={() => setStatus({ kind: 'idle' })}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="mb-2 font-bold">Start fresh</h3>
            {confirmReset ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-warn">Erase everything on this device?</span>
                <Button variant="danger" size="sm" onClick={() => { resetAll(); setConfirmReset(false); setStatus({ kind: 'done', message: 'All local data cleared.' }); }}>Yes, erase</Button>
                <Button size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}><Trash2 className="h-4 w-4" aria-hidden="true" /> Erase local data</Button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
