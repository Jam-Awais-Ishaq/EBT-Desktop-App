import Search from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getTimerHistory } from '../../apiImportsFunctions/apiAuth'
import { sessionHistoryDurationSeconds } from './timerSessionUtils'
import { TIMER_TIME_ZONE } from './timerTimeZone'

const dateColumnOpts = {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: TIMER_TIME_ZONE,
}

const timeColumnOpts = { timeZone: TIMER_TIME_ZONE }

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function getCheckInTime(row) {
  if (row.startedAt) return new Date(row.startedAt)
  const out = new Date(row.stoppedAt).getTime()
  if (Number.isNaN(out)) return new Date(NaN)
  return new Date(out - row.durationSec * 1000)
}

function dateMatchesQuery(d, q) {
  if (Number.isNaN(d.getTime())) return false
  const pkCal = d.toLocaleDateString('en-CA', { timeZone: TIMER_TIME_ZONE })
  const localeDate = d
    .toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: TIMER_TIME_ZONE,
    })
    .toLowerCase()
  const localeFull = d.toLocaleString(undefined, { timeZone: TIMER_TIME_ZONE }).toLowerCase()
  const [y, mo, day] = pkCal.split('-')
  const m = String(Number(mo))
  const dNum = String(Number(day))
  return (
    pkCal.toLowerCase().includes(q) ||
    localeDate.includes(q) ||
    localeFull.includes(q) ||
    y.includes(q) ||
    `${m}/${dNum}`.includes(q) ||
    `${dNum}/${m}`.includes(q)
  )
}

function rowMatchesDateSearch(row, query) {
  const trimmed = query.trim()
  if (!trimmed) return true
  const q = trimmed.toLowerCase()
  const checkIn = getCheckInTime(row)
  const checkOut = new Date(row.stoppedAt)
  if (row.memo && String(row.memo).toLowerCase().includes(q)) return true
  return dateMatchesQuery(checkIn, q) || dateMatchesQuery(checkOut, q)
}

/** Wider columns; table scrolls horizontally when viewport is narrow */
const HISTORY_COL_WIDTH = {
  date: 130,
  checkIn: 115,
  checkOut: 115,
  memo: 150,
  activity: 110,
  duration: 100,
}

const HISTORY_TABLE_MIN_WIDTH =
  HISTORY_COL_WIDTH.date +
  HISTORY_COL_WIDTH.checkIn +
  HISTORY_COL_WIDTH.checkOut +
  HISTORY_COL_WIDTH.memo +
  HISTORY_COL_WIDTH.activity +
  HISTORY_COL_WIDTH.duration

const historyTableSx = {
  tableLayout: 'fixed',
  width: HISTORY_TABLE_MIN_WIDTH,
  minWidth: HISTORY_TABLE_MIN_WIDTH,
}

const historyHeadCellSx = {
  fontWeight: 700,
  fontSize: '0.75rem',
  bgcolor: 'background.paper',
  borderBottom: '1px solid',
  borderBottomColor: 'divider',
  py: 1.25,
  px: 2,
  whiteSpace: 'nowrap',
}

function HistoryColGroup() {
  return (
    <colgroup>
      <col style={{ width: HISTORY_COL_WIDTH.date }} />
      <col style={{ width: HISTORY_COL_WIDTH.checkIn }} />
      <col style={{ width: HISTORY_COL_WIDTH.checkOut }} />
      <col style={{ width: HISTORY_COL_WIDTH.memo }} />
      <col style={{ width: HISTORY_COL_WIDTH.activity }} />
      <col style={{ width: HISTORY_COL_WIDTH.duration }} />
    </colgroup>
  )
}

const historyBodyCellSx = {
  fontSize: '0.8125rem',
  color: 'text.secondary',
  borderBottom: '1px solid',
  borderBottomColor: 'divider',
  py: 1.25,
  px: 2,
}

function historyHeadCol(width) {
  return { ...historyHeadCellSx, minWidth: width, width }
}

function historyBodyCol(width, extra = {}) {
  return { ...historyBodyCellSx, minWidth: width, width, ...extra }
}

