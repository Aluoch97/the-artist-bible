import { useSyncExternalStore } from 'react';
import { readUi, writeUi } from '../lib/uiPrefs';

export type TextSize = 'small' | 'normal' | 'large' | 'xlarge';

export interface DisplayPrefs {
  text: TextSize;
  motion: 'system' | 'reduce';
  contrast: 'normal' | 'high';
  links: 'normal' | 'underline';
  plain: boolean;
}

export const DISPLAY_DEFAULTS: DisplayPrefs = { text: 'normal', motion: 'system', contrast: 'normal', links: 'normal', plain: false };

const TEXT: TextSize[] = ['small', 'normal', 'large', 'xlarge'];

function load(): DisplayPrefs {
  const u = readUi();
  return {
    text: u.text && TEXT.includes(u.text) ? u.text : 'normal',
    motion: u.motion === 'reduce' ? 'reduce' : 'system',
    contrast: u.contrast === 'high' ? 'high' : 'normal',
    links: u.links === 'underline' ? 'underline' : 'normal',
    plain: u.plain === true,
  };
}

let prefs = load();
const listeners = new Set<() => void>();

/** Puts the choices on <html> as data attributes; the stylesheet does the rest (public/theme-init.js does the same before first paint). */
function apply(): void {
  const el = document.documentElement;
  const set = (name: string, value: string | null) => (value ? el.setAttribute(name, value) : el.removeAttribute(name));
  set('data-text', prefs.text === 'normal' ? null : prefs.text);
  set('data-motion', prefs.motion === 'reduce' ? 'reduce' : null);
  set('data-contrast', prefs.contrast === 'high' ? 'high' : null);
  set('data-links', prefs.links === 'underline' ? 'underline' : null);
  set('data-plain', prefs.plain ? 'on' : null);
  listeners.forEach((l) => l());
}

function update(patch: Partial<DisplayPrefs>): void {
  prefs = { ...prefs, ...patch };
  writeUi(prefs);
  apply();
}

function reset(): void {
  prefs = { ...DISPLAY_DEFAULTS };
  writeUi(prefs);
  apply();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => prefs;

/** True when the device itself asks for less motion (then the in-app switch is already on). */
export const deviceReducesMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useDisplayPrefs() {
  const p = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { prefs: p, update, reset };
}

// Make sure the page matches the saved choices as soon as this module loads.
if (typeof document !== 'undefined') apply();
