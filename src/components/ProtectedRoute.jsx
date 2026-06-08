import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

import { useSessionScreenshots } from './timeTracker/useSessionScreenshots'
import { ActivityEventCapture } from './timeTracker/ActivityCheck'
import AppUsageTrackerWorker from './appUsage/AppUsageTrackerWorker'

function RunningTimerScreenshotWorker() {
  const active = useSelector((s) => s.loginForm.activeTaskTimer)
  const sessionId = active?.sessionId ?? null
  const timerRunning = active?.running === true
  useSessionScreenshots({
    enabled: timerRunning && sessionId != null,
    sessionId,
  })
  return null
}

function TimerScopedActivityCapture() {
  const active = useSelector((s) => s.loginForm.activeTaskTimer)
  const timerRunning = active?.running === true
  return <ActivityEventCapture enabled={timerRunning} />
}

function TimerScopedAppUsageTracker() {
  const timerRunning = useSelector((s) => s.loginForm.activeTaskTimer?.running === true)
  return <AppUsageTrackerWorker enabled={timerRunning} />
}

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((s) => s.loginForm.isAuthenticated)
  const authChecked = useSelector((s) => s.loginForm.authChecked)
  const location = useLocation()

  if (!authChecked) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress aria-label="Checking session" sx={{ color: 'primary.main' }} />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return (
    <>
      <TimerScopedAppUsageTracker />
      <TimerScopedActivityCapture />
      <RunningTimerScreenshotWorker />
      {children}
    </>
  )
}
