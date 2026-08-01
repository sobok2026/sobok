import { BILLING_CURRENCY, BILLING_TEST_AMOUNT, type POSTV1BillingTestPaymentResponse } from '@sobok/contracts'
import { createPendingPayment } from '@sobok/db/app/query/payment'
import { newPaymentId } from '@sobok/payments'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { payments } from '@/payments'
import { problemResponse } from '@/utils/problem'

const ORDER_NAME = 'sobok 결제 테스트'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth)

route.post('/test-payments', ...middlewares, async (c) => {
  const config = await payments?.checkoutConfig('tosspayments').catch((error) => {
    console.error('billing: checkout config failed', error)
    return null
  })
  if (!config) {
    return problemResponse(c, { status: 503 })
  }

  const userId = c.get('user')!.id
  const paymentId = newPaymentId('core')

  try {
    await createPendingPayment({
      paymentId,
      userId,
      orderName: ORDER_NAME,
      amount: BILLING_TEST_AMOUNT,
    })
  } catch (error) {
    console.error('billing: createPendingPayment failed', error)
    return problemResponse(c, { status: 500 })
  }

  return c.json({
    paymentId,
    storeId: config.storeId,
    channelKey: config.channelKey,
    orderName: ORDER_NAME,
    amount: BILLING_TEST_AMOUNT,
    currency: BILLING_CURRENCY,
  } satisfies POSTV1BillingTestPaymentResponse)
})

export default route
