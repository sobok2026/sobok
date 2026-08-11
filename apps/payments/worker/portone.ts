import { BillingKeyClient, PaymentClient, Webhook } from '@portone/server-sdk'
import { GetPaymentError, isUnrecognizedPayment, type PaymentMethod } from '@portone/server-sdk/payment'
import type {
  BillingKeyBrief,
  ChargeInput,
  ChargeResult,
  PaymentEvent,
  PaymentScope,
  RemotePayment,
  RemoteRefund,
} from '@sobok/payments'

import type { Bindings } from './env'

async function apiClient(env: Bindings) {
  const secret = await env.PORTONE_API_SECRET.get()
  if (!secret || !env.PORTONE_STORE_ID) {
    throw new Error('PortOne API credentials are not configured')
  }
  return {
    billingKeys: BillingKeyClient({ secret, storeId: env.PORTONE_STORE_ID }),
    payments: PaymentClient({ secret, storeId: env.PORTONE_STORE_ID }),
  }
}

export function availableChannels(env: Bindings, scope: PaymentScope): string[] {
  return Object.entries(env.PORTONE_CHANNELS)
    .filter(([, config]) => config.scopes.includes(scope))
    .map(([channel]) => channel)
}

export function checkoutConfig(env: Bindings, scope: PaymentScope, channel: string) {
  const config = env.PORTONE_CHANNELS[channel]
  return config?.scopes.includes(scope) ? { storeId: env.PORTONE_STORE_ID, channelKey: config.channelKey } : null
}

export async function inspectBillingKey(env: Bindings, billingKey: string): Promise<BillingKeyBrief> {
  const { billingKeys } = await apiClient(env)
  const info = await billingKeys.getBillingKeyInfo({ billingKey })
  const methods = (info as { methods?: Array<{ type?: string; card?: { name?: string; number?: string } }> }).methods
  const method = normalizeMethod(methods?.[0]?.type)
  const card = methods?.find((entry) => entry.type === 'BillingKeyPaymentMethodCard')?.card

  return {
    method,
    brand: card?.name ?? (card ? 'card' : null),
    cardLast4: card?.number?.match(/(\d{4})\D*$/)?.[1] ?? null,
  }
}

export async function revokeBillingKey(env: Bindings, billingKey: string): Promise<void> {
  const { billingKeys } = await apiClient(env)
  await billingKeys.deleteBillingKey({ billingKey })
}

export async function chargePayment(env: Bindings, input: ChargeInput): Promise<ChargeResult> {
  const { payments } = await apiClient(env)
  const { payment } = await payments.payWithBillingKey({
    paymentId: input.paymentId,
    billingKey: input.billingKey,
    orderName: input.orderName,
    amount: { total: input.amount },
    currency: input.currency as 'KRW',
  })

  return { providerTxnId: payment.pgTxId, paidAt: requiredDate(payment.paidAt).toISOString() }
}

export async function cancelPayment(env: Bindings, input: { paymentId: string; reason: string }): Promise<void> {
  const { payments } = await apiClient(env)
  await payments.cancelPayment({ paymentId: input.paymentId, reason: input.reason, requester: 'Customer' })
}

export async function getPayment(env: Bindings, paymentId: string): Promise<RemotePayment> {
  const { payments } = await apiClient(env)
  let payment: Awaited<ReturnType<typeof payments.getPayment>>

  try {
    payment = await payments.getPayment({ paymentId, storeId: env.PORTONE_STORE_ID })
  } catch (error) {
    if (error instanceof GetPaymentError && error.data.type === 'PAYMENT_NOT_FOUND') {
      return emptyPayment(paymentId, 'not_found')
    }
    throw error
  }

  if (isUnrecognizedPayment(payment)) {
    return emptyPayment(paymentId, 'unknown')
  }
  if (payment.id !== paymentId || payment.storeId !== env.PORTONE_STORE_ID) {
    throw new Error('PortOne returned a payment outside the configured Store')
  }

  const raw = payment as typeof payment & {
    receiptUrl?: string
    cancellations?: Array<{
      status?: string
      id?: string
      totalAmount?: number
      reason?: string
      cancelledAt?: string
      requestedAt?: string
    }>
  }

  return {
    paymentId,
    storeId: payment.storeId,
    status: normalizeStatus(payment.status),
    providerTxnId: 'pgTxId' in payment ? (payment.pgTxId ?? null) : null,
    paidAt: 'paidAt' in payment ? optionalDate(payment.paidAt) : null,
    failedAt: 'failedAt' in payment ? optionalDate(payment.failedAt) : null,
    canceledAt: 'cancelledAt' in payment ? optionalDate(payment.cancelledAt) : null,
    amount: 'amount' in payment ? payment.amount.total : null,
    currency: 'currency' in payment ? payment.currency : null,
    method: 'method' in payment ? normalizePaymentMethod(payment.method) : null,
    receiptUrl: raw.receiptUrl ?? null,
    failureCode: 'failure' in payment ? (payment.failure.pgCode ?? null) : null,
    failureMessage: 'failure' in payment ? (payment.failure.pgMessage ?? payment.failure.reason ?? null) : null,
    refunds: extractRefunds(raw.cancellations),
  }
}

