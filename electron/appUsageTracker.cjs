const {
  getForegroundAppNameSync,
  isForegroundDetectionSupported,
  toFriendlyProcessName,
} = require('./winForegroundApp.cjs')

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function createAppUsageTracker(options = {}) {
  const pollMs = Math.max(3000, Number(options.pollMs) || 5000)
  let intervalId = null
  let usageDate = todayDateString()
  const usageByApp = new Map()
  const firstUsedAtByApp = new Map()
  let lastAppName = null

  function resetIfNewDay() {
    const today = todayDateString()
    if (today !== usageDate) {
      usageDate = today
      usageByApp.clear()
      firstUsedAtByApp.clear()
      lastAppName = null
    }
  }

  function pollOnce() {
    resetIfNewDay()

    const appName = getForegroundAppNameSync()
    if (!appName) return

    const stepSec = Math.round(pollMs / 1000)
    if (!usageByApp.has(appName)) {
      firstUsedAtByApp.set(appName, Date.now())
    }
    usageByApp.set(appName, (usageByApp.get(appName) || 0) + stepSec)
    lastAppName = appName
  }

  function start() {
    if (intervalId != null) {
      return { ok: true, active: true, platform: process.platform, supported: isForegroundDetectionSupported() }
    }
    pollOnce()
    intervalId = setInterval(pollOnce, pollMs)
    return { ok: true, active: true, platform: process.platform, supported: isForegroundDetectionSupported() }
  }

  function stop() {
    if (intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
    return { ok: true, active: false, platform: process.platform, supported: isForegroundDetectionSupported() }
  }

  function getSnapshot() {
    resetIfNewDay()
    const entries = [...usageByApp.entries()]
      .map(([appName, durationSeconds]) => ({
        appName,
        durationSeconds: Math.max(0, Math.floor(durationSeconds)),
        firstUsedAtMs: firstUsedAtByApp.get(appName) ?? null,
      }))
      .filter((e) => e.durationSeconds > 0)
      .sort((a, b) => b.durationSeconds - a.durationSeconds)

    const totalSeconds = entries.reduce((sum, e) => sum + e.durationSeconds, 0)
    return {
      usageDate,
      totalSeconds,
      entries,
      platform: process.platform,
      tracking: intervalId != null,
      supported: isForegroundDetectionSupported(),
      lastAppName,
    }
  }

  function consumeForSync() {
    const snapshot = getSnapshot()
    usageByApp.clear()
    lastAppName = null
    return snapshot
  }

  return {
    start,
    stop,
    getSnapshot,
    consumeForSync,
    toFriendlyAppName: toFriendlyProcessName,
  }
}

module.exports = { createAppUsageTracker, toFriendlyAppName: toFriendlyProcessName }
