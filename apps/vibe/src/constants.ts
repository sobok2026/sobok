import { Locale } from '@sobok/domain/locale'

export const ADSENSE_ACCOUNT = 'ca-pub-5167766222238626' // keep in sync with public/ads.txt
export const ORIGIN = 'https://vibe.sobok.cc'
export const GTM_ID = 'GTM-MH37D28N'
export const GTM_SCRIPT_URL = `${ORIGIN}/h8ou/gtm.js`
export const LEGAL_CONTACT_EMAIL = 'sobok2026@gmail.com'
export const THEME_COLOR = '#fdfaf6' // keep in sync with --page-bg in src/app/globals.css
export const TURNSTILE_SITE_KEY = '0x4AAAAAAD4PMlYswKn24d0_'

export const SITE_NAME = {
  [Locale.KO]: '결타레',
  [Locale.EN]: 'vibe',
  [Locale.JA]: 'vibe',
  [Locale.ZH]: 'vibe',
} satisfies Record<Locale, string>
