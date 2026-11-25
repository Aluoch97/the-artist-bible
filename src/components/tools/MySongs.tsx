import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import type { CatalogSong } from '../../types/bible';
import { BackToTools } from '../ui/BackToTools';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { CheckPill, Field, TextArea } from '../ui/Field';
import { ProgressBar } from '../ui/ProgressBar';
import { StepHeading } from '../ui/StepHeading';
import { ToolHeader } from '../ui/ToolHeader';

const CHECKS: { key: 'splits' | 'pro' | 'mlc' | 'soundexchange'; label: string }[] = [
  { key: 'splits', label: 'Splits signed' },
  { key: 'pro', label: 'PRO' },
  { key: 'mlc', label: 'The MLC' },
  { key: 'soundexchange', label: 'SoundExchange' },
];

const doneCount = (s: CatalogSong) => CHECKS.filter((c) => s[c.key]).length;

/** Per-song registration tracker: the money leaks song by song, so this is where to look. */
export function MySongs() {
  const { state, addSong, updateSong, deleteSong } = useLocalProgress();
  const songs = state.catalog;
  const [title, setTitle] = useState('');

  const complete = songs.filter((s) => doneCount(s) === CHECKS.length).length;
  const pct = songs.length ? (complete / songs.length) * 100 : 0;

  const add = () => {
    addSong({ title: title.trim() });
    setTitle('');
  };

  return (
    <section>
      <BackToTools />
      <ToolHeader
        title="My songs"
        description="Keep track of where each song is registered, so no money goes unclaimed. Saved on your device."
      />

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Field label="Add a song" placeholder="Song title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
        <Button type="submit" variant="primary" className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add
        </Button>
      </form>

      {songs.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-bold text-muted">{complete} of {songs.length} {songs.length === 1 ? 'song' : 'songs'} fully set up</p>
          <ProgressBar value={pct} label="Songs fully registered" />
        </div>
      )}

      {songs.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-5 text-[15px] text-muted">
          No songs yet. Add your first song above. For each one you can tick off the splits and the three places that pay you:
          your PRO, The MLC and SoundExchange. <Link to="/audit" className="font-semibold text-fg underline underline-offset-4">Not joined yet? Start with Get Paid.</Link>
        </p>
      ) : (
        <>
          <StepHeading title="Your songs" hint="Tick each box as you finish it." />
          <ul className="space-y-3">
            {songs.map((s) => {
              const n = doneCount(s);
              return (
                <li key={s.id}>
                  <Card className={n === CHECKS.length ? 'border-good/50 p-4' : 'p-4'}>
                    <div className="flex items-start gap-2">
                      <Field label="Title" value={s.title} maxLength={120} onChange={(e) => updateSong(s.id, { title: e.target.value })} className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-7 shrink-0"
                        aria-label={`Remove ${s.title.trim() || 'untitled song'}`}
                        onClick={() => { if (window.confirm(`Remove "${s.title.trim() || 'Untitled'}" from this device?`)) deleteSong(s.id); }}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </div>

                    <fieldset className="mt-3">
                      <legend className="mb-2 text-sm font-bold">Set up <span className="font-normal text-muted">({n} of {CHECKS.length})</span></legend>
                      <div className="flex flex-wrap gap-2">
                        {CHECKS.map((c) => (
                          <CheckPill key={c.key} checked={s[c.key]} onChange={(v) => updateSong(s.id, { [c.key]: v })}>{c.label}</CheckPill>
                        ))}
                      </div>
                    </fieldset>

                    <details className="mt-3">
                      <summary className="min-h-11 cursor-pointer py-2.5 text-[15px] font-bold text-accent">Codes and notes</summary>
                      <div className="grid grid-cols-1 gap-3 pb-1 sm:grid-cols-3">
                        <Field label="ISRC" value={s.isrc} maxLength={30} onChange={(e) => updateSong(s.id, { isrc: e.target.value })} />
                        <Field label="UPC" value={s.upc} maxLength={30} onChange={(e) => updateSong(s.id, { upc: e.target.value })} />
                        <Field label="ISWC" value={s.iswc} maxLength={30} onChange={(e) => updateSong(s.id, { iswc: e.target.value })} />
                      </div>
                      <TextArea label="Notes" value={s.notes} maxLength={500} className="mt-3" onChange={(e) => updateSong(s.id, { notes: e.target.value })} />
                    </details>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="mt-6 text-sm text-muted">
        Need a split sheet? <Link to="/split-sheet" className="font-semibold text-fg underline underline-offset-4">Make one</Link>, then tick &quot;Splits signed&quot; here.
      </p>
    </section>
  );
}
