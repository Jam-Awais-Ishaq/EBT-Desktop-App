import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import { useDispatch, useSelector } from 'react-redux'
import { APP_COLOR_MODE } from '../theme/colorTokens'
import { toggleThemeMode } from '../store/themeModeSlice'

/** Dark/light switch for profile menu — single theme control for the whole app. */
export function ThemeModeMenuToggle() {
  const mode = useSelector((s) => s.themeMode.mode)
  const dispatch = useDispatch()
  const isDark = mode === APP_COLOR_MODE.DARK

  const handleToggle = (event) => {
    event.stopPropagation()
    dispatch(toggleThemeMode())
  }

  return (
    <MenuItem
      dense
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      sx={{ cursor: 'default', '&:hover': { bgcolor: 'action.hover' } }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <DarkModeOutlined fontSize="small" />
      </ListItemIcon>
      <ListItemText primary="Dark mode" />
      <Switch
        edge="end"
        size="small"
        checked={isDark}
        onChange={handleToggle}
        onClick={(event) => event.stopPropagation()}
        inputProps={{ 'aria-label': 'Toggle dark mode' }}
      />
    </MenuItem>
  )
}