export interface WebhookHeaders {
  'webhook-id': string
  'webhook-signature': string
  'webhook-timestamp': string
}

export async function verifyWebhook(
  env: Bindings,
  rawBody: string,
  headers: WebhookHeaders,
): Promise<
  | { kind: 'transaction'; eventId: string; eventType: PaymentEvent['eventType']; paymentId: string; storeId: string }
  | { kind: 'billing-key-deleted'; eventId: string; eventType: 'BillingKey.Deleted'; billingKey: string }
  | null
> {
  const secret = await env.PORTONE_WEBHOOK_SECRET.get()
  if (!secret) {
    throw new Error('PortOne webhook secret is not configured')
  }

  const webhook = await Webhook.verify(secret, rawBody, headers)
  if (Webhook.isUnrecognizedWebhook(webhook)) {
    return null
  }

  switch (webhook.type) {
    case 'Transaction.Paid':
    case 'Transaction.Failed':
    case 'Transaction.Cancelled':
    case 'Transaction.PartialCancelled':
      return {
        kind: 'transaction',
        eventId: headers['webhook-id'],
        eventType: webhook.type,
        paymentId: webhook.data.paymentId,
        storeId: webhook.data.storeId,
      }
    case 'BillingKey.Deleted':
      return {
        kind: 'billing-key-deleted',
        eventId: headers['webhook-id'],
        eventType: webhook.type,
        billingKey: webhook.data.billingKey,
      }
    default:
      return null
  }
}

function emptyPayment(paymentId: string, status: 'not_found' | 'unknown'): RemotePayment {
  return {
    paymentId,
    storeId: null,
    status,
    providerTxnId: null,
    paidAt: null,
    failedAt: null,
    canceledAt: null,
    amount: null,
    currency: null,
    method: null,
    receiptUrl: null,
    failureCode: null,
    failureMessage: null,
    refunds: [],
  }
}

function normalizeStatus(status: string): RemotePayment['status'] {
  switch (status) {
    case 'PAID':
      return 'paid'
    case 'FAILED':
      return 'failed'
    case 'CANCELLED':
    case 'PARTIAL_CANCELLED':
      return 'canceled'
    case 'READY':
    case 'PAY_PENDING':
    case 'VIRTUAL_ACCOUNT_ISSUED':
      return 'pending'
    default:
      return 'unknown'
  }
}

function normalizePaymentMethod(method: PaymentMethod | undefined): string | null {
  return normalizeMethod(typeof method?.type === 'string' ? method.type : undefined)
}

function normalizeMethod(type: string | undefined): string | null {
  const kind = type?.replace(/^(BillingKey)?PaymentMethod/, '')
  return kind ? kind.charAt(0).toLowerCase() + kind.slice(1) : null
}

function extractRefunds(
  cancellations:
    | Array<{
        status?: string
        id?: string
        totalAmount?: number
        reason?: string
        cancelledAt?: string
        requestedAt?: string
      }>
    | undefined,
): RemoteRefund[] {
  return (cancellations ?? [])
    .filter((cancellation) => cancellation.status === 'SUCCEEDED')
    .map((cancellation) => {
      const at = cancellation.cancelledAt ?? cancellation.requestedAt
      if (!cancellation.id || cancellation.totalAmount === undefined || !at) {
        throw new Error('PortOne returned an incomplete successful cancellation')
      }
      return {
        providerRefundId: cancellation.id,
        amount: cancellation.totalAmount,
        reason: cancellation.reason?.slice(0, 256) ?? null,
        refundedAt: requiredDate(at).toISOString(),
      }
    })
    .sort((a, b) => a.refundedAt.localeCompare(b.refundedAt))
}

function optionalDate(value: string | undefined): string | null {
  return value ? requiredDate(value).toISOString() : null
}

function requiredDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('PortOne returned an invalid timestamp')
  }
  return date
}
