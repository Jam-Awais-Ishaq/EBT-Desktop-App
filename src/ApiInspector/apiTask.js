// src/ApiInspector/apiTask.js
import axios from 'axios'

/** Task service (taskmanagment-backend, timer). Vite `/api` proxy → auth (~3000), not tasks — keep this on 5001. */
const TASK_SERVICE_DEFAULT_DEV = 'http://127.0.0.1:5001'

/** Dev: Vite `/task-api` → :5001 (same origin; fixes CORS when dev server is not :5173). */
function resolveTaskApiBase() {
  if (import.meta.env.DEV) return '/task-api'
  const raw = String(import.meta.env.VITE_TASK_API_BASE_URL || '').replace(/\/$/, '')
  return raw || TASK_SERVICE_DEFAULT_DEV
}

const taskApiBase = resolveTaskApiBase()

if (import.meta.env.DEV && !import.meta.env.VITE_TASK_API_BASE_URL) {
  console.warn(
    '[taskApi] VITE_TASK_API_BASE_URL missing; using',
    TASK_SERVICE_DEFAULT_DEV,
    '(timer + getTasks must hit task backend, not Vite /api proxy)',
  )
}

/** Origin for static uploads (`/uploads/...`) — same base as timer API. */
export function getTaskApiBaseUrl() {
  if (import.meta.env.DEV) return '/task-api'
  const raw = String(import.meta.env.VITE_TASK_API_BASE_URL || '').replace(/\/$/, '')
  return raw || TASK_SERVICE_DEFAULT_DEV
}

const cloudName = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').replace(/\/$/, '')

/**
 * Full image URL for `timer_screenshots.storage_path`:
 * - Legacy: `/uploads/screenshots/...` on task API
 * - Current: Cloudinary `public_id` only (e.g. `Desktop App Screen Shots/ss-…`) — needs VITE_CLOUDINARY_CLOUD_NAME
 * - Absolute URL if already stored as https
 */
export function taskScreenshotImageUrl(storagePath) {
  if (!storagePath) return ''
  const p = String(storagePath).trim()
  if (/^https?:\/\//i.test(p)) return p
  if (p.startsWith('/')) {
    const base = getTaskApiBaseUrl()
    if (!base) return ''
    return `${base.replace(/\/$/, '')}${p}`
  }
  if (cloudName) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${encodeURI(p)}`
  }
  const base = getTaskApiBaseUrl()
  if (!base) return ''
  return `${base.replace(/\/$/, '')}/${p.replace(/^\//, '')}`
}

const taskApi = axios.create({
  baseURL: taskApiBase || undefined,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token from multiple sources
taskApi.interceptors.request.use(
  (config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }

    // Try to get token from various sources
    let token = localStorage.getItem('token')
    
    if (!token) {
      token = sessionStorage.getItem('token')
    }
    
    if (!token) {
      // Try to read from cookie
      const match = document.cookie.match(/token=([^;]+)/)
      if (match) token = match[1]
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor to handle token expiry
taskApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      // Redirect to login or handle accordingly
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default taskApi