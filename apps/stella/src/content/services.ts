import type { Locale } from '@sobok/domain/locale'

export type SobokService = {
  name: Record<Locale, string>
  href: string
}

export const OTHER_SERVICES: SobokService[] = [
  {
    href: 'https://zwds.sobok.cc',
    name: {
      ko: '자미원',
      en: 'Ziwei',
      ja: '紫微垣',
      zh: '紫微垣',
    },
  },
  {
    href: 'https://vibe.sobok.cc',
    name: {
      ko: '결타레',
      en: 'vibe',
      ja: 'vibe',
      zh: 'vibe',
    },
  },
]
