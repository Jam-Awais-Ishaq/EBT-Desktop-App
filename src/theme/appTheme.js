/**
 * @deprecated Use {@link createAppTheme} with Redux `themeMode.mode` via {@link AppThemeProvider}.
 * Kept as a stable default for tests or scripts.
 */
import { APP_COLOR_MODE } from './colorTokens'
import { createAppTheme } from './createAppTheme'

export const appTheme = createAppTheme(APP_COLOR_MODE.LIGHT)
