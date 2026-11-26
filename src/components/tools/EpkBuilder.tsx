import { ClipboardCopy, FileDown } from 'lucide-react';
import { useState } from 'react';
import { useLocalProgress } from '../../hooks/useLocalProgress';
import { copyText } from '../../lib/clipboard';
import { downloadEpkPdf } from '../../lib/pdf';
import type { EpkDraft } from '../../types/bible';
import { BackToTools } from '../ui/BackToTools';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Field, TextArea } from '../ui/Field';
import { StepHeading } from '../ui/StepHeading';
import { ToolHeader } from '../ui/ToolHeader';

export function epkText(e: EpkDraft): string {
  const parts: string[] = [];
  parts.push(e.artistName.trim() || 'Artist name');
  const sub = [e.genre.trim(), e.location.trim()].filter(Boolean).join(' | ');
  if (sub) parts.push(sub);
  if (e.bio.trim()) parts.push('', e.bio.trim());
  const tracks = e.topTracks.split('\n').map((t) => t.trim()).filter(Boolean);
  if (tracks.length) parts.push('', 'Listen:', ...tracks.map((t) => `- ${t}`));
  const links = [['Website', e.website], ['Spotify', e.spotify], ['Instagram', e.instagram], ['Contact', e.email]].filter(([, v]) => v!.trim());
  if (links.length) parts.push('', ...links.map(([l, v]) => `${l}: ${v!.trim()}`));
  parts.push('', 'Made with The Artist Bible');
  return parts.join('\n');
}

export function pitchText(e: EpkDraft): string {
  const song = e.pitchSong.trim() || 'My new song';
  const what = [e.pitchMood.trim(), e.pitchGenre.trim()].filter(Boolean).join(' ');
  const lead = what ? `"${song}" is a ${what} song.` : `"${song}" is my new release.`;
  return [lead, e.pitchStory.trim(), e.pitchPlan.trim()].filter(Boolean).join(' ');
}

/** Press kit builder plus a short pitch writer for playlist submissions. */
export function EpkBuilder() {
  const { state, updateEpk } = useLocalProgress();
  const e = state.epk;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState<'' | 'kit' | 'pitch'>('');
  const set = (k: keyof EpkDraft) => (ev: { target: { value: string } }) => updateEpk({ [k]: ev.target.value });
  const pitch = pitchText(e);

  const copy = async (which: 'kit' | 'pitch') => {
    const ok = await copyText(which === 'kit' ? epkText(e) : pitch);
    setCopied(ok ? which : '');
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <section>
      <BackToTools />
      <ToolHeader title="Press kit and pitch" description="Fill it in once, then send it to bookers, bloggers and playlist curators. Saved on your device." />

      <StepHeading n={1} title="Your press kit" hint="A one-page summary people can read in a minute." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Artist name" value={e.artistName} maxLength={120} onChange={set('artistName')} />
        <Field label="Genre" value={e.genre} maxLength={120} onChange={set('genre')} />
        <Field label="Where you're from" value={e.location} maxLength={120} onChange={set('location')} className="sm:col-span-2" />
        <TextArea label="Short bio" hint="Three or four sentences. Who you are and what you sound like." value={e.bio} maxLength={2000} onChange={set('bio')} className="sm:col-span-2" />
        <TextArea label="Best songs" hint="One per line. Add a link after the title if you like." value={e.topTracks} maxLength={2000} onChange={set('topTracks')} className="sm:col-span-2" />
        <Field label="Website" value={e.website} maxLength={300} onChange={set('website')} />
        <Field label="Spotify link" value={e.spotify} maxLength={300} onChange={set('spotify')} />
        <Field label="Instagram" value={e.instagram} maxLength={300} onChange={set('instagram')} />
        <Field label="Contact email" type="email" value={e.email} maxLength={300} onChange={set('email')} hint="Stays on your device. It only appears if you download or copy the kit." />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setErr('');
            try {
              await downloadEpkPdf(e);
            } catch {
              setErr('Could not make the PDF on this device. Try Copy as text instead.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <FileDown className="h-4 w-4" aria-hidden="true" /> {busy ? 'Making PDF…' : 'Download PDF'}
        </Button>
        <Button onClick={() => copy('kit')}>
          <ClipboardCopy className="h-4 w-4" aria-hidden="true" /> {copied === 'kit' ? 'Copied' : 'Copy as text'}
        </Button>
      </div>
      {err && <p className="mt-2 text-sm text-bad" role="alert">{err}</p>}

      <StepHeading n={2} title="Playlist pitch" hint="Short and specific works best. Pitch one focus song per release." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Song title" value={e.pitchSong} maxLength={120} onChange={set('pitchSong')} />
        <Field label="Genre" value={e.pitchGenre} maxLength={120} onChange={set('pitchGenre')} />
        <Field label="Mood" placeholder="e.g. late-night, upbeat" value={e.pitchMood} maxLength={120} onChange={set('pitchMood')} />
        <TextArea label="What's it about?" value={e.pitchStory} maxLength={2000} onChange={set('pitchStory')} className="sm:col-span-3" />
        <TextArea label="How are you promoting it?" hint="For example: pre-save campaign, video, shows." value={e.pitchPlan} maxLength={2000} onChange={set('pitchPlan')} className="sm:col-span-3" />
      </div>
      <Card className="mt-4 p-4" aria-live="polite">
        <p className="text-sm font-bold text-muted">Your pitch <span className="font-normal">({pitch.length} characters)</span></p>
        <p className="mt-1 whitespace-pre-wrap text-[0.9375rem]">{pitch}</p>
        <Button className="mt-3" size="sm" onClick={() => copy('pitch')}>
          <ClipboardCopy className="h-4 w-4" aria-hidden="true" /> {copied === 'pitch' ? 'Copied' : 'Copy pitch'}
        </Button>
      </Card>
      <p className="mt-3 text-sm text-muted">Check the submission form for its current length limit. Streaming platforms can change it.</p>
    </section>
  );
}
