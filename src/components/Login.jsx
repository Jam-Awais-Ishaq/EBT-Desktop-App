import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IMAGE_URLS } from '../constants/imageUrls'
import { useLoginForm } from '../features/login/loginFormLogic'
import ThemeModeToggle from './ThemeModeToggle'
import { getAppColors } from '../theme/colorTokens'

const squareControlSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 0.5 },
}

export default function Login() {
  const theme = useTheme()
  const navigate = useNavigate()
  const mode = useSelector((s) => s.themeMode.mode)
  const c = getAppColors(mode)
  const isAuthenticated = useSelector((s) => s.loginForm.isAuthenticated)
  const {
    email,
    emailError,
    password,
    authError,
    isLoading,
    showPassword,
    onEmailChange,
    onEmailBlur,
    onPasswordChange,
    onToggleShowPassword,
    onSubmit,
  } = useLoginForm()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(168deg, ${c.loginGradientTop} 0%, ${c.loginGradientMid} 45%, ${c.loginGradientDeep} 100%),
            radial-gradient(ellipse 85% 65% at 50% -15%, ${c.loginRadial}, transparent 52%),
            radial-gradient(ellipse 55% 50% at 100% 100%, ${alpha(c.brandOrange, 0.08)}, transparent 48%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2,
        }}
      >
        <ThemeModeToggle />
      </Box>

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 1,
          border: '1px solid',
          borderColor: alpha(c.brandOrange, theme.palette.mode === 'dark' ? 0.35 : 0.22),
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          spacing={2}
          sx={{ mb: 3.5, width: '100%', textAlign: 'center', alignItems: 'center' }}
        >
          <Box
            component="img"
            src={IMAGE_URLS.globalDigitalCareLogoMark}
            alt=""
            sx={{
              display: 'block',
              mx: 'auto',
              width: '100%',
              maxWidth: 220,
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              width: '100%',
              maxWidth: 320,
              fontSize: '0.875rem',
              lineHeight: 1.55,
            }}
          >
            Enter your email and password to continue.
          </Typography>
        </Stack>

        <form onSubmit={onSubmit} noValidate>
          <Stack spacing={2.25}>
            <TextField
              fullWidth
              required
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={onEmailChange}
              onBlur={onEmailBlur}
              error={Boolean(emailError)}
              helperText={emailError || ' '}
              sx={squareControlSx}
            />
            <TextField
              fullWidth
              required
              id="password"
              name="password"
              label="Password"
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={onPasswordChange}
              sx={squareControlSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        onClick={onToggleShowPassword}
                        edge="end"
                        type="button"
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{ mt: 1, py: 1.25, borderRadius: 0.5 }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            {authError ? (
              <Alert severity="error" sx={{ borderRadius: 0.5 }}>
                {authError}
              </Alert>
            ) : null}
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
