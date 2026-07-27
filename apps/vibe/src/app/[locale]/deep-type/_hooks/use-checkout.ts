'use client'

import { readGAIdentity } from '@sobok/analytics/ga-identity'
import { useState } from 'react'

import { GA4_MEASUREMENT_ID } from '@/constants'

import { postCheckout, postSession, postVerify, type SessionInput } from '../_lib/api'
import { clearPendingCheckout, storePendingCheckout } from '../_lib/pending-checkout'
import type { DeepTypePaywallContent } from '../_lib/types'
import { classifyApiError, type VerificationErrorKind } from '../_lib/verification-error'

export type CheckoutStatus = 'idle' | 'processing' | 'error'
export type FreeResult = SessionInput

type PaywallErrorKey = 'errorGeneric' | 'errorUnavailable' | 'errorVerificationExpired' | 'errorVerificationFailed'

const MESSAGE_KEY_BY_KIND: Record<VerificationErrorKind, PaywallErrorKey> = {
  expired: 'errorVerificationExpired',
  generic: 'errorGeneric',
  rejected: 'errorVerificationFailed',
  unavailable: 'errorUnavailable',
}

export function useCheckout(freeResult: FreeResult, paywall: DeepTypePaywallContent) {
  const [status, setStatus] = useState<CheckoutStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function start(email: string, turnstileToken: string): Promise<string | null> {
    setStatus('processing')
    setErrorMessage('')
    try {
      const { resultToken } = await postSession(freeResult)

      const checkout = await postCheckout({
        ageConfirmed: true,
        // Captured here, on the last screen the buyer is guaranteed to see: the grant that emits `purchase` may
        // run in the PortOne webhook or the reconcile cron, long after this browser is gone.
        analytics: readGAIdentity(GA4_MEASUREMENT_ID),
        consentPrivacy: true,
        consentWithdrawal: true,
        email,
        resultToken,
        sku: 'report',
        turnstileToken,
      })

      storePendingCheckout({
        accessToken: checkout.accessToken,
        createdAt: Date.now(),
        paymentId: checkout.paymentId,
      })

      const { requestPayment } = await import('@portone/browser-sdk/v2')

      const result = await requestPayment({
        bypass: freeResult.locale === 'ko' ? undefined : { tosspayments: { useInternationalCardOnly: true } },
        channelKey: checkout.channelKey,
        currency: 'CURRENCY_KRW',
        customer: { email },
        forceRedirect: true,
        orderName: checkout.orderName,
        paymentId: checkout.paymentId,
        payMethod: 'CARD',
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

      const verified = await postVerify(checkout.paymentId)

      if (verified.status !== 'paid') {
        setStatus('error')
        return null
      }

      clearPendingCheckout()
      setStatus('idle')
      return checkout.accessToken
    } catch (error) {
      // A Turnstile refusal is the one failure the buyer can act on, and the paywall resets the widget right
      // after this returns — so saying "expired, confirm once more" is advice that actually completes a sale.
      setStatus('error')
      setErrorMessage(paywall[MESSAGE_KEY_BY_KIND[classifyApiError(error)]])
      return null
    }
  }

  return { errorMessage, start, status }
}
