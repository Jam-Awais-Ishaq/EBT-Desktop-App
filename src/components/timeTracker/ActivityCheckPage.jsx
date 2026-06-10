import ArrowBack from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'

import ActivityCheck from './ActivityCheck'

export default function ActivityCheckPage() {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 1,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <IconButton
            aria-label="Back to contracts"
            onClick={() => navigate('/home')}
            size="small"
            sx={{ color: 'text.primary' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>Activity check</Typography>
        </Box>
      </Box>

      <Box component="main" sx={{ flex: 1, px: 3, py: 2, overflow: 'auto', bgcolor: 'background.default' }}>
        <ActivityCheck />
      </Box>
    </Box>
  )
}
