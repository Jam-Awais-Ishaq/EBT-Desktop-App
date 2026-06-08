import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { lazy, Suspense, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { HashRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { bootstrapAuth } from './store/loginFormSlice'

const Login = lazy(() => import('./components/Login'))
const TimeTrackerHome = lazy(
  () => import('./components/timeTracker/TimeTrackerHome'),
)
const ActivityCheckPage = lazy(
  () => import('./components/timeTracker/ActivityCheckPage'),
)
const ProjectStats = lazy(
  () => import('./components/timeTracker/ProjectStats'),
)
const SessionDetailsPage = lazy(
  () => import('./components/timeTracker/SessionDetailsPage'),
)
const AppUsagePage = lazy(() => import('./components/appUsage/AppUsagePage'))

function RouteFallback() {
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
      <CircularProgress aria-label="Loading page" sx={{ color: 'primary.main' }} />
    </Box>
  )
}

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    void dispatch(bootstrapAuth())
  }, [dispatch])

  return (
    <HashRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <TimeTrackerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-check"
            element={
              <ProtectedRoute>
                <ActivityCheckPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:sessionId"
            element={
              <ProtectedRoute>
                <SessionDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app-usage"
            element={
              <ProtectedRoute>
                <AppUsagePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
