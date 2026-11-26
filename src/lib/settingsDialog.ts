import { useSyncExternalStore } from 'react';

/** Whether the Settings dialog is open. A tiny shared switch so the header button and the About page can both open it. */
let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openSettings(): void {
  open = true;
  emit();
}
export function closeSettings(): void {
  open = false;
  emit();
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useSettingsOpen = () => useSyncExternalStore(subscribe, () => open, () => open);
