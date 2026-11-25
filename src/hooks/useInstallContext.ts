import { useEffect, useState } from 'react';
import { readUi, writeUi } from '../lib/uiPrefs';

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
      writeUi({ installTipDismissed: true });
      setState((s) => ({ ...s, dismissed: true }));
    },
  };
}
