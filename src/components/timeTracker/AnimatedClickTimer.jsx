import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { APP_COLOR_MODE, getAppColors } from '../../theme/colorTokens'
import { playClockTowerChimes } from './clockChimes'

function formatParts(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  }
}

export default function AnimatedClickTimer({
  elapsedSec,
  running,
  onToggle,
  disabled = false,
}) {
  const mode = useSelector((s) => s.themeMode.mode)
  const c = getAppColors(mode)
  const isDark = mode === APP_COLOR_MODE.DARK
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

  const { h, m, s } = formatParts(elapsedSec)
  const digitColor = running ? c.timerDigit : c.timerDigitIdle
  const glow = alpha(c.brandOrangeLight, isDark ? 0.55 : 0.4)

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        borderRadius: 2,
        overflow: 'hidden',
        border: `3px solid ${c.timerShellBorder}`,
        bgcolor: c.timerShell,
        boxShadow: isDark
          ? `0 0 0 1px rgba(0,0,0,0.6), 0 18px 40px -12px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.85)`
          : `0 2px 8px ${alpha('#000', 0.06)}, 0 12px 28px -8px ${alpha(c.brandOrange, 0.15)}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1.25,
          borderBottom: `2px solid ${c.timerShellBorder}`,
          bgcolor: c.timerHeaderBg,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: c.timerLabel,
            textTransform: 'uppercase',
          }}
        >
          Session timer
        </Typography>
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 800,
            fontSize: '0.6875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: running ? c.timerLiveText : c.textSecondary,
            bgcolor: running ? c.timerLiveBg : alpha(c.textPrimary, isDark ? 0.15 : 0.08),
            boxShadow: running ? `0 0 18px ${alpha(c.timerLiveBg, 0.55)}` : 'none',
          }}
          role="status"
          aria-live="polite"
        >
          {running ? 'Live' : 'Idle'}
        </Box>
      </Box>

      <Stack spacing={2} sx={{ px: 2, py: 2.25, bgcolor: c.timerShell }}>
        <Box
          sx={{
            borderRadius: 1.5,
            px: 2,
            py: 2.25,
            bgcolor: c.timerDisplayBg,
            border: `2px solid ${alpha(c.timerShellBorder, 0.85)}`,
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.65)',
          }}
        >
          <Box
            component="div"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.5, sm: 0.75 },
              fontFamily:
                'ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {[
              { label: 'Hours', value: h },
              { label: 'Minutes', value: m },
              { label: 'Seconds', value: s },
            ].map((part, i) => (
              <Box
                key={part.label}
                sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 0.75 } }}
              >
                {i > 0 ? (
                  <Typography
                    component="span"
                    aria-hidden
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      fontWeight: 800,
                      color: running ? c.timerDigit : c.textMuted,
                      lineHeight: 1,
                      opacity: running ? 0.95 : 0.45,
                    }}
                  >
                    :
                  </Typography>
                ) : null}
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3.125rem' },
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    color: digitColor,
                    textShadow: running ? `0 0 22px ${glow}, 0 0 10px ${glow}` : 'none',
                    transition: 'color 0.2s ease, text-shadow 0.2s ease',
                  }}
                >
                  {part.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {running ? (
          <Button
            type="button"
            variant="contained"
            size="large"
            fullWidth
            disabled={disabled}
            onClick={onToggle}
            aria-label="Stop session timer"
            disableElevation
            sx={{
              py: 1.75,
              borderRadius: 1,
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              bgcolor: c.timerStopBg,
              color: c.timerStopText,
              border: `3px solid ${c.timerStopBorder}`,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(254, 202, 202, 0.25)',
                border: isDark ? `3px solid rgba(255, 255, 255, 0.55)` : `3px solid #fca5a5`,
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                bgcolor: isDark ? alpha('#000', 0.25) : 'rgba(254, 202, 202, 0.35)',
                border: isDark ? `3px solid ${c.borderSubtle}` : '3px solid rgba(248, 113, 113, 0.65)',
                color: isDark ? c.textMuted : '#7f1d1d',
                opacity: 1,
              },
            }}
          >
            Stop session
          </Button>
        ) : (
          <Button
            type="button"
            variant="contained"
            size="large"
            fullWidth
            disabled={disabled}
            onClick={onToggle}
            aria-label="Start session timer"
            disableElevation
            sx={{
              py: 1.75,
              borderRadius: 1,
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              bgcolor: c.timerStartBg,
              color: c.timerStartText,
              border: `3px solid ${c.timerStartBorder}`,
              '&:hover': {
                bgcolor: c.timerStartHover,
                border: `3px solid ${c.brandOrangeDark}`,
                boxShadow: `0 0 0 1px ${alpha('#000', 0.12)}, 0 8px 24px ${alpha(c.brandOrange, 0.45)}`,
              },
              '&.Mui-disabled': {
                bgcolor: alpha(c.textMuted, 0.35),
                color: c.textPrimary,
                border: `3px solid ${c.borderSubtle}`,
              },
            }}
          >
            Start session
          </Button>
        )}

        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: c.textMuted,
            lineHeight: 1.5,
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          Chimes every 30s while recording (automatic).
        </Typography>
      </Stack>
    </Box>
  )
}
