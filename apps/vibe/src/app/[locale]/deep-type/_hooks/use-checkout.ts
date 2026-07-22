'use client'

import { useState } from 'react'

import { postCheckout, postSession, postVerify, type SessionInput } from '../_lib/api'

export type CheckoutStatus = 'idle' | 'processing' | 'error'

export type FreeResult = Pick<SessionInput, 'persona' | 'innerType' | 'gem'> & {
  locale: SessionInput['locale']
}

// Drives the guest one-time checkout: persist the free result → create a pending purchase → PortOne
// browser payment → server-side verify. Returns the report access_token on success, null otherwise. The
// paywall UI is responsible for the consent gate; by the time start() runs, both consents are given.
export function useCheckout(freeResult: FreeResult) {
  const [status, setStatus] = useState<CheckoutStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function start(email: string, turnstileToken: string): Promise<string | null> {
    setStatus('processing')
    setErrorMessage('')
    try {
      const { resultToken } = await postSession(freeResult)
      const checkout = await postCheckout({
        consentPrivacy: true,
        consentWithdrawal: true,
        email,
        resultToken,
        sku: 'report',
        turnstileToken,
      })

      // Lazy chunk: the ~82KB PortOne browser loader is only needed on the checkout path, not the free-quiz
      // hot path most users take — so it stays a dynamic import (code-split), not a static one.
      const { requestPayment } = await import('@portone/browser-sdk/v2')
      const result = await requestPayment({
        channelKey: checkout.channelKey,
        currency: 'CURRENCY_KRW',
        customer: { email },
        orderName: checkout.orderName,
        paymentId: checkout.paymentId,
        payMethod: 'CARD',
        storeId: checkout.storeId,
        totalAmount: checkout.amount,
      })

      // PortOne returns a truthy `code` only on failure/cancel.
      if (result?.code != null) {
        setStatus('idle')
        setErrorMessage(result.message ?? '')
        return null
      }

      const verified = await postVerify(checkout.paymentId)
      if (verified.status !== 'paid') {
        setStatus('error')
        return null
      }

      setStatus('idle')
      return checkout.accessToken
    } catch {
      setStatus('error')
      return null
    }
  }

  return { errorMessage, start, status }
}
