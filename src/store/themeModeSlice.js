import { createSlice } from '@reduxjs/toolkit'
import { APP_COLOR_MODE } from '../theme/colorTokens'

const STORAGE_KEY = 'crm-desktop-theme-mode'

function readStoredMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === APP_COLOR_MODE.DARK || v === APP_COLOR_MODE.LIGHT) return v
  } catch {
    // ignore
  }
  return APP_COLOR_MODE.LIGHT
}

function persistMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // ignore
  }
}

const themeModeSlice = createSlice({
  name: 'themeMode',
  initialState: {
    mode: readStoredMode(),
  },
  reducers: {
    setThemeMode(state, action) {
      const next =
        action.payload === APP_COLOR_MODE.DARK
          ? APP_COLOR_MODE.DARK
          : APP_COLOR_MODE.LIGHT
      state.mode = next
      persistMode(next)
    },
    toggleThemeMode(state) {
      const next =
        state.mode === APP_COLOR_MODE.DARK
          ? APP_COLOR_MODE.LIGHT
          : APP_COLOR_MODE.DARK
      state.mode = next
      persistMode(next)
    },
  },
})

export const { setThemeMode, toggleThemeMode } = themeModeSlice.actions
export default themeModeSlice.reducer