/** Table preview: first 15 characters, then "..." if longer. */
function formatMemoPreview(memo, maxLen = 15) {
  const text = String(memo ?? '').trim()
  if (!text) return ''
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen)}...`
}

function normalizeTimerHistoryPayload(response) {
  if (response == null) return []
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  return []
}

function mapApiHistoryToRows(raw) {
  return raw
    .filter((item) => item?.stopped_at)
    .map((item) => {
      const startedAt = new Date(item.started_at)
      const stoppedAt = new Date(item.stopped_at)
      const sessionId = item.id
      const activityClicks = Math.max(0, Math.floor(Number(item.activity_click_count) || 0))
      const activityKeypresses = Math.max(0, Math.floor(Number(item.activity_keypress_count) || 0))
      return {
        id: sessionId,
        apiSessionId: sessionId,
        startedAt: item.started_at,
        stoppedAt: item.stopped_at,
        memo: item.memo != null ? String(item.memo).trim() : '',
        activityClicks,
        activityKeypresses,
        durationSec: sessionHistoryDurationSeconds(item),
      }
    })
}

/** Table of timer sessions for one project; scrolls when there are 2+ rows. */
export default function TimerProjectHistory({ projectId, refreshKey = 0 }) {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)

  useEffect(() => {
    const fetchTimerHistory = async () => {
      if (!projectId) return

      setHistoryLoading(true)
      setHistoryError(null)

      try {
        const response = await getTimerHistory(projectId)
        const raw = normalizeTimerHistoryPayload(response)
        const apiRows = mapApiHistoryToRows(raw).sort((a, b) => {
          const tb = new Date(b.stoppedAt).getTime()
          const ta = new Date(a.stoppedAt).getTime()
          return tb - ta
        })
        setRows(apiRows)
      } catch (error) {
        console.error(
          error?.response?.data?.message || error?.message || 'Timer history failed',
          error,
        )
        const status = error?.response?.status
        let msg =
          error?.response?.data?.message ||
          error?.message ||
          'Timer history could not be loaded.'
        if (status === 404) {
          msg =
            'Timer API not found (404). Point VITE_TASK_API_BASE_URL at the task service, e.g. http://127.0.0.1:4000 (auth runs on a different port).'
        }
        setHistoryError(msg)
        setRows([])
      }
      setHistoryLoading(false)
    }

    fetchTimerHistory()
  }, [projectId, refreshKey])

  const openSessionDetail = async (sessionId) => {
    if (sessionId == null || Number.isNaN(Number(sessionId))) return
    navigate(`/session/${sessionId}`)
  }

  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => rows.filter((r) => rowMatchesDateSearch(r, search)),
    [rows, search],
  )

  const scrollBody = filtered.length >= 2
  /** Sticky header + ~2 visible body rows, then scroll */
  const tableMaxHeight = scrollBody ? 196 : undefined

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 1.25,
        }}
      >
        Timer history
      </Typography>

      <TextField
        placeholder="Search by date"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        fullWidth
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            bgcolor: 'background.paper',
            fontSize: '0.875rem',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'primary.light' },
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.disabled', fontSize: 22 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {historyLoading && rows.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={28} sx={{ color: 'primary.main' }} />
        </Box>
      ) : null}

      {historyError ? (
        <Typography sx={{ fontSize: '0.8125rem', color: 'error.main', mb: 1 }}>
          {historyError}
        </Typography>
      ) : null}

      {!historyLoading && rows.length === 0 ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>
          No history available yet.
        </Typography>
      ) : null}

      {!historyLoading && rows.length > 0 && filtered.length === 0 ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'text.disabled' }}>
          No entries match this date search.
        </Typography>
      ) : null}

      {!historyLoading && filtered.length > 0 ? (
        <Box
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box className="timer-history-h-scroll" sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: HISTORY_TABLE_MIN_WIDTH }}>
              <Table size="small" sx={historyTableSx}>
                <HistoryColGroup />
                <TableHead>
                  <TableRow>
                    <TableCell sx={historyHeadCol(HISTORY_COL_WIDTH.date)}>Date</TableCell>
                    <TableCell sx={historyHeadCol(HISTORY_COL_WIDTH.checkIn)}>Check in</TableCell>
                    <TableCell sx={historyHeadCol(HISTORY_COL_WIDTH.checkOut)}>Check out</TableCell>
                    <TableCell sx={historyHeadCol(HISTORY_COL_WIDTH.memo)}>Memo</TableCell>
                    <TableCell align="right" sx={historyHeadCol(HISTORY_COL_WIDTH.activity)}>
                      Activity
                    </TableCell>
                    <TableCell align="right" sx={historyHeadCol(HISTORY_COL_WIDTH.duration)}>
                      Duration
                    </TableCell>
                  </TableRow>
                </TableHead>
              </Table>

              <Box
                className="timer-history-v-scroll"
                sx={{
                  maxHeight: tableMaxHeight,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::-webkit-scrollbar': { width: 0, height: 0, display: 'none' },
                }}
              >
                <Table size="small" sx={historyTableSx}>
                  <HistoryColGroup />
                  <TableBody>
              {filtered.map((row) => {
                const checkIn = getCheckInTime(row)
                const checkOut = new Date(row.stoppedAt)
                return (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() =>
                      row.apiSessionId != null ? openSessionDetail(row.apiSessionId) : undefined
                    }
                    sx={{
                      cursor: row.apiSessionId != null ? 'pointer' : 'default',
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell
                      sx={historyBodyCol(HISTORY_COL_WIDTH.date, { whiteSpace: 'nowrap' })}
                    >
                      {checkIn.toLocaleDateString(undefined, dateColumnOpts)}
                    </TableCell>
                    <TableCell
                      sx={historyBodyCol(HISTORY_COL_WIDTH.checkIn, {
                        fontVariantNumeric: 'tabular-nums',
                      })}
                    >
                      {checkIn.toLocaleTimeString(undefined, timeColumnOpts)}
                    </TableCell>
                    <TableCell
                      sx={historyBodyCol(HISTORY_COL_WIDTH.checkOut, {
                        fontVariantNumeric: 'tabular-nums',
                      })}
                    >
                      {checkOut.toLocaleTimeString(undefined, timeColumnOpts)}
                    </TableCell>
                    <TableCell sx={historyBodyCol(HISTORY_COL_WIDTH.memo)}>
                      {formatMemoPreview(row.memo) ? (
                        <Tooltip title={row.memo} placement="top" enterDelay={400}>
                          <Typography
                            component="span"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatMemoPreview(row.memo)}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography component="span" sx={{ color: 'text.disabled' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={historyBodyCol(HISTORY_COL_WIDTH.activity, {
                        fontVariantNumeric: 'tabular-nums',
                      })}
                    >
                      {row.activityClicks ?? 0} / {row.activityKeypresses ?? 0}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={historyBodyCol(HISTORY_COL_WIDTH.duration, {
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'text.primary',
                      })}
                    >
                      {formatElapsed(row.durationSec)}
                    </TableCell>
                  </TableRow>
                )
              })}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}

    </Box>
  )
}
