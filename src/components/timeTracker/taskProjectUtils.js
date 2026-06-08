import { sessionHistoryDurationSeconds } from './timerSessionUtils'

/** Normalizes GET /api/getTasks JSON to task rows. */
export function taskRowsFromApiPayload(payload) {
  if (!payload) return []
  if (Array.isArray(payload.data)) return payload.data
  return []
}

/** Row for contracts list (home). */
export function mapTaskToListItem(task) {
  return {
    id: String(task.id),
    name: task.title || 'Untitled task',
    status: task.status || '—',
    updatedAt: task.updated_at || task.updatedAt || null,
    createdAt: task.created_at || task.createdAt || null,
  }
}

export function latestActivityFromTimerHistory(response) {
  const raw = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : []
  let latestMs = null
  for (const item of raw) {
    for (const value of [item?.stopped_at, item?.started_at]) {
      if (!value) continue
      const ms = new Date(value).getTime()
      if (Number.isNaN(ms)) continue
      if (latestMs == null || ms > latestMs) latestMs = ms
    }
  }
  return latestMs != null ? new Date(latestMs).toISOString() : null
}

export function formatUpdatedAgo(iso) {
  if (!iso) return 'Recently updated'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Recently updated'
  const diffMs = Math.max(0, Date.now() - d.getTime())
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Updated just now'
  if (mins < 60) return `Updated ${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

export function formatTrackedDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return '0m'
}

export function sumTimerHistorySeconds(response) {
  const raw = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : []
  return raw.reduce((acc, item) => acc + sessionHistoryDurationSeconds(item), 0)
}

const TASK_STATUS_STYLES = {
  submitted: {
    label: 'Submitted',
    light: {
      iconBg: '#E6F4EA',
      iconColor: '#1E8E3E',
      badgeBg: '#E6F4EA',
      badgeColor: '#1E8E3E',
      badgeDot: '#34A853',
    },
    dark: {
      iconBg: 'rgba(34, 154, 86, 0.22)',
      iconColor: '#5EE08F',
      badgeBg: 'rgba(34, 154, 86, 0.22)',
      badgeColor: '#5EE08F',
      badgeDot: '#5EE08F',
    },
  },
  in_progress: {
    label: 'In Progress',
    light: {
      iconBg: '#FFF4ED',
      iconColor: '#EE651A',
      badgeBg: '#FFF4ED',
      badgeColor: '#EE651A',
    },
    dark: {
      iconBg: 'rgba(238, 101, 26, 0.2)',
      iconColor: '#FB923C',
      badgeBg: 'rgba(238, 101, 26, 0.2)',
      badgeColor: '#FB923C',
    },
  },
  pending: {
    label: 'Pending',
    light: {
      iconBg: '#FFFBEB',
      iconColor: '#B45309',
      badgeBg: '#FFFBEB',
      badgeColor: '#B45309',
    },
    dark: {
      iconBg: 'rgba(180, 83, 9, 0.22)',
      iconColor: '#FBBF24',
      badgeBg: 'rgba(180, 83, 9, 0.22)',
      badgeColor: '#FBBF24',
    },
  },
}

function resolveStatusStyleKey(status) {
  const norm = normalizeTaskStatus(status)
  if (norm === 'submitted' || norm === 'submit') return 'submitted'
  if (norm === 'in_progress') return 'in_progress'
  if (norm === 'pending') return 'pending'
  return 'in_progress'
}

export function getTaskStatusPresentation(status, mode = 'light') {
  const key = resolveStatusStyleKey(status)
  const preset = TASK_STATUS_STYLES[key]
  const palette = mode === 'dark' ? preset.dark : preset.light
  return {
    label: key === 'in_progress' && normalizeTaskStatus(status) !== 'in_progress'
      ? String(status || '—')
      : preset.label,
    badgeDot: palette.badgeDot || palette.badgeColor,
    ...palette,
  }
}

function formatStatusLabel(statusText) {
  const raw = String(statusText || '—').trim()
  if (!raw || raw === '—') return '—'
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Session detail status pill (Stopped, Submitted, etc.) */
export function getSessionStatusPillPresentation(statusText, mode = 'light') {
  const label = formatStatusLabel(statusText)
  const isDark = mode === 'dark'

  if (/stop|idle|fail|error/i.test(String(statusText || ''))) {
    return {
      label,
      badgeBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
      badgeColor: isDark ? '#FCA5A5' : '#B91C1C',
      badgeDot: isDark ? '#F87171' : '#DC2626',
    }
  }

  if (/submit|done|ok|active/i.test(String(statusText || ''))) {
    const submitted = getTaskStatusPresentation('submitted', mode)
    return { ...submitted, label }
  }

  return {
    label,
    badgeBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB',
    badgeColor: isDark ? '#FBBF24' : '#B45309',
    badgeDot: isDark ? '#FBBF24' : '#D97706',
  }
}

export function normalizeTaskStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export function taskMatchesStatusFilter(status, filter) {
  if (!filter || filter === 'all') return true
  const norm = normalizeTaskStatus(status)
  if (filter === 'pending') return norm === 'pending'
  if (filter === 'in_progress') return norm === 'in_progress'
  if (filter === 'submitted') return norm === 'submitted' || norm === 'submit'
  return true
}

/** Shape expected by ProjectStats (timer / deadline / chip). */
export function mapTaskToProject(task) {
  const st = String(task.status || '').toLowerCase().replace(/\s+/g, '_')
  return {
    id: String(task.id),
    name: task.title || 'Untitled task',
    fullName: task.title || 'Untitled task',
    status: task.status || '—',
    deadline: task.deadline || new Date().toISOString(),
    trackingStatus: st === 'in_progress' ? 'working' : 'pending',
  }
}
