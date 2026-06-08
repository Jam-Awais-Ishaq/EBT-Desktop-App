import ArrowBack from '@mui/icons-material/ArrowBack'
import Refresh from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'

import ThemeModeToggle from '../ThemeModeToggle'

export default function AppUsageHeader({ loading, onRefresh }) {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        px: 2,
        pt: 1.5,
        pb: 1.5,
        flexShrink: 0,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <IconButton
          aria-label="Back to home"
          onClick={() => navigate('/home')}
          size="small"
          sx={{ color: 'text.primary', ml: -0.5 }}
        >
          <ArrowBack sx={{ fontSize: 22 }} />
        </IconButton>
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: 'text.primary' }}>
          App Usage
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <IconButton
          aria-label="Refresh app usage"
          onClick={onRefresh}
          disabled={loading}
          size="small"
          sx={{
            color: 'text.secondary',
            border: 1,
            borderColor: 'divider',
            borderRadius: '10px',
            width: 36,
            height: 36,
          }}
        >
          <Refresh sx={{ fontSize: 18 }} />
        </IconButton>
        <ThemeModeToggle />
      </Box>
    </Box>
  )
}
