import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getTimerScreenshots } from '../../apiImportsFunctions/apiAuth'
import { taskScreenshotImageUrl } from '../../ApiInspector/apiTask'
import {
  recordActivityClick,
  recordActivityKeypress,
  workScreenshotsHydrated,
} from '../../store/loginFormSlice'

/**
 * Activity counts only while `enabled` (project timer running).
 * Electron: starts/stops native hook in main via `setGlobalInputTracking`; otherwise document listeners.
 */
export function ActivityEventCapture({ enabled }) {
  const dispatch = useDispatch()

  useEffect(() => {
    let cancelled = false
    let unsubscribeIpc = () => {}
    let removeDoc = () => {}

    void (async () => {
      if (!enabled) {
        try {
          await window.electronAPI?.setGlobalInputTracking?.(false)
        } catch {
          /* ignore */
        }
        return
      }

      const api = window.electronAPI
      if (api?.setGlobalInputTracking) {
        try {
          await api.setGlobalInputTracking(true)
        } catch {
          /* ignore */
        }
      }
      if (cancelled) return

      if (!api?.getGlobalInputTrackerStatus || !api?.subscribeGlobalInputActivity) {
        const onClick = () => dispatch(recordActivityClick())
        const onKey = () => dispatch(recordActivityKeypress())
        document.addEventListener('click', onClick, true)
        document.addEventListener('keydown', onKey, true)
        removeDoc = () => {
          document.removeEventListener('click', onClick, true)
          document.removeEventListener('keydown', onKey, true)
        }
        return
      }

      let useNative = false
      try {
        const st = await api.getGlobalInputTrackerStatus()
        useNative = Boolean(st?.native)
      } catch {
        useNative = false
      }
      if (cancelled) return

      if (useNative) {
        unsubscribeIpc = api.subscribeGlobalInputActivity((payload) => {
          if (payload?.type === 'click') dispatch(recordActivityClick())
          else if (payload?.type === 'keypress') dispatch(recordActivityKeypress())
        })
        return
      }

      const onClick = () => dispatch(recordActivityClick())
      const onKey = () => dispatch(recordActivityKeypress())
      document.addEventListener('click', onClick, true)
      document.addEventListener('keydown', onKey, true)
      removeDoc = () => {
        document.removeEventListener('click', onClick, true)
        document.removeEventListener('keydown', onKey, true)
      }
    })()

    return () => {
      cancelled = true
      unsubscribeIpc()
      removeDoc()
      void (async () => {
        try {
          await window.electronAPI?.setGlobalInputTracking?.(false)
        } catch {
          /* ignore */
        }
      })()
    }
  }, [enabled, dispatch])

  return null
}

export default function ActivityCheck() {
  const theme = useTheme()
  const dispatch = useDispatch()
  const { totalClicks, totalKeypresses, sessionScreenshots } = useSelector(
    (s) => s.loginForm.activityCheck,
  )
  const activeTaskTimer = useSelector((s) => s.loginForm.activeTaskTimer)
  const sessionId = activeTaskTimer?.sessionId ?? null

  useEffect(() => {
    if (sessionId == null) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const res = await getTimerScreenshots(sessionId)
        const list = Array.isArray(res?.data) ? res.data : []
        if (!cancelled) dispatch(workScreenshotsHydrated(list))
      } catch {
        if (!cancelled) dispatch(workScreenshotsHydrated([]))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId, dispatch])

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 2,
        borderRadius: '12px',
        border: 1,
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.85),
        textAlign: 'left',
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
        SESSION TOTALS
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: '10px',
            bgcolor: 'background.paper',
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>
            Clicks
          </Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}>
            {totalClicks.toLocaleString()}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: '10px',
            bgcolor: 'background.paper',
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>
            Keypresses
          </Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}>
            {totalKeypresses.toLocaleString()}
          </Typography>
        </Paper>
      </Box>

      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'text.secondary',
          mt: 2.5,
          mb: 1.25,
        }}
      >
        WORK SCREENSHOTS (this session)
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mb: 1.25 }}>
        {sessionId
          ? 'Automatic capture while the project timer runs (Electron; testing: every 10s). New saves go to Cloudinary when the task API has Cloudinary env set.'
          : sessionScreenshots.length > 0
            ? 'Captures from your last timer session (saved in the database). Start the timer again for a new session.'
            : 'Start the project timer to record screenshots to the database.'}
      </Typography>
      {sessionScreenshots.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: '10px',
            bgcolor: 'background.paper',
          }}
        >
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled' }}>
            {sessionId
              ? 'No screenshots yet — testing mode: first capture after 10s, then every 10s while the timer runs.'
              : '—'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
          {sessionScreenshots.map((s) => {
            const href = s.image_url || taskScreenshotImageUrl(s.storage_path)
            if (!href) return null
            const t = s.created_at ? new Date(s.created_at) : null
            const timeLabel =
              t && !Number.isNaN(t.getTime()) ? t.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
            return (
              <Paper
                key={s.id}
                elevation={0}
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '10px',
                  bgcolor: 'background.paper',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Box
                  component="img"
                  src={href}
                  alt=""
                  sx={{
                    display: 'block',
                    width: { xs: '100%', sm: 168 },
                    maxWidth: '100%',
                    height: 112,
                    objectFit: 'cover',
                  }}
                />
                {timeLabel ? (
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', px: 1, py: 0.5 }}>
                    {timeLabel}
                  </Typography>
                ) : null}
              </Paper>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
