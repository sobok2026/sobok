import { Locale } from '@sobok/domain/locale'

export type SobokService = {
  name: Record<Locale, string>
  href: string
}

export const OTHER_SERVICES: SobokService[] = [
  {
    href: 'https://stella.sobok.cc',
    name: {
      [Locale.KO]: '별무리',
      [Locale.EN]: 'Stella',
      [Locale.JA]: '星屑',
      [Locale.ZH]: '星黛洛',
    },
  },
  {
    href: 'https://zwds.sobok.cc',
    name: {
      [Locale.KO]: '자미원',
      [Locale.EN]: 'Ziwei',
      [Locale.JA]: '紫微垣',
      [Locale.ZH]: '紫微垣',
    },
  },
]
