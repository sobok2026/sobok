import { PaymentClient, Webhook } from '@portone/server-sdk'

// Dedicated deeptype PortOne adapter. Deliberately NOT @sobok/billing: that package reads process.env at
// module load and closes over sobok's (chat-subscription) store secrets, so it can neither run on Workers
// nor point at the separate deeptype store. Here every call takes injected per-request creds from c.env.
// The underlying @portone/server-sdk is runtime-agnostic (fetch + WebCrypto), so it runs on Workers as-is.
export interface PortOneCreds {
  apiSecret: string
  webhookSecret: string
}

export type RemotePaymentStatus = 'paid' | 'failed' | 'canceled' | 'pending' | 'unknown'

export interface RemotePayment {
  status: RemotePaymentStatus
  amount: number | null
  currency: string | null
  providerTxnId: string | null
  method: string | null
  paidAt: Date | null
  receiptUrl: string | null
}

// Server-authoritative read of the PG's truth. The grant decision compares amount AND currency AND status
// from HERE against the local pending purchase — never the client-supplied amount.
export async function getRemotePayment(creds: PortOneCreds, paymentId: string): Promise<RemotePayment> {
  const payment = (await PaymentClient({ secret: creds.apiSecret }).getPayment({ paymentId })) as {
    status?: string
    pgTxId?: string
    paidAt?: string
    amount?: { total?: number }
    currency?: string
    method?: { type?: string }
    receiptUrl?: string
  }

  return {
    status: normalizeStatus(payment.status),
    amount: payment.amount?.total ?? null,
    currency: payment.currency ?? null,
    providerTxnId: payment.pgTxId ?? null,
    method: normalizeMethod(payment.method?.type),
    paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
    receiptUrl: payment.receiptUrl ?? null,
  }
}

// Full cancellation (청약철회). Reconciled via getRemotePayment by the caller — throwing on an
// already-cancelled payment is fine; the reconcile path converges to the real state.
export async function cancelPayment(creds: PortOneCreds, input: { paymentId: string; reason: string }): Promise<void> {
  await PaymentClient({ secret: creds.apiSecret }).cancelPayment({
    paymentId: input.paymentId,
    reason: input.reason,
    requester: 'Customer',
  })
}

export interface WebhookHeaders {
  'webhook-id': string
  'webhook-signature': string
  'webhook-timestamp': string
}

export type DeeptypeWebhookEvent = { type: 'paid' | 'refunded'; paymentId: string } | null

// Verify against the RAW body (caller passes await c.req.text() BEFORE any parse). Standard Webhooks HMAC
// with a ±5min replay window baked into the SDK. Returns null for events we don't act on.
export async function verifyWebhook(
  creds: PortOneCreds,
  rawBody: string,
  headers: WebhookHeaders,
): Promise<DeeptypeWebhookEvent> {
  const webhook = await Webhook.verify(creds.webhookSecret, rawBody, headers)

  switch (webhook.type) {
    case 'Transaction.Paid':
      return { type: 'paid', paymentId: webhook.data.paymentId }
    case 'Transaction.Cancelled':
    case 'Transaction.PartialCancelled':
      return { type: 'refunded', paymentId: webhook.data.paymentId }
    default:
      return null
  }
}

// Report is granted ONLY on 'paid'. VIRTUAL_ACCOUNT_ISSUED maps to 'pending' (deposit not yet received),
// so 무통장/가상계좌 never hands over the report before the money lands.
function normalizeStatus(status: string | undefined): RemotePaymentStatus {
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

function normalizeMethod(type: string | undefined): string | null {
  const kind = type?.replace(/^(BillingKey)?PaymentMethod/, '')
  if (!kind) {
    return null
  }
  return kind.charAt(0).toLowerCase() + kind.slice(1)
}
