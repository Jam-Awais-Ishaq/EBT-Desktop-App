import { alpha, createTheme } from '@mui/material/styles'
import { APP_COLOR_MODE, getAppColors } from './colorTokens'

/**
 * MUI theme built from global {@link getAppColors} tokens.
 * @param {'light'|'dark'} mode
 */
export function createAppTheme(mode) {
  const m = mode === APP_COLOR_MODE.DARK ? APP_COLOR_MODE.DARK : APP_COLOR_MODE.LIGHT
  const c = getAppColors(m)
  const isDark = m === APP_COLOR_MODE.DARK

  return createTheme({
    palette: {
      mode: m,
      primary: {
        main: c.brandOrange,
        dark: c.brandOrangeDark,
        light: c.brandOrangeLight,
        contrastText: isDark ? '#000000' : '#ffffff',
      },
      secondary: {
        main: c.textSecondary,
        contrastText: isDark ? '#1a1a1a' : '#ffffff',
      },
      background: {
        default: c.backgroundDefault,
        paper: c.backgroundPaper,
      },
      text: {
        primary: c.textPrimary,
        secondary: c.textSecondary,
        disabled: alpha(c.textPrimary, isDark ? 0.38 : 0.45),
      },
      divider: c.divider,
      error: {
        main: '#dc2626',
      },
      success: {
        main: '#16a34a',
        light: '#22c55e',
        dark: '#15803d',
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily:
        '"DM Sans", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
      h1: {
        fontSize: '1.75rem',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1.2,
      },
      body2: {
        fontSize: '0.9375rem',
        lineHeight: 1.5,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            backgroundColor: c.backgroundDefault,
            color: c.textPrimary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9375rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            background: `linear-gradient(180deg, ${c.brandOrangeLight} 0%, ${c.brandOrange} 100%)`,
            '&:hover': {
              background: `linear-gradient(180deg, ${c.brandOrange} 0%, ${c.brandOrangeDark} 100%)`,
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? c.backgroundElevated : alpha(c.backgroundElevated, 0.65),
            transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
            '&:hover': {
              backgroundColor: isDark ? '#434347' : alpha('#000000', 0.03),
            },
            '&.Mui-focused': {
              backgroundColor: c.backgroundPaper,
              boxShadow: `0 0 0 3px ${c.focusRing}`,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: c.borderSubtle,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(c.brandOrange, isDark ? 0.45 : 0.35),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1px',
              borderColor: c.brandOrange,
            },
          },
          input: {
            paddingTop: '14px',
            paddingBottom: '14px',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            '&.Mui-focused': {
              color: c.brandOrange,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  })
}
