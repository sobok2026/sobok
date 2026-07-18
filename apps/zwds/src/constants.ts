import { Locale } from '@sobok/domain/locale'

export const ORIGIN = 'https://zwds.sobok.cc'
export const ADSENSE_ACCOUNT = 'ca-pub-5167766222238626' // keep in sync with public/ads.txt
export const GTM_ID = 'GTM-MH37D28N'
export const GTM_SCRIPT_URL = `${ORIGIN}/h8ou/gtm.js` // first-party proxy (same edge route as stella/vibe)
export const THEME_COLOR = '#120a10' // keep in sync with --color-background in src/app/globals.css

export const SITE_NAME = {
  [Locale.KO]: '자미원',
  [Locale.EN]: 'Ziwei',
  [Locale.JA]: '紫微垣',
  [Locale.ZH]: '紫微垣',
} satisfies Record<Locale, string>
