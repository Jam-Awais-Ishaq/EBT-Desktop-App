import { useEffect, useRef } from 'react'
import { syncAppUsage } from '../../apiImportsFunctions/apiAppUsage'

const SYNC_INTERVAL_MS = 60_000

function getElectronAppUsageApi() {
  if (typeof window === 'undefined') return null
  return window.electronAPI ?? null
}

async function pushLocalUsageToServer() {
  const api = getElectronAppUsageApi()
  if (!api?.getAppUsageSnapshot || !api?.consumeAppUsageForSync) return

  const local = await api.getAppUsageSnapshot()
  if (!local?.ok || !Array.isArray(local.entries) || local.entries.length === 0) return

  await syncAppUsage({
    usageDate: local.usageDate,
    entries: local.entries,
  })

  await api.consumeAppUsageForSync()
}

/** Tracks foreground apps only while `enabled` (project timer running). */
export default function AppUsageTrackerWorker({ enabled = false }) {
  const syncingRef = useRef(false)

  useEffect(() => {
    const electronApi = getElectronAppUsageApi()
    if (!electronApi?.setAppUsageTracking) return undefined

    let cancelled = false
    let intervalId = null

    const runSync = async () => {
      if (syncingRef.current || cancelled) return
      syncingRef.current = true
      try {
        await pushLocalUsageToServer()
      } catch (err) {
        console.warn('[app-usage] sync failed:', err?.message || err)
      } finally {
        syncingRef.current = false
      }
    }

    const stopTracking = () => {
      void electronApi.setAppUsageTracking(false)
      void runSync()
    }

    if (!enabled) {
      stopTracking()
      return () => {
        cancelled = true
      }
    }

    void electronApi.setAppUsageTracking(true)
    void runSync()
    intervalId = window.setInterval(() => {
      void runSync()
    }, SYNC_INTERVAL_MS)

    return () => {
      cancelled = true
      if (intervalId != null) window.clearInterval(intervalId)
      stopTracking()
    }
  }, [enabled])

  return null
}
