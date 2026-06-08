import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import AppsOutlined from '@mui/icons-material/AppsOutlined'
import CategoryOutlined from '@mui/icons-material/CategoryOutlined'
import TrackChangesOutlined from '@mui/icons-material/TrackChangesOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { formatUsageHm } from './appUsageUtils'

function MetricCard({ icon, iconBg, label, value, sub }) {
  return (
    <Box
      sx={{
        flex: '1 1 calc(50% - 6px)',
        minWidth: 0,
        borderRadius: '14px',
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minHeight: 40 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '1.375rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1 }}>
            {sub}
          </Typography>
        </Box>
      </Box>
      <Typography
        sx={{
          fontSize: '0.6875rem',
          color: 'text.secondary',
          textTransform: 'capitalize',
          textAlign: 'center',
          width: '100%',
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

export default function AppUsageMetricCards({ stats }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
      <MetricCard
        icon={<AccessTimeOutlined sx={{ fontSize: 18, color: '#A78BFA' }} />}
        iconBg="rgba(124, 58, 237, 0.2)"
        label="Productive"
        value={`${stats.productivePct}%`}
        sub={formatUsageHm(stats.productiveSec)}
      />
      <MetricCard
        icon={<AppsOutlined sx={{ fontSize: 18, color: '#4ADE80' }} />}
        iconBg="rgba(34, 197, 94, 0.15)"
        label="Apps Used"
        value={String(stats.appsUsed)}
        sub="Today"
      />
      <MetricCard
        icon={<CategoryOutlined sx={{ fontSize: 18, color: '#FB923C' }} />}
        iconBg="rgba(249, 115, 22, 0.15)"
        label="Categories"
        value={String(stats.categoryCount)}
        sub="Today"
      />
      <MetricCard
        icon={<TrackChangesOutlined sx={{ fontSize: 18, color: '#60A5FA' }} />}
        iconBg="rgba(59, 130, 246, 0.15)"
        label="Focus Score"
        value={String(stats.focusScore)}
        sub={stats.focusLabel}
      />
    </Box>
  )
}
