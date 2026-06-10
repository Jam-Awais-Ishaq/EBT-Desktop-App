import AnalyticsOutlined from '@mui/icons-material/AnalyticsOutlined'
import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined'
import Person from '@mui/icons-material/Person'
import Refresh from '@mui/icons-material/Refresh'
import Search from '@mui/icons-material/Search'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getProfile, getTasks } from '../../apiImportsFunctions/apiAuth'
import TaskContractsList from './TaskContractsList'
import {
  mapTaskToListItem,
  taskRowsFromApiPayload,
} from './taskProjectUtils'
import { logout as logoutAction } from '../../store/loginFormSlice'
import { BRAND_ORANGE_HEX } from '../../theme/colorTokens'
import { ThemeModeMenuToggle } from '../ThemeModeToggle'

const CRM_PROFILE_URL = 'https://gdc-crm-woad.vercel.app'
const CRM_CHATPENAL_URL = 'https://gdc-crm-woad.vercel.app'
const PAGE_SIDE_INSET = '14px'

/** Opens a CRM URL in the default browser (Electron IPC) or a new tab (web). */
async function openCrmExternalLink(url) {
  const api = typeof window !== 'undefined' ? window.electronAPI : undefined
  if (api?.openExternal) {
    try {
      await api.openExternal(url)
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function pickProfilePhotoUrl(data) {
  const url = data?.profile_image ?? data?.avatar
  return url ? String(url).trim() : ''
}

function formatShortName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'User'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
}

function profileInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function formatRoleLabel(loginUser, authRole) {
  const role = loginUser?.role || authRole || ''
  if (!role) return 'Team member'
  return String(role)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function TimeTrackerHome() {
  const theme = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loginUser = useSelector((state) => state.loginForm.user)
  const authRole = useSelector((state) => state.loginForm.authRole)
  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileCard, setProfileCard] = useState({
    name: '',
    roleLabel: '',
    photoUrl: '',
  })
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null)

  const closeProfileMenu = useCallback(() => {
    setProfileMenuAnchor(null)
  }, [])

  const openProfileMenu = useCallback((event) => {
    setProfileMenuAnchor(event.currentTarget)
  }, [])

  const loadProfile = useCallback(async () => {
    const fromLoginPhoto = pickProfilePhotoUrl(loginUser)
    const fromLoginName = loginUser?.name ? String(loginUser.name) : ''
    const fromLoginRole = formatRoleLabel(loginUser, authRole)

    setProfileCard((prev) => ({
      name: fromLoginName || prev.name,
      roleLabel: fromLoginRole || prev.roleLabel,
      photoUrl: fromLoginPhoto || prev.photoUrl,
    }))

    try {
      const data = await getProfile()
      const url = pickProfilePhotoUrl(data)
      const name = data?.name ? String(data.name) : fromLoginName
      setProfileCard({
        name,
        roleLabel: formatRoleLabel(loginUser, authRole),
        photoUrl: url || fromLoginPhoto || '',
      })
    } catch {
      /* keep login values */
    }
  }, [loginUser, authRole])

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const payload = await getTasks()
      const rows = taskRowsFromApiPayload(payload)
      setProjects(rows.map(mapTaskToListItem))
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to load tasks'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const fromLoginPhoto = pickProfilePhotoUrl(loginUser)
    const fromLoginName = loginUser?.name ? String(loginUser.name) : ''
    if (fromLoginPhoto || fromLoginName) {
      setProfileCard((prev) => ({
        name: fromLoginName || prev.name,
        roleLabel: formatRoleLabel(loginUser, authRole) || prev.roleLabel,
        photoUrl: fromLoginPhoto || prev.photoUrl,
      }))
    }
  }, [loginUser, authRole])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- initial / refreshed task list */
    void loadTasks()
    void loadProfile()
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadTasks, loadProfile])

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, search])

  const hasAnyProjects = projects.length > 0
  const hasFilteredProjects = filteredProjects.length > 0

  return (
    <Box
      className="contracts-page"
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
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            px: PAGE_SIDE_INSET,
            pt: 3,
            pb: 0,
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          All contracts
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: PAGE_SIDE_INSET,
            py: 2,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder="Search contracts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            sx={{
              flex: 1,
              minWidth: 200,
              maxWidth: '100%',
              '& .MuiOutlinedInput-root': {
                height: 40,
                borderRadius: '5px',
                bgcolor: 'background.paper',
                fontSize: '0.9375rem',
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': {
                  borderColor: alpha(theme.palette.primary.main, 0.45),
                },
                '&.Mui-focused': {
                  boxShadow: 'none',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: '2px',
                },
              },
              '& .MuiOutlinedInput-input': {
                py: 0,
                height: '100%',
                boxSizing: 'border-box',
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
          <Tooltip title="Open activity check" enterDelay={400}>
            <IconButton
              aria-label="Open activity check"
              size="small"
              onClick={() => navigate('/activity-check')}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '5px',
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                flexShrink: 0,
                color: 'primary.main',
              }}
            >
              <AnalyticsOutlined sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
          <IconButton
            aria-label="Refresh tasks"
            size="small"
            disabled={isLoading}
            onClick={() => void loadTasks()}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '5px',
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              flexShrink: 0,
            }}
          >
            <Refresh sx={{ color: 'primary.main', fontSize: 22 }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: PAGE_SIDE_INSET,
            py: 1.25,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: 'text.primary' }}>
            Contract
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: 'text.primary' }}>
            Status
          </Typography>
        </Box>

        <Box
          className="contracts-scroll-panel"
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: hasAnyProjects ? 'flex-start' : 'center',
            px: PAGE_SIDE_INSET,
            pt: hasAnyProjects && !isLoading ? 1 : 6,
            pb: hasAnyProjects && !isLoading ? 3 : 6,
            textAlign: 'center',
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: 'background.default',
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
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} sx={{ color: 'primary.main' }} />
              <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>
                Loading tasks...
              </Typography>
            </Box>
          ) : error ? (
            <Typography
              sx={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'error.main',
              }}
            >
              {error}
            </Typography>
          ) : !hasAnyProjects ? (
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 400,
                color: 'text.primary',
              }}
            >
              You have no open contracts
            </Typography>
          ) : !hasFilteredProjects ? (
            <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary' }}>
              No tasks match your search.
            </Typography>
          ) : (
            <Box sx={{ width: 'min(100%, 560px)', maxWidth: 560, mx: 'auto' }}>
              <TaskContractsList projects={filteredProjects} />
            </Box>
          )}
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          px: PAGE_SIDE_INSET,
          py: 1.25,
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
          <Box
            component="button"
            type="button"
            onClick={openProfileMenu}
            aria-label="Open profile menu"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              minWidth: 0,
              flex: 1,
              border: 'none',
              bgcolor: 'transparent',
              p: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Avatar
              src={profileCard.photoUrl || undefined}
              alt={profileCard.name || 'Profile'}
              slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
              sx={{
                width: 44,
                height: 44,
                bgcolor: BRAND_ORANGE_HEX,
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {!profileCard.photoUrl
                ? profileCard.name
                  ? profileInitials(profileCard.name)
                  : <Person sx={{ fontSize: 22 }} />
                : null}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatShortName(profileCard.name)}
              </Typography>
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profileCard.roleLabel || 'Team member'}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Open chat" enterDelay={400}>
            <IconButton
              aria-label="Open CRM chat in browser"
              onClick={() => {
                void openCrmExternalLink(CRM_CHATPENAL_URL)
              }}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: BRAND_ORANGE_HEX,
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'background.paper',
                  color: BRAND_ORANGE_HEX,
                },
              }}
            >
              <ChatBubbleOutlined sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={closeProfileMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: { mt: -0.5, minWidth: 160 },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              closeProfileMenu()
              navigate('/app-usage')
            }}
          >
            App Usage
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeProfileMenu()
              void openCrmExternalLink(CRM_PROFILE_URL)
            }}
          >
            See Profile
          </MenuItem>
          <Divider />
          <ThemeModeMenuToggle />
          <Divider />
          <MenuItem
            onClick={() => {
              closeProfileMenu()
              dispatch(logoutAction())
              navigate('/')
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}
