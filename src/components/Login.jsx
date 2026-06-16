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

import { BRAND_COMPANY_NAME, BRAND_SLOGAN } from '../constants/brand'

import { IMAGE_URLS } from '../constants/imageUrls'

import { useLoginForm } from '../features/login/loginFormLogic'

import { getAppColors } from '../theme/colorTokens'

import { primaryActionButtonSx } from '../theme/uiStyles'



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

            radial-gradient(ellipse 55% 50% at 100% 100%, ${alpha(c.brandOrange, 0.1)}, transparent 48%)

          `,

          pointerEvents: 'none',

        },

      }}

    >

      <Paper

        elevation={0}

        sx={{

          position: 'relative',

          zIndex: 1,

          width: '100%',

          maxWidth: 420,

          borderRadius: '6px',

          overflow: 'hidden',

          border: '1px solid',

          borderColor: alpha(c.loginPanelNavy || c.brandOrange, theme.palette.mode === 'dark' ? 0.35 : 0.12),

          boxShadow:

            theme.palette.mode === 'dark'

              ? '0 16px 48px rgba(0,0,0,0.45)'

              : '0 16px 40px rgba(30, 58, 95, 0.12)',

        }}

      >

        <Box

          sx={{

            px: 3,

            py: 3.5,

            textAlign: 'center',

            background: `linear-gradient(145deg, ${c.loginPanelNavy} 0%, ${alpha(c.loginPanelNavy, 0.88)} 100%)`,

            color: '#fff',

          }}

        >

          <Box

            component="img"

            src={IMAGE_URLS.brandAuthPanelIcon}

            alt={BRAND_COMPANY_NAME}

            sx={{

              display: 'block',

              mx: 'auto',

              width: 88,

              height: 88,

              objectFit: 'contain',

              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.25))',

            }}

          />

          <Typography

            sx={{

              mt: 1.5,

              fontWeight: 700,

              fontSize: '1.125rem',

              letterSpacing: '-0.02em',

              color: '#fff',

            }}

          >

            {BRAND_COMPANY_NAME}

          </Typography>

          <Typography

            sx={{

              mt: 0.5,

              fontSize: '0.8125rem',

              color: alpha('#ffffff', 0.82),

              letterSpacing: '0.06em',

              textTransform: 'uppercase',

            }}

          >

            {BRAND_SLOGAN}

          </Typography>

        </Box>



        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: 3, bgcolor: 'background.paper' }}>

          <Typography

            variant="body2"

            sx={{

              mb: 2.5,

              color: 'text.secondary',

              fontSize: '0.9375rem',

              lineHeight: 1.55,

              textAlign: 'center',

            }}

          >

            Sign in with your work email to open your contracts and timer.

          </Typography>



          <form onSubmit={onSubmit} noValidate>

            <Stack spacing={2}>

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

                slotProps={{

                  input: {

                    endAdornment: (

                      <InputAdornment position="end">

                        <IconButton

                          aria-label={showPassword ? 'Hide password' : 'Show password'}

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

                sx={primaryActionButtonSx(theme)}

              >

                {isLoading ? 'Signing in…' : 'Sign in'}

              </Button>

              {authError ? (

                <Alert severity="error" sx={{ borderRadius: '4px' }}>

                  {authError}

                </Alert>

              ) : null}

            </Stack>

          </form>

        </Box>

      </Paper>

    </Box>

  )

}


