import { PaymentClient, Webhook } from '@portone/server-sdk'
import { GetPaymentError, isUnrecognizedPayment, type PaymentMethod } from '@portone/server-sdk/payment'

export interface PortOnePaymentCredentials {
  apiSecret: string
  storeId: string
}

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

/**
 * Reads PortOne's current payment aggregate. Browser responses and webhook payload fields never reach the
 * entitlement transaction; they provide only the payment id used for this server-authenticated lookup.
 */
export async function getGuardianRemotePayment(
  credentials: PortOnePaymentCredentials,
  paymentId: string,
): Promise<GuardianRemotePayment> {
  let payment: Awaited<ReturnType<ReturnType<typeof PaymentClient>['getPayment']>>
  try {
    payment = await PaymentClient({ secret: credentials.apiSecret, storeId: credentials.storeId }).getPayment({
      paymentId,
      storeId: credentials.storeId,
    })
  } catch (error) {
    if (error instanceof GetPaymentError && error.data.type === 'PAYMENT_NOT_FOUND') {
      return { status: 'missing', paymentId }
    }
    throw error
  }

  if (isUnrecognizedPayment(payment)) {
    return { status: 'unknown', paymentId }
  }
  if (payment.id !== paymentId || payment.storeId !== credentials.storeId) {
    throw new Error('PortOne returned a payment outside the requested Stella order boundary')
  }

  switch (payment.status) {
    case 'PAID':
      return {
        status: 'paid',
        paymentId,
        amount: payment.amount.total,
        currency: payment.currency,
        providerTxnId: payment.pgTxId ?? null,
        method: normalizeMethod(payment.method),
        paidAt: requiredDate(payment.paidAt),
      }
    case 'FAILED':
      return {
        status: 'failed',
        paymentId,
        failedAt: requiredDate(payment.failedAt),
        failureCode: payment.failure.pgCode ?? null,
        failureMessage: payment.failure.pgMessage ?? payment.failure.reason ?? null,
      }
    case 'CANCELLED':
    case 'PARTIAL_CANCELLED':
      return { status: 'refunded', paymentId, refundedAt: requiredDate(payment.cancelledAt) }
    case 'READY':
    case 'PAY_PENDING':
    case 'VIRTUAL_ACCOUNT_ISSUED':
      return { status: 'pending', paymentId }
  }
}

export interface PortOneWebhookHeaders {
  'webhook-id': string
  'webhook-signature': string
  'webhook-timestamp': string
}

export interface GuardianPortOneWebhookEvent {
  eventType: 'Transaction.Paid' | 'Transaction.Failed' | 'Transaction.Cancelled' | 'Transaction.PartialCancelled'
  paymentId: string
  storeId: string
}

/** Verifies the unparsed Standard Webhooks payload and projects only payment events Stella reconciles. */
export async function verifyGuardianPortOneWebhook(
  webhookSecret: string,
  rawBody: string,
  headers: PortOneWebhookHeaders,
): Promise<GuardianPortOneWebhookEvent | null> {
  const webhook = await Webhook.verify(webhookSecret, rawBody, headers)
  if (Webhook.isUnrecognizedWebhook(webhook)) {
    return null
  }

  switch (webhook.type) {
    case 'Transaction.Paid':
    case 'Transaction.Failed':
    case 'Transaction.Cancelled':
    case 'Transaction.PartialCancelled':
      return {
        eventType: webhook.type,
        paymentId: webhook.data.paymentId,
        storeId: webhook.data.storeId,
      }
    default:
      return null
  }
}

function normalizeMethod(method: PaymentMethod | undefined): string | null {
  if (!method || typeof method.type !== 'string') {
    return null
  }
  const kind = method.type.replace(/^PaymentMethod/, '')
  return kind ? kind.charAt(0).toLowerCase() + kind.slice(1) : null
}

function requiredDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('PortOne returned an invalid payment timestamp')
  }
  return date
}
