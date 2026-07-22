'use client'

import { useState } from 'react'

import { postCheckout, postSession, postVerify, type SessionInput } from '../_lib/api'
import { clearPendingCheckout, storePendingCheckout } from '../_lib/pending-checkout'

export type CheckoutStatus = 'idle' | 'processing' | 'error'
export type FreeResult = SessionInput

export function useCheckout(freeResult: FreeResult) {
  const [status, setStatus] = useState<CheckoutStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function start(email: string, turnstileToken: string): Promise<string | null> {
    setStatus('processing')
    setErrorMessage('')
    try {
      const { resultToken } = await postSession(freeResult)
      const checkout = await postCheckout({
        ageConfirmed: true,
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
    } catch {
      setStatus('error')
      return null
    }
  }

  return { errorMessage, start, status }
}
