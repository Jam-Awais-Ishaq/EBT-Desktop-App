import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Placeholder when there are no contracts (no mock rows). */
export default function EmptyContractsIllustration() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        py: 2,
      }}
    >
      <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>
        No contracts to show.
      </Typography>
    </Box>
  )
}
