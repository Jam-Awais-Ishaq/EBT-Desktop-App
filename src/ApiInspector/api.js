import axios from 'axios'

/** Auth / profile service. Task APIs use `apiTask.js` (separate port). */
const AUTH_SERVICE_DEFAULT_DEV = 'http://127.0.0.1:5001'

function resolveAuthBaseUrl() {
  const raw = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  // Legacy dev servers baked :4000; auth backend runs on :3000
  if (
    raw === 'http://127.0.0.1:4000' ||
    raw === 'http://localhost:4000'
  ) {
    return AUTH_SERVICE_DEFAULT_DEV
  }
  return raw || (import.meta.env.DEV ? AUTH_SERVICE_DEFAULT_DEV : '')
}

const authBase = resolveAuthBaseUrl()

if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    '[api] VITE_API_BASE_URL missing; using',
    AUTH_SERVICE_DEFAULT_DEV,
    '(auth). Task/timer calls use apiTask + port 5001.',
  )
}

const api = axios.create({
  baseURL: authBase || undefined,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
