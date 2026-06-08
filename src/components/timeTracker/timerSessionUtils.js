/** Active timer elapsed = accumulated active seconds + current running segment. */
export function computeElapsedFromTimer(timer) {
  if (!timer) return 0
  const accumulated = Math.max(0, Math.floor(Number(timer.accumulatedSeconds) || 0))
  if (timer.running !== true || timer.startedAtMs == null) return accumulated
  const anchor = Number(timer.startedAtMs)
  if (!Number.isFinite(anchor)) return accumulated
  return accumulated + Math.max(0, Math.floor((Date.now() - anchor) / 1000))
}

export function parseTimerSessionRow(row) {
  if (!row) return null
  const accumulatedSeconds = Math.max(0, Math.floor(Number(row.accumulated_seconds) || 0))
  const running = String(row.status || '').toLowerCase() === 'running'
  const startedRaw = row.started_at
  const startedAtMs =
    running && startedRaw ? new Date(startedRaw).getTime() : null
  const resolvedStartedAtMs =
    startedAtMs != null && !Number.isNaN(startedAtMs) ? startedAtMs : null

  return {
    sessionId: row.id,
    accumulatedSeconds,
    running,
    startedAtMs: resolvedStartedAtMs,
    memo: row.memo != null ? String(row.memo) : '',
  }
}

export function sessionHistoryDurationSeconds(item) {
  const accumulated = Number(item?.accumulated_seconds)
  if (Number.isFinite(accumulated) && accumulated >= 0) {
    return Math.floor(accumulated)
  }
  if (!item?.stopped_at || !item?.started_at) return 0
  const startedAt = new Date(item.started_at)
  const stoppedAt = new Date(item.stopped_at)
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(stoppedAt.getTime())) return 0
  return Math.max(0, Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 1000))
}

function historyRowsFromResponse(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

/** Permanent project total: finished sessions + open session (paused or live run). */
export function sumProjectTotalSeconds(response, activeTimer, projectId) {
  const rows = historyRowsFromResponse(response)
  let total = 0
  let openRow = null

  for (const item of rows) {
    if (item?.stopped_at) {
      total += sessionHistoryDurationSeconds(item)
    } else {
      openRow = item
      total += Math.max(0, Math.floor(Number(item.accumulated_seconds) || 0))
    }
  }

  if (
    !activeTimer ||
    projectId == null ||
    String(activeTimer.projectId) !== String(projectId)
  ) {
    return total
  }

  const liveSec = computeElapsedFromTimer(activeTimer)
  const openAccum = openRow
    ? Math.max(0, Math.floor(Number(openRow.accumulated_seconds) || 0))
    : 0

  if (openRow && String(openRow.id) === String(activeTimer.sessionId)) {
    return total + Math.max(0, liveSec - openAccum)
  }

  return total + liveSec
}

export const ACTIVE_TASK_TIMER_STORAGE_KEY = 'activeTaskTimer'

export function loadPersistedActiveTaskTimer() {
  try {
    const raw = localStorage.getItem(ACTIVE_TASK_TIMER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.sessionId || !parsed?.projectId) return null
    return {
      projectId: String(parsed.projectId),
      sessionId: parsed.sessionId,
      startedAtMs: parsed.startedAtMs ?? null,
      accumulatedSeconds: Math.max(0, Math.floor(Number(parsed.accumulatedSeconds) || 0)),
      running: parsed.running === true,
      memo: parsed.memo != null ? String(parsed.memo) : '',
    }
  } catch {
    return null
  }
}

export function persistActiveTaskTimer(timer) {
  try {
    if (!timer?.sessionId) {
      localStorage.removeItem(ACTIVE_TASK_TIMER_STORAGE_KEY)
      return
    }
    localStorage.setItem(
      ACTIVE_TASK_TIMER_STORAGE_KEY,
      JSON.stringify({
        projectId: String(timer.projectId),
        sessionId: timer.sessionId,
        startedAtMs: timer.startedAtMs ?? null,
        accumulatedSeconds: Math.max(0, Math.floor(Number(timer.accumulatedSeconds) || 0)),
        running: timer.running === true,
        memo: timer.memo != null ? String(timer.memo) : '',
      }),
    )
  } catch {
    /* ignore */
  }
}
