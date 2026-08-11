import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { withStellaSession } from '@stella-worker/auth'
import { resolveGuardianPurchaseAccess } from '@stella-worker/db/queries/guardian'
import type { AppEnv } from '@stella-worker/env'
import { problem } from '@stella-worker/errors'
import { GuardianAccessTokenSchema, GuardianPaymentIdSchema } from '@stella-worker/guardian/http'
import { syncGuardianPayment } from '@stella-worker/guardian/payment'
import { dispatchGuardianRecoveryEmails } from '@stella-worker/guardian/recovery'
import { NO_STORE_HEADERS } from '@stella-worker/lib/http'
import { bearerToken } from '@stella-worker/lib/request'
import { type GuardianRemotePayment, getGuardianRemotePayment } from '@stella-worker/payments/client'
import { Hono } from 'hono'

export const guardianPurchases = new Hono<AppEnv>()

// POST /api/guardian-purchases/:paymentId/confirm — browser-return reconciliation, authorized by ownership.
guardianPurchases.post('/:paymentId/confirm', async (c) => {
  const paymentId = GuardianPaymentIdSchema.safeParse(c.req.param('paymentId'))
  const token = GuardianAccessTokenSchema.safeParse(bearerToken(c))
  if (!paymentId.success) {
    return problem(403, 'forbidden')
  }

  const accessTokenHash = token.success ? await sha256Hex(token.data) : undefined
  const access = await withStellaSession(c, (db, session) => {
    if (!session && !accessTokenHash) return Promise.resolve(null)
    return resolveGuardianPurchaseAccess(db, {
      accessTokenHash,
      ownerUserId: session?.user.id,
      paymentId: paymentId.data,
    })
  })
  if (!access) {
    return problem(403, 'forbidden')
  }
  if (access.purchaseStatus === 'review_required') {
    return problem(409, 'payment-conflict')
  }
  if (
    access.purchaseStatus === 'failed' ||
    access.purchaseStatus === 'cancelled' ||
    access.purchaseStatus === 'refunded'
  ) {
    return c.json({ status: access.purchaseStatus, reportPublicId: access.reportPublicId }, 200, NO_STORE_HEADERS)
  }

  let remotePayment: GuardianRemotePayment
  try {
    remotePayment = await getGuardianRemotePayment(c.env, paymentId.data)
  } catch (error) {
    console.error('stella.portone.confirm_lookup_failed', error instanceof Error ? error.name : 'non-Error thrown')
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '5' } })
  }

  if (remotePayment.status === 'unknown') {
    console.error('stella.portone.confirm_unknown_status')
  }
  const outcome = await withDb(openDb(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    syncGuardianPayment(db, remotePayment),
  )

  if (outcome.status === 'pending') {
    return c.json({ status: 'pending', reportPublicId: access.reportPublicId }, 202, NO_STORE_HEADERS)
  }
  if (outcome.status === 'granted' || outcome.status === 'already-granted') {
    if (outcome.kind === 'full_report') {
      c.executionCtx.waitUntil(dispatchGuardianRecoveryEmails(c.env, { paymentId: paymentId.data }))
    }
    return c.json(
      {
        status: 'paid',
        grant: outcome.status,
        kind: outcome.kind,
        reportPublicId: outcome.reportPublicId,
        ...('credits' in outcome ? { credits: outcome.credits } : {}),
      },
      200,
      NO_STORE_HEADERS,
    )
  }
  if (outcome.status === 'failed' || outcome.status === 'cancelled' || outcome.status === 'refunded') {
    return c.json({ status: outcome.status, reportPublicId: outcome.reportPublicId }, 200, NO_STORE_HEADERS)
  }
  if (outcome.status === 'payment-mismatch') {
    console.error('stella.guardian_payment.review_required')
    c.executionCtx.waitUntil(
      c.env.STELLA_DISCORD_WEBHOOK.get().then((webhook) =>
        alertDiscord(webhook, '⚠️ stella guardian payment requires amount/currency review'),
      ),
    )
    return problem(409, 'payment-mismatch')
  }
  if (outcome.status === 'purchase-not-found') {
    return problem(403, 'forbidden')
  }
  return problem(409, 'payment-conflict')
})
