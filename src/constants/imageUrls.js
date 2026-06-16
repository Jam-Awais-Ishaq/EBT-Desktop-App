/**
 * Central registry for image URLs used in the app.
 * Assets live in `public/` (works with Electron `file://` in production).
 */
const publicAsset = (name) => `${import.meta.env.BASE_URL}${name}`

export const IMAGE_URLS = {
  brandIcon: publicAsset('brand-logo.png'),
  brandLogoLight: publicAsset('EBT.lightLogo.png'),
  brandLogoDark: publicAsset('EBT.darkLogo.png'),
  brandAuthPanelIcon: publicAsset('brand/brand-logo-auth-panel.png'),
}

/** @deprecated use brandLogoLight / brandLogoDark */
export const brandWordmarkLight = IMAGE_URLS.brandLogoLight
/** @deprecated use brandLogoDark */
export const brandWordmarkDark = IMAGE_URLS.brandLogoDark
