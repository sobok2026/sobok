'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { env } from '@/env/client'

export type AnalyticsParams = Record<string, AnalyticsValue | undefined>

type AnalyticsObject = {
  readonly [key: string]: AnalyticsPrimitive | undefined
}

type AnalyticsPrimitive = boolean | number | string | null
type AnalyticsValue = AnalyticsPrimitive | Date | readonly (AnalyticsObject | AnalyticsPrimitive)[]

const { NEXT_PUBLIC_GTM_ID } = env

export function track(eventName: string, params?: AnalyticsParams) {
  if (!NEXT_PUBLIC_GTM_ID) {
    return
  }

  sendGTMEvent({
    event: eventName,
    ...normalizeParams(params),
  })
}

function normalizeParams(params?: AnalyticsParams): Record<string, unknown> | undefined {
  if (!params) {
    return
  }

  let normalizedParams: Record<string, unknown> | undefined

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue
    }

    normalizedParams ??= {}

    if (value instanceof Date) {
      normalizedParams[key] = value.toISOString()
      continue
    }

    normalizedParams[key] = value
  }

  return normalizedParams
}
