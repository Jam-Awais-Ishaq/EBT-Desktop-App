import { CATEGORY_COLORS } from './appUsageTheme'

/** Hours + minutes only — no seconds (e.g. 1h 20m, 47m) */
export function formatUsageHm(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return '0m'
}

/** Large summary label e.g. "47m Total Usage" */
export function formatTotalUsageLabel(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function formatUsageDuration(totalSeconds) {
  return formatUsageHm(totalSeconds)
}

/** When the user first started using an app today (local time). */
export function formatAppUsageStartTime(startedAtMs) {
  const ms = Number(startedAtMs)
  if (!Number.isFinite(ms) || ms <= 0) return null
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function todayUsageDateString() {
  return new Date().toISOString().slice(0, 10)
}

export function yesterdayUsageDateString() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

const APP_META = [
  { match: /cursor/i, category: 'Development', productive: true, icon: '⌘' },
  { match: /vs code|code\.exe/i, category: 'Development', productive: true, icon: '</>' },
  { match: /chrome|edge|firefox|browser/i, category: 'Browsing', productive: false, icon: '🌐' },
  { match: /explorer|file explorer/i, category: 'System', productive: false, icon: '📁' },
  { match: /time tracker|crm|electron/i, category: 'Productivity', productive: true, icon: '⏱' },
  { match: /screenclip|snipping|screenshot/i, category: 'System', productive: false, icon: '✂' },
  { match: /powershell|cmd|terminal|windowsterminal/i, category: 'Development', productive: true, icon: '>_ ' },
  { match: /slack|teams|discord/i, category: 'Productivity', productive: true, icon: '💬' },
  { match: /figma|notion|word|excel/i, category: 'Productivity', productive: true, icon: '◆' },
]

export function getAppMeta(appName) {
  const name = String(appName || '').trim()
  for (const rule of APP_META) {
    if (rule.match.test(name)) {
      return {
        category: rule.category,
        productive: rule.productive,
        color: CATEGORY_COLORS[rule.category] || CATEGORY_COLORS.Other,
        icon: rule.icon,
      }
    }
  }
  return {
    category: 'Other',
    productive: false,
    color: CATEGORY_COLORS.Other,
    icon: name.slice(0, 1).toUpperCase() || '?',
  }
}

export function mergeUsageRows(serverRows, localEntries) {
  const map = new Map()

  const upsert = (appName, durationSeconds, startedAtMs) => {
    const n = String(appName || '').trim()
    if (!n) return
    const existing = map.get(n) || { durationSeconds: 0, startedAtMs: null }
    existing.durationSeconds += Math.max(0, Math.floor(Number(durationSeconds) || 0))
    const ms = Number(startedAtMs)
    if (Number.isFinite(ms) && ms > 0) {
      if (existing.startedAtMs == null || ms < existing.startedAtMs) {
        existing.startedAtMs = ms
      }
    }
    map.set(n, existing)
  }

  for (const row of serverRows || []) {
    const startedAtMs = row.startedAt ? new Date(row.startedAt).getTime() : null
    upsert(row.appName, row.durationSeconds, startedAtMs)
  }
  for (const row of localEntries || []) {
    const startedAtMs = row.firstUsedAtMs ?? row.startedAtMs ?? null
    upsert(row.appName, row.durationSeconds, startedAtMs)
  }

  return [...map.entries()]
    .map(([appName, data]) => ({
      appName,
      durationSeconds: Math.max(0, Math.floor(data.durationSeconds)),
      startedAtMs: data.startedAtMs,
      ...getAppMeta(appName),
    }))
    .sort((a, b) => b.durationSeconds - a.durationSeconds)
}

export function computeUsageStats(rows, totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds || 0))
  let productiveSec = 0
  const categoryMap = new Map()

  for (const row of rows) {
    if (row.productive) productiveSec += row.durationSeconds
    const cat = row.category || 'Other'
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + row.durationSeconds)
  }

  const productivePct = total > 0 ? Math.round((productiveSec / total) * 100) : 0
  const categories = [...categoryMap.entries()]
    .map(([name, seconds]) => ({
      name,
      seconds,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
      pct: total > 0 ? Math.round((seconds / total) * 100) : 0,
    }))
    .sort((a, b) => b.seconds - a.seconds)

  const focusScore = Math.min(
    100,
    Math.round(productivePct * 0.85 + Math.min(rows.length, 12) * 1.2),
  )

  return {
    productivePct,
    productiveSec,
    appsUsed: rows.length,
    categoryCount: categories.length,
    categories,
    focusScore,
    focusLabel: focusScore >= 80 ? 'Great' : focusScore >= 50 ? 'Good' : 'Low',
  }
}

export function computeDayComparison(todayTotal, yesterdayTotal) {
  if (!yesterdayTotal || yesterdayTotal <= 0) {
    if (todayTotal > 0) return { pct: 100, up: true }
    return { pct: 0, up: true }
  }
  const pct = Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}

/** Visual hourly curve for chart (no per-hour API yet) */
export function buildHourlyChartPoints(totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds || 0))
  const nowHour = new Date().getHours()
  const points = Array.from({ length: 24 }, () => 0)
  if (total <= 0) return points

  let remaining = total
  const peakShare = 0.45
  points[nowHour] = Math.floor(total * peakShare)
  remaining -= points[nowHour]

  for (let offset = 1; offset <= 3 && remaining > 0; offset += 1) {
    for (const h of [nowHour - offset, nowHour + offset]) {
      if (h < 0 || h > 23 || remaining <= 0) continue
      const chunk = Math.min(remaining, Math.floor(total * 0.12))
      points[h] += chunk
      remaining -= chunk
    }
  }
  if (remaining > 0) points[nowHour] += remaining
  return points
}
