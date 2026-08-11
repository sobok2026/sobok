import type { RemotePayment } from '@sobok/payments'

import type { Bindings } from '../env'

export type GuardianRemotePayment =
  | {
      status: 'paid'
      paymentId: string
      amount: number
      currency: string
      providerTxnId: string | null
      method: string | null
      paidAt: Date
    }
  | {
      status: 'failed'
      paymentId: string
      failedAt: Date
      failureCode: string | null
      failureMessage: string | null
    }
  | { status: 'refunded'; paymentId: string; refundedAt: Date }
  | { status: 'pending' | 'missing' | 'unknown'; paymentId: string }

export async function getGuardianRemotePayment(env: Bindings, paymentId: string): Promise<GuardianRemotePayment> {
  return toGuardianRemotePayment(await env.STELLA_PAYMENTS.getPayment(paymentId))
}

export function toGuardianRemotePayment(payment: RemotePayment): GuardianRemotePayment {
  switch (payment.status) {
    case 'paid':
      if (payment.amount === null || payment.currency === null || payment.paidAt === null) {
        return { status: 'unknown', paymentId: payment.paymentId }
      }
      return {
        status: 'paid',
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        providerTxnId: payment.providerTxnId,
        method: payment.method,
        paidAt: requiredDate(payment.paidAt),
      }
    case 'failed':
      if (payment.failedAt === null) {
        return { status: 'unknown', paymentId: payment.paymentId }
      }
      return {
        status: 'failed',
        paymentId: payment.paymentId,
        failedAt: requiredDate(payment.failedAt),
        failureCode: payment.failureCode,
        failureMessage: payment.failureMessage,
      }
    case 'canceled': {
      const refundedAt = payment.canceledAt ?? payment.refunds.at(-1)?.refundedAt
      return refundedAt
        ? { status: 'refunded', paymentId: payment.paymentId, refundedAt: requiredDate(refundedAt) }
        : { status: 'unknown', paymentId: payment.paymentId }
    }
    case 'pending':
      return { status: 'pending', paymentId: payment.paymentId }
    case 'not_found':
      return { status: 'missing', paymentId: payment.paymentId }
    case 'unknown':
      return { status: 'unknown', paymentId: payment.paymentId }
  }
}

function requiredDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Payments service returned an invalid timestamp')
  }
  return date
}
