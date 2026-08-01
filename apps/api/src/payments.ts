import { createPaymentsClient } from '@sobok/payments'

import { env } from './env'

export const payments =
  env.PAYMENTS_SERVICE_URL && env.PAYMENTS_SERVICE_TOKEN
    ? createPaymentsClient({ baseUrl: env.PAYMENTS_SERVICE_URL, token: env.PAYMENTS_SERVICE_TOKEN })
    : null

export function isPaymentsConfigured(): boolean {
  return payments !== null
}

export function isPaymentsServiceRequest(authorization: string | undefined): boolean {
  return Boolean(env.PAYMENTS_EVENT_TOKEN && authorization === `Bearer ${env.PAYMENTS_EVENT_TOKEN}`)
}
