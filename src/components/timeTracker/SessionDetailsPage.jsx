import ArrowBack from '@mui/icons-material/ArrowBack'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import FlagOutlined from '@mui/icons-material/FlagOutlined'
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined'
import LoginOutlined from '@mui/icons-material/LoginOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import MouseOutlined from '@mui/icons-material/MouseOutlined'
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined'
import TimerOutlined from '@mui/icons-material/TimerOutlined'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { alpha, useTheme } from '@mui/material/styles'

import { getTimerRecord } from '../../apiImportsFunctions/apiAuth'
import { getTaskStatusPresentation, getSessionStatusPillPresentation } from './taskProjectUtils'
import { sessionHistoryDurationSeconds } from './timerSessionUtils'
import { TIMER_TIME_ZONE } from './timerTimeZone'
import ThemeModeToggle from '../ThemeModeToggle'

function tileCardChrome(mode) {
  const isDark = mode === 'dark'
  return {
    boxShadow: isDark
      ? '0 4px 14px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)'
      : '0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08)',
  }
}

function iconBoxShadow(mode) {
  return mode === 'dark'
    ? '0 1px 2px rgba(0, 0, 0, 0.35)'
    : '0 1px 2px rgba(15, 23, 42, 0.08)'
}

function iconShellSx(mode, bgcolor, size = 30) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    borderRadius: '10px',
    bgcolor,
    boxShadow: iconBoxShadow(mode),
    flexShrink: 0,
  }
}

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

