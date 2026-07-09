import { type GETV1SearchTrendingResponse, getV1SearchTrendingQuerySchema, TrendingType } from '@sobok/contracts'
import { createCacheControl } from '@sobok/http/cache-control'
import { sec } from '@sobok/std'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { trendingKeywordsService } from '@/services/TrendingKeywordsService'
import { zProblemValidator } from '@/utils/validator'

const trendingRoutes = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('query', getV1SearchTrendingQuerySchema))

trendingRoutes.get('/', ...middlewares, async (c) => {
  const { limit, type } = c.req.valid('query')

  const { keywords = [], cacheMaxAge } = {
    [TrendingType.DAILY]: {
      cacheMaxAge: sec('1 day'),
    },
    [TrendingType.HOURLY]: {
      keywords: await trendingKeywordsService.getTrendingHourly(limit),
      cacheMaxAge: sec('2 minutes'),
    },
    [TrendingType.WEEKLY]: {
      cacheMaxAge: sec('1 week'),
    },
  }[type]

  const response = {
    // 만화 카탈로그(@sobok/catalog) 번역이 제거되어 키워드를 원문 그대로 노출한다.
    keywords: keywords.map(({ keyword }) => ({
      value: keyword,
      label: formatPlainText(keyword),
    })),
    updatedAt: new Date(),
  } satisfies GETV1SearchTrendingResponse

  const cacheControl =
    response.keywords.length > 0
      ? createCacheControl({
          public: true,
          maxAge: 3,
          sMaxAge: cacheMaxAge,
          swr: Math.floor(cacheMaxAge / 2),
        })
      : createCacheControl({
          public: true,
          maxAge: 1,
          sMaxAge: 10,
          swr: 0,
        })

  return c.json(response, { headers: { 'Cache-Control': cacheControl } })
})

function formatPlainText(text: string): string {
  return text.replaceAll('_', ' ')
}

export default trendingRoutes
