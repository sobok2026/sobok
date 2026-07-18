import { Locale } from '@sobok/domain/locale'

export type SobokService = {
  name: Record<Locale, string>
  href: string
}

export const OTHER_SERVICES: SobokService[] = [
  {
    href: 'https://zwds.sobok.cc',
    name: {
      [Locale.KO]: '자미원',
      [Locale.EN]: 'Ziwei',
      [Locale.JA]: '紫微垣',
      [Locale.ZH]: '紫微垣',
    },
  },
  {
    href: 'https://vibe.sobok.cc',
    name: {
      [Locale.KO]: '결타레',
      [Locale.EN]: 'vibe',
      [Locale.JA]: 'vibe',
      [Locale.ZH]: 'vibe',
    },
  },
]
