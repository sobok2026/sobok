'use client'

import { PAY_METHOD_SPEC, type PayMethod } from '@deep-type/pay-method'
import type { LoadPaymentUIRequest } from '@portone/browser-sdk/v2'
import { readGaIdentity } from '@sobok/analytics/ga-identity'
import { useState } from 'react'

import { GA4_MEASUREMENT_ID } from '@/constants'

import { postCheckout, postSession, postVerify, type SessionInput } from '../_lib/api'
import { clearPendingCheckout, type SettledPayment, storePendingCheckout } from '../_lib/pending-checkout'
import type { DeepTypePaywallContent } from '../_lib/types'
import { classifyApiError, type VerificationErrorKind } from '../_lib/verification-error'

// `paypal` is the two-step SPB leg: `/checkout` has approved a payment and PayPal's own button — the only
// control that can open its window — is on screen waiting to be pressed. Everything else matches the window
// methods: `processing` spans our round-trips, `error` is terminal for the attempt.
export type CheckoutStatus = 'idle' | 'processing' | 'paypal' | 'error'
export type FreeResult = SessionInput

/**
 * A `/checkout`-approved PayPal payment, holding exactly what `loadPaymentUI` and the finish leg need.
 *
 * `payment` carries the whole settled shape rather than the token and id alone: the finish leg hands it
 * straight on to the screens that confirm the purchase, and reading the amount back out of the SDK request
 * would be reading our own figures out of a third party's object.
 */
export type PaypalSession = { payment: SettledPayment; request: LoadPaymentUIRequest }

type PaywallErrorKey = 'errorGeneric' | 'errorUnavailable' | 'errorVerificationExpired' | 'errorVerificationFailed'

type Bypass = Parameters<typeof import('@portone/browser-sdk/v2').requestPayment>[0]['bypass']

// Per-method PG options, and the extension point every new channel lands on. `bypass` is keyed by pgProvider,
// so what goes in it is decided by the CHANNEL a method rides — handing `tosspayments` options to a
// `tosspay_v2` key would put one PG's parameters on another's window.
//
// A table rather than a conditional because the requirement is per-PG and not uniform: the wallets take
// nothing and KCP demands `shop_user_id` for 휴대폰 소액결제 and not for 계좌이체 on the very same channel. A
// branch cannot absorb that; a row can. Window methods only — PayPal's `loadPaymentUI` takes its own bypass
// type and needs nothing from us.
const BYPASS: Record<PayMethod, (email: string) => Bypass> = {
  card: () => undefined,
  kakaopay: () => undefined,
  // KCP requires `shop_user_id` on 휴대폰 소액결제 — it is the identity its carrier-fraud checks are keyed by,
  // so it has to be stable per buyer rather than per payment. This product has no accounts, and the e-mail is
  // the only thing a buyer brings back across sittings; the PG receives it as `customer.email` regardless.
  mobile: (email) => ({ kcp_v2: { shop_user_id: email } }),
  paypal: () => undefined,
  tosspay: () => undefined,
  // Same KCP channel, no bypass: `shop_user_id` is optional here and the cash-receipt toggle (`disp_tax_yn`)
  // needs a KCP-side agreement we have not made, so KCP's own default is the honest choice.
  transfer: () => undefined,
}

const MESSAGE_KEY_BY_KIND: Record<VerificationErrorKind, PaywallErrorKey> = {
  expired: 'errorVerificationExpired',
  generic: 'errorGeneric',
  rejected: 'errorVerificationFailed',
  unavailable: 'errorUnavailable',
}

