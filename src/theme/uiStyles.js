import { alpha } from '@mui/material/styles'

import { BRAND_NAVY_HEX, BRAND_ORANGE_HEX } from './colorTokens'

/** Elevated surface card used across tracker screens. */
export function proCardSx(theme) {
  const isDark = theme.palette.mode === 'dark'
  return {
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: isDark ? alpha('#ffffff', 0.1) : alpha(BRAND_NAVY_HEX, 0.08),
    borderRadius: '6px',
    boxShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.35)'
      : '0 4px 20px rgba(30, 58, 95, 0.08)',
    overflow: 'hidden',
  }
}

/** Compact toolbar icon button (search row actions). */
export function toolbarIconButtonSx(theme) {
  return {
    width: 42,
    height: 42,
    borderRadius: '6px',
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    color: 'primary.main',
    flexShrink: 0,
    transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
    '&:hover': {
      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
      borderColor: alpha(theme.palette.primary.main, 0.45),
    },
    '&:active': {
      transform: 'scale(0.97)',
    },
  }
}

/** Section label — uppercase, readable contrast. */
export const sectionLabelSx = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
}

/** Primary CTA — always readable label, even when disabled. */
export function primaryActionButtonSx(theme) {
  return {
    py: 1.35,
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '0.9375rem',
    boxShadow: `0 4px 14px ${alpha(BRAND_ORANGE_HEX, 0.35)}`,
    '&:hover': {
      boxShadow: `0 6px 18px ${alpha(BRAND_ORANGE_HEX, 0.42)}`,
    },
    '&.Mui-disabled': {
      opacity: 1,
      color: '#ffffff',
      bgcolor: alpha(BRAND_ORANGE_HEX, 0.38),
      boxShadow: 'none',
    },
  }
}

/** Top app chrome strip (logo + title). */
export function appChromeHeaderSx(theme) {
  const isDark = theme.palette.mode === 'dark'
  return {
    px: 2,
    py: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: isDark ? 'background.paper' : alpha(BRAND_NAVY_HEX, 0.03),
    flexShrink: 0,
  }
}
