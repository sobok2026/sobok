// Server-side GA4 delivery for the one event the browser must not own: `purchase`.
//
// The buyer's tab is gone or unreliable at the moment money is confirmed — PortOne redirects, the webhook can
// beat the redirect, and scheduled reconciliation grants purchases hours later with no browser at all. The grant is
// a compare-and-swap in Postgres, so exactly one caller ever wins it, which makes it the only place a purchase
// can be counted exactly once. Everything else in the funnel stays client-side, where it keeps full session
// and attribution context.
//
// Hand-written on purpose: Google publishes no Measurement Protocol client library in any language, and the
// server-to-server API it now steers new integrations toward (Data Manager) ships only a gRPC/`google-gax`
// SDK that cannot run on workerd. A raw POST is the only thing that executes in this runtime.
const ENDPOINT = 'https://www.google-analytics.com/mp/collect'

// Under the default `RELAXED` timestamp policy GA4 clamps anything older than 72 hours to the boundary rather
// than dropping it; only `ENFORCE_RECOMMENDATIONS` rejects. Omitting the stamp entirely past that window is
// still the better trade — a purchase recorded at the wrong time beats a purchase silently pinned to a day
// that falls outside every report the revenue is compared against.
const MAX_BACKDATE_MS = 72 * 60 * 60 * 1000

export interface Ga4Credentials {
  apiSecret: string
  measurementId: string
}

export interface Ga4Item {
  discount?: number
  item_category?: string
  item_id: string
  item_name: string
  price: number
  quantity: number
}

export interface Ga4Purchase {
  clientId: string
  currency: string
  items: readonly Ga4Item[]
  occurredAt: Date
  sessionId: string | null
  transactionId: string
  value: number
}

// Returns whether GA4 accepted the hit. Never throws: a measurement failure must not roll back a payment that
// the PG has already settled.
export async function sendGa4Purchase(creds: Ga4Credentials, purchase: Ga4Purchase): Promise<boolean> {
  const backdated = Date.now() - purchase.occurredAt.getTime()

  if (backdated > MAX_BACKDATE_MS) {
    // The gap itself is the alarm: a first grant this late means scheduled reconciliation has failed for days.
    console.warn('deeptype.ga4.backdated', purchase.transactionId, backdated)
  }

  // No `consent` block and no `non_personalized_ads`. The Worker cannot observe the visitor's consent choice —
  // it is made in the browser, owned by the container's Consent Initialization trigger and updated by the CMP
  // afterwards — and there is no honest way to reconstruct it here. Omitting the field leaves GA4 applying
  // what it already knows for this client, which is both the defined behaviour and the defensible one.
  // (`non_personalized_ads` is deprecated in favour of `consent` and has no defined precedence alongside it.)
  const body = {
    client_id: purchase.clientId,
    events: [
      {
        name: 'purchase',
        params: {
          currency: purchase.currency,
          // A non-zero engagement time keeps GA4 from filing the hit as a non-engaged event, which would drop
          // it out of session-scoped reporting.
          engagement_time_msec: 1,
          items: purchase.items,
          ...(purchase.sessionId === null ? {} : { session_id: purchase.sessionId }),
          transaction_id: purchase.transactionId,
          value: purchase.value,
        },
      },
    ],
    // Documented as a number, not a string. Microseconds since epoch stay inside MAX_SAFE_INTEGER for
    // centuries, so there is no precision argument for sending it as text.
    ...(backdated <= MAX_BACKDATE_MS && { timestamp_micros: purchase.occurredAt.getTime() * 1000 }),
  }

  const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(creds.measurementId)}&api_secret=${encodeURIComponent(creds.apiSecret)}`

  try {
    // The Measurement Protocol answers 204 with no validation of its own; `/debug/mp/collect` is the endpoint
    // that reports schema errors, and DEPLOY.md's smoke test is where that check belongs.
    const response = await fetch(url, {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })

    if (!response.ok) {
      console.error('deeptype.ga4.rejected', purchase.transactionId, response.status)
      return false
    }

    return true
  } catch (error) {
    console.error('deeptype.ga4.error', purchase.transactionId, String(error))
    return false
  }
}
