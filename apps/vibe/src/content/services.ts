import type { Locale } from '@sobok/domain/locale'

export type SobokService = {
  name: Record<Locale, string>
  href: string
}

export const OTHER_SERVICES: SobokService[] = [
  {
    href: 'https://stella.sobok.cc',
    name: {
      ko: '별무리',
      en: 'Stella',
      ja: '星屑',
      zh: '星黛洛',
    },
  },
  {
    href: 'https://zwds.sobok.cc',
    name: {
      ko: '자미원',
      en: 'Ziwei',
      ja: '紫微垣',
      zh: '紫微垣',
    },
  },
]
