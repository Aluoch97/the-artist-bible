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
  '/guides': { title: 'Learn the business', description: 'Five short, plain-English guides for independent artists: rights, distribution, royalties and rollout.' },
  '/red-flags': { title: 'Red flag decoder', description: 'Contract traps and scams in plain English: 360 deals, perpetual ownership, pay-for-play playlisting and hidden fees.' },
  '/about': { title: 'About, privacy & terms', description: 'What The Artist Bible stores, what it does not collect, and the terms for using it.' },
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
