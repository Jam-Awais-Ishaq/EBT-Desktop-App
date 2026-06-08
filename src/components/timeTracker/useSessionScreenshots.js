import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

import { postTimerScreenshot } from '../../apiImportsFunctions/apiAuth'
import { workScreenshotRecorded } from '../../store/loginFormSlice'

/** Testing: fixed 10s between captures (restore Upwork-style random multi-minute delays for production). */
const FIRST_CAPTURE_MS = 1 * 60 * 1000
const NEXT_CAPTURE_MS = 1 * 60 * 1000

function base64ToPngBlob(b64) {
  const bin = atob(b64)
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) u8[i] = bin.charCodeAt(i)
  return new Blob([u8], { type: 'image/png' })
}

/**
 * While the task timer is running (Electron), capture the screen periodically and upload.
 * Browser-only dev: no-op (no electronAPI.captureWorkScreenshot).
 */
export function useSessionScreenshots({ enabled, sessionId }) {
  const dispatch = useDispatch()
  const busy = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!enabled || sessionId == null) return undefined

    let cancelled = false

    const runOnce = async () => {
      if (cancelled) return
      const cap = window.electronAPI?.captureWorkScreenshot
      if (typeof cap !== 'function' || busy.current) return
      busy.current = true
      try {
        const r = await cap()
        if (cancelled) return
        if (!r?.ok || !r.base64) return
        const body = await postTimerScreenshot({
          sessionId,
          file: base64ToPngBlob(r.base64),
        })
        if (body?.data) dispatch(workScreenshotRecorded(body.data))
      } catch (e) {
        console.warn('[work screenshot]', e?.message || e)
      } finally {
        busy.current = false
      }
    }

    const scheduleNext = () => {
      if (cancelled) return
      timeoutRef.current = window.setTimeout(async () => {
        await runOnce()
        scheduleNext()
      }, NEXT_CAPTURE_MS)
    }

    timeoutRef.current = window.setTimeout(async () => {
      await runOnce()
      scheduleNext()
    }, FIRST_CAPTURE_MS)

    return () => {
      cancelled = true
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [dispatch, enabled, sessionId])
}
