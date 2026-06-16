import ArrowBack from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

import ActivityCheck from './ActivityCheck'
import { BRAND_NAVY_HEX } from '../../theme/colorTokens'

export default function ActivityCheckPage() {
  const navigate = useNavigate()
  const theme = useTheme()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : alpha(BRAND_NAVY_HEX, 0.04),
        }}
      >
        <IconButton
          aria-label="Back to contracts"
          onClick={() => navigate('/home')}
          size="small"
          sx={{ color: 'text.primary' }}
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography sx={{ fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1.2 }}>
            Activity check
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Session clicks, keys & screenshots
          </Typography>
        </Box>
      </Box>

      <Box component="main" sx={{ flex: 1, px: 2, py: 2, overflow: 'auto' }}>
        <ActivityCheck />
      </Box>
    </Box>
  )
}
