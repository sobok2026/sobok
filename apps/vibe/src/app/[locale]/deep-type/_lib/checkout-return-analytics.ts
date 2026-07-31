'use client'

import { track } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'

import type { CheckoutFailure } from './checkout-outcome'

/**
 * The return screen's own funnel step.
 *
 * `purchase` is emitted server-side by `confirmPurchase`, so revenue is already counted without this. What
 * nothing counted was the gap between it and `begin_checkout`: a buyer who pays and then cannot reach the
 * report is invisible in GA4, because the money landed and the client-side funnel simply stops. This is the
 * screen where that happens, and until it reported, "how often" had no answer.
 *
 * One event with an `outcome` dimension rather than an event per state — the question is always the
 * distribution, and seven event names cannot be put on one chart.
 */
export type CheckoutReturnOutcome = CheckoutFailure | 'paid' | 'paidElsewhere'

export function trackCheckoutReturn(
  outcome: CheckoutReturnOutcome,
  locale: Locale,
  // How many verification attempts it took. A `paid` that needed two says the retry policy is earning its
  // keep; a `pending` that used all of them says the window is too short.
  attempts: number,
): void {
  track('deeptype_checkout_return', { attempts, locale, outcome })
}
