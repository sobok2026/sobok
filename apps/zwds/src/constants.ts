import type { Locale } from '@sobok/domain/locale'

export const ORIGIN = 'https://zwds.sobok.cc'
export const ADSENSE_ACCOUNT = 'ca-pub-5167766222238626' // keep in sync with public/ads.txt
export const GTM_ID = 'GTM-MH37D28N'
export const THEME_COLOR = '#120a10' // keep in sync with --color-background in src/app/globals.css

export const SITE_NAME = {
  ko: '자미원',
  en: 'Ziwei',
  ja: '紫微垣',
  zh: '紫微垣',
} satisfies Record<Locale, string>
