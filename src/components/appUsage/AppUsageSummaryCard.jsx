import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined'

import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'

import TrendingUp from '@mui/icons-material/TrendingUp'

import Box from '@mui/material/Box'

import Typography from '@mui/material/Typography'

import { useTheme } from '@mui/material/styles'



import { APP_USAGE_PURPLE, APP_USAGE_PURPLE_GLOW, APP_USAGE_PURPLE_SOFT } from './appUsageTheme'

import { formatTotalUsageLabel } from './appUsageUtils'



export default function AppUsageSummaryCard({

  usageDate,

  totalSeconds,

  comparison,

  progressPct,

}) {

  const theme = useTheme()

  const ringPct = Math.min(100, Math.max(0, progressPct))

  const cardBg = theme.palette.background.default



  return (

    <Box

      sx={{
        mt: '10px',
        borderRadius: '16px',

        bgcolor: cardBg,

        border: 1,

        borderColor: 'divider',

        p: 2,

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'space-between',

        gap: 2,

        boxShadow:

          theme.palette.mode === 'dark' ? `0 0 40px ${APP_USAGE_PURPLE_GLOW}` : 'none',

      }}

    >

      <Box sx={{ minWidth: 0, flex: 1 }}>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>

          <CalendarTodayOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />

          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>

            Today • {usageDate}

          </Typography>

        </Box>

        <Typography

          sx={{

            fontSize: { xs: '1.75rem', sm: '2rem' },

            fontWeight: 800,

            color: 'text.primary',

            lineHeight: 1.1,

            mb: 1,

          }}

        >

          {formatTotalUsageLabel(totalSeconds)}{' '}

          <Typography

            component="span"

            sx={{ fontSize: '0.55em', fontWeight: 600, color: 'text.secondary' }}

          >

            Total Usage

          </Typography>

        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

          <TrendingUp sx={{ fontSize: 16, color: comparison.up ? 'success.main' : 'error.main' }} />

          <Typography

            sx={{

              fontSize: '0.8125rem',

              fontWeight: 600,

              color: comparison.up ? 'success.main' : 'error.main',

            }}

          >

            {comparison.up ? '+' : '-'}

            {comparison.pct}% vs yesterday

          </Typography>

        </Box>

      </Box>



      <Box sx={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>

        <Box

          sx={{

            position: 'absolute',

            inset: 0,

            borderRadius: '50%',

            background: `conic-gradient(${APP_USAGE_PURPLE} ${ringPct * 3.6}deg, ${APP_USAGE_PURPLE_SOFT} 0)`,

            mask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))',

            WebkitMask:

              'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))',

          }}

        />

        <Box

          sx={{

            position: 'absolute',

            inset: 10,

            borderRadius: '50%',

            bgcolor: cardBg,

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

          }}

        >

          <ScheduleOutlined sx={{ fontSize: 28, color: APP_USAGE_PURPLE }} />

        </Box>

      </Box>

    </Box>

  )

}

