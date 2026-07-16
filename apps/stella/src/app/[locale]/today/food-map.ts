import { Locale } from '@sobok/domain/locale'

type FoodMapProvider = 'amap' | 'google' | 'naver'

type FoodMapLink = {
  href: string
  provider: FoodMapProvider
}

const FOOD_MAP_PROVIDER = {
  [Locale.KO]: 'naver',
  [Locale.EN]: 'google',
  [Locale.JA]: 'google',
  [Locale.ZH]: 'amap',
} as const satisfies Record<Locale, FoodMapProvider>

export function buildFoodMapLink(locale: Locale, foodName: string): FoodMapLink {
  const provider = FOOD_MAP_PROVIDER[locale]
  const query = foodName.trim()

  switch (provider) {
    case 'naver':
      return {
        provider,
        href: `https://map.naver.com/p/search/${encodeURIComponent(query)}`,
      }
    case 'amap': {
      const url = new URL('https://uri.amap.com/search')
      url.searchParams.set('keyword', query)
      url.searchParams.set('view', 'list')
      url.searchParams.set('src', 'stella.sobok.cc')
      url.searchParams.set('callnative', '1')

      return { provider, href: url.toString() }
    }
    case 'google': {
      const url = new URL('https://www.google.com/maps/search/')
      url.searchParams.set('api', '1')
      url.searchParams.set('query', query)

      return { provider, href: url.toString() }
    }
  }
}
