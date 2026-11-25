import { useEffect } from 'react';
import { industryData } from '../data';

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export const SITE_NAME = 'The Artist Bible';

/** Keeps the tab title, description, canonical URL and share tags correct for the current screen. */
export function usePageMeta(title: string | null, description: string, path: string, noindex = false): void {
  useEffect(() => {
    const full = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME}: free tools & guides for independent artists`;
    document.title = full;
    const url = `${industryData.site.url}${path === '/' ? '/' : path}`;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', full);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'robots', noindex ? 'noindex' : 'index, follow');

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, path, noindex]);
}
