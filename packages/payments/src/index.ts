import { z } from 'zod'

export const PAYMENT_SCOPES = ['core', 'stella', 'vibe'] as const
export type PaymentScope = (typeof PAYMENT_SCOPES)[number]

export const PAYMENT_ID_PREFIX = {
  core: 'sb_',
  stella: 'st_',
  vibe: 'dt_',
} as const satisfies Record<PaymentScope, string>

export function newPaymentId(scope: PaymentScope): string {
  return `${PAYMENT_ID_PREFIX[scope]}${crypto.randomUUID()}`
}

export function paymentScopeOf(paymentId: string): PaymentScope | null {
  for (const scope of PAYMENT_SCOPES) {
    if (paymentId.startsWith(PAYMENT_ID_PREFIX[scope])) {
      return scope
    }
  }
  return null
}

export interface CheckoutConfig {
  channelKey: string
  storeId: string
}

export const RemoteRefundSchema = z.object({
  providerRefundId: z.string(),
  amount: z.number(),
  reason: z.string().nullable(),
  refundedAt: z.iso.datetime(),
})

export type RemoteRefund = z.infer<typeof RemoteRefundSchema>

export const RemotePaymentSchema = z.object({
  paymentId: z.string(),
  storeId: z.string().nullable(),
  status: z.enum(['paid', 'failed', 'canceled', 'pending', 'not_found', 'unknown']),
  providerTxnId: z.string().nullable(),
  paidAt: z.iso.datetime().nullable(),
  failedAt: z.iso.datetime().nullable(),
  canceledAt: z.iso.datetime().nullable(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  method: z.string().nullable(),
  receiptUrl: z.string().nullable(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  refunds: z.array(RemoteRefundSchema),
})

export type RemotePayment = z.infer<typeof RemotePaymentSchema>

export const PAYMENT_TRANSACTION_EVENT_TYPES = [
  'Transaction.Paid',
  'Transaction.Failed',
  'Transaction.Cancelled',
  'Transaction.PartialCancelled',
] as const

export const PaymentEventSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('transaction'),
    eventId: z.string().min(1).max(128),
    eventType: z.enum(PAYMENT_TRANSACTION_EVENT_TYPES),
    payment: RemotePaymentSchema,
  }),
  z.object({
    kind: z.literal('billing-key-deleted'),
    eventId: z.string().min(1).max(128),
    eventType: z.literal('BillingKey.Deleted'),
    billingKey: z.string().min(1).max(256),
  }),
])

export type PaymentEvent = z.infer<typeof PaymentEventSchema>

export interface BillingKeyBrief {
  method: string | null
  brand: string | null
  cardLast4: string | null
}

export interface ChargeInput {
  paymentId: string
  billingKey: string
  orderName: string
  amount: number
  currency: string
}

export interface ChargeResult {
  providerTxnId: string
  paidAt: string
}

/** Cloudflare Service Binding surface exposed separately to Stella and Vibe. */
export interface ScopedPaymentsService {
  availableChannels(): Promise<string[]>
  checkoutConfig(channel: string): Promise<CheckoutConfig | null>
  getPayment(paymentId: string): Promise<RemotePayment>
  cancelPayment(input: { paymentId: string; reason: string }): Promise<void>
}

export interface BillingGateway {
  checkoutConfig(channel: string): Promise<CheckoutConfig | null>
  inspectBillingKey(billingKey: string): Promise<BillingKeyBrief>
  revokeBillingKey(billingKey: string): Promise<void>
  charge(input: ChargeInput): Promise<ChargeResult>
  cancelPayment(input: { paymentId: string; reason: string }): Promise<void>
  getPayment(paymentId: string): Promise<RemotePayment>
}

export class PaymentsServiceError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'PaymentsServiceError'
    this.status = status
  }
}

export function createPaymentsClient(input: { baseUrl: string; token: string }): BillingGateway {
  const baseUrl = input.baseUrl.replace(/\/$/, '')

  async function request(path: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${input.token}`,
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    })

    if (!response.ok) {
      const detail = await response
        .json()
        .then((body) => (body as { error?: string }).error)
        .catch(() => undefined)
      throw new PaymentsServiceError(detail ?? `Payments service returned ${response.status}`, response.status)
    }

    if (response.status === 204) {
      return null
    }
    return response.json()
  }

  return {
    async checkoutConfig(channel) {
      const value = await request(`/v1/core/checkout-config?channel=${encodeURIComponent(channel)}`)
      return z.object({ storeId: z.string(), channelKey: z.string() }).nullable().parse(value)
    },
    async inspectBillingKey(billingKey) {
      const value = await request('/v1/core/billing-keys/inspect', {
        method: 'POST',
        body: JSON.stringify({ billingKey }),
      })
      return z
        .object({ method: z.string().nullable(), brand: z.string().nullable(), cardLast4: z.string().nullable() })
        .parse(value)
    },
    async revokeBillingKey(billingKey) {
      await request('/v1/core/billing-keys/revoke', {
        method: 'POST',
        body: JSON.stringify({ billingKey }),
      })
    },
    async charge(charge) {
      const value = await request('/v1/core/payments/charge', {
        method: 'POST',
        body: JSON.stringify(charge),
      })
      return z.object({ providerTxnId: z.string(), paidAt: z.iso.datetime() }).parse(value)
    },
    async cancelPayment(cancel) {
      await request(`/v1/core/payments/${encodeURIComponent(cancel.paymentId)}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancel.reason }),
      })
    },
    async getPayment(paymentId) {
      const value = await request(`/v1/core/payments/${encodeURIComponent(paymentId)}`)
      return RemotePaymentSchema.parse(value)
    },
  }
}

export interface ChargeFailure {
  code: string | null
  message: string
}

export function describeChargeFailure(cause: unknown): ChargeFailure {
  if (cause instanceof Error) {
    return {
      code: cause.name.slice(0, 64),
      message: cause.message.slice(0, 256),
    }
  }

  return {
    code: null,
    message: String(cause).slice(0, 256),
  }
}
