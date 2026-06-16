/**
 * Global app color scheme — single source of truth.
 *
 * Light: simple white / grey — neutral text, #EE651A brand on CTAs only.
 * Dark: soft charcoal — all UI text white; accents grey/white only (no yellow/orange text).
 */

/** Brand accent (light mode buttons / links) */
export const BRAND_ORANGE_HEX = '#EE651A'
/** EBT navy — headers, login panel */
export const BRAND_NAVY_HEX = '#1E3A5F'

export const APP_COLOR_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
}

/** Light: clean minimal — white/grey, dark text, orange only as brand accent */
export const LIGHT_APP_COLORS = {
  backgroundDefault: '#f5f5f5',
  backgroundPaper: '#ffffff',
  backgroundElevated: '#fafafa',
  textPrimary: '#171717',
  textSecondary: '#525252',
  textMuted: '#737373',
  brandOrange: BRAND_ORANGE_HEX,
  brandOrangeDark: '#C45212',
  brandOrangeLight: '#F97316',
  brandOrangeSoftBg: 'rgba(238, 101, 26, 0.08)',
  brandOrangeSoftBorder: 'rgba(238, 101, 26, 0.2)',
  borderSubtle: 'rgba(0, 0, 0, 0.1)',
  divider: '#e5e5e5',
  focusRing: 'rgba(238, 101, 26, 0.28)',
  loginGradientTop: '#f8fafc',
  loginGradientMid: '#eef2f7',
  loginGradientDeep: '#e8edf4',
  loginRadial: 'rgba(30, 58, 95, 0.06)',
  loginPanelNavy: BRAND_NAVY_HEX,
  successMuted: 'rgba(22, 163, 74, 0.1)',
  successBorder: 'rgba(22, 163, 74, 0.28)',
  successText: '#166534',
  avatarBg: BRAND_ORANGE_HEX,
  timerShell: '#ffffff',
  timerShellBorder: '#e5e5e5',
  timerHeaderBg: '#fafafa',
  timerDisplayBg: '#171717',
  timerDigit: '#fef08a',
  timerDigitIdle: '#a3a3a3',
  timerLabel: '#404040',
  timerLiveBg: BRAND_ORANGE_HEX,
  timerLiveText: '#ffffff',
  timerStartBg: BRAND_ORANGE_HEX,
  timerStartText: '#ffffff',
  timerStartBorder: '#C45212',
  timerStartHover: '#C45212',
  timerStopBorder: '#f87171',
  timerStopText: '#fecaca',
  timerStopBg: 'rgba(127, 29, 29, 0.2)',
}

/** Dark mode main text — white */
export const DARK_TEXT_HEX = '#ffffff'

/** Dark: monochrome — white text, white/grey chrome (no yellow/orange in UI) */
export const DARK_APP_COLORS = {
  backgroundDefault: '#252528',
  backgroundPaper: '#2e2e32',
  backgroundElevated: '#38383c',
  textPrimary: DARK_TEXT_HEX,
  textSecondary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  brandOrange: '#ffffff',
  brandOrangeDark: '#e5e5e5',
  brandOrangeLight: '#ffffff',
  brandOrangeSoftBg: 'rgba(255, 255, 255, 0.08)',
  brandOrangeSoftBorder: 'rgba(255, 255, 255, 0.2)',
  borderSubtle: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.14)',
  focusRing: 'rgba(255, 255, 255, 0.28)',
  loginGradientTop: '#323236',
  loginGradientMid: '#2a2a2e',
  loginGradientDeep: '#242428',
  loginRadial: 'rgba(255, 255, 255, 0.04)',
  loginPanelNavy: '#2a3f5c',
  successMuted: 'rgba(255, 255, 255, 0.08)',
  successBorder: 'rgba(255, 255, 255, 0.18)',
  successText: '#ffffff',
  avatarBg: '#ffffff',
  timerShell: '#2e2e32',
  timerShellBorder: 'rgba(255, 255, 255, 0.18)',
  timerHeaderBg: '#323236',
  timerDisplayBg: '#1e1f22',
  timerDigit: DARK_TEXT_HEX,
  timerDigitIdle: 'rgba(255, 255, 255, 0.45)',
  timerLabel: DARK_TEXT_HEX,
  timerLiveBg: '#ffffff',
  timerLiveText: '#1a1a1a',
  timerStartBg: '#ffffff',
  timerStartText: '#1a1a1a',
  timerStartBorder: '#d4d4d4',
  timerStartHover: '#e5e5e5',
  timerStopBorder: 'rgba(255, 255, 255, 0.45)',
  timerStopText: '#ffffff',
  timerStopBg: 'rgba(255, 255, 255, 0.08)',
}

/** CSS custom property names (values applied in applyCssVars.js) */
export const APP_CSS_VAR_NAMES = {
  bgDefault: '--app-bg-default',
  bgPaper: '--app-bg-paper',
  bgElevated: '--app-bg-elevated',
  textPrimary: '--app-text-primary',
  textSecondary: '--app-text-secondary',
  textMuted: '--app-text-muted',
  brandOrange: '--app-brand-orange',
  brandOrangeDark: '--app-brand-orange-dark',
  brandOrangeLight: '--app-brand-orange-light',
  divider: '--app-divider',
  borderSubtle: '--app-border-subtle',
}

export function getAppColors(mode) {
  return mode === APP_COLOR_MODE.DARK ? DARK_APP_COLORS : LIGHT_APP_COLORS
}