export default function SessionDetailsPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)

  useEffect(() => {
    const id = Number(sessionId)
    if (!id || Number.isNaN(id)) {
      setLoading(false)
      setError('Invalid session.')
      return
    }

    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      setRecord(null)
      try {
        const res = await getTimerRecord(id)
        if (cancelled) return
        const rec = res?.data ?? null
        setRecord(rec)
      } catch (err) {
        if (cancelled) return
        setError(err?.response?.data?.message || err?.message || 'Could not load this session.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <Box
      className="session-details-page"
      sx={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box
        component="header"
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
          
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <IconButton
            aria-label="Back"
            onClick={() => navigate(-1)}
            size="small"
            sx={{
              width: 36,
              height: 36,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
             
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            component="h1"
            noWrap
            sx={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.015em', }}
          >
            Session details
          </Typography>
        </Box>
        <ThemeModeToggle size="small" />
      </Box>

      <Box
        component="main"
        className="session-details-scroll-panel"
        sx={{
          flex: 1,
          minHeight: 0,
          px: 3,
          py: 3,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { width: 0, height: 0, display: 'none' },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={34} sx={{ color: 'primary.main' }} />
          </Box>
        ) : error ? (
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'error.main' }}>{error}</Typography>
        ) : record ? (
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                borderRadius: '8px',
                bgcolor: 'background.default',
                overflow: 'hidden',
              }}
            >
              {(() => {
                const startedAt = new Date(record.started_at)
                const stoppedAt = record.stopped_at ? new Date(record.stopped_at) : null
                const durationSec = sessionHistoryDurationSeconds(record) || null

                const statusText = String(record.status ?? '—')

                const tileChrome = tileCardChrome(theme.palette.mode)
                const iconMode = theme.palette.mode
                const submittedPill = getTaskStatusPresentation('submitted', iconMode)
                const statusPill = getSessionStatusPillPresentation(statusText, iconMode)

                const tileSx = {
                  borderRadius: '8px',
                  ...tileChrome,
                  bgcolor: 'background.paper',
                  px: 1.5,
                  py: 1.2,
                }

                const tileSectionSx = {
                  mt: 1.25,
                  borderRadius: '8px',
                  ...tileChrome,
                  bgcolor: 'background.paper',
                  px: 1.5,
                  py: 1.25,
                }

                const innerCardSx = {
                  borderRadius: '8px',
                  ...tileChrome,
                  bgcolor: 'background.paper',
                  px: 1.25,
                  py: 1,
                }

                const labelSx = {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  fontWeight: 650,
                }

                const valueSx = { mt: 0.35, fontSize: '0.65rem', fontWeight: 750, color: 'text.primary' }

                return (
                  <>
                    {/* Section header */}
                    <Box sx={{ px: 1, pt: 1, pb: 1.25 }}>
                      <Box
                        sx={{
                          borderRadius: '10px',
                          ...tileChrome,
                          bgcolor: 'background.paper',
                          px: 1.5,
                          py: 1.1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap:2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={iconShellSx(iconMode, 'rgba(11,77,166,0.12)', 35)}>
                            <DescriptionOutlined sx={{ fontSize: 22, color: 'primary.main' }} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              letterSpacing: '0.12em',
                              color: 'text.secondary',
                            }}
                          >
                            Session
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '1.05rem',
                              fontWeight: 900,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            #{record.id}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 999,
                            bgcolor: submittedPill.badgeBg,
                            color: submittedPill.badgeColor,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: submittedPill.badgeDot,
                              flexShrink: 0,
                            }}
                          />
                          Submitted
                        </Box>
                      </Box>
                    </Box>

                    {/* Tiles */}
                    <Box sx={{ px: 1, pb: 1 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
                        <Box sx={tileSx}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
                            <Box sx={(t) => iconShellSx(iconMode, alpha(t.palette.info.main, 0.12))}>
                              <CalendarMonthOutlined sx={{ fontSize: 18, color: 'info.main' }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ ...labelSx, gap: 0, mt: 0.05 }}>Date</Typography>
                              <Typography sx={{ ...valueSx, mt: 0.3 }}>
                                {startedAt.toLocaleDateString(undefined, dateColumnOpts)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={tileSx}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
                            <Box sx={iconShellSx(iconMode, 'rgba(11,77,166,0.12)')}>
                              <TimerOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ ...labelSx, gap: 0, mt: 0.05 }}>Duration</Typography>
                              <Typography
                                sx={{
                                  ...valueSx,
                                  mt: 0.3,
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontWeight: 800,
                                }}
                              >
                                {durationSec != null ? formatElapsed(durationSec) : '—'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={tileSx}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
                            <Box sx={(t) => iconShellSx(iconMode, alpha(t.palette.success.main, 0.12))}>
                              <LoginOutlined sx={{ fontSize: 18, color: 'success.main' }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ ...labelSx, gap: 0, mt: 0.05 }}>Check in</Typography>
                              <Typography sx={{ ...valueSx, mt: 0.3 }}>
                                {startedAt.toLocaleTimeString(undefined, timeColumnOpts)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={tileSx}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
                            <Box sx={(t) => iconShellSx(iconMode, alpha(t.palette.warning.main, 0.12))}>
                              <LogoutOutlined sx={{ fontSize: 18, color: 'warning.main' }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ ...labelSx, gap: 0, mt: 0.05 }}>Check out</Typography>
                              <Typography sx={{ ...valueSx, mt: 0.3 }}>
                                {stoppedAt && !Number.isNaN(stoppedAt.getTime())
                                  ? stoppedAt.toLocaleTimeString(undefined, timeColumnOpts)
                                  : '—'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      {/* Full-width status */}
                      <Box sx={{ mt: 1.25, ...tileSx, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, minWidth: 0 }}>
                          <Box sx={iconShellSx(iconMode, 'rgba(11,77,166,0.12)')}>
                            <FlagOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                          </Box>
                          <Typography sx={{ ...labelSx, gap: 0, mt: 0 }}>
                            Status
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 999,
                            bgcolor: statusPill.badgeBg,
                            color: statusPill.badgeColor,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: statusPill.badgeDot,
                              flexShrink: 0,
                            }}
                          />
                          {statusPill.label}
                        </Box>
                      </Box>

                      {/* Activity (Clicks / Keys) */}
                      {(() => {
                        const clicks = Math.max(0, Math.floor(Number(record.activity_click_count) || 0))
                        const keys = Math.max(0, Math.floor(Number(record.activity_keypress_count) || 0))
                        const max = Math.max(1, clicks, keys)

                        const activityCardSx = tileSectionSx

                        const progressTrackSx = {
                          height: 6,
                          borderRadius: 999,
                          bgcolor: (t) =>
                            t.palette.mode === 'dark'
                              ? 'rgba(148,163,184,0.16)'
                              : 'rgba(15,23,42,0.08)',
                        }

                        const rowSx = { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 1.25, alignItems: 'center' }

                        return (
                          <Box sx={activityCardSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Box
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 1,
                                  bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.25 : 0.18),
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 99,
                                    bgcolor: 'primary.main',
                                    opacity: 0.9,
                                  }}
                                />
                              </Box>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 750 }}>
                                Activity (Clicks / Keys)
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
                              {/* Mouse clicks */}
                              <Box sx={innerCardSx}>
                              <Box sx={rowSx}>
                                <Box sx={(t) => iconShellSx(iconMode, alpha(t.palette.secondary.main, 0.12))}>
                                  <MouseOutlined sx={{ fontSize: 18, color: 'secondary.main' }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 650 }}>
                                    Mouse Clicks
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={(clicks / max) * 100}
                                    sx={{
                                      mt: 0.6,
                                      ...progressTrackSx,
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 999,
                                        bgcolor: 'secondary.main',
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: 'text.primary' }}>
                                  {clicks}
                                </Typography>
                              </Box>
                              </Box>

                              {/* Keyboard presses */}
                              <Box sx={innerCardSx}>
                              <Box sx={rowSx}>
                                <Box sx={(t) => iconShellSx(iconMode, alpha(t.palette.info.main, 0.12))}>
                                  <KeyboardOutlined sx={{ fontSize: 18, color: 'info.main' }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 650 }}>
                                    Keyboard Presses
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={(keys / max) * 100}
                                    sx={{
                                      mt: 0.6,
                                      ...progressTrackSx,
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 999,
                                        bgcolor: 'info.main',
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: 'text.primary' }}>
                                  {keys}
                                </Typography>
                              </Box>
                              </Box>
                            </Box>
                          </Box>
                        )
                      })()}

                      {/* Memo */}
                      {(() => {
                        const memoText = record.memo && String(record.memo).trim() ? String(record.memo) : '—'
                        return (
                          <Box sx={tileSectionSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={iconShellSx(iconMode, 'rgba(11,77,166,0.12)')}>
                                <DescriptionOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                              </Box>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 750 }}>
                                Memo
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                mt: 1,
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: (t) =>
                                  t.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.06)'
                                    : '#f8fafc',
                                p: 1.25,
                                maxHeight: 140,
                                overflow: 'auto',
                                scrollbarWidth: 'thin',
                                scrollbarColor: (t) => `${t.palette.primary.main} transparent`,
                                '&::-webkit-scrollbar': {
                                  width: 8,
                                },
                                '&::-webkit-scrollbar-track': {
                                  background: 'transparent',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  backgroundColor: 'rgba(11,77,166,0.75)',
                                  borderRadius: 999,
                                  border: '2px solid transparent',
                                  backgroundClip: 'content-box',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                  backgroundColor: 'primary.main',
                                },
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: '0.875rem',
                                  fontWeight: 700,
                                  color: memoText === '—' ? 'text.disabled' : 'text.primary',
                                  whiteSpace: 'pre-wrap',
                                  lineHeight: 1.5,
                                }}
                              >
                                {memoText}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      })()}
                    </Box>
                  </>
                )
              })()}
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

