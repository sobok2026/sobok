import { Locale } from '@sobok/domain/locale'

export const ORIGIN = 'https://zwds.sobok.cc'
export const THEME_COLOR = '#130817' // keep in sync with --color-background in src/app/globals.css

export const SITE_NAME = {
  [Locale.KO]: '자미원',
  [Locale.EN]: 'Ziwei',
  [Locale.JA]: '紫微垣',
  [Locale.ZH]: '紫微垣',
} satisfies Record<Locale, string>
