/**
 * Central registry for image URLs used in the app.
 * Light logo: bundled asset (works with Electron `file://`).
 * Dark logo: `public/gdc_black.png` (copied to dist root on build).
 */
import globalDigitalCareLogoMark from '../assets/gdc-logo.png?url'

const publicAsset = (name) => `${import.meta.env.BASE_URL}${name}`

export const IMAGE_URLS = {
  globalDigitalCareLogoMark,
  globalDigitalCareLogoMarkDark: publicAsset('gdc_black.png'),
}

/** Same asset on Cloudinary (e.g. for sharing or non-Vite tools). */
export const GLOBAL_DIGITAL_CARE_LOGO_REMOTE =
  'https://res.cloudinary.com/djnzgjkgf/image/upload/v1777703554/gdc_pdj8mm.png'
