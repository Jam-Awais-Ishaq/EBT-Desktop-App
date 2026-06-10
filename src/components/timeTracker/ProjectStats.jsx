import ChevronLeft from '@mui/icons-material/ChevronLeft'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  getTasks,
  getActiveTimer,
  getTimerHistory,
  pauseTimer,
  saveTimerMemo,
  startTimer,
  stopTimer,
  submitTask,
} from '../../apiImportsFunctions/apiAuth'
import { useDispatch, useSelector, useStore } from 'react-redux'
import {
  setActiveTaskTimerMemo,
  taskTimerCleared,
  taskTimerPaused,
  taskTimerStarted,
} from '../../store/loginFormSlice'

import ProjectCurrentSession from './ProjectCurrentSession'
import TimerProjectHistory from './TimerProjectHistory'
import ProjectWorkMemo from './ProjectWorkMemo'
import { mapTaskToProject, normalizeTaskStatus, taskRowsFromApiPayload } from './taskProjectUtils'
import {
  computeElapsedFromTimer,
  loadPersistedActiveTaskTimer,
  parseTimerSessionRow,
  sumProjectTotalSeconds,
} from './timerSessionUtils'

async function fetchProjectById(id) {
  const payload = await getTasks()
  const rows = taskRowsFromApiPayload(payload)
  return rows.find((t) => String(t.id) === String(id)) ?? null
}

function applyTimerSessionToState(parsed, setters) {
  if (!parsed) return
  const { setSessionId, setRunning, setElapsedSec, sessionStartedAtRef, activeSessionIdRef } =
    setters
  setSessionId(parsed.sessionId)
  setRunning(parsed.running)
  activeSessionIdRef.current = parsed.sessionId
  sessionStartedAtRef.current =
    parsed.running && parsed.startedAtMs != null ? new Date(parsed.startedAtMs) : null
  setElapsedSec(computeElapsedFromTimer(parsed))
}

function buildReduxTimerPayload(projectId, parsed, memo = '') {
  return {
    projectId: String(projectId),
    sessionId: parsed.sessionId,
    startedAtMs: parsed.startedAtMs,
    accumulatedSeconds: parsed.accumulatedSeconds,
    running: parsed.running,
    memo: memo || parsed.memo || '',
  }
}

