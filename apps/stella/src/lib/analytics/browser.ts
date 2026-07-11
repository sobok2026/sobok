'use client'

import { sendGTMEvent } from '@next/third-parties/google'

import { ORIGIN } from '@/constants'

export type AnalyticsParams = Record<string, AnalyticsValue | undefined>

type AnalyticsObject = {
  readonly [key: string]: AnalyticsPrimitive | undefined
}

type AnalyticsPrimitive = boolean | number | string | null
type AnalyticsValue = AnalyticsPrimitive | Date | readonly (AnalyticsObject | AnalyticsPrimitive)[]

const PRODUCTION_HOSTNAME = new URL(ORIGIN).hostname

export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === PRODUCTION_HOSTNAME
}

export function track(eventName: string, params?: AnalyticsParams) {
  if (!isAnalyticsEnabled()) {
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
