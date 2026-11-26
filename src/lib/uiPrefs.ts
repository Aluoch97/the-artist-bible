/** Interface preferences only (theme, dismissed tips). Your work lives in artist_bible_v1, never here. */
export const UI_KEY = 'artist_bible_ui_v1';

export interface UiPrefs {
  installTipDismissed?: boolean;
  theme?: 'system' | 'light' | 'dark';
  /** Display settings (see the Settings dialog). Missing means the default. */
  text?: 'small' | 'normal' | 'large' | 'xlarge';
  motion?: 'system' | 'reduce';
  contrast?: 'normal' | 'high';
  links?: 'normal' | 'underline';
  plain?: boolean;
}

export function readUi(): UiPrefs {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(UI_KEY) ?? '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as UiPrefs) : {};
  } catch {
    return {};
  }
}

export function writeUi(patch: UiPrefs): void {
  try {
    window.localStorage.setItem(UI_KEY, JSON.stringify({ ...readUi(), ...patch }));
  } catch {
    /* storage unavailable: the choice just lasts for this visit */
  }
}
