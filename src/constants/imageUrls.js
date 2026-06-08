/**
 * Central registry for image URLs used in the app.
 * Logo is imported with `?url` so Vite emits it under `dist/assets/` and the
 * resolved path works for Electron `file://` (same folder layout as the bundle).
 */
import globalDigitalCareLogoMark from '../assets/gdc-logo.png?url'
import globalDigitalCareLogoMarkDark from '../assets/gdc-logo-dark.png?url'

export const IMAGE_URLS = {
  globalDigitalCareLogoMark,
  globalDigitalCareLogoMarkDark,
}

/** Same asset on Cloudinary (e.g. for sharing or non-Vite tools). */
export const GLOBAL_DIGITAL_CARE_LOGO_REMOTE =
  'https://res.cloudinary.com/djnzgjkgf/image/upload/v1777703554/gdc_pdj8mm.png'
