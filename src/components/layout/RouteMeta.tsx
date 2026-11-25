import { useLocation } from 'react-router-dom';
import { getChapter } from '../../content';
import { usePageMeta } from '../../hooks/usePageMeta';

interface Meta {
  title: string | null;
  description: string;
}

const STATIC: Record<string, Meta> = {
  '/': { title: null, description: 'Free, ad-free, no-login guides and studio tools for independent recording artists: release planner, royalty setup, split sheets and a red-flag contract decoder. Works offline.' },
  '/release': { title: 'Plan your release', description: 'Pick your release day and get a dated, step-by-step checklist, plus a link you can text to your team.' },
  '/audit': { title: 'Get paid what you are owed', description: 'A checklist of the four free sign-ups that collect your music royalties: PRO, The MLC, SoundExchange and artist profiles.' },
  '/split-sheet': { title: 'Split sheet builder', description: 'Agree who owns what before you leave the studio. Split the recording and the song, then download a PDF or copy a text summary.' },
  '/guides': { title: 'Guides', description: 'Seven short, plain-English guides for independent artists: getting started, rights, distribution, royalties, working outside the U.S. and rollout.' },
  '/red-flags': { title: 'Red flags', description: 'Contract traps and scams in plain English: 360 deals, perpetual ownership, pay-for-play playlisting and hidden fees.' },
  '/contract': { title: 'Contract check', description: 'Add a contract and see which parts to worry about. Read on your device; optional AI review in plain English.' },
  '/words': { title: 'Music words', description: 'Plain-English meanings for PRO, IPI, ISRC, DSP, recoupment and every other word you will meet in the music business.' },
  '/tools': { title: 'Tools', description: 'Free tools for independent artists: split sheet builder, streaming earnings estimate, contract check and distributor cost compare. All run on your device.' },
  '/streams': { title: 'Streaming earnings estimate', description: 'Type in your stream counts and see a rough range of what they pay on Spotify, Apple Music, Amazon Music, YouTube Music and Tidal. Free, private, on your device.' },
  '/songs': { title: 'My songs', description: 'Keep track of where each of your songs is registered: splits, your PRO, The MLC and SoundExchange. Saved on your device.' },
  '/shows': { title: 'Live show log', description: 'Log your shows and copy the setlist to report for live performance royalties through BMI Live or ASCAP OnStage.' },
  '/epk': { title: 'Press kit and pitch', description: 'Build a one-page press kit PDF and write a short playlist pitch. Saved on your device.' },
  '/budget': { title: 'Release budget', description: 'Add up what a release costs and see roughly how many streams it takes to earn it back.' },
  '/about': { title: 'About', description: 'What The Artist Bible is, who it is for, how to install it on your phone, and how to reach us.' },
  '/privacy': { title: 'Privacy policy', description: 'What The Artist Bible stores on your device, what it never collects, and the one optional feature that sends text away.' },
  '/terms': { title: 'Terms of use', description: 'The ground rules for using The Artist Bible: educational information only, AI can be wrong, and who created it.' },
};

/** Sets the title, description and canonical link for whichever screen is showing. */
export function RouteMeta() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, '') || '/';
  const chapter = path.startsWith('/guides/') ? getChapter(path.slice('/guides/'.length)) : undefined;
  const known = STATIC[path] ?? (chapter ? { title: chapter.title, description: chapter.summary } : null);

  usePageMeta(
    known ? known.title : 'Page not found',
    known ? known.description : 'That page does not exist.',
    known ? path : '/',
    !known,
  );
  return null;
}
