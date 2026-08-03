'use client'

// Every app writes to the one queue the GTM container drains. `@next/third-parties`' `sendGTMEvent` is these
// same three lines plus a module-global data-layer name that nothing here ever sets, so the package earns no
// place in the dependency tree — Next's own docs say using it "is not required".
//
// Creating the array when missing keeps events safe before the container finishes loading; GTM drains
// whatever is already queued. There is deliberately no environment gate: development loads the container too
// (see GtmLoader), and gating here would leave GTM Preview with nothing to preview.

type AnalyticsObject = {
  readonly [key: string]: AnalyticsPrimitive | undefined
}

type AnalyticsPrimitive = boolean | number | string | null

export type AnalyticsValue = AnalyticsPrimitive | Date | readonly (AnalyticsObject | AnalyticsPrimitive)[]

export type AnalyticsParams = Record<string, AnalyticsValue | undefined>

export type EcommerceItem = {
  readonly discount?: number
  readonly item_category?: string
  readonly item_id: string
  readonly item_name: string
  readonly price: number
  readonly quantity: number
}

export type Ecommerce = {
  readonly creative_name?: string
  readonly creative_slot?: string
  readonly currency?: string
  readonly items: readonly EcommerceItem[]
  readonly promotion_id?: string
  readonly promotion_name?: string
  /**
   * Required on `purchase`. GA4 deduplicates purchases by this id, which is what makes the event safe to fire
   * from a screen a buyer can reload — pass the payment's own id, never a generated one.
   */
  readonly transaction_id?: string
  readonly value?: number
}

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export function push(payload: Record<string, unknown>): void {
  window.dataLayer ??= []
  window.dataLayer.push(payload)
}

export function track(event: string, params?: AnalyticsParams): void {
  push({ event, ...normalizeParams(params) })
}

export function identify(userId: number | string | null): void {
  push({ event: 'auth_identify', user_id: userId === null ? null : String(userId) })
}

// GA4 reads ecommerce from the `ecommerce` key of the SAME message that carries the event name. The preceding
// `ecommerce: null` is mandatory: the data layer merges recursively, so items from a previous push would
// otherwise bleed into this event.
export function trackEcommerce(event: string, ecommerce: Ecommerce, params?: AnalyticsParams): void {
  push({ ecommerce: null })
  push({ event, ecommerce, ...normalizeParams(params) })
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
