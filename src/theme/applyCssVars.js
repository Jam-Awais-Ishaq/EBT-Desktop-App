import {
  APP_COLOR_MODE,
  APP_CSS_VAR_NAMES,
  getAppColors,
} from './colorTokens'

/**
 * Pushes token values onto `document.documentElement` as CSS variables
 * so plain CSS / Tailwind arbitrary values can use var(--app-*).
 */
export function applyAppColorCssVars(mode) {
  if (typeof document === 'undefined') return
  const c = getAppColors(mode)
  const root = document.documentElement
  root.dataset.theme = mode === APP_COLOR_MODE.DARK ? 'dark' : 'light'

  const map = [
    [APP_CSS_VAR_NAMES.bgDefault, c.backgroundDefault],
    [APP_CSS_VAR_NAMES.bgPaper, c.backgroundPaper],
    [APP_CSS_VAR_NAMES.bgElevated, c.backgroundElevated],
    [APP_CSS_VAR_NAMES.textPrimary, c.textPrimary],
    [APP_CSS_VAR_NAMES.textSecondary, c.textSecondary],
    [APP_CSS_VAR_NAMES.textMuted, c.textMuted],
    [APP_CSS_VAR_NAMES.brandOrange, c.brandOrange],
    [APP_CSS_VAR_NAMES.brandOrangeDark, c.brandOrangeDark],
    [APP_CSS_VAR_NAMES.brandOrangeLight, c.brandOrangeLight],
    [APP_CSS_VAR_NAMES.divider, c.divider],
    [APP_CSS_VAR_NAMES.borderSubtle, c.borderSubtle],
  ]

  for (const [name, value] of map) {
    root.style.setProperty(name, value)
  }
}
