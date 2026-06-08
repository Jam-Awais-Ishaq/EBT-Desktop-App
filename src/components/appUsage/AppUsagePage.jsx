import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getAppUsageSummary } from '../../apiImportsFunctions/apiAppUsage'
import AppUsageCharts from './AppUsageCharts'
import AppUsageHeader from './AppUsageHeader'
import AppUsageMetricCards from './AppUsageMetricCards'
import AppUsageSummaryCard from './AppUsageSummaryCard'
import AppUsageTopAppsList from './AppUsageTopAppsList'
import { APP_USAGE_PURPLE } from './appUsageTheme'
import {
  buildHourlyChartPoints,
  computeDayComparison,
  computeUsageStats,
  mergeUsageRows,
  todayUsageDateString,
  yesterdayUsageDateString,
} from './appUsageUtils'

const DAILY_GOAL_SECONDS = 8 * 3600

export default function AppUsagePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usageDate, setUsageDate] = useState(todayUsageDateString())
  const [rows, setRows] = useState([])
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [yesterdayTotal, setYesterdayTotal] = useState(0)
  const [trackingSupported, setTrackingSupported] = useState(false)

  const loadUsage = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [payload, yesterdayPayload] = await Promise.all([
        getAppUsageSummary(),
        getAppUsageSummary(yesterdayUsageDateString()).catch(() => null),
      ])

      const date = payload?.usageDate || todayUsageDateString()
      let localEntries = []

      const electronApi = typeof window !== 'undefined' ? window.electronAPI : null
      if (electronApi?.getAppUsageSnapshot) {
        const status = await electronApi.getAppUsageTrackerStatus?.()
        setTrackingSupported(Boolean(status?.supported))
        const local = await electronApi.getAppUsageSnapshot()
        if (local?.usageDate === date) {
          localEntries = local.entries || []
        }
      } else {
        setTrackingSupported(false)
      }

      const merged = mergeUsageRows(payload?.data, localEntries)
      const total = merged.reduce((sum, row) => sum + row.durationSeconds, 0)

      let yTotal = 0
      if (yesterdayPayload?.data) {
        yTotal = mergeUsageRows(yesterdayPayload.data, []).reduce(
          (sum, row) => sum + row.durationSeconds,
          0,
        )
      } else if (typeof yesterdayPayload?.totalSeconds === 'number') {
        yTotal = yesterdayPayload.totalSeconds
      }

      setUsageDate(date)
      setRows(merged)
      setTotalSeconds(total)
      setYesterdayTotal(yTotal)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load app usage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsage()
    const id = window.setInterval(() => {
      void loadUsage()
    }, 30_000)
    return () => window.clearInterval(id)
  }, [loadUsage])

  const stats = useMemo(() => computeUsageStats(rows, totalSeconds), [rows, totalSeconds])
  const comparison = useMemo(
    () => computeDayComparison(totalSeconds, yesterdayTotal),
    [totalSeconds, yesterdayTotal],
  )
  const hourlyPoints = useMemo(() => buildHourlyChartPoints(totalSeconds), [totalSeconds])
  const progressPct = Math.min(100, Math.round((totalSeconds / DAILY_GOAL_SECONDS) * 100))

  return (
    <Box
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
      <AppUsageHeader loading={loading} onRefresh={() => void loadUsage()} />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 2,
          pb: 2,
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
        {loading && rows.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: APP_USAGE_PURPLE }} />
          </Box>
        ) : error ? (
          <Typography sx={{ color: '#F87171', py: 4 }}>{error}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {!trackingSupported && (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                App tracking runs in the desktop app on Windows while your project timer is ON.
              </Typography>
            )}

            <AppUsageSummaryCard
              usageDate={usageDate}
              totalSeconds={totalSeconds}
              comparison={comparison}
              progressPct={progressPct}
            />
            <AppUsageMetricCards stats={stats} />
            <AppUsageTopAppsList rows={rows} totalSeconds={totalSeconds} />
            <AppUsageCharts
              hourlyPoints={hourlyPoints}
              totalSeconds={totalSeconds}
              categories={stats.categories}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
