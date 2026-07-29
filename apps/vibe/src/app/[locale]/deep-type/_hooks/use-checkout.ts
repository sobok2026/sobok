'use client'

import { PAY_METHOD_SPEC, type PayMethod } from '@deep-type/pay-method'
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

type BypassContext = { email: string; locale: FreeResult['locale'] }
type Bypass = Parameters<typeof import('@portone/browser-sdk/v2').requestPayment>[0]['bypass']

// Per-method PG options, and the extension point every new channel lands on. `bypass` is keyed by pgProvider,
// so what goes in it is decided by the CHANNEL a method rides — handing `tosspayments` options to a
// `tosspay_v2` key would put one PG's parameters on another's window.
//
// A table rather than a conditional because the requirement is per-PG and not uniform: the wallets take
// nothing, the card channel needs one option for foreign issuers, and KCP demands `shop_user_id` for 휴대폰
// 소액결제 and not for 계좌이체 on the very same channel. A branch cannot absorb that; a row can.
const BYPASS: Record<PayMethod, (context: BypassContext) => Bypass> = {
  // 해외 발급 카드는 전용 창으로만 승인된다. 국내 결제에 실으면 국내 카드가 막히므로 로케일로 가른다.
  card: ({ locale }) => (locale === 'ko' ? undefined : { tosspayments: { useInternationalCardOnly: true } }),
  kakaopay: () => undefined,
  // KCP requires `shop_user_id` on 휴대폰 소액결제 — it is the identity its carrier-fraud checks are keyed by,
  // so it has to be stable per buyer rather than per payment. This product has no accounts, and the e-mail is
  // the only thing a buyer brings back across sittings; the PG receives it as `customer.email` regardless.
  mobile: ({ email }) => ({ kcp_v2: { shop_user_id: email } }),
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

  async function start(email: string, turnstileToken: string, payMethod: PayMethod): Promise<string | null> {
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
        payMethod,
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
        bypass: BYPASS[payMethod]({ email, locale: freeResult.locale }),
        channelKey: checkout.channelKey,
        currency: 'CURRENCY_KRW',
        customer: { email },
        forceRedirect: true,
        orderName: checkout.orderName,
        paymentId: checkout.paymentId,
        payMethod: PAY_METHOD_SPEC[payMethod].sdkPayMethod,
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
