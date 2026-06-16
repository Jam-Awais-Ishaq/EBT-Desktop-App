import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef } from 'react'
import { BRAND_ORANGE_HEX } from '../../theme/colorTokens'
import { proCardSx } from '../../theme/uiStyles'
import { playClockTowerChimes } from './clockChimes'
import { TIMER_TIME_ZONE } from './timerTimeZone'

/** Live counter: 00:00:00 (hours : minutes : seconds) */
export function formatLiveClock(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/** Total tracked time — hours + minutes only (no seconds), updates live with the timer. */
export function formatTotalTrackedHours(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')} hrs`
}

function formatDeadline(isoDate) {
  if (!isoDate) return '—'
  try {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: TIMER_TIME_ZONE,
    })
  } catch {
    return String(isoDate)
  }
}

export default function ProjectCurrentSession({
  elapsedSec,
  running,
  onToggle,
  disabled = false,
  deadline,
  totalTrackedSec = 0,
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accentColor = isDark ? theme.palette.common.white : theme.palette.primary.main
  const lastChimeBlockRef = useRef(-1)

  useEffect(() => {
    if (!running) {
      lastChimeBlockRef.current = -1
      return
    }
    const block = Math.floor(elapsedSec / 30)
    if (block > 0 && block !== lastChimeBlockRef.current) {
      lastChimeBlockRef.current = block
      void playClockTowerChimes()
    }
  }, [elapsedSec, running])

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        mt: 2,
        mb: 1,
        p: 2.25,
        ...proCardSx(theme),
      })}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: 'text.secondary',
              mb: 0.75,
            }}
          >
            Current Session
          </Typography>
          <Typography
            component="div"
            role="timer"
            aria-live="polite"
            sx={{
              fontSize: { xs: '2rem', sm: '2.25rem' },
              fontWeight: 700,
              color: accentColor,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontFamily: 'Calibri, "Segoe UI", sans-serif',
              fontFeatureSettings: '"zero" 0',
            }}
          >
            {formatLiveClock(elapsedSec)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            {running ? 'Online' : 'Offline'}
          </Typography>
          <Box
            component="button"
            type="button"
            disabled={disabled}
            onClick={() => onToggle?.()}
            aria-label={running ? 'Stop session timer' : 'Start session timer'}
            aria-pressed={running}
            sx={{
              position: 'relative',
              width: 72,
              height: 32,
              border: 'none',
              borderRadius: '16px',
              p: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              bgcolor: running
                ? BRAND_ORANGE_HEX
                : isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'action.disabledBackground',
              opacity: disabled ? 0.55 : 1,
              overflow: 'hidden',
              transition: 'background-color 0.2s ease',
            }}
          >
            <Typography
              component="span"
              sx={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                left: running ? 10 : 'auto',
                right: running ? 'auto' : 10,
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                lineHeight: 1,
                color: running ? '#fff' : isDark ? 'rgba(255, 255, 255, 0.55)' : 'text.secondary',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {running ? 'ON' : 'OFF'}
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                left: running ? 'auto' : 4,
                right: running ? 4 : 'auto',
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: running || !isDark ? '#fff' : 'rgba(255, 255, 255, 0.45)',
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s ease, right 0.2s ease',
                pointerEvents: 'none',
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          mt: 2.5,
        }}
      >
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          Deadline
        </Typography>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'text.primary',
            textAlign: 'right',
          }}
        >
          {formatDeadline(deadline)}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          mt: 1.25,
        }}
      >
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          Total hrs
        </Typography>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'text.primary',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTotalTrackedHours(totalTrackedSec)}
        </Typography>
      </Box>
    </Paper>
  )
}