export function useCheckout(freeResult: FreeResult, paywall: DeepTypePaywallContent) {
  const [status, setStatus] = useState<CheckoutStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [paypal, setPaypal] = useState<PaypalSession | null>(null)

  /**
   * Runs the shared leg — session, server-approved checkout, pending marker — then finishes by method shape.
   * A `'window'` method resolves the whole payment here and returns the access token. A `'ui'` method returns
   * null with `status === 'paypal'`: the payment is approved but only PayPal's button can open it, so the
   * paywall mounts that button and completion arrives through `finishPaypal`.
   */
  async function start(email: string, turnstileToken: string, payMethod: PayMethod): Promise<SettledPayment | null> {
    setStatus('processing')
    setErrorMessage('')
    try {
      const { resultToken } = await postSession(freeResult)

      const checkout = await postCheckout({
        ageConfirmed: true,
        // Captured here, on the last screen the buyer is guaranteed to see: the grant that emits `purchase` may
        // run in the PortOne webhook or scheduled reconciliation, long after this browser is gone.
        analytics: readGaIdentity(GA4_MEASUREMENT_ID),
        consentPrivacy: true,
        consentWithdrawal: true,
        email,
        payMethod,
        resultToken,
        sku: 'report',
        turnstileToken,
      })

      // The server-approved figures, not the offer table's: what the confirmation screens print has to be
      // what was actually charged, and only `/checkout`'s answer knows that.
      const payment: SettledPayment = {
        accessToken: checkout.accessToken,
        amount: checkout.amount,
        currency: checkout.currency,
        email,
        paymentId: checkout.paymentId,
      }

      storePendingCheckout({ ...payment, createdAt: Date.now() })

      const spec = PAY_METHOD_SPEC[payMethod]

      if (spec.open === 'ui') {
        setPaypal({
          payment,
          request: {
            channelKey: checkout.channelKey,
            currency: checkout.currency,
            customer: { email },
            orderName: checkout.orderName,
            paymentId: checkout.paymentId,
            storeId: checkout.storeId,
            totalAmount: checkout.amount,
            uiType: spec.uiType,
          },
        })
        setStatus('paypal')
        return null
      }

      const { requestPayment } = await import('@portone/browser-sdk/v2')

      const result = await requestPayment({
        bypass: BYPASS[payMethod](email),
        channelKey: checkout.channelKey,
        currency: checkout.currency,
        customer: { email },
        forceRedirect: true,
        orderName: checkout.orderName,
        paymentId: checkout.paymentId,
        payMethod: spec.sdkPayMethod,
        redirectUrl: `${window.location.origin}/${freeResult.locale}/deep-type/checkout-return`,
        storeId: checkout.storeId,
        totalAmount: checkout.amount,
      })

      if (result?.code != null) {
        clearPendingCheckout()
        setStatus('idle')
        setErrorMessage(result.message ?? '')
        return null
      }

      return await verifyAndFinish(payment)
    } catch (error) {
      // A Turnstile refusal is the one failure the buyer can act on, and the paywall resets the widget right
      // after this returns — so saying "expired, confirm once more" is advice that actually completes a sale.
      setStatus('error')
      setErrorMessage(paywall[MESSAGE_KEY_BY_KIND[classifyApiError(error)]])
      return null
    }
  }

  /** PayPal reported approval — converge with the server exactly like a window method's return. */
  async function finishPaypal(): Promise<SettledPayment | null> {
    if (!paypal) {
      return null
    }

    try {
      const settled = await verifyAndFinish(paypal.payment)
      if (settled) {
        setPaypal(null)
      }
      return settled
    } catch (error) {
      setStatus('error')
      setErrorMessage(paywall[MESSAGE_KEY_BY_KIND[classifyApiError(error)]])
      return null
    }
  }

  /**
   * PayPal window closed or declined. Not terminal: the SPB button is still mounted and pressable, so keep the
   * session and surface the message — the buyer decides whether to try again or step back.
   */
  function failPaypal(message: string) {
    setErrorMessage(message || paywall.errorGeneric)
  }

  /** Back out of the two-step leg. Scheduled reconcile/purge handles the pending row like any closed window. */
  function cancelPaypal() {
    clearPendingCheckout()
    setPaypal(null)
    setStatus('idle')
    setErrorMessage('')
  }

  async function verifyAndFinish(payment: SettledPayment): Promise<SettledPayment | null> {
    const verified = await postVerify(payment.paymentId)

    if (verified.status !== 'paid') {
      setStatus('error')
      return null
    }

    clearPendingCheckout()
    setStatus('idle')
    return payment
  }

  return { cancelPaypal, errorMessage, failPaypal, finishPaypal, paypal, start, status }
}
