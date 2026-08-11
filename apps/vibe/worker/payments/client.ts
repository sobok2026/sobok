import type { RemotePayment } from '@sobok/payments'

import type { Bindings } from '../env'

export interface DeepTypeRemotePayment {
  status: 'paid' | 'failed' | 'canceled' | 'pending' | 'not_found' | 'unknown'
  amount: number | null
  currency: string | null
  providerTxnId: string | null
  method: string | null
  paidAt: Date | null
  receiptUrl: string | null
}

export async function getRemotePayment(env: Bindings, paymentId: string): Promise<DeepTypeRemotePayment> {
  return toDeepTypeRemotePayment(await env.VIBE_PAYMENTS.getPayment(paymentId))
}

export function toDeepTypeRemotePayment(payment: RemotePayment): DeepTypeRemotePayment {
  return {
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    providerTxnId: payment.providerTxnId,
    method: payment.method,
    paidAt: payment.paidAt ? requiredDate(payment.paidAt) : null,
    receiptUrl: payment.receiptUrl,
  }
}

export function cancelPayment(env: Bindings, input: { paymentId: string; reason: string }): Promise<void> {
  return env.VIBE_PAYMENTS.cancelPayment(input)
}

function requiredDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Payments service returned an invalid timestamp')
  }
  return date
}
