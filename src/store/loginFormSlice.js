import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loginUser } from '../apiImportsFunctions/apiAuth'
import {
  ACTIVE_TASK_TIMER_STORAGE_KEY,
  loadPersistedActiveTaskTimer,
  persistActiveTaskTimer,
} from '../components/timeTracker/timerSessionUtils'

const AUTH_TOKEN_KEY = 'token'

function decodeTokenPayload(token) {
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function getRoleFromToken(token) {
  const payload = decodeTokenPayload(token)
  return payload?.role ? String(payload.role).toLowerCase() : null
}

/** Minimal user shape from JWT so task timer & APIs work after page refresh. */
function getUserStubFromToken(token) {
  const payload = decodeTokenPayload(token)
  if (payload?.id == null) return null
  return {
    id: String(payload.id),
    role: payload.role != null ? String(payload.role).toLowerCase() : null,
  }
}

function loadPersistedAuth() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    return { token }
  } catch {
    return { token: null }
  }
}

const initialState = {
  email: '',
  emailError: '',
  password: '',
  showPassword: false,
  isAuthenticated: false,
  authChecked: false,
  isLoading: false,
  authError: '',
  authRole: null,
  user: null,
  activityCheck: {
    totalClicks: 0,
    totalKeypresses: 0,
    /** Current (or last stopped) timer session — rows from `timer_screenshots` after upload / hydrate. */
    sessionScreenshots: [],
  },
  /** Survives route changes + app reload; cleared on finalize stop / logout. */
  activeTaskTimer: loadPersistedActiveTaskTimer(),
}

export const bootstrapAuth = createAsyncThunk(
  'loginForm/bootstrapAuth',
  async (_, { rejectWithValue }) => {
    localStorage.removeItem('authUser')
    const { token } = loadPersistedAuth()
    if (token) {
      return { token }
    }
    return rejectWithValue('Not authenticated')
  },
)

export const submitLogin = createAsyncThunk(
  'loginForm/submitLogin',
  async (_, { getState, rejectWithValue }) => {
    const { email, password } = getState().loginForm
    try {
      const payload = await loginUser({ email, password })
      return payload
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || 'Login failed'
      return rejectWithValue(message)
    }
  },
)

const loginFormSlice = createSlice({
  name: 'loginForm',
  initialState,
  reducers: {
    setEmail: (state, action) => {
      state.email = action.payload
      state.emailError = ''
    },
    setEmailError: (state, action) => {
      state.emailError = action.payload
    },
    setPassword: (state, action) => {
      state.password = action.payload
    },
    toggleShowPassword: (state) => {
      state.showPassword = !state.showPassword
    },
    recordActivityClick: (state) => {
      state.activityCheck.totalClicks += 1
    },
    recordActivityKeypress: (state) => {
      state.activityCheck.totalKeypresses += 1
    },
    resetActivityStats: (state) => {
      state.activityCheck.totalClicks = 0
      state.activityCheck.totalKeypresses = 0
      state.activityCheck.sessionScreenshots = []
    },
    workScreenshotRecorded: (state, action) => {
      const row = action.payload
      if (!row?.id) return
      const list = state.activityCheck.sessionScreenshots
      if (list.some((s) => s.id === row.id)) return
      list.push(row)
    },
    workScreenshotsHydrated: (state, action) => {
      state.activityCheck.sessionScreenshots = Array.isArray(action.payload) ? action.payload : []
    },
    taskTimerStarted: (state, action) => {
      const prevSessionId = state.activeTaskTimer?.sessionId
      state.activeTaskTimer = {
        projectId: String(action.payload.projectId),
        sessionId: action.payload.sessionId,
        startedAtMs: action.payload.startedAtMs ?? null,
        accumulatedSeconds: Math.max(
          0,
          Math.floor(Number(action.payload.accumulatedSeconds) || 0),
        ),
        running: action.payload.running !== false,
        memo: action.payload?.memo != null ? String(action.payload.memo) : '',
      }
      if (String(prevSessionId) !== String(action.payload.sessionId)) {
        state.activityCheck.sessionScreenshots = []
        state.activityCheck.totalClicks = 0
        state.activityCheck.totalKeypresses = 0
      }
      persistActiveTaskTimer(state.activeTaskTimer)
    },
    taskTimerPaused: (state, action) => {
      if (!state.activeTaskTimer) return
      const accumulated =
        action.payload?.accumulatedSeconds != null
          ? Math.max(0, Math.floor(Number(action.payload.accumulatedSeconds) || 0))
          : state.activeTaskTimer.accumulatedSeconds
      state.activeTaskTimer.accumulatedSeconds = accumulated
      state.activeTaskTimer.running = false
      state.activeTaskTimer.startedAtMs = null
      persistActiveTaskTimer(state.activeTaskTimer)
    },
    setActiveTaskTimerMemo: (state, action) => {
      if (!state.activeTaskTimer) return
      state.activeTaskTimer.memo =
        action.payload != null ? String(action.payload) : ''
    },
    taskTimerCleared: (state) => {
      state.activeTaskTimer = null
      persistActiveTaskTimer(null)
    },
    logout: (state) => {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem('authUser')
      localStorage.removeItem(ACTIVE_TASK_TIMER_STORAGE_KEY)
      state.isAuthenticated = false
      state.authChecked = true
      state.authRole = null
      state.password = ''
      state.user = null
      state.authError = ''
      state.activeTaskTimer = null
      state.activityCheck = {
        totalClicks: 0,
        totalKeypresses: 0,
        sessionScreenshots: [],
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        // Don't show login errors while silently checking session
        state.authError = ''
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        const token = action.payload?.token || null
        state.isAuthenticated = true
        state.authRole = getRoleFromToken(token)
        state.user = action.payload?.user || getUserStubFromToken(token)
        state.authChecked = true
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.isAuthenticated = false
        state.authRole = null
        state.user = null
        state.authChecked = true
      })
      .addCase(submitLogin.pending, (state) => {
        state.isLoading = true
        state.authError = ''
      })
      .addCase(submitLogin.fulfilled, (state, action) => {
        const token = action.payload?.token
        const user = action.payload?.user || null
        if (token) {
          localStorage.setItem(AUTH_TOKEN_KEY, token)
        }
        localStorage.removeItem('authUser')
        state.isLoading = false
        state.isAuthenticated = true
        state.authChecked = true
        state.authRole = getRoleFromToken(token)
        state.user = user
        state.password = ''
        state.activeTaskTimer = null
        persistActiveTaskTimer(null)
        state.activityCheck.sessionScreenshots = []
      })
      .addCase(submitLogin.rejected, (state, action) => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem('authUser')
        state.isLoading = false
        state.isAuthenticated = false
        state.authRole = null
        state.authChecked = true
        state.authError = action.payload || 'Login failed'
      })
  },
})

export const {
  setEmail,
  setEmailError,
  setPassword,
  toggleShowPassword,
  recordActivityClick,
  recordActivityKeypress,
  resetActivityStats,
  workScreenshotRecorded,
  workScreenshotsHydrated,
  taskTimerStarted,
  taskTimerPaused,
  setActiveTaskTimerMemo,
  taskTimerCleared,
  logout,
} = loginFormSlice.actions

export default loginFormSlice.reducer