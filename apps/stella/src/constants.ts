import { Locale } from '@sobok/domain/locale'

export const ORIGIN = 'https://stella.sobok.cc'
export const ADSENSE_ACCOUNT = 'ca-pub-5167766222238626' // keep in sync with public/ads.txt
export const GTM_ID = 'GTM-MH37D28N'
export const GTM_SCRIPT_URL = `${ORIGIN}/h8ou/gtm.js`
export const THEME_COLOR = '#0a0618' // keep in sync with --color-background in src/app/globals.css
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export const SITE_NAME = {
  [Locale.KO]: '별무리',
  [Locale.EN]: 'Stella',
  [Locale.JA]: '星屑',
  [Locale.ZH]: '星黛洛',
} satisfies Record<Locale, string>
