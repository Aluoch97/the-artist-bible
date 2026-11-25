import { useSyncExternalStore } from 'react';
import { readUi, writeUi } from '../lib/uiPrefs';

export type ThemePref = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const META_COLOR: Record<Theme, string> = { dark: '#17100c', light: '#fdeadb' };
const query = () => window.matchMedia('(prefers-color-scheme: dark)');

let pref: ThemePref = ((): ThemePref => {
  const t = readUi().theme;
  return t === 'light' || t === 'dark' ? t : 'system';
})();
const listeners = new Set<() => void>();

const effective = (): Theme => (pref === 'system' ? (query().matches ? 'dark' : 'light') : pref);

function apply(): void {
  const t = effective();
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[t]);
  listeners.forEach((l) => l());
}

function setPref(next: ThemePref): void {
  pref = next;
  writeUi({ theme: next });
  apply();
}

let watching = false;
function subscribe(l: () => void): () => void {
  listeners.add(l);
  if (!watching) {
    watching = true;
    // Follow the device when it switches (e.g. at sunset) unless the person chose a theme.
    query().addEventListener('change', () => pref === 'system' && apply());
  }
  return () => listeners.delete(l);
}

const getPref = () => pref;
const getEffective = () => effective();

export function useTheme() {
  const p = useSyncExternalStore(subscribe, getPref, getPref);
  const theme = useSyncExternalStore(subscribe, getEffective, getEffective);
  return {
    pref: p,
    theme,
    setPref,
    /** Quick switch from the header: pick the opposite of what is showing now. */
    toggle: () => setPref(theme === 'dark' ? 'light' : 'dark'),
  };
}
