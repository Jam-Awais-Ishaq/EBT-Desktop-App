import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useDispatch, useSelector } from 'react-redux'
import { APP_COLOR_MODE } from '../theme/colorTokens'
import { toggleThemeMode } from '../store/themeModeSlice'

export default function ThemeModeToggle({ size = 'small' }) {
  const mode = useSelector((s) => s.themeMode.mode)
  const dispatch = useDispatch()
  const isDark = mode === APP_COLOR_MODE.DARK

  return (
    <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} enterDelay={400}>
      <IconButton
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => dispatch(toggleThemeMode())}
        size={size}
        sx={{
          color: 'text.primary',
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'primary.main',
            color: 'primary.main',
          },
        }}
      >
        {isDark ? (
          <LightModeOutlined sx={{ fontSize: 22 }} />
        ) : (
          <DarkModeOutlined sx={{ fontSize: 22 }} />
        )}
      </IconButton>
    </Tooltip>
  )
}
