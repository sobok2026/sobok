import { type PortOneChannel, payMethodsFor, sellableChannels } from '@deep-type/pay-method'
import { LOCALES } from '@sobok/domain/locale'
import { Hono } from 'hono'

import type { AppEnv } from '~/env'

const route = new Hono<AppEnv>()

// Deploy smoke check, not a client dependency: nothing in the browser ever calls this — the paywall's menu is
// baked into the static bundle, and `/checkout` is what hands out the key a payment is actually opened with.
// It exists because the menu being fixed in SOURCE does not make the deployed Worker match the source: `vars`
// are non-inheritable, hand-restated per wrangler environment, and a block `env.stg` forgot or a mistyped
// channel name is observable only in the running deployment. One curl after a deploy, per DEPLOY.md.
//
// `unbound` and `unsold` name the two directions the scoped channel map and `sellableChannels(profile)` can drift, so
// neither has to be spotted by comparing lists by eye. `payMethods` is the menu each locale's picker will
// actually render — the check that no locale was left with nothing to pay with.
//
// Channel NAMES only, never the key values. The values are public in the narrow sense — `/checkout` sends the
// approved one to any buyer's browser — but this check has no use for them: a wrong-but-present key is
// indistinguishable from a right one until a real payment runs, so echoing them here would only hand the full
// contract list to anyone who asks, one per sale instead.
route.get('/', async (c) => {
  const bound = (await c.env.PAYMENTS.availableChannels()) as PortOneChannel[]
  const sellable = sellableChannels(c.env.DEEPTYPE_PAY_PROFILE)
  const firstConfig = bound[0] ? await c.env.PAYMENTS.checkoutConfig(bound[0]) : null

  return c.json({
    payProfile: c.env.DEEPTYPE_PAY_PROFILE,
    // The narration destination-switch. null = engine-only reports — visible here because an env block that
    // forgot to restate the var turns narration off with no other symptom.
    reportModel: c.env.DEEPTYPE_REPORT_MODEL || null,
    storeId: firstConfig?.storeId ?? null,
    channels: bound,
    // Offered on the paywall, unpayable here: every entry is a method that reaches `/checkout` and 500s.
    unbound: sellable.filter((channel) => !bound.includes(channel)),
    // A key we hold and never spend. Harmless — nothing asks for it — but it means an approval landed and
    // `SELLABLE_CHANNELS` was not told, so a method we are paying for is still hidden.
    unsold: bound.filter((channel) => !sellable.includes(channel)),
    payMethods: Object.fromEntries(
      LOCALES.map((locale) => [locale, payMethodsFor(locale, c.env.DEEPTYPE_PAY_PROFILE)]),
    ),
  })
})

export default route
