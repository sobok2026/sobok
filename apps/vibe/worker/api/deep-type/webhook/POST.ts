import { Hono } from 'hono'
import { verifyWebhook } from '~/billing/portone'
import { openFresh, withDb } from '~/db/client'
import { recordWebhookEvent } from '~/db/queries/webhook'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { alertDiscord } from '~/lib/alert'
import { applyRefund, confirmPurchase } from '~/payments/confirm'

import { creds } from '../creds'

const route = new Hono<AppEnv>()

// PortOne Standard-Webhooks endpoint. RAW body is verified BEFORE any parse; processing is idempotent, so
// at-least-once delivery + races with /verify are safe. Always ack 200 once the signature is valid (even on
// amount-mismatch) so PortOne stops retrying; the mismatch is left pending for reconcile/review.
route.post('/', async (c) => {
  const raw = await c.req.text()

  const headers = {
    'webhook-id': c.req.header('webhook-id') ?? '',
    'webhook-signature': c.req.header('webhook-signature') ?? '',
    'webhook-timestamp': c.req.header('webhook-timestamp') ?? '',
  }

  const portOneCreds = await creds(c)
  const event = await verifyWebhook(portOneCreds, raw, headers).catch(() => undefined)

  if (event === undefined) {
    return problem(400, 'invalid-signature')
  }

  if (!event) {
    return c.json({ ok: true })
  }

  const acted = event

  return withDb(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, async (db) => {
    if (acted.type === 'paid') {
      const outcome = await confirmPurchase(db, portOneCreds, acted.paymentId)

      if (outcome === 'amount-mismatch') {
        console.error('deeptype.webhook.amount_mismatch', acted.paymentId)
        c.executionCtx.waitUntil(
          c.env.DEEPTYPE_DISCORD_WEBHOOK.get().then((url) =>
            alertDiscord(url, '⚠️ deeptype amount mismatch; inspect the restricted Worker logs'),
          ),
        )
      }
    } else {
      await applyRefund(db, acted.paymentId)
    }

    await recordWebhookEvent(db, { eventId: headers['webhook-id'], type: acted.type, payload: raw })
    return c.json({ ok: true })
  })
})

export default route
