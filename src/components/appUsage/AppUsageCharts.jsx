import Box from '@mui/material/Box'

import Typography from '@mui/material/Typography'

import { alpha, useTheme } from '@mui/material/styles'



import { APP_USAGE_PURPLE } from './appUsageTheme'

import { formatTotalUsageLabel, formatUsageHm } from './appUsageUtils'



function UsageAreaChart({ hourlyPoints, totalSeconds }) {

  const w = 320

  const h = 120

  const max = Math.max(...hourlyPoints, 1)

  const step = w / 23



  const coords = hourlyPoints.map((v, i) => {

    const x = i * step

    const y = h - (v / max) * (h - 8) - 4

    return [x, y]

  })



  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const area = `${line} L${w},${h} L0,${h} Z`



  const labels = ['12 AM', '6 AM', '12 PM', '6 PM', '12 AM']



  return (

    <Box>

      <svg viewBox={`0 0 ${w} ${h + 24}`} width="100%" height={144} aria-hidden>

        <defs>

          <linearGradient id="usageAreaGrad" x1="0" y1="0" x2="0" y2="1">

            <stop offset="0%" stopColor={APP_USAGE_PURPLE} stopOpacity="0.45" />

            <stop offset="100%" stopColor={APP_USAGE_PURPLE} stopOpacity="0" />

          </linearGradient>

        </defs>

        <path d={area} fill="url(#usageAreaGrad)" />

        <path d={line} fill="none" stroke={APP_USAGE_PURPLE} strokeWidth="2.5" strokeLinecap="round" />

        {coords.length > 0 ? (

          <circle

            cx={coords[coords.length - 1][0]}

            cy={coords[coords.length - 1][1]}

            r="4"

            fill={APP_USAGE_PURPLE}

          />

        ) : null}

      </svg>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, mt: -0.5 }}>

        {labels.map((label) => (

          <Typography key={label} sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>

            {label}

          </Typography>

        ))}

      </Box>

      <Typography sx={{ fontSize: '0.75rem', color: APP_USAGE_PURPLE, fontWeight: 700, mt: 0.5 }}>

        {formatTotalUsageLabel(totalSeconds)} today

      </Typography>

    </Box>

  )

}



function CategoriesDonut({ categories, totalSeconds }) {

  const theme = useTheme()

  const size = 100

  const stroke = 14

  const r = (size - stroke) / 2

  const c = 2 * Math.PI * r

  let offset = 0

  const trackStroke = alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.1)



  const segments =

    totalSeconds > 0

      ? categories.map((cat) => {

          const dash = (cat.seconds / totalSeconds) * c

          const seg = { ...cat, dash, gap: c - dash, offset }

          offset += dash

          return seg

        })

      : []



  return (

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

      <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>

          <circle

            cx={size / 2}

            cy={size / 2}

            r={r}

            fill="none"

            stroke={trackStroke}

            strokeWidth={stroke}

          />

          {segments.map((seg) => (

            <circle

              key={seg.name}

              cx={size / 2}

              cy={size / 2}

              r={r}

              fill="none"

              stroke={seg.color}

              strokeWidth={stroke}

              strokeDasharray={`${seg.dash} ${seg.gap}`}

              strokeDashoffset={-seg.offset}

              transform={`rotate(-90 ${size / 2} ${size / 2})`}

            />

          ))}

        </svg>

      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>

        {categories.slice(0, 4).map((cat) => (

          <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>

            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />

            <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', flex: 1 }} noWrap>

              {cat.name}

            </Typography>

            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', flexShrink: 0 }}>

              {formatUsageHm(cat.seconds)} ({cat.pct}%)

            </Typography>

          </Box>

        ))}

      </Box>

    </Box>

  )

}



const cardSx = {

  borderRadius: '16px',

  bgcolor: 'background.default',

  border: 1,

  borderColor: 'divider',

  p: 1.75,

}



export default function AppUsageCharts({ hourlyPoints, totalSeconds, categories }) {

  return (

    <Box

      sx={{

        display: 'grid',

        gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' },

        gap: 1.25,

      }}

    >

      <Box sx={cardSx}>
        <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9375rem', mb: 1.5 }}>
          Usage Over Time
        </Typography>
        <UsageAreaChart hourlyPoints={hourlyPoints} totalSeconds={totalSeconds} />

      </Box>



      <Box sx={cardSx}>

        <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9375rem', mb: 1.5 }}>

          Categories

        </Typography>

        <CategoriesDonut categories={categories} totalSeconds={totalSeconds} />

      </Box>

    </Box>

  )

}

