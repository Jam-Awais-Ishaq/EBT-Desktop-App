import AssignmentTurnedInOutlined from '@mui/icons-material/AssignmentTurnedInOutlined'
import ChevronRight from '@mui/icons-material/ChevronRight'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { getTimerHistory } from '../../apiImportsFunctions/apiAuth'
import { formatTotalTrackedHours } from './ProjectCurrentSession'
import {
  formatUpdatedAgo,
  getTaskStatusPresentation,
  latestActivityFromTimerHistory,
  normalizeTaskStatus,
} from './taskProjectUtils'
import { sumProjectTotalSeconds } from './timerSessionUtils'

function resolveProjectActivityAt(project, activityByProject) {
  return activityByProject[project.id] || project.updatedAt || project.createdAt || null
}

export default function TaskContractsList({ projects = [] }) {
  const theme = useTheme()
  const navigate = useNavigate()
  const authRole = useSelector((state) => state.loginForm.authRole)
  const user = useSelector((state) => state.loginForm.user)
  const activeTaskTimer = useSelector((state) => state.loginForm.activeTaskTimer)
  const role = authRole || user?.role?.toLowerCase() || null
  const isDisabled = role === 'admin' || role === 'hr'
  const [historyByProject, setHistoryByProject] = useState({})
  const [activityByProject, setActivityByProject] = useState({})
  const [liveTick, setLiveTick] = useState(0)

  const hasLiveTimer = activeTaskTimer?.running === true

  useEffect(() => {
    if (!hasLiveTimer) return undefined
    const id = window.setInterval(() => {
      setLiveTick((t) => t + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [hasLiveTimer, activeTaskTimer?.sessionId, activeTaskTimer?.running])

  useEffect(() => {
    let cancelled = false

    async function loadProjectTimerMeta() {
      if (!projects.length) {
        setHistoryByProject({})
        setActivityByProject({})
        return
      }

      const entries = await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await getTimerHistory(project.id)
            const rows = Array.isArray(response)
              ? response
              : Array.isArray(response?.data)
                ? response.data
                : []
            return [
              project.id,
              {
                rows,
                activityAt: latestActivityFromTimerHistory(response),
              },
            ]
          } catch {
            return [project.id, { rows: [], activityAt: null }]
          }
        }),
      )

      if (!cancelled) {
        setHistoryByProject(
          Object.fromEntries(entries.map(([id, meta]) => [id, meta.rows])),
        )
        setActivityByProject(
          Object.fromEntries(entries.map(([id, meta]) => [id, meta.activityAt])),
        )
      }
    }

    void loadProjectTimerMeta()
    return () => {
      cancelled = true
    }
  }, [projects, activeTaskTimer?.sessionId])

  const openProject = (projectId) => {
    if (isDisabled) return
    navigate(`/project/${projectId}`)
  }

  return (
    <Box
      sx={{
        width: 'min(100%, 560px)',
        maxWidth: 560,
        mx: 'auto',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '5px',
        overflow: 'hidden',
        boxShadow: `0 1px 2px ${alpha(theme.palette.text.primary, 0.04)}`,
      }}
    >
      {projects.map((project, index) => {
        const statusUi = getTaskStatusPresentation(project.status, theme.palette.mode)
        const isSubmitted =
          normalizeTaskStatus(project.status) === 'submitted' ||
          normalizeTaskStatus(project.status) === 'submit'
        const timerForProject =
          activeTaskTimer &&
          String(activeTaskTimer.projectId) === String(project.id)
            ? activeTaskTimer
            : null
        const trackedSec = sumProjectTotalSeconds(
          historyByProject[project.id] ?? [],
          timerForProject,
          project.id,
        )
        void liveTick

        return (
          <Box key={project.id}>
            <Box
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-disabled={isDisabled}
              onClick={() => openProject(project.id)}
              onKeyDown={(e) => {
                if (isDisabled) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openProject(project.id)
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.75,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.65 : 1,
                transition: 'background-color 0.15s ease',
                '&:hover': isDisabled
                  ? undefined
                  : {
                      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                    },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '5px',
                  bgcolor: statusUi.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isSubmitted ? (
                  <AssignmentTurnedInOutlined sx={{ fontSize: 22, color: statusUi.iconColor }} />
                ) : (
                  <DescriptionOutlined sx={{ fontSize: 22, color: statusUi.iconColor }} />
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <Typography
                  sx={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.name}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: '0.8125rem',
                    color: 'text.secondary',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatUpdatedAgo(resolveProjectActivityAt(project, activityByProject))}
                </Typography>
              </Box>

              <Typography
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 999,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: statusUi.badgeBg,
                  color: statusUi.badgeColor,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: statusUi.badgeDot,
                    flexShrink: 0,
                  }}
                />
                {statusUi.label}
              </Typography>

              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minWidth: 52,
                  textAlign: 'right',
                }}
              >
                {formatTotalTrackedHours(trackedSec)}
              </Typography>

              <ChevronRight
                sx={{
                  fontSize: 22,
                  color: isDisabled ? 'text.disabled' : 'primary.main',
                  flexShrink: 0,
                }}
              />
            </Box>

            {index < projects.length - 1 ? <Divider sx={{ borderColor: 'divider' }} /> : null}
          </Box>
        )
      })}
    </Box>
  )
}
