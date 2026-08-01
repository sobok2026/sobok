import type { GETV1PaymentMethodsResponse } from '@sobok/contracts'
import { listActivePaymentMethods } from '@sobok/db/app/query/payment-method'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { payments } from '@/payments'
import { noStoreCacheControl } from '@/utils/cache-control'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

route.get('/', ...middlewares, async (c) => {
  const userId = c.get('user')!.id
  const [methods, config] = await Promise.all([
    listActivePaymentMethods(userId),
    payments?.checkoutConfig('tosspayments').catch((error) => {
      console.error('billing: checkout config failed', error)
      return null
    }) ?? null,
  ])

  const response = {
    ...(config ? { storeId: config.storeId, channelKey: config.channelKey } : {}),
    paymentMethods: methods.map((method) => ({
      id: method.id,
      brand: method.brand,
      cardLast4: method.cardLast4,
      createdAt: method.createdAt.toISOString(),
    })),
  } satisfies GETV1PaymentMethodsResponse

  return c.json(response, { headers: { 'Cache-Control': noStoreCacheControl } })
})

export default route
