import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { applyAppColorCssVars } from '../theme/applyCssVars'
import { createAppTheme } from '../theme/createAppTheme'

export default function AppThemeProvider({ children }) {
  const mode = useSelector((s) => s.themeMode.mode)
  const theme = useMemo(() => createAppTheme(mode), [mode])

  useEffect(() => {
    applyAppColorCssVars(mode)
    window.electronAPI?.setWindowTheme?.(mode)
  }, [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
