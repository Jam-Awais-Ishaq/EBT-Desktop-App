import MoreVert from '@mui/icons-material/MoreVert'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useState } from 'react'

import { formatAppUsageStartTime, formatUsageHm } from './appUsageUtils'

function AppRow({ row, totalSeconds, maxSeconds }) {
  const theme = useTheme()
  const [menuAnchor, setMenuAnchor] = useState(null)
  const pct = totalSeconds > 0 ? Math.round((row.durationSeconds / totalSeconds) * 100) : 0
  const barPct = maxSeconds > 0 ? (row.durationSeconds / maxSeconds) * 100 : 0
  const trackBg = alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.1)
  const startTimeLabel = formatAppUsageStartTime(row.startedAtMs)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 1.25,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: `${row.color}22`,
          border: `1px solid ${row.color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '0.875rem',
          fontWeight: 700,
          color: row.color,
        }}
      >
        {row.icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9375rem' }} noWrap>
            {row.appName}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', flexShrink: 0 }}>
            {formatUsageHm(row.durationSeconds)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.category}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
          <Box
            sx={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              bgcolor: trackBg,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${Math.min(100, barPct)}%`,
                height: '100%',
                borderRadius: 999,
                bgcolor: row.color,
              }}
            />
          </Box>
          <Typography
            sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 28, textAlign: 'right' }}
          >
            {pct}%
          </Typography>
        </Box>
      </Box>

      <IconButton
        size="small"
        sx={{ color: 'text.secondary', flexShrink: 0 }}
        aria-label={`${row.appName} options`}
        aria-controls={menuAnchor ? `${row.appName}-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={menuAnchor ? 'true' : undefined}
        onClick={(event) => setMenuAnchor(event.currentTarget)}
      >
        <MoreVert sx={{ fontSize: 18 }} />
      </IconButton>

      <Menu
        id={`${row.appName}-menu`}
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 220,
              mt: 0.5,
              borderRadius: '12px',
            },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important', cursor: 'default', py: 1.25 }}>
          <Box>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.25 }}>
              Started using at
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
              {startTimeLabel || 'Not recorded yet'}
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default function AppUsageTopAppsList({ rows, totalSeconds }) {
  const maxSeconds = rows.reduce((m, r) => Math.max(m, r.durationSeconds), 1)

  return (
    <Box
      sx={{
        borderRadius: '16px',
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 1.75,
          pt: 1.5,
          pb: 0.5,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9375rem' }}>Top Apps</Typography>
      </Box>
      <Box sx={{ px: 1.75, pb: 0.5 }}>
        {rows.length === 0 ? (
          <Typography sx={{ py: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
            No application usage recorded yet today.
          </Typography>
        ) : (
          rows.slice(0, 8).map((row) => (
            <AppRow key={row.appName} row={row} totalSeconds={totalSeconds} maxSeconds={maxSeconds} />
          ))
        )}
      </Box>
    </Box>
  )
}