export default function ProjectStats() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accentColor = isDark ? theme.palette.common.white : theme.palette.primary.main
  const { projectId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useStore()
  const user = useSelector((state) => state.loginForm.user)
  const activeTaskTimer = useSelector((state) => state.loginForm.activeTaskTimer)
  const activityCheck = useSelector((state) => state.loginForm.activityCheck)
  const sessionMemo =
    activeTaskTimer &&
    projectId &&
    String(activeTaskTimer.projectId) === String(projectId)
      ? (activeTaskTimer.memo ?? '')
      : ''
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const [sessionId, setSessionId] = useState(null)
  const [running, setRunning] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [historyRows, setHistoryRows] = useState([])
  const [memoSaving, setMemoSaving] = useState(false)
  const [workMemo, setWorkMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const sessionStartedAtRef = useRef(null)
  const activeSessionIdRef = useRef(null)
  const memoDraftRef = useRef('')

  const openTimer =
    activeTaskTimer != null &&
    project?.id != null &&
    String(activeTaskTimer.projectId) === String(project.id)

  const isTimerRunning = openTimer && activeTaskTimer.running === true

  const displayElapsed = openTimer
    ? computeElapsedFromTimer(activeTaskTimer)
    : elapsedSec

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      if (!projectId) {
        setLoading(false)
        setNotFound(true)
        setProject(null)
        return
      }

      setLoading(true)
      setLoadError(null)
      setNotFound(false)

      try {
        const payload = await getTasks()
        const rows = taskRowsFromApiPayload(payload)
        const task = rows.find((t) => String(t.id) === String(projectId))
        if (cancelled) return
        if (!task) {
          setProject(null)
          setNotFound(true)
        } else {
          setProject(mapTaskToProject(task))
        }
      } catch (e) {
        if (!cancelled) {
          setProject(null)
          setLoadError(e?.response?.data?.message || e?.message || 'Failed to load task')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProject()
    return () => {
      cancelled = true
    }
  }, [projectId])

  useEffect(() => {
    if (!project?.id) return
    const t = activeTaskTimer
    const setters = {
      setSessionId,
      setRunning,
      setElapsedSec,
      sessionStartedAtRef,
      activeSessionIdRef,
    }
    /* eslint-disable react-hooks/set-state-in-effect -- sync local timer UI with Redux active task */
    if (t && String(t.projectId) === String(project.id)) {
      applyTimerSessionToState(t, setters)
    } else if (t && String(t.projectId) !== String(project.id)) {
      setSessionId(null)
      setRunning(false)
      setElapsedSec(0)
      sessionStartedAtRef.current = null
      activeSessionIdRef.current = null
    } else if (!t) {
      setSessionId(null)
      setRunning(false)
      setElapsedSec(0)
      sessionStartedAtRef.current = null
      activeSessionIdRef.current = null
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [project?.id, activeTaskTimer])

  useEffect(() => {
    if (!project?.id) return undefined
    let cancelled = false

    async function hydrateOpenSession() {
      try {
        const current = store.getState().loginForm.activeTaskTimer
        if (current && String(current.projectId) === String(project.id)) {
          return
        }

        const res = await getActiveTimer({ projectId: project.id })
        if (cancelled || !res?.data) return

        const parsed = parseTimerSessionRow(res.data)
        if (!parsed) return

        const saved = loadPersistedActiveTaskTimer()
        if (
          saved &&
          String(saved.projectId) === String(project.id) &&
          String(saved.sessionId) === String(parsed.sessionId) &&
          saved.running === false
        ) {
          dispatch(
            taskTimerStarted(
              buildReduxTimerPayload(project.id, {
                ...parsed,
                accumulatedSeconds: Math.max(
                  parsed.accumulatedSeconds,
                  saved.accumulatedSeconds,
                ),
                running: false,
                startedAtMs: null,
                memo: saved.memo || parsed.memo,
              }),
            ),
          )
          return
        }

        dispatch(taskTimerStarted(buildReduxTimerPayload(project.id, parsed, res.data.memo)))
      } catch {
        /* ignore — no open session */
      }
    }

    void hydrateOpenSession()
    return () => {
      cancelled = true
    }
  }, [project?.id, dispatch, store])

  useEffect(() => {
    if (!isTimerRunning) return undefined
    const tick = () => {
      const timer = store.getState().loginForm.activeTaskTimer
      if (!timer?.running) return
      setElapsedSec(computeElapsedFromTimer(timer))
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isTimerRunning, store, project?.id, activeTaskTimer?.sessionId])

  useEffect(() => {
    if (sessionMemo) {
      memoDraftRef.current = sessionMemo
      setWorkMemo(sessionMemo)
    }
  }, [sessionMemo])

  const isSubmitted = normalizeTaskStatus(project?.status) === 'submitted'

  useEffect(() => {
    let cancelled = false

    async function loadTotalHistory() {
      if (!project?.id) return
      try {
        const response = await getTimerHistory(project.id)
        if (cancelled) return
        const raw = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : []
        setHistoryRows(raw)
      } catch {
        if (!cancelled) setHistoryRows([])
      }
    }

    void loadTotalHistory()
    return () => {
      cancelled = true
    }
  }, [project?.id, historyRefresh])

  const totalTrackedSec = sumProjectTotalSeconds(
    historyRows,
    openTimer ? activeTaskTimer : null,
    project?.id,
  )

  const canUseTimer =
    Boolean(project?.id) &&
    (Boolean(user?.id) || Boolean(localStorage.getItem('token'))) &&
    !isSubmitted

  const handleStartTimer = async () => {
    if (!project?.id || !canUseTimer || isSubmitted) {
      console.warn('Timer start: login, project missing, or task already submitted')
      return
    }

    const prior = store.getState().loginForm.activeTaskTimer
    const resumingPaused =
      prior?.sessionId &&
      prior.running === false &&
      String(prior.projectId) === String(project.id)

    if (resumingPaused) {
      const resumed = {
        sessionId: prior.sessionId,
        accumulatedSeconds: Math.max(0, Math.floor(Number(prior.accumulatedSeconds) || 0)),
        running: true,
        startedAtMs: Date.now(),
        memo: prior.memo ?? '',
      }
      applyTimerSessionToState(resumed, {
        setSessionId,
        setRunning,
        setElapsedSec,
        sessionStartedAtRef,
        activeSessionIdRef,
      })
      dispatch(taskTimerStarted(buildReduxTimerPayload(project.id, resumed, resumed.memo)))
    }

    try {
      const res = await startTimer({ projectId: project.id })

      const sid = res?.sessionId ?? res?.data?.id ?? res?.data?.sessionId
      if (sid == null) {
        throw new Error('Timer start: no sessionId in response')
      }

      let parsed = parseTimerSessionRow(res?.data) ?? {
        sessionId: sid,
        accumulatedSeconds: 0,
        running: true,
        startedAtMs: Date.now(),
        memo: '',
      }
      parsed.sessionId = sid

      const savedAccum = resumingPaused
        ? Math.max(0, Math.floor(Number(prior.accumulatedSeconds) || 0))
        : null

      if (savedAccum != null && String(prior.sessionId) === String(sid)) {
        parsed = {
          sessionId: sid,
          accumulatedSeconds: savedAccum,
          running: true,
          startedAtMs: Date.now(),
          memo: prior.memo ?? parsed.memo ?? '',
        }
      }

      applyTimerSessionToState(parsed, {
        setSessionId,
        setRunning,
        setElapsedSec,
        sessionStartedAtRef,
        activeSessionIdRef,
      })

      dispatch(
        taskTimerStarted(
          buildReduxTimerPayload(project.id, parsed, parsed.memo),
        ),
      )

      const task = await fetchProjectById(project.id)
      if (task) setProject(mapTaskToProject(task))
    } catch (error) {
      setRunning(false)
      setElapsedSec(0)
      setSessionId(null)
      sessionStartedAtRef.current = null
      activeSessionIdRef.current = null
      dispatch(taskTimerCleared())
      const msg = error?.response?.data?.message || error?.message || 'Timer start failed'
      console.error(msg, error)
    }
  }

  const handleTimerPause = async () => {
    const sid = sessionId ?? activeTaskTimer?.sessionId
    if (sid == null || !project?.id) return

    const timer =
      store.getState().loginForm.activeTaskTimer ??
      ({
        sessionId: sid,
        projectId: String(project.id),
        running: true,
        startedAtMs: sessionStartedAtRef.current?.getTime() ?? Date.now(),
        accumulatedSeconds: Math.max(0, Math.floor(Number(elapsedSec) || 0)),
        memo: '',
      })
    const elapsed = computeElapsedFromTimer(timer)

    dispatch(taskTimerPaused({ accumulatedSeconds: elapsed }))
    setRunning(false)
    setElapsedSec(elapsed)
    sessionStartedAtRef.current = null

    try {
      const res = await pauseTimer({ sessionId: sid })
      const parsed = parseTimerSessionRow(res?.data)
      if (parsed) {
        const synced = computeElapsedFromTimer(parsed)
        dispatch(taskTimerPaused({ accumulatedSeconds: synced }))
        setElapsedSec(synced)
        setHistoryRefresh((k) => k + 1)
      }
    } catch {
      /* Local pause already applied — API syncs when backend has /pause */
    }
  }

  const handleToggleTimer = () => {
    if (isSubmitted) return
    if (isTimerRunning) void handleTimerPause()
    else void handleStartTimer()
  }

  async function handleSaveMemo(text) {
    if (sessionId == null) return
    const trimmed = String(text ?? '').trim()
    dispatch(setActiveTaskTimerMemo(trimmed))
    setMemoSaving(true)
    try {
      await saveTimerMemo({ sessionId, memo: trimmed })
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Memo save failed'
      console.warn(msg, error)
    } finally {
      setMemoSaving(false)
    }
  }

  async function handleSubmitTask(note) {
    const trimmed = String(note ?? memoDraftRef.current ?? workMemo ?? '').trim()
    if (!trimmed || !project?.id) return
    if (isSubmitted) return

    setSubmitting(true)
    try {
      if (running && sessionId) {
        try {
          await saveTimerMemo({ sessionId, memo: trimmed })
          dispatch(setActiveTaskTimerMemo(trimmed))
        } catch (memoErr) {
          console.warn(
            memoErr?.response?.data?.message || memoErr?.message || 'Memo save failed',
            memoErr,
          )
        }
      }

      const res = await submitTask({ taskId: project.id, submissionNote: trimmed })
      setWorkMemo(trimmed)
      memoDraftRef.current = trimmed
      if (res?.data) {
        setProject(mapTaskToProject(res.data))
      } else {
        const task = await fetchProjectById(project.id)
        if (task) setProject(mapTaskToProject(task))
      }

      if (sessionId) {
        await handleTimerStop()
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Task submit failed'
      console.error(msg, error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTimerStop() {
    try {
      if (!sessionId || !project?.id) return

      const memo =
        memoDraftRef.current ??
        store.getState().loginForm.activeTaskTimer?.memo ??
        ''
      dispatch(setActiveTaskTimerMemo(memo))

      if (String(memo).trim()) {
        try {
          await saveTimerMemo({ sessionId, memo: String(memo).trim() })
        } catch (memoErr) {
          console.warn(
            memoErr?.response?.data?.message || memoErr?.message || 'Memo save failed',
            memoErr,
          )
        }
      }

      await stopTimer({
        sessionId,
        activityClickCount: activityCheck.totalClicks,
        activityKeypressCount: activityCheck.totalKeypresses,
        memo,
      })

      const finalMemo = String(memo).trim()
      if (finalMemo) {
        setWorkMemo(finalMemo)
        memoDraftRef.current = finalMemo
      }

      dispatch(taskTimerCleared())
      setRunning(false)
      sessionStartedAtRef.current = null
      activeSessionIdRef.current = null

      const task = await fetchProjectById(project.id)
      if (task) setProject(mapTaskToProject(task))

      setHistoryRefresh((k) => k + 1)
      setElapsedSec(0)
      setSessionId(null)
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Timer stop failed'
      console.error(msg, error)
    }
  }

  if (!projectId) {
    return <Navigate to="/home" replace />
  }

  if (loading) {
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
        <CircularProgress size={32} sx={{ color: 'primary.main' }} />
      </Box>
    )
  }

  if (notFound) {
    return <Navigate to="/home" replace />
  }

  if (loadError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          p: 3,
        }}
      >
        <IconButton aria-label="Back" onClick={() => navigate('/home')} size="small" sx={{ alignSelf: 'flex-start' }}>
          <ChevronLeft />
        </IconButton>
        <Typography sx={{ mt: 2, color: 'error.main', fontSize: '0.95rem' }}>{loadError}</Typography>
      </Box>
    )
  }

  if (!project) {
    return <Navigate to="/home" replace />
  }

  return (
    <Box
      className="project-stats-page"
      sx={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Box
        component="main"
        className="project-stats-scroll-panel"
        sx={{
          flex: 1,
          minHeight: 0,
          px: 2,
          py: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          bgcolor: 'background.paper',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            width: 0,
            height: 0,
            display: 'none',
          },
          '&::-webkit-scrollbar-thumb': {
            display: 'none',
            background: 'transparent',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pt: 1.5,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, gap: 0.25 }}>
            <IconButton
              aria-label="Back to contracts"
              onClick={() => navigate('/home')}
              size="small"
              sx={{ color: accentColor, p: 0.5, ml: -0.5, flexShrink: 0 }}
            >
              <ChevronLeft sx={{ fontSize: 28 }} />
            </IconButton>
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: accentColor,
                lineHeight: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </Typography>
          </Box>
        </Box>

        <ProjectCurrentSession
          elapsedSec={displayElapsed}
          running={isTimerRunning}
          disabled={!canUseTimer}
          deadline={project.deadline}
          totalTrackedSec={totalTrackedSec}
          onToggle={handleToggleTimer}
        />

        <ProjectWorkMemo
          timerRunning={openTimer}
          value={openTimer ? sessionMemo : workMemo}
          onDraftSync={(text) => {
            memoDraftRef.current = text
            setWorkMemo(text)
          }}
          onCommit={(text) => {
            memoDraftRef.current = text
            setWorkMemo(text)
            dispatch(setActiveTaskTimerMemo(text))
            void handleSaveMemo(text)
          }}
          saving={memoSaving}
          submitted={isSubmitted}
          submitting={submitting}
          onSubmit={(text) => void handleSubmitTask(text)}
        />

        <TimerProjectHistory projectId={project.id} refreshKey={historyRefresh} />
      </Box>
    </Box>
  )
}
