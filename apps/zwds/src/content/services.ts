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
    href: 'https://vibe.sobok.cc',
    name: {
      [Locale.KO]: '결타레',
      [Locale.EN]: 'vibe',
      [Locale.JA]: 'vibe',
      [Locale.ZH]: 'vibe',
    },
  },
]
