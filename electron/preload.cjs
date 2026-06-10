const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  /** Opens `url` in the system default browser (reliable in Electron). */
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  /** Returns `{ ok, base64?, error? }` — PNG of primary/largest screen. */
  captureWorkScreenshot: () => ipcRenderer.invoke('capture-work-screenshot'),
  /**
   * Subscribe to system-wide input counted in main (`globalInputTracker.cjs`).
   * @param {(payload: { type: 'click' | 'keypress' }) => void} callback
   * @returns {() => void} unsubscribe
   */
  subscribeGlobalInputActivity: (callback) => {
    if (typeof callback !== 'function') return () => {}
    const handler = (_event, payload) => {
      try {
        callback(payload)
      } catch {
        /* ignore renderer errors */
      }
    }
    ipcRenderer.on('global-input-activity', handler)
    return () => {
      ipcRenderer.removeListener('global-input-activity', handler)
    }
  },
  /** Whether `uiohook-napi` is available; `active` = hook currently running. */
  getGlobalInputTrackerStatus: () => ipcRenderer.invoke('global-input-tracker-status'),
  /** Start/stop system-wide input capture (use only while project timer is running). */
  setGlobalInputTracking: (enabled) =>
    ipcRenderer.invoke('set-global-input-tracking', { enabled: Boolean(enabled) }),
  getAppUsageTrackerStatus: () => ipcRenderer.invoke('app-usage-tracker-status'),
  setAppUsageTracking: (enabled) =>
    ipcRenderer.invoke('set-app-usage-tracking', { enabled: Boolean(enabled) }),
  getAppUsageSnapshot: () => ipcRenderer.invoke('app-usage-get-snapshot'),
  consumeAppUsageForSync: () => ipcRenderer.invoke('app-usage-consume-for-sync'),
  /** Sync native title bar + window chrome with app light/dark mode. */
  setWindowTheme: (mode) =>
    ipcRenderer.invoke('set-window-theme', { mode: mode === 'dark' ? 'dark' : 'light' }),
})
