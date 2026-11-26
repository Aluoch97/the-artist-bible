import { ClipboardCopy, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { industryData } from '../../data';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { copyText } from '../../lib/clipboard';
import { formatISOForDisplay } from '../../lib/dates';
import type { LiveShow } from '../../types/bible';
import { BackToTools } from '../ui/BackToTools';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { DateInput } from '../ui/DateInput';
import { CheckPill, Field } from '../ui/Field';
import { ExternalLink } from '../ui/ExternalLink';
import { ToolHeader } from '../ui/ToolHeader';

const bmiLive = industryData.resources.find((r) => r.id === 'bmi_live')?.url;
const ascapUrl = industryData.royaltyEntities.find((e) => e.id === 'pro_ascap_bmi')?.secondaryUrl;

export function showText(s: LiveShow): string {
  const place = [s.venue.trim(), s.city.trim()].filter(Boolean).join(', ') || 'Venue not set';
  const songs = s.songs.length ? s.songs.map((t, i) => `${i + 1}. ${t}`).join('\n') : '(no songs added)';
  return `Show: ${place}\nDate: ${formatISOForDisplay(s.date)}\nSongs played:\n${songs}\n\nGenerated via The Artist Bible`;
}

function ShowCard({ show }: { show: LiveShow }) {
  const { state, updateShow, deleteShow } = useLocalProgress();
  const [custom, setCustom] = useState('');
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const catalogTitles = state.catalog.map((s) => s.title.trim()).filter((t) => t && !show.songs.includes(t));

  const addSongTitle = (t: string) => {
    const v = t.trim();
    if (v && !show.songs.includes(v)) updateShow(show.id, { songs: [...show.songs, v] });
  };

  return (
    <Card className={show.reported ? 'border-good/50 p-4' : 'p-4'}>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-bold" htmlFor={`d-${show.id}`}>Date</label>
          <DateInput id={`d-${show.id}`} value={show.date} onChange={(e) => e.target.value && updateShow(show.id, { date: e.target.value })} />
        </div>
        <Field label="City" value={show.city} maxLength={120} onChange={(e) => updateShow(show.id, { city: e.target.value })} />
        <Field label="Venue" value={show.venue} maxLength={120} onChange={(e) => updateShow(show.id, { venue: e.target.value })} className="col-span-2" />
      </div>

      <p className="mb-2 mt-4 text-sm font-bold">Songs played</p>
      {show.songs.length > 0 && (
        <ol className="mb-3 space-y-1.5">
          {show.songs.map((t, i) => (
            <li key={t} className="flex items-center justify-between gap-2 rounded-xl bg-bg/40 py-0.5 pl-3 text-[0.9375rem]">
              <span className="min-w-0"><span className="mr-2 tabular-nums text-muted">{i + 1}.</span>{t}</span>
              <Button variant="ghost" size="icon" aria-label={`Remove ${t}`} onClick={() => updateShow(show.id, { songs: show.songs.filter((x) => x !== t) })}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ol>
      )}

      {catalogTitles.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs text-muted">Tap to add from My songs</p>
          <div className="flex flex-wrap gap-2">
            {catalogTitles.slice(0, 20).map((t) => (
              <button key={t} type="button" onClick={() => addSongTitle(t)} className="min-h-11 cursor-pointer rounded-full border border-border bg-surface-2 px-4 text-sm font-bold hover:border-accent">
                <Plus className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />{t}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); addSongTitle(custom); setCustom(''); }}>
        <Field label="Add another song" placeholder="Song title" value={custom} maxLength={120} onChange={(e) => setCustom(e.target.value)} className="flex-1" />
        <Button type="submit" className="shrink-0">Add</Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CheckPill checked={show.reported} onChange={(v) => updateShow(show.id, { reported: v })}>Reported to my PRO</CheckPill>
        <Button
          size="sm"
          onClick={async () => { setCopied((await copyText(showText(show))) ? 'ok' : 'fail'); setTimeout(() => setCopied('idle'), 2000); }}
        >
          <ClipboardCopy className="h-4 w-4" aria-hidden="true" /> {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy setlist'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Remove this show"
          onClick={() => { if (window.confirm('Remove this show from this device?')) deleteShow(show.id); }}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
        </Button>
      </div>
    </Card>
  );
}

/** Log shows and copy the setlist for BMI Live or ASCAP OnStage. */
export function ShowLog() {
  const { state, addShow } = useLocalProgress();
  const shows = [...state.shows].sort((a, b) => b.date.localeCompare(a.date));
  const waiting = shows.filter((s) => !s.reported && s.songs.length > 0).length;

  return (
    <section>
      <BackToTools />
      <ToolHeader
        title="Live show log"
        description="Write down each show and the songs you played, then copy the setlist to report it. Live shows are usually only paid if you report them."
      />

      <div className="mb-5 rounded-2xl border border-border bg-surface p-4 text-[0.9375rem]">
        <p>
          Report on {bmiLive ? <ExternalLink href={bmiLive}>BMI Live</ExternalLink> : 'BMI Live'} (BMI members) or ASCAP OnStage
          {ascapUrl ? <> through Member Access on <ExternalLink href={ascapUrl}>ascap.com</ExternalLink></> : ''}. The songs have to be registered first, and there is a time limit, so report soon after the show.
        </p>
      </div>

      <Button variant="primary" onClick={() => addShow()}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Add a show
      </Button>
      {waiting > 0 && <p className="mt-3 text-sm font-semibold text-gold" role="status">{waiting} {waiting === 1 ? 'show' : 'shows'} not reported yet.</p>}

      {shows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-[0.9375rem] text-muted">No shows yet. Add one after your next gig, while you still remember the setlist.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {shows.map((s) => (
            <li key={s.id}><ShowCard show={s} /></li>
          ))}
        </ul>
      )}
    </section>
  );
}
