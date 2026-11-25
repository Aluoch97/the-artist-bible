import { useEffect, useState } from 'react';

const UI_KEY = 'artist_bible_ui_v1'; // interface preferences only; your work lives in artist_bible_v1

function readUi(): { installTipDismissed?: boolean } {
  try {
    return JSON.parse(window.localStorage.getItem(UI_KEY) ?? '{}') as { installTipDismissed?: boolean };
  } catch {
    return {};
  }
}

export interface InstallContext {
  /** iPhone/iPad in a normal browser tab: the only place people need written Add to Home Screen steps. */
  showIosTip: boolean;
  dismissIosTip: () => void;
}

export function useInstallContext(): InstallContext {
  const [state, setState] = useState({ ios: false, standalone: false, dismissed: true });

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    setState({ ios, standalone, dismissed: Boolean(readUi().installTipDismissed) });
  }, []);

  return {
    showIosTip: state.ios && !state.standalone && !state.dismissed,
    dismissIosTip: () => {
      try {
        window.localStorage.setItem(UI_KEY, JSON.stringify({ ...readUi(), installTipDismissed: true }));
      } catch {
        /* storage unavailable: just hide it for this visit */
      }
      setState((s) => ({ ...s, dismissed: true }));
    },
  };
}
