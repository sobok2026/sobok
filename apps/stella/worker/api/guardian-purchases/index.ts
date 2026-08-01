import { alertDiscord } from '@sobok/edge/alert'
import { openDb, withDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { guardianPortOnePaymentCredentials } from '~/billing/credentials'
import { type GuardianRemotePayment, getGuardianRemotePayment } from '~/billing/portone'
import { resolveGuardianPurchaseAccess } from '~/db/queries/guardian'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { GuardianAccessTokenSchema, GuardianPaymentIdSchema } from '~/guardian/http'
import { syncGuardianPayment } from '~/guardian/payment'
import { NO_STORE_HEADERS } from '~/lib/http'
import { bearerToken } from '~/lib/request'

export const guardianPurchases = new Hono<AppEnv>()

// POST /api/guardian-purchases/:paymentId/confirm — browser-return reconciliation, authorized by ownership.
guardianPurchases.post('/:paymentId/confirm', async (c) => {
  const paymentId = GuardianPaymentIdSchema.safeParse(c.req.param('paymentId'))
  const token = GuardianAccessTokenSchema.safeParse(bearerToken(c))
  if (!paymentId.success || !token.success) {
    return problem(403, 'forbidden')
  }

  const accessTokenHash = await sha256Hex(token.data)
  const access = await withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, (db) =>
    resolveGuardianPurchaseAccess(db, { accessTokenHash, paymentId: paymentId.data }),
  )
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
    const credentials = await guardianPortOnePaymentCredentials(c.env)
    remotePayment = await getGuardianRemotePayment(credentials, paymentId.data)
  } catch (error) {
    console.error('stella.portone.confirm_lookup_failed', error instanceof Error ? error.name : 'non-Error thrown')
    return problem(503, 'service-unavailable', { headers: { 'retry-after': '5' } })
  }

  if (remotePayment.status === 'unknown') {
    console.error('stella.portone.confirm_unknown_status')
  }
  const outcome = await withDb(openDb(c.env.HYPERDRIVE), c.executionCtx, (db) => syncGuardianPayment(db, remotePayment))

  if (outcome.status === 'pending') {
    return c.json({ status: 'pending', reportPublicId: access.reportPublicId }, 202, NO_STORE_HEADERS)
  }
  if (outcome.status === 'granted' || outcome.status === 'already-granted') {
    return c.json(
      {
        status: 'paid',
        grant: outcome.status,
        kind: outcome.kind,
        reportPublicId: outcome.reportPublicId,
        ...('questionnaireVersion' in outcome ? { questionnaireVersion: outcome.questionnaireVersion } : {}),
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
