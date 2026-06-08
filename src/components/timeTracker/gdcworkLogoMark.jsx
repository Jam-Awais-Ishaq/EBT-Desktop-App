import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

import { IMAGE_URLS } from '../../constants/imageUrls'

/** Compact logo row like the reference title bar. */
export default function gdcworkLogoMark() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      component="img"
      src={isDark ? IMAGE_URLS.globalDigitalCareLogoMarkDark : IMAGE_URLS.globalDigitalCareLogoMark}
      alt="Global Digital Care"
      sx={{
        height: 32,
        width: 'auto',
        maxWidth: '100%',
        display: 'block',
        objectFit: 'contain',
      }}
    />
  )
}
