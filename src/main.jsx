import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.jsx'
import AppThemeProvider from './components/AppThemeProvider.jsx'
import './index.css'
import { store } from './store/store'
import { applyAppColorCssVars } from './theme/applyCssVars'
import { APP_COLOR_MODE } from './theme/colorTokens'

function readInitialThemeMode() {
  try {
    const v = localStorage.getItem('crm-desktop-theme-mode')
    if (v === APP_COLOR_MODE.DARK || v === APP_COLOR_MODE.LIGHT) return v
  } catch {
    // ignore
  }
  return APP_COLOR_MODE.LIGHT
}

applyAppColorCssVars(readInitialThemeMode())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </Provider>
  </StrictMode>,
)
